/** ======================================================================
 * index.js ─ 三身分（resident/committee/vendor）＋穩定登入登出 + PWA
 * 要點：避免登入頁循環、next 正規化為相對路徑、跨分頁同步、軟性守門
 * ====================================================================== */

/* ============================ 身分狀態 ============================ */
const AUTH_KEY = "demo_auth_user";

const ROLE_LABELS = {
  resident: "住戶",
  committee: "管委會",
  vendor: "廠商",
  guest: "訪客"
};
// 舊別名自動歸一
const ROLE_ALIASES = { admin: "committee", user: "resident" };

const parseQuery = (qs) => Object.fromEntries(new URLSearchParams(qs || ""));
const getUserRaw = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch { return null; } };
const normalizeRole = (r) => ROLE_ALIASES[r] || r;
const getUser = () => {
  const u = getUserRaw();
  if (!u) return null;
  if (u.role && ROLE_ALIASES[u.role]) {
    u.role = normalizeRole(u.role);
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
  }
  return u;
};
const setUser = (u) => {
  if (u && u.role) u.role = normalizeRole(u.role);
  localStorage.setItem(AUTH_KEY, JSON.stringify(u || {}));
};
const clearUser = () => localStorage.removeItem(AUTH_KEY);
const isLoggedIn = () => !!localStorage.getItem(AUTH_KEY);
const getRole = () => normalizeRole((getUser()?.role) || "guest");
const hasRole = (...roles) => roles.includes(getRole());

/* ============================ 導頁輔助 ============================ */
/** 把任何 next 轉成「相對路徑」（解決 file:// 與 C:\...） */
function toRelative(n) {
  try {
    let raw = (n == null || n === "") ? (location.pathname + location.search + location.hash) : String(n);
    raw = raw.replace(/\\/g, "/"); // Windows 反斜線
    const u = new URL(raw, location.href);
    const file = (u.pathname.split("/").pop() || "index.html");
    const white = new Set(["index.html","auth.html","app.html","backend.html"]);
    const safeFile = white.has(file) ? file : "index.html";
    return safeFile + (u.search || "") + (u.hash || "");
  } catch {
    return "index.html";
  }
}
window.toRelative = toRelative;

/** 前往登入頁（只接受相對路徑），加入快取戳記避免 SW 舊檔 */
function gotoLogin(nextUrl) {
  const next = toRelative(nextUrl);
  const t = Date.now(); // cache-busting
  location.href = `auth.html?next=${encodeURIComponent(next)}&t=${t}`;
}

/** 一般頁保護（硬性）：未登入就導去登入 */
function ensureLogin() {
  if (isLoggedIn()) return true;
  gotoLogin();
  return false;
}

/** 後台頁保護（硬性）：
 *  - 未登入 → 登入頁（帶 next=backend.html）
 *  - 非「管委會」身分（包含廠商/住戶）→ 直接回首頁（避免來回循環）
 */
function ensureBackend() {
  if (!isLoggedIn()) { gotoLogin("backend.html"); return false; }
  if (!hasRole("committee")) {
    alert(`管理後台僅限管委會使用。\n你目前的身分：${ROLE_LABELS[getRole()]}`);
    location.replace("index.html");
    return false;
  }
  return true;
}

/** 兼容舊呼叫名稱 */
const ensureAdmin = ensureBackend;

/** 登入後導頁：先尊重 next（相對路徑）；否則依身分預設落點 */
function redirectAfterLogin(next, role) {
  if (next && !/^https?:\/\//i.test(next)) { location.href = next; return; }
  if (role === "committee") location.href = "backend.html";
  else location.href = "app.html"; // 廠商/住戶都回前台
}

/** 登出：受保護頁回首頁；首頁只更新 UI */
function logout() {
  clearUser();
  const path = location.pathname.replace(/^\//, "");
  if (path === "backend.html" || path === "app.html") {
    setTimeout(() => { location.replace("index.html"); }, 100);
  } else {
    updateAuthUI();
  }
}

/** 互動守門（軟性）：未登入 -> 導去登入（帶回跳）；已登入 -> 放行 */
function guardAction(next) {
  if (!isLoggedIn()) {
    gotoLogin(toRelative(next));
    return false;
  }
  return true;
}

/** 連結守門（軟性）：<a href="app.html#xx" onclick="return gotoProtected(event)"> */
function gotoProtected(ev) {
  if (!isLoggedIn()){
    ev?.preventDefault?.();
    const href = ev?.currentTarget?.getAttribute('href')
      || (location.pathname + location.search + location.hash);
    gotoLogin(toRelative(href));
    return false;
  }
  return true;
}

/** 是否可進後台（僅管委會） */
function canAccessBackend(){ return isLoggedIn() && hasRole('committee'); }

/* ============================ 多分頁同步 & 頁面抬頭 ============================ */
window.addEventListener("storage", (e)=>{
  if (e.key === AUTH_KEY) updateAuthUI();
});

function updateAuthUI() {
  const u = getUser() || {};
  const nameEl   = document.getElementById("authName");
  const mailEl   = document.getElementById("authMail");
  const loginEl  = document.getElementById("menuLogin");
  const logoutEl = document.getElementById("menuLogout");
  const roleLabel = ROLE_LABELS[getRole()] || ROLE_LABELS.guest;

  if (nameEl) nameEl.textContent = (u.name || u.email || roleLabel) + (isLoggedIn() ? `（${roleLabel}）` : "");
  if (mailEl) mailEl.textContent = isLoggedIn() ? (u.email || "") : "未登入";
  // 登入後只顯示「登出」
  if (loginEl)  loginEl.style.display  = isLoggedIn() ? "none" : "";
  if (logoutEl) logoutEl.style.display = isLoggedIn() ? "" : "none";
}

/* ============================ PWA 安裝（修正版） ============================ */
function initPWA(buttonId = "installCta") {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  // 1) 先註冊 SW（即使失敗也不擋 UI）
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
  }

  let deferredPrompt = null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone;

  // 2) 只有在瀏覽器發出 beforeinstallprompt 時才顯示按鈕（iOS 例外）
  window.addEventListener("beforeinstallprompt", (e) => {
    // 重要：攔截預設，改為自訂 UI
    e.preventDefault();
    deferredPrompt = e;
    btn.style.display = "";            // 顯示安裝按鈕
    btn.removeAttribute("disabled");
    btn.title = "安裝此應用";
  });

  // iOS 沒有 beforeinstallprompt；用教學提示
  if (isIOS && !isStandalone) btn.style.display = "";

  // 3) 點擊行為：正確地先 prompt()，再等 userChoice
  btn.addEventListener("click", async () => {
    // file:// 無法安裝（SW/manifest 都不會生效）
    if (location.protocol === "file:") {
      alert("安裝需要從 http:// 或 https://（或 localhost）開啟，file:// 無法安裝。");
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();                 // 叫出安裝視窗
        const choice = await deferredPrompt.userChoice;  // 等使用者回應
        if (choice?.outcome !== "dismissed") {
          btn.style.display = "none";            // 安裝了，就收起按鈕
        }
      } catch (err) {
        console.warn("PWA 安裝被攔截/失敗：", err);
      } finally {
        deferredPrompt = null;                   // 事件只能用一次
      }
      return;
    }

    if (isIOS && !isStandalone) {
      alert("iPhone / iPad：請在 Safari → 分享 → 加入主畫面 以安裝。");
      return;
    }

    // 其他情況（多半是瀏覽器沒給 BIP 事件）：給使用者導引
    alert("請使用瀏覽器的「安裝」選項安裝（例如 Chrome 右上角的安裝圖示或選單 → 安裝）。");
  });

  // 4) 裝好後關閉按鈕
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    btn.style.display = "none";
  });
}
/* ============================ 頁面初始化 ============================ */
function initPage(kind) {
  // 1) 先把登入/登出選單狀態更新
  updateAuthUI();

  // 2) 啟動 PWA 安裝按鈕與 SW（內含 beforeinstallprompt 處理）
  initPWA("installCta");

  // 3) 若是後台頁但使用者不是管委會，這裡再保險一次（多一道保護）
  if (kind === 'backend') {
    ensureBackend(); // 未登入會被帶去 auth.html，非管委會會被請回首頁
  }
}
// 讓各頁可以呼叫
window.initPage = initPage;


/* ============================ 工具 ============================ */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const nowISO = () => new Date().toISOString();
const todayISO = () => new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
const deepClone = (o) => JSON.parse(JSON.stringify(o));

/* ============================ LocalStorage DB ============================ */
const DB_KEY = "kms_db";
const DB_VER = 1;

const DEFAULT_DB = () => ({
  ver: DB_VER,
  announcements: [],
  maintenance: [],
  fees: [],
  residents: [],
  visitors: [],
  packages: [],
  meetings: [],
  activities: []
});

const DB = {
  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) {
        const db = DEFAULT_DB(); DB._seed(db);
        localStorage.setItem(DB_KEY, JSON.stringify(db));
        return db;
      }
      const db = JSON.parse(raw);
      if (db.ver !== DB_VER) {
        const upgraded = { ...DEFAULT_DB(), ...db, ver: DB_VER };
        localStorage.setItem(DB_KEY, JSON.stringify(upgraded));
        return upgraded;
      }
      return db;
    } catch {
      const db = DEFAULT_DB(); DB._seed(db);
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      return db;
    }
  },
  save(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); },
  reset() {
    const db = DEFAULT_DB(); DB._seed(db); DB.save(db);
    dispatchEvent(new CustomEvent("dbchange", { detail: { module: "all" } }));
  },
  list(module) { return deepClone(DB.load()[module] || []); },
  find(module, id) { return deepClone((DB.load()[module] || []).find(x => x.id === id) || null); },
  upsert(module, record) {
    const db = DB.load();
    const arr = db[module] || (db[module] = []);
    if (!record.id) record.id = uid();
    const idx = arr.findIndex(x => x.id === record.id);
    if (idx >= 0) arr[idx] = deepClone(record); else arr.push(deepClone(record));
    DB.save(db);
    dispatchEvent(new CustomEvent("dbchange", { detail: { module } }));
    return record.id;
  },
  remove(module, id) {
    const db = DB.load();
    const arr = db[module] || (db[module] = []);
    const idx = arr.findIndex(x => x.id === id);
    if (idx >= 0) { arr.splice(idx, 1); DB.save(db); dispatchEvent(new CustomEvent("dbchange", { detail: { module } })); return true; }
    return false;
  },
  _seed(db) {
    const adminName = "李主委";
    db.announcements.push({
      id: uid(), title: "停水通知", content: "8/25 上午 9–12 點停水。",
      time: todayISO(), author: adminName,
      options: ["同意", "反對"], votes: {"同意":0,"反對":0}, voters: {}, reads: {}
    });
    db.maintenance.push({
      id: uid(), equipment: "電梯", item: "年度保養", time: "2025-08-10",
      handler: "保養公司", cost: 8000, note: "正常", status: "closed",
      assignee: "王工程", logs: [{ time: nowISO(), text: "建立工單", by: adminName }]
    });
  }
};

/* ============================ 模組 API ============================ */
const Ann = {
  list: () => DB.list("announcements"),
  get: (id) => DB.find("announcements", id),
  create({ title, content, options = ["同意","反對"] }) {
    const u = getUser() || {};
    const rec = {
      id: uid(), title, content, time: nowISO(),
      author: u.name || u.email || "系統",
      options: options.length?options:["同意","反對"],
      votes: Object.fromEntries((options.length?options:["同意","反對"]).map(o=>[o,0])),
      voters: {}, reads: {}
    };
    DB.upsert("announcements", rec); return rec.id;
  },
  update(rec){ const old = Ann.get(rec.id); if(!old) throw new Error("公告不存在"); DB.upsert("announcements", { ...old, ...rec }); },
  remove: (id)=> DB.remove("announcements", id),
  markRead(id, email){ const a = Ann.get(id); if(!a) return; a.reads ||= {}; if(email) a.reads[email]=true; DB.upsert("announcements", a); },
  vote(id, option){
    const a = Ann.get(id); if(!a) throw new Error("公告不存在");
    if(!a.options.includes(option)) throw new Error("選項不存在");
    const email = getUser()?.email || ""; if(!email) throw new Error("請先登入");
    a.voters ||= {};
    const prev = a.voters[email];
    if(prev !== option){
      a.votes ||= {}; a.options.forEach(o=>{ if(a.votes[o]==null) a.votes[o]=0; });
      if(prev) a.votes[prev] = Math.max(0,(a.votes[prev]||0)-1);
      a.votes[option] = (a.votes[option]||0)+1;
      a.voters[email] = option;
      DB.upsert("announcements", a);
    }
    return a;
  }
};

const Maint = {
  list: () => DB.list("maintenance"),
  get: (id) => DB.find("maintenance", id),
  create({ equipment, item, handler = "", cost = 0, note = "" }) {
    const rec = {
      id: uid(), equipment, item, time: nowISO(),
      handler, cost, note, status: "open", assignee: "",
      logs: [{ time: nowISO(), text: "建立工單", by: getUser()?.email || "系統" }]
    };
    DB.upsert("maintenance", rec); return rec.id;
  },
  update(rec){ const old = Maint.get(rec.id); if(!old) throw new Error("工單不存在"); DB.upsert("maintenance", { ...old, ...rec }); },
  remove: (id)=> DB.remove("maintenance", id),
  setStatus(id, status){ const m = Maint.get(id); if(!m) throw new Error("工單不存在"); m.status=status; (m.logs ||= []).push({time:nowISO(), text:`狀態：${status}`, by:getUser()?.email||"系統"}); DB.upsert("maintenance", m); },
  assign(id, assignee){ const m = Maint.get(id); if(!m) throw new Error("工單不存在"); m.assignee=assignee; (m.logs ||= []).push({time:nowISO(), text:`指派：${assignee}`, by:getUser()?.email||"系統"}); DB.upsert("maintenance", m); },
  addLog(id, text){ const m = Maint.get(id); if(!m) throw new Error("工單不存在"); (m.logs ||= []).push({time:nowISO(), text, by:getUser()?.email||"系統"}); DB.upsert("maintenance", m); }
};

const Fee = {
  list: () => DB.list("fees"),
  get: (id) => DB.find("fees", id),
  create({ room, amount, due, invoice = "", note = "" }){ const rec = { id: uid(), room, amount, due, paid:false, paidAt:"", invoice, note }; DB.upsert("fees", rec); return rec.id; },
  update(rec){ const old = Fee.get(rec.id); if(!old) throw new Error("費用不存在"); DB.upsert("fees", { ...old, ...rec }); },
  remove: (id)=> DB.remove("fees", id),
  setPaid(id, paid){ const f = Fee.get(id); if(!f) throw new Error("費用不存在"); f.paid=!!paid; f.paidAt = f.paid ? nowISO() : ""; DB.upsert("fees", f); }
};

const Resi = {
  list: () => DB.list("residents"),
  get: (id) => DB.find("residents", id),
  create({ name, room, phone = "", email = "", role = "resident" }){ const rec = { id: uid(), name, room, phone, email, role }; DB.upsert("residents", rec); return rec.id; },
  update(rec){ const old = Resi.get(rec.id); if(!old) throw new Error("住戶不存在"); DB.upsert("residents", { ...old, ...rec }); },
  remove: (id)=> DB.remove("residents", id)
};

const Visit = {
  list: () => DB.list("visitors"),
  get: (id) => DB.find("visitors", id),
  checkin({ name, room, timeIn = "" }){ const rec = { id: uid(), name, room, in: timeIn || nowISO(), out:"" }; DB.upsert("visitors", rec); return rec.id; },
  checkout(id, timeOut = ""){ const v = Visit.get(id); if(!v) throw new Error("訪客不存在"); v.out = timeOut || nowISO(); DB.upsert("visitors", v); },
  remove: (id)=> DB.remove("visitors", id)
};

const Pack = {
  list: () => DB.list("packages"),
  get: (id) => DB.find("packages", id),
  receive({ courier = "", tracking = "", room, note = "" }){ const rec = { id: uid(), courier, tracking, room, receivedAt: nowISO(), pickedAt:"", picker:"", note }; DB.upsert("packages", rec); return rec.id; },
  pickup(id, picker, time = ""){ const p = Pack.get(id); if(!p) throw new Error("包裹不存在"); p.picker=picker; p.pickedAt = time || nowISO(); DB.upsert("packages", p); },
  remove: (id)=> DB.remove("packages", id)
};

const Meet = {
  list: () => DB.list("meetings"),
  get: (id) => DB.find("meetings", id),
  create({ topic, time, location, notes = "", minutesUrl = "" }){ const rec = { id: uid(), topic, time, location, notes, minutesUrl }; DB.upsert("meetings", rec); return rec.id; },
  update(rec){ const old = Meet.get(rec.id); if(!old) throw new Error("會議不存在"); DB.upsert("meetings", { ...old, ...rec }); },
  remove: (id)=> DB.remove("meetings", id)
};

const Act = {
  list: () => DB.list("activities"),
  get: (id) => DB.find("activities", id),
  create({ name, time, location, desc = "" }){ const rec = { id: uid(), name, time, location, desc }; DB.upsert("activities", rec); return rec.id; },
  update(rec){ const old = Act.get(rec.id); if(!old) throw new Error("活動不存在"); DB.upsert("activities", { ...old, ...rec }); },
  remove: (id)=> DB.remove("activities", id)
};

/* ============================ 對外暴露 ============================ */
window.parseQuery = parseQuery;
window.getUser = getUser;
window.setUser = setUser;
window.clearUser = clearUser;
window.isLoggedIn = isLoggedIn;
window.getRole = getRole;
window.hasRole = hasRole;
window.toRelative = toRelative;

window.gotoLogin = gotoLogin;
window.ensureLogin = ensureLogin;
window.ensureBackend = ensureBackend;
window.ensureAdmin = ensureAdmin; // 兼容
window.redirectAfterLogin = redirectAfterLogin;
window.logout = logout;

window.guardAction = guardAction;
window.gotoProtected = gotoProtected;
window.canAccessBackend = canAccessBackend;

window.initPage = initPage;
window.updateAuthUI = updateAuthUI;

window.DB = DB;
window.Ann = Ann;
window.Maint = Maint;
window.Fee = Fee;
window.Resi = Resi;
window.Visit = Visit;
window.Pack = Pack;
window.Meet = Meet;
window.Act = Act;
