(function initPetLiveWebShellObservationWorkspace(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  const MARKUP = `<main class="shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">觀察筆記本</span>
        <h1>健康觀察圖表</h1>
      </div>
      <span class="demo-badge">純淨試用</span>
    </header>

    <div class="workspace">
      <section class="main-column" aria-label="圖表工作區">
        <article class="panel">
          <div class="toolbar" id="chartToolbar">
            <div class="segmented" id="modeSegmented" role="group" aria-label="時間尺度">
              <button class="segment" type="button" data-mode="day" aria-pressed="false">每日</button>
              <button class="segment" type="button" data-mode="week" aria-pressed="true">每週</button>
              <button class="segment" type="button" data-mode="month" aria-pressed="false">每月</button>
              <button class="segment" type="button" data-mode="year" aria-pressed="false">每年</button>
            </div>

            <div class="controls">
              <div class="field field-metric-bound" id="metricSelectField" hidden>
                <label for="metricSelect">主要觀察指標</label>
                <select id="metricSelect" autocomplete="off"></select>
              </div>
              <div class="field" id="boundMetricField" hidden>
                <span class="chart-title-edit-label">串接就診／指標</span>
                <div class="bound-metric-label" id="boundMetricLabel">—</div>
              </div>
            </div>
          </div>

          <div class="chart-head">
            <div class="chart-title-block" style="width:100%">
              <div class="chart-title-row">
                <div class="chart-title-name">
                  <input
                    class="project-name-input"
                    id="projectNameInput"
                    type="text"
                    maxlength="80"
                    autocomplete="off"
                    aria-label="專案名稱"
                    placeholder="新建專案"
                    disabled
                    readonly
                  />
                  <button
                    type="button"
                    class="project-name-edit"
                    id="projectNameEditBtn"
                    hidden
                    aria-label="編輯專案名稱"
                    title="編輯專案名稱"
                  >
                    <span aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="14" height="14" focusable="false">
                        <path d="M14.1 4.2l5.7 5.7-11.2 11.2H2.9v-5.7L14.1 4.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                        <path d="M12.2 6.1l5.7 5.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                      </svg>
                    </span>
                  </button>
                </div>
                <div class="project-menu-wrap">
                  <button
                    type="button"
                    class="project-menu-btn"
                    id="projectMenuBtn"
                    aria-haspopup="true"
                    aria-expanded="false"
                    aria-controls="projectMenu"
                    title="專案選單"
                  >⋯</button>
                  <div class="project-menu" id="projectMenu" role="menu" data-open="false">
                    <button type="button" role="menuitem" data-project-action="select">選擇就診</button>
                    <button type="button" role="menuitem" data-project-action="pick">選擇專案</button>
                  </div>
                </div>
              </div>
              <div id="metricFocusRow" class="metric-focus-row" hidden></div>
              <p id="chartBoundMeta" class="chart-bound-meta" hidden></p>
              <p id="chartSubtitle" hidden></p>
              <p id="visitJump" hidden>
                <span id="visitJumpLabel"></span>
                <button type="button" class="visit-jump-btn" id="visitJumpBtn">前往時間軸就診</button>
              </p>
            </div>
          </div>

          <div class="empty-state" id="emptyState" data-show="false" role="status">
            <p id="emptyStateCopy">尚未有專案。用 ⋯ 選擇就診或專案，或到下方新增指標。</p>
            <button type="button" class="empty-cta" id="emptyCreateProjectCta">選擇就診</button>
          </div>

          <div class="chart-wrap" id="mainChartWrap" data-empty="false">
            <svg id="mainChart" viewBox="0 0 360 420" role="img" aria-labelledby="projectNameInput"></svg>
            <div class="tooltip" id="tooltip" role="status" aria-live="polite"></div>
          </div>

          <div class="legend-row" id="chartLegendRow" aria-label="圖例" hidden>
            <span class="legend-item" id="currentLegend">
              <span class="legend-line" id="currentLegendLine"></span>
              <span id="currentLegendLabel">—</span>
            </span>
            <span class="legend-item" id="diaryLegend">
              <span class="legend-dot" id="diaryLegendDot"></span>
              <span id="diaryLegendLabel">—</span>
            </span>
          </div>
        </article>

        <div class="persist-bar" aria-label="寵物">
          <div class="field" style="flex:1 1 140px; min-width:0">
            <label for="tryoutPetSelect">寵物</label>
            <select id="tryoutPetSelect" autocomplete="off"></select>
          </div>
          <button class="btn secondary" type="button" id="clearPersistBtn" style="align-self:flex-end">清除試用儲存</button>
          <p class="hint" id="persistStatus" style="flex:1 1 100%; margin:0; color:#146d65; font-size:0.78rem; font-weight:700" role="status" aria-live="polite"></p>
        </div>

        <article class="panel metric-board" id="metricBoard" aria-label="自定觀察指標看板">
          <div class="metric-board-head">
            <div>
              <h2>自定觀察指標<span class="metric-board-pet" id="metricBoardPetNote" hidden></span></h2>
              <p class="metric-board-hint">點卡片看主圖。要多軌比較，點「一起看」，或先點上方「觀察總版」再選要一起看的指標。</p>
            </div>
            <button class="btn" type="button" id="metricBoardAddBtn">新增</button>
          </div>
          <div class="empty-state" id="metricBoardEmpty" data-show="true" role="status">
            <p>尚未有自定指標。新增一個開始觀察。</p>
            <button type="button" class="empty-cta" id="metricBoardEmptyCta">新增指標</button>
          </div>
          <div class="metric-board-list" id="metricBoardList"></div>
        </article>
      </section>
    </div>
  </main>

  <div class="sheet-backdrop" id="projectSheet" data-open="false" hidden>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="projectSheetTitle">
      <h3 id="projectSheetTitle">專案</h3>
      <div id="projectSheetBody"></div>
      <div class="sheet-actions" id="projectSheetActions"></div>
    </div>
  </div>
`;

  function mountObservationWorkspace(host, opts) {
    if (!host) return null;
    const input = opts || {};
    host.classList.add("obs-workspace");
    if (input.embedded) host.classList.add("is-passport");
    else host.classList.remove("is-passport");
    if (!host.querySelector("#tryoutPetSelect")) {
      host.innerHTML = MARKUP;
    } else {
      placePersistBarAfterChart(host);
      ensureTitleEditChrome(host);
    }
    return host;
  }

  const TITLE_EDIT_SVG =
    '<span aria-hidden="true">' +
    '<svg viewBox="0 0 24 24" width="14" height="14" focusable="false">' +
    '<path d="M14.1 4.2l5.7 5.7-11.2 11.2H2.9v-5.7L14.1 4.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />' +
    '<path d="M12.2 6.1l5.7 5.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />' +
    "</svg></span>";

  function ensureTitleEditChrome(host) {
    const row = host.querySelector(".chart-title-row");
    const input = host.querySelector("#projectNameInput");
    if (!row || !input) return;
    input.setAttribute("readonly", "");
    let nameWrap = host.querySelector(".chart-title-name");
    if (!nameWrap) {
      nameWrap = document.createElement("div");
      nameWrap.className = "chart-title-name";
      row.insertBefore(nameWrap, input);
      nameWrap.appendChild(input);
    } else if (input.parentElement !== nameWrap) {
      nameWrap.insertBefore(input, nameWrap.firstChild);
    }
    if (!host.querySelector("#projectNameEditBtn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "project-name-edit";
      btn.id = "projectNameEditBtn";
      btn.hidden = true;
      btn.setAttribute("aria-label", "編輯專案名稱");
      btn.title = "編輯專案名稱";
      btn.innerHTML = TITLE_EDIT_SVG;
      nameWrap.appendChild(btn);
    }
    const boundField = host.querySelector("#boundMetricField");
    if (boundField) boundField.hidden = true;
    if (!host.querySelector("#chartBoundMeta")) {
      const meta = document.createElement("p");
      meta.id = "chartBoundMeta";
      meta.className = "chart-bound-meta";
      meta.hidden = true;
      const subtitle = host.querySelector("#chartSubtitle");
      if (subtitle && subtitle.parentNode) {
        subtitle.parentNode.insertBefore(meta, subtitle);
      } else {
        row.parentNode.appendChild(meta);
      }
    }
  }

  function placePersistBarAfterChart(host) {
    const bar = host.querySelector(".persist-bar");
    const column = host.querySelector(".main-column");
    const board = host.querySelector("#metricBoard");
    if (!bar || !column || !board) return;
    if (bar.parentElement === column && bar.nextElementSibling === board) return;
    column.insertBefore(bar, board);
  }

  root.shell.mountObservationWorkspace = mountObservationWorkspace;
})(typeof window !== "undefined" ? window : globalThis);
