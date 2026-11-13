import {
  CATEGORY_LABELS,
  PROFILE,
  SORTED_WORKS,
  TOKENS,
  TRACKS,
  WORKS,
  WorkCategory,
  trackById,
} from '../data/works';
import { playBlip, playChord } from '../lib/audio';
import { svgBitmapText } from '../lib/bitmapFont';
import { HeroCycleItem, initParticleCanvas } from '../lib/canvasEffects';
import { initSpriteCanvas } from '../lib/pixelSprites';
import {
  applyMotionState,
  applySoundState,
  esc,
  hideTip,
  showTip,
  state,
} from '../lib/runtime';

const HERO_CYCLES: HeroCycleItem[] = [
  { desktop: 'RYO/610', mobile: ['RYO/', '610'], caption: '(Builder: RyoSAKu610 — クリックで変形 / カーソルで弾く)' },
  { desktop: '23WORKS', mobile: ['23', 'WORKS'], caption: '(23 Projects shipped in 2026 — 触れるURLへ)' },
  { desktop: 'AI+WEB', mobile: ['AI+', 'WEB'], caption: '(AI Agents · Research · Games · Web3)' },
  { desktop: 'LIVEURL', mobile: ['LIVE', 'URL'], caption: '(Zero install — ブラウザですぐ動く)' },
];

export function renderHome(main: HTMLElement): void {
  document.title = `${PROFILE.handle} — Interactive Portfolio`;
  const liveCount = WORKS.filter((w) => w.links.live).length;
  const hackCount = WORKS.filter((w) => w.hackathon).length;
  const techCount = new Set(WORKS.flatMap((w) => w.tech)).size;
  const featuredWorks = WORKS.filter((w) => w.featured);
  const previewWorks = SORTED_WORKS.slice(0, 10);

  main.innerHTML = `
    <section class="hero-sec" id="hero" data-surface="sodium" data-pager="Hero">
      <h1 class="visually-hidden">${esc(PROFILE.handle)} — ${esc(PROFILE.role)}: ${esc(PROFILE.tagline)}</h1>
      <div class="grid" style="padding-inline:0;">
        <div class="hero-top-address t-lead reveal-text">
          <div>${esc(PROFILE.handle)}</div>
          <div>${esc(PROFILE.role)}</div>
          <div>${esc(PROFILE.location)}</div>
        </div>
        <div class="hero-top-date t-micro tnum">
          <div>2026 / ${WORKS.length} WORKS</div>
          <div style="margin-top:4px;"><a class="u-anim" href="${esc(PROFILE.githubPrimary)}" target="_blank" rel="noopener">GitHub: RyoSAKu610 ↗</a></div>
          <div style="margin-top:2px;"><a class="u-anim" href="${esc(PROFILE.githubSecondary)}" target="_blank" rel="noopener">GitHub: howly23v ↗</a></div>
        </div>
      </div>

      <figure class="hero-display-wrap">
        <canvas class="hero-canvas" id="hero-canvas" aria-label="Interactive pixel particle typography for RyoSAKu610. Click to morph or move cursor to scatter pixels."></canvas>
        <div class="grid hero-sub-row" style="padding-inline:0;align-items:center;row-gap:12px;">
          <figcaption class="hero-caption t-micro" id="hero-cycle-caption">${esc(HERO_CYCLES[0].caption)}</figcaption>
          <div class="hero-controls-inline">
            <div class="seg-group" role="group" aria-label="パーティクル物理モード">
              <button type="button" class="chip-toggle t-micro" data-phys="repel" aria-pressed="${state.heroPhysics === 'repel'}">弾く</button>
              <button type="button" class="chip-toggle t-micro" data-phys="attract" aria-pressed="${state.heroPhysics === 'attract'}">集める</button>
              <button type="button" class="chip-toggle t-micro" data-phys="burst" aria-pressed="${state.heroPhysics === 'burst'}">爆発</button>
            </div>
            <button type="button" class="chip-toggle t-micro" id="hero-motion-btn" aria-pressed="${state.motionOn}">Motion: ${state.motionOn ? 'ON' : 'OFF'}</button>
            <button type="button" class="chip-toggle t-micro" id="hero-sound-btn" aria-pressed="${state.soundOn}">8-bit Sound: ${state.soundOn ? 'ON' : 'OFF'}</button>
          </div>
        </div>
      </figure>

      <div class="grid hero-bottom-row" style="padding-inline:0;">
        <div class="hero-split-wrap t-lead reveal-text">
          ${PROFILE.heroSplit
            .map((line) => {
              const onlyR = !line.left && line.right ? ' only-right' : '';
              return `<div class="split-line${onlyR}"><span>${esc(line.left)}</span><span class="frag-right">${esc(line.right)}</span></div>`;
            })
            .join('')}
        </div>
        <p class="hero-final-wrap t-lead">${esc(PROFILE.heroFinal)}</p>
      </div>
    </section>

    <section class="sec" id="about" data-surface="sodium" data-pager="About">
      <div class="grid">
        <p class="col-1-3 t-micro">(About)</p>
        <h2 class="col-5-12 t-h2 reveal-text">${esc(PROFILE.tagline)} ${esc(PROFILE.manifestoLead)}</h2>
      </div>
      <div class="grid about-paras">
        <p class="about-para-1 t-body reveal-text">${esc(PROFILE.aboutP1)}</p>
        <p class="about-para-2 t-body reveal-text">${esc(PROFILE.aboutP2)}</p>
      </div>
    </section>

    <section class="sec" id="numbers" data-surface="ink" data-pager="Numbers">
      <h2 class="visually-hidden">ポートフォリオの数字と稼働カウンター</h2>
      <div class="grid">
        <p class="col-1-3 t-micro">(In numbers)</p>
      </div>
      <div class="grid stats-grid-row">
        <div class="stats-items" id="stats-items"></div>
      </div>
      <div class="grid countdown-block">
        <div class="col-full">
          <p class="t-micro">(2026 Build Streak — 2026.01.01 からの経過時間)</p>
          <div id="countdown-wrap"></div>
          <p class="visually-hidden" id="countdown-sr" aria-live="off"></p>
        </div>
      </div>
    </section>

    <section class="sec" id="tracks" data-surface="ink" data-pager="Tracks">
      <div class="grid">
        <p class="col-1-3 t-micro">(Tracks · 触れると織りが動く)</p>
        <h2 class="col-5-12 t-h2 t-paper reveal-text">4つの領域を横断し、Webで遊べる実験を続けています。クリックで作品一覧を絞り込めます。</h2>
      </div>
      <div class="grid tracks-grid" id="tracks-grid"></div>
    </section>

    <section class="sec" id="featured" data-surface="paper" data-pager="Featured">
      <div class="grid">
        <p class="col-1-3 t-micro">(Featured — 代表作)</p>
        <h2 class="col-5-12 t-h2 reveal-text">課題から設計、工夫まで。触って体験できる4つの主要プロダクト。</h2>
      </div>
      <div class="grid featured-cols" id="featured-cols"></div>
    </section>

    <section class="sec" id="works-preview" data-surface="sodium" data-pager="Works">
      <div class="grid">
        <p class="col-1-3 t-micro">(Works — ピクセル図鑑)</p>
        <h2 class="col-5-12 t-h2 reveal-text">各作品に固有の32×32ピクセル・スプライト。ホバーで色反転、クリックで詳細と解像度変更へ。</h2>
        <div class="col-full speakers-preview-grid" id="works-preview-grid"></div>
        <div class="col-full speakers-footer-link" style="display:flex;flex-wrap:wrap;gap:24px;align-items:center;">
          <a class="btn-primary t-small" href="#/works"><span>全 ${WORKS.length} 作品を見る</span></a>
          <a class="btn-text t-small u-anim" href="#/archive">(表形式のアーカイブを見る)</a>
        </div>
      </div>
    </section>

    <section class="sec" id="poster" data-surface="paper" data-pager="Principles">
      <div class="grid">
        <div class="poster-head-left t-small">
          <div>How I build</div>
          <div>4つの制作原則と</div>
          <div>自動運転の設計思想</div>
        </div>
        <h2 class="poster-head-right t-h2">
          <div>押すと色と織りが変わる、</div>
          <div>動くマニフェスト・ウォール。</div>
        </h2>
      </div>
      <div class="grid">
        <figure class="col-full">
          <div class="poster-wall-wrap" id="poster-wall"></div>
          <figcaption class="poster-caption t-micro">(タイルをクリックするとカラーパレットとピクセル織りが切り替わります。系譜の詳細は <a class="u-anim" href="#/story">Story ページ</a> へ。)</figcaption>
        </figure>
      </div>
    </section>

    <section class="sec" id="matrix" data-surface="sodium" data-pager="Matrix">
      <div class="grid">
        <p class="col-1-3 t-micro">(Interactive Matrix)</p>
        <h2 class="col-5-12 t-h2 reveal-text">${WORKS.length}の作品と技術フットプリント。マス目を触るか矢印キーで探索できます。</h2>
        <div class="col-full" id="home-matrix-wrap"></div>
        <div class="col-full passes-cta-row">
          <a class="btn-primary t-small" href="#/playground"><span>Pixel Maker で遊ぶ</span></a>
          <a class="btn-text t-small u-anim" href="#/story">(ResearchPhantom & NEON MYTHOS の系譜)</a>
        </div>
      </div>
    </section>
  `;

  // Hero Particle Canvas
  const heroCtrl = initParticleCanvas(
    document.getElementById('hero-canvas') as HTMLCanvasElement,
    document.getElementById('hero-cycle-caption'),
    HERO_CYCLES,
    { bgColor: TOKENS.sodium, fgColor: TOKENS.ink, autoCycle: true }
  );

  // Physics toggles
  main.querySelectorAll<HTMLButtonElement>('[data-phys]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.phys as 'repel' | 'attract' | 'burst';
      state.heroPhysics = mode;
      main.querySelectorAll<HTMLButtonElement>('[data-phys]').forEach((b) => {
        b.setAttribute('aria-pressed', b.dataset.phys === mode ? 'true' : 'false');
      });
      playBlip(mode === 'burst' ? 320 : mode === 'attract' ? 640 : 480, 0.05);
      if (mode === 'burst') heroCtrl.scatterBurst();
    });
  });

  // Hero Motion & Sound toggles
  const heroMotionBtn = document.getElementById('hero-motion-btn') as HTMLButtonElement;
  const heroSoundBtn = document.getElementById('hero-sound-btn') as HTMLButtonElement;

  const syncHeroToggles = () => {
    heroMotionBtn.setAttribute('aria-pressed', state.motionOn ? 'true' : 'false');
    heroMotionBtn.textContent = `Motion: ${state.motionOn ? 'ON' : 'OFF'}`;
    heroSoundBtn.setAttribute('aria-pressed', state.soundOn ? 'true' : 'false');
    heroSoundBtn.textContent = `8-bit Sound: ${state.soundOn ? 'ON' : 'OFF'}`;
  };

  heroMotionBtn.addEventListener('click', () => {
    applyMotionState(!state.motionOn);
    syncHeroToggles();
    playBlip(state.motionOn ? 580 : 300, 0.05);
  });

  heroSoundBtn.addEventListener('click', () => {
    applySoundState(!state.soundOn);
    syncHeroToggles();
    if (state.soundOn) playChord([440, 554, 659], 0.1);
  });

  const onSyncToggles = () => syncHeroToggles();
  window.addEventListener('raster:motionchange', onSyncToggles);
  window.addEventListener('raster:soundchange', onSyncToggles);
  state.routeCleanup.push(() => {
    window.removeEventListener('raster:motionchange', onSyncToggles);
    window.removeEventListener('raster:soundchange', onSyncToggles);
  });

  // Fit split lines
  const splitWrap = main.querySelector('.hero-split-wrap') as HTMLElement | null;
  const fitHeroSplitLines = () => {
    if (!splitWrap) return;
    const lines = Array.from(splitWrap.querySelectorAll('.split-line'));
    if (window.innerWidth < 768) {
      lines.forEach((ln) => ln.classList.remove('is-stacked'));
      return;
    }
    const wrapW = splitWrap.clientWidth;
    lines.forEach((ln) => {
      ln.classList.remove('is-stacked');
      const spans = ln.querySelectorAll('span');
      if (spans.length < 2) return;
      const lw = spans[0].textContent ? spans[0].getBoundingClientRect().width : 0;
      const rw = spans[1].textContent ? spans[1].getBoundingClientRect().width : 0;
      if (lw > 0 && rw > 0 && lw + rw + 32 > wrapW) {
        ln.classList.add('is-stacked');
      }
    });
  };
  fitHeroSplitLines();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitHeroSplitLines);
  }
  const splitRo = new ResizeObserver(fitHeroSplitLines);
  if (splitWrap) splitRo.observe(splitWrap);
  state.routeCleanup.push(() => splitRo.disconnect());

  // L3 Stats + Live Build Clock
  initStatsAndClock([
    { val: WORKS.length, label: '公開作品' },
    { val: liveCount, label: 'すぐ開けるURL' },
    { val: hackCount, label: 'ハッカソン出品' },
    { val: techCount, label: '使用技術スタック' },
    { val: 2, label: '育てる系譜' },
  ]);

  // L4 Playable Track Weave Panels
  initTrackPanels();

  // L5 Featured Case Studies
  const featWrap = document.getElementById('featured-cols')!;
  featWrap.innerHTML = featuredWorks
    .map((w) => {
      const tr = trackById(w.track);
      return `
        <article class="featured-card" data-track="${esc(w.track)}">
          <div class="featured-card-top">
            <a href="#/works/${esc(w.id)}" class="featured-sprite-link" aria-label="${esc(w.title)}の詳細へ">
              <canvas class="portrait-canvas" data-feat-sp="${esc(w.id)}" role="img" aria-label="Pixel sprite of ${esc(w.title)}"></canvas>
            </a>
            <div>
              <p class="t-micro tnum">${esc(w.date)} · ${esc(tr.jpLabel)}${w.hackathon ? ` · ${esc(w.hackathon)}` : ''}</p>
              <h3 class="t-h2" style="margin-top:6px;"><a class="u-anim" href="#/works/${esc(w.id)}">${esc(w.title)}</a></h3>
              <p class="t-small" style="margin-top:4px;opacity:0.8;">${esc(w.sub)}</p>
            </div>
          </div>
          <dl class="featured-case">
            ${w.problem ? `<div><dt class="t-micro">課題</dt><dd class="t-small">${esc(w.problem)}</dd></div>` : ''}
            ${w.build ? `<div><dt class="t-micro">作ったもの</dt><dd class="t-small">${esc(w.build)}</dd></div>` : ''}
            ${w.point ? `<div><dt class="t-micro">工夫</dt><dd class="t-small">${esc(w.point)}</dd></div>` : ''}
          </dl>
          <div class="featured-card-foot">
            <div class="t-micro" style="opacity:0.8;">${w.tech.map(esc).join(' · ')}</div>
            <div class="featured-links">
              <a class="chip-toggle t-micro" href="#/works/${esc(w.id)}">詳細・解像度変更</a>
              ${w.links.live ? `<a class="btn-primary btn-sm t-micro" href="${esc(w.links.live)}" target="_blank" rel="noopener"><span>サイトを開く ↗</span></a>` : ''}
              ${w.links.repo ? `<a class="btn-text t-micro u-anim" href="${esc(w.links.repo)}" target="_blank" rel="noopener">GitHub ↗</a>` : ''}
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  featuredWorks.forEach((w) => {
    const canvas = featWrap.querySelector<HTMLCanvasElement>(`canvas[data-feat-sp="${w.id}"]`);
    if (canvas) initSpriteCanvas(canvas, w);
  });

  // L6 Works Preview Grid
  const previewGrid = document.getElementById('works-preview-grid')!;
  previewGrid.innerHTML = previewWorks
    .map((w) => {
      const tr = trackById(w.track);
      return `
        <figure class="speaker-card">
          <a class="speaker-card-link" href="#/works/${esc(w.id)}">
            <canvas class="portrait-canvas" data-spid="${esc(w.id)}" role="img" aria-label="Pixel art for ${esc(w.title)}"></canvas>
            <figcaption class="speaker-card-figcap">
              <h3 class="t-lead speaker-card-name">${esc(w.title)}</h3>
              <p class="t-micro speaker-card-role">${esc(w.sub)}</p>
              <p class="t-micro speaker-card-talk">${esc(w.date)} · ${esc(tr.jpLabel)}</p>
            </figcaption>
          </a>
        </figure>
      `;
    })
    .join('');

  previewWorks.forEach((w) => {
    const canvas = previewGrid.querySelector<HTMLCanvasElement>(`canvas[data-spid="${w.id}"]`);
    if (canvas) initSpriteCanvas(canvas, w);
  });

  // L7 Interactive Poster Wall
  initPosterWall();

  // L8 Interactive Works Matrix
  buildWorksMatrix(document.getElementById('home-matrix-wrap')!);
}

function initStatsAndClock(statsData: Array<{ val: number; label: string }>): void {
  const statsWrap = document.getElementById('stats-items');
  if (!statsWrap) return;

  statsWrap.innerHTML = statsData
    .map(
      (s, idx) => `
      <div class="stat-item" data-sidx="${idx}">
        <div class="stat-glyph">${svgBitmapText(String(s.val).padStart(2, '0'), 10, TOKENS.sodium, { className: 'stat-svg', ariaHidden: true, bold: true })}</div>
        <p class="t-small t-sodium stat-label">${esc(s.label)}</p>
      </div>
    `
    )
    .join('');

  if (state.motionOn) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect();
            statsData.forEach((s, idx) => {
              const box = statsWrap.querySelector(`[data-sidx="${idx}"] .stat-glyph`);
              if (!box) return;
              window.setTimeout(() => {
                let step = 0;
                const timer = window.setInterval(() => {
                  step++;
                  const cur = step >= 12 ? s.val : Math.round((s.val * step) / 12);
                  box.innerHTML = svgBitmapText(String(cur).padStart(2, '0'), 10, TOKENS.sodium, {
                    className: 'stat-svg',
                    ariaHidden: true,
                    bold: true,
                  });
                  if (step >= 12) window.clearInterval(timer);
                }, 90);
              }, idx * 80);
            });
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(statsWrap);
    state.routeCleanup.push(() => io.disconnect());
  }

  // Live bitmap elapsed clock since 2026-01-01
  const cdWrap = document.getElementById('countdown-wrap');
  if (!cdWrap) return;
  const startMs = Date.parse('2026-01-01T00:00:00Z');
  let cdTimer = 0;

  function cdCellH(): number {
    const w = window.innerWidth;
    const avail = cdWrap!.clientWidth || w - 48;
    let target = 5;
    if (w >= 1440) target = 11;
    else if (w >= 1024) target = 9;
    else if (w >= 768) target = 7;
    else if (w >= 390) target = 5.5;
    if (w >= 768) {
      const maxFit = Math.floor((avail / (81 * 1.25)) * 2) / 2;
      return Math.max(4, Math.min(target, maxFit));
    }
    return target;
  }

  function renderClock() {
    const diff = Math.max(0, Date.now() - startMs);
    const totalSec = Math.floor(diff / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const ch = cdCellH();
    const parts = [
      { val: String(d).padStart(3, '0'), label: 'days' },
      { val: String(h).padStart(2, '0'), label: 'hours' },
      { val: String(m).padStart(2, '0'), label: 'minutes' },
      { val: String(s).padStart(2, '0'), label: 'seconds' },
    ];

    cdWrap!.innerHTML = `
      <div class="countdown-row">
        <div class="cd-pair">
          <div class="cd-group">${svgBitmapText(parts[0].val, ch, TOKENS.sodium, { ariaHidden: true, bold: true })}<span class="t-micro cd-group-label">${parts[0].label}</span></div>
          <div style="margin:0 4px;">${svgBitmapText(':', ch, TOKENS.sodium, { ariaHidden: true, bold: true })}</div>
          <div class="cd-group">${svgBitmapText(parts[1].val, ch, TOKENS.sodium, { ariaHidden: true, bold: true })}<span class="t-micro cd-group-label">${parts[1].label}</span></div>
        </div>
        <div class="cd-pair">
          <div style="margin:0 4px;" class="hide-sm-colon">${svgBitmapText(':', ch, TOKENS.sodium, { ariaHidden: true, bold: true })}</div>
          <div class="cd-group">${svgBitmapText(parts[2].val, ch, TOKENS.sodium, { ariaHidden: true, bold: true })}<span class="t-micro cd-group-label">${parts[2].label}</span></div>
          <div style="margin:0 4px;">${svgBitmapText(':', ch, TOKENS.sodium, { ariaHidden: true, bold: true })}</div>
          <div class="cd-group">${svgBitmapText(parts[3].val, ch, TOKENS.sodium, { ariaHidden: true, bold: true })}<span class="t-micro cd-group-label">${parts[3].label}</span></div>
        </div>
      </div>
    `;
  }

  renderClock();
  if (state.motionOn) {
    cdTimer = window.setInterval(renderClock, 1000);
  }
  const onResize = () => renderClock();
  window.addEventListener('resize', onResize, { passive: true });
  state.routeCleanup.push(() => {
    window.clearInterval(cdTimer);
    window.removeEventListener('resize', onResize);
  });
}

function initTrackPanels(): void {
  const grid = document.getElementById('tracks-grid');
  if (!grid) return;

  const PANEL_WEAVES: Record<string, { colA: string; colB: string; band: string; weave: (x: number, y: number, p: number) => number }> = {
    research: {
      colA: '#D873B3',
      colB: '#2370E8',
      band: '#F3ACF0',
      weave: (x, y, p) => {
        const px = (x + p) % 4;
        const py = (y + p) % 4;
        return px === 1 || py === 1 ? 1 : 0;
      },
    },
    ai: {
      colA: '#2370E8',
      colB: '#2BA676',
      band: '#22C98A',
      weave: (x, y, p) => {
        const px = (x + p) % 6;
        const py = (y + p) % 6;
        return (px === 1 && py <= 2) || (py === 1 && px <= 2) || (px === 4 && py >= 3) || (py === 4 && px >= 3) ? 1 : 0;
      },
    },
    creative: {
      colA: '#A98BF7',
      colB: '#2370E8',
      band: '#F3ACF0',
      weave: (x, y, p) => {
        const px = (x + p) % 4;
        const py = (y + p) % 4;
        return (px < 2) !== (py < 2) || (px === 1 && py === 1) ? 1 : 0;
      },
    },
    systems: {
      colA: '#2BA676',
      colB: '#2370E8',
      band: '#A98BF7',
      weave: (x, y, p) => {
        const px = (x + p) % 4;
        const py = (y + p) % 4;
        const block = (Math.floor((x + p) / 4) + Math.floor((y + p) / 4)) % 2 === 0;
        return block ? (py % 2 === 0 ? 1 : 0) : px % 2 === 0 ? 1 : 0;
      },
    },
  };

  grid.innerHTML = TRACKS.map((t) => {
    const count = WORKS.filter((w) => w.cats.some((c) => t.cats.includes(c))).length;
    const style = PANEL_WEAVES[t.id];
    return `
      <div class="track-fig">
        <button type="button" class="track-panel-btn" data-track="${esc(t.id)}" style="--track-band:${style.band}">
          <svg class="track-panel-svg" viewBox="0 0 80 72" shape-rendering="crispEdges" aria-hidden="true"></svg>
          <div class="track-card-body">
            <div>
              <p class="track-card-title">${esc(t.jpLabel)}</p>
              <p class="t-micro" style="margin-top:4px;opacity:0.75;">${esc(t.label)}</p>
              <p class="t-small track-card-desc">${esc(t.desc)}</p>
            </div>
            <div class="track-card-foot">
              <span class="t-micro tnum">${count} works</span>
              <svg class="track-card-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 12L12 2M12 2H4M12 2V10" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/>
              </svg>
            </div>
          </div>
        </button>
      </div>
    `;
  }).join('');

  const controllers: Array<() => void> = [];
  TRACKS.forEach((t) => {
    const btn = grid.querySelector<HTMLButtonElement>(`.track-panel-btn[data-track="${t.id}"]`)!;
    const svg = btn.querySelector('.track-panel-svg')!;
    const panel = PANEL_WEAVES[t.id];
    const cell = 4;
    const cols = 20;
    const rows = 18;
    let busy = false;
    let animTimer = 0;

    function drawGrid(phase: number) {
      let out = `<rect x="0" y="0" width="${cols * cell}" height="${rows * cell}" fill="${panel.colA}"/>`;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (panel.weave(x, y, phase) === 1) {
            out += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${panel.colB}"/>`;
          }
        }
      }
      svg.innerHTML = out;
    }

    drawGrid(0);

    function play() {
      if (!state.motionOn || busy) return;
      busy = true;
      let step = 0;
      animTimer = window.setInterval(() => {
        step++;
        drawGrid(step % 6);
        if (step >= 6) {
          window.clearInterval(animTimer);
          drawGrid(0);
          busy = false;
        }
      }, 90);
    }

    btn.addEventListener('mouseenter', () => {
      play();
      playBlip(540, 0.03, 'triangle');
    });
    btn.addEventListener('focus', play);
    btn.addEventListener('click', () => {
      playBlip(660, 0.05);
      state.worksFilter.cat = t.cats[0];
      window.location.hash = '#/works';
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect();
            play();
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(btn);

    state.routeCleanup.push(() => {
      io.disconnect();
      window.clearInterval(animTimer);
    });
    controllers.push(play);
  });

  const idleTimer = window.setInterval(() => {
    if (!state.motionOn || document.hidden) return;
    const fn = controllers[Math.floor(Math.random() * controllers.length)];
    if (fn) fn();
  }, 5500);
  state.routeCleanup.push(() => window.clearInterval(idleTimer));
}

function initPosterWall(): void {
  const wall = document.getElementById('poster-wall');
  if (!wall) return;

  const CHIPS_LEFT = {
    tl: [
      { text: '01 · まず、動くURLを渡す', indent: 0 },
      { text: '説明より先に触ってもらう', indent: 1 },
      { text: 'インストール不要・スマホ1タップ', indent: 0 },
      { text: 'リンクひとつで開ける体験へ', indent: 2 },
    ],
    mr: [
      { text: '02 · 最後に決めるのは人間', indent: 1 },
      { text: '秘密鍵を絶対に預からない', indent: 0 },
      { text: '勝手に応募・送信しない', indent: 2 },
      { text: '出典なき文章を書かせない', indent: 1 },
    ],
    bl: [
      { text: '03 · 止まらない仕組みにする', indent: 1 },
      { text: 'GitHub Actions × 無料枠AI', indent: 0 },
      { text: 'フォールバック切替で毎日稼働', indent: 2 },
    ],
  };

  const CHIPS_RIGHT = {
    tl: [
      { text: '04 · AIと組んで速く作る', indent: 0 },
      { text: '調査・実装・テストはAIと分担', indent: 1 },
      { text: '判断とデザインは自分で握る', indent: 0 },
      { text: 'アイデアから公開までその日のうちに', indent: 2 },
    ],
    mr: [
      { text: 'SERIES A · ResearchPhantom', indent: 1 },
      { text: '論文Terminal → Book → 6言語ラジオ', indent: 0 },
      { text: '→ 88mph 論文タイムマシンへ進化', indent: 2 },
    ],
    bl: [
      { text: 'SERIES B · NEON MYTHOS', indent: 1 },
      { text: 'ClickHouse試作 → 街の可視化', indent: 0 },
      { text: '→ スプライトArcade → 集合知OS', indent: 2 },
    ],
  };

  const chipsHTML = (data: typeof CHIPS_LEFT) => `
    <div class="poster-chips-layer" aria-hidden="true">
      <div class="chip-group chip-group-tl">
        ${data.tl.map((c) => `<span class="poster-chip-line t-small chip-indent-${c.indent}">${esc(c.text)}</span>`).join('')}
      </div>
      <div class="chip-group chip-group-mr">
        ${data.mr.map((c) => `<span class="poster-chip-line t-small chip-rindent-${c.indent}">${esc(c.text)}</span>`).join('')}
      </div>
      <div class="chip-group chip-group-bl">
        ${data.bl.map((c) => `<span class="poster-chip-line t-small chip-indent-${c.indent}">${esc(c.text)}</span>`).join('')}
      </div>
    </div>
  `;

  wall.innerHTML = `
    <div class="poster-stack poster-stack-left" id="poster-left">
      <button type="button" class="poster-mod" id="mod-m1" aria-label="パターンを切り替える: Plus weave"></button>
      <button type="button" class="poster-mod" id="mod-m3" aria-label="パターンを切り替える: Basket weave"></button>
      <button type="button" class="poster-mod" id="mod-m4" aria-label="パターンを切り替える: Tartan weave"></button>
      ${chipsHTML(CHIPS_LEFT)}
    </div>
    <div class="poster-stack poster-stack-right" id="poster-right">
      <button type="button" class="poster-mod" id="mod-m6" aria-label="パターンを切り替える: Tartan weave top"></button>
      <button type="button" class="poster-mod" id="mod-m2" aria-label="パターンを切り替える: Cross weave"></button>
      <button type="button" class="poster-mod" id="mod-m5" aria-label="パターンを切り替える: Basket weave side"></button>
      ${chipsHTML(CHIPS_RIGHT)}
    </div>
  `;

  const syncU = () => {
    const left = document.getElementById('poster-left');
    if (left) {
      const w = left.getBoundingClientRect().width;
      wall.style.setProperty('--poster-u', `${Math.round(w / 8)}px`);
    }
  };
  syncU();
  window.addEventListener('resize', syncU, { passive: true });
  state.routeCleanup.push(() => window.removeEventListener('resize', syncU));

  const PALETTES = [
    ['#F3ACF0', '#FF5A36'],
    ['#2370E8', '#18B47E'],
    ['#F5B700', '#FF5A36'],
    ['#F3ACF0', '#2370E8'],
    ['#18B47E', '#F5B700'],
    ['#A98BF7', '#FF5A36'],
  ];

  const weaveCross = (x: number, y: number, phase: number) => ((x + phase) % 4 === 1 || (y + phase) % 4 === 1 ? 1 : 0);
  const weavePlus = (x: number, y: number, phase: number) => {
    const px = (x + phase) % 6;
    const py = (y + phase) % 6;
    return (px === 1 && py <= 2) || (py === 1 && px <= 2) || (px === 4 && py >= 3) || (py === 4 && px >= 3) ? 1 : 0;
  };
  const weaveTartan = (x: number, y: number, phase: number) => {
    const px = (x + phase) % 4;
    const py = (y + phase) % 4;
    return (px < 2) !== (py < 2) || (px === 1 && py === 1) ? 1 : 0;
  };
  const weaveBasket = (x: number, y: number, phase: number) => {
    const px = (x + phase) % 4;
    const py = (y + phase) % 4;
    const block = (Math.floor((x + phase) / 4) + Math.floor((y + phase) / 4)) % 2 === 0;
    return block ? (py % 2 === 0 ? 1 : 0) : px % 2 === 0 ? 1 : 0;
  };

  const MODULES = [
    { id: 'mod-m1', cols: 20, rows: 25, paletteIdx: 0, weave: weavePlus, solidMask: (_x: number, y: number) => (y < 7 ? 0 : -1) },
    { id: 'mod-m2', cols: 20, rows: 25, paletteIdx: 1, weave: weaveCross, solidMask: (x: number) => (x >= 13 ? 1 : -1) },
    { id: 'mod-m3', cols: 20, rows: 20, paletteIdx: 2, weave: weaveBasket, solidMask: (_x: number, y: number) => (y >= 13 ? 0 : -1) },
    { id: 'mod-m4', cols: 20, rows: 20, paletteIdx: 3, weave: weaveTartan, solidMask: (_x: number, y: number) => (y >= 16 ? 1 : -1) },
    { id: 'mod-m5', cols: 20, rows: 20, paletteIdx: 4, weave: weaveBasket, solidMask: (x: number) => (x < 4 ? 0 : -1) },
    { id: 'mod-m6', cols: 20, rows: 20, paletteIdx: 5, weave: weaveTartan, solidMask: (_x: number, y: number) => (y < 4 ? 0 : -1) },
  ];

  MODULES.forEach((mod, modIdx) => {
    const btn = document.getElementById(mod.id);
    if (!btn) return;
    const cell = 4;
    const w = mod.cols * cell;
    const h = mod.rows * cell;
    let palIdx = mod.paletteIdx;
    let phase = 0;
    let timer = 0;

    const draw = () => {
      const [colA, colB] = PALETTES[palIdx];
      let rects = `<rect x="0" y="0" width="${w}" height="${h}" fill="${colA}"/>`;
      for (let y = 0; y < mod.rows; y++) {
        for (let x = 0; x < mod.cols; x++) {
          const mask = mod.solidMask(x, y);
          const tone = mask !== -1 ? mask : mod.weave(x, y, phase);
          if (tone === 1) {
            rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${colB}"/>`;
          }
        }
      }
      btn.innerHTML = `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
    };

    draw();

    btn.addEventListener('click', () => {
      palIdx = (palIdx + 1) % PALETTES.length;
      playBlip(360 + modIdx * 65, 0.06, 'square');
      if (!state.motionOn) {
        phase = (phase + 1) % 6;
        draw();
        return;
      }
      window.clearInterval(timer);
      let steps = 0;
      draw();
      timer = window.setInterval(() => {
        phase = (phase + 1) % 6;
        draw();
        steps++;
        if (steps >= 4) window.clearInterval(timer);
      }, 70);
    });

    btn.addEventListener('mouseenter', () => {
      if (!state.motionOn) return;
      window.clearInterval(timer);
      let steps = 0;
      timer = window.setInterval(() => {
        phase = (phase + 1) % 6;
        draw();
        steps++;
        if (steps >= 3) window.clearInterval(timer);
      }, 85);
    });

    state.routeCleanup.push(() => window.clearInterval(timer));
  });
}

function buildWorksMatrix(container: HTMLElement): void {
  // Build 120-cell interactive pixel matrix: each work occupies a cluster of cells colored by its track!
  const totalCells = 120;
  const cols = window.innerWidth < 768 ? 12 : 24;
  const rows = Math.ceil(totalCells / cols);
  const gap = window.innerWidth >= 1024 ? 2 : 1.5;
  const cell = 10;
  const step = cell + gap;
  const vbW = cols * step - gap;
  const vbH = rows * step - gap;

  const techList = Array.from(new Set(WORKS.flatMap((w) => w.tech)));

  interface MatrixCell {
    idx: number;
    kind: 'work' | 'tech';
    color: string;
    label: string;
    workId?: string;
  }

  const cellsMeta: MatrixCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < WORKS.length * 3) {
      const w = WORKS[Math.floor(i / 3)];
      const tr = trackById(w.track);
      cellsMeta.push({
        idx: i,
        kind: 'work',
        color: tr.chipBg,
        label: `${w.title} (${w.date}) · ${CATEGORY_LABELS[w.cats[0]]} — クリックで詳細へ`,
        workId: w.id,
      });
    } else {
      const tIdx = (i - WORKS.length * 3) % techList.length;
      cellsMeta.push({
        idx: i,
        kind: 'tech',
        color: TOKENS.sodium,
        label: `Tech: ${techList[tIdx]}`,
      });
    }
  }

  let rects = '';
  for (let i = 0; i < totalCells; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = c * step;
    const y = r * step;
    const m = cellsMeta[i];
    if (m.kind === 'tech') {
      rects += `<rect data-ci="${i}" x="${x + 0.5}" y="${y + 0.5}" width="${cell - 1}" height="${cell - 1}" fill="${TOKENS.sodium}" stroke="${TOKENS.ink}" stroke-width="1"/>`;
    } else {
      rects += `<rect data-ci="${i}" x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${TOKENS.sodium}" stroke="${TOKENS.ink}" stroke-width="1"/>`;
    }
  }

  container.innerHTML = `
    <figure class="capacity-fig">
      <div class="capacity-svg-wrap" tabindex="0" role="application" aria-label="23作品と技術スタックのピクセルマトリックス。クリックまたは矢印キーで探索できます。">
        <svg class="capacity-svg" viewBox="0 0 ${vbW} ${vbH}" shape-rendering="crispEdges" aria-hidden="true">${rects}<rect id="cap-focus-ring" x="0" y="0" width="${cell}" height="${cell}" fill="none" stroke="${TOKENS.ink}" stroke-width="2" visibility="hidden"/></svg>
      </div>
      <figcaption class="t-micro" style="margin-top:8px;">(Fig. 1 — ${WORKS.length}作品 × 3セル + ${techList.length}技術スタックのマトリックス。作品マスをクリックすると開きます。)</figcaption>
      <ul class="capacity-legend t-micro">
        ${TRACKS.map((t) => `<li class="legend-item"><span class="legend-swatch" style="background:${t.chipBg}"></span>${esc(t.jpLabel)}</li>`).join('')}
        <li class="legend-item"><span class="legend-swatch" style="background:${TOKENS.sodium}"></span>技術スタック (${techList.length})</li>
      </ul>
    </figure>
  `;

  const svg = container.querySelector('.capacity-svg')!;
  const wrap = container.querySelector('.capacity-svg-wrap') as HTMLElement;
  const focusRing = svg.querySelector('#cap-focus-ring')!;
  const rectEls = Array.from(svg.querySelectorAll('rect[data-ci]'));
  const workCellLimit = WORKS.length * 3;
  let filledCount = 0;

  function paintCell(i: number) {
    const m = cellsMeta[i];
    const el = rectEls[i];
    if (!el) return;
    if (m.kind === 'tech' || i >= filledCount) {
      el.setAttribute('fill', TOKENS.sodium);
      el.setAttribute('stroke', TOKENS.ink);
      el.setAttribute('stroke-width', '1');
    } else {
      el.setAttribute('fill', m.color);
      el.removeAttribute('stroke');
    }
  }

  function fillImmediate() {
    filledCount = workCellLimit;
    for (let i = 0; i < totalCells; i++) paintCell(i);
  }

  if (!state.motionOn) {
    fillImmediate();
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect();
            const timer = window.setInterval(() => {
              const nextEnd = Math.min(workCellLimit, filledCount + 4);
              for (let i = filledCount; i < nextEnd; i++) {
                filledCount = i + 1;
                paintCell(i);
              }
              if (filledCount >= workCellLimit) window.clearInterval(timer);
            }, 24);
            state.routeCleanup.push(() => window.clearInterval(timer));
          }
        }
      },
      { threshold: 0.3 }
    );
    io.observe(svg);
    state.routeCleanup.push(() => io.disconnect());
  }

  svg.addEventListener('pointermove', (e) => {
    const rectEl = (e.target as Element).closest('rect[data-ci]');
    if (!rectEl) {
      hideTip();
      return;
    }
    const idx = Number((rectEl as HTMLElement).dataset.ci);
    showTip(rectEl.getBoundingClientRect(), cellsMeta[idx].label, false);
  });
  svg.addEventListener('pointerleave', hideTip);
  svg.addEventListener('click', (e) => {
    const rectEl = (e.target as Element).closest('rect[data-ci]');
    if (!rectEl) return;
    const idx = Number((rectEl as HTMLElement).dataset.ci);
    const m = cellsMeta[idx];
    if (m.workId) {
      playBlip(680, 0.06);
      window.location.hash = `#/works/${m.workId}`;
    } else {
      playBlip(420, 0.04);
    }
  });

  let keyIdx = 0;
  const showKeyCell = () => {
    const c = keyIdx % cols;
    const r = Math.floor(keyIdx / cols);
    focusRing.setAttribute('x', String(c * step - 1));
    focusRing.setAttribute('y', String(r * step - 1));
    focusRing.setAttribute('width', String(cell + 2));
    focusRing.setAttribute('height', String(cell + 2));
    focusRing.setAttribute('visibility', 'visible');
    showTip(rectEls[keyIdx].getBoundingClientRect(), cellsMeta[keyIdx].label, true);
  };

  wrap.addEventListener('focus', showKeyCell);
  wrap.addEventListener('blur', () => {
    focusRing.setAttribute('visibility', 'hidden');
    hideTip();
  });
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') keyIdx = Math.min(totalCells - 1, keyIdx + 1);
    else if (e.key === 'ArrowLeft') keyIdx = Math.max(0, keyIdx - 1);
    else if (e.key === 'ArrowDown') keyIdx = Math.min(totalCells - 1, keyIdx + cols);
    else if (e.key === 'ArrowUp') keyIdx = Math.max(0, keyIdx - cols);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const m = cellsMeta[keyIdx];
      if (m.workId) window.location.hash = `#/works/${m.workId}`;
      return;
    } else return;
    e.preventDefault();
    showKeyCell();
  });
}
