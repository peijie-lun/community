/** ======================================================================
 * index.js ─ 登入/權限、PWA、LocalStorage DB、各模組 API、緊急動作
 * ====================================================================== */

/* ============================ 身分狀態 ============================ */
const AUTH_KEY = "demo_auth_user";

const ROLE_LABELS = {
  resident: "住戶",
  committee: "管委會",
  vendor: "廠商",
  guest: "訪客"
};
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
const setUser = (u) => { if (u && u.role) u.role = normalizeRole(u.role); localStorage.setItem(AUTH_KEY, JSON.stringify(u || {})); };
const clearUser = () => localStorage.removeItem(AUTH_KEY);
const isLoggedIn = () => !!localStorage.getItem(AUTH_KEY);
const getRole = () => normalizeRole((getUser()?.role) || "guest");
const hasRole = (...roles) => roles.includes(getRole());

/* ============================ 導頁輔助 ============================ */
function toRelative(n) {
  try {
    let raw = (n == null || n === "") ? (location.pathname + location.search + location.hash) : String(n);
    raw = raw.replace(/\\/g, "/");
    const u = new URL(raw, location.href);
    const file = (u.pathname.split("/").pop() || "index.html");
    const white = new Set(["index.html","auth.html","app.html","backend.html"]);
    const safeFile = white.has(file) ? file : "index.html";
    return safeFile + (u.search || "") + (u.hash || "");
  } catch { return "index.html"; }
}
window.toRelative = toRelative;

function gotoLogin(nextUrl) {
  const next = toRelative(nextUrl);
  const t = Date.now();
  location.href = `auth.html?next=${encodeURIComponent(next)}&t=${t}`;
}
function ensureLogin() { if (isLoggedIn()) return true; gotoLogin(); return false; }
function ensureBackend() {
  if (!isLoggedIn()) { gotoLogin("backend.html"); return false; }
  if (!hasRole("committee")) {
    alert(`管理後台僅限管委會使用。\n你目前的身分：${ROLE_LABELS[getRole()]}`);
    location.replace("index.html");
    return false;
  }
  return true;
}
const ensureAdmin = ensureBackend;

function redirectAfterLogin(next, role) {
  if (next && !/^https?:\/\//i.test(next)) { location.href = next; return; }
  if (role === "committee") location.href = "backend.html";
  else location.href = "app.html";
}
function logout() {
  clearUser();
  const path = location.pathname.replace(/^\//, "");
  if (path === "backend.html" || path === "app.html") setTimeout(()=>location.replace("index.html"), 100);
  else updateAuthUI();
}
function guardAction(next) {
  if (!isLoggedIn()) { gotoLogin(toRelative(next)); return false; }
  return true;
}
function gotoProtected(ev) {
  if (!isLoggedIn()){
    ev?.preventDefault?.();
    const href = ev?.currentTarget?.getAttribute('href') || (location.pathname + location.search + location.hash);
    gotoLogin(toRelative(href));
    return false;
  }
  return true;
}
function canAccessBackend(){ return isLoggedIn() && hasRole('committee'); }

/* ============================ 多分頁同步 & 頁面抬頭 ============================ */
window.addEventListener("storage", (e)=>{ if (e.key === AUTH_KEY) updateAuthUI(); });
function updateAuthUI() {
  const u = getUser() || {};
  const nameEl   = document.getElementById("authName");
  const mailEl   = document.getElementById("authMail");
  const loginEl  = document.getElementById("menuLogin");
  const logoutEl = document.getElementById("menuLogout");
  const roleLabel = ROLE_LABELS[getRole()] || ROLE_LABELS.guest;
  if (nameEl) nameEl.textContent = (u.name || u.email || roleLabel) + (isLoggedIn() ? `（${roleLabel}）` : "");
  if (mailEl) mailEl.textContent = isLoggedIn() ? (u.email || "") : "未登入";
  if (loginEl)  loginEl.style.display  = isLoggedIn() ? "none" : "";
  if (logoutEl) logoutEl.style.display = isLoggedIn() ? "" : "none";
}

/* ============================ PWA 安裝 ============================ */
function initPWA(buttonId = "installCta") {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(()=>{});
  let deferredPrompt = null;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; btn.style.display = ""; btn.removeAttribute("disabled"); btn.title = "安裝此應用"; });
  if (isIOS && !isStandalone) btn.style.display = "";
  btn.addEventListener("click", async () => {
    if (location.protocol === "file:") return alert("安裝需要從 http(s) 或 localhost 開啟。");
    if (deferredPrompt) {
      try { deferredPrompt.prompt(); const c = await deferredPrompt.userChoice; if (c?.outcome !== "dismissed") btn.style.display = "none"; }
      finally { deferredPrompt = null; }
      return;
    }
    if (isIOS && !isStandalone) return alert("Safari → 分享 → 加入主畫面");
    alert("請使用瀏覽器的「安裝」選項安裝。");
  });
  window.addEventListener("appinstalled", () => { deferredPrompt = null; btn.style.display = "none"; });
}
/* ============================ 頁面初始化 ============================ */
function initPage(kind) { updateAuthUI(); initPWA("installCta"); if (kind === 'backend') ensureBackend(); }
window.initPage = initPage;

/* ============================ 工具 ============================ */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const nowISO = () => new Date().toISOString();
const todayISO = () => new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
const deepClone = (o) => JSON.parse(JSON.stringify(o));

/* ============================ LocalStorage DB ============================ */
const DB_KEY = "kms_db";
const DB_VER = 2;

const DEFAULT_DB = () => ({
  ver: DB_VER,
  announcements: [],
  maintenance: [],
  fees: [],
  residents: [],
  visitors: [],
  packages: [],
  meetings: [],
  activities: [],
  emergencies: []
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
  reset() { const db = DEFAULT_DB(); DB._seed(db); DB.save(db); dispatchEvent(new CustomEvent("dbchange", { detail: { module: "all" } })); },
  list(module) { return deepClone(DB.load()[module] || []); },
  find(module, id) { return deepClone((DB.load()[module] || []).find(x => x.id === id) || null); },
  upsert(module, record) {
    const db = DB.load(); const arr = db[module] || (db[module] = []);
    if (!record.id) record.id = uid();
    const idx = arr.findIndex(x => x.id === record.id);
    if (idx >= 0) arr[idx] = deepClone(record); else arr.push(deepClone(record));
    DB.save(db); dispatchEvent(new CustomEvent("dbchange", { detail: { module } }));
    return record.id;
  },
  remove(module, id) {
    const db = DB.load(); const arr = db[module] || (db[module] = []);
    const idx = arr.findIndex(x => x.id === id);
    if (idx >= 0) { arr.splice(idx, 1); DB.save(db); dispatchEvent(new CustomEvent("dbchange", { detail: { module } })); return true; }
    return false;
  },
  _seed(db) {
    const adminName = "李主委";
    db.announcements.push({ id: uid(), title: "停水通知", content: "8/25 上午 9–12 點停水。", time: todayISO(), author: adminName, options: ["同意","反對"], votes: {"同意":0,"反對":0}, voters: {}, reads: {} });
    db.maintenance.push({ id: uid(), equipment: "電梯", item: "年度保養", time: "2025-08-10", handler: "保養公司", cost: 8000, note: "正常", status: "closed", assignee: "王工程", logs: [{ time: nowISO(), text: "建立工單", by: adminName }] });
  }
};

/* ============================ 模組 API ============================ */
const Ann = { list:()=>DB.list("announcements"), get:(id)=>DB.find("announcements", id),
  create({ title, content, options = ["同意","反對"] }) {
    const u = getUser() || {};
    const opts = options.length?options:["同意","反對"];
    const rec = { id: uid(), title, content, time: nowISO(), author: u.name || u.email || "系統", options: opts, votes: Object.fromEntries(opts.map(o=>[o,0])), voters:{}, reads:{} };
    DB.upsert("announcements", rec); return rec.id;
  },
  update(rec){ const old = Ann.get(rec.id); if(!old) throw new Error("公告不存在"); DB.upsert("announcements", { ...old, ...rec }); },
  remove:(id)=>DB.remove("announcements", id),
  markRead(id, email){ const a = Ann.get(id); if(!a) return; a.reads ||= {}; if(email) a.reads[email]=true; DB.upsert("announcements", a); },
  vote(id, option){ const a = Ann.get(id); if(!a) throw new Error("公告不存在"); if(!a.options.includes(option)) throw new Error("選項不存在");
    const email = getUser()?.email || ""; if(!email) throw new Error("請先登入");
    a.voters ||= {}; const prev = a.voters[email];
    if(prev !== option){ a.votes ||= {}; a.options.forEach(o=>{ if(a.votes[o]==null) a.votes[o]=0; });
      if(prev) a.votes[prev] = Math.max(0,(a.votes[prev]||0)-1);
      a.votes[option] = (a.votes[option]||0)+1; a.voters[email] = option; DB.upsert("announcements", a);
    }
    return a;
  }
};

const Maint = { list:()=>DB.list("maintenance"), get:(id)=>DB.find("maintenance", id),
  create({ equipment, item, handler = "", cost = 0, note = "" }) {
    const rec = { id: uid(), equipment, item, time: nowISO(), handler, cost, note, status: "open", assignee: "", logs: [{ time: nowISO(), text: "建立工單", by: getUser()?.email || "系統" }] };
    DB.upsert("maintenance", rec); return rec.id;
  },
  update(rec){ const old = Maint.get(rec.id); if(!old) throw new Error("工單不存在"); DB.upsert("maintenance", { ...old, ...rec }); },
  remove:(id)=>DB.remove("maintenance", id),
  setStatus(id, status){ const m = Maint.get(id); if(!m) throw new Error("工單不存在"); m.status=status; (m.logs ||= []).push({time:nowISO(), text:`狀態：${status}`, by:getUser()?.email||"系統"}); DB.upsert("maintenance", m); },
  assign(id, assignee){ const m = Maint.get(id); if(!m) throw new Error("工單不存在"); m.assignee=assignee; (m.logs ||= []).push({time:nowISO(), text:`指派：${assignee}`, by:getUser()?.email||"系統"}); DB.upsert("maintenance", m); },
  addLog(id, text){ const m = Maint.get(id); if(!m) throw new Error("工單不存在"); (m.logs ||= []).push({time:nowISO(), text, by:getUser()?.email||"系統"}); DB.upsert("maintenance", m); }
};

const Fee = { list:()=>DB.list("fees"), get:(id)=>DB.find("fees", id),
  create({ room, amount, due, invoice = "", note = "" }){ const rec = { id: uid(), room, amount, due, paid:false, paidAt:"", invoice, note }; DB.upsert("fees", rec); return rec.id; },
  update(rec){ const old = Fee.get(rec.id); if(!old) throw new Error("費用不存在"); DB.upsert("fees", { ...old, ...rec }); },
  remove:(id)=>DB.remove("fees", id),
  setPaid(id, paid){ const f = Fee.get(id); if(!f) throw new Error("費用不存在"); f.paid=!!paid; f.paidAt = f.paid ? nowISO() : ""; DB.upsert("fees", f); }
};

const Resi = { list:()=>DB.list("residents"), get:(id)=>DB.find("residents", id),
  create({ name, room, phone = "", email = "", role = "resident" }){ const rec = { id: uid(), name, room, phone, email, role }; DB.upsert("residents", rec); return rec.id; },
  update(rec){ const old = Resi.get(rec.id); if(!old) throw new Error("住戶不存在"); DB.upsert("residents", { ...old, ...rec }); },
  remove:(id)=>DB.remove("residents", id)
};

const Visit = { list:()=>DB.list("visitors"), get:(id)=>DB.find("visitors", id),
  checkin({ name, room, timeIn = "" }){ const rec = { id: uid(), name, room, in: timeIn || nowISO(), out:"" }; DB.upsert("visitors", rec); return rec.id; },
  checkout(id, timeOut = ""){ const v = Visit.get(id); if(!v) throw new Error("訪客不存在"); v.out = timeOut || nowISO(); DB.upsert("visitors", v); },
  remove:(id)=>DB.remove("visitors", id)
};

const Pack = { list:()=>DB.list("packages"), get:(id)=>DB.find("packages", id),
  receive({ courier = "", tracking = "", room, note = "" }){ const rec = { id: uid(), courier, tracking, room, receivedAt: nowISO(), pickedAt:"", picker:"", note }; DB.upsert("packages", rec); return rec.id; },
  pickup(id, picker, time = ""){ const p = Pack.get(id); if(!p) throw new Error("包裹不存在"); p.picker=picker; p.pickedAt = time || nowISO(); DB.upsert("packages", p); },
  remove:(id)=>DB.remove("packages", id)
};

const Meet = { list:()=>DB.list("meetings"), get:(id)=>DB.find("meetings", id),
  create({ topic, time, location, notes = "", minutesUrl = "" }){ const rec = { id: uid(), topic, time, location, notes, minutesUrl }; DB.upsert("meetings", rec); return rec.id; },
  update(rec){ const old = Meet.get(rec.id); if(!old) throw new Error("會議不存在"); DB.upsert("meetings", { ...old, ...rec }); },
  remove:(id)=>DB.remove("meetings", id)
};

/* ---------- 緊急紀錄 ---------- */
const Emergency = {
  list: () => DB.list("emergencies"),
  get:  (id) => DB.find("emergencies", id),
  create({ type, note = "" }) {
    const user = getUser();
    const who = user?.email || "未知使用者";
    const rec = { id: uid(), type, time: nowISO(), note, by: who };
    DB.upsert("emergencies", rec); 
    return rec.id;
  },
  remove: (id)=> DB.remove("emergencies", id)
};

/* ---------- 共用 TTS & 緊急動作（僅住戶/管委會可用） ---------- */
function speak(msg){
  try{ const u = new SpeechSynthesisUtterance(msg); u.lang = "zh-TW"; speechSynthesis.speak(u); }catch(_){}
}
function getResidentProfileForTTS(){
  const u = getUser() || {};
  const name = (u.email || '').split('@')[0] || '住戶';
  return { name, tower:'A棟', floor:'10樓', room:'1001室', allergy:'青黴素', chronic:'高血壓', blood:'O型' };
}
function emgNarration(prefix){
  const p = getResidentProfileForTTS();
  const msg = `${prefix}，位置 ${p.tower}${p.floor}${p.room}。住戶：${p.name}，過敏 ${p.allergy}，慢性病 ${p.chronic}，血型 ${p.blood}。請盡速前往救援。`;
  speak(msg); return msg;
}
function _checkEmergencyPermission(){
  if (!guardAction(location.pathname+location.hash)) return false;
  if (hasRole('vendor')) { alert('此功能僅限住戶與管委會使用。'); return false; }
  return true;
}
const EmergencyActions = {
  call119(){
    if (!_checkEmergencyPermission()) return;
    const note = emgNarration('緊急狀況，已呼叫救護車');
    Emergency.create({ type:'救護車 119', note });
    try{ location.href = 'tel:119'; }catch(_){}
    alert('已建立紀錄並撥打 119（示意）。');
  },
  call110(){
    if (!_checkEmergencyPermission()) return;
    const note = emgNarration('緊急狀況，已報警');
    Emergency.create({ type:'報警 110', note });
    try{ location.href = 'tel:110'; }catch(_){}
    alert('已建立紀錄並撥打 110（示意）。');
  },
  aed(){
    if (!_checkEmergencyPermission()) return;
    Emergency.create({ type:'AED', note:'已通知警衛送 AED（示意）' });
    speak('請警衛立即攜帶自動體外電擊去顫器前往指定樓層。');
    alert('已通知警衛送 AED（示意）。');
  },
  simFall(){
    if (!_checkEmergencyPermission()) return;
    Emergency.create({ type:'跌倒偵測', note:'偵測住戶跌倒（模擬）；可串穿戴裝置 Webhook。' });
    speak('偵測到疑似跌倒，請立即確認住戶狀況。');
    alert('跌倒偵測：已通知社區與家屬（示意）。');
  }
};
/* =========================================================================
 * AI Chat Widget（右下角）— 未登入可開面板，但功能必須先登入
 * 這段替換掉你現有的 AIChat 區塊即可
 * ========================================================================= */
const AIChat = (() => {
  const S = `
  .aichat-wrap{position:fixed; right:16px; bottom:16px; z-index:2147483000; font-family:Roboto, system-ui, -apple-system,"Segoe UI", Arial}
  .aichat-btn{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:#2c7a7b;color:#fff;box-shadow:0 10px 28px rgba(0,0,0,.18)}
  .aichat-panel{width:min(740px,calc(100vw - 28px)); height: min(560px, calc(100vh - 28px)); max-height:640px; background:#fff; border-radius:18px;
    box-shadow:0 22px 48px rgba(0,0,0,.22); display:flex; flex-direction:column; overflow:hidden}
  .aichat-header{display:flex; align-items:center; gap:8px; padding:10px 12px; background:#f2f6f5; border-bottom:1px solid #e8eded}
  .aichat-title{font-weight:900; letter-spacing:.3px}
  .aichat-sp{flex:1}
  .aichat-icbtn{border:none;background:transparent;cursor:pointer;padding:6px;border-radius:10px}
  .aichat-icbtn:hover{background:#e9f1f0}
  .aichat-body{flex:1; display:grid; grid-template-columns: 1fr; overflow:hidden}
  .aichat-suggest{display:flex; gap:10px; padding:12px; border-bottom:1px solid #eef2f2}
  .aichat-tab{padding:8px 12px; border-radius:999px; background:#eef5f4; color:#275a59; font-weight:700; cursor:pointer; white-space:nowrap}
  .aichat-tab.active{background:#2c7a7b;color:#fff}
  .aichat-cols{display:grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap:14px; padding:12px; overflow:auto}
  .aichat-card{background:#fff; border:1px solid #e7ecef; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,.06); overflow:hidden}
  .aichat-card h4{margin:10px 12px; font-size:15px}
  .aichat-card a{display:block; padding:10px 12px; border-top:1px solid #edf1f2; color:#2c7a7b; text-decoration:none}
  .aichat-card a:hover{background:#f8fbfb}
  .aichat-chat{display:flex; flex-direction:column; gap:6px; padding:12px; height:100%; overflow:auto; background:#fafdfd}
  .aichat-msg{max-width:70%; padding:10px 12px; border-radius:12px; line-height:1.5; box-shadow:0 4px 12px rgba(0,0,0,.06)}
  .aichat-bot{background:#ffffff; border:1px solid #e8eded}
  .aichat-me{background:#2c7a7b; color:#fff; margin-left:auto}
  .aichat-inputbar{display:flex; gap:8px; padding:10px; border-top:1px solid #e8eded; background:#fff}
  .aichat-inp{flex:1; border:1px solid #e3eaec; border-radius:999px; padding:12px 14px; outline:none}
  .aichat-send{width:44px; height:44px; border-radius:50%; border:none; cursor:pointer; background:#2c7a7b; color:#fff}
  @media (max-width: 520px){
    .aichat-panel{width:calc(100vw - 16px); height:calc(100vh - 16px)}
  }`;
  const TEMPLATE = `
    <div class="aichat-btn" id="aiFab" title="AI 客服">
      <span class="material-symbols-outlined" style="font-size:28px">support_agent</span>
    </div>
    <div class="aichat-panel" id="aiPanel" style="display:none">
      <div class="aichat-header">
        <span class="material-symbols-outlined" aria-hidden="true">support_agent</span>
        <div class="aichat-title">AI 客服（社區功能快捷）</div>
        <div class="aichat-sp"></div>
        <button class="aichat-icbtn" id="aiMin"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="aichat-body">
        <div class="aichat-suggest" role="tablist" aria-label="快捷分類">
          <div class="aichat-tab active" data-tab="common">常用功能</div>
          <div class="aichat-tab" data-tab="resident">住戶服務</div>
          <div class="aichat-tab" data-tab="emg">緊急服務</div>
        </div>
        <div id="aiCols" class="aichat-cols"></div>
        <div id="aiChat" class="aichat-chat" aria-live="polite"></div>
      </div>
      <div class="aichat-inputbar">
        <input id="aiInput" class="aichat-inp" type="text" placeholder="請輸入您的問題…" />
        <button id="aiSend" class="aichat-send" title="送出">
          <span class="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>`;

  /* ---------- 依身分產生卡片（同前版） ---------- */
  function cardsFor(role){
    const c = [];
    const common = { title:'《常用功能》', links: [
      ['公告 / 投票','goto_announcement'],
      ['維修 / 客服','goto_maintenance'],
      ['帳務 / 收費','goto_finance'],
      ['住戶 / 人員','goto_resident'],
      ['訪客 / 包裹','goto_visitor'],
      ['會議 / 活動','goto_meeting'],
      ['緊急紀錄','goto_emergency']
    ]};
    const resiLinks = [];
    if (role === 'resident') { resiLinks.push(['申請報修','ask_repair'], ['編輯我的資料','edit_self']); }
    resiLinks.push(['查看我的社區資料（列表）','goto_resident']);
    const resident = { title:'《住戶服務》', links: resiLinks };
    const emg = { title:'《緊急服務》', links: [
      ['救護車（119）','emg_119'],
      ['報警（110）','emg_110'],
      ['AED 送達','emg_aed'],
      ['跌倒偵測（模擬）','emg_fall']
    ]};
    if (role === 'committee') {
      c.push([ common, { title:'《管委會工具》', links: [['開啟後台','goto_backend']] }, emg ]);
    } else if (role === 'vendor') {
      c.push([ { title:'《維修工作》', links: [
        ['我的工單（維修 / 客服）','goto_maintenance'],
        ['回覆工單進度（在列表操作）','goto_maintenance']
      ]}, emg ]);
    } else {
      c.push([ common, resident, emg ]);
    }
    return c;
  }

  /* ---------- 登入守門：未登入先導去 auth.html ---------- */
  function requireLoginThen(task){
    if (isLoggedIn()) { task(); return; }
    pushBot('請先登入後再使用此功能，為您導向登入頁…');
    // 保留回跳目標
    const next = toRelative(location.pathname + location.search + location.hash);
    gotoLogin(next);
  }

  /* ---------- 快捷行為（套用登入守門） ---------- */
  const QUICK_ACTIONS = {
    goto_announcement(){ requireLoginThen(()=> location.href = 'app.html#announcement'); },
    goto_maintenance(){ requireLoginThen(()=> location.href = 'app.html#maintenance'); },
    goto_finance(){ requireLoginThen(()=> location.href = 'app.html#finance'); },
    goto_resident(){ requireLoginThen(()=> location.href = 'app.html#resident'); },
    goto_visitor(){ requireLoginThen(()=> location.href = 'app.html#visitor'); },
    goto_meeting(){ requireLoginThen(()=> location.href = 'app.html#meeting'); },
    goto_emergency(){ requireLoginThen(()=> location.href = 'app.html#emergency'); },
    goto_backend(){ requireLoginThen(()=>{
      if (!hasRole('committee')) return alert('只有管委會可進入後台。');
      location.href = 'backend.html';
    }); },
    ask_repair(){ requireLoginThen(()=>{
      if (getRole() !== 'resident') { location.href = 'app.html#maintenance'; return; }
      const equipment = prompt('報修設備：'); if (!equipment) return;
      const item = prompt('報修項目/描述：'); if (!item) return;
      Maint.create({ equipment, item, handler:'', cost:0, note:'住戶透過 AI 客服申請報修' });
      pushBot('已建立報修，您可到「維修 / 客服」查看進度。');
      location.href = 'app.html#maintenance';
    }); },
    edit_self(){ requireLoginThen(()=>{
      if (getRole()!=='resident') return location.href='app.html#resident';
      const email = getUser()?.email || '';
      if (!email) return alert('需要帳號中有 Email 才能對應住戶資料。');
      const me = Resi.list().find(x => (x.email||'').toLowerCase() === email.toLowerCase());
      if (!me) { alert('找不到你的住戶資料，請聯絡管委會建立。'); return; }
      const name = prompt('姓名：', me.name || ''); if (name==null) return;
      const room = prompt('房號：', me.room || ''); if (room==null) return;
      const phone = prompt('電話：', me.phone || ''); if (phone==null) return;
      Resi.update({ id: me.id, name, room, phone });
      pushBot('已更新你的基本資料。'); location.href = 'app.html#resident';
    }); },
    emg_119(){ requireLoginThen(()=> EmergencyActions.call119()); },
    emg_110(){ requireLoginThen(()=> EmergencyActions.call110()); },
    emg_aed(){ requireLoginThen(()=> EmergencyActions.aed()); },
    emg_fall(){ requireLoginThen(()=> EmergencyActions.simFall()); }
  };

  /* ---------- 介面 & 互動（與前版相同） ---------- */
  let state = { open:false, tab:'common', booted:false };

  function cardsForRole(){ return cardsFor(getRole()); }

  function renderCards(){
    const cols = document.getElementById('aiCols'); if (!cols) return;
    const groups = cardsForRole();
    const map = { common:0, resident:1, emg:2 };
    const gi = map[state.tab] ?? 0;
    const cards = groups[0] && groups[0][gi] ? groups.map(g=>g[gi]).filter(Boolean) : (groups[0] || []);
    const list = cards.length ? cards : (groups[0] || []);
    cols.innerHTML = list.map(card => `
      <div class="aichat-card">
        <h4>${card.title}</h4>
        ${card.links.map(([t,act])=>`<a href="#" onclick="event.preventDefault(); AIChat.quick('${act}','${t}')">${t}</a>`).join('')}
      </div>
    `).join('');
  }

  function pushMe(text){ const box = document.getElementById('aiChat'); box?.insertAdjacentHTML('beforeend', `<div class="aichat-msg aichat-me">${esc(text)}</div>`); box&&(box.scrollTop=box.scrollHeight); }
  function pushBot(text){ const box = document.getElementById('aiChat'); box?.insertAdjacentHTML('beforeend', `<div class="aichat-msg aichat-bot">${esc(text)}</div>`); box&&(box.scrollTop=box.scrollHeight); }
  const esc = (s)=>String(s).replace(/[&<>"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  function simpleReply(q){
    const t = q.trim().toLowerCase();
    if (!t) return '想問什麼都可以先跟我說～';
    if (/登入|登出|login|logout/.test(t)) return '點任何功能時我會帶你去登入頁；登入後即可使用全部對應功能。';
    if (/公告|投票/.test(t)) return '要看公告/投票，點「常用功能 → 公告 / 投票」。';
    if (/維修|報修|工單/.test(t)) return '維修相關可到「常用功能 → 維修 / 客服」，住戶也可用「住戶服務 → 申請報修」。';
    if (/繳費|管理費|帳務/.test(t)) return '繳費與帳務請到「常用功能 → 帳務 / 收費」。';
    if (/住戶|名冊|我的資料|個資/.test(t)) return '名冊在「常用功能 → 住戶 / 人員」，編輯個資請用「住戶服務 → 編輯我的資料」。';
    if (/訪客|包裹/.test(t)) return '訪客/包裹請到「常用功能 → 訪客 / 包裹」。';
    if (/會議|活動/.test(t)) return '會議與活動請到「常用功能 → 會議 / 活動」。';
    if (/119|救護|急救|110|報警|aed|跌倒/.test(t)) return '緊急服務請用「緊急服務」分頁的四個按鈕；未登入時會先帶你登入。';
    return '已收到～可先用上方卡片進入各功能；未登入時我會先帶你去登入頁。';
  }

  function send(){
    const inp = document.getElementById('aiInput'); if (!inp) return;
    const val = inp.value.trim(); if (!val) return;
    pushMe(val); setTimeout(()=>pushBot(simpleReply(val)), 220);
    inp.value = ''; inp.focus();
  }

  function quick(action, label=''){
    open(true);
    pushMe(label ? `[點選] ${label}` : '[點選]');
    const fn = QUICK_ACTIONS[action];
    if (typeof fn === 'function') setTimeout(fn, 80);
    else setTimeout(()=>pushBot('（尚未定義的動作）'), 120);
  }

  function mount(){
    if (state.booted) return; state.booted = true;
    const st = document.createElement('style'); st.textContent = S; document.head.appendChild(st);
    if (!document.querySelector('link[href*="Material+Symbols"]')) {
      const l = document.createElement('link'); l.rel='stylesheet';
      l.href='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL@0..1';
      document.head.appendChild(l);
    }
    const wrap = document.createElement('div'); wrap.className='aichat-wrap'; wrap.innerHTML=TEMPLATE; document.body.appendChild(wrap);
    wrap.querySelector('#aiFab').onclick = () => open(true);
    wrap.querySelector('#aiMin').onclick = () => open(false);
    wrap.querySelector('#aiSend').onclick = send;
    wrap.querySelector('#aiInput').addEventListener('keydown', e=>{ if(e.key==='Enter') send(); });
    wrap.querySelectorAll('.aichat-tab').forEach(t=>{
      t.onclick = () => {
        wrap.querySelectorAll('.aichat-tab').forEach(x=>x.classList.remove('active'));
        t.classList.add('active');
        state.tab = t.dataset.tab;
        renderCards();
      };
    });
    renderCards();
    pushBot('嗨～這裡是 AI 客服的「社區功能快捷」。未登入可先瀏覽與發問；點功能時我會帶你去登入頁。');
  }

  function open(show){
    state.open = show;
    const p = document.querySelector('.aichat-panel');
    const b = document.querySelector('#aiFab');
    if (!p) return;
    p.style.display = show ? '' : 'none';
    b.style.display = show ? 'none' : '';
    if (show) setTimeout(()=>document.getElementById('aiInput')?.focus(), 50);
  }

  return { mount, open, quick };
})();

// 自動掛載
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ()=>AIChat.mount());
} else {
  AIChat.mount();
}

window.EmergencyActions = EmergencyActions;

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
window.ensureAdmin = ensureAdmin;
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
window.Act = { list:()=>DB.list("activities"), get:(id)=>DB.find("activities", id) };
window.Emergency = Emergency;
window.speak = speak;
