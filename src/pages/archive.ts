import {
  CATEGORY_LABELS,
  SORTED_WORKS,
  WORKS,
  WorkCategory,
  trackById,
} from '../data/works';
import { playBlip } from '../lib/audio';
import { esc, normText, state } from '../lib/runtime';

export function renderArchive(main: HTMLElement): void {
  document.title = 'Archive — RyoSAKu610';
  const cats: Array<WorkCategory | 'all'> = ['all', 'ai', 'research', 'creative', 'web3', 'tool'];

  main.innerHTML = `
    <section class="sub-sec" data-surface="paper" data-pager="Archive">
      <div class="grid">
        <p class="col-1-3 t-micro">(Archive · ${WORKS.length})</p>
        <div class="col-5-12">
          <h1 class="t-h1" tabindex="-1">Full Archive</h1>
          <p class="t-body" style="margin-top:16px;">全${WORKS.length}作品の技術・公開URL・リポジトリ一覧表。キーワードで即座にハイライト検索・並び替えができます。</p>
        </div>

        <div class="col-full talks-controls">
          <div class="talks-search-row">
            <div class="field-group">
              <label class="t-micro" for="arch-search">キーワード検索</label>
              <input class="text-input" type="search" id="arch-search" placeholder="例: Python, PWA, Solana" value="${esc(state.archiveFilter.query)}">
            </div>
            <div class="track-toggles-wrap" id="arch-cat-toggles">
              ${cats
                .map((c) => {
                  const pressed = state.archiveFilter.cat === c;
                  const count = c === 'all' ? WORKS.length : WORKS.filter((w) => w.cats.includes(c)).length;
                  return `<button type="button" class="chip-toggle t-small" data-cat="${c}" aria-pressed="${pressed ? 'true' : 'false'}">${esc(CATEGORY_LABELS[c])} ${count}</button>`;
                })
                .join('')}
            </div>
          </div>
          <p class="t-micro" id="arch-count" aria-live="polite"></p>
        </div>

        <div class="col-full" id="arch-table-wrap"></div>
      </div>
    </section>
  `;

  const searchInput = document.getElementById('arch-search') as HTMLInputElement;
  const catBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('#arch-cat-toggles .chip-toggle'));
  const countEl = document.getElementById('arch-count')!;
  const wrapEl = document.getElementById('arch-table-wrap')!;

  function highlightText(text: string, query: string): string {
    if (!query) return esc(text);
    const normQ = normText(query.trim());
    if (!normQ) return esc(text);
    const rawChars = Array.from(text);
    const normChars = rawChars.map((c) => normText(c));
    const flatNorm = normChars.join('');
    let idx = flatNorm.indexOf(normQ);
    if (idx === -1) return esc(text);

    const mapStart: number[] = [];
    for (let i = 0; i < rawChars.length; i++) {
      for (let k = 0; k < normChars[i].length; k++) mapStart.push(i);
    }
    mapStart.push(rawChars.length);

    let out = '';
    let pos = 0;
    while (idx !== -1) {
      const rawS = mapStart[idx];
      const rawE = mapStart[idx + normQ.length];
      out += esc(rawChars.slice(pos, rawS).join(''));
      out += `<mark>${esc(rawChars.slice(rawS, rawE).join(''))}</mark>`;
      pos = rawE;
      idx = flatNorm.indexOf(normQ, idx + normQ.length);
    }
    out += esc(rawChars.slice(pos).join(''));
    return out;
  }

  function renderTable() {
    const q = normText(state.archiveFilter.query.trim());
    const list = SORTED_WORKS.filter((w) => {
      if (state.archiveFilter.cat !== 'all' && !w.cats.includes(state.archiveFilter.cat as WorkCategory)) {
        return false;
      }
      if (q) {
        const hay = normText(`${w.title} ${w.sub} ${w.summary} ${w.tech.join(' ')}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = state.archiveFilter.sortDir === 'asc' ? 1 : -1;
    const col = state.archiveFilter.sortCol;
    list.sort((a, b) => {
      if (col === 'title') return a.title.localeCompare(b.title) * dir;
      return a.date.localeCompare(b.date) * dir;
    });

    countEl.textContent = `${list.length} / ${WORKS.length} 作品`;

    if (list.length === 0) {
      wrapEl.innerHTML = `
        <div class="schedule-empty">
          <p class="t-lead">「${esc(state.archiveFilter.query)}」に一致する作品はありません。</p>
          <button type="button" class="btn-text t-small u-anim" id="arch-clear-btn">(検索をクリア)</button>
        </div>
      `;
      document.getElementById('arch-clear-btn')?.addEventListener('click', () => {
        state.archiveFilter.query = '';
        state.archiveFilter.cat = 'all';
        searchInput.value = '';
        catBtns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === 'all' ? 'true' : 'false'));
        renderTable();
      });
      return;
    }

    const triSvg = (activeCol: string) => {
      if (state.archiveFilter.sortCol !== activeCol) return '';
      const up = state.archiveFilter.sortDir === 'asc';
      return `<svg width="10" height="6" viewBox="0 0 5 3" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${
        up
          ? '<rect x="2" y="0" width="1" height="1"/><rect x="1" y="1" width="3" height="1"/><rect x="0" y="2" width="5" height="1"/>'
          : '<rect x="0" y="0" width="5" height="1"/><rect x="1" y="1" width="3" height="1"/><rect x="2" y="2" width="1" height="1"/>'
      }</svg>`;
    };

    wrapEl.innerHTML = `
      <table class="data-table responsive-table talks-table">
        <caption class="t-micro">全作品アーカイブ</caption>
        <thead>
          <tr>
            <th class="t-micro"><button type="button" class="sort-btn t-micro" data-sort="date">更新 ${triSvg('date')}</button></th>
            <th class="t-micro"><button type="button" class="sort-btn t-micro" data-sort="title">作品 ${triSvg('title')}</button></th>
            <th class="t-micro">領域</th>
            <th class="t-micro">使った技術</th>
            <th class="t-micro">リンク</th>
          </tr>
        </thead>
        <tbody>
          ${list
            .map((w) => {
              const tr = trackById(w.track);
              return `
                <tr class="talk-row">
                  <td data-label="更新" class="t-small tnum">${esc(w.date)}</td>
                  <td data-label="作品" class="t-small fw-600">
                    <a class="u-anim" href="#/works/${esc(w.id)}">${highlightText(w.title, state.archiveFilter.query)}</a>
                    <div class="t-micro" style="font-weight:400;opacity:0.75;margin-top:2px;">${highlightText(w.sub, state.archiveFilter.query)}</div>
                  </td>
                  <td data-label="領域" class="t-small"><span class="track-chip" style="background:${tr.chipBg};color:${tr.chipFg}">${esc(tr.jpLabel)}</span></td>
                  <td data-label="使った技術" class="t-small">${w.tech.map((t) => highlightText(t, state.archiveFilter.query)).join(' · ')}</td>
                  <td data-label="リンク" class="t-small" style="white-space:nowrap;">
                    <div style="display:flex;gap:12px;flex-wrap:wrap;">
                      <a class="u-anim" href="#/works/${esc(w.id)}">詳細</a>
                      ${w.links.live ? `<a class="u-anim fw-600" href="${esc(w.links.live)}" target="_blank" rel="noopener">LIVE ↗</a>` : ''}
                      ${w.links.repo ? `<a class="u-anim" href="${esc(w.links.repo)}" target="_blank" rel="noopener">GitHub ↗</a>` : ''}
                    </div>
                  </td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    `;

    wrapEl.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = btn.dataset.sort as 'date' | 'title';
        if (state.archiveFilter.sortCol === c) {
          state.archiveFilter.sortDir = state.archiveFilter.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.archiveFilter.sortCol = c;
          state.archiveFilter.sortDir = c === 'date' ? 'desc' : 'asc';
        }
        renderTable();
      });
    });
  }

  searchInput.addEventListener('input', () => {
    state.archiveFilter.query = searchInput.value;
    renderTable();
  });

  catBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      playBlip(540, 0.04);
      state.archiveFilter.cat = btn.dataset.cat || 'all';
      catBtns.forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
      renderTable();
    });
  });

  renderTable();
}
