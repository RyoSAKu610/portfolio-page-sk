import {
  CATEGORY_LABELS,
  SORTED_WORKS,
  WORKS,
  WorkCategory,
  trackById,
  workById,
} from '../data/works';
import { playBlip } from '../lib/audio';
import { initSpriteCanvas } from '../lib/pixelSprites';
import { esc, normText, state } from '../lib/runtime';

export function renderWorks(main: HTMLElement): void {
  document.title = 'Works — RyoSAKu610';
  const cats: Array<WorkCategory | 'all'> = ['all', 'ai', 'research', 'creative', 'web3', 'tool'];

  main.innerHTML = `
    <section class="sub-sec" data-surface="sodium" data-pager="Works">
      <div class="grid">
        <p class="col-1-3 t-micro">(Works · ${WORKS.length})</p>
        <div class="col-5-12">
          <h1 class="t-h1" tabindex="-1">Works</h1>
          <p class="t-body" style="margin-top:16px;">アイデアをその日のうちに動くURLへ。2026年に制作した全${WORKS.length}作品のピクセル図鑑です。ホバーで色反転、クリックで詳細と解像度変更を試せます。</p>
          <div style="margin-top:24px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
            <div class="field-group" style="min-width:220px;flex:1 1 220px;max-width:300px;">
              <label class="t-micro" for="works-search">作品・技術で検索</label>
              <input class="text-input" type="search" id="works-search" placeholder="例: Solana, WebAudio, arXiv" value="${esc(state.worksFilter.query)}">
            </div>
            <div class="track-toggles-wrap" id="works-cat-toggles" style="align-self:flex-end;">
              ${cats
                .map((c) => {
                  const pressed = state.worksFilter.cat === c;
                  const count = c === 'all' ? WORKS.length : WORKS.filter((w) => w.cats.includes(c)).length;
                  return `<button type="button" class="chip-toggle t-small" data-cat="${c}" aria-pressed="${pressed ? 'true' : 'false'}">${esc(CATEGORY_LABELS[c])} (${count})</button>`;
                })
                .join('')}
            </div>
            <div class="seg-group" role="group" aria-label="並び替え" style="align-self:flex-end;">
              <button type="button" class="chip-toggle t-small" id="works-sort-date" aria-pressed="${state.worksFilter.sort === 'date' ? 'true' : 'false'}">新しい順</button>
              <button type="button" class="chip-toggle t-small" id="works-sort-title" aria-pressed="${state.worksFilter.sort === 'title' ? 'true' : 'false'}">A–Z</button>
            </div>
          </div>
          <p class="t-micro" id="works-count" style="margin-top:12px;" aria-live="polite"></p>
        </div>
        <div class="col-full" id="works-grid-wrap"></div>
      </div>
    </section>
  `;

  const searchInput = document.getElementById('works-search') as HTMLInputElement;
  const catBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('#works-cat-toggles .chip-toggle'));
  const dateBtn = document.getElementById('works-sort-date') as HTMLButtonElement;
  const titleBtn = document.getElementById('works-sort-title') as HTMLButtonElement;
  const countEl = document.getElementById('works-count')!;
  const gridWrap = document.getElementById('works-grid-wrap')!;

  function drawList(skipFade: boolean) {
    const q = normText(state.worksFilter.query.trim());
    let list = SORTED_WORKS.filter((w) => {
      if (state.worksFilter.cat !== 'all' && !w.cats.includes(state.worksFilter.cat as WorkCategory)) {
        return false;
      }
      if (q) {
        const hay = normText(`${w.title} ${w.sub} ${w.summary} ${w.tech.join(' ')}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (state.worksFilter.sort === 'title') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }

    countEl.textContent = `${list.length} / ${WORKS.length} 作品を表示中`;

    if (list.length === 0) {
      gridWrap.innerHTML = `
        <div style="margin-top:48px;">
          <p class="t-lead">条件に合う作品が見つかりませんでした。</p>
          <button type="button" class="btn-text t-small u-anim" id="works-reset-btn" style="margin-top:12px;">(検索条件をリセット)</button>
        </div>
      `;
      document.getElementById('works-reset-btn')?.addEventListener('click', () => {
        state.worksFilter.cat = 'all';
        state.worksFilter.query = '';
        searchInput.value = '';
        catBtns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === 'all' ? 'true' : 'false'));
        drawList(false);
      });
      return;
    }

    const doRender = () => {
      gridWrap.innerHTML = `<div class="speakers-index-grid">
        ${list
          .map((w) => {
            const tr = trackById(w.track);
            return `
              <figure class="speaker-card" data-wcard="${esc(w.id)}">
                <a class="speaker-card-link" href="#/works/${esc(w.id)}">
                  <canvas class="portrait-canvas" data-spid="${esc(w.id)}" role="img" aria-label="Pixel sprite of ${esc(w.title)}"></canvas>
                </a>
                <figcaption class="speaker-card-figcap">
                  <p class="t-micro tnum">${esc(w.date)} · ${esc(tr.jpLabel)}${w.links.live ? ' · LIVE' : ''}</p>
                  <h2 class="t-lead speaker-card-name"><a class="u-anim" href="#/works/${esc(w.id)}">${esc(w.title)}</a></h2>
                  <p class="t-small speaker-card-role">${esc(w.sub)}</p>
                  <p class="t-micro" style="margin-top:8px;opacity:0.85;">${esc(w.summary)}</p>
                </figcaption>
              </figure>
            `;
          })
          .join('')}
      </div>`;

      list.forEach((w) => {
        const canvas = gridWrap.querySelector<HTMLCanvasElement>(`canvas[data-spid="${w.id}"]`);
        if (canvas) initSpriteCanvas(canvas, w, { skipAssemble: !skipFade });
      });
    };

    const existing = Array.from(gridWrap.querySelectorAll<HTMLElement>('.speaker-card'));
    if (!skipFade && state.motionOn && existing.length > 0) {
      const keepIds = new Set(list.map((s) => s.id));
      const leaving = existing.filter((el) => !keepIds.has(el.dataset.wcard || ''));
      if (leaving.length > 0) {
        leaving.forEach((el) => el.classList.add('is-leaving'));
        window.setTimeout(doRender, 150);
        return;
      }
    }
    doRender();
  }

  searchInput.addEventListener('input', () => {
    state.worksFilter.query = searchInput.value;
    drawList(false);
  });

  catBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      playBlip(520, 0.04);
      state.worksFilter.cat = btn.dataset.cat || 'all';
      catBtns.forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
      drawList(false);
    });
  });

  dateBtn.addEventListener('click', () => {
    state.worksFilter.sort = 'date';
    dateBtn.setAttribute('aria-pressed', 'true');
    titleBtn.setAttribute('aria-pressed', 'false');
    drawList(false);
  });

  titleBtn.addEventListener('click', () => {
    state.worksFilter.sort = 'title';
    dateBtn.setAttribute('aria-pressed', 'false');
    titleBtn.setAttribute('aria-pressed', 'true');
    drawList(false);
  });

  drawList(true);
}

export function renderWorkDetail(main: HTMLElement, id: string): void {
  const idx = SORTED_WORKS.findIndex((w) => w.id === id);
  const w = workById(id);
  if (!w || idx === -1) {
    window.location.hash = '#/works';
    return;
  }

  const prevW = SORTED_WORKS[(idx - 1 + SORTED_WORKS.length) % SORTED_WORKS.length];
  const nextW = SORTED_WORKS[(idx + 1) % SORTED_WORKS.length];
  const tr = trackById(w.track);
  const resLabels = ['4 × 4', '8 × 8', '16 × 16', '32 × 32'];
  const resSizes = [8, 4, 2, 1];

  document.title = `${w.title} — RyoSAKu610`;
  main.innerHTML = `
    <section class="sub-sec" data-surface="paper" data-pager="${esc(w.title)}">
      <div class="grid">
        <div class="col-1-5">
          <figure>
            <canvas class="portrait-canvas" id="detail-sprite" role="img" aria-label="Pixel sprite of ${esc(w.title)}"></canvas>
            <div class="scrubber-wrap">
              <div class="scrubber-head">
                <label class="t-micro" for="res-scrubber">ピクセル解像度 (遊べます)</label>
                <output class="t-micro tnum" id="res-output" for="res-scrubber">32 × 32</output>
              </div>
              <input class="scrubber-input" type="range" id="res-scrubber" min="0" max="3" step="1" value="3" aria-valuetext="32 × 32">
            </div>
            <figcaption class="t-micro" style="margin-top:8px;">(スライダーを動かすと4色のピクセル解像度を4×4〜32×32に即時リサンプリングします。)</figcaption>
          </figure>
        </div>

        <div class="col-7-12">
          <p class="t-micro tnum">(Work ${String(idx + 1).padStart(2, '0')}/${String(SORTED_WORKS.length).padStart(2, '0')} · ${esc(w.date)}${w.hackathon ? ` · ${esc(w.hackathon)}` : ''})</p>
          <h1 class="t-h1" tabindex="-1" style="margin-top:8px;">${esc(w.title)}</h1>
          <p class="t-lead" style="margin-top:14px;">${esc(w.sub)}</p>
          <p class="t-small" style="margin-top:10px;">${w.cats.map((c) => CATEGORY_LABELS[c]).join(' · ')} · <span class="track-chip" style="background:${tr.chipBg};color:${tr.chipFg}">${esc(tr.jpLabel)}</span></p>
          <p class="t-body" style="margin-top:24px;">${esc(w.summary)}</p>

          ${
            w.problem || w.build || w.point
              ? `<dl class="detail-case-list">
                  ${w.problem ? `<div><dt class="t-micro">課題 (Problem)</dt><dd class="t-body">${esc(w.problem)}</dd></div>` : ''}
                  ${w.build ? `<div><dt class="t-micro">作ったもの (Build)</dt><dd class="t-body">${esc(w.build)}</dd></div>` : ''}
                  ${w.point ? `<div><dt class="t-micro">工夫 (Key Point)</dt><dd class="t-body">${esc(w.point)}</dd></div>` : ''}
                </dl>`
              : ''
          }

          <div style="margin-top:32px;">
            <p class="t-micro">使用技術 (Tech Stack)</p>
            <p class="t-small" style="margin-top:6px;">${w.tech.map(esc).join(' · ')}</p>
          </div>

          <div style="margin-top:32px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
            ${w.links.live ? `<a class="btn-primary t-small" href="${esc(w.links.live)}" target="_blank" rel="noopener"><span>ライブサイトを開く ↗</span></a>` : ''}
            ${w.links.repo ? `<a class="chip-toggle t-small" href="${esc(w.links.repo)}" target="_blank" rel="noopener">GitHub コード ↗</a>` : ''}
            ${(w.links.extra || []).map((x) => `<a class="chip-toggle t-small" href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)} ↗</a>`).join('')}
          </div>

          <div class="speaker-prev-next">
            <a class="btn-text t-small u-anim" href="#/works/${esc(prevW.id)}">(← 前の作品: ${esc(prevW.title)})</a>
            <a class="btn-text t-small u-anim" href="#/works/${esc(nextW.id)}">(次の作品: ${esc(nextW.title)} →)</a>
          </div>
        </div>
      </div>
    </section>
  `;

  const ctrl = initSpriteCanvas(document.getElementById('detail-sprite') as HTMLCanvasElement, w);
  const scrubber = document.getElementById('res-scrubber') as HTMLInputElement;
  const out = document.getElementById('res-output')!;

  scrubber.addEventListener('input', () => {
    const v = Number(scrubber.value);
    const label = resLabels[v] || '32 × 32';
    out.textContent = label;
    scrubber.setAttribute('aria-valuetext', label);
    ctrl.setBlockSize(resSizes[v] || 1);
    playBlip(300 + v * 110, 0.04, 'square');
  });
}
