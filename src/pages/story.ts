import { PROFILE, WORKS } from '../data/works';
import { svgBitmapText } from '../lib/bitmapFont';
import { initSpriteCanvas } from '../lib/pixelSprites';
import { esc } from '../lib/runtime';

export function renderStory(main: HTMLElement): void {
  document.title = 'Story — RyoSAKu610';

  const phantomLineage = WORKS.filter((w) => w.series === 'phantom').sort((a, b) => a.date.localeCompare(b.date));
  const mythosLineage = WORKS.filter((w) => w.series === 'mythos').sort((a, b) => a.date.localeCompare(b.date));

  main.innerHTML = `
    <section class="sub-sec" data-surface="paper" data-pager="Lineage">
      <div class="grid">
        <p class="col-1-3 t-micro">(Story — ひとつのアイデアを育てる)</p>
        <div class="col-5-12">
          <h1 class="t-h1" tabindex="-1">Lineage & Principles</h1>
          <p class="t-body" style="margin-top:16px;">単発で終わらせず、ひとつの核となるアイデアを異なる表現・仕組みへ育ててきた系譜と、すべての制作で守っている4つの原則です。</p>
        </div>
      </div>

      <div class="grid days-cols" style="margin-top:64px;">
        <div class="day-col-wide">
          ${svgBitmapText('01', 8, '#0A0A0A', { className: 'day-num-svg', ariaHidden: true, bold: true })}
          <h2 class="t-lead">ResearchPhantom の系譜</h2>
          <p class="t-small" style="margin-top:8px;opacity:0.85;">「最新の研究を、毎日・誰でも・楽しく」。Webアプリから、本・ポッドキャスト・ゲームへ広がりました。</p>
          <div class="day-session-list" style="margin-top:24px;">
            ${phantomLineage
              .map(
                (w) => `
                <a class="day-session-row lineage-row" href="#/works/${esc(w.id)}" data-track="${esc(w.track)}">
                  <div class="lineage-thumb"><canvas class="portrait-canvas" data-st="${esc(w.id)}" aria-hidden="true"></canvas></div>
                  <div>
                    <div class="t-micro tnum">${esc(w.date)}</div>
                    <div class="t-small day-session-title">${esc(w.title)} — ${esc(w.sub)}</div>
                    <p class="t-micro" style="margin-top:4px;opacity:0.85;">${esc(w.summary)}</p>
                  </div>
                </a>`
              )
              .join('')}
          </div>
        </div>

        <div class="day-col-wide">
          ${svgBitmapText('02', 8, '#0A0A0A', { className: 'day-num-svg', ariaHidden: true, bold: true })}
          <h2 class="t-lead">NEON MYTHOS の系譜</h2>
          <p class="t-small" style="margin-top:8px;opacity:0.85;">「AIエージェントの仕事を目に見えるように」。試作から、遊べる街と経済の土台まで育てました。</p>
          <div class="day-session-list" style="margin-top:24px;">
            ${mythosLineage
              .map(
                (w) => `
                <a class="day-session-row lineage-row" href="#/works/${esc(w.id)}" data-track="${esc(w.track)}">
                  <div class="lineage-thumb"><canvas class="portrait-canvas" data-st="${esc(w.id)}" aria-hidden="true"></canvas></div>
                  <div>
                    <div class="t-micro tnum">${esc(w.date)}</div>
                    <div class="t-small day-session-title">${esc(w.title)} — ${esc(w.sub)}</div>
                    <p class="t-micro" style="margin-top:4px;opacity:0.85;">${esc(w.summary)}</p>
                  </div>
                </a>`
              )
              .join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="sec" data-surface="ink" data-pager="How I build">
      <div class="grid">
        <p class="col-1-3 t-micro">(How I build — 作り方)</p>
        <h2 class="col-5-12 t-h2 t-paper">速く作るための、止まらない4つの設計ルール。</h2>
      </div>
      <div class="grid principles-grid" style="margin-top:48px;">
        ${PROFILE.principles
          .map(
            (p) => `
            <article class="principle-card">
              <div class="t-micro tnum" style="color:var(--sodium);">${esc(p.num)}</div>
              <h3 class="t-lead t-paper" style="margin-top:10px;">${esc(p.title)}</h3>
              <p class="t-body" style="margin-top:12px;color:rgba(255,255,255,0.84);">${esc(p.desc)}</p>
            </article>`
          )
          .join('')}
      </div>
    </section>
  `;

  [...phantomLineage, ...mythosLineage].forEach((w) => {
    const canvas = main.querySelector<HTMLCanvasElement>(`canvas[data-st="${w.id}"]`);
    if (canvas) initSpriteCanvas(canvas, w);
  });
}
