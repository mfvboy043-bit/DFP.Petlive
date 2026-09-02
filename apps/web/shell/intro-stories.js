(function initPetLiveWebShellIntroStories(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  root.shell = root.shell || {};

  const MOBILE_MQ = "(max-width: 759px)";

  function createIntroStoriesMarkup(options = {}) {
    const { includeHeader = true } = options;
    const header = includeHeader
      ? `<p class="intro-stories-eyebrow" data-i18n="introStoriesEyebrow">四則故事</p>
        <h2 class="intro-stories-title" id="intro-stories-heading" data-i18n="introStoriesTitle">
          換院、急診時，紀錄有跟著走嗎？
        </h2>`
      : "";

    return `${header}
        <div class="intro-stories-stack">
          <article class="intro-story-card">
            <details class="intro-story-disclosure" data-intro-story="vet-letter">
              <summary class="intro-story-summary">
                <span class="intro-story-index" aria-hidden="true">01</span>
                <h3 class="intro-story-title" data-i18n-html="introStory3Title">
                  謎豆子的第二次機會<br /><span class="intro-story-subtitle">（ ✉️ 給全天下獸醫師的一封信 ）</span>
                </h3>
                <span class="intro-story-chevron" aria-hidden="true"></span>
              </summary>
              <div class="intro-story-body" data-i18n-html="introStory3Body">
                <p class="story-epigraph">✉️ <em>給全天下獸醫師的一封信</em></p>
                <p>半夜，謎豆子突然一直吐，連站都站不穩。<br />主人趕快抱著牠去醫院。</p>
                <p>醫生一邊救謎豆子，一邊問：</p>
                <blockquote><p>「牠今天吃過什麼藥？」</p><p>「有打過什麼針嗎？」</p></blockquote>
                <p>主人搖搖頭：</p>
                <blockquote><p>「我不知道，只知道下午看過醫生。」</p></blockquote>
                <p>醫生很著急。因為寵物不會說話，<br />沒有人能告訴他，牠的身體今天發生過什麼事。<br />他只能<strong>一邊救，一邊猜</strong>。</p>
                <p>還好，最後慢慢好起來了。醫生摸摸牠的頭，心裡想：</p>
                <blockquote class="story-pull"><p><strong>「如果我早一點知道，就好了。」</strong></p></blockquote>
                <hr class="story-divider" />
                <p>所以，我們想替謎豆子留下一張<strong>小小的紙條</strong>：</p>
                <ul class="story-list"><li>今天吃了什麼藥</li><li>打了什麼針</li></ul>
                <p class="story-note">醫院如果不想寫名字，也可以不寫。</p>
                <p>因為這張紙條<strong>不是用來找誰做錯事</strong>。<br />它只是上一位醫生，留給下一位醫生的一句話：</p>
                <blockquote class="story-pull story-pull--closing story-pull--oneliner"><p><strong>「我先照顧過牠了，接下來，換你幫我照顧牠。」</strong></p></blockquote>
              </div>
            </details>
          </article>
          <article class="intro-story-card intro-story-card--founder">
            <details class="intro-story-disclosure">
              <summary class="intro-story-summary">
                <span class="intro-story-index" aria-hidden="true">02</span>
                <h3 class="intro-story-title" data-i18n="introStory4Title">我為什麼會做這個網頁？</h3>
                <span class="intro-story-chevron" aria-hidden="true"></span>
              </summary>
              <div class="intro-story-body" data-i18n-html="introStory4Body">
                <p>身為飼主，我想很多人都曾經有過這樣的念頭：</p>
                <blockquote class="story-pull">
                  <p><strong>「如果我早一點知道呢？」</strong></p>
                  <p><strong>「如果當時手上再多一點資訊呢？」</strong></p>
                </blockquote>
                <p>也許，有些事情就會不一樣。這樣的遺憾，也曾經發生在我身上。</p>
                <hr class="story-divider" />
                <p>當我們帶著寵物換一家醫院看診時，新的醫師常常不知道牠之前做過什麼檢查、吃過什麼藥、接受過什麼治療。醫師只能重新詢問、重新判斷，有時甚至必須重新檢查。</p>
                <p>不是因為前一位醫師做得不夠好。而是因為那些重要的資訊，<strong>沒有一起跟著牠來到下一間醫院。</strong></p>
                <p>對人來說，我們有健保與醫療資訊系統。換了一位醫師，過去的檢查、用藥與醫療紀錄，仍有機會成為下一次判斷的重要參考。</p>
                <p>可是寵物沒有自己的「健康存摺」。牠不會說話，也無法告訴下一位醫師：</p>
                <ul class="story-list">
                  <li><strong>「我之前吃過什麼藥。」</strong></li>
                  <li><strong>「我曾經做過什麼檢查。」</strong></li>
                  <li><strong>「我的身體以前發生過什麼事。」</strong></li>
                </ul>
                <hr class="story-divider" />
                <p>所以，我想替牠們留下一份可以帶著走的醫療紀錄。讓每一次看診，不再只是一次結束後就散落的記憶；而是一塊一塊被保存下來，陪著牠走到下一位醫師面前的資訊。</p>
                <p>我不知道這份紀錄有一天能不能真的救下一條生命。但我希望，當那個最關鍵的時刻來臨時，飼主可以少說一次：</p>
                <blockquote class="story-pull"><p><strong>「如果我早一點知道就好了。」</strong></p></blockquote>
                <p>而醫師，也可以多一點資訊，去做下一個重要的決定。</p>
                <p>這就是我想做這個網頁的原因。</p>
                <blockquote class="story-pull story-pull--closing"><p><strong>讓重要的醫療資訊，跟著牠一起走。</strong></p></blockquote>
              </div>
            </details>
          </article>
          <article class="intro-story-card">
            <details class="intro-story-disclosure">
              <summary class="intro-story-summary">
                <span class="intro-story-index" aria-hidden="true">03</span>
                <h3 class="intro-story-title" data-i18n="introStory1Title">半夜急診那張空白紙</h3>
                <span class="intro-story-chevron" aria-hidden="true"></span>
              </summary>
              <div class="intro-story-body" data-i18n-html="introStory1Body">
                <p>豆豆在 A 醫院吃了很強的藥，爸爸只記得「有吃」，<strong>沒記名字</strong>。</p>
                <p>幾天後<strong>半夜</strong>，豆豆突然沒精神、開始吐，爸爸抱著衝去 B 醫院急診。</p>
                <p>醫生驗血：</p>
                <blockquote class="story-pull"><p><strong>肝臟數字像紅燈狂閃。</strong></p></blockquote>
                <p>可 B 醫院不知道——豆豆前幾天已經吃過<strong>類固醇</strong>。</p>
                <p>醫生不敢亂加藥，只能一項一項查。<br />豆豆在等，爸爸在急，<strong>最好的黃金時間，就這樣溜走</strong>。</p>
              </div>
            </details>
          </article>
          <article class="intro-story-card">
            <details class="intro-story-disclosure">
              <summary class="intro-story-summary">
                <span class="intro-story-index" aria-hidden="true">04</span>
                <h3 class="intro-story-title" data-i18n="introStory2Title">為什麼看了很多醫生都沒用</h3>
                <span class="intro-story-chevron" aria-hidden="true"></span>
              </summary>
              <div class="intro-story-body" data-i18n-html="introStory2Body">
                <p>米米在 A 醫院吃過 A 抗生素，好一點又復發。</p>
                <p>爸爸帶去 C 醫院，新醫生問：</p>
                <blockquote><p>「之前吃過什麼？」</p></blockquote>
                <p>爸爸也說不清。醫生只好再開<strong>同一種 A 抗生素</strong>。米米還是咳、還是癢。</p>
                <p>爸爸心裡想：</p>
                <blockquote class="story-pull"><p>「是不是看了很多醫生都沒用？」</p></blockquote>
                <p>其實不是。是沒有一張小紙，告訴下一位醫生：</p>
                <blockquote class="story-pull story-pull--closing"><p><strong>「這個藥試過了，沒效。」</strong></p></blockquote>
              </div>
            </details>
          </article>
        </div>
        <p class="intro-stories-bridge" data-i18n-html="introStoriesBridge">
          換院、急診、換醫生時，<br />把「試過什麼、吃過什麼」帶著走。
        </p>
        <p class="intro-stories-note" data-i18n="introStoriesNote">以上為理解情境之示意，不取代獸醫診斷。</p>`;
  }

  function resolveScope(doc, hooks = {}) {
    if (hooks.root && typeof hooks.root.querySelectorAll === "function") return hooks.root;
    return doc;
  }

  function paintIntroStoryAria(doc, t, hooks = {}) {
    if (!doc) return;
    const scope = resolveScope(doc, hooks);
    scope.querySelectorAll(".intro-story-disclosure").forEach((details) => {
      const summary = details.querySelector("summary");
      if (!summary) return;
      const titleEl = summary.querySelector(".intro-story-title");
      const title = titleEl?.textContent?.trim() || "";
      const key = details.open ? "introStoryCollapse" : "introStoryExpand";
      const hint = typeof t === "function" ? t(key) : "";
      summary.setAttribute("aria-label", title && hint ? `${title} — ${hint}` : hint || title);
    });
  }

  function syncIntroStoryDisclosures(doc, win, hooks = {}) {
    if (!doc || !win?.matchMedia) return;
    const scope = resolveScope(doc, hooks);
    const mobile = win.matchMedia(MOBILE_MQ).matches;
    const disclosures = scope.querySelectorAll(".intro-story-disclosure");
    disclosures.forEach((details, index) => {
      if (details.dataset.userToggled === "1") return;
      if (hooks.vetLetterFirst && index === 0) {
        details.open = true;
        return;
      }
      details.open = !mobile;
    });
    paintIntroStoryAria(doc, hooks.t, hooks);
  }

  function initIntroStories(doc, win, hooks = {}) {
    if (!doc) return;
    const scope = resolveScope(doc, hooks);

    scope.querySelectorAll(".intro-story-disclosure").forEach((details) => {
      if (details.dataset.introStoryBound === "1") return;
      details.dataset.introStoryBound = "1";
      details.addEventListener("toggle", () => {
        details.dataset.userToggled = "1";
        paintIntroStoryAria(doc, hooks.t, hooks);
      });
    });

    syncIntroStoryDisclosures(doc, win, hooks);

    if (!win || win.__introStoriesMqBound) return;
    win.__introStoriesMqBound = true;
    const mq = win.matchMedia(MOBILE_MQ);
    const resync = () => syncIntroStoryDisclosures(doc, win, hooks);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", resync);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(resync);
    }
  }

  function mountIntroStories(doc, mountEl, options = {}) {
    if (!doc || !mountEl) return;
    const { includeHeader = true } = options;
    mountEl.innerHTML = createIntroStoriesMarkup({ includeHeader });
  }

  root.shell.createIntroStoriesMarkup = createIntroStoriesMarkup;
  root.shell.mountIntroStories = mountIntroStories;
  root.shell.initIntroStories = initIntroStories;
  root.shell.syncIntroStoryDisclosures = syncIntroStoryDisclosures;
  root.shell.paintIntroStoryAria = paintIntroStoryAria;
})(typeof window !== "undefined" ? window : globalThis);
