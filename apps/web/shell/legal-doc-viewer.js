(function initPetLiveLegalDocViewer(global) {
  "use strict";

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

  async function bootLegalDocPage(doc, win) {
    const slug = doc.body?.dataset?.legalDoc;
    const target = doc.getElementById("legal-doc-body");
    if (!slug || !target) return;

    const params = new URLSearchParams(win.location.search || "");
    const version = params.get("v") || "20260828-legal-v13";
    target.innerHTML = "<p class=\"legal-loading\">載入中…</p>";

    try {
      const res = await fetch(`./${slug}.md?v=${encodeURIComponent(version)}`);
      if (!res.ok) throw new Error("load_failed");
      const md = await res.text();
      target.innerHTML = renderMarkdown(md);
      doc.title = `${slug === "privacy" ? "隱私權政策" : "醫療免責與使用條款"} · 火龍果護照`;
    } catch {
      target.innerHTML =
        "<p class=\"legal-error\">無法載入文件。請稍後再試或來信 mfvboy043@gmail.com。</p>";
    }
  }

  const doc = global.document;
  if (doc && doc.body?.classList?.contains("legal-page")) {
    bootLegalDocPage(doc, global);
  }

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};
  root.shell.renderLegalMarkdown = renderMarkdown;
  root.shell.bootLegalDocPage = bootLegalDocPage;
})(typeof window !== "undefined" ? window : globalThis);
