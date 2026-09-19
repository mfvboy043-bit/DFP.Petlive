(function initPetLiveWebShellObservationSheets(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  const UNIT_OPTIONS = [
    { value: "次", label: "次數" },
    { value: "kg", label: "公斤（kg）" },
    { value: "分", label: "0–10 分" },
    { value: "__custom", label: "自行填寫單位" },
  ];

  function hintError() {
    const err = document.createElement("p");
    err.className = "hint";
    err.style.color = "#b45309";
    err.style.minHeight = "1.2em";
    return err;
  }

  function appendCancelSave(actions, onCancel, saveLabel, onSave) {
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn secondary";
    cancel.textContent = "取消";
    cancel.addEventListener("click", onCancel);
    const save = document.createElement("button");
    save.type = "button";
    save.className = "btn";
    save.textContent = saveLabel;
    save.addEventListener("click", onSave);
    actions.appendChild(cancel);
    actions.appendChild(save);
    return { cancel: cancel, save: save };
  }

  function formatPickVisitTitle(text) {
    return String(text || "")
      .replace(/\s*·\s*/g, "．")
      .replace(/\s+/g, " ")
      .trim();
  }

  function appendPickProjectCard(list, opts) {
    const cfg = opts || {};
    const btn = document.createElement("button");
    btn.type = "button";

    const context = document.createElement("span");
    context.className = "pick-context";
    const pet = document.createElement("span");
    pet.className = "pick-pet";
    pet.textContent = cfg.petName || "";
    context.appendChild(pet);
    if (cfg.metric) {
      const sep = document.createElement("span");
      sep.className = "pick-sep";
      sep.textContent = "，";
      const metric = document.createElement("span");
      metric.className = "pick-metric";
      metric.textContent = cfg.metric;
      context.appendChild(sep);
      context.appendChild(metric);
    }

    const title = document.createElement("strong");
    title.className = "pick-title";
    title.textContent = formatPickVisitTitle(cfg.title || "就診專案");

    btn.appendChild(context);
    btn.appendChild(title);
    btn.setAttribute("aria-current", cfg.selected ? "true" : "false");
    if (typeof cfg.onPick === "function") {
      btn.addEventListener("click", cfg.onPick);
    }
    list.appendChild(btn);
    return btn;
  }

  function buildCaptionField(opts) {
    const cfg = opts || {};
    const field = document.createElement("div");
    field.className = "field";
    const fieldId = cfg.id || "sheetObserveCaption";
    const label = document.createElement("label");
    label.setAttribute("for", fieldId);
    label.textContent = cfg.label || "觀察說明（選填）";
    const input = document.createElement("input");
    input.id = fieldId;
    input.type = "text";
    input.maxLength = 80;
    input.value = cfg.value || "";
    input.placeholder = cfg.placeholder || "例如：術後體重觀察、疼痛次數變化觀察";
    input.autocomplete = "off";
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = cfg.hint || "顯示在圖表標題下方。不填就不顯示。";
    field.appendChild(label);
    field.appendChild(input);
    field.appendChild(hint);
    return {
      field: field,
      input: input,
      read: function () {
        return String(input.value || "").trim();
      },
    };
  }

  function appendCloseAction(actions, onClose) {
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn secondary";
    cancel.textContent = "關閉";
    cancel.addEventListener("click", onClose);
    actions.appendChild(cancel);
    actions.style.gridTemplateColumns = "1fr";
  }

  function resolveUnitScale(preset, customValue) {
    if (preset === "__custom") {
      const unit = String(customValue || "").trim();
      if (!unit) return { error: "請填自訂單位，例如：分鐘。", focus: "custom" };
      return { unit: unit, scale: "open" };
    }
    if (preset === "kg") return { unit: "kg", scale: "weight" };
    if (preset === "次") return { unit: "次", scale: "count" };
    return { unit: preset || "分", scale: "fixed10" };
  }

  function specForLogUnit(unit, scale) {
    if (scale === "weight" || unit === "kg") {
      return { min: 0, max: 200, step: 0.1, unit: unit || "kg" };
    }
    if (scale === "count" || unit === "次") {
      return { min: 0, max: 24, step: 1, unit: "次" };
    }
    if (scale === "open") {
      return { min: 0, max: 9999, step: 0.1, unit: unit || "" };
    }
    return { min: 0, max: 10, step: 1, unit: unit || "分" };
  }

  function applyLogValueSpec(valueInput, valueLabel, spec) {
    if (!valueInput || !spec) return;
    valueInput.min = String(spec.min);
    valueInput.max = String(spec.max);
    valueInput.step = String(spec.step);
    valueInput.inputMode = spec.step < 1 ? "decimal" : "numeric";
    if (valueLabel) valueLabel.textContent = "數值（" + (spec.unit || "分") + "）";
  }

  function buildUnitFields(initialUnit, opts) {
    opts = opts || {};
    const unitField = document.createElement("div");
    unitField.className = "field";
    const unitLabel = document.createElement("label");
    unitLabel.setAttribute("for", "projectMetricUnit");
    unitLabel.textContent = "單位";
    const unitSelect = document.createElement("select");
    unitSelect.id = "projectMetricUnit";
    UNIT_OPTIONS.forEach(function (opt) {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      unitSelect.appendChild(option);
    });
    const customUnitField = document.createElement("div");
    customUnitField.className = "field";
    customUnitField.hidden = true;
    const customLabel = document.createElement("label");
    customLabel.setAttribute("for", "projectCustomUnit");
    customLabel.textContent = "自訂單位";
    const customInput = document.createElement("input");
    customInput.id = "projectCustomUnit";
    customInput.type = "text";
    customInput.maxLength = 16;
    customInput.placeholder = "例如：分鐘、小時、ml";
    customInput.autocomplete = "off";
    const customHint = document.createElement("p");
    customHint.className = "hint";
    customHint.textContent = "例如：分鐘、小時、ml、kcal…任何客觀數據單位";
    customUnitField.appendChild(customLabel);
    customUnitField.appendChild(customInput);
    customUnitField.appendChild(customHint);

    const currentUnit = initialUnit != null ? String(initialUnit) : "";
    if (currentUnit === "次" || currentUnit === "kg" || currentUnit === "分") {
      unitSelect.value = currentUnit;
    } else if (currentUnit) {
      unitSelect.value = "__custom";
      customInput.value = currentUnit;
      customUnitField.hidden = false;
    }

    function syncCustomUnitField() {
      const isCustom = unitSelect.value === "__custom";
      customUnitField.hidden = !isCustom;
      if (isCustom && opts.autoFocusCustom !== false) customInput.focus();
    }
    function notifyChange() {
      if (typeof opts.onChange === "function") {
        opts.onChange(resolveUnitScale(unitSelect.value || "分", customInput.value));
      }
    }
    unitSelect.addEventListener("change", function () {
      syncCustomUnitField();
      notifyChange();
    });
    customInput.addEventListener("input", notifyChange);
    unitField.appendChild(unitLabel);
    unitField.appendChild(unitSelect);

    return {
      unitField: unitField,
      customUnitField: customUnitField,
      read: function () {
        return resolveUnitScale(unitSelect.value || "分", customInput.value);
      },
      focusCustom: function () {
        customInput.focus();
      },
    };
  }

  function buildLineColorPicker(obs, initialHex) {
    const palettes = ((obs && obs.BASE_LINE_COLORS) || []).slice();
    const normalize =
      obs && typeof obs.normalizeLineColor === "function"
        ? obs.normalizeLineColor
        : function (value) {
            return String(value || "").toLowerCase();
          };
    const fallback = (obs && obs.LINE_COLOR_DEFAULT) || "#1487bd";
    let selected = normalize(initialHex) || fallback;
    const presetHexes = {};
    palettes.forEach(function (swatch) {
      presetHexes[normalize(swatch.hex)] = true;
    });

    const field = document.createElement("div");
    field.className = "field";
    const label = document.createElement("span");
    label.id = "lineColorLabel";
    label.textContent = "線條顏色";
    const swatchRow = document.createElement("div");
    swatchRow.className = "line-color-swatches";
    swatchRow.setAttribute("role", "radiogroup");
    swatchRow.setAttribute("aria-labelledby", "lineColorLabel");

    const buttons = [];
    palettes.forEach(function (swatch) {
      const hex = normalize(swatch.hex);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "line-color-swatch";
      btn.setAttribute("role", "radio");
      btn.dataset.hex = hex;
      btn.setAttribute("aria-label", swatch.label);
      const dot = document.createElement("span");
      dot.className = "line-color-dot";
      dot.style.setProperty("--swatch", hex);
      const caption = document.createElement("span");
      caption.textContent = swatch.label;
      btn.appendChild(dot);
      btn.appendChild(caption);
      btn.addEventListener("click", function () {
        selected = hex;
        colorInput.value = hex;
        paintSelection();
      });
      buttons.push(btn);
      swatchRow.appendChild(btn);
    });

    const custom = document.createElement("div");
    custom.className = "line-color-custom";
    const card = document.createElement("div");
    card.className = "line-color-custom-card";
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id = "lineColorCustom";
    colorInput.value = selected;
    colorInput.setAttribute("aria-label", "自訂線條顏色");
    card.appendChild(colorInput);
    const copy = document.createElement("div");
    copy.className = "line-color-custom-copy";
    const copyTitle = document.createElement("strong");
    copyTitle.textContent = "自訂色卡";
    const copyHint = document.createElement("span");
    copyHint.textContent = "點色塊選任何顏色";
    copy.appendChild(copyTitle);
    copy.appendChild(copyHint);
    custom.appendChild(card);
    custom.appendChild(copy);

    function paintSelection() {
      const hex = normalize(selected) || fallback;
      const isPreset = !!presetHexes[hex];
      buttons.forEach(function (btn) {
        const on = isPreset && btn.dataset.hex === hex;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-checked", on ? "true" : "false");
      });
      custom.classList.toggle("is-on", !isPreset);
      colorInput.value = hex;
    }

    colorInput.addEventListener("input", function () {
      selected = normalize(colorInput.value) || selected;
      paintSelection();
    });
    colorInput.addEventListener("change", function () {
      selected = normalize(colorInput.value) || selected;
      paintSelection();
    });

    paintSelection();
    field.appendChild(label);
    field.appendChild(swatchRow);
    field.appendChild(custom);
    return {
      field: field,
      getColor: function () {
        return normalize(selected) || fallback;
      },
    };
  }

  function buildVisitCheckList(visits, selectedIds) {
    const wrap = document.createElement("div");
    wrap.className = "visit-check-list";
    const selected = {};
    (selectedIds || []).forEach(function (id) {
      selected[id] = true;
    });
    (visits || []).forEach(function (visit) {
      if (!visit || !visit.id) return;
      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.setAttribute("data-visit-id", visit.id);
      box.checked = !!selected[visit.id];
      const text = document.createElement("span");
      text.textContent = visit.label;
      label.appendChild(box);
      label.appendChild(text);
      wrap.appendChild(label);
    });
    return wrap;
  }

  function pad2(n) {
    const s = String(n);
    return s.length < 2 ? "0" + s : s;
  }

  function formatISODate(year, month, day) {
    return year + "-" + pad2(month) + "-" + pad2(day);
  }

  function parseISODate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "").trim());
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { year: year, month: month, day: day };
  }

  function todayISODate() {
    const now = new Date();
    return formatISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  function buildInlineMonthCalendar(initialIso, onPick) {
    const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
    let selected = parseISODate(initialIso);
    const start = selected || parseISODate(todayISODate());
    let viewYear = start.year;
    let viewMonth = start.month;
    const wrap = document.createElement("div");
    wrap.className = "log-month-cal";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "視覺化日曆");

    function paint() {
      wrap.replaceChildren();
      const head = document.createElement("div");
      head.className = "log-month-cal-head";
      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "log-month-cal-nav";
      prev.setAttribute("aria-label", "上個月");
      prev.textContent = "‹";
      prev.addEventListener("click", function () {
        if (viewMonth === 1) {
          viewMonth = 12;
          viewYear -= 1;
        } else {
          viewMonth -= 1;
        }
        paint();
      });
      const title = document.createElement("p");
      title.className = "log-month-cal-title";
      title.textContent = viewYear + "年" + viewMonth + "月";
      const next = document.createElement("button");
      next.type = "button";
      next.className = "log-month-cal-nav";
      next.setAttribute("aria-label", "下個月");
      next.textContent = "›";
      next.addEventListener("click", function () {
        if (viewMonth === 12) {
          viewMonth = 1;
          viewYear += 1;
        } else {
          viewMonth += 1;
        }
        paint();
      });
      head.appendChild(prev);
      head.appendChild(title);
      head.appendChild(next);

      const week = document.createElement("div");
      week.className = "log-month-cal-week";
      WEEKDAYS.forEach(function (label) {
        const cell = document.createElement("span");
        cell.className = "log-month-cal-dow";
        cell.textContent = label;
        week.appendChild(cell);
      });

      const days = document.createElement("div");
      days.className = "log-month-cal-days";
      const first = new Date(viewYear, viewMonth - 1, 1);
      const startPad = first.getDay();
      const todayIso = todayISODate();
      const selectedIso = selected
        ? formatISODate(selected.year, selected.month, selected.day)
        : "";
      for (let i = 0; i < 42; i += 1) {
        const cellDate = new Date(viewYear, viewMonth - 1, 1 - startPad + i);
        const y = cellDate.getFullYear();
        const m = cellDate.getMonth() + 1;
        const d = cellDate.getDate();
        const iso = formatISODate(y, m, d);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "log-month-cal-day";
        btn.textContent = String(d);
        btn.setAttribute("data-iso", iso);
        btn.setAttribute("aria-label", iso);
        if (m !== viewMonth) btn.classList.add("is-muted");
        if (iso === todayIso) btn.classList.add("is-today");
        if (iso === selectedIso) {
          btn.classList.add("is-on");
          btn.setAttribute("aria-current", "date");
        }
        btn.addEventListener("click", function () {
          selected = { year: y, month: m, day: d };
          viewYear = y;
          viewMonth = m;
          paint();
          if (typeof onPick === "function") onPick(iso);
        });
        days.appendChild(btn);
      }

      wrap.appendChild(head);
      wrap.appendChild(week);
      wrap.appendChild(days);
    }

    paint();
    return {
      el: wrap,
      setDate: function (iso) {
        const parsed = parseISODate(iso);
        if (!parsed) return;
        selected = parsed;
        viewYear = parsed.year;
        viewMonth = parsed.month;
        paint();
      },
    };
  }

  function collectVisitChecks(rootEl) {
    const ids = [];
    if (!rootEl) return ids;
    rootEl.querySelectorAll('input[type="checkbox"][data-visit-id]').forEach(function (box) {
      if (box.checked) ids.push(box.getAttribute("data-visit-id"));
    });
    return ids;
  }

  function createObservationSheets(document, chrome, obs) {
    function body() {
      return chrome.els.projectSheetBody;
    }

    function actions() {
      return chrome.els.projectSheetActions;
    }

    function appendPetSwitcher(input) {
      const cfg = input || {};
      const petName = cfg.petName || "未選寵物";
      const now = document.createElement("p");
      now.className = "pick-pet-now";
      now.textContent = "目前寵物：" + petName;

      const switchRow = document.createElement("div");
      switchRow.className = "pick-pet-switch";
      switchRow.setAttribute("role", "group");
      switchRow.setAttribute("aria-label", "切換目前寵物");
      (cfg.pets || []).forEach(function (entry) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "pick-pet-chip";
        chip.textContent = entry.name;
        const on = entry.id === cfg.activePetId;
        chip.classList.toggle("is-on", on);
        chip.setAttribute("aria-pressed", on ? "true" : "false");
        chip.addEventListener("click", function () {
          if (entry.id === cfg.activePetId) return;
          if (typeof cfg.onSwitch === "function") cfg.onSwitch(entry.id);
        });
        switchRow.appendChild(chip);
      });

      body().appendChild(now);
      body().appendChild(switchRow);
      return petName;
    }

    function openSelectVisit(input) {
      const cfg = input || {};
      chrome.openSheet("選擇就診", "select");
      chrome.clearSheet();
      const petName = appendPetSwitcher({
        petName: cfg.petName,
        pets: cfg.pets,
        activePetId: cfg.activePetId,
        onSwitch: cfg.onSwitch,
      });
      const intro = document.createElement("p");
      intro.className = "hint";
      intro.textContent =
        "選「" + petName + "」的一筆就診帶入觀察圖。就診日期／醫院會顯示在旁，專案名稱由你自己取。";
      body().appendChild(intro);

      const visitHeading = document.createElement("p");
      visitHeading.className = "pick-section-label";
      visitHeading.textContent = petName + "的就診紀錄";
      body().appendChild(visitHeading);

      const visitRows = (cfg.visits || []).filter(function (visit) {
        return visit && visit.id;
      });
      if (!visitRows.length) {
        const empty = document.createElement("p");
        empty.className = "hint";
        empty.textContent = petName + "還沒有就診紀錄。";
        body().appendChild(empty);
      } else {
        const visitList = document.createElement("div");
        visitList.className = "project-pick-list";
        visitRows.forEach(function (visit) {
          const linked = typeof cfg.findLinked === "function" ? cfg.findLinked(visit.id) : null;
          const btn = document.createElement("button");
          btn.type = "button";
          const title = document.createElement("strong");
          title.textContent = visit.date
            ? String(visit.date).slice(5).replace("-", "/")
            : visit.label;
          const meta = document.createElement("span");
          meta.className = "pick-meta";
          meta.textContent =
            petName +
            "・" +
            (visit.clinic || visit.label || "") +
            (linked ? "・已建立專案" : "");
          btn.appendChild(title);
          btn.appendChild(meta);
          const selected = !!(linked && cfg.activeProjectId && linked.id === cfg.activeProjectId);
          btn.setAttribute("aria-current", selected ? "true" : "false");
          btn.addEventListener("click", function () {
            if (typeof cfg.onPickVisit === "function") cfg.onPickVisit(visit);
          });
          visitList.appendChild(btn);
        });
        body().appendChild(visitList);
      }
      appendCloseAction(actions(), chrome.closeSheet);
    }

    function openPickProject(input) {
      const cfg = input || {};
      chrome.openSheet("選擇專案", "pick");
      chrome.clearSheet();
      const petName = appendPetSwitcher({
        petName: cfg.petName,
        pets: cfg.pets,
        activePetId: cfg.activePetId,
        onSwitch: cfg.onSwitch,
      });
      const intro = document.createElement("p");
      intro.className = "hint";
      intro.textContent = "只列出「" + petName + "」的就診專案。自定指標請點下方卡片。";
      body().appendChild(intro);

      const list = (cfg.projects || []).filter(function (project) {
        return project && obs.isVisitLinkedKind(project.kind);
      });
      if (!list.length) {
        const empty = document.createElement("p");
        empty.className = "hint";
        empty.textContent = petName + "還沒有就診專案。用 ⋯ 選擇就診帶入。";
        body().appendChild(empty);
      } else {
        const visitList = document.createElement("div");
        visitList.className = "project-pick-list";
        list.forEach(function (project) {
          const visitLabel =
            typeof cfg.formatLinked === "function" ? cfg.formatLinked(project) : "";
          const metricName =
            project.name && project.name !== visitLabel ? project.name : "";
          appendPickProjectCard(visitList, {
            petName: petName,
            metric: metricName,
            title: visitLabel || project.name || "就診專案",
            selected: !!(cfg.activeProjectId && cfg.activeProjectId === project.id),
            onPick: function () {
              if (typeof cfg.onPickProject === "function") cfg.onPickProject(project.id);
            },
          });
        });
        body().appendChild(visitList);
      }
      appendCloseAction(actions(), chrome.closeSheet);
    }

    function openNameVisit(input) {
      const cfg = input || {};
      const visit = cfg.visit;
      if (!visit || !visit.id) return;
      chrome.openSheet("幫觀察圖表取名");
      chrome.clearSheet();

      const intro = document.createElement("p");
      intro.className = "hint";
      intro.textContent = "已帶入這次就診。就診資訊會顯示在圖表旁；請替這張觀察圖取一個名稱。";

      const visitField = document.createElement("div");
      visitField.className = "field";
      const visitCaption = document.createElement("span");
      visitCaption.className = "chart-title-edit-label";
      visitCaption.textContent = "串接就診";
      const visitChip = document.createElement("div");
      visitChip.className = "bound-metric-label visit-link-chip";
      visitChip.textContent =
        cfg.visitLabel ||
        (typeof obs.visitProjectName === "function"
          ? obs.visitProjectName(visit)
          : visit.label || visit.id);
      visitField.appendChild(visitCaption);
      visitField.appendChild(visitChip);

      const nameField = document.createElement("div");
      nameField.className = "field";
      const nameLabel = document.createElement("label");
      nameLabel.setAttribute("for", "sheetVisitProjectName");
      nameLabel.textContent = "專案名稱（必填）";
      const nameInput = document.createElement("input");
      nameInput.id = "sheetVisitProjectName";
      nameInput.type = "text";
      nameInput.maxLength = 32;
      nameInput.placeholder = "例如：術後恢復、換藥追蹤";
      nameInput.autocomplete = "off";
      const nameHint = document.createElement("p");
      nameHint.className = "hint";
      nameHint.textContent = "之後可在標題欄直接改名。";
      nameField.appendChild(nameLabel);
      nameField.appendChild(nameInput);
      nameField.appendChild(nameHint);

      const caption = buildCaptionField({
        id: "sheetVisitProjectCaption",
        value: cfg.caption || "",
      });

      const err = hintError();
      body().appendChild(intro);
      body().appendChild(visitField);
      body().appendChild(nameField);
      body().appendChild(caption.field);
      body().appendChild(err);

      const back = document.createElement("button");
      back.type = "button";
      back.className = "btn secondary";
      back.textContent = "重選就診";
      back.addEventListener("click", function () {
        if (typeof cfg.onBack === "function") cfg.onBack();
      });
      const save = document.createElement("button");
      save.type = "button";
      save.className = "btn";
      save.textContent = "建立";
      save.addEventListener("click", function () {
        const name = (nameInput.value || "").trim();
        if (!name) {
          err.textContent = "請填專案名稱。";
          nameInput.focus();
          return;
        }
        if (typeof cfg.onCreate !== "function") return;
        const result = cfg.onCreate({
          name: name,
          visitId: visit.id,
          caption: caption.read(),
        });
        if (result && result.error) {
          err.textContent = result.error;
        }
      });
      actions().appendChild(back);
      actions().appendChild(save);
      nameInput.focus();
    }

    function openCreateMetric(input) {
      const cfg = input || {};
      chrome.openSheet("新建觀察");
      chrome.clearSheet();

      const intro = document.createElement("p");
      intro.className = "hint";
      intro.textContent = "先幫這張圖取一個指標名稱，再選單位與線條顏色。";

      const nameField = document.createElement("div");
      nameField.className = "field";
      const nameLabel = document.createElement("label");
      nameLabel.setAttribute("for", "sheetObserveName");
      nameLabel.textContent = "指標名稱（必填）";
      const nameInput = document.createElement("input");
      nameInput.id = "sheetObserveName";
      nameInput.type = "text";
      nameInput.maxLength = 24;
      nameInput.placeholder = "例如：喝水次數、體重、睡眠時長";
      nameInput.autocomplete = "off";
      const nameHint = document.createElement("p");
      nameHint.className = "hint";
      nameHint.textContent = "例如：喝水次數、體重、睡眠時長";
      nameField.appendChild(nameLabel);
      nameField.appendChild(nameInput);
      nameField.appendChild(nameHint);

      const caption = buildCaptionField({
        id: "sheetObserveCaption",
        value: cfg.caption || "",
      });

      const units = buildUnitFields("");
      const colorPicker = buildLineColorPicker(obs, cfg.defaultColor);
      const err = hintError();

      body().appendChild(intro);
      body().appendChild(nameField);
      body().appendChild(caption.field);
      body().appendChild(units.unitField);
      body().appendChild(units.customUnitField);
      body().appendChild(colorPicker.field);
      body().appendChild(err);

      appendCancelSave(actions(), chrome.closeSheet, "建立", function () {
        const name = (nameInput.value || "").trim();
        if (!name) {
          err.textContent = "請填要觀察的項目。";
          nameInput.focus();
          return;
        }
        const unit = units.read();
        if (unit.error) {
          err.textContent = unit.error;
          units.focusCustom();
          return;
        }
        if (typeof cfg.onCreate !== "function") return;
        const result = cfg.onCreate({
          name: name,
          caption: caption.read(),
          unit: unit.unit,
          scale: unit.scale,
          color: colorPicker.getColor(),
        });
        if (result && result.error) err.textContent = result.error;
      });
      nameInput.focus();
    }

    function openLog(input) {
      const cfg = input || {};
      const row = cfg.row;
      if (!row) return;
      chrome.openSheet("記一筆・" + row.name);
      chrome.clearSheet();

      let spec = row.input || { min: 0, max: 10, step: 1, unit: "分" };
      const defaultDate = cfg.defaultDate || "";
      const defaultTime = cfg.defaultTime || "12:00";

      const valueRow = document.createElement("div");
      valueRow.className = "field-row field-row--log-when field-row--log-value";

      const valueField = document.createElement("div");
      valueField.className = "field";
      const valueLabel = document.createElement("label");
      valueLabel.setAttribute("for", "metricBoardLogValue");
      valueLabel.textContent = "數值（" + (spec.unit || "分") + "）";
      const valueInput = document.createElement("input");
      valueInput.id = "metricBoardLogValue";
      valueInput.type = "number";
      valueInput.required = true;
      applyLogValueSpec(valueInput, valueLabel, spec);
      valueField.appendChild(valueLabel);
      valueField.appendChild(valueInput);

      const units = buildUnitFields(spec.unit || row.unit || "", {
        autoFocusCustom: false,
        onChange: function (next) {
          if (!next || next.error) return;
          spec = specForLogUnit(next.unit, next.scale);
          applyLogValueSpec(valueInput, valueLabel, spec);
        },
      });
      valueRow.appendChild(valueField);
      valueRow.appendChild(units.unitField);

      const whenRow = document.createElement("div");
      whenRow.className = "field-row field-row--log-when";

      const dateField = document.createElement("div");
      dateField.className = "field";
      const dateLabel = document.createElement("label");
      dateLabel.setAttribute("for", "metricBoardLogDate");
      dateLabel.textContent = "記錄日期";
      const dateProxy = document.createElement("span");
      dateProxy.className = "date-proxy";
      const dateFace = document.createElement("input");
      dateFace.type = "text";
      dateFace.className = "date-proxy-face";
      dateFace.readOnly = true;
      dateFace.tabIndex = -1;
      dateFace.setAttribute("aria-hidden", "true");
      dateFace.placeholder = "YYYY-MM-DD";
      const dateNative = document.createElement("input");
      dateNative.type = "date";
      dateNative.id = "metricBoardLogDate";
      dateNative.className = "date-proxy-native";
      dateNative.required = true;
      dateNative.value = defaultDate;
      const syncDateFace = function () {
        dateFace.value = dateNative.value || "";
      };
      const calendar = buildInlineMonthCalendar(dateNative.value || defaultDate, function (iso) {
        if (dateNative.value === iso) return;
        dateNative.value = iso;
        syncDateFace();
      });
      dateNative.addEventListener("input", function () {
        syncDateFace();
        calendar.setDate(dateNative.value);
      });
      dateNative.addEventListener("change", function () {
        syncDateFace();
        calendar.setDate(dateNative.value);
      });
      syncDateFace();
      dateProxy.appendChild(dateFace);
      dateProxy.appendChild(dateNative);
      dateField.appendChild(dateLabel);
      dateField.appendChild(dateProxy);

      const timeField = document.createElement("div");
      timeField.className = "field field--log-time is-time-off";
      const timeHead = document.createElement("div");
      timeHead.className = "log-time-head";
      const timeLabel = document.createElement("label");
      timeLabel.setAttribute("for", "metricBoardLogTime");
      timeLabel.textContent = "時間";
      const timeSwitch = document.createElement("button");
      timeSwitch.type = "button";
      timeSwitch.className = "log-time-switch";
      timeSwitch.id = "metricBoardLogTimeSwitch";
      timeSwitch.setAttribute("role", "switch");
      timeSwitch.setAttribute("aria-checked", "false");
      timeSwitch.setAttribute("aria-label", "是否記錄時間");
      const timeSwitchKnob = document.createElement("span");
      timeSwitchKnob.className = "log-time-switch-knob";
      timeSwitch.appendChild(timeSwitchKnob);
      timeHead.appendChild(timeLabel);
      timeHead.appendChild(timeSwitch);
      const timeInput = document.createElement("input");
      timeInput.type = "time";
      timeInput.id = "metricBoardLogTime";
      timeInput.value = defaultTime;
      timeInput.disabled = true;
      timeInput.setAttribute("aria-disabled", "true");
      timeField.appendChild(timeHead);
      timeField.appendChild(timeInput);

      const setTimeEnabled = function (on) {
        const enabled = !!on;
        timeSwitch.setAttribute("aria-checked", enabled ? "true" : "false");
        timeSwitch.classList.toggle("is-on", enabled);
        timeField.classList.toggle("is-time-off", !enabled);
        timeField.classList.toggle("is-time-on", enabled);
        timeInput.disabled = !enabled;
        timeInput.setAttribute("aria-disabled", enabled ? "false" : "true");
      };
      timeSwitch.addEventListener("click", function () {
        const next = timeSwitch.getAttribute("aria-checked") !== "true";
        setTimeEnabled(next);
        if (next) timeInput.focus();
      });
      setTimeEnabled(false);

      whenRow.appendChild(dateField);
      whenRow.appendChild(timeField);

      const noteField = document.createElement("div");
      noteField.className = "field";
      const noteLabel = document.createElement("label");
      noteLabel.setAttribute("for", "metricBoardLogNote");
      noteLabel.textContent = "備註（選填）";
      const noteInput = document.createElement("input");
      noteInput.id = "metricBoardLogNote";
      noteInput.type = "text";
      noteInput.maxLength = 80;
      noteInput.autocomplete = "off";
      noteField.appendChild(noteLabel);
      noteField.appendChild(noteInput);

      const err = hintError();
      body().appendChild(valueRow);
      body().appendChild(units.customUnitField);
      body().appendChild(whenRow);
      body().appendChild(calendar.el);
      body().appendChild(noteField);
      body().appendChild(err);

      appendCancelSave(actions(), chrome.closeSheet, "記下", function () {
        const raw = Number(valueInput.value);
        if (!Number.isFinite(raw)) {
          err.textContent = "請填一個數字。";
          valueInput.focus();
          return;
        }
        if (raw < spec.min || raw > spec.max) {
          err.textContent = "請填 " + spec.min + "–" + spec.max + " 之間。";
          valueInput.focus();
          return;
        }
        const isoDate = String(dateNative.value || "").trim();
        if (!isoDate) {
          err.textContent = "請選擇記錄日期。";
          dateNative.focus();
          return;
        }
        const timeOn = timeSwitch.getAttribute("aria-checked") === "true";
        const timeHM = timeOn ? String(timeInput.value || "").trim() : "";
        if (timeOn) {
          const parsed = typeof obs.parseTimeHM === "function" ? obs.parseTimeHM(timeHM) : null;
          if (!parsed) {
            err.textContent = "請選擇時間。";
            timeInput.focus();
            return;
          }
        }
        const unit = units.read();
        if (unit.error) {
          err.textContent = unit.error;
          units.focusCustom();
          return;
        }
        if (typeof cfg.onSave !== "function") return;
        const result = cfg.onSave({
          value: raw,
          isoDate: isoDate,
          timeOn: timeOn,
          timeHM: timeOn ? timeHM : "",
          text: noteInput.value,
          unit: unit.unit,
          scale: unit.scale,
        });
        if (result && result.error) err.textContent = result.error;
      });
      valueInput.focus();
    }

    function openEditSelfMetric(input) {
      const cfg = input || {};
      const project = cfg.project;
      const meta = cfg.meta;
      chrome.openSheet("編輯指標");
      chrome.clearSheet();

      const intro = document.createElement("p");
      intro.className = "hint";
      intro.textContent = "可修改這個指標的名稱、單位與線條顏色。已記下的分數會保留。";

      const nameField = document.createElement("div");
      nameField.className = "field";
      const nameLabel = document.createElement("label");
      nameLabel.setAttribute("for", "sheetObserveName");
      nameLabel.textContent = "指標名稱（必填）";
      const nameInput = document.createElement("input");
      nameInput.id = "sheetObserveName";
      nameInput.type = "text";
      nameInput.maxLength = 24;
      nameInput.value = (meta && meta.label) || "";
      nameInput.placeholder = "例如：喝水次數、體重、睡眠時長";
      nameInput.autocomplete = "off";
      const nameHint = document.createElement("p");
      nameHint.className = "hint";
      nameHint.textContent = "例如：喝水次數、體重、睡眠時長";
      nameField.appendChild(nameLabel);
      nameField.appendChild(nameInput);
      nameField.appendChild(nameHint);

      const caption = buildCaptionField({
        id: "sheetObserveCaption",
        value: project.caption || "",
      });

      const currentUnit = meta && meta.unit != null ? String(meta.unit) : "分";
      const units = buildUnitFields(currentUnit);
      const initialColor = (meta && meta.color) || obs.LINE_COLOR_DEFAULT || "#1487bd";
      const colorPicker = buildLineColorPicker(obs, initialColor);
      const err = hintError();

      body().appendChild(intro);
      body().appendChild(nameField);
      body().appendChild(caption.field);
      body().appendChild(units.unitField);
      body().appendChild(units.customUnitField);
      body().appendChild(colorPicker.field);
      body().appendChild(err);

      appendCancelSave(actions(), chrome.closeSheet, "儲存", function () {
        const name = (nameInput.value || "").trim();
        if (!name) {
          err.textContent = "請填要觀察的項目。";
          nameInput.focus();
          return;
        }
        const unit = units.read();
        if (unit.error) {
          err.textContent = unit.error;
          units.focusCustom();
          return;
        }
        if (typeof cfg.onSave !== "function") return;
        const result = cfg.onSave({
          name: name,
          caption: caption.read(),
          unit: unit.unit,
          scale: unit.scale,
          color: colorPicker.getColor(),
        });
        if (result && result.error) err.textContent = result.error;
      });
      nameInput.focus();
      nameInput.select();
    }

    function openEditVisitProject(input) {
      const cfg = input || {};
      const project = cfg.project;
      chrome.openSheet("編輯專案");
      chrome.clearSheet();

      const nameField = document.createElement("div");
      nameField.className = "field";
      const nameLabel = document.createElement("label");
      nameLabel.setAttribute("for", "projectEditName");
      nameLabel.textContent = "專案名稱";
      const nameInput = document.createElement("input");
      nameInput.id = "projectEditName";
      nameInput.type = "text";
      nameInput.maxLength = 32;
      nameInput.value = project.name;
      nameField.appendChild(nameLabel);
      nameField.appendChild(nameInput);

      const caption = buildCaptionField({
        id: "projectEditCaption",
        value: project.caption || "",
      });

      const kindNote = document.createElement("p");
      kindNote.className = "hint";
      kindNote.textContent = "類型：就診串接。下方可調整串接的就診。";

      const visitBlock = document.createElement("div");
      visitBlock.className = "field";
      const visitLabel = document.createElement("span");
      visitLabel.className = "chart-title-edit-label";
      visitLabel.textContent = "串接就診";
      visitBlock.appendChild(visitLabel);
      visitBlock.appendChild(buildVisitCheckList(cfg.visits, project.visitIds));

      const err = document.createElement("p");
      err.className = "hint";
      err.style.color = "#b45309";

      body().appendChild(nameField);
      body().appendChild(caption.field);
      body().appendChild(kindNote);
      body().appendChild(visitBlock);
      body().appendChild(err);

      appendCancelSave(actions(), chrome.closeSheet, "儲存", function () {
        const visitIds = collectVisitChecks(visitBlock);
        if (typeof cfg.onSave !== "function") return;
        const result = cfg.onSave({
          name: nameInput.value,
          caption: caption.read(),
          visitIds: visitIds,
        });
        if (result && result.error) err.textContent = result.error;
      });
      nameInput.focus();
    }

    return {
      openSelectVisit: openSelectVisit,
      openPickProject: openPickProject,
      openNameVisit: openNameVisit,
      openCreateMetric: openCreateMetric,
      openLog: openLog,
      openEditSelfMetric: openEditSelfMetric,
      openEditVisitProject: openEditVisitProject,
    };
  }

  root.shell.createObservationSheets = createObservationSheets;
})(typeof window !== "undefined" ? window : globalThis);
