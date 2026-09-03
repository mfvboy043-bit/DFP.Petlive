(function initPetLiveLegalDocViewer(global) {
  "use strict";

  const LOCALES = ["zh-Hant", "en", "ja", "ko"];
  const DEFAULT_VERSION = "20260903-legal-v13";

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function inlineMarkdown(text) {
    let out = escapeHtml(text);
    out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" rel="noopener">$1</a>'
    );
    return out;
  }

  function renderMarkdown(md) {
    const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
    const parts = [];
    let i = 0;

    function flushParagraph(buffer) {
      const text = buffer.join(" ").trim();
      if (text) parts.push(`<p>${inlineMarkdown(text)}</p>`);
    }

    while (i < lines.length) {
      const line = lines[i];

      if (/^---+\s*$/.test(line)) {
        i += 1;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quote.push(lines[i].replace(/^>\s?/, ""));
          i += 1;
        }
        parts.push(`<blockquote>${inlineMarkdown(quote.join(" "))}</blockquote>`);
        continue;
      }

      if (/^\|.+\|$/.test(line) && lines[i + 1] && /^\|[-:\s|]+\|$/.test(lines[i + 1])) {
        const rows = [];
        while (i < lines.length && /^\|.+\|$/.test(lines[i])) {
          if (!/^\|[-:\s|]+\|$/.test(lines[i])) {
            const cells = lines[i]
              .slice(1, -1)
              .split("|")
              .map((c) => `<td>${inlineMarkdown(c.trim())}</td>`)
              .join("");
            rows.push(`<tr>${cells}</tr>`);
          }
          i += 1;
        }
        parts.push(`<table class="legal-table"><tbody>${rows.join("")}</tbody></table>`);
        continue;
      }

      if (/^```/.test(line)) {
        const code = [];
        i += 1;
        while (i < lines.length && !/^```/.test(lines[i])) {
          code.push(lines[i]);
          i += 1;
        }
        i += 1;
        parts.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        continue;
      }

      if (/^#{1,3}\s+/.test(line)) {
        const level = line.match(/^#+/)[0].length;
        const text = line.replace(/^#+\s+/, "");
        parts.push(`<h${level}>${inlineMarkdown(text)}</h${level}>`);
        i += 1;
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
          items.push(`<li>${inlineMarkdown(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
          i += 1;
        }
        parts.push(`<ul>${items.join("")}</ul>`);
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
          items.push(
            `<li>${inlineMarkdown(lines[i].replace(/^\d+\.\s+/, ""))}</li>`
          );
          i += 1;
        }
        parts.push(`<ol>${items.join("")}</ol>`);
        continue;
      }

      if (!line.trim()) {
        i += 1;
        continue;
      }

      const para = [];
      while (i < lines.length && lines[i].trim() && !/^#{1,3}\s/.test(lines[i])) {
        if (/^[-*]\s+/.test(lines[i]) || /^\d+\.\s+/.test(lines[i])) break;
        if (/^\|.+\|$/.test(lines[i])) break;
        if (/^```/.test(lines[i]) || /^>\s?/.test(lines[i])) break;
        para.push(lines[i].trim());
        i += 1;
      }
      flushParagraph(para);
    }

    return parts.join("\n");
  }

  function normalizeLocale(value) {
    const raw = String(value || "").trim();
    if (LOCALES.includes(raw)) return raw;
    const lower = raw.toLowerCase();
    if (lower === "zh" || lower === "zh-tw" || lower === "zh-hant") return "zh-Hant";
    if (lower === "en" || lower.startsWith("en-")) return "en";
    if (lower === "ja" || lower.startsWith("ja-")) return "ja";
    if (lower === "ko" || lower.startsWith("ko-")) return "ko";
    return "zh-Hant";
  }

  function markdownUrl(slug, locale, version) {
    if (locale === "zh-Hant") return `./${slug}.md?v=${encodeURIComponent(version)}`;
    return `./${slug}.${locale}.md?v=${encodeURIComponent(version)}`;
  }

  function titleFor(slug, locale) {
    const titles = {
      privacy: {
        "zh-Hant": "隱私權政策",
        en: "Privacy Policy",
        ja: "プライバシーポリシー",
        ko: "개인정보 처리방침"
      },
      terms: {
        "zh-Hant": "醫療免責與使用條款",
        en: "Medical Disclaimer & Terms",
        ja: "免責事項・利用規約",
        ko: "면책·이용약관"
      }
    };
    return titles[slug]?.[locale] || titles[slug]?.["zh-Hant"] || slug;
  }

  function chromeCopy(locale) {
    const map = {
      "zh-Hant": {
        back: "← 返回火龍果護照",
        privacy: "隱私權政策",
        terms: "使用條款",
        lang: "語言",
        loading: "載入中…",
        error: "無法載入文件。請稍後再試或來信 mfvboy043@gmail.com。"
      },
      en: {
        back: "← Back to Dragon Fruit Passport",
        privacy: "Privacy Policy",
        terms: "Terms",
        lang: "Language",
        loading: "Loading…",
        error: "Unable to load this document. Try again later or email mfvboy043@gmail.com."
      },
      ja: {
        back: "← 火龍果護照に戻る",
        privacy: "プライバシーポリシー",
        terms: "利用規約",
        lang: "言語",
        loading: "読み込み中…",
        error: "文書を読み込めません。しばらくしてから再試行するか、mfvboy043@gmail.com までご連絡ください。"
      },
      ko: {
        back: "← 화룡과 여권으로 돌아가기",
        privacy: "개인정보 처리방침",
        terms: "이용약관",
        lang: "언어",
        loading: "불러오는 중…",
        error: "문서를 불러올 수 없습니다. 잠시 후 다시 시도하거나 mfvboy043@gmail.com으로 연락하세요."
      }
    };
    return map[locale] || map["zh-Hant"];
  }

  function paintChrome(doc, slug, locale, version) {
    const copy = chromeCopy(locale);
    const back = doc.querySelector("[data-legal-back]");
    const cross = doc.querySelector("[data-legal-cross]");
    const langLabel = doc.querySelector("[data-legal-lang-label]");
    const langSelect = doc.querySelector("[data-legal-lang]");
    if (back) {
      back.textContent = copy.back;
      back.setAttribute("href", "../index.html");
    }
    if (cross) {
      const other = slug === "privacy" ? "terms" : "privacy";
      cross.textContent = slug === "privacy" ? copy.terms : copy.privacy;
      cross.setAttribute(
        "href",
        `./${other}.html?v=${encodeURIComponent(version)}&lang=${encodeURIComponent(locale)}`
      );
    }
    if (langLabel) langLabel.textContent = copy.lang;
    if (langSelect) langSelect.value = locale;
    doc.documentElement.lang = locale === "zh-Hant" ? "zh-Hant" : locale;
    return copy;
  }

  async function bootLegalDocPage(doc, win) {
    const slug = doc.body?.dataset?.legalDoc;
    const target = doc.getElementById("legal-doc-body");
    if (!slug || !target) return;

    const params = new URLSearchParams(win.location.search || "");
    const version = params.get("v") || DEFAULT_VERSION;
    const locale = normalizeLocale(params.get("lang") || params.get("locale"));
    const copy = paintChrome(doc, slug, locale, version);
    target.innerHTML = `<p class="legal-loading">${escapeHtml(copy.loading)}</p>`;

    try {
      const res = await fetch(markdownUrl(slug, locale, version));
      if (!res.ok) throw new Error("load_failed");
      const md = await res.text();
      target.innerHTML = renderMarkdown(md);
      doc.title = `${titleFor(slug, locale)} · 火龍果護照`;
    } catch {
      target.innerHTML = `<p class="legal-error">${escapeHtml(copy.error)}</p>`;
    }
  }

  function wireLocaleSwitcher(doc, win) {
    const langSelect = doc.querySelector("[data-legal-lang]");
    if (!langSelect || langSelect.dataset.wired === "1") return;
    langSelect.dataset.wired = "1";
    langSelect.addEventListener("change", () => {
      const params = new URLSearchParams(win.location.search || "");
      params.set("lang", langSelect.value);
      if (!params.get("v")) params.set("v", DEFAULT_VERSION);
      win.location.search = params.toString();
    });
  }

  const doc = global.document;
  if (doc && doc.body?.classList?.contains("legal-page")) {
    wireLocaleSwitcher(doc, global);
    bootLegalDocPage(doc, global);
  }

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};
  root.shell.renderLegalMarkdown = renderMarkdown;
  root.shell.bootLegalDocPage = bootLegalDocPage;
  root.shell.normalizeLegalLocale = normalizeLocale;
  root.shell.legalMarkdownUrl = markdownUrl;
})(typeof window !== "undefined" ? window : globalThis);
