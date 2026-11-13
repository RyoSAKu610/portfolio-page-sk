import { PROFILE, TOKENS, TRAIL_COLORS } from '../data/works';
import { playBlip, playChord } from '../lib/audio';
import { layoutGlyphLines } from '../lib/bitmapFont';
import { HeroCycleItem, initParticleCanvas } from '../lib/canvasEffects';
import { defaultBadgeGrid, esc, state, storageSet } from '../lib/runtime';

const BADGE_PALETTE = [
  { id: '0', name: 'ink', hex: '#0A0A0A' },
  { id: '1', name: 'paper', hex: '#FFFFFF' },
  { id: '2', name: 'sodium', hex: '#F3ACF0' },
  { id: '3', name: 'blue', hex: '#2370E8' },
  { id: '4', name: 'pink', hex: '#D873B3' },
  { id: '5', name: 'green', hex: '#2BA676' },
  { id: '6', name: 'lavender', hex: '#A98BF7' },
  { id: '7', name: 'coral', hex: '#FF5A5A' },
];

export function renderPlayground(main: HTMLElement): void {
  document.title = 'Playground — RyoSAKu610';

  const sandboxCycles: HeroCycleItem[] = [
    { desktop: 'PLAY', mobile: ['PL', 'AY'], caption: '(好きな英数字を入力してパーティクル文字を変形できます)' },
  ];

  main.innerHTML = `
    <section class="sub-sec" data-surface="ink" data-pager="Playground">
      <div class="grid">
        <p class="col-1-3 t-micro">(Playground — 遊べる実験室)</p>
        <div class="col-5-12">
          <h1 class="t-h1 t-paper" tabindex="-1">Pixel Lab & Card Maker</h1>
          <p class="t-body" style="margin-top:16px;color:rgba(255,255,255,0.86);">16×16のドット絵を描いてオリジナルの名刺SVGカードを作ったり、パーティクル文字に好きな言葉を打ち込んで物理挙動で遊べます。</p>
        </div>
      </div>

      <div class="grid" style="margin-top:48px;">
        <div class="col-full">
          <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-bottom:16px;">
            <div class="field-group" style="max-width:280px;">
              <label class="t-micro" for="sandbox-word-input">パーティクル文字 (英数字9文字まで)</label>
              <input class="text-input" type="text" id="sandbox-word-input" maxlength="9" value="RYO/610" placeholder="例: WARP, AI+WEB">
            </div>
            <button type="button" class="btn-primary btn-sm t-small" id="sandbox-morph-btn"><span>文字を変形</span></button>
            <button type="button" class="chip-toggle t-small" id="sandbox-burst-btn">弾けさせる</button>
          </div>
          <canvas class="hero-canvas" id="sandbox-canvas" style="border:1px solid var(--sodium);" aria-label="Interactive particle word sandbox"></canvas>
          <p class="t-micro" id="sandbox-caption" style="margin-top:8px;">(マウスや指で触るとピクセルが逃げます)</p>
        </div>
      </div>

      <div class="grid badge-layout" style="margin-top:64px;">
        <div class="col-1-6">
          <h2 class="t-lead t-paper" style="margin-bottom:16px;">16×16 ビルダー・カードメーカー</h2>
          <canvas class="badge-editor-canvas" id="badge-canvas" tabindex="0" role="img" aria-label="16x16 ピクセル描画グリッド。矢印キーで移動、スペースで描画できます。"></canvas>
          <p class="t-micro badge-status" id="badge-status" aria-live="polite">Row 1, column 1, paper.</p>
          <div class="palette-group" role="radiogroup" aria-label="カラーパレット" id="badge-palette">
            ${BADGE_PALETTE.map(
              (c, idx) => `
              <button type="button" class="palette-swatch" role="radio" aria-checked="${idx === 3 ? 'true' : 'false'}" aria-label="${idx + 1}: ${esc(c.name)}" data-col="${esc(c.id)}" style="background-color:${c.hex};"></button>
            `
            ).join('')}
          </div>
          <div class="badge-tools" id="badge-tools">
            <button type="button" class="chip-toggle t-small" data-tool="pen" aria-pressed="true">Pen</button>
            <button type="button" class="chip-toggle t-small" data-tool="erase" aria-pressed="false">Erase</button>
            <button type="button" class="chip-toggle t-small" data-tool="fill" aria-pressed="false">Fill</button>
            <button type="button" class="chip-toggle t-small" data-tool="mirror" aria-pressed="false">Mirror</button>
            <button type="button" class="chip-toggle t-small" id="badge-random">Random</button>
            <button type="button" class="chip-toggle t-small" id="badge-clear">Clear</button>
            <button type="button" class="chip-toggle t-small" id="badge-undo">Undo</button>
          </div>
        </div>

        <div class="col-8-12">
          <figure>
            <svg class="badge-preview-svg" id="badge-preview" viewBox="0 0 320 480" shape-rendering="crispEdges" role="img" aria-label="Builder Card Preview"></svg>
            <figcaption class="t-micro" style="margin-top:8px;">(Preview: 320 × 480 印刷・保存可能なSVGビルダーカード)</figcaption>
          </figure>
          <div class="field-group badge-name-field">
            <label class="t-micro" for="badge-name-input">カードの名前 / ハンドル</label>
            <input class="text-input" type="text" id="badge-name-input" maxlength="18" value="${esc(state.badge.name)}">
          </div>
          <div class="badge-dl-wrap">
            <button type="button" class="btn-primary t-small" id="badge-dl-btn"><span>SVGをダウンロード</span></button>
          </div>
        </div>
      </div>
    </section>
  `;

  // Sandbox Particle Word Toy
  const sandboxCtrl = initParticleCanvas(
    document.getElementById('sandbox-canvas') as HTMLCanvasElement,
    document.getElementById('sandbox-caption'),
    sandboxCycles,
    { bgColor: TOKENS.ink, fgColor: TOKENS.sodium, autoCycle: false }
  );
  sandboxCtrl.morphToWord('RYO/610', '(文字を打ち込んで「文字を変形」を押してみてください)');

  const wordInput = document.getElementById('sandbox-word-input') as HTMLInputElement;
  const morphBtn = document.getElementById('sandbox-morph-btn')!;
  const burstBtn = document.getElementById('sandbox-burst-btn')!;

  const triggerMorph = () => {
    playChord([440, 587], 0.08);
    sandboxCtrl.morphToWord(wordInput.value || 'RYO/610');
  };
  morphBtn.addEventListener('click', triggerMorph);
  wordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerMorph();
  });
  burstBtn.addEventListener('click', () => {
    sandboxCtrl.scatterBurst();
  });

  // 16x16 Pixel Badge Maker
  const canvas = document.getElementById('badge-canvas') as HTMLCanvasElement;
  const statusEl = document.getElementById('badge-status')!;
  const previewSvg = document.getElementById('badge-preview')!;
  const nameInput = document.getElementById('badge-name-input') as HTMLInputElement;
  const paletteBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('#badge-palette .palette-swatch'));
  const toolBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('#badge-tools [data-tool]'));

  let grid = state.badge.grid.split('');
  if (grid.length !== 256) grid = defaultBadgeGrid().split('');
  const history: string[] = [];
  let currentColor = '3';
  let mode: 'pen' | 'erase' | 'fill' = 'pen';
  let mirror = false;
  let keyR = 0;
  let keyC = 0;
  let canvasFocused = false;
  let painting = false;
  let paintModeOverride: string | null = null;

  function pushHistory() {
    history.push(grid.join(''));
    if (history.length > 25) history.shift();
  }

  function saveGrid() {
    state.badge.grid = grid.join('');
    storageSet('ryo610.badge', state.badge);
  }

  function drawEditor() {
    const rect = canvas.getBoundingClientRect();
    const maxPx = Math.min(rect.width || 320, 640);
    const cell = Math.max(12, Math.floor(maxPx / 16));
    const size = cell * 16;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = TOKENS.ink;
    ctx.fillRect(0, 0, size, size);

    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const palId = grid[r * 16 + c];
        const palObj = BADGE_PALETTE[Number(palId)] || BADGE_PALETTE[1];
        ctx.fillStyle = palObj.hex;
        ctx.fillRect(c * cell + 1, r * cell + 1, cell - 1, cell - 1);
      }
    }

    if (canvasFocused) {
      ctx.strokeStyle = TOKENS.sodium;
      ctx.lineWidth = 2;
      ctx.strokeRect(keyC * cell + 2, keyR * cell + 2, cell - 4, cell - 4);
    }
  }

  function updateStatus() {
    const palId = grid[keyR * 16 + keyC];
    const palObj = BADGE_PALETTE[Number(palId)] || BADGE_PALETTE[1];
    statusEl.textContent = `Row ${keyR + 1}, column ${keyC + 1}, ${palObj.name}.`;
  }

  function drawPreview() {
    const logoLayout = layoutGlyphLines(['RYO/610'], 2);
    let logoRects = '';
    const lCellH = 2.4;
    const lCellW = lCellH * 1.25;
    const lx0 = 16;
    const ly0 = Math.round((48 - 9 * lCellH) / 2);
    for (let i = 0; i < logoLayout.cells.length; i++) {
      const cell = logoLayout.cells[i];
      logoRects += `<rect x="${(lx0 + cell.x * lCellW).toFixed(2)}" y="${(ly0 + cell.y * lCellH).toFixed(2)}" width="${lCellW}" height="${lCellH}" fill="${TOKENS.sodium}"/>`;
    }

    const spriteSize = 16 * 15;
    const sx0 = (320 - spriteSize) / 2;
    const sy0 = 68;
    let spriteRects = '';
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const palId = grid[r * 16 + c];
        const palObj = BADGE_PALETTE[Number(palId)] || BADGE_PALETTE[1];
        spriteRects += `<rect x="${sx0 + c * 15}" y="${sy0 + r * 15}" width="15" height="15" fill="${palObj.hex}"/>`;
      }
    }

    let stripRects = '';
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 16; i++) {
        stripRects += `<rect x="${i * 20}" y="${432 + row * 24}" width="20" height="24" fill="${TRAIL_COLORS[(i + row * 3) % TRAIL_COLORS.length]}"/>`;
      }
    }

    const badgeName = state.badge.name || PROFILE.handle;
    previewSvg.innerHTML = `
      <rect x="0" y="0" width="320" height="480" fill="${TOKENS.sodium}"/>
      <rect x="0" y="0" width="320" height="48" fill="${TOKENS.ink}"/>
      ${logoRects}
      ${spriteRects}
      <text x="16" y="356" font-family="Archivo, Zen Kaku Gothic New, sans-serif" font-size="24" font-weight="700" fill="${TOKENS.ink}">${esc(badgeName)}</text>
      <text x="16" y="388" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="${TOKENS.ink}">AI × Web Builder · 2026</text>
      ${stripRects}
    `;
  }

  function paintAt(r: number, c: number, colorId: string) {
    if (r < 0 || r >= 16 || c < 0 || c >= 16) return;
    grid[r * 16 + c] = colorId;
    if (mirror) {
      grid[r * 16 + (15 - c)] = colorId;
    }
  }

  function floodFill(r: number, c: number, newCol: string) {
    const target = grid[r * 16 + c];
    if (target === newCol) return;
    const queue = [[r, c]];
    const seen = new Set<number>();
    while (queue.length > 0) {
      const [cr, cc] = queue.shift()!;
      const k = cr * 16 + cc;
      if (cr < 0 || cr >= 16 || cc < 0 || cc >= 16 || seen.has(k) || grid[k] !== target) continue;
      seen.add(k);
      grid[k] = newCol;
      queue.push([cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]);
    }
  }

  function coordsFromEvent(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const c = Math.min(15, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * 16)));
    const r = Math.min(15, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * 16)));
    return { r, c };
  }

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.focus();
    const { r, c } = coordsFromEvent(e);
    keyR = r;
    keyC = c;
    pushHistory();
    if (e.button === 2) {
      painting = true;
      paintModeOverride = '1';
      paintAt(r, c, '1');
    } else if (mode === 'fill') {
      floodFill(r, c, currentColor);
      playBlip(680, 0.06);
    } else {
      painting = true;
      paintModeOverride = mode === 'erase' ? '1' : currentColor;
      paintAt(r, c, paintModeOverride);
      playBlip(360 + Number(paintModeOverride) * 45, 0.03);
    }
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture failure
    }
    saveGrid();
    drawEditor();
    drawPreview();
    updateStatus();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!painting || !paintModeOverride) return;
    const { r, c } = coordsFromEvent(e);
    if (r === keyR && c === keyC) return;
    keyR = r;
    keyC = c;
    paintAt(r, c, paintModeOverride);
    playBlip(360 + Number(paintModeOverride) * 45, 0.025);
    saveGrid();
    drawEditor();
    drawPreview();
    updateStatus();
  });

  const stopPaint = () => {
    painting = false;
    paintModeOverride = null;
  };
  canvas.addEventListener('pointerup', stopPaint);
  canvas.addEventListener('pointercancel', stopPaint);

  canvas.addEventListener('focus', () => {
    canvasFocused = true;
    drawEditor();
    updateStatus();
  });
  canvas.addEventListener('blur', () => {
    canvasFocused = false;
    drawEditor();
  });

  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') keyC = Math.min(15, keyC + 1);
    else if (e.key === 'ArrowLeft') keyC = Math.max(0, keyC - 1);
    else if (e.key === 'ArrowDown') keyR = Math.min(15, keyR + 1);
    else if (e.key === 'ArrowUp') keyR = Math.max(0, keyR - 1);
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      pushHistory();
      if (mode === 'fill') floodFill(keyR, keyC, currentColor);
      else paintAt(keyR, keyC, mode === 'erase' ? '1' : currentColor);
      saveGrid();
      drawEditor();
      drawPreview();
      updateStatus();
      return;
    } else if (/^[1-8]$/.test(e.key)) {
      const idx = Number(e.key) - 1;
      currentColor = BADGE_PALETTE[idx].id;
      paletteBtns.forEach((b, bi) => b.setAttribute('aria-checked', bi === idx ? 'true' : 'false'));
      return;
    } else return;

    e.preventDefault();
    drawEditor();
    updateStatus();
  });

  paletteBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      currentColor = btn.dataset.col || '3';
      paletteBtns.forEach((b, bi) => b.setAttribute('aria-checked', bi === idx ? 'true' : 'false'));
      playBlip(400 + idx * 50, 0.03);
    });
  });

  toolBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tool;
      if (t === 'mirror') {
        mirror = !mirror;
        btn.setAttribute('aria-pressed', mirror ? 'true' : 'false');
      } else if (t === 'pen' || t === 'erase' || t === 'fill') {
        mode = t;
        toolBtns
          .filter((b) => b.dataset.tool !== 'mirror')
          .forEach((b) => b.setAttribute('aria-pressed', b.dataset.tool === t ? 'true' : 'false'));
      }
      playBlip(540, 0.035);
    });
  });

  document.getElementById('badge-random')?.addEventListener('click', () => {
    pushHistory();
    const bgCol = '1';
    const fgCol = String(2 + Math.floor(Math.random() * 6));
    const eyeCol = '0';
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 8; c++) {
        const dist = Math.hypot(c - 7.5, r - 7.5);
        const on = dist < 6.2 && Math.random() > 0.35;
        const val = on ? fgCol : bgCol;
        grid[r * 16 + c] = val;
        grid[r * 16 + (15 - c)] = val;
      }
    }
    grid[6 * 16 + 5] = eyeCol;
    grid[6 * 16 + 10] = eyeCol;
    saveGrid();
    drawEditor();
    drawPreview();
    playChord([440, 554, 659], 0.07);
  });

  document.getElementById('badge-clear')?.addEventListener('click', () => {
    pushHistory();
    grid = Array(256).fill('1');
    saveGrid();
    drawEditor();
    drawPreview();
    playBlip(260, 0.05);
  });

  document.getElementById('badge-undo')?.addEventListener('click', () => {
    const prev = history.pop();
    if (!prev) return;
    grid = prev.split('');
    saveGrid();
    drawEditor();
    drawPreview();
    playBlip(380, 0.04);
  });

  nameInput.addEventListener('input', () => {
    state.badge.name = nameInput.value;
    storageSet('ryo610.badge', state.badge);
    drawPreview();
  });

  document.getElementById('badge-dl-btn')?.addEventListener('click', () => {
    playChord([523, 659, 784], 0.09);
    const svgXml = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="320" height="480" viewBox="0 0 320 480" shape-rendering="crispEdges">${previewSvg.innerHTML}</svg>`;
    const blob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ryo610-card-${(state.badge.name || 'sprite').toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'card'}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const ro = new ResizeObserver(() => drawEditor());
  ro.observe(canvas);
  state.routeCleanup.push(() => ro.disconnect());

  drawEditor();
  drawPreview();
}
