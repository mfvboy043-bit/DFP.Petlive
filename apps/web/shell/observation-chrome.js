(function initPetLiveWebShellObservationChrome(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  function drawMetricSpark(points, color) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "metric-board-spark");
    svg.setAttribute("viewBox", "0 0 72 28");
    svg.setAttribute("width", "56");
    svg.setAttribute("height", "22");
    svg.setAttribute("aria-hidden", "true");
    const list = Array.isArray(points) ? points : [];
    if (!list.length) return svg;
    const d = list
      .map(function (point, index) {
        const x = 2 + Number(point.x) * 68;
        const y = 2 + Number(point.y) * 24;
        return (index === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      })
      .join(" ");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color || "#1487bd");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  function createObservationChrome(document) {
    const projectMenuBtn = document.getElementById("projectMenuBtn");
    const projectMenu = document.getElementById("projectMenu");
    const projectSheet = document.getElementById("projectSheet");
    const projectSheetTitle = document.getElementById("projectSheetTitle");
    const projectSheetBody = document.getElementById("projectSheetBody");
    const projectSheetActions = document.getElementById("projectSheetActions");
    const projectNameInput = document.getElementById("projectNameInput");
    const projectNameEditBtn = document.getElementById("projectNameEditBtn");
    const chartBoundMeta = document.getElementById("chartBoundMeta");
    const metricBoardList = document.getElementById("metricBoardList");
    const metricBoardEmpty = document.getElementById("metricBoardEmpty");
    const metricBoardAddBtn = document.getElementById("metricBoardAddBtn");
    const metricBoardEmptyCta = document.getElementById("metricBoardEmptyCta");
    const emptyState = document.getElementById("emptyState");
    const emptyStateCopy = document.getElementById("emptyStateCopy");
    const emptyCreateProjectCta = document.getElementById("emptyCreateProjectCta");
    const chartWrap = document.getElementById("mainChartWrap");
    const tooltip = document.getElementById("tooltip");
    const chartToolbar = document.getElementById("chartToolbar");
    const boundMetricLabel = document.getElementById("boundMetricLabel");
    const visitJump = document.getElementById("visitJump");
    const visitJumpLabel = document.getElementById("visitJumpLabel");
    let sheetKind = "";

    function setMenuOpen(open) {
      if (!projectMenu || !projectMenuBtn) return;
      projectMenu.setAttribute("data-open", open ? "true" : "false");
      projectMenuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function closeSheet() {
      if (!projectSheet) return;
      projectSheet.setAttribute("data-open", "false");
      projectSheet.hidden = true;
      sheetKind = "";
      if (projectSheetActions) projectSheetActions.style.gridTemplateColumns = "";
    }

    function openSheet(title, kind) {
      if (!projectSheet) return;
      if (projectSheetTitle) projectSheetTitle.textContent = title;
      projectSheet.hidden = false;
      projectSheet.setAttribute("data-open", "true");
      sheetKind = kind || "";
      setMenuOpen(false);
    }

    function isSheetOpen() {
      return !!(projectSheet && projectSheet.getAttribute("data-open") === "true" && !projectSheet.hidden);
    }

    function getSheetKind() {
      return sheetKind;
    }

    function clearSheet() {
      if (projectSheetBody) projectSheetBody.replaceChildren();
      if (projectSheetActions) {
        projectSheetActions.replaceChildren();
        projectSheetActions.style.gridTemplateColumns = "";
      }
    }

    function endTitleEdit() {
      if (!projectNameInput) return;
      projectNameInput.readOnly = true;
      projectNameInput.classList.remove("is-editing");
    }

    function startTitleEdit() {
      if (!projectNameInput || projectNameInput.disabled) return;
      projectNameInput.readOnly = false;
      projectNameInput.classList.add("is-editing");
      window.setTimeout(function () {
        if (!projectNameInput || projectNameInput.disabled) return;
        projectNameInput.readOnly = false;
        projectNameInput.classList.add("is-editing");
        projectNameInput.focus();
        projectNameInput.select();
      }, 0);
    }

    function paintTitle(input) {
      if (!projectNameInput) return;
      const cfg = input || {};
      const editing = document.activeElement === projectNameInput && !projectNameInput.readOnly;
      if (!cfg.hasProject) {
        projectNameInput.value = "";
        projectNameInput.placeholder = "新建專案";
        projectNameInput.disabled = true;
        endTitleEdit();
        if (projectNameEditBtn) {
          projectNameEditBtn.hidden = true;
          projectNameEditBtn.disabled = true;
        }
        return;
      }
      projectNameInput.disabled = false;
      projectNameInput.placeholder = cfg.isVisitLinked ? "觀察圖表名稱" : "專案名稱";
      if (!editing) {
        projectNameInput.value = cfg.title || "";
        endTitleEdit();
      }
      if (projectNameEditBtn) {
        projectNameEditBtn.hidden = false;
        projectNameEditBtn.disabled = false;
      }
    }

    function paintMetricFocus(input) {
      let row = document.getElementById("metricFocusRow");
      if (!row) {
        const block = document.querySelector(".chart-title-block");
        const bound = document.getElementById("chartBoundMeta");
        if (!block) return;
        row = document.createElement("div");
        row.id = "metricFocusRow";
        row.className = "metric-focus-row";
        if (bound && bound.parentNode === block) block.insertBefore(row, bound);
        else block.appendChild(row);
      }
      const cfg = input || {};
      const chips = Array.isArray(cfg.chips) ? cfg.chips : [];
      row.hidden = !!cfg.hidden || !chips.length;
      row.replaceChildren();
      if (!row.hidden && cfg.showOverview) {
        const overview = document.createElement("button");
        overview.type = "button";
        overview.className = "metric-focus-chip metric-focus-overview";
        overview.setAttribute("data-overview", "true");
        overview.setAttribute("aria-pressed", cfg.overview ? "true" : "false");
        overview.textContent = "觀察總版";
        row.appendChild(overview);
      }
      chips.forEach(function (chip) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "metric-focus-chip";
        btn.setAttribute("data-focus-metric-id", chip.metricId);
        btn.setAttribute("aria-pressed", chip.active ? "true" : "false");
        btn.textContent = chip.name;
        row.appendChild(btn);
      });
    }

    function paintLegend(input) {
      const row = document.getElementById("chartLegendRow");
      if (!row) return;
      const cfg = input || {};
      const tracks = Array.isArray(cfg.tracks)
        ? cfg.tracks.filter(function (track) {
            return track && track.meta && !track.empty;
          })
        : [];
      const project = cfg.project;
      const meta = cfg.meta;
      if (!tracks.length && (!meta || !project)) {
        row.hidden = true;
        row.replaceChildren();
        return;
      }
      row.hidden = false;
      row.replaceChildren();
      const items = tracks.length
        ? tracks
        : [
            {
              name: cfg.isSelfMetric
                ? String(project.name || meta.label || "指標").trim() || "指標"
                : "本期",
              meta: meta,
            },
          ];
      items.forEach(function (track) {
        const trackMeta = track.meta || {};
        const color = trackMeta.color || "#1487bd";
        const item = document.createElement("span");
        item.className = "legend-item";
        const line = document.createElement("span");
        line.className = "legend-line";
        line.style.background = color;
        const label = document.createElement("span");
        const name = String(track.name || trackMeta.label || "指標").trim() || "指標";
        const unit = trackMeta.unit ? "（" + trackMeta.unit + "）" : "";
        label.textContent = name + unit;
        item.appendChild(line);
        item.appendChild(label);
        row.appendChild(item);
      });
    }

    function paintKindChrome(input) {
      const cfg = input || {};
      if (chartToolbar) {
        chartToolbar.setAttribute("data-kind", cfg.kind || "");
      }
      const segmented = document.getElementById("modeSegmented");
      if (segmented) {
        segmented.hidden = !!cfg.hideMode;
        segmented.setAttribute("aria-hidden", cfg.hideMode ? "true" : "false");
      }
      const boundField = document.getElementById("boundMetricField");
      if (boundField) boundField.hidden = true;
      if (boundMetricLabel) {
        boundMetricLabel.textContent = cfg.boundText || "—";
      }
      if (chartBoundMeta) {
        if (cfg.isVisitLinked && cfg.boundText && cfg.boundText !== "—") {
          chartBoundMeta.hidden = false;
          chartBoundMeta.textContent = "串接就診・" + cfg.boundText;
        } else {
          chartBoundMeta.hidden = true;
          chartBoundMeta.textContent = "";
        }
      }
    }

    function paintMetricBoard(rows) {
      if (!metricBoardList) return;
      const list = Array.isArray(rows) ? rows : [];
      metricBoardList.replaceChildren();
      if (metricBoardEmpty) {
        metricBoardEmpty.setAttribute("data-show", list.length ? "false" : "true");
      }
      list.forEach(function (row) {
        const card = document.createElement("article");
        card.className = "metric-board-card";
        card.setAttribute("data-project-id", row.projectId);
        card.setAttribute("data-metric-id", row.metricId || "");
        card.setAttribute("aria-current", row.active ? "true" : "false");
        card.setAttribute("data-overlay", row.overlay ? "true" : "false");
        card.setAttribute("role", "button");
        card.tabIndex = 0;

        const swatch = document.createElement("span");
        swatch.className = "metric-board-swatch";
        swatch.style.background = row.color || "#1487bd";

        const body = document.createElement("span");
        body.className = "metric-board-body";
        const name = document.createElement("p");
        name.className = "metric-board-name";
        name.textContent = row.name;
        const metaLine = document.createElement("p");
        metaLine.className = "metric-board-meta";
        metaLine.textContent = row.empty
          ? row.unit
            ? row.unit + "・尚未記分"
            : "尚未記分"
          : (row.latestNote || "") + (row.unit ? "・" + row.unit : "");
        body.appendChild(name);
        body.appendChild(metaLine);

        const actions = document.createElement("span");
        actions.className = "metric-board-card-actions";
        if (row.canOverlay) {
          const overlayBtn = document.createElement("button");
          overlayBtn.type = "button";
          overlayBtn.className = "metric-board-overlay";
          overlayBtn.setAttribute("data-overlay-metric-id", row.metricId || "");
          overlayBtn.setAttribute("aria-pressed", row.overlay ? "true" : "false");
          overlayBtn.textContent = row.overlay ? "疊圖中" : "一起看";
          actions.appendChild(overlayBtn);
        }
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "metric-board-card-action";
        editBtn.setAttribute("data-edit-project-id", row.projectId);
        editBtn.setAttribute("data-edit-metric-id", row.metricId || "");
        editBtn.textContent = "編輯";
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "metric-board-card-action";
        deleteBtn.setAttribute("data-delete-project-id", row.projectId);
        deleteBtn.setAttribute("data-delete-metric-id", row.metricId || "");
        deleteBtn.setAttribute("data-danger", "true");
        deleteBtn.textContent = "刪除";
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        const side = document.createElement("span");
        side.className = "metric-board-side";
        if (!row.empty && row.spark && row.spark.length) {
          side.appendChild(drawMetricSpark(row.spark, row.color));
        }
        const logBtn = document.createElement("button");
        logBtn.type = "button";
        logBtn.className = "metric-board-log";
        logBtn.setAttribute("data-log-project-id", row.projectId);
        logBtn.setAttribute("data-log-metric-id", row.metricId || "");
        logBtn.textContent = "記一筆";
        side.appendChild(logBtn);

        card.appendChild(swatch);
        card.appendChild(body);
        card.appendChild(actions);
        card.appendChild(side);
        metricBoardList.appendChild(card);
      });
      const board = document.getElementById("metricBoard");
      if (board) {
        const picking = list.some(function (row) {
          return row.overview;
        });
        board.setAttribute("data-picking", picking ? "true" : "false");
      }
    }

    function paintBoardPetNote(petName) {
      const heading = document.querySelector("#metricBoard .metric-board-head h2");
      if (!heading) return;
      let note = document.getElementById("metricBoardPetNote");
      if (!note) {
        note = document.createElement("span");
        note.id = "metricBoardPetNote";
        note.className = "metric-board-pet";
        heading.appendChild(note);
      }
      const name = String(petName || "").trim();
      note.hidden = !name;
      note.textContent = name ? "（" + name + "）" : "";
    }

    function paintVisitJump(input) {
      if (!visitJump) return;
      const cfg = input || {};
      if (cfg.hidden) {
        visitJump.hidden = true;
        return;
      }
      if (visitJumpLabel) visitJumpLabel.textContent = cfg.label || "";
      visitJump.hidden = false;
    }

    function paintModeToolbar(mode) {
      const key = String(mode || "");
      document.querySelectorAll(".segment").forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.getAttribute("data-mode") === key));
      });
    }

    function paintChartFrame(input) {
      const cfg = input || {};
      if (emptyState && cfg.showEmpty != null) {
        emptyState.setAttribute("data-show", cfg.showEmpty ? "true" : "false");
      }
      if (chartWrap && cfg.emptyWrap != null) {
        chartWrap.setAttribute("data-empty", cfg.emptyWrap ? "true" : "false");
      }
      if (emptyStateCopy && cfg.copy != null) emptyStateCopy.textContent = cfg.copy;
      if (emptyCreateProjectCta && cfg.ctaHidden != null) {
        emptyCreateProjectCta.hidden = cfg.ctaHidden;
      }
      if (cfg.subtitle != null) {
        const subtitle = document.getElementById("chartSubtitle");
        if (subtitle) {
          const text = String(cfg.subtitle || "").trim();
          subtitle.textContent = text;
          subtitle.hidden = !text;
        }
      }
    }

    function fillMetricSelect(select, ids, getLabel, selected) {
      if (!select) return;
      const list = Array.isArray(ids) ? ids : [];
      select.replaceChildren();
      list.forEach(function (id) {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = typeof getLabel === "function" ? getLabel(id) : id;
        select.appendChild(opt);
      });
      if (list.indexOf(selected) >= 0) select.value = selected;
      else if (list.length) select.value = list[0];
    }

    function showTooltip(event, title, value, escapeHtml) {
      if (!tooltip || !chartWrap) return;
      const escape =
        typeof escapeHtml === "function"
          ? escapeHtml
          : function (text) {
              return String(text == null ? "" : text);
            };
      tooltip.innerHTML = "<strong>" + escape(title) + "</strong>" + escape(value);
      tooltip.style.display = "block";
      const rect = chartWrap.getBoundingClientRect();
      const pointX = event && "clientX" in event ? event.clientX - rect.left : rect.width / 2;
      const pointY = event && "clientY" in event ? event.clientY - rect.top : 80;
      tooltip.style.left = Math.min(Math.max(pointX + 12, 8), rect.width - 180) + "px";
      tooltip.style.top = Math.max(pointY - 48, 8) + "px";
    }

    function hideTooltip() {
      if (!tooltip) return;
      tooltip.style.display = "none";
    }

    function bind(handlers) {
      const h = handlers || {};
      if (projectMenuBtn) {
        projectMenuBtn.addEventListener("click", function (event) {
          event.stopPropagation();
          const open = projectMenu.getAttribute("data-open") === "true";
          setMenuOpen(!open);
        });
      }
      if (projectMenu) {
        projectMenu.addEventListener("click", function (event) {
          const btn = event.target.closest("[data-project-action]");
          if (!btn) return;
          const action = btn.getAttribute("data-project-action");
          if (action === "select" && typeof h.onSelectVisit === "function") h.onSelectVisit();
          else if (action === "pick" && typeof h.onPickProject === "function") h.onPickProject();
        });
      }
      document.addEventListener("click", function (event) {
        if (!projectMenu || projectMenu.getAttribute("data-open") !== "true") return;
        if (
          projectMenu.contains(event.target) ||
          (projectMenuBtn && projectMenuBtn.contains(event.target))
        ) {
          return;
        }
        setMenuOpen(false);
      });
      if (projectSheet) {
        projectSheet.addEventListener("click", function (event) {
          if (event.target === projectSheet) closeSheet();
        });
      }
      if (emptyCreateProjectCta && typeof h.onSelectVisit === "function") {
        emptyCreateProjectCta.addEventListener("click", h.onSelectVisit);
      }
      if (metricBoardAddBtn && typeof h.onCreateMetric === "function") {
        metricBoardAddBtn.addEventListener("click", h.onCreateMetric);
      }
      if (metricBoardEmptyCta && typeof h.onCreateMetric === "function") {
        metricBoardEmptyCta.addEventListener("click", h.onCreateMetric);
      }
      if (metricBoardList) {
        metricBoardList.addEventListener("click", function (event) {
          const overlayBtn = event.target.closest("[data-overlay-metric-id], [data-overlay-project-id]");
          if (overlayBtn) {
            event.preventDefault();
            event.stopPropagation();
            if (typeof h.onToggleOverlay === "function") {
              h.onToggleOverlay(
                overlayBtn.getAttribute("data-overlay-metric-id") ||
                  overlayBtn.getAttribute("data-overlay-project-id")
              );
            }
            return;
          }
          const logBtn = event.target.closest("[data-log-project-id]");
          if (logBtn) {
            event.preventDefault();
            event.stopPropagation();
            if (typeof h.onLog === "function") {
              h.onLog(
                logBtn.getAttribute("data-log-project-id"),
                logBtn.getAttribute("data-log-metric-id")
              );
            }
            return;
          }
          const editBtn = event.target.closest("[data-edit-project-id]");
          if (editBtn) {
            event.preventDefault();
            event.stopPropagation();
            if (typeof h.onEdit === "function") {
              h.onEdit(
                editBtn.getAttribute("data-edit-project-id"),
                editBtn.getAttribute("data-edit-metric-id")
              );
            }
            return;
          }
          const deleteBtn = event.target.closest("[data-delete-project-id]");
          if (deleteBtn) {
            event.preventDefault();
            event.stopPropagation();
            if (typeof h.onDelete === "function") {
              h.onDelete(
                deleteBtn.getAttribute("data-delete-project-id"),
                deleteBtn.getAttribute("data-delete-metric-id")
              );
            }
            return;
          }
          const card = event.target.closest(".metric-board-card");
          if (!card) return;
          if (typeof h.onActivate === "function") {
            h.onActivate(card.getAttribute("data-project-id"), card.getAttribute("data-metric-id"));
          }
        });
        metricBoardList.addEventListener("keydown", function (event) {
          if (event.key !== "Enter" && event.key !== " ") return;
          const card = event.target.closest(".metric-board-card");
          if (
            !card ||
            event.target.closest("[data-log-project-id]") ||
            event.target.closest("[data-overlay-metric-id]") ||
            event.target.closest("[data-overlay-project-id]") ||
            event.target.closest("[data-edit-project-id]") ||
            event.target.closest("[data-delete-project-id]")
          ) {
            return;
          }
          event.preventDefault();
          if (typeof h.onActivate === "function") {
            h.onActivate(card.getAttribute("data-project-id"), card.getAttribute("data-metric-id"));
          }
        });
      }
      const metricFocusRow = document.getElementById("metricFocusRow");
      if (metricFocusRow) {
        metricFocusRow.addEventListener("click", function (event) {
          const overviewBtn = event.target.closest("[data-overview]");
          if (overviewBtn) {
            if (typeof h.onOverview === "function") h.onOverview();
            return;
          }
          const chip = event.target.closest("[data-focus-metric-id]");
          if (!chip || typeof h.onFocusMetric !== "function") return;
          h.onFocusMetric(chip.getAttribute("data-focus-metric-id"));
        });
      }
      if (projectNameEditBtn) {
        projectNameEditBtn.addEventListener("mousedown", function (event) {
          event.preventDefault();
        });
        projectNameEditBtn.addEventListener("click", function (event) {
          event.preventDefault();
          startTitleEdit();
          if (typeof h.onEditTitle === "function") h.onEditTitle();
        });
      }
      if (projectNameInput && typeof h.onCommitTitle === "function") {
        let skipTitleCommit = false;
        projectNameInput.addEventListener("change", function () {
          if (skipTitleCommit) return;
          h.onCommitTitle();
        });
        projectNameInput.addEventListener("blur", function () {
          if (skipTitleCommit) {
            skipTitleCommit = false;
            endTitleEdit();
            return;
          }
          h.onCommitTitle();
          endTitleEdit();
        });
        projectNameInput.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            projectNameInput.blur();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            skipTitleCommit = true;
            endTitleEdit();
            if (typeof h.onCancelTitle === "function") h.onCancelTitle();
            projectNameInput.blur();
          }
        });
      }
    }

    return {
      els: {
        projectNameInput: projectNameInput,
        projectSheetBody: projectSheetBody,
        projectSheetActions: projectSheetActions,
        emptyCreateProjectCta: emptyCreateProjectCta,
      },
      setMenuOpen: setMenuOpen,
      closeSheet: closeSheet,
      openSheet: openSheet,
      isSheetOpen: isSheetOpen,
      getSheetKind: getSheetKind,
      clearSheet: clearSheet,
      paintBoardPetNote: paintBoardPetNote,
      startTitleEdit: startTitleEdit,
      paintTitle: paintTitle,
      paintMetricFocus: paintMetricFocus,
      paintLegend: paintLegend,
      paintKindChrome: paintKindChrome,
      paintMetricBoard: paintMetricBoard,
      scrollToMetricBoard: function () {
        const board = document.getElementById("metricBoard");
        if (board && typeof board.scrollIntoView === "function") {
          board.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      },
      paintVisitJump: paintVisitJump,
      paintModeToolbar: paintModeToolbar,
      paintChartFrame: paintChartFrame,
      fillMetricSelect: fillMetricSelect,
      showTooltip: showTooltip,
      hideTooltip: hideTooltip,
      bind: bind,
    };
  }

  root.shell.drawMetricSpark = drawMetricSpark;
  root.shell.createObservationChrome = createObservationChrome;
})(typeof window !== "undefined" ? window : globalThis);
