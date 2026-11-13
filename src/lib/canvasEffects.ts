import { TOKENS, TRAIL_COLORS } from '../data/works';
import { playBlip } from './audio';
import { layoutGlyphLines } from './bitmapFont';
import { easeAssemble, easeMorph, hashStr, makeRng, motion, state } from './runtime';

// 1. Stepped Cursor Pixel Trail
export function initTrailCanvas(): void {
  const canvas = document.getElementById('trail-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const step = isTouch ? 12 : 16;
  const drops: Array<{ gx: number; gy: number; color: string; born: number }> = [];
  let lastGX = -1;
  let lastGY = -1;
  let running = false;
  let cw = 0;
  let ch = 0;

  function resize() {
    cw = window.innerWidth;
    ch = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas!.width = Math.round(cw * dpr);
    canvas!.height = Math.round(ch * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function draw(now: number) {
    ctx!.clearRect(0, 0, cw, ch);
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      const age = now - d.born;
      if (age >= 500) {
        drops.splice(i, 1);
      } else {
        ctx!.globalAlpha = 1 - Math.floor((age / 500) * 6) / 6;
        ctx!.fillStyle = d.color;
        ctx!.fillRect(d.gx * step, d.gy * step, step, step);
      }
    }
    ctx!.globalAlpha = 1;
    if (drops.length === 0) {
      running = false;
      motion.remove(draw);
    }
  }

  function spawnAt(clientX: number, clientY: number) {
    if (!state.motionOn) return;
    const gx = Math.floor(clientX / step);
    const gy = Math.floor(clientY / step);
    if (gx === lastGX && gy === lastGY) return;
    lastGX = gx;
    lastGY = gy;
    drops.push({
      gx,
      gy,
      color: TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)],
      born: performance.now(),
    });
    if (drops.length > 36) drops.shift();
    if (!running) {
      running = true;
      motion.add(draw);
    }
  }

  window.addEventListener('pointermove', (e) => spawnAt(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointerdown', (e) => spawnAt(e.clientX, e.clientY), { passive: true });

  window.addEventListener('raster:motionchange', () => {
    if (!state.motionOn) {
      drops.length = 0;
      ctx!.clearRect(0, 0, cw, ch);
      running = false;
      motion.remove(draw);
    }
  });
}

// 2. Stepped Pixel Route Wipe
export function playPixelWipe(onSwitch: () => void): void {
  const wipeEl = document.getElementById('wipe-canvas') as HTMLCanvasElement | null;
  if (!state.motionOn || !wipeEl) {
    onSwitch();
    return;
  }
  const ctx = wipeEl.getContext('2d');
  if (!ctx) {
    onSwitch();
    return;
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  wipeEl.width = Math.round(w * dpr);
  wipeEl.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cell = w >= 768 ? 48 : 32;
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  const cells: Array<{ c: number; r: number }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) cells.push({ c, r });
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = cells[i];
    cells[i] = cells[j];
    cells[j] = tmp;
  }

  wipeEl.classList.add('is-active');
  let phase = 'in';
  let frame = 0;
  let switched = false;

  const timer = window.setInterval(() => {
    frame++;
    ctx.clearRect(0, 0, w, h);
    if (phase === 'in') {
      const count = Math.min(cells.length, Math.ceil((frame / 4) * cells.length));
      ctx.fillStyle = TOKENS.ink;
      for (let i = 0; i < count; i++) {
        ctx.fillRect(cells[i].c * cell, cells[i].r * cell, cell + 1, cell + 1);
      }
      if (frame >= 4) {
        if (!switched) {
          switched = true;
          onSwitch();
        }
        phase = 'out';
        frame = 0;
      }
    } else {
      const remaining = Math.max(0, cells.length - Math.ceil((frame / 4) * cells.length));
      ctx.fillStyle = TOKENS.ink;
      for (let i = 0; i < remaining; i++) {
        ctx.fillRect(cells[i].c * cell, cells[i].r * cell, cell + 1, cell + 1);
      }
      if (frame >= 4) {
        window.clearInterval(timer);
        ctx.clearRect(0, 0, w, h);
        wipeEl.classList.remove('is-active');
      }
    }
  }, 30);
}

// 3. Interactive Hero & Playground Particle Canvas
export interface HeroCycleItem {
  desktop: string;
  mobile: [string, string];
  caption: string;
}

export interface ParticleController {
  morphToWord: (word: string, caption?: string) => void;
  scatterBurst: () => void;
  nextCycle: () => void;
}

interface Particle {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  delay: number;
  color: string;
  sparkle: boolean;
}

export function initParticleCanvas(
  canvas: HTMLCanvasElement,
  captionEl: HTMLElement | null,
  cycles: HeroCycleItem[],
  opts?: { bgColor?: string; fgColor?: string; autoCycle?: boolean }
): ParticleController {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      morphToWord: () => {},
      scatterBurst: () => {},
      nextCycle: () => {},
    };
  }

  const bgColor = opts?.bgColor || TOKENS.sodium;
  const fgColor = opts?.fgColor || TOKENS.ink;
  const autoCycle = opts?.autoCycle !== false;

  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let isMobile = window.innerWidth < 768;
  let cycleIdx = 0;
  let customLines: string[] | null = null;
  let particles: Particle[] = [];
  let morphStart = 0;
  let morphDuration = 1100;
  let isAssembling = true;
  let holdTimer = 0;
  let inView = true;
  let running = false;
  let pointerX = -9999;
  let pointerY = -9999;

  function getTargetLayout(idx: number) {
    let lines: string[];
    if (customLines) {
      lines = customLines;
    } else {
      const item = cycles[idx % cycles.length];
      lines = isMobile ? item.mobile : [item.desktop];
    }
    const layout = layoutGlyphLines(lines, 2, true);
    const minCols = isMobile ? 31 : Math.max(41, layout.totalW + 2);
    const minRows = isMobile ? 20 : Math.max(9, layout.totalH);
    const xPad = Math.floor((minCols - layout.totalW) / 2);
    const yPad = Math.floor((minRows - layout.totalH) / 2);
    return {
      totalCols: minCols,
      totalRows: minRows,
      cells: layout.cells.map((c) => ({ x: c.x + Math.max(0, xPad), y: c.y + Math.max(0, yPad) })),
    };
  }

  function sizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    isMobile = window.innerWidth < 768;
    cssW = rect.width;
    cssH = rect.height;
    if (cssW <= 0 || cssH <= 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildParticlesForTarget(idx: number, assembleFromRandom: boolean, captionText?: string) {
    const t = getTargetLayout(idx);
    const rng = makeRng(hashStr('hero-' + idx + '-' + Date.now()));
    const newParticles: Particle[] = [];
    const targetCells = t.cells;
    const oldParticles = particles;

    if (assembleFromRandom || oldParticles.length === 0) {
      for (let i = 0; i < targetCells.length; i++) {
        const tc = targetCells[i];
        newParticles.push({
          sx: assembleFromRandom ? rng() * t.totalCols : tc.x,
          sy: assembleFromRandom ? rng() * t.totalRows : tc.y,
          tx: tc.x,
          ty: tc.y,
          x: tc.x,
          y: tc.y,
          vx: 0,
          vy: 0,
          delay: assembleFromRandom ? rng() * 380 : 0,
          color: fgColor,
          sparkle: false,
        });
      }
      isAssembling = assembleFromRandom;
      morphDuration = 1100;
    } else {
      const count = Math.max(oldParticles.length, targetCells.length);
      for (let i = 0; i < count; i++) {
        const src = oldParticles[i % oldParticles.length];
        const dst = targetCells[i % targetCells.length];
        const isSparkle = rng() < 0.16;
        newParticles.push({
          sx: src.x,
          sy: src.y,
          tx: dst.x,
          ty: dst.y,
          x: src.x,
          y: src.y,
          vx: 0,
          vy: 0,
          delay: (dst.x / t.totalCols) * 260,
          color: isSparkle ? TRAIL_COLORS[Math.floor(rng() * TRAIL_COLORS.length)] : fgColor,
          sparkle: isSparkle,
        });
      }
      isAssembling = false;
      morphDuration = 850;
    }
    particles = newParticles;
    morphStart = performance.now();
    if (captionEl) {
      captionEl.textContent = captionText ?? cycles[idx % cycles.length].caption;
    }
  }

  function drawStatic() {
    sizeCanvas();
    if (cssW <= 0) return;
    const t = getTargetLayout(cycleIdx);
    const cellW = cssW / t.totalCols;
    const cellH = Math.min(cellW / 1.25, cssH / t.totalRows);
    const offY = Math.max(0, (cssH - t.totalRows * cellH) / 2);
    ctx!.fillStyle = bgColor;
    ctx!.fillRect(0, 0, cssW, cssH);
    ctx!.fillStyle = fgColor;
    for (let i = 0; i < t.cells.length; i++) {
      const c = t.cells[i];
      const x0 = Math.round(c.x * cellW * dpr) / dpr;
      const y0 = Math.round((offY + c.y * cellH) * dpr) / dpr;
      const x1 = Math.round((c.x + 1) * cellW * dpr) / dpr;
      const y1 = Math.round((offY + (c.y + 1) * cellH) * dpr) / dpr;
      ctx!.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    if (captionEl && !customLines) {
      captionEl.textContent = cycles[cycleIdx % cycles.length].caption;
    }
  }

  function step(now: number) {
    if (!state.motionOn) {
      running = false;
      motion.remove(step);
      drawStatic();
      return;
    }
    if (cssW <= 0) sizeCanvas();
    if (cssW <= 0) return;

    const t = getTargetLayout(cycleIdx);
    const cellW = cssW / t.totalCols;
    const cellH = Math.min(cellW / 1.25, cssH / t.totalRows);
    const offY = Math.max(0, (cssH - t.totalRows * cellH) / 2);
    const elapsed = now - morphStart;
    const easeFn = isAssembling ? easeAssemble : easeMorph;
    const repelRadius = cellW * 4.2;
    const maxDisp = 2.4;

    ctx!.fillStyle = bgColor;
    ctx!.fillRect(0, 0, cssW, cssH);

    const buckets = new Map<string, Particle[]>();
    buckets.set(fgColor, []);
    let allSettled = pointerX < -5000;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const localT = Math.min(1, Math.max(0, (elapsed - p.delay) / morphDuration));
      const e = easeFn(localT);
      const baseX = p.sx + (p.tx - p.sx) * e;
      const baseY = p.sy + (p.ty - p.sy) * e;

      let targetDx = 0;
      let targetDy = 0;
      if (pointerX > -5000) {
        const px = (baseX + 0.5) * cellW;
        const py = offY + (baseY + 0.5) * cellH;
        const dx = px - pointerX;
        const dy = py - pointerY;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.001 && dist < repelRadius) {
          const factor = state.heroPhysics === 'attract' ? -0.85 : 1;
          const push = (1 - dist / repelRadius) * maxDisp * factor;
          targetDx = (dx / dist) * push;
          targetDy = (dy / dist) * push;
        }
      }

      const velocityActive = Math.abs(p.vx) > 0.005 || Math.abs(p.vy) > 0.005 || Math.abs(p.x - baseX) > 0.01 || Math.abs(p.y - baseY) > 0.01;
      if (localT >= 1 && pointerX < -5000 && !velocityActive) {
        p.vx = 0;
        p.vy = 0;
        p.x = p.tx;
        p.y = p.ty;
      } else {
        allSettled = false;
        p.vx = (p.vx + (targetDx - (p.x - baseX)) * 0.14) * 0.8;
        p.vy = (p.vy + (targetDy - (p.y - baseY)) * 0.14) * 0.8;
        p.x = baseX + (p.x - baseX) + p.vx;
        p.y = baseY + (p.y - baseY) + p.vy;
      }

      const isDisplaced = Math.hypot(p.x - baseX, p.y - baseY) > 0.45;
      const col = (p.sparkle && elapsed < 450) || isDisplaced ? (p.sparkle ? p.color : TRAIL_COLORS[i % TRAIL_COLORS.length]) : fgColor;
      if (!buckets.has(col)) buckets.set(col, []);
      buckets.get(col)!.push(p);
    }

    if (allSettled && elapsed >= 450) {
      ctx!.fillStyle = fgColor;
      const rowMap = new Map<number, number[]>();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!rowMap.has(p.ty)) rowMap.set(p.ty, []);
        rowMap.get(p.ty)!.push(p.tx);
      }
      rowMap.forEach((xs, y) => {
        xs.sort((a, b) => a - b);
        let start = xs[0];
        let prev = xs[0];
        const y0 = Math.round((offY + y * cellH) * dpr) / dpr;
        const y1 = Math.round((offY + (y + 1) * cellH) * dpr) / dpr;
        for (let k = 1; k <= xs.length; k++) {
          if (k < xs.length && (xs[k] === prev + 1 || xs[k] === prev)) {
            prev = xs[k];
          } else {
            const x0 = Math.round(start * cellW * dpr) / dpr;
            const x1 = Math.round((prev + 1) * cellW * dpr) / dpr;
            ctx!.fillRect(x0, y0, x1 - x0, y1 - y0);
            if (k < xs.length) {
              start = xs[k];
              prev = xs[k];
            }
          }
        }
      });
    } else {
      buckets.forEach((list, col) => {
        ctx!.fillStyle = col;
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          const x0 = Math.round(p.x * cellW * dpr) / dpr;
          const y0 = Math.round((offY + p.y * cellH) * dpr) / dpr;
          const x1 = Math.round((p.x + 1) * cellW * dpr) / dpr;
          const y1 = Math.round((offY + (p.y + 1) * cellH) * dpr) / dpr;
          ctx!.fillRect(x0, y0, x1 - x0, y1 - y0);
        }
      });
    }
  }

  function scheduleNext() {
    window.clearTimeout(holdTimer);
    if (!autoCycle || customLines || !state.motionOn || !inView) return;
    holdTimer = window.setTimeout(() => {
      if (!autoCycle || customLines || !state.motionOn || !inView || document.hidden) return;
      cycleIdx = (cycleIdx + 1) % cycles.length;
      buildParticlesForTarget(cycleIdx, false);
      scheduleNext();
    }, 3400 + morphDuration);
  }

  function startLoop() {
    if (!state.motionOn) {
      drawStatic();
      return;
    }
    if (!running) {
      running = true;
      motion.add(step);
    }
    scheduleNext();
  }

  function stopLoop() {
    window.clearTimeout(holdTimer);
    if (running) {
      running = false;
      motion.remove(step);
    }
  }

  sizeCanvas();
  if (state.motionOn) {
    buildParticlesForTarget(0, true);
    startLoop();
  } else {
    drawStatic();
  }

  const scatterBurst = () => {
    playBlip(440, 0.06, 'square');
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const ang = Math.random() * Math.PI * 2;
      const spd = 0.6 + Math.random() * 1.8;
      p.vx += Math.cos(ang) * spd;
      p.vy += Math.sin(ang) * spd;
    }
  };

  canvas.addEventListener('click', () => {
    if (!state.motionOn) return;
    playBlip(620, 0.05, 'square');
    if (state.heroPhysics === 'burst') {
      scatterBurst();
    } else {
      customLines = null;
      cycleIdx = (cycleIdx + 1) % cycles.length;
      buildParticlesForTarget(cycleIdx, false);
      scheduleNext();
    }
  });

  canvas.addEventListener(
    'pointermove',
    (e) => {
      const r = canvas.getBoundingClientRect();
      pointerX = e.clientX - r.left;
      pointerY = e.clientY - r.top;
    },
    { passive: true }
  );
  canvas.addEventListener('pointerleave', () => {
    pointerX = -9999;
    pointerY = -9999;
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        inView = entry.intersectionRatio >= 0.1;
        if (inView && state.motionOn) startLoop();
        else stopLoop();
      }
    },
    { threshold: [0, 0.1] }
  );
  io.observe(canvas);

  let rTimer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(rTimer);
    rTimer = window.setTimeout(() => {
      const wasMob = isMobile;
      sizeCanvas();
      if (!state.motionOn) drawStatic();
      else if (wasMob !== isMobile) buildParticlesForTarget(cycleIdx, false);
    }, 150);
  });
  ro.observe(canvas);

  const onMotionChange = () => {
    if (state.motionOn) {
      buildParticlesForTarget(cycleIdx, true);
      startLoop();
    } else {
      stopLoop();
      drawStatic();
    }
  };
  window.addEventListener('raster:motionchange', onMotionChange);

  state.routeCleanup.push(() => {
    stopLoop();
    io.disconnect();
    ro.disconnect();
    window.clearTimeout(rTimer);
    window.removeEventListener('raster:motionchange', onMotionChange);
  });

  return {
    morphToWord(word: string, captionText?: string) {
      const cleaned = word.trim().toUpperCase().slice(0, 9) || 'RYO/610';
      customLines = [cleaned];
      if (!state.motionOn) {
        drawStatic();
        if (captionEl && captionText) captionEl.textContent = captionText;
      } else {
        buildParticlesForTarget(0, false, captionText || `(${cleaned})`);
      }
    },
    scatterBurst,
    nextCycle() {
      customLines = null;
      cycleIdx = (cycleIdx + 1) % cycles.length;
      if (!state.motionOn) drawStatic();
      else {
        buildParticlesForTarget(cycleIdx, false);
        scheduleNext();
      }
    },
  };
}
