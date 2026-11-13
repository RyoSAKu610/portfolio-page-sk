import { setSoundEnabled } from './audio';

export type HeroPhysicsMode = 'repel' | 'attract' | 'burst';

export interface AppState {
  motionOn: boolean;
  soundOn: boolean;
  heroPhysics: HeroPhysicsMode;
  worksFilter: {
    cat: string;
    query: string;
    sort: 'date' | 'title';
  };
  archiveFilter: {
    cat: string;
    query: string;
    sortCol: 'date' | 'title';
    sortDir: 'asc' | 'desc';
  };
  badge: {
    name: string;
    grid: string;
  };
  routeCleanup: Array<() => void>;
}

export function esc(str: unknown): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function hashStr(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function easeAssemble(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeMorph(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet(key: string, val: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore storage quota errors
  }
}

export function defaultBadgeGrid(): string {
  const g: string[] = [];
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      if (r >= 2 && r <= 13 && c >= 2 && c <= 13) {
        if ((r === 5 || r === 6) && (c === 5 || c === 6 || c === 9 || c === 10)) {
          g.push('2');
        } else if (r === 10 && c >= 5 && c <= 10) {
          g.push('2');
        } else if (r === 9 && (c === 4 || c === 11)) {
          g.push('2');
        } else if (r === 2 || r === 13 || c === 2 || c === 13) {
          g.push('2');
        } else {
          g.push('3');
        }
      } else {
        g.push('1');
      }
    }
  }
  return g.join('');
}

const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const savedMotion = storageGet<boolean | null>('ryo610.motion', null);

export const state: AppState = {
  motionOn: savedMotion !== null ? Boolean(savedMotion) : !prefersReduced,
  soundOn: false,
  heroPhysics: 'repel',
  worksFilter: {
    cat: 'all',
    query: '',
    sort: 'date',
  },
  archiveFilter: {
    cat: 'all',
    query: '',
    sortCol: 'date',
    sortDir: 'desc',
  },
  badge: storageGet('ryo610.badge', {
    name: 'RyoSAKu610',
    grid: defaultBadgeGrid(),
  }),
  routeCleanup: [],
};

export function applyMotionState(on: boolean): void {
  state.motionOn = on;
  storageSet('ryo610.motion', on);
  document.documentElement.classList.toggle('motion-on', on);
  window.dispatchEvent(new CustomEvent('raster:motionchange', { detail: { on } }));
}

export function applySoundState(on: boolean): void {
  state.soundOn = on;
  setSoundEnabled(on);
  window.dispatchEvent(new CustomEvent('raster:soundchange', { detail: { on } }));
}

// Single shared requestAnimationFrame loop
type MotionCb = (now: number) => void;
const callbacks = new Set<MotionCb>();
let rafId = 0;

function tick(now: number): void {
  rafId = 0;
  if (document.hidden || callbacks.size === 0) return;
  callbacks.forEach((fn) => fn(now));
  if (callbacks.size > 0 && !document.hidden) {
    rafId = window.requestAnimationFrame(tick);
  }
}

export const motion = {
  add(fn: MotionCb): void {
    callbacks.add(fn);
    if (!rafId && !document.hidden) {
      rafId = window.requestAnimationFrame(tick);
    }
  },
  remove(fn: MotionCb): void {
    callbacks.delete(fn);
    if (callbacks.size === 0 && rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  },
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && callbacks.size > 0 && !rafId) {
      rafId = window.requestAnimationFrame(tick);
    }
  });
}

// Shared tooltip helper
export function showTip(rect: DOMRect, text: string, preferAbove = true): void {
  const tipEl = document.getElementById('tip');
  if (!tipEl) return;
  tipEl.textContent = text;
  tipEl.classList.add('is-visible');
  const tw = tipEl.offsetWidth || 160;
  const th = tipEl.offsetHeight || 28;
  const x = Math.max(8, Math.min(window.innerWidth - tw - 8, rect.left + rect.width / 2 - tw / 2));
  let y = preferAbove ? rect.top - th - 6 : rect.bottom + 6;
  if (y < 8) y = rect.bottom + 6;
  if (y + th > window.innerHeight - 8) y = Math.max(8, rect.top - th - 6);
  tipEl.style.left = `${Math.round(x)}px`;
  tipEl.style.top = `${Math.round(y)}px`;
}

export function hideTip(): void {
  const tipEl = document.getElementById('tip');
  if (tipEl) tipEl.classList.remove('is-visible');
}

export function runRouteCleanup(): void {
  while (state.routeCleanup.length > 0) {
    const fn = state.routeCleanup.pop();
    try {
      if (fn) fn();
    } catch {
      // Ignore cleanup errors
    }
  }
  hideTip();
}
