import { TOKENS, WorkItem } from '../data/works';
import { hashStr, makeRng, motion, state } from './runtime';

const PALETTES_BY_TRACK: Record<string, [string, string, string, string]> = {
  research: ['#D873B3', '#2370E8', '#0A0A0A', '#FFFFFF'],
  ai: ['#2370E8', '#22C98A', '#0A0A0A', '#FFFFFF'],
  creative: ['#A98BF7', '#FF5A5A', '#0A0A0A', '#FFFFFF'],
  systems: ['#2BA676', '#F1E58A', '#0A0A0A', '#FFFFFF'],
};

const ALT_PALETTES: Array<[string, string, string, string]> = [
  ['#F3ACF0', '#2370E8', '#0A0A0A', '#FFFFFF'],
  ['#2BA676', '#2370E8', '#0A0A0A', '#FFFFFF'],
  ['#F1E58A', '#FF5A5A', '#0A0A0A', '#FFFFFF'],
  ['#A98BF7', '#22C98A', '#0A0A0A', '#FFFFFF'],
];

function createEmptyGrid(): number[][] {
  return Array.from({ length: 32 }, () => Array(32).fill(0));
}

function setPx(grid: number[][], x: number, y: number, val: number): void {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix >= 0 && ix < 32 && iy >= 0 && iy < 32) {
    grid[iy][ix] = val;
  }
}

function fillRect(grid: number[][], x0: number, y0: number, w: number, h: number, val: number): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPx(grid, x, y, val);
    }
  }
}

function strokeRect(grid: number[][], x0: number, y0: number, w: number, h: number, val: number): void {
  for (let x = x0; x < x0 + w; x++) {
    setPx(grid, x, y0, val);
    setPx(grid, x, y0 + h - 1, val);
  }
  for (let y = y0; y < y0 + h; y++) {
    setPx(grid, x0, y, val);
    setPx(grid, x0 + w - 1, y, val);
  }
}

function drawCircle(grid: number[][], cx: number, cy: number, r: number, val: number, filled = true): void {
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (filled ? d <= r : Math.abs(d - r) < 0.7) {
        grid[y][x] = val;
      }
    }
  }
}

export function generateWorkSprite(work: WorkItem): {
  pal: [string, string, string, string];
  rows: string[];
} {
  const grid = createEmptyGrid();
  const rng = makeRng(hashStr(work.id));
  const pal = PALETTES_BY_TRACK[work.track] || ALT_PALETTES[Math.floor(rng() * ALT_PALETTES.length)];

  // Subtle background pixel grid texture
  for (let y = 2; y < 30; y += 4) {
    for (let x = 2; x < 30; x += 4) {
      if (rng() < 0.35) setPx(grid, x, y, 1);
    }
  }

  switch (work.id) {
    case 'researchphantom': {
      // Stylized Phantom visor / mask + signal bars
      fillRect(grid, 6, 9, 20, 14, 2);
      fillRect(grid, 4, 11, 24, 8, 2);
      // Asymmetric sharp mask eye slits
      fillRect(grid, 7, 13, 7, 3, 3);
      fillRect(grid, 18, 12, 7, 4, 3);
      fillRect(grid, 14, 15, 4, 2, 1);
      // Top star/beacon
      fillRect(grid, 15, 4, 2, 4, 3);
      fillRect(grid, 13, 5, 6, 2, 1);
      // Terminal lines below
      fillRect(grid, 6, 25, 12, 2, 3);
      fillRect(grid, 20, 25, 6, 2, 1);
      break;
    }
    case 'phantom-warp': {
      // Concentric warp tunnel + 88 mph star streaks
      drawCircle(grid, 16, 16, 12, 2, false);
      drawCircle(grid, 16, 16, 9, 1, false);
      drawCircle(grid, 16, 16, 6, 3, false);
      drawCircle(grid, 16, 16, 3, 2, true);
      setPx(grid, 16, 16, 3);
      // Speed streaks
      for (let i = 0; i < 6; i++) {
        const y = 5 + i * 4;
        fillRect(grid, 2 + (i % 3) * 2, y, 5, 1, 3);
        fillRect(grid, 24 - (i % 2) * 2, y + 1, 5, 1, 3);
      }
      break;
    }
    case 'neon-mythos-city':
    case 'agent-arcade':
    case 'neon-mythos-os':
    case 'kusama':
    case 'agent-clickhouse': {
      // Isometric / skyline city towers + autonomous agent sprite
      fillRect(grid, 4, 14, 5, 14, 2);
      fillRect(grid, 10, 8, 6, 20, 2);
      fillRect(grid, 17, 11, 5, 17, 2);
      fillRect(grid, 23, 6, 5, 22, 2);
      // Lit windows
      for (let y = 10; y < 25; y += 3) {
        setPx(grid, 12, y, 3);
        setPx(grid, 14, y, 1);
        setPx(grid, 25, y - 2, 3);
        setPx(grid, 19, y + 2, 1);
      }
      // Agent bot walking in foreground
      fillRect(grid, 5, 22, 6, 5, 1);
      setPx(grid, 6, 24, 3);
      setPx(grid, 9, 24, 3);
      fillRect(grid, 6, 27, 2, 2, 2);
      fillRect(grid, 8, 27, 2, 2, 2);
      // Antenna
      fillRect(grid, 13, 4, 1, 4, 3);
      setPx(grid, 13, 3, 1);
      break;
    }
    case 'hen': {
      // Experience Capsule + Human key emblem
      strokeRect(grid, 7, 5, 18, 22, 2);
      fillRect(grid, 8, 6, 16, 20, 1);
      drawCircle(grid, 16, 13, 4, 2, true);
      drawCircle(grid, 16, 13, 2, 3, true);
      fillRect(grid, 11, 19, 10, 5, 2);
      fillRect(grid, 14, 20, 4, 3, 3);
      break;
    }
    case 'researchphantom-daily': {
      // Audio waveform + 6-language broadcast rings
      const heights = [4, 8, 14, 20, 12, 22, 16, 10, 18, 12, 6];
      heights.forEach((h, idx) => {
        const x = 5 + idx * 2;
        const y0 = Math.floor(16 - h / 2);
        fillRect(grid, x, y0, 1, h, idx % 2 === 0 ? 2 : 3);
      });
      fillRect(grid, 4, 4, 6, 2, 1);
      fillRect(grid, 22, 26, 6, 2, 1);
      break;
    }
    case 'researchphantom-studio':
    case 'researchphantom-lp': {
      // Open book pages with geometric folio blocks
      fillRect(grid, 4, 7, 11, 18, 3);
      fillRect(grid, 17, 7, 11, 18, 3);
      strokeRect(grid, 4, 7, 11, 18, 2);
      strokeRect(grid, 17, 7, 11, 18, 2);
      fillRect(grid, 15, 8, 2, 17, 2);
      // Text & figure lines
      fillRect(grid, 6, 10, 7, 4, 1);
      fillRect(grid, 6, 16, 7, 1, 2);
      fillRect(grid, 6, 19, 5, 1, 2);
      fillRect(grid, 19, 10, 7, 2, 2);
      fillRect(grid, 19, 14, 7, 5, 1);
      fillRect(grid, 19, 21, 6, 1, 2);
      break;
    }
    case 'ascii-atelier': {
      // Pixel terminal window with retro ASCII face & cursor
      strokeRect(grid, 4, 5, 24, 22, 2);
      fillRect(grid, 4, 5, 24, 4, 2);
      setPx(grid, 6, 7, 3);
      setPx(grid, 8, 7, 1);
      fillRect(grid, 5, 9, 22, 17, 2);
      // Smiley / sprite inside terminal
      fillRect(grid, 10, 13, 2, 3, 3);
      fillRect(grid, 20, 13, 2, 3, 3);
      fillRect(grid, 11, 19, 10, 2, 1);
      fillRect(grid, 9, 17, 2, 2, 1);
      fillRect(grid, 21, 17, 2, 2, 1);
      fillRect(grid, 23, 23, 2, 2, 3);
      break;
    }
    case 'tokoyo': {
      // Torii gate silhouette under glowing moon
      drawCircle(grid, 16, 11, 5, 3, true);
      fillRect(grid, 5, 12, 22, 2, 2);
      fillRect(grid, 7, 16, 18, 2, 2);
      fillRect(grid, 9, 13, 3, 15, 2);
      fillRect(grid, 20, 13, 3, 15, 2);
      fillRect(grid, 15, 13, 2, 3, 2);
      fillRect(grid, 4, 27, 24, 2, 1);
      break;
    }
    case 'pocket-mine': {
      // Battery cell with scan laser line
      strokeRect(grid, 9, 7, 14, 20, 2);
      fillRect(grid, 13, 4, 6, 3, 2);
      fillRect(grid, 11, 10, 10, 5, 1);
      fillRect(grid, 11, 17, 10, 8, 3);
      // Scan beam across middle
      fillRect(grid, 4, 15, 24, 2, 2);
      fillRect(grid, 6, 15, 20, 1, 3);
      break;
    }
    case 'zawa-agent':
    case 'safe-mint': {
      // Shield + verification check
      fillRect(grid, 7, 6, 18, 11, 2);
      fillRect(grid, 9, 17, 14, 5, 2);
      fillRect(grid, 12, 22, 8, 4, 2);
      fillRect(grid, 14, 26, 4, 2, 2);
      // Inner shield highlight
      fillRect(grid, 9, 8, 14, 8, 1);
      // Checkmark
      fillRect(grid, 11, 14, 2, 3, 3);
      fillRect(grid, 13, 16, 2, 2, 3);
      fillRect(grid, 15, 14, 2, 2, 3);
      fillRect(grid, 17, 12, 2, 2, 3);
      fillRect(grid, 19, 10, 2, 2, 3);
      break;
    }
    default: {
      // Crisp symmetric pixel totem / bot emblem seeded by project id
      const sym = rng() > 0.35;
      for (let y = 6; y < 26; y += 2) {
        for (let x = 6; x < (sym ? 16 : 26); x += 2) {
          const distCenter = Math.hypot(x - 15, y - 15);
          const prob = distCenter < 9 ? 0.65 : 0.2;
          if (rng() < prob) {
            const c = rng() < 0.25 ? 3 : rng() < 0.6 ? 2 : 1;
            fillRect(grid, x, y, 2, 2, c);
            if (sym) {
              fillRect(grid, 30 - x, y, 2, 2, c);
            }
          }
        }
      }
      // Eye / core accents
      fillRect(grid, 11, 12, 3, 3, 3);
      fillRect(grid, 18, 12, 3, 3, 3);
      fillRect(grid, 12, 13, 1, 1, 2);
      fillRect(grid, 19, 13, 1, 1, 2);
      break;
    }
  }

  return {
    pal,
    rows: grid.map((row) => row.join('')),
  };
}

export interface PortraitController {
  setBlockSize: (newSize: number) => void;
}

export function initSpriteCanvas(
  canvas: HTMLCanvasElement,
  work: WorkItem,
  opts?: { blockSize?: number; skipAssemble?: boolean }
): PortraitController {
  const o = opts || {};
  const sprite = generateWorkSprite(work);
  const rows = sprite.rows;
  const pal = sprite.pal;

  let blockSize = o.blockSize || 1;
  let currentGrid = poolGrid(rows, blockSize);
  let prevGrid = currentGrid;
  let assembled = !state.motionOn || Boolean(o.skipAssemble);
  let assembleStart = 0;
  let waveStart = 0;
  let waveDir = 0;
  let swapped = false;
  let sweepActive = false;
  let sweepStart = 0;
  let animActive = false;
  let lastSize = 0;

  const rng = makeRng(hashStr(work.id));
  const fgIndices: number[] = [];
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (currentGrid[y][x] !== '0') fgIndices.push(y * 32 + x);
    }
  }
  for (let i = fgIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = fgIndices[i];
    fgIndices[i] = fgIndices[j];
    fgIndices[j] = tmp;
  }
  const orderRank = new Int16Array(1024).fill(-1);
  fgIndices.forEach((pos, idx) => {
    orderRank[pos] = idx;
  });

  function poolGrid(srcRows: string[], bSize: number): string[] {
    if (bSize <= 1) return srcRows;
    const out: string[] = [];
    for (let y = 0; y < 32; y += bSize) {
      const blockRows: string[] = Array.from({ length: bSize }, () => '');
      for (let x = 0; x < 32; x += bSize) {
        const counts = [0, 0, 0, 0];
        for (let dy = 0; dy < bSize; dy++) {
          const r = srcRows[y + dy];
          for (let dx = 0; dx < bSize; dx++) {
            counts[Number(r[x + dx]) || 0]++;
          }
        }
        let bestIdx = 0;
        let bestCount = -1;
        for (let c = 0; c < 4; c++) {
          if (counts[c] > bestCount) {
            bestCount = counts[c];
            bestIdx = c;
          }
        }
        const ch = String(bestIdx);
        for (let dy = 0; dy < bSize; dy++) {
          blockRows[dy] += ch.repeat(bSize);
        }
      }
      for (let dy = 0; dy < bSize; dy++) out.push(blockRows[dy]);
    }
    return out;
  }

  function sizeCanvas(): boolean {
    const rect = canvas.getBoundingClientRect();
    const cssSize = Math.round(rect.width);
    if (cssSize <= 0 || cssSize === lastSize) return cssSize > 0;
    lastSize = cssSize;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  function drawFrame(now: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || lastSize <= 0) return;
    const size = lastSize;
    const cell = Math.floor(size / 32);
    const gridPx = cell * 32;
    const ox = Math.floor((size - gridPx) / 2);
    const oy = Math.floor((size - gridPx) / 2);

    ctx.fillStyle = pal[0];
    ctx.fillRect(0, 0, size, size);

    let assembleLimit = fgIndices.length;
    if (!assembled) {
      const elapsed = now - assembleStart;
      const p = Math.min(1, Math.max(0, elapsed / 620));
      assembleLimit = Math.floor(p * fgIndices.length);
      if (p >= 1) assembled = true;
    }

    let waveElapsed = -1;
    let waveDone = true;
    if (waveDir !== 0) {
      waveElapsed = now - waveStart;
      if (waveElapsed < 360) waveDone = false;
      else {
        swapped = waveDir === 1;
        waveDir = 0;
      }
    }

    let sweepElapsed = -1;
    let sweepDone = true;
    if (sweepActive) {
      sweepElapsed = now - sweepStart;
      if (sweepElapsed < 200) sweepDone = false;
      else sweepActive = false;
    }

    for (let y = 0; y < 32; y++) {
      let runStart = 0;
      let runIdx = -1;
      for (let x = 0; x <= 32; x++) {
        let idx = 0;
        if (x < 32) {
          const useOld = sweepActive && !sweepDone && ((x + y) / 62) * 200 > sweepElapsed;
          const srcGrid = useOld ? prevGrid : currentGrid;
          const raw = Number(srcGrid[y][x]) || 0;
          if (!assembled && raw !== 0) {
            const rank = orderRank[y * 32 + x];
            idx = rank < assembleLimit ? raw : 0;
          } else {
            idx = raw;
          }
          let isSwapped = swapped;
          if (waveDir !== 0) {
            const threshold = ((x + y) / 62) * 360;
            isSwapped = waveDir === 1 ? waveElapsed >= threshold : waveElapsed < threshold;
          }
          if (isSwapped && (idx === 0 || idx === 1)) {
            idx = idx === 0 ? 1 : 0;
          }
        }
        if (x === 0) {
          runIdx = idx;
          runStart = 0;
        } else if (x === 32 || idx !== runIdx) {
          if (runIdx !== 0 || swapped || waveDir !== 0) {
            ctx.fillStyle = pal[runIdx];
            ctx.fillRect(ox + runStart * cell, oy + y * cell, (x - runStart) * cell, cell);
          }
          runStart = x;
          runIdx = idx;
        }
      }
    }

    // Subtle crisp border on sprite edge
    ctx.strokeStyle = TOKENS.ink;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

    if (assembled && waveDone && sweepDone) {
      animActive = false;
      motion.remove(drawFrame);
    }
  }

  function startAnim(): void {
    if (!animActive) {
      animActive = true;
      motion.add(drawFrame);
    }
  }

  function renderImmediate(): void {
    if (sizeCanvas()) drawFrame(performance.now());
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          io.disconnect();
          sizeCanvas();
          if (!state.motionOn || o.skipAssemble) {
            assembled = true;
            drawFrame(performance.now());
          } else {
            assembled = false;
            assembleStart = performance.now();
            startAnim();
          }
        }
      }
    },
    { threshold: 0.25 }
  );
  io.observe(canvas);

  let rTimer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(rTimer);
    rTimer = window.setTimeout(() => {
      const prev = lastSize;
      sizeCanvas();
      if (lastSize !== prev) drawFrame(performance.now());
    }, 120);
  });
  ro.observe(canvas);

  const hoverTarget = canvas.closest('a, button') || canvas;
  if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    const triggerSwap = (toSwapped: boolean) => {
      if (!state.motionOn) {
        swapped = toSwapped;
        waveDir = 0;
        drawFrame(performance.now());
        return;
      }
      waveDir = toSwapped ? 1 : -1;
      waveStart = performance.now();
      startAnim();
    };
    hoverTarget.addEventListener('mouseenter', () => triggerSwap(true));
    hoverTarget.addEventListener('mouseleave', () => triggerSwap(false));
    hoverTarget.addEventListener('focusin', () => triggerSwap(true));
    hoverTarget.addEventListener('focusout', () => triggerSwap(false));
  }

  const onMotionChange = () => {
    if (!state.motionOn) {
      assembled = true;
      sweepActive = false;
      waveDir = 0;
      swapped = false;
      renderImmediate();
    }
  };
  window.addEventListener('raster:motionchange', onMotionChange);

  state.routeCleanup.push(() => {
    io.disconnect();
    ro.disconnect();
    window.clearTimeout(rTimer);
    motion.remove(drawFrame);
    window.removeEventListener('raster:motionchange', onMotionChange);
  });

  window.requestAnimationFrame(renderImmediate);

  return {
    setBlockSize(newSize: number) {
      if (newSize === blockSize) return;
      prevGrid = currentGrid;
      blockSize = newSize;
      currentGrid = poolGrid(rows, blockSize);
      if (!state.motionOn) {
        sweepActive = false;
        drawFrame(performance.now());
      } else {
        sweepActive = true;
        sweepStart = performance.now();
        startAnim();
      }
    },
  };
}
