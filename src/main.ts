import '../index.css';
import { PROFILE, TOKENS, TRAIL_COLORS } from './data/works';
import { playBlip } from './lib/audio';
import { svgBitmapText } from './lib/bitmapFont';
import { initTrailCanvas, playPixelWipe } from './lib/canvasEffects';
import {
  applyMotionState,
  applySoundState,
  esc,
  runRouteCleanup,
  state,
} from './lib/runtime';
import { renderArchive } from './pages/archive';
import { renderHome } from './pages/home';
import { renderPlayground } from './pages/playground';
import { renderStory } from './pages/story';
import { renderWorkDetail, renderWorks } from './pages/works';

const NAV_ITEMS = [
  { label: 'Works', href: '#/works' },
  { label: 'Story', href: '#/story' },
  { label: 'Archive', href: '#/archive' },
  { label: 'Playground', href: '#/playground' },
];

function buildHeaderAndFooter(): void {
  const logoLink = document.getElementById('header-logo-link');
  if (logoLink) {
    logoLink.innerHTML = svgBitmapText('RYO/610', 3, 'currentColor', {
      className: 'logo-svg',
      label: 'RyoSAKu610, front page',
      bold: true,
    });
  }

  const nav = document.getElementById('header-nav');
  if (nav) {
    nav.innerHTML = NAV_ITEMS.map(
      (n) => `<a class="nav-link t-small u-anim" href="${n.href}" data-nav="${n.href}">${esc(n.label)}</a>`
    ).join('');
  }

  const menuNav = document.getElementById('menu-nav');
  if (menuNav) {
    menuNav.innerHTML = [
      { label: 'Top', href: '#/' },
      ...NAV_ITEMS,
    ]
      .map((n) => `<a class="t-h1 u-anim" href="${n.href}" data-nav="${n.href}">${esc(n.label)}</a>`)
      .join('');
  }

  const footer = document.getElementById('site-footer');
  if (footer) {
    const stairWidth = 720;
    const stepW = 15;
    let stairRects = '';
    for (let i = 0; i < stairWidth / stepW; i++) {
      stairRects += `<rect x="${i * stepW}" y="0" width="${stepW}" height="8" fill="${TRAIL_COLORS[i % TRAIL_COLORS.length]}"/>`;
    }

    footer.innerHTML = `
      <div class="grid">
        <div class="col-full">
          ${svgBitmapText('RYO/610', 18, TOKENS.sodium, { className: 'footer-logo-svg', ariaHidden: true, bold: true })}
        </div>
      </div>
      <div class="grid footer-cols">
        <div class="footer-block">
          <p class="t-micro footer-block-head">(Builder)</p>
          <p class="t-small t-paper">${esc(PROFILE.handle)}</p>
          <p class="t-small" style="margin-top:4px;">${esc(PROFILE.role)}</p>
          <p class="t-micro" style="margin-top:8px;">${esc(PROFILE.tagline)}</p>
        </div>
        <div class="footer-block">
          <p class="t-micro footer-block-head">(Pages)</p>
          <ul class="footer-nav-list t-small t-paper">
            <li><a class="u-anim" href="#/">Top</a></li>
            ${NAV_ITEMS.map((n) => `<li><a class="u-anim" href="${n.href}">${esc(n.label)}</a></li>`).join('')}
          </ul>
        </div>
        <div class="footer-block">
          <p class="t-micro footer-block-head">(GitHub & Live)</p>
          <ul class="footer-nav-list t-small t-paper">
            <li><a class="u-anim" href="${esc(PROFILE.githubPrimary)}" target="_blank" rel="noopener">GitHub: RyoSAKu610 ↗</a></li>
            <li><a class="u-anim" href="${esc(PROFILE.githubSecondary)}" target="_blank" rel="noopener">GitHub: howly23v ↗</a></li>
            <li><a class="u-anim" href="https://howly23v.github.io/ResearchPhantom/" target="_blank" rel="noopener">ResearchPhantom ↗</a></li>
            <li><a class="u-anim" href="https://ryosaku610.github.io/AI-Agent-market-simulator/" target="_blank" rel="noopener">NEON MYTHOS ↗</a></li>
          </ul>
        </div>
        <div class="footer-block">
          <p class="t-micro footer-block-head">(Controls)</p>
          <div style="display:flex;flex-direction:column;align-items:flex-start;gap:8px;">
            <button type="button" class="btn-text t-small u-anim" id="footer-motion-btn">Motion: ${state.motionOn ? 'ON' : 'OFF'}</button>
            <button type="button" class="btn-text t-small u-anim" id="footer-sound-btn">8-bit Sound: ${state.soundOn ? 'ON' : 'OFF'}</button>
          </div>
        </div>
      </div>
      <div class="grid footer-bottom">
        <p class="t-micro footer-honesty">HTML / CSS / TypeScript + Canvas & WebAudio. フォントは Archivo と Zen Kaku Gothic New。</p>
        <p class="t-micro tnum footer-ver">RYOSAKU/610 · 2026</p>
      </div>
      <svg class="footer-staircase" viewBox="0 0 ${stairWidth} 8" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">${stairRects}</svg>
    `;

    const fmBtn = document.getElementById('footer-motion-btn')!;
    const fsBtn = document.getElementById('footer-sound-btn')!;
    const syncFooterBtns = () => {
      fmBtn.textContent = `Motion: ${state.motionOn ? 'ON' : 'OFF'}`;
      fsBtn.textContent = `8-bit Sound: ${state.soundOn ? 'ON' : 'OFF'}`;
    };
    fmBtn.addEventListener('click', () => {
      applyMotionState(!state.motionOn);
      syncFooterBtns();
    });
    fsBtn.addEventListener('click', () => {
      applySoundState(!state.soundOn);
      syncFooterBtns();
      if (state.soundOn) playBlip(580, 0.06);
    });
    window.addEventListener('raster:motionchange', syncFooterBtns);
    window.addEventListener('raster:soundchange', syncFooterBtns);
  }
}

function updateNavActive(route: string): void {
  const base =
    route === '/'
      ? '#/'
      : route.startsWith('/works')
        ? '#/works'
        : route.startsWith('/story')
          ? '#/story'
          : route.startsWith('/archive')
            ? '#/archive'
            : route.startsWith('/playground')
              ? '#/playground'
              : '#/';

  document.querySelectorAll<HTMLElement>('[data-nav]').forEach((a) => {
    if (a.dataset.nav === base) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function setupSurfaceObservers(): void {
  const header = document.getElementById('site-header')!;
  const topBtn = document.getElementById('top-btn')!;
  const surfaceEls = Array.from(document.querySelectorAll<HTMLElement>('main [data-surface], footer[data-surface]'));

  const syncSurfacesAtScroll = () => {
    const hh = header.getBoundingClientRect().height || 64;
    const topY = hh + 4;
    const botY = window.innerHeight - 20;
    for (const el of surfaceEls) {
      const r = el.getBoundingClientRect();
      if (r.top <= topY && r.bottom >= topY) {
        const surf = el.getAttribute('data-surface');
        if (surf) header.setAttribute('data-surface', surf);
      }
      if (r.top <= botY && r.bottom >= botY) {
        const surf = el.getAttribute('data-surface');
        if (surf) topBtn.setAttribute('data-surface', surf);
      }
    }
    topBtn.classList.toggle('is-visible', window.scrollY >= window.innerHeight * 0.75);
  };

  window.addEventListener('scroll', syncSurfacesAtScroll, { passive: true });
  state.routeCleanup.push(() => window.removeEventListener('scroll', syncSurfacesAtScroll));
  syncSurfacesAtScroll();

  // Stepped reveals
  const revealEls = Array.from(document.querySelectorAll('.reveal-text, .reveal-block'));
  if (!state.motionOn) {
    revealEls.forEach((el) => {
      el.classList.remove('is-pending');
      el.classList.add('is-shown');
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-pending'));
    const revealIO = new IntersectionObserver(
      (entries) => {
        let batch = 0;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = Math.min(batch, 6) * 35;
            batch++;
            window.setTimeout(() => {
              el.classList.remove('is-pending');
              el.classList.add('is-shown');
            }, delay);
            revealIO.unobserve(el);
          }
        }
      },
      { threshold: 0.1 }
    );
    revealEls.forEach((el) => revealIO.observe(el));
    state.routeCleanup.push(() => revealIO.disconnect());
  }
}

let isFirstRoute = true;

function parseRoute(): string {
  const h = window.location.hash || '#/';
  return h.startsWith('#') ? h.slice(1) || '/' : '/';
}

function renderRoute(): void {
  const main = document.getElementById('main')!;
  const route = parseRoute();

  const performSwitch = () => {
    runRouteCleanup();
    main.innerHTML = '';

    if (route === '/' || route === '') {
      renderHome(main);
    } else if (route === '/works') {
      renderWorks(main);
    } else if (route.startsWith('/works/')) {
      renderWorkDetail(main, route.slice('/works/'.length));
    } else if (route === '/story') {
      renderStory(main);
    } else if (route === '/archive') {
      renderArchive(main);
    } else if (route === '/playground') {
      renderPlayground(main);
    } else {
      renderHome(main);
    }

    updateNavActive(route);
    setupSurfaceObservers();
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (!isFirstRoute) {
      const h1 = main.querySelector('h1');
      if (h1 instanceof HTMLElement) h1.focus({ preventScroll: true });
    }
    isFirstRoute = false;
  };

  if (isFirstRoute) {
    performSwitch();
  } else {
    playPixelWipe(performSwitch);
  }
}

function setupGlobalControls(): void {
  const menuOverlay = document.getElementById('menu')!;
  const openBtn = document.getElementById('menu-open-btn')!;
  const closeBtn = document.getElementById('menu-close-btn')!;

  const closeMenu = () => {
    menuOverlay.classList.remove('is-open');
    document.documentElement.classList.remove('menu-open');
    openBtn.setAttribute('aria-expanded', 'false');
  };

  openBtn.addEventListener('click', () => {
    menuOverlay.classList.add('is-open');
    document.documentElement.classList.add('menu-open');
    openBtn.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
  });
  closeBtn.addEventListener('click', () => {
    closeMenu();
    openBtn.focus();
  });
  menuOverlay.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

  const mobileMotionBtn = document.getElementById('motion-toggle-mobile');
  if (mobileMotionBtn) {
    const syncM = () => {
      mobileMotionBtn.textContent = `(Motion: ${state.motionOn ? 'on' : 'off'})`;
      mobileMotionBtn.setAttribute('aria-pressed', state.motionOn ? 'true' : 'false');
    };
    syncM();
    mobileMotionBtn.addEventListener('click', () => {
      applyMotionState(!state.motionOn);
      syncM();
    });
  }

  document.getElementById('top-btn')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: state.motionOn ? 'smooth' : 'auto' });
    playBlip(620, 0.04);
  });
}

applyMotionState(state.motionOn);
buildHeaderAndFooter();
setupGlobalControls();
initTrailCanvas();
window.addEventListener('hashchange', renderRoute);
renderRoute();
