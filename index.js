/* ===== 共用：登入狀態 ===== */
const AUTH_KEY = "demo_auth_user";

const parseQuery = (qs) => Object.fromEntries(new URLSearchParams(qs||''));
const getUser    = () => { try{ return JSON.parse(localStorage.getItem(AUTH_KEY)||'null'); }catch(e){ return null; } };
const setUser    = (u) => localStorage.setItem(AUTH_KEY, JSON.stringify(u||{}));
const clearUser  = () => localStorage.removeItem(AUTH_KEY);
const isLoggedIn = () => !!localStorage.getItem(AUTH_KEY);
const getRole    = () => (getUser()?.role) || "guest";

function ensureLogin(){
  if (isLoggedIn()) return true;
  const next = encodeURIComponent(location.pathname.replace(/^\//,'') + location.search + location.hash);
  location.href = `auth.html?next=${next}`;
  return false;
}

function ensureAdmin(){
  if (isLoggedIn() && (getRole()==='admin' || getRole()==='committee')) return true;
  const next = encodeURIComponent('backend.html');
  location.href = `auth.html?next=${next}`;
  return false;
}

function redirectAfterLogin(next, role){
  if (role === 'admin' || role === 'committee') {
    location.href = next || 'backend.html';
  } else {
    location.href = next || 'app.html';
  }
}

function logout(){
  clearUser();
  // 後台/功能頁登出後導回首頁；首頁登出就留在原地
  const path = location.pathname.replace(/^\//,'');
  if (path === 'backend.html' || path === 'app.html') {
    setTimeout(()=>{ location.replace('index.html'); }, 200);
  }
}

function updateAuthUI(){
  const u = getUser() || {};
  const nameEl = document.getElementById('authName');
  const mailEl = document.getElementById('authMail');
  if (nameEl) nameEl.textContent = u.name || u.email || (isLoggedIn() ? '使用者' : '訪客');
  if (mailEl) mailEl.textContent = isLoggedIn() ? (u.email || '') : '未登入';
}

/* ===== PWA 安裝（桌面/Android 原生 + iOS 提示） ===== */
function initPWA(buttonId='installCta'){
  const fab = document.getElementById(buttonId);
  if (!fab) return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(()=>{});
  }

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    fab.style.display = '';
  });

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isIOS && !isStandalone) {
    fab.style.display = '';
  }

  fab.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch {}
      deferredPrompt = null;
      fab.style.display = 'none';
      return;
    }
    if (isIOS && !isStandalone) {
      alert('iPhone / iPad 安裝：請在 Safari → 分享 → 加入主畫面。');
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    fab.style.display = 'none';
  });
}

/* ===== 首頁卡片：要求登入的保護導頁 ===== */
function gotoProtected(ev){
  if (!isLoggedIn()){
    ev?.preventDefault?.();
    const href = ev?.currentTarget?.getAttribute('href') || 'app.html';
    const next = encodeURIComponent(href);
    location.href = `auth.html?next=${next}`;
    return false;
  }
  return true;
}

/* ===== 每頁進入點 ===== */
function initPage(kind){
  updateAuthUI();
  initPWA('installCta');
  // 可依 kind 做額外設定
}

window.parseQuery = parseQuery;
window.getUser = getUser;
window.setUser = setUser;
window.clearUser = clearUser;
window.isLoggedIn = isLoggedIn;
window.getRole = getRole;
window.ensureLogin = ensureLogin;
window.ensureAdmin = ensureAdmin;
window.redirectAfterLogin = redirectAfterLogin;
window.logout = logout;
window.gotoProtected = gotoProtected;
window.initPage = initPage;
