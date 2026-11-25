(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = {
    all: [],
    filtered: [],
    shown: 0,
    page: 60,
    selected: null,
    manifest: null,
  };

  const mv = $("mv");
  const stage = $("stage");
  const grid = $("grid");

  const els = {
    stats: $("statsLine"),
    search: $("search"),
    category: $("category"),
    subcategory: $("subcategory"),
    source: $("source"),
    style: $("style"),
    sort: $("sort"),
    animated: $("animated"),
    ai: $("ai"),
    reset: $("resetBtn"),
    resultCount: $("resultCount"),
    resultBytes: $("resultBytes"),
    pageInfo: $("pageInfo"),
    loadMore: $("loadMore"),
    noResults: $("noResults"),
    title: $("assetTitle"),
    sub: $("assetSub"),
    badges: $("assetBadges"),
    empty: $("emptyState"),
    loading: $("loading"),
    loadingText: $("loadingText"),
    error: $("error"),
    meta: $("meta"),
    animRow: $("animRow"),
    animSelect: $("animSelect"),
    playBtn: $("playBtn"),
    rotateBtn: $("rotateBtn"),
    wireBtn: $("wireBtn"),
    gridBtn: $("gridBtn"),
    fullBtn: $("fullBtn"),
    resetCam: $("resetCam"),
    exposure: $("exposure"),
    bg: $("bg"),
    random: $("randomBtn"),
  };

  const fmtNum = (n) => new Intl.NumberFormat("en-US").format(Number(n) || 0);

  function fmtBytes(n) {
    n = Number(n) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const ASSETS_BASE = String(window.ASSETS_BASE || "/assets").replace(/\/+$/, "");

  function assetURL(rel) {
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    const clean = String(rel).replace(/^\.\.\//, "").replace(/^\.\//, "");
    if (!ASSETS_BASE || ASSETS_BASE === "/") {
      return new URL(clean, window.location.href).href;
    }
    const base = new URL(ASSETS_BASE, window.location.origin);
    if (!base.pathname.endsWith("/")) base.pathname += "/";
    return new URL(clean, base).href;
  }

  function resolvePreview(preview) {
    return assetURL(preview);
  }

  function resolveModel(path) {
    return assetURL(path);
  }

  function placeholderPoster(asset) {
    const colors = ["#134e4a", "#1e3a8a", "#3f2d1e", "#3b1d3f", "#1e3b2f", "#3a2a12"];
    let hash = 0;
    const key = String(asset.id || asset.title || "x");
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    const bg = colors[hash % colors.length];
    const letter = esc((asset.title || "3D").trim().charAt(0).toUpperCase());
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="320" viewBox="0 0 512 320">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#0b1017"/>
      </linearGradient></defs>
      <rect width="512" height="320" fill="url(#g)"/>
      <circle cx="420" cy="60" r="120" fill="rgba(94,234,212,.10)"/>
      <text x="256" y="185" text-anchor="middle" font-family="Arial" font-size="92" font-weight="700" fill="rgba(232,238,247,.28)">${letter}</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function setStats() {
    const m = state.manifest;
    if (!m) return;
    const sources = Object.keys(m.sources || {}).length;
    els.stats.textContent = `${fmtNum(m.total)} أصل · ${fmtBytes(m.totalBytes)} · ${sources} مصادر`;
  }

  function fillSelect(select, values, allLabel) {
    select.innerHTML = "";
    const all = document.createElement("option");
    all.value = "";
    all.textContent = allLabel;
    select.appendChild(all);
    values.forEach((v) => {
      const o = document.createElement("option");
      o.value = v.value;
      o.textContent = v.label;
      select.appendChild(o);
    });
  }

  function fillSubcategories() {
    const cat = els.category.value;
    const pool = state.all.filter((a) => !cat || a.category === cat);
    const map = new Map();
    pool.forEach((a) => {
      const key = a.subcategory || "";
      if (key && !map.has(key)) map.set(key, key.replace(/_/g, " "));
    });
    const values = [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "en"))
      .map(([value, label]) => ({ value, label }));
    fillSelect(els.subcategory, values, "كل المجموعات");
  }

  function setupFilters() {
    const catMap = new Map();
    state.all.forEach((a) => {
      if (!catMap.has(a.category)) catMap.set(a.category, a.categoryAr || a.category);
    });
    fillSelect(
      els.category,
      [...catMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([value, label]) => ({ value, label })),
      "كل الفئات"
    );
    const sources = [...new Set(state.all.map((a) => a.source).filter(Boolean))].sort();
    fillSelect(els.source, sources.map((s) => ({ value: s, label: s })), "كل المصادر");
    const styles = [...new Set(state.all.map((a) => a.style).filter(Boolean))].sort();
    fillSelect(els.style, styles.map((s) => ({ value: s, label: s })), "كل الأنماط");
    fillSubcategories();
  }

  function applyFilters() {
    const q = els.search.value.trim().toLowerCase();
    const cat = els.category.value;
    const sub = els.subcategory.value;
    const source = els.source.value;
    const style = els.style.value;
    const onlyAnim = els.animated.checked;
    const onlyAi = els.ai.checked;

    let list = state.all.filter((a) => {
      if (cat && a.category !== cat) return false;
      if (sub && a.subcategory !== sub) return false;
      if (source && a.source !== source) return false;
      if (style && a.style !== style) return false;
      if (onlyAnim && !a.animated) return false;
      if (onlyAi && !a.ai) return false;
      if (q) {
        const hay = [a.title, a.id, a.category, a.categoryAr, a.subcategory, a.source, a.style, a.url]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sort = els.sort.value;
    if (sort === "sizeDesc") list.sort((a, b) => b.bytes - a.bytes);
    else if (sort === "sizeAsc") list.sort((a, b) => a.bytes - b.bytes);
    else if (sort === "category") list.sort((a, b) => (a.category + a.subcategory + a.title).localeCompare(b.category + b.subcategory + b.title, "en"));
    else list.sort((a, b) => a.title.localeCompare(b.title, "en"));

    state.filtered = list;
    state.shown = 0;
    grid.innerHTML = "";
    els.noResults.classList.toggle("hidden", list.length > 0);
    updateCounts();
    renderMore();
  }

  function updateCounts() {
    const list = state.filtered;
    const shownBytes = list.reduce((sum, a) => sum + (a.bytes || 0), 0);
    els.resultCount.textContent = `${fmtNum(list.length)} نموذج`;
    els.resultBytes.textContent = fmtBytes(shownBytes);
    els.pageInfo.textContent = `عرض ${fmtNum(Math.min(state.shown, list.length))} من ${fmtNum(list.length)}`;
    const done = state.shown >= list.length;
    els.loadMore.disabled = done;
    els.loadMore.textContent = done ? "تم عرض الكل" : "عرض المزيد";
    els.loadMore.style.opacity = done ? ".5" : "1";
  }

  function makeBadge(text, cls) {
    const b = document.createElement("span");
    b.className = "badge" + (cls ? " " + cls : "");
    b.textContent = text;
    return b;
  }

  function cardFor(asset) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.dataset.id = asset.id;
    card.title = asset.title;

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    const preview = resolvePreview(asset.preview);
    if (preview) {
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = asset.title;
      img.src = preview;
      img.addEventListener("error", () => {
        img.remove();
        const fb = document.createElement("div");
        fb.className = "thumb-fallback";
        fb.textContent = (asset.title || "3D").charAt(0).toUpperCase();
        thumb.insertBefore(fb, thumb.firstChild);
      });
      thumb.appendChild(img);
    } else {
      const fb = document.createElement("div");
      fb.className = "thumb-fallback";
      fb.textContent = (asset.title || "3D").charAt(0).toUpperCase();
      thumb.appendChild(fb);
    }

    const badges = document.createElement("div");
    badges.className = "badges";
    badges.appendChild(makeBadge(asset.format, asset.format === "glTF" ? "gltf" : ""));
    if (asset.animated) badges.appendChild(makeBadge("متحرك", "anim"));
    if (asset.ai) badges.appendChild(makeBadge("AI", "ai"));
    thumb.appendChild(badges);
    card.appendChild(thumb);

    const body = document.createElement("div");
    body.className = "card-body";
    const h3 = document.createElement("h3");
    h3.textContent = asset.title;
    const p = document.createElement("p");
    p.textContent = (asset.subcategory || "").replace(/_/g, " ");
    body.appendChild(h3);
    body.appendChild(p);

    const foot = document.createElement("div");
    foot.className = "card-foot";
    const src = document.createElement("span");
    src.textContent = asset.source;
    const size = document.createElement("span");
    size.textContent = fmtBytes(asset.bytes);
    foot.appendChild(src);
    foot.appendChild(size);
    body.appendChild(foot);
    card.appendChild(body);

    card.addEventListener("click", () => selectAsset(asset));
    return card;
  }

  function renderMore() {
    const start = state.shown;
    const end = Math.min(start + state.page, state.filtered.length);
    if (start >= end) {
      updateCounts();
      return;
    }
    const frag = document.createDocumentFragment();
    for (let i = start; i < end; i++) {
      const card = cardFor(state.filtered[i]);
      if (state.selected && String(state.selected.id) === String(state.filtered[i].id)) {
        card.classList.add("selected");
      }
      frag.appendChild(card);
    }
    grid.appendChild(frag);
    state.shown = end;
    updateCounts();
  }

  function badgeList(asset) {
    els.badges.innerHTML = "";
    els.badges.appendChild(makeBadge(asset.source));
    els.badges.appendChild(makeBadge(asset.format));
    if (asset.animated) els.badges.appendChild(makeBadge("متحرك", "anim"));
    if (asset.ai) els.badges.appendChild(makeBadge("AI", "ai"));
  }

  function metaFor(asset) {
    const rows = [
      ["المصدر", esc(asset.source)],
      ["الفئة", `${esc(asset.categoryAr)} — ${esc(asset.subcategory)}`],
      ["التنسيق", esc(asset.format)],
      ["الحجم", fmtBytes(asset.bytes)],
      ["المثلثات", asset.triangles ? fmtNum(asset.triangles) : "غير محدد"],
      ["الحركات", asset.animations ? fmtNum(asset.animations) : (asset.animated ? "rigged / متحرك" : "ثابت")],
      ["الترخيص", "CC0 1.0 — ملكية عامة"],
      ["المسار", `<code>${esc(asset.path)}</code>`],
    ];
    let html = rows.map(([k, v]) => `<div class="meta-row"><b>${k}</b><span>${v}</span></div>`).join("");
    if (asset.ai) {
      html += `<div class="meta-row"><b>ملاحظة</b><span class="note">مولّد بالذكاء الاصطناعي — راجع asset_info.json للتفاصيل.</span></div>`;
    }
    const modelUrl = resolveModel(asset.path);
    html += `<div class="meta-links">`;
    if (asset.url) html += `<a href="${esc(asset.url)}" target="_blank" rel="noopener">صفحة المصدر</a>`;
    html += `<a href="${esc(modelUrl)}" download>تنزيل الملف</a>`;
    html += `<a href="${esc(modelUrl)}" target="_blank" rel="noopener">فتح في تبويب</a>`;
    html += `</div>`;
    return html;
  }

  function markSelected() {
    document.querySelectorAll(".card.selected").forEach((c) => c.classList.remove("selected"));
    if (!state.selected) return;
    const cards = document.querySelectorAll(".card");
    for (const c of cards) {
      if (String(c.dataset.id) === String(state.selected.id)) {
        c.classList.add("selected");
        break;
      }
    }
  }

  function setHash(id) {
    const target = "#asset=" + encodeURIComponent(String(id));
    if (window.location.hash !== target) {
      history.replaceState(null, "", target);
    }
  }

  function selectAsset(asset, fromHash) {
    if (!asset) return;
    state.selected = asset;
    markSelected();
    els.title.textContent = asset.title;
    els.sub.textContent = `${asset.categoryAr} · ${(asset.subcategory || "").replace(/_/g, " ")}`;
    badgeList(asset);
    els.meta.innerHTML = metaFor(asset);
    els.error.classList.add("hidden");
    els.empty.classList.add("hidden");
    els.loading.classList.remove("hidden");
    els.loadingText.textContent = "جارٍ تحميل النموذج…";
    els.animRow.classList.add("hidden");
    els.animSelect.innerHTML = "";
    els.playBtn.textContent = "إيقاف";

    mv.setAttribute("alt", asset.title);
    mv.setAttribute("src", resolveModel(asset.path));
    mv.autoplay = true;
    if (!fromHash) setHash(asset.id);

    if (window.innerWidth < 1100) {
      document.querySelector(".viewer-pane").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onModelLoad() {
    els.loading.classList.add("hidden");
    els.empty.classList.add("hidden");
    els.error.classList.add("hidden");
    if (typeof mv.dismissPoster === "function") mv.dismissPoster();
    const anims = Array.isArray(mv.availableAnimations) ? mv.availableAnimations : [];
    if (anims.length) {
      els.animRow.classList.remove("hidden");
      els.animSelect.innerHTML = "";
      anims.forEach((name, i) => {
        const o = document.createElement("option");
        o.value = name;
        o.textContent = name || `حركة ${i + 1}`;
        els.animSelect.appendChild(o);
      });
      mv.animationName = anims[0];
      mv.play();
      els.playBtn.textContent = "إيقاف";
    } else {
      els.animRow.classList.add("hidden");
    }
  }

  function onModelError() {
    els.loading.classList.add("hidden");
    els.error.classList.remove("hidden");
    const p = state.selected ? state.selected.path : "";
    els.error.innerHTML = `<div class="big-icon">!</div><p>تعذر تحميل النموذج. تأكد أن الخادم يعمل وأن ملفات glTF النصية موجودة بجانب ملفاتها.<br><code dir="ltr">${esc(p)}</code></p>`;
  }

  function onProgress(event) {
    const total = event && event.detail ? event.detail.totalProgress : 0;
    if (total > 0 && total < 1) {
      els.loadingText.textContent = `جارٍ التحميل… ${Math.round(total * 100)}%`;
    }
  }

  function setupViewerControls() {
    els.resetCam.addEventListener("click", () => {
      mv.cameraOrbit = "0deg 75deg auto";
      mv.cameraTarget = "auto auto auto";
      mv.fieldOfView = "auto";
      if (typeof mv.jumpCameraToGoal === "function") mv.jumpCameraToGoal();
    });
    els.rotateBtn.addEventListener("click", () => {
      const next = !mv.hasAttribute("auto-rotate");
      mv.toggleAttribute("auto-rotate", next);
      els.rotateBtn.classList.toggle("active", next);
    });
    els.wireBtn.addEventListener("click", () => {
      const next = !mv.hasAttribute("wireframe");
      mv.toggleAttribute("wireframe", next);
      els.wireBtn.classList.toggle("active", next);
    });
    els.gridBtn.addEventListener("click", () => {
      const next = !stage.classList.contains("show-grid");
      stage.classList.toggle("show-grid", next);
      els.gridBtn.classList.toggle("active", next);
    });
    els.fullBtn.addEventListener("click", () => {
      const target = stage;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (target.requestFullscreen) {
        target.requestFullscreen();
      }
    });
    els.exposure.addEventListener("input", () => {
      mv.exposure = parseFloat(els.exposure.value);
    });
    els.bg.addEventListener("input", () => {
      document.documentElement.style.setProperty("--stage-bg", els.bg.value);
    });
    els.playBtn.addEventListener("click", () => {
      if (mv.paused) {
        mv.play();
        els.playBtn.textContent = "إيقاف";
      } else {
        mv.pause();
        els.playBtn.textContent = "تشغيل";
      }
    });
    els.animSelect.addEventListener("change", () => {
      mv.animationName = els.animSelect.value;
      mv.play();
      els.playBtn.textContent = "إيقاف";
    });
    mv.addEventListener("load", onModelLoad);
    mv.addEventListener("error", onModelError);
    mv.addEventListener("progress", onProgress);
    mv.addEventListener("play", () => { els.playBtn.textContent = "إيقاف"; });
    mv.addEventListener("pause", () => { els.playBtn.textContent = "تشغيل"; });
  }

  function setupUI() {
    let timer = null;
    els.search.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(applyFilters, 160);
    });
    els.category.addEventListener("change", () => {
      fillSubcategories();
      applyFilters();
    });
    [els.subcategory, els.source, els.style, els.sort].forEach((el) =>
      el.addEventListener("change", applyFilters)
    );
    [els.animated, els.ai].forEach((el) => el.addEventListener("change", applyFilters));
    els.loadMore.addEventListener("click", renderMore);
    els.reset.addEventListener("click", () => {
      els.search.value = "";
      els.category.value = "";
      fillSubcategories();
      els.subcategory.value = "";
      els.source.value = "";
      els.style.value = "";
      els.sort.value = "title";
      els.animated.checked = false;
      els.ai.checked = false;
      applyFilters();
    });
    els.random.addEventListener("click", () => {
      const pool = state.filtered.length ? state.filtered : state.all;
      if (!pool.length) return;
      selectAsset(pool[Math.floor(Math.random() * pool.length)]);
    });
  }

  function handleHash() {
    const match = window.location.hash.match(/^#asset=(.+)$/);
    if (!match) return false;
    const id = decodeURIComponent(match[1]);
    const asset = state.all.find((a) => String(a.id) === id);
    if (asset) {
      selectAsset(asset, true);
      return true;
    }
    return false;
  }

  function init(manifest) {
    state.manifest = manifest;
    state.all = manifest.assets || [];
    setStats();
    setupFilters();
    setupUI();
    setupViewerControls();
    applyFilters();
    if (!handleHash()) {
      const preferred =
        state.all.find((a) => String(a.id) === "zpepqtthci") ||
        state.all.find((a) => String(a.id) === "fir_sapling") ||
        state.filtered[0];
      if (preferred) selectAsset(preferred);
    }
    window.addEventListener("hashchange", handleHash);
  }

  fetch(window.MANIFEST_URL || "manifest.json", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(init)
    .catch((err) => {
      els.stats.textContent = "تعذر تحميل manifest.json";
      els.error.classList.remove("hidden");
      els.error.innerHTML = `<div class="big-icon">!</div><p>تعذر تحميل فهرس المعرض.<br><code dir="ltr">${esc(err.message)}</code></p>`;
    });
})();
