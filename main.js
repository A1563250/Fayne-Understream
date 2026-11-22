/* ============================================================
   溺川夜雨 · 主交互脚本
   导航注入 / 加载页 / 首访提示 / 角落状态 / 页面级渲染
   ============================================================ */

(function () {
  "use strict";

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const body = document.body;
  const PAGE = body.dataset.page || "";

  /* ---------- 提示条 ---------- */

  let toastTimer = null;
  function toast(msg, gold) {
    let el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.toggle("gold", !!gold);
    el.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("on"), 3200);
  }
  window.nichuanToast = toast;

  /* ---------- 通用导航 / 页脚 ---------- */

  const NAV = [
    { href: "index.html",    t: "启程",     s: "首页" },
    { href: "gallery.html",  t: "映画馆藏", s: "作品" },
    { href: "about.html",    t: "溺川档案", s: "关于" },
    { href: "messages.html", t: "未达回声", s: "留言" },
    { href: "radio.html",    t: "雨夜频段", s: "录音" },
    { href: "bond.html",     t: "心轨刻度", s: "羁绊" }
  ];

  function buildShell() {
    const nav = document.createElement("header");
    nav.className = "topnav";
    nav.innerHTML =
      '<a class="brand" href="index.html"><b>溺川夜雨</b><span>NICHUAN · RAIN ARCHIVE</span></a>' +
      '<button id="navToggle" aria-label="菜单">☰</button>' +
      '<nav class="navlinks">' +
      NAV.map(n => '<a href="' + n.href + '" data-nav="' + n.href + '">' +
        '<span class="t">' + n.t + '</span><span class="s">' + n.s + '</span></a>').join("") +
      "</nav>";
    document.querySelector(".stage").prepend(nav);

    const foot = document.createElement("footer");
    foot.className = "footer";
    foot.innerHTML =
      "<div>© 妃音·辞 · 溺川影像档案</div>" +
      '<div class="fline">溺川今夜有雨，馆藏暂未关闭。</div>' +
      '<div class="fline">不公开手机号、私人微信与现实住址。</div>';
    document.querySelector(".stage").appendChild(foot);

    $$(".navlinks a").forEach(a => {
      if (a.dataset.nav === location.pathname.split("/").pop() ||
          (PAGE === "home" && a.dataset.nav === "index.html")) a.classList.add("cur");
    });

    const tg = $("#navToggle");
    if (tg) tg.addEventListener("click", () => $(".navlinks").classList.toggle("open"));
  }

  /* ---------- 角落状态 + 等级反馈 ---------- */

  function buildCorner() {
    const el = document.createElement("div");
    el.className = "corner-status";
    el.innerHTML =
      '<div class="status-chip"><span class="net-dot online" id="netDot"></span>' +
      "<span>雨势 <b>暴雨</b></span><span>雷频 <b>低</b></span></div>" +
      '<div class="status-chip"><span>身份</span>' +
      '<a class="lv" href="bond.html" title="心轨刻度">溺途访者</a></div>';
    document.body.appendChild(el);
    refreshCorner();
    /* 在线/离线检测 */
    const dot = $("#netDot", el);
    const updateNet = () => {
      if (!dot) return;
      if (navigator.onLine) { dot.classList.remove("offline"); dot.classList.add("online"); }
      else { dot.classList.remove("online"); dot.classList.add("offline"); }
    };
    window.addEventListener("online", updateNet);
    window.addEventListener("offline", updateNet);
    updateNet();
  }

  function refreshCorner() {
    if (!window.BondSys) return;
    const L = BondSys.getLevel();
    const link = $(".corner-status .lv");
    if (link) link.textContent = "Lv." + L.lv + " · " + L.name;
  }

  function bindLevelFx() {
    if (!window.BondSys) return;
    BondSys.onLevel(res => {
      refreshCorner();
      if (res.leveled) {
        const L = BondSys.getLevel();
        toast("心轨刻度提升 · Lv." + L.lv + " " + L.name + " —— " + L.unlock + " 已解锁", true);
      } else if (res.label) {
        toast("已记录：" + res.label + " · 心轨 +" + res.pts);
      }
    });
  }

  /* ---------- 加载页 ---------- */

  function buildLoader() {
    const el = document.createElement("div");
    el.id = "loader";
    el.innerHTML =
      "<h2>溺川正在落雨</h2>" +
      '<div class="lsub">信号穿过潮湿的楼群，影像档案正在重新显影。</div>' +
      '<div class="bar"><i></i></div>' +
      '<div class="tick">正在校准雨夜坐标……</div>';
    document.body.appendChild(el);

    const ticks = [
      "正在校准雨夜坐标……",
      "正在接收水面下的光……",
      "正在擦去玻璃上的雾……",
      "正在拼接遗失的映像……",
      "溺川的雨势逐渐清晰……"
    ];
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % ticks.length;
      const tk = $("#loader .tick");
      if (tk) tk.textContent = ticks[i];
    }, 900);
    setTimeout(() => {
      clearInterval(t);
      el.classList.add("off");
    }, 2100);
  }

  /* ---------- 首次进入提示 ---------- */

  function buildFirstMask() {
    const st = window.BondSys ? BondSys.get() : null;
    if (!st || st.firstVisit) return;
    const el = document.createElement("div");
    el.id = "firstMask";
    el.innerHTML =
      '<div class="card panel">' +
      "<p>今夜，溺川与你的记忆短暂重叠。</p>" +
      "<p>这里收藏着被雨水洗净的城市、梦境、角色与旧日切片。若你愿意继续前行，" +
      "脚步会被记录在本地的雨痕中；这些记录不会被上传，也不会用于追踪身份。</p>" +
      "<small>仅保存在你的浏览器本地 · 不登录 · 不同步</small>" +
      '<div class="row">' +
      '<a class="btn primary" href="gallery.html">进入溺川</a>' +
      '<a class="btn" href="about.html">先了解这座城市</a>' +
      "</div></div>";
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("on"), 2300);
  }

  /* ================= 首页 ================= */

  function initHome() {
    // 人物照片（未配置时保持剪影占位；加载失败也自动解除剪影，避免遮挡作品）
    const silhouette = $("#portraitSilhouette");
    if (window.SITE_DATA && window.SITE_DATA.assets.portrait) {
      const photo = $("#portraitPhoto");
      if (photo) {
        photo.style.backgroundImage = 'url("' + window.SITE_DATA.assets.portrait + '")';
        const pre = new Image();
        pre.onload = () => {
          photo.classList.add("on");
          if (silhouette) silhouette.style.display = "none";
        };
        pre.onerror = () => {
          // 图片加载失败：直接淡出剪影，不再遮挡
          if (silhouette) silhouette.style.opacity = "0";
        };
        // 兜底：3 秒后无论如何解除剪影，避免永久挡图
        setTimeout(() => {
          if (silhouette && !pre.complete) silhouette.style.opacity = "0";
        }, 3000);
        pre.src = window.SITE_DATA.assets.portrait;
        const tag = $("#portraitTag");
        if (tag) tag.textContent = "拾遗者影像 · 已收录";
      }
    }
    if (window.BondSys) {
      BondSys.award("daily_return");   // 首页进入也计回访（settleVisit 已处理首访）
    }
  }

  /* ================= 作品集 ================= */

  function initGallery() {
    const themeNote = $("#themeNote");
    const track = $("#track");
    const dots = $("#dots");
    let filter = "all";

    function themeOf(id) {
      return window.SITE_DATA.themes.find(t => t.id === id) || { name: "未知区域" };
    }

    function cardHTML(w) {
      const t = themeOf(w.theme);
      const hasImg = !!w.image;
      const isLost = !w.isDemo && !hasImg;
      const likes = (window.__likeStore && window.__likeStore[w.id]) || 0;
      const liked  = (window.__likeLiked && window.__likeLiked[w.id]) || false;
      return (
        '<article class="wcard" data-id="' + w.id + '" data-theme="' + w.theme + '">' +
        '<div class="thumb">' +
        (hasImg ? '<img src="' + w.image + '" alt="' + w.title + '" loading="lazy">' :
          '<div class="ph"><div class="glyph">' + (w.isDemo ? "映" : "遗") + "</div>" +
          "<small>" + (w.isDemo ? "临时映像 · 待生成" : "尚未送抵溺川") + "</small></div>") +
        '<span class="badge ' + (w.isDemo ? "demo" : "lost") + '">' +
        (w.isDemo ? "临时映像 / DEMO" : isLost ? "遗失的光" : "馆藏") + "</span>" +
        '<button class="like-btn ' + (liked ? "liked" : "") + '" data-like="' + w.id + '">♥ ' + likes + "</button>" +
        "</div>" +
        '<div class="meta"><h3>' + w.title + "</h3>" +
        '<div class="mrow"><span>' + t.name + "</span><span>" +
        (w.year || (w.isDemo ? "年份待定" : "待补")) + "</span></div></div>" +
        '<div class="hover-hint">查看映像</div>' +
        "</article>"
      );
    }

    function render() {
      const list = filter === "all" ? window.SITE_DATA.works
        : window.SITE_DATA.works.filter(w => w.theme === filter);
      track.innerHTML = list.map(cardHTML).join("") ||
        '<div class="prose">没有在当前雨层中找到对应的映像。请更换关键词，或回到全部馆藏。</div>';
      $$(".wcard", track).forEach(c => {
        c.addEventListener("click", e => {
          if (e.target.closest(".like-btn")) return;   // 点赞按钮不跳转
          if (window.BondSys) BondSys.award("theme_first", c.dataset.theme);
          location.href = "work.html?work=" + c.dataset.id;
        });
      });
      $$(".like-btn", track).forEach(btn => {
        btn.addEventListener("click", e => {
          e.stopPropagation();
          const id = btn.dataset.like;
          window.__likeStore = window.__likeStore || JSON.parse(localStorage.getItem("fn_likes") || "{}");
          window.__likeLiked = window.__likeLiked || JSON.parse(localStorage.getItem("fn_liked") || "{}");
          if (window.__likeLiked[id]) {
            window.__likeStore[id] = Math.max(0, (window.__likeStore[id] || 1) - 1);
            window.__likeLiked[id] = false;
          } else {
            window.__likeStore[id] = (window.__likeStore[id] || 0) + 1;
            window.__likeLiked[id] = true;
            if (window.BondSys) BondSys.award("msg_reply");
            toast("这枚光已被你拾起。", true);
          }
          localStorage.setItem("fn_likes", JSON.stringify(window.__likeStore));
          localStorage.setItem("fn_liked", JSON.stringify(window.__likeLiked));
          render();
        });
      });
      /* 点赞按钮白夜颜色 */
      const isNight = document.body.classList.contains("fx-night");
      $$(".like-btn", track).forEach(btn => {
        btn.classList.remove("day-like", "night-like");
        btn.classList.add(isNight ? "night-like" : "day-like");
      });
      buildDots();
    }

    function buildDots() {
      const cards = $$(".wcard", track);
      dots.innerHTML = cards.map((c, i) =>
        '<i data-i="' + i + '"' + (i === 0 ? ' class="cur"' : "") + "></i>").join("");
      $$("i", dots).forEach(d => d.addEventListener("click", () => {
        const c = cards[+d.dataset.i];
        if (c) track.scrollTo({ left: c.offsetLeft - track.offsetLeft - 20, behavior: "smooth" });
      }));
    }

    track.addEventListener("scroll", () => {
      const cards = $$(".wcard", track);
      const idx = Math.round(track.scrollLeft / (cards[0] ? cards[0].offsetWidth + 26 : 1));
      $$("i", dots).forEach((d, i) => d.classList.toggle("cur", i === Math.min(idx, cards.length - 1)));
    }, { passive: true });

    $("#prevBtn").addEventListener("click", () =>
      track.scrollBy({ left: -340, behavior: "smooth" }));
    $("#nextBtn").addEventListener("click", () =>
      track.scrollBy({ left: 340, behavior: "smooth" }));

    /* 上传作品到雨幕（本地存储） */
    const uploadZone = $("#uploadZone");
    const uploadInput = $("#uploadInput");
    if (uploadZone && uploadInput) {
      uploadZone.addEventListener("click", () => uploadInput.click());
      uploadInput.addEventListener("change", () => {
        const file = uploadInput.files && uploadInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const mine = JSON.parse(localStorage.getItem("fn_my_uploads") || "[]");
          mine.push({ name: file.name, data: reader.result, t: Date.now() });
          localStorage.setItem("fn_my_uploads", JSON.stringify(mine));
          toast("你的光已被溺川收录（仅存在此浏览器）。", true);
          uploadZone.innerHTML = '<div style="font-size:24px;margin-bottom:6px">🌧</div>' +
            '<div style="color:#4fd8e8">已投递 ' + mine.length + ' 枚光</div>' +
            '<div style="font-size:11.5px;color:#6c7a99;margin-top:6px">点击可继续投递</div>';
        };
        reader.readAsDataURL(file);
      });
    }

    document.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") track.scrollBy({ left: 340, behavior: "smooth" });
      if (e.key === "ArrowLeft")  track.scrollBy({ left: -340, behavior: "smooth" });
    });

    $$(".filters .chip").forEach(chip => {
      chip.addEventListener("click", () => {
        $$(".filters .chip").forEach(c => c.classList.remove("cur"));
        chip.classList.add("cur");
        filter = chip.dataset.f;
        const t = window.SITE_DATA.themes.find(x => x.id === filter);
        if (themeNote) {
          if (t) {
            themeNote.innerHTML =
              '<div class="tn-head"><span class="tn-no">' + t.no + "</span><h2>" +
              t.name + "</h2></div><p>" + t.desc + "</p>";
          } else {
            themeNote.innerHTML =
              '<div class="tn-head"><h2>全部映像</h2></div>' +
              "<p>被雨水保存的光，仍在玻璃之后闪烁。你可以横向穿过五个区域，也可以停在任意一张映像前。</p>";
          }
        }
        if (window.BondSys && filter !== "all") BondSys.award("theme_first", filter);
        render();
      });
    });

    render();
  }

  /* ================= 作品详情 ================= */

  function initWork() {
    const params = new URLSearchParams(location.search);
    const id = params.get("work");
    const w = window.SITE_DATA.works.find(x => x.id === id);

    if (!w) {
      $("#workBody").innerHTML =
        '<div class="lost-404"><div class="code">404</div><h1>走失于溺川支线</h1>' +
        "<p>你抵达的坐标不存在，或已被昨夜的雨水改写。</p>" +
        '<a class="btn" href="gallery.html">返回映画馆藏</a></div>';
      return;
    }

    const t = window.SITE_DATA.themes.find(x => x.id === w.theme) || {};
    document.title = w.title + " · 映像详情 · 溺川夜雨";

    $("#workTitle").textContent = w.title;
    $("#crumbTheme").textContent = t.no + "｜" + t.name;

    const hero = $("#workHero");
    hero.innerHTML = w.image
      ? '<img src="' + w.image + '" alt="' + w.title + '">'
      : '<div class="empty"><div class="glyph">光</div>' +
        "<p>" + (w.isDemo ? "临时映像 · 生成后将在此显影" : "这枚映像尚未送抵溺川") + "</p></div>";

    const rows = [
      ["所属区域", t.name || "—"],
      ["显影年份", w.year || (w.isDemo ? "待定" : "待补")],
      ["映像形式", w.medium || (w.isDemo ? "待定" : "待补")],
      ["媒介 / 工具", w.tools || "媒介未公开"],
      ["标注", w.isDemo ? "临时映像 / DEMO，非正式馆藏" : "—"]
    ];
    $("#metaRows").innerHTML = rows.map(r =>
      '<div class="row"><span class="k">' + r[0] + '</span><span class="v">' + r[1] + "</span></div>").join("") +
      '<div class="row"><span class="k">标签</span><span class="v tags">' +
      (w.tags && w.tags.length ? w.tags.map(x => "<em>" + x + "</em>").join("") : "<em>未标注</em>") +
      "</span></div>";

    $("#noteText").textContent = w.note ||
      (w.isDemo ? "此卡仅用于雨夜档案的视觉演示，并非正式馆藏。真实映像抵达后，将覆盖当前残影。"
                : "这枚映像没有留下额外注释。它保留原始的沉默。");

    // 上一枚 / 下一枚
    const list = window.SITE_DATA.works;
    const idx = list.findIndex(x => x.id === w.id);
    const prev = list[idx - 1], next = list[idx + 1];
    $("#prevWork").innerHTML = prev ? "← 上一枚光 · " + prev.title : "已是雨幕起点";
    $("#nextWork").innerHTML = next ? "下一枚光 · " + next.title + " →" : "已是馆藏尽头";
    if (prev) $("#prevWork").addEventListener("click", () =>
      location.href = "work.html?work=" + prev.id);
    else $("#prevWork").setAttribute("disabled", "");
    if (next) $("#nextWork").addEventListener("click", () =>
      location.href = "work.html?work=" + next.id);
    else $("#nextWork").setAttribute("disabled", "");

    if (window.BondSys) {
      const r = BondSys.award("work_view", w.id);
      if (!r) setTimeout(() => toast("你在此映像前停留过片刻。心轨刻度已记录这段雨痕。"), 800);
    }
  }

  /* ================= 关于页 ================= */

  function initAbout() {
    const c = window.SITE_DATA.contact;
    const R = window.SITE_DATA.reality;

    /* 可调用的光（按当前羁绊等级解锁） */
    const myLv = (window.BondSys && BondSys.state && BondSys.state.level) || 1;
    const lightsRow = $("#lightsRow");
    if (lightsRow && R.lights) {
      lightsRow.innerHTML = R.lights.map(L => {
        const unlocked = myLv >= L.lv;
        return '<div class="light-item panel ' + (unlocked ? "" : "locked") + '">' +
          '<div class="l-head"><b>Lv.' + L.lv + '</b><span>' + (unlocked ? L.name : "尚未抵达") + "</span></div>" +
          '<p class="l-desc">' + (unlocked ? L.desc : "当你在雨中走得更深，这枚光会被递到手上。") + "</p>" +
        "</div>";
      }).join("");
    }

    /* 事件记录（按羁绊等级渐进解锁） */
    const eventLog = $("#eventLog");
    if (eventLog && R.eventLog) {
      eventLog.innerHTML = R.eventLog.map(E => {
        const unlocked = myLv >= E.lv;
        return '<div class="event-item ' + (unlocked ? "" : "locked") + '">' +
          '<div class="e-head"><span>Lv.' + E.lv + "</span><b>" + (unlocked ? E.title : "未被命名") + "</b></div>" +
          '<p class="e-body">' + (unlocked ? E.content : "档案尚未记录这一段。继续在雨中停留，事件会自己浮上来。") + "</p>" +
        "</div>";
      }).join("");
    }

    /* 时间坐标 */
    const yearsCell = $("#yearsCell");
    if (yearsCell) yearsCell.textContent = R.years || "时间坐标尚未公开。";

    /* 联系方式 */
    const box = $("#contactBox");
    let html = "";
    if (c.email) {
      html += '<div class="contact-row"><div class="cl"><b>邮箱</b><span>' + c.email +
        '</span></div><button class="copy-btn" data-copy="' + c.email + '">复制坐标</button></div>';
    }
    if (c.socials && c.socials.length) {
      c.socials.forEach(s => {
        const handle = s.handle || "";
        html += '<div class="contact-row"><div class="cl"><b>' + s.name + '</b><span>' + handle + '</span></div>' +
          '<a class="copy-btn" href="' + s.url + '" target="_blank" rel="noopener">前往</a></div>';
      });
    }
    if (c.landing) {
      html += '<p class="privacy-line" style="margin-top:14px;font-style:italic;color:#a8b8d8">' + c.landing + '</p>';
    }
    html += '<p class="privacy-line">不公开手机号、私人微信与现实住址。</p>';
    box.innerHTML = html;

    $$(".copy-btn[data-copy]", box).forEach(btn => {
      btn.addEventListener("click", () => {
        navigator.clipboard && navigator.clipboard.writeText(btn.dataset.copy);
        toast("坐标已复制。");
      });
    });

    const zone = $("#contactZone");
    if (zone) {
      const onContact = () => {
        if (window.BondSys) BondSys.award("contact_view");
        toast("公开联络坐标已记录在案。");
        zone.removeEventListener("click", onContact);
      };
      zone.addEventListener("click", onContact);
    }

    if (window.BondSys) {
      const r = BondSys.award("about_read");
      if (!r) setTimeout(() => toast("档案已在本地留下阅读雨痕。"), 700);
    }
  }

  /* ================= 消息页 ================= */

  function initMessages() {
    const flow = $("#msgFlow");
    const bond = window.BondSys ? BondSys.get() : { points: 0 };
    const st = window.BondSys ? BondSys.get() : null;

    const conditions = {
      greet: () => true,
      after_works: () => st && Object.values(st.worksSeen).some(a => a.length),
      after_about: () => stHas(st, "about_read"),
      radio_hint: () => PAGE === "radio" || sessionStorage.getItem("fn_radio_seen") === "1",
      contact_hint: () => stHas(st, "contact_view"),
      hidden: (m) => bond.points >= (m.unlockAt || 0)
    };
    function stHas(s, key) {
      return s && Object.values(s.dailyDone || {}).some(day => day && day[key]);
    }

    flow.innerHTML = window.SITE_DATA.messages.map(m => {
      const ok = (conditions[m.kind] || conditions.greet)(m);
      const read = window.BondSys ? BondSys.hasRead(m.id) : false;
      const lockedHidden = m.kind === "hidden" && !ok;
      return (
        '<div class="msg ' + (m.kind === "hidden" ? "hidden-msg" : "") + " " +
        (ok ? "" : "locked") + '" data-msg="' + m.id + '">' +
        '<div class="avatar">' + (m.sender === "妃音·辞" ? "妃" : m.sender === "雨夜频段" ? "频" :
          m.sender === "雨后坐标" ? "坐" : "溺") + "</div>" +
        '<div class="bubble panel">' +
        '<div class="head"><span>' + m.sender + "</span><span>" + m.time + "</span></div>" +
        (ok
          ? '<div class="body">' + m.content + "</div>" +
            (m.actions
              ? '<div class="acts">' + m.actions.map(a =>
                  '<a class="btn sm" href="' + a.href + '" data-ev="' + a.event + '">' +
                  a.label + "</a>").join("") + "</div>"
              : "")
          : '<div class="locked-line">' +
            (lockedHidden ? "── 需要更高的心轨刻度才能接通 ──" : "── 未达 · 雨夜尚未传来这条回声 ──") +
            "</div>") +
        (!ok ? "" : read ? "" : '<div class="locked-line" style="margin-top:8px;opacity:.6">● 未读</div>') +
        "</div></div>"
      );
    }).join("");

    $$(".msg", flow).forEach(el => {
      if (el.classList.contains("locked")) return;
      const id = el.dataset.msg;
      const reveal = () => {
        if (window.BondSys) BondSys.readMessage(id);
        const badge = $(".locked-line", el);
        if (badge && badge.textContent.includes("未读")) badge.remove();
      };
      el.addEventListener("click", reveal, { once: true });
      if (window.BondSys && BondSys.hasRead(id)) {
        const badge = $(".locked-line", el);
        if (badge && badge.textContent.includes("未读")) badge.remove();
      }
    });

    $$("a[data-ev]", flow).forEach(a => {
      a.addEventListener("click", () => {
        if (window.BondSys) BondSys.award("msg_reply");
      });
    });

    /* ---------- 伪 AI 互动留言 ---------- */
    const replyBox = $(".reply-box");
    if (replyBox) initReply(replyBox);
  }

  /* 伪 AI 回复语料库（按关键词匹配） */
  function pickReply(text, emoji) {
    const t = (text || "").toLowerCase();
    const rules = [
      { k: ["你好", "hi", "hello", "在吗", "嗨"], r: "夜还没有完全深。你能找到这里，说明雨没有阻挡你。先在馆里随便走走，不必急着说什么。" },
      { k: ["作品", "画", "图", "画得好", "好看"], r: "这些光不是一次就被拾起的。它们曾在不同的夜里被我反复看过，最后才被允许放进馆藏。" },
      { k: ["谢谢", "感谢", "辛苦"], r: "不必谢。你愿意在雨里走这一段，已经是给这些映像最好的回声。" },
      { k: ["难过", "伤心", "孤独", "累", "emo"], r: "今夜的雨比较重。如果这些影像暂时不能替你带走什么，至少它们没有让你一个人看雨。" },
      { k: ["开心", "高兴", "棒", "喜欢"], r: "听见了。在溺川，开心也是一种会被记下的天气。" },
      { k: ["想你", "想念", "喜欢"], r: "……这些话不必大声说出来。雨会替我们接住。" },
      { k: ["天气", "下雨", "雨"], r: "今晚雨势 4 级。远处有低频雷声。水面波纹完整。档案馆正常运转。" },
      { k: ["几点", "时间", "现在"], r: "溺川的时间停在某个暴雨夜之后。现实里几点钟，要看你窗外的天。" },
      { k: ["邮箱", "邮件", "联系"], r: "公开邮箱已留在档案末尾。私人坐标不会出现在馆藏。" },
      { k: ["小红书", "号"], r: "小红书会更新一些没有进馆藏的碎片。看与不看，都不算失礼。" },
      { k: ["以后", "未来", "下次"], r: "若雨停之后仍想回来，馆藏深处会为再次抵达的人留一盏很暗的灯。" },
    ];
    for (const rule of rules) {
      if (rule.k.some(word => t.includes(word.toLowerCase()))) return rule.r;
    }
    /* 表情兜底 */
    if (emoji === "😊") return "你的表情被雨幕接收。今夜的湿度因此上升了一点点。";
    if (emoji === "😢") return "雨和眼泪有时候长得很像。不必掩饰，馆藏见过更湿的人。";
    if (emoji === "😮") return "你被什么吓到了？或许是雷声，或许是某张映画。";
    if (emoji === "😴") return "困的话就把页面放着，雨声适合当白噪音。";
    if (emoji === "🌧") return "雨势记录已收到。今夜的雨与你无关，但与这里有关。";
    if (emoji === "💌") return "这枚信封被档案馆收下了。它不会被寄出，但会被读很多遍。";
    return "信号断续。我没有完全听清你说的话，但我已经把它抄在了档案的边角。";
  }

  function initReply(box) {
    const ta = box.querySelector("#replyText");
    const log = box.querySelector("#replyLog");
    const send = box.querySelector("#replySend");
    let chosenEmoji = null;

    /* 表情 → 语音文件映射 */
    const VOICE_MAP = {
      "ice_nod": "voice_happy.mp3",
      "ice_welcome": "voice_happy.mp3",
      "ice_hold": "voice_happy.mp3",
      "ice_rain": "voice_rain.mp3",
      "ice_gn": "voice_sleepy.mp3",
      "bride_give": "voice_miss.mp3",
      "bride_recv": "voice_happy.mp3",
      "bride_here": "voice_sad.mp3"
    };

    function playVoice(emoji) {
      const file = VOICE_MAP[emoji];
      if (!file) return;
      /* 先停掉正在播放的 */
      if (window.__replyAudio) {
        try { window.__replyAudio.pause(); } catch (e) {}
      }
      const audio = new Audio(file);
      audio.volume = 0.85;
      audio.play().catch(() => {});
      window.__replyAudio = audio;
    }

    box.querySelectorAll(".emoji-row button").forEach(b => {
      b.addEventListener("click", () => {
        chosenEmoji = b.dataset.emoji;
        ta.value = (ta.value ? ta.value + " " : "") + chosenEmoji;
        ta.focus();
        playVoice(chosenEmoji);
      });
    });
    send.addEventListener("click", () => {
      const text = (ta.value || "").trim();
      if (!text) { toast("先写下一句回声。"); return; }
      const me = document.createElement("div");
      me.innerHTML = '<span class="me">你：</span>' + text;
      log.appendChild(me);
      ta.value = "";
      if (window.BondSys) BondSys.award("msg_reply");
      /* 模拟 1.2 秒延迟回复 */
      send.disabled = true; send.textContent = "雨幕接通中…";
      setTimeout(() => {
        const r = pickReply(text, chosenEmoji);
        const her = document.createElement("div");
        her.innerHTML = '<span class="her">妃音·辞：</span>' + r;
        log.appendChild(her);
        send.disabled = false; send.textContent = "穿过雨幕发送";
        chosenEmoji = null;
        log.scrollTop = log.scrollHeight;
      }, 1200);
    });
  }

  /* ================= 录音页 ================= */

  function initRadio() {
    sessionStorage.setItem("fn_radio_seen", "1");
    const list = $("#recList");
    const st = window.BondSys ? BondSys.get() : { points: 0 };

    list.innerHTML = window.SITE_DATA.recordings.map(r => {
      const locked = r.unlockedAt > 0 && st.points < r.unlockedAt;
      const noFile = !r.file;
      return (
        '<div class="rec-card panel ' + (locked ? "locked" : "") + '" data-rec="' + r.id + '">' +
        '<button class="rbtn" ' + (locked || noFile ? "disabled" : "") +
        ' title="' + (locked ? "心轨刻度不足" : noFile ? "频段尚未录入" : "接通频段") + '">▶</button>' +
        '<div class="rinfo"><h3>' + r.title + "</h3>" +
        '<div class="rsub">' + r.duration + " · " + (r.unlockedAt > 0 ? "Lv.3 坠雨渡梦之使解锁" : "开放频段") +
        "</div>" +
        '<button class="script-toggle">查看文字稿 ▾</button>' +
        '<div class="script-body">' + r.script + "</div></div>" +
        '<div class="rstate">' + (locked ? "刻度不足" : noFile ? "待录入" : "可接通") + "</div>" +
        "</div>"
      );
    }).join("");

    $$(".rec-card", list).forEach(card => {
      const id = card.dataset.rec;
      const r = window.SITE_DATA.recordings.find(x => x.id === id);
      const tg = $(".script-toggle", card);
      tg.addEventListener("click", () => {
        $(".script-body", card).classList.toggle("on");
        tg.textContent = $(".script-body", card).classList.contains("on")
          ? "收起文字稿 ▴" : "查看文字稿 ▾";
      });
      const btn = $(".rbtn", card);
      btn.addEventListener("click", () => {
        if (!r.file) return;
        let audio = $("audio[data-play='" + id + "']");
        if (!audio) {
          audio = document.createElement("audio");
          audio.dataset.play = id; audio.src = r.file; audio.preload = "metadata";
          document.body.appendChild(audio);
          audio.addEventListener("ended", () => { btn.textContent = "▶"; });
        }
        if (audio.paused) {
          $$(".rbtn", list).forEach(b => { if (b !== btn) b.textContent = "▶"; });
          $$("audio").forEach(a => { if (a !== audio) a.pause(); });
          audio.play().catch(() => toast("频段被浏览器暂时拦截。请再次点击播放按钮，或检查设备音量。"));
          btn.textContent = "❚❚";
          if (window.BondSys) BondSys.award("rec_play", id);
        } else {
          audio.pause(); btn.textContent = "▶";
        }
      });
    });
  }

  /* ================= 羁绊页 ================= */

  function initBond() {
    const st = BondSys.get();
    const L = BondSys.getLevel();
    const next = BondSys.nextLevel();

    $("#bondLvNo").textContent = "Lv." + L.lv;
    $("#bondName").textContent = L.name;
    $("#bondFb").textContent = L.feedback;
    const pct = next
      ? Math.min(100, Math.round((st.points - L.min) / (next.min - L.min) * 100))
      : 100;
    $("#bondFill").style.width = pct + "%";
    $("#bondNums").innerHTML =
      "<span>刻度 " + st.points + "</span><span>" +
      (next ? "下一级 " + next.min + " · " + next.name : "心轨已满 · 溺川挚友") + "</span>";

    $("#ruleList").innerHTML = BondSys.rules.map(r =>
      "<li><span>" + r.label + "</span><b>+" + r.pts + "</b></li>").join("") +
      '<li><span>单日理论上限</span><b>≈ ' + window.SITE_DATA.bond.dailyMax + "</b></li>";

    $("#lvlGrid").innerHTML = BondSys.levels.map(x =>
      '<div class="lvl-card panel ' + (st.level >= x.lv ? "done" : "") + " " +
      (x.lv === st.level ? "cur-lv" : "") + '">' +
      '<div class="no">LV.' + x.lv + " · " + x.min + ' 刻度</div><h4>' + x.name + "</h4>" +
      "<p>" + x.feedback + "</p>" +
      '<div class="un">解锁 · ' + x.unlock + "</div></div>").join("");

    // 纪念卡（Lv.4）
    const mem = $("#memorial");
    const memOk = st.level >= 4;
    mem.classList.toggle("locked", !memOk);
    $("#memState").textContent = memOk
      ? "椿色印记已留在纸页边缘，作为再次抵达的凭证。"
      : "需要达到 Lv.4 · 遗渡溺川之椿，印记才会显影。";

    // 最终回声（Lv.5）
    const echo = $("#finalEcho");
    if (st.level >= 5) {
      echo.classList.remove("locked");
      echo.innerHTML =
        "<h3>" + window.SITE_DATA.bond.finalEcho.title + "</h3>" +
        '<p class="sys">' + window.SITE_DATA.bond.finalEcho.system + "</p>" +
        '<p class="per">' + window.SITE_DATA.bond.finalEcho.personal + "</p>" +
        '<div class="row">' + window.SITE_DATA.bond.finalEcho.actions.map(a =>
          '<a class="btn sm ' + (a.label.indexOf("坐标") > -1 ? "gold" : "") + '" href="' +
          a.href + '">' + a.label + "</a>").join("") + "</div>";
    }

    $("#clearBtn").addEventListener("click", () => {
      if (confirm("清除后，等级、解锁消息与本地回访记录将回到初始状态。核心作品不会受到影响。确定清除吗？")) {
        BondSys.clearAll();
        toast("本地雨痕已清除。溺川回到最初的一夜。");
        setTimeout(() => location.reload(), 1200);
      }
    });

    refreshCorner();
  }

  /* ================= 启动 ================= */

  document.addEventListener("DOMContentLoaded", function () {
    buildLoader();

    // 数据文件缺失时的友好降级（避免白屏崩溃）
    if (!window.SITE_DATA) {
      console.error("[溺川夜雨] site-data.js 未能加载，请检查文件是否已上传。");
      const lb = $("#loader");
      if (lb) {
        lb.classList.add("off");
        const st = document.createElement("div");
        st.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:300;background:#04080f;color:#8fa0bd;font-size:14px;line-height:2;text-align:center;padding:24px;";
        st.innerHTML = "溺川的雨幕太浓，数据文件没能抵达。<br>请检查 site-data.js 是否已正确上传，然后刷新页面。";
        document.body.appendChild(st);
      }
      return;
    }

    buildShell();
    buildCorner();
    bindLevelFx();

    const visitKind = window.BondSys ? BondSys.settleVisit() : "same";

    if (PAGE === "home") {
      if (visitKind === "first") buildFirstMask();
      initHome();
    } else if (PAGE === "gallery") initGallery();
    else if (PAGE === "work") initWork();
    else if (PAGE === "about") initAbout();
    else if (PAGE === "messages") initMessages();
    else if (PAGE === "radio") initRadio();
    else if (PAGE === "bond") initBond();
    else if (PAGE === "404") { /* 静态页 */ }

    document.querySelector(".stage").classList.add("fade-page");

    /* ---------- 背景视差微动（鼠标移动时 hero_bg 轻微偏移） ---------- */
    if (!document.body.classList.contains("lowperf") && !window.matchMedia("(max-width: 768px)").matches) {
      const bg = document.querySelector(".hero-bg-img");
      if (bg) {
        let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;
        window.addEventListener("mousemove", e => {
          tx = (e.clientX / window.innerWidth - 0.5) * 12;  /* ±6px */
          ty = (e.clientY / window.innerHeight - 0.5) * 8;  /* ±4px */
          if (!raf) raf = requestAnimationFrame(tick);
        }, { passive: true });
        function tick() {
          cx += (tx - cx) * 0.06;
          cy += (ty - cy) * 0.06;
          bg.style.transform = "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0)";
          if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
            raf = requestAnimationFrame(tick);
          } else { raf = null; }
        }
      }
    }

    /* ================= 新增：鼠标特效 + 待机 + 白夜切换 ================= */

    /* --- 特效白夜主题：白天雾蓝 / 夜晚猩红 --- */
    function applyFxTheme() {
      const fxOn = (window.NichuanWeather && typeof NichuanWeather.getFxDayNight === "function")
        ? NichuanWeather.getFxDayNight() : true;
      let isNight;
      if (!fxOn) {
        isNight = false;   /* 开关关闭：恒定白天色 */
      } else {
        const h = new Date().getHours();
        isNight = (h >= 18 || h < 6);
      }
      document.body.classList.toggle("fx-night", isNight);
      document.body.classList.toggle("fx-day", !isNight);
      const glow = document.getElementById("cursorGlow");
      if (glow) {
        glow.classList.remove("day", "night");
        glow.classList.add(isNight ? "night" : "day");
      }
      return isNight ? "night" : "day";
    }
    window.__applyFxTheme = applyFxTheme;
    applyFxTheme();
    setInterval(applyFxTheme, 60000);

    /* 点击特效：Fenay 花样字 + 光粒子 */
    function spawnClickFx(x, y) {
      if (document.body.classList.contains("lowperf")) return;
      const theme = applyFxTheme();

      /* Fenay 文字 */
      const t = document.createElement("div");
      t.className = "fenay-text " + theme;
      t.textContent = "Fenay";
      t.style.left = x + "px";
      t.style.top = y + "px";
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 1200);

      /* 光粒子 */
      const p = document.createElement("div");
      p.className = "click-particle " + theme;
      p.style.left = x + "px";
      p.style.top = y + "px";
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 20;
      p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      p.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }

    document.addEventListener("click", (e) => spawnClickFx(e.clientX, e.clientY));

    /* 手机端：手指点击产生特效 */
    document.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      if (t) spawnClickFx(t.clientX, t.clientY);
    }, { passive: true });

    /* 鼠标拖尾光晕（跟随鼠标 + 手指滑动） */
    if (!document.body.classList.contains("lowperf") && !window.matchMedia("(max-width: 768px)").matches) {
      const glow = document.createElement("div");
      glow.id = "cursorGlow";
      glow.className = (document.body.classList.contains("fx-night") ? "night" : "day");
      document.body.appendChild(glow);
      document.addEventListener("mousemove", (e) => {
        glow.style.transform = `translate(${e.clientX - 100}px, ${e.clientY - 100}px)`;
      });
    } else if (!document.body.classList.contains("lowperf")) {
      /* 手机端也放一个轻量光晕，跟随手指 */
      const glow = document.createElement("div");
      glow.id = "cursorGlow";
      glow.style.width = "140px"; glow.style.height = "140px";
      glow.className = (document.body.classList.contains("fx-night") ? "night" : "day");
      document.body.appendChild(glow);
      document.addEventListener("touchmove", (e) => {
        const t = e.touches[0];
        if (t) glow.style.transform = `translate(${t.clientX - 70}px, ${t.clientY - 70}px)`;
      }, { passive: true });
    }

    /* 待机 25 秒昏暗模式 + 人物穿出互动 */
    let idleTimer = null;
    let idleDialog = null;
    let idleAudio = null;

    function buildIdleDialog() {
      if (idleDialog) return idleDialog;
      idleDialog = document.createElement("div");
      idleDialog.id = "idleDialog";
      idleDialog.innerHTML =
        '<div class="dialog-head"><span>妃音·辞</span><span>溺川频段 · 待机中</span></div>' +
        '<div class="dialog-body" id="idleText">……</div>' +
        '<div style="font-size:12px;color:#8995b3;margin-top:10px">🎤 用语音回答她即可离开待机（需浏览器麦克风权限）</div>';
      document.body.appendChild(idleDialog);
      return idleDialog;
    }

    /* 多条待机轮播：语音文件 + 同步文字 */
    const IDLE_LINES = [
      { audio: "idle_voice_01.mp3", text: "雨幕停了一会儿。你还在吗？……如果只是路过，不必回应；如果愿意停一下，馆藏深处有光想给你看。" },
      { audio: "idle_voice_02.mp3", text: "……这里的雨很少停。你愿意陪我等它一会儿吗？" },
      { audio: "idle_voice_03.mp3", text: "夜深了。我把馆藏的灯调暗了一点，怕晃到你的眼睛。" }
    ];
    let idleLineIdx = 0;

    function startVoiceRecognition(onResult) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        toast("这个浏览器不支持语音回应，动一下鼠标也能叫醒她。");
        return;
      }
      const rec = new SR();
      rec.lang = "zh-CN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => onResult(e.results[0][0].transcript);
      rec.onerror = () => toast("没听清，再说一次？或动一下鼠标也行。");
      rec.start();
    }

    function handleIdleReply(replyText) {
      if (idleAudio) { try { idleAudio.pause(); } catch (e) {} idleAudio = null; }
      if (idleDialog) {
        const body = idleDialog.querySelector("#idleText");
        if (body) body.innerHTML = '<span style="color:#7ab8ff">你：</span>' + replyText;
      }
      setTimeout(() => {
        if (idleDialog) idleDialog.classList.remove("show");
        document.body.classList.remove("idle-mode");
        toast("好。馆藏的灯重新为你亮起。", true);
        resetIdle();
      }, 1500);
    }

    function triggerIdleMode() {
      document.body.classList.add("idle-mode");
      setTimeout(() => {
        if (!document.body.classList.contains("idle-mode")) return;
        const dlg = buildIdleDialog();
        const line = IDLE_LINES[idleLineIdx % IDLE_LINES.length];
        idleLineIdx++;
        const body = dlg.querySelector("#idleText");
        if (body) body.textContent = line.text;
        dlg.classList.add("show");
        try {
          idleAudio = new Audio(line.audio);
          idleAudio.volume = 0.8;
          idleAudio.play().catch(() => {});
        } catch (e) {}
        /* 语音播放完后自动开启访客语音识别 */
        setTimeout(() => {
          if (document.body.classList.contains("idle-mode")) {
            startVoiceRecognition((text) => handleIdleReply(text));
          }
        }, 3000);
      }, 2000);
    }

    function resetIdle() {
      document.body.classList.remove("idle-mode");
      if (idleDialog) idleDialog.classList.remove("show");
      if (idleAudio) { try { idleAudio.pause(); } catch (e) {} idleAudio = null; }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(triggerIdleMode, 25000);
    }
    ["mousemove", "click", "keydown", "scroll", "touchstart"].forEach(evt => {
      document.addEventListener(evt, resetIdle, { passive: true });
    });
    resetIdle();

    /* 白夜 portrait 自动切换 + 手动切换按钮 */
    const photo = $("#portraitPhoto");
    if (photo) {
      const dayImg = "portrait_day_blue.jpg";    // 冰蓝少女
      const nightImg = "portrait_night_red.jpg"; // 红眼新娘
      let forceMode = null;  // 访客手动覆盖："day" / "night" / null(自动)

      function applyPortrait() {
        let isNight;
        if (forceMode === "day") isNight = false;
        else if (forceMode === "night") isNight = true;
        else {
          const h = new Date().getHours();
          isNight = (h >= 18 || h < 6);
        }
        photo.style.backgroundImage = `url("${isNight ? nightImg : dayImg}")`;
      }
      applyPortrait();
      setInterval(applyPortrait, 60000);

      /* 右下角切换按钮 */
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "portrait-toggle";
      toggleBtn.title = "切换白夜形象";
      toggleBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const h = new Date().getHours();
        const autoNight = (h >= 18 || h < 6);
        /* 循环：自动 → 强制白天 → 强制夜晚 → 自动 */
        if (forceMode === null) forceMode = autoNight ? "day" : "night";
        else if (forceMode === "day") forceMode = "night";
        else forceMode = null;
        applyPortrait();
        toast(forceMode === null ? "已跟随现实时间" : (forceMode === "day" ? "已切换为冰蓝形象" : "已切换为红眼形象"));
      });
      const figure = document.querySelector(".hero-figure");
      if (figure) figure.appendChild(toggleBtn);
    }

    /* 霓虹色彩动态层 */
    const neon = document.createElement("div");
    neon.id = "neonLayer";
    document.body.appendChild(neon);

    /* ================= Giscus 真实留言板 ================= */
    /* 配置区：你从 giscus.app 拿到的两个 ID 填在这里 */
    const GISCUS_CONFIG = {
      repo: "A1563250/飞音下游",
      repo_id: "R_kgDOV3UZPA",
      category: "Announcements",
      category_id: "DIC_kwDOV3UZPM4DLtuc",
      mapping: "pathname",
      theme: "dark_dimmed",
      lang: "zh-CN",
      reactions: "1",
      emit_metadata: "0",
      input_position: "bottom",
      loading: "lazy"
    };

    function loadGiscus() {
      const holder = document.getElementById("giscusThread");
      if (!holder) return;
      /* 还没配置 ID 时给提示 */
      if (GISCUS_CONFIG.repo_id.startsWith("PASTE")) {
        holder.innerHTML = '<div style="padding:20px;border:1px dashed rgba(140,170,255,0.3);border-radius:8px;color:#8995b3;font-size:13px;text-align:center">' +
          '留言板尚未配置。请按说明文档填入 repo_id 和 category_id。</div>';
        return;
      }
      const s = document.createElement("script");
      s.src = "https://giscus.app/client.js";
      s.setAttribute("data-repo", GISCUS_CONFIG.repo);
      s.setAttribute("data-repo-id", GISCUS_CONFIG.repo_id);
      s.setAttribute("data-category", GISCUS_CONFIG.category);
      s.setAttribute("data-category-id", GISCUS_CONFIG.category_id);
      s.setAttribute("data-mapping", GISCUS_CONFIG.mapping);
      s.setAttribute("data-strict", "0");
      s.setAttribute("data-reactions-enabled", GISCUS_CONFIG.reactions);
      s.setAttribute("data-emit-metadata", GISCUS_CONFIG.emit_metadata);
      s.setAttribute("data-input-position", GISCUS_CONFIG.input_position);
      s.setAttribute("data-theme", GISCUS_CONFIG.theme);
      s.setAttribute("data-lang", GISCUS_CONFIG.lang);
      s.setAttribute("data-loading", GISCUS_CONFIG.loading);
      s.crossOrigin = "anonymous";
      s.async = true;
      holder.appendChild(s);
    }
    loadGiscus();

    /* ================= Lv.5 彩蛋：访客点击产生白夜红蓝涟漪 ================= */
    if (window.BondSys) {
      const st = BondSys.get();
      if (st.level >= 5) {
        document.addEventListener("click", (e) => {
          const isNight = document.body.classList.contains("fx-night");
          const r = document.createElement("div");
          r.className = "touch-ripple " + (isNight ? "night" : "day");
          r.style.left = e.clientX + "px";
          r.style.top = e.clientY + "px";
          document.body.appendChild(r);
          setTimeout(() => r.remove(), 1200);
        });
      }
    }
  });
})();
