
'use strict';
const MODE = document.documentElement.dataset.mode === 'admin' ? 'admin' : 'user';
const SK = 'nebula_sess_' + MODE + '_';
const HOME = MODE === 'admin' ? 'adminOverview' : 'dashboard';

/* ==================== КОНСТАНТЫ ==================== */
const USERS = Object.assign({}, typeof USER_ACCOUNTS !== 'undefined' ? USER_ACCOUNTS : {}, typeof ADMIN_ACCOUNTS !== 'undefined' ? ADMIN_ACCOUNTS : {});
try { Object.assign(USERS, JSON.parse(localStorage.getItem('nebula_extra_users') || '{}')); } catch (e) {}
const USD_RATE = 83.63;
const TARGET_RUB = 2461497.64; // стартовый баланс: 2 461 497,64 ₽
const walletAssets = [
  { code:'BTC',  name:'Bitcoin',     amount:0.072, usdPrice:81281 },
  { code:'ETH',  name:'Ethereum',    amount:1.95,  usdPrice:2641  },
  { code:'USDT', name:'Tether USDT', amount:0,     usdPrice:1.00  }, // балансирующий актив
  { code:'BNB',  name:'BNB',         amount:6.2,   usdPrice:576   },
  { code:'SOL',  name:'Solana',      amount:28.5,  usdPrice:117.32},
  { code:'ADA',  name:'Cardano',     amount:9800,  usdPrice:0.2535}
];
(function(){ const o = walletAssets.reduce((s,x)=>s + x.amount*x.usdPrice, 0); walletAssets.find(x=>x.code==='USDT').amount = TARGET_RUB/USD_RATE - o; })();
const bankNames = { OZON:'Озон Банк', SBER:'Сбербанк', TINKOFF:'Тинькофф', ALFA:'Альфа-Банк', VTB:'ВТБ', RAIFFEISEN:'Райффайзенбанк', GAZPROM:'Газпромбанк', MTS:'МТС Банк', YANDEX:'ЮMoney', QIWI:'QIWI' };
const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function calcTotalRub(){ return walletAssets.reduce((s,a)=>s + a.amount * a.usdPrice * USD_RATE, 0); }
// Активы всегда пересчитываются под текущий баланс (пополнения, выводы, правки админа)
function scaledAssets(){ const t = calcTotalRub(), f = (userData && t) ? userData.balanceRub / t : 1; return walletAssets.map(a => ({...a, amount: a.amount * f})); }

/* ==================== СИД-ДАННЫЕ ==================== */
// Генератор реалистичной истории транзакций (относительно сегодня)
function buildSeedTransactions(){
  const now = Date.now();
  const d = 24*60*60*1000;
  const h = 60*60*1000;
  return [
    // Сегодня
    { id: now - 2*h,     type:'Обмен BTC → USDT',      amount:62000,   rub:62000,   status:'ok',   cls:'swap', desc:'0.01 BTC → 810 USDT', date: now - 2*h },
    { id: now - 5*h,     type:'Реферальный бонус',     amount:3850,    rub:3850,    status:'ok',   cls:'ref',  desc:'5% от пополнения от Магомедов А.', date: now - 5*h },
    { id: now - 8*h,     type:'Покупка SOL/USDT',      amount:18400,   rub:18400,   status:'ok',   cls:'in',   desc:'Куплено 12 SOL', date: now - 8*h },
    { id: now - 11*h,    type:'Обмен ETH → BTC',       amount:24800,   rub:24800,   status:'ok',   cls:'swap', desc:'0.6 ETH → 0.019 BTC', date: now - 11*h },

    // Вчера
    { id: now - 1*d - 3*h,  type:'Пополнение картой',    amount:150000,  rub:150000,  status:'ok',   cls:'in',   desc:'Сбербанк · 4276 **** 4751', date: now - 1*d - 3*h },
    { id: now - 1*d - 7*h,  type:'Продажа ADA/USDT',     amount:9200,    rub:9200,    status:'ok',   cls:'swap', desc:'Продано 3 500 ADA', date: now - 1*d - 7*h },
    { id: now - 1*d - 12*h, type:'Вывод на карту',       amount:45000,   rub:45000,   status:'ok',   cls:'out',  desc:'Тинькофф · 5536 **** 8890', date: now - 1*d - 12*h },
    { id: now - 1*d - 18*h, type:'Реферальный бонус',    amount:1250,    rub:1250,    status:'ok',   cls:'ref',  desc:'5% от пополнения от Ахмедов Р.', date: now - 1*d - 18*h },

    // 2 дня назад
    { id: now - 2*d,        type:'Обмен USDT → ETH',     amount:47800,   rub:47800,   status:'ok',   cls:'swap', desc:'4 780 USDT → 1.1 ETH', date: now - 2*d },
    { id: now - 2*d - 4*h,  type:'Пополнение USDT',      amount:85000,   rub:85000,   status:'ok',   cls:'in',   desc:'TRC-20 · поступление', date: now - 2*d - 4*h },
    { id: now - 2*d - 9*h,  type:'Прибыльная сделка',    amount:32100,   rub:32100,   status:'ok',   cls:'in',   desc:'BNB/USDT долгосрочная', date: now - 2*d - 9*h },
    { id: now - 2*d - 15*h, type:'Реферальный бонус',    amount:2400,    rub:2400,    status:'ok',   cls:'ref',  desc:'5% от пополнения от Магомедов А.', date: now - 2*d - 15*h },

    // 3-5 дней
    { id: now - 3*d,        type:'Обмен BTC → ETH',      amount:58900,   rub:58900,   status:'ok',   cls:'swap', desc:'0.012 BTC → 0.75 ETH', date: now - 3*d },
    { id: now - 3*d - 6*h,  type:'Вывод на карту',       amount:80000,   rub:80000,   status:'ok',   cls:'out',  desc:'Сбербанк · 2202 **** 1102', date: now - 3*d - 6*h },
    { id: now - 4*d,        type:'Пополнение картой',    amount:250000,  rub:250000,  status:'ok',   cls:'in',   desc:'Тинькофф · 5536 **** 8890', date: now - 4*d },
    { id: now - 4*d - 8*h,  type:'Покупка BNB/USDT',     amount:38200,   rub:38200,   status:'ok',   cls:'in',   desc:'Куплено 3.54 BNB', date: now - 4*d - 8*h },
    { id: now - 5*d,        type:'Реферальный бонус',    amount:5100,    rub:5100,    status:'ok',   cls:'ref',  desc:'5% от пополнения от Ибрагимов Т.', date: now - 5*d },
    { id: now - 5*d - 10*h, type:'Прибыльная сделка',    amount:41300,   rub:41300,   status:'ok',   cls:'in',   desc:'SOL/USDT · среднесрочная', date: now - 5*d - 10*h },

    // 6-10 дней
    { id: now - 6*d,        type:'Вывод на карту',       amount:120000,  rub:120000,  status:'ok',   cls:'out',  desc:'Альфа-Банк · 4154 **** 7788', date: now - 6*d },
    { id: now - 7*d,        type:'Пополнение картой',    amount:180000,  rub:180000,  status:'ok',   cls:'in',   desc:'Озон Банк · 2202 **** 4455', date: now - 7*d },
    { id: now - 8*d,        type:'Реферальный бонус',    amount:3200,    rub:3200,    status:'ok',   cls:'ref',  desc:'5% от пополнения от Ахмедов Р.', date: now - 8*d },
    { id: now - 9*d,        type:'Обмен ETH → USDT',     amount:35200,   rub:35200,   status:'ok',   cls:'swap', desc:'0.85 ETH → 3 520 USDT', date: now - 9*d },
    { id: now - 10*d,       type:'Прибыльная сделка',    amount:28700,   rub:28700,   status:'ok',   cls:'in',   desc:'BTC/USDT · интрадей', date: now - 10*d },

    // 11-20 дней
    { id: now - 12*d,       type:'Пополнение картой',    amount:300000,  rub:300000,  status:'ok',   cls:'in',   desc:'Сбербанк · 4276 **** 4751', date: now - 12*d },
    { id: now - 14*d,       type:'Вывод на карту',       amount:95000,   rub:95000,   status:'ok',   cls:'out',  desc:'ВТБ · 4890 **** 3322', date: now - 14*d },
    { id: now - 16*d,       type:'Реферальный бонус',    amount:7400,    rub:7400,    status:'ok',   cls:'ref',  desc:'5% от пополнения от Ибрагимов Т.', date: now - 16*d },
    { id: now - 18*d,       type:'Покупка BTC',          amount:224000,  rub:224000,  status:'ok',   cls:'in',   desc:'Куплено 0.045 BTC', date: now - 18*d },
    { id: now - 20*d,       type:'Обмен BTC → USDT',     amount:89000,   rub:89000,   status:'ok',   cls:'swap', desc:'0.018 BTC → 8 900 USDT', date: now - 20*d },

    // 21-30 дней
    { id: now - 22*d,       type:'Пополнение картой',    amount:200000,  rub:200000,  status:'ok',   cls:'in',   desc:'Тинькофф · 5536 **** 8890', date: now - 22*d },
    { id: now - 25*d,       type:'Реферальный бонус',    amount:9100,    rub:9100,    status:'ok',   cls:'ref',  desc:'5% от пополнения от Магомедов А.', date: now - 25*d },
    { id: now - 27*d,       type:'Вывод на карту',       amount:150000,  rub:150000,  status:'ok',   cls:'out',  desc:'Сбербанк · 2202 **** 1102', date: now - 27*d },
    { id: now - 30*d,       type:'Прибыльная сделка',    amount:56700,   rub:56700,   status:'ok',   cls:'in',   desc:'ETH/BTC · свинг', date: now - 30*d }
  ];
}

// Реферальная программа — приглашённые друзья
function buildSeedReferrals(){
  const now = Date.now(), d = 24*60*60*1000;
  const list = [
    ['Магомедов А.','magomed_a',42,245000,'active'], ['Ахмедов Руслан','akhmedov_r',30,180000,'active'],
    ['Ибрагимов Тимур','ibragimov_t',20,310000,'active'], ['Гаджиев Магомед','gadzhiev_m',17,96000,'active'],
    ['Смирнов Дмитрий','smirnov_d',14,85000,'active'], ['Алиев Камиль','aliev_k',9,54000,'active'],
    ['Кузнецов Артём','kuznetsov_a',7,120000,'active'], ['Омаров Расул','omarov_r',2,0,'pending']
  ];
  return list.map(([name,login,ago,deposits,status]) => ({ name, login, joinedAt: now - ago*d, deposits, earned: Math.round(deposits*0.05*100)/100, status }));
}

// Аналитика по месяцам (6 месяцев)
function buildSeedAnalytics(){
  const now = new Date();
  const months = [];
  for (let i=5; i>=0; i--){
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  const profits = [92000, 118500, 141200, 167800, 196400, 212300];
  const startBalances = [], endBalances = []; let e = TARGET_RUB; // цепочка баланса назад от текущего
  for (let i=5; i>=0; i--){ endBalances[i] = e; startBalances[i] = Math.round((e - profits[i])*100)/100; e = startBalances[i]; }
  const tradeCounts = [98, 124, 156, 189, 245, 168];
  const winRates = [72, 76, 78, 82, 85, 81];
  return months.map((m, i) => ({
    ...m,
    profit: profits[i],
    startBalance: startBalances[i],
    endBalance: endBalances[i],
    trades: tradeCounts[i],
    winRate: winRates[i],
    bestTrade: [28000, 35000, 49000, 42000, 49500, 38000][i]
  }));
}

/* ==================== STATE ==================== */
let currentLogin = null;
let currentUser = null;
let userData = null;
let pendingUser = null;
let adminSelectedLogin = null;
let historyFilter = 'all';

function initUserData(login){
  const key = 'nebula_user_' + login;
  const saved = JSON.parse(localStorage.getItem(key) || 'null');
  if (saved && saved.version === 3) return saved;
  const old = saved && saved.version === 2 ? saved : null;
  if (old && login !== 'saidik05'){ old.version = 3; localStorage.setItem(key, JSON.stringify(old)); return old; }

  // Для saidik05 создаём богатые сид-данные
  const isSeed = login === 'saidik05';
  const fresh = {
    version: 3,
    createdAt: isSeed ? Date.now() - 45*86400000 : Date.now(),
    balanceRub: isSeed ? TARGET_RUB : (USERS[login].extra ? 0 : calcTotalRub()),
    withdrawalRequests: [],
    balanceHidden: false,
    accountFrozen: false,
    userNickname: USERS[login].nickname,
    secretId: 'DV-' + Math.random().toString(36).slice(2,7).toUpperCase(),
    addressBook: isSeed ? [
      { label:'Мой Binance', value:'TY8aKd91LpZm4xNq3vRt7uWc2sKf6bHe' },
      { label:'Обменник Garantex', value:'0x8f3Ae21bB94c7D58f1e9C4a2d6B803E7f12A' }
    ] : [],
    showUsd: true,
    chatHistory: [
      { id:'init', from:'support', text:'Здравствуйте! Чем можем помочь?', time: Date.now() }
    ],
    // Seed-данные
    transactions: isSeed ? buildSeedTransactions() : [],
    referrals: isSeed ? buildSeedReferrals() : [],
    analytics: isSeed ? buildSeedAnalytics() : [],
    // KYC
    kycStatus: isSeed ? 'Пройдена' : 'Не пройдена'
  };
  if (old) ['withdrawalRequests','chatHistory','addressBook','userNickname','secretId','avatar','balanceHidden','accountFrozen','showUsd','kycStatus','createdAt','lastLogin','prevLogin'].forEach(k => { if (old[k] !== undefined) fresh[k] = old[k]; });
  localStorage.setItem(key, JSON.stringify(fresh));
  return fresh;
}
function saveUserData(){ if (currentLogin && userData) localStorage.setItem('nebula_user_' + currentLogin, JSON.stringify(userData)); }
function saveAnyUser(login, data){ localStorage.setItem('nebula_user_' + login, JSON.stringify(data)); }

/* ==================== HELPERS ==================== */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmtRub = v => Number(v).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' ₽';
const fmtRubShort = v => Number(v).toLocaleString('ru-RU',{maximumFractionDigits:0}) + ' ₽';
const fmtUsd = v => Number(v).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' $';
const fmtBoth = v => fmtRub(v) + '  (≈ ' + fmtUsd(v / USD_RATE) + ')';
const fmtNum = (v,d=8) => Number(v).toLocaleString('ru-RU',{maximumFractionDigits:d});
const formatDateTime = ts => {
  const d = new Date(ts);
  const p = n => String(n).padStart(2,'0');
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
  const isToday = d.toDateString() === today.toDateString();
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return `Сегодня, ${p(d.getHours())}:${p(d.getMinutes())}`;
  if (isYesterday) return `Вчера, ${p(d.getHours())}:${p(d.getMinutes())}`;
  return `${p(d.getDate())}.${p(d.getMonth()+1)}.${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}`;
};
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ==================== TOAST / MODAL ==================== */
function showToast(message, type='info', title=null, duration=5000){
  const c = $('#toastContainer'); if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const ic = {success:'✓', error:'✕', danger:'✕', warning:'⚠', info:'ℹ'};
  const tt = {success:'Успешно', error:'Ошибка', danger:'Ошибка', warning:'Внимание', info:'Уведомление'};
  t.innerHTML = `<div class="toast-ic">${ic[type]||ic.info}</div><div class="toast-body"><div class="toast-title">${title||tt[type]||tt.info}</div><div class="toast-text">${escapeHtml(message)}</div></div><button class="toast-close" aria-label="Закрыть">×</button>`;
  t.querySelector('.toast-close').addEventListener('click', () => t.remove());
  c.appendChild(t);
  setTimeout(() => { if (t.parentElement){ t.classList.add('hiding'); setTimeout(() => t.remove(), 300); } }, duration);
}
function showModal(title, message, type='info', details=null, onConfirm=null, onCancel=null){
  const ov=$('#modalOverlay'), mt=$('#modalTitle'), mm=$('#modalMessage'), mi=$('#modalIcon'), md=$('#modalConfirmDetails');
  const cf=$('#modalConfirm'), cc=$('#modalCancel'), cl=$('#modalClose');
  mt.textContent = title; mm.textContent = message;
  mi.className = 'modal-icon ' + type;
  mi.textContent = type==='success' ? '✓' : type==='warning' ? '⚠' : 'ℹ';
  if (details){ md.style.display='block'; md.innerHTML = details; } else { md.style.display='none'; md.innerHTML=''; }
  if (onConfirm || onCancel){ cc.style.display='inline-flex'; cf.textContent='Да'; cc.textContent='Нет'; }
  else { cc.style.display='none'; cf.textContent='ОК'; }
  ov.classList.add('active');
  const close = () => { ov.classList.remove('active'); cf.onclick=null; cc.onclick=null; cl.onclick=null; ov.onclick=null; };
  cf.onclick = () => { const f=onConfirm; close(); f && f(); };
  cc.onclick = () => { const f=onCancel; close(); f && f(); };
  cl.onclick = () => { const f=onCancel; close(); f && f(); };
  ov.onclick = e => { if (e.target===ov){ const f=onCancel; close(); f && f(); } };
  setTimeout(() => {
    const inp = document.getElementById('transfer2FA');
    if (inp){ inp.focus(); inp.addEventListener('keydown', function h(e){ if (e.key==='Enter'){ e.preventDefault(); inp.removeEventListener('keydown',h); cf.click(); } }); }
  }, 80);
}
function showAlert(msg, type='info'){
  if (type==='warning' || type==='error' || type==='danger') showModal('Внимание', msg, type);
  else showToast(msg, type);
}
window.showModal = showModal;

/* ==================== LOGIN ==================== */
const loginPage = $('#loginPage'), app = $('#appContainer');
const step1 = $('#loginStep1'), step2 = $('#loginStep2');
const SESS_TTL = 12*60*60*1000, MAX_TRIES = 5, LOCK_MS = 30000;
let tries = 0, lockUntil = +localStorage.getItem(SK + 'lock') || 0;
const errBox1 = $('#loginErrorStep1'), errBox2 = $('#loginErrorStep2');
const roleOk = u => !!u && (MODE === 'admin' ? u.role === 'admin' : u.role !== 'admin');
function showErr(box, msg){ const t = box.querySelector('span'); if (t && msg) t.textContent = msg; box.classList.remove('show'); void box.offsetWidth; box.classList.add('show'); }
function lockTick(){
  const left = Math.ceil((lockUntil - Date.now())/1000);
  if (left > 0){ showErr(errBox1, `Слишком много попыток. Повторите через ${left} с`); setTimeout(lockTick, 1000); }
  else { errBox1.classList.remove('show'); tries = 0; localStorage.removeItem(SK + 'lock'); }
}
function failAttempt(box, msg){
  if (++tries >= MAX_TRIES){
    lockUntil = Date.now() + LOCK_MS; localStorage.setItem(SK + 'lock', lockUntil);
    pendingUser = null; step2.classList.remove('active'); step1.classList.add('active'); box.classList.remove('show'); lockTick(); return;
  }
  showErr(box, `${msg} (осталось попыток: ${MAX_TRIES - tries})`);
}
$('#loginFormStep1').addEventListener('submit', e => {
  e.preventDefault();
  if (Date.now() < lockUntil){ lockTick(); return; }
  const u = $('#loginUsername').value.trim().toLowerCase(), p = $('#loginPassword').value, user = USERS[u];
  if (roleOk(user) && user.password === p){
    tries = 0; errBox1.classList.remove('show');
    if ($('#rememberLogin').checked) localStorage.setItem(SK + 'remember', u); else localStorage.removeItem(SK + 'remember');
    pendingUser = { login: u, ...user }; goToStep2(); return;
  }
  failAttempt(errBox1, 'Неверный логин или пароль');
});
$('#loginFormStep2').addEventListener('submit', e => {
  e.preventDefault();
  if (Date.now() < lockUntil){ lockTick(); return; }
  const t = $('#login2FA').value.trim();
  if (pendingUser && pendingUser.twoFa === t){
    tries = 0; errBox2.classList.remove('show');
    startSession(pendingUser.login);
    const prev = userData.lastLogin; userData.prevLogin = prev || null; userData.lastLogin = Date.now(); saveUserData();
    localStorage.setItem(SK + 'in', 'true'); localStorage.setItem(SK + 'login', currentLogin); localStorage.setItem(SK + 'at', Date.now());
    enterApp(HOME);
    showToast(`Добро пожаловать, ${currentUser.name}!`, 'success', 'Вход выполнен', 3500);
    if (MODE !== 'admin') setTimeout(() => showToast(`${fmtRub(userData.balanceRub)} ≈ ${fmtUsd(userData.balanceRub/USD_RATE)}`, 'info', 'Ваш баланс', 6000), 700);
    $('#loginFormStep1').reset(); $('#loginFormStep2').reset();
    step2.classList.remove('active'); step1.classList.add('active'); pendingUser = null;
    return;
  }
  failAttempt(errBox2, 'Неверный код 2FA');
});
function goToStep2(){ step1.classList.remove('active'); step2.classList.add('active'); setTimeout(() => $('#login2FA').focus(), 100); }
$('#backToStep1').addEventListener('click', () => { step2.classList.remove('active'); step1.classList.add('active'); pendingUser = null; errBox2.classList.remove('show'); });
$('#togglePw').addEventListener('click', () => { const i = $('#loginPassword'), s = i.type === 'password'; i.type = s ? 'text' : 'password'; $('#togglePw').setAttribute('aria-label', s ? 'Скрыть пароль' : 'Показать пароль'); $('#togglePw').style.color = s ? 'var(--accent)' : ''; });
function startSession(login){ currentLogin = login; currentUser = { login, ...USERS[login] }; userData = initUserData(login); }
function enterApp(page){
  loginPage.style.display = 'none'; app.classList.add('active');
  applyUserProfile(); updateMenuForRole(currentUser.role); updateMonthNames(); ensureSecretId();
  showPage(page);
}
function logout(){
  ['in','login','at'].forEach(k => localStorage.removeItem(SK + k));
  loginPage.style.display = 'flex'; app.classList.remove('active');
  $('#sidebar').classList.remove('active'); $('#sidebarOverlay').classList.remove('active'); $('#burgerBtn').classList.remove('active');
  step2.classList.remove('active'); step1.classList.add('active');
  $('#loginFormStep1').reset(); $('#loginFormStep2').reset();
  const r = localStorage.getItem(SK + 'remember'); if (r){ $('#loginUsername').value = r; $('#rememberLogin').checked = true; }
  currentLogin = null; currentUser = null; userData = null; pendingUser = null;
  setTimeout(() => ($('#loginUsername').value ? $('#loginPassword') : $('#loginUsername')).focus(), 50);
}
$('#logoutBtn').addEventListener('click', logout);
{ const r = localStorage.getItem(SK + 'remember'); if (r){ $('#loginUsername').value = r; $('#rememberLogin').checked = true; } }
if (Date.now() < lockUntil) lockTick();

/* ==================== MENU ==================== */
const burger = $('#burgerBtn');
burger.addEventListener('click', () => { burger.classList.toggle('active'); $('#sidebar').classList.toggle('active'); $('#sidebarOverlay').classList.toggle('active'); });
$('#sidebarOverlay').addEventListener('click', () => { burger.classList.remove('active'); $('#sidebar').classList.remove('active'); $('#sidebarOverlay').classList.remove('active'); });

function initMenuGroups(){
  $$('.sb-group').forEach((g, i) => {
    const h = g.querySelector('.sb-group-head'); if (!h) return;
    const key = `menuGroup_${i}_collapsed`;
    if (localStorage.getItem(key) === 'true') g.classList.add('collapsed');
    h.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); g.classList.toggle('collapsed'); localStorage.setItem(key, g.classList.contains('collapsed')); });
  });
}
function updateMenuForRole(role){
  const admin = $('#adminMenu'), wm = $('#withdrawalRequestsMenuItem');
  if (admin) admin.style.display = role === 'admin' ? 'block' : 'none';
  if (wm) wm.style.display = role === 'admin' ? 'none' : 'flex';
}
function applyUserProfile(){
  $('#sidebarUserName').textContent = currentUser.name;
  $('#sidebarUserLogin').textContent = currentLogin;
  paintAvatar($('#sidebarUserAvatar'));
  const wn = $('#welcomeName');
  if (wn) wn.textContent = `Добро пожаловать, ${currentUser.role === 'admin' ? 'Администратор' : (currentUser.name.split(' ')[1] || currentUser.name)}`;
  const pl = $('#profileLogin'); if (pl) pl.textContent = currentLogin;
  const pn = $('#profileName'); if (pn) pn.textContent = currentUser.name;
  const nn = $('#profileNickname'); if (nn && userData) nn.value = userData.userNickname;
  const ks = $('#kycStatus'); if (ks && userData) ks.value = userData.kycStatus || 'Не пройдена';
  updateNotifBadge();
}

function showPage(pageId){
  if (/^admin/.test(pageId) !== (MODE === 'admin')) return;
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.sb-item').forEach(i => i.classList.remove('active'));
  const p = document.getElementById(pageId + 'Page');
  if (p) p.classList.add('active');
  const it = document.querySelector(`.sb-item[data-page="${pageId}"]`);
  if (it) it.classList.add('active');
  localStorage.setItem(SK + 'page', pageId);

  if (pageId === 'analytics') renderAnalytics();
  if (pageId === 'withdrawalRequests') renderWithdrawalRequests();
  if (pageId === 'adminOverview') renderAdminOverview();
  if (pageId === 'adminUsers') renderAdminUsers();
  if (pageId === 'adminRequests') renderAdminRequests();
  if (pageId === 'profile') updateProfileDisplay();
  if (pageId === 'dashboard'){ updateFrozenAccountWarning(); renderCryptoDashboard(); updateBalanceDisplay(); renderDashboardStats(); renderReferralBanner(); }
  if (pageId === 'wallet') renderWallet();
  if (pageId === 'addressBook') renderAddressBook();
  if (pageId === 'history') renderHistory();
  if (pageId === 'deposit') updateDepositPurpose();
  if (pageId === 'support') renderChat();
  if (pageId === 'referrals') renderReferrals();

  if (window.innerWidth < 768){
    burger.classList.remove('active');
    $('#sidebar').classList.remove('active');
    $('#sidebarOverlay').classList.remove('active');
  }
  window.scrollTo({top:0, behavior:'smooth'});
}
window.showPage = showPage;
$$('.sb-item').forEach(item => {
  item.addEventListener('click', e => { e.preventDefault(); const p = item.getAttribute('data-page'); if (p) showPage(p); });
});

/* ==================== BALANCE ==================== */
function updateBalanceDisplay(){
  if (!userData) return;
  const v3 = $('#balanceValueMain'), v4 = $('#balanceValueUsdMain');
  const rubText = fmtRub(userData.balanceRub);
  const usdText = '≈ ' + fmtUsd(userData.balanceRub / USD_RATE);
  if (userData.balanceHidden){
    if (v3){ v3.textContent = '••••••'; v3.classList.add('bo-hidden'); }
    if (v4){ v4.textContent = '••••••'; v4.classList.add('bo-hidden'); }
  } else {
    if (v3){ v3.textContent = rubText; v3.classList.remove('bo-hidden'); }
    if (v4){ v4.style.display = userData.showUsd ? '' : 'none'; v4.textContent = usdText; v4.classList.remove('bo-hidden'); }
  }
  renderBalanceMeta();
}
const txSigned = t => (t.cls==='in'||t.cls==='ref') ? (t.rub||t.amount) : t.cls==='out' ? -(t.rub||t.amount) : 0;
function renderBalanceMeta(){
  const c = $('#balanceMeta'); if (!c || !userData) return;
  const tx = userData.transactions || [], now = Date.now(), D = 864e5, hid = userData.balanceHidden, v = x => hid ? '••••' : x;
  const net24 = tx.filter(t => now - t.date < D).reduce((s,t) => s + txSigned(t), 0), m = tx.filter(t => now - t.date < 30*D);
  const sum = f => m.filter(f).reduce((s,t) => s + (t.rub||t.amount), 0);
  const item = (l, val, cls='') => `<div class="bo-meta-item"><span>${l}</span><b class="${cls}">${val}</b></div>`;
  c.innerHTML = item('Курс', `1 $ = ${USD_RATE.toLocaleString('ru-RU',{minimumFractionDigits:2})} ₽`)
    + item('За 24 часа', v((net24>=0?'+':'−') + fmtRubShort(Math.abs(net24))), net24>=0?'positive':'negative')
    + item('Пополнено · 30 дн.', v(fmtRubShort(sum(t => t.cls==='in' && /Пополнение/.test(t.type)))))
    + item('Выведено · 30 дн.', v(fmtRubShort(sum(t => t.cls==='out'))))
    + item('Рефералы · 30 дн.', v('+' + fmtRubShort(sum(t => t.cls==='ref'))), 'positive');
  const tr = $('#balanceTrend'), sp = $('#balanceTrend span'), base = userData.balanceRub - net24, p = base > 0 ? net24/base*100 : 0;
  if (sp) sp.textContent = `${p>=0?'+':''}${p.toFixed(2).replace('.',',')}% / 24ч`;
  if (tr) tr.classList.toggle('down', net24 < 0);
}
window.toggleBalanceVisibility = function(){ if (!userData) return; userData.balanceHidden = !userData.balanceHidden; saveUserData(); updateBalanceDisplay(); updateProfileDisplay(); };

/* ==================== PROFILE ==================== */
function updateProfileDisplay(){
  if (!userData) return;
  renderProfileHero();
  const s1=$('#balanceHiddenStatus'), t1=$('#balanceToggle');
  const s2=$('#accountFrozenStatus'), t2=$('#accountFreezeToggle');
  if (s1) s1.textContent = userData.balanceHidden ? 'Скрыт' : 'Показан';
  if (t1) t1.classList.toggle('active', userData.balanceHidden);
  if (s2){ s2.textContent = userData.accountFrozen ? 'Заморожен' : 'Активен'; s2.style.color = userData.accountFrozen ? 'var(--danger)' : 'var(--accent)'; }
  if (t2) t2.classList.toggle('active', userData.accountFrozen);
  const tsu = $('#toggleShowUsd'); if (tsu) tsu.classList.toggle('active', userData.showUsd);
  const ks = $('#kycStatus'); if (ks) ks.value = userData.kycStatus || 'Не пройдена';
}
document.addEventListener('click', e => {
  if (e.target.id === 'balanceToggle' && userData){ userData.balanceHidden = !userData.balanceHidden; saveUserData(); updateBalanceDisplay(); updateProfileDisplay(); }
  if (e.target.id === 'accountFreezeToggle' && userData){ userData.accountFrozen = !userData.accountFrozen; saveUserData(); updateProfileDisplay(); updateFrozenAccountWarning(); showToast(userData.accountFrozen ? 'Счет заморожен' : 'Счет разморожен', userData.accountFrozen ? 'warning' : 'success'); }
  if (e.target.id === 'toggleShowUsd' && userData){ userData.showUsd = !userData.showUsd; saveUserData(); e.target.classList.toggle('active', userData.showUsd); updateBalanceDisplay(); }
});
function updateFrozenAccountWarning(){
  if (!userData) return;
  const w = $('#frozenAccountWarning');
  if (w) w.style.display = userData.accountFrozen ? 'flex' : 'none';
}

/* ==================== SPARKLINE / CHART ==================== */
function sparkline(seed, up=true){
  const points = [];
  let v = 50;
  for (let i=0;i<20;i++){ const seedVal = Math.sin(seed * 7 + i * 0.8) * 12 + Math.sin(seed * 3 + i * 1.7) * 8; v += seedVal * (up ? -0.4 : 0.4) * ((i%2) ? 1 : -1) * 0.6; v = Math.max(15, Math.min(85, v)); points.push(v); }
  const w = 200, h = 36, step = w / (points.length - 1);
  const path = points.map((y, i) => `${i===0?'M':'L'}${(i*step).toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = path + ` L${w},${h} L0,${h} Z`;
  const color = up ? '#00e0a4' : '#ff5c5c';
  const fillColor = up ? 'rgba(0,224,164,.15)' : 'rgba(255,92,92,.15)';
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${areaPath}" fill="${fillColor}"/><path d="${path}" stroke="${color}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/* ==================== ASSET CARD ==================== */
function assetCard(a, onclick){
  const usd = a.amount * a.usdPrice;
  const rub = usd * USD_RATE;
  const sumB = walletAssets.reduce((s,x)=>s+x.amount*x.usdPrice,0), wb = walletAssets.find(x=>x.code===a.code);
  const share = wb ? (wb.amount*wb.usdPrice/sumB*100).toFixed(1).replace('.',',') : '0';
  const seed = a.code.charCodeAt(0) % 10;
  const chg = (Math.sin(seed) * 12).toFixed(2);
  const pos = parseFloat(chg) >= 0;
  return `<div class="asset" ${onclick ? `onclick="${onclick}"` : ''}><div class="asset-top"><div class="asset-id"><div class="asset-symbol">${a.code[0]}</div><div class="asset-name"><div class="code">${a.code}</div><div class="full">${a.name} · ${share}%</div></div></div><div class="asset-amount"><div class="amt">${fmtNum(a.amount)}</div><div class="val">${fmtRub(rub)}</div></div></div><div class="asset-spark">${sparkline(seed, pos)}</div><div class="asset-bottom"><span class="asset-chg ${pos ? 'up' : 'down'}">${pos ? '▲' : '▼'} ${Math.abs(chg)}%</span><span class="asset-usd">≈ ${fmtUsd(usd)}</span></div></div>`;
}
function renderWallet(){ const c = $('#walletAssetsList'); if (!c) return; c.innerHTML = scaledAssets().map(a => assetCard(a, '')).join(''); }
function renderCryptoAssets(){ const c = $('#cryptoAssetsGrid'); if (!c) return; c.innerHTML = scaledAssets().slice(0,6).map(a => assetCard(a, "showPage('wallet')")).join(''); }

/* ==================== ТРАНЗАКЦИИ ==================== */
function txIcon(cls){
  if (cls === 'in')   return '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  if (cls === 'out')  return '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
  if (cls === 'swap') return '<svg viewBox="0 0 24 24"><path d="M7 16H3M3 16l4 4M3 16l4-4"/><path d="M17 8h4M21 8l-4-4M21 8l-4 4"/></svg>';
  if (cls === 'ref')  return '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';
}
function txRowHTML(t){
  const statusCls = t.status === 'ok' ? 'ok' : t.status === 'progress' ? 'progress' : t.status === 'fail' ? 'fail' : 'wait';
  const statusText = t.status === 'ok' ? 'Завершено' : t.status === 'progress' ? 'В пути' : t.status === 'fail' ? 'Ошибка' : 'Обработка';
  const sign = (t.cls === 'in' || t.cls === 'ref') ? '+' : '−';
  const posClass = (t.cls === 'in' || t.cls === 'ref') ? 'positive' : 'negative';
  const amountStr = sign + fmtRub(t.rub || t.amount);
  return `<div class="tx-row" onclick="showTxDetails(${t.id})">
    <div class="tx-left"><div class="tx-ic ${t.cls}">${txIcon(t.cls)}</div><div class="tx-info"><div class="tx-type">${escapeHtml(t.type)}</div><div class="tx-date">${formatDateTime(t.date)}${t.desc ? ' · ' + escapeHtml(t.desc) : ''}</div></div></div>
    <div class="tx-right"><div class="tx-amt ${posClass}">${amountStr}</div><div class="tx-usd">≈ ${fmtUsd((t.rub||t.amount)/USD_RATE)}</div><div class="tx-status ${statusCls}">${statusText}</div></div>
  </div>`;
}
function renderCryptoTransactions(){
  const c = $('#cryptoTransactionsList'); if (!c) return;
  const txs = (userData.transactions || []).slice(0, 6);
  if (!txs.length){ c.innerHTML = `<div class="empty">Операций пока нет</div>`; return; }
  c.innerHTML = txs.map(txRowHTML).join('');
}
const isDeal = t => /сделк|Покупка|Продажа/i.test(t.type);
window.showTxDetails = function(id){
  const t = ((userData && userData.transactions) || []).find(x => String(x.id) === String(id)); if (!t) return;
  const rub = t.rub || t.amount, st = {ok:'Завершено', progress:'В пути', fail:'Ошибка'}[t.status] || 'Обработка';
  const cat = {in:'Поступление', out:'Списание', swap:'Обмен', ref:'Реферальный бонус'}[t.cls] || 'Операция';
  const row = (l, v) => `<div class="row"><span class="lbl">${l}:</span><span class="val">${v}</span></div>`;
  showModal(t.type, t.desc || '', t.status === 'ok' ? 'success' : 'info',
    row('Категория', cat) + row('Сумма', (txSigned(t) < 0 ? '−' : t.cls==='swap' ? '' : '+') + fmtRub(rub)) + row('В долларах', '≈ ' + fmtUsd(rub/USD_RATE)) + row('Курс', `1 $ = ${USD_RATE.toLocaleString('ru-RU',{minimumFractionDigits:2})} ₽`) + row('Статус', st) + row('Дата', formatDateTime(t.date)) + row('№ операции', escapeHtml(String(t.id))));
};
function renderHistorySummary(){
  const c = $('#historySummary'); if (!c || !userData) return;
  const tx = userData.transactions || [], sum = f => tx.filter(f).reduce((s,t) => s + (t.rub||t.amount), 0);
  const deals = tx.filter(isDeal), pnl = deals.filter(t => /Прибыльная/.test(t.type)).reduce((s,t) => s + (t.rub||t.amount), 0);
  const st = (l, v, cls='') => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value ${cls}">${v}</div></div>`;
  c.innerHTML = st('Пополнено', fmtRubShort(sum(t => t.cls==='in' && /Пополнение/.test(t.type)))) + st('Выведено', fmtRubShort(sum(t => t.cls==='out'))) + st('Реферальные', '+' + fmtRubShort(sum(t => t.cls==='ref')), 'positive') + st(`Прибыль по сделкам (${deals.length})`, '+' + fmtRubShort(pnl), 'positive');
}
function renderHistory(){
  const c = $('#historyList'); if (!c) return;
  renderHistorySummary();
  let txs = userData.transactions || [];
  if (historyFilter === 'deal') txs = txs.filter(isDeal); else if (historyFilter !== 'all') txs = txs.filter(t => t.cls === historyFilter);
  if (!txs.length){ c.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Нет операций</div>`; return; }
  c.innerHTML = txs.map(txRowHTML).join('');
}
document.addEventListener('click', e => {
  const btn = e.target.closest('#historyFilter button');
  if (btn){
    $$('#historyFilter button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    historyFilter = btn.dataset.filter;
    renderHistory();
  }
});

/* ==================== ДАШБОРД-СТАТИСТИКА ==================== */
function renderDashboardStats(){
  if (!userData) return;
  const c = $('#dashboardStatsBar'); if (!c) return;
  const an = userData.analytics || [];
  const thisMonth = an[an.length-1] || { profit:0, trades:0, winRate:0 };
  const prevMonth = an[an.length-2] || { profit:0 };
  const growth = prevMonth.profit ? ((thisMonth.profit - prevMonth.profit) / prevMonth.profit * 100) : 0;
  const activeAssets = walletAssets.length;
  const recentTx = (userData.transactions || []).filter(t => Date.now() - t.date < 24*60*60*1000).length;
  const refEarnings = (userData.referrals || []).reduce((s,r)=>s+r.earned,0);

  c.innerHTML = `
    <div class="stat"><div class="stat-top"><div class="stat-ic green"><svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div><span class="stat-change ${growth<0?'down':''}">${growth>=0?'+':''}${growth.toFixed(1)}%</span></div><div class="stat-label">Доход за месяц</div><div class="stat-value positive">+${fmtRubShort(thisMonth.profit)}</div></div>
    <div class="stat"><div class="stat-top"><div class="stat-ic blue"><svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div></div><div class="stat-label">Активных активов</div><div class="stat-value">${activeAssets}</div></div>
    <div class="stat"><div class="stat-top"><div class="stat-ic amber"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div></div><div class="stat-label">Транзакций за 24ч</div><div class="stat-value">${recentTx}</div></div>
    <div class="stat"><div class="stat-top"><div class="stat-ic purple"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div></div><div class="stat-label">Доход с рефералов</div><div class="stat-value positive">${fmtRubShort(refEarnings)}</div></div>
  `;
}
function renderCryptoDashboard(){ renderCryptoAssets(); renderCryptoTransactions(); renderDashboardStats(); renderReferralBanner(); }
function renderReferralBanner(){
  const t = $('#refBannerTitle'), d = $('#refBannerDesc');
  if (!userData || !t) return;
  const count = (userData.referrals || []).length;
  const earned = (userData.referrals || []).reduce((s,r)=>s+r.earned,0);
  t.textContent = `Реферальная программа · ${count} ${count===1?'друг':count<5?'друга':'друзей'}`;
  d.textContent = `Ваш доход: ${fmtRub(earned)} · Приглашайте друзей и получайте 5% с каждого пополнения.`;
}

/* ==================== АНАЛИТИКА ==================== */
function renderAnalytics(){
  if (!userData) return;
  const c = $('#analyticsStatsBar');
  const an = userData.analytics || [];
  if (c){
    const totalProfit = an.reduce((s,a)=>s+a.profit,0);
    const totalTrades = an.reduce((s,a)=>s+a.trades,0);
    const avgWin = an.length ? an.reduce((s,a)=>s+a.winRate,0)/an.length : 0;
    const start = an[0]?.startBalance || 0;
    const end = an[an.length-1]?.endBalance || 0;
    const growth = start ? ((end - start) / start * 100) : 0;
    c.innerHTML = `
      <div class="stat"><div class="stat-top"><div class="stat-ic green"><svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg></div></div><div class="stat-label">Общий доход</div><div class="stat-value positive">+${fmtRubShort(totalProfit)}</div></div>
      <div class="stat"><div class="stat-top"><div class="stat-ic blue"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div></div><div class="stat-label">Всего сделок</div><div class="stat-value">${totalTrades}</div></div>
      <div class="stat"><div class="stat-top"><div class="stat-ic amber"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div></div><div class="stat-label">Средний винрейт</div><div class="stat-value">${avgWin.toFixed(0)}%</div></div>
      <div class="stat"><div class="stat-top"><div class="stat-ic purple"><svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-6"/></svg></div><span class="stat-change">${growth>=0?'+':''}${growth.toFixed(1)}%</span></div><div class="stat-label">Общий рост капитала</div><div class="stat-value positive">${growth>=0?'+':''}${growth.toFixed(1)}%</div></div>
    `;
  }

  const p = $('#analyticsPeriods');
  if (p){
    if (!an.length){ p.innerHTML = `<div class="empty">Нет данных</div>`; }
    else {
      p.innerHTML = [...an].reverse().map(m => {
        const name = monthNames[m.month];
        const isCurrent = m.month === new Date().getMonth() && m.year === new Date().getFullYear();
        return `<div class="period">
          <div class="period-head"><div class="period-title">${name} ${m.year}${isCurrent?' (текущий)':''}</div><div class="period-badge">${isCurrent?'Активен':'Завершён'}</div></div>
          <div class="period-value">+${fmtRub(m.profit)}</div>
          <div class="period-desc">${m.trades} сделок · винрейт ${m.winRate}% · лучшая сделка +${fmtRub(m.bestTrade)}<br>Баланс: ${fmtRubShort(m.startBalance)} → ${fmtRubShort(m.endBalance)}</div>
        </div>`;
      }).join('');
    }
  }

  const chart = $('#analyticsChart');
  if (chart && an.length){
    const w = 800, h = 220, padX = 40, padY = 20;
    const max = Math.max(...an.map(m=>m.profit));
    const bw = (w - padX*2) / an.length;
    const bars = an.map((m, i) => {
      const bh = (m.profit / max) * (h - padY*2);
      const x = padX + i*bw + bw*0.15;
      const y = h - padY - bh;
      const bwidth = bw*0.7;
      const isLast = i === an.length-1;
      return `<g class="chart-bar">
        <rect x="${x}" y="${y}" width="${bwidth}" height="${bh}" rx="6" fill="url(#chartGrad${isLast?'Active':''})"/>
        <text x="${x + bwidth/2}" y="${y - 6}" text-anchor="middle" fill="${isLast?'#00e0a4':'#8b919c'}" font-size="11" font-weight="700">+${(m.profit/1000).toFixed(0)}k</text>
        <text x="${x + bwidth/2}" y="${h - 4}" text-anchor="middle" fill="#5a6069" font-size="11">${monthNames[m.month].slice(0,3)}</text>
      </g>`;
    }).join('');
    chart.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,224,164,.55)"/><stop offset="100%" stop-color="rgba(0,224,164,.1)"/></linearGradient>
        <linearGradient id="chartGradActive" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00e0a4"/><stop offset="100%" stop-color="#34d399"/></linearGradient>
      </defs>
      ${bars}
    </svg>`;
  }

  const top = $('#analyticsTopTrades');
  if (top){
    const txs = (userData.transactions || []).filter(t => t.cls === 'in' || t.cls === 'swap').sort((a,b)=>b.rub-a.rub).slice(0,5);
    if (!txs.length){ top.innerHTML = `<div class="empty">Нет данных</div>`; }
    else { top.innerHTML = txs.map(txRowHTML).join(''); }
  }
}

/* ==================== РЕФЕРАЛЫ ==================== */
function renderReferrals(){
  if (!userData) return;
  const refs = userData.referrals || [];
  const totalEarned = refs.reduce((s,r)=>s+r.earned,0);
  const totalDeposits = refs.reduce((s,r)=>s+r.deposits,0);
  const stats = $('#referralsStats');
  if (stats){
    stats.innerHTML = `
      <div class="stat"><div class="stat-label">Приглашено друзей</div><div class="stat-value">${refs.length}</div></div>
      <div class="stat"><div class="stat-label">Всего пополнений</div><div class="stat-value">${fmtRubShort(totalDeposits)}</div></div>
      <div class="stat"><div class="stat-label">Ваш доход (5%)</div><div class="stat-value positive">${fmtRub(totalEarned)}</div></div>
      <div class="stat"><div class="stat-label">Средний чек</div><div class="stat-value">${fmtRubShort(refs.length ? totalDeposits/refs.length : 0)}</div></div>
    `;
  }
  const tbl = $('#referralsTableWrap');
  if (tbl){
    if (!refs.length){ tbl.innerHTML = `<div class="empty">Пока никого не пригласили</div>`; return; }
    tbl.innerHTML = `<div style="overflow-x:auto"><table class="friends-table"><thead><tr><th>Друг</th><th>Дата регистрации</th><th>Пополнений</th><th>Ваш доход</th><th>Статус</th></tr></thead><tbody>${refs.map(r => `
      <tr>
        <td><div class="friend-name"><div class="friend-av">${r.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div><div><div>${escapeHtml(r.name)}</div><div style="font-size:11px;color:var(--text-3);font-family:var(--mono);margin-top:2px">@${escapeHtml(r.login)}</div></div></div></td>
        <td>${formatDateTime(r.joinedAt).split(',')[0]}</td>
        <td>${fmtRubShort(r.deposits)}</td>
        <td class="friend-amount">+${fmtRub(r.earned)}</td>
        <td>${r.status==='pending' ? '<span class="tx-status wait">Ждёт пополнения</span>' : '<span class="tx-status ok">Активен</span>'}</td>
      </tr>`).join('')}</tbody></table></div>`;
  }
  // Обновить реферальную ссылку
  const refInput = $('#referralLink');
  if (refInput && userData) refInput.value = `${location.origin}${location.pathname}?ref=${userData.userNickname}`;
}

/* ==================== АДРЕСНАЯ КНИГА ==================== */
function renderAddressBook(){
  if (!userData) return;
  const c = $('#addressBookList'); if (!c) return;
  if (!userData.addressBook.length){ c.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Адресов пока нет</div>`; return; }
  c.innerHTML = userData.addressBook.map(e => `<div style="padding:14px 0;border-bottom:1px solid var(--border)"><div style="font-weight:700;font-size:13.5px;margin-bottom:5px">${escapeHtml(e.label)}</div><div style="font-size:12.5px;color:var(--text-2);word-break:break-all;font-family:var(--mono)">${escapeHtml(e.value)}</div></div>`).join('');
}

/* ==================== ЧАТ ==================== */
function renderChat(){
  if (!userData) return;
  const c = $('#chatMessages'); if (!c) return;
  const hist = userData.chatHistory || [];
  c.innerHTML = hist.map(m => {
    const isUser = m.from === 'user';
    const time = new Date(m.time);
    const timeStr = `${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}`;
    return `<div class="chat-msg ${isUser ? 'user' : 'support'}"><div class="chat-av">${isUser ? (userData.userNickname[0]||'Я').toUpperCase() : 'S'}</div><div class="chat-body"><div class="chat-name">${isUser ? 'Вы' : 'Поддержка Nebula Wallet'}</div><div class="chat-text">${escapeHtml(m.text)}</div><div class="chat-time">${timeStr}</div></div></div>`;
  }).join('');
  c.scrollTop = c.scrollHeight;
}
function supportAutoReply(text){
  const t = text.toLowerCase();
  if (t.includes('вывод') || t.includes('заявк')) return 'Заявки на вывод обрабатываются от 24 часов до 3 суток. Проверьте статус в разделе «Заявки на вывод».';
  if (t.includes('пополн') || t.includes('зачисл') || t.includes('реквизит')) return 'Скопируйте реквизиты в разделе «Пополнить», переведите нужную сумму и подтвердите пополнение. Минимум — 1 000 ₽.';
  if (t.includes('пароль') || t.includes('2fa') || t.includes('код')) return 'Никогда не сообщайте пароли и коды 2FA третьим лицам. Если подозреваете взлом — смените пароль и включите 2FA в разделе «Безопасность».';
  if (t.includes('баланс')) return 'Баланс можно скрыть в профиле, а также пополнить через раздел «Пополнить».';
  if (t.includes('реферал') || t.includes('друг')) return 'Ваша реферальная ссылка в разделе «Рефералы». Вы получаете 5% с каждого пополнения приглашённого друга.';
  if (t.includes('спасибо') || t.includes('благодар')) return 'Рады помочь! Если возникнут ещё вопросы — обращайтесь.';
  return 'Спасибо за обращение! Мы передали ваш вопрос специалисту. Ожидайте ответа в течение 2–4 часов.';
}
function sendChatMessage(){
  if (!userData) return;
  const input = $('#supportChatInput');
  const text = input.value.trim();
  if (!text) return;
  if (!userData.chatHistory) userData.chatHistory = [];
  userData.chatHistory.push({ id: Date.now(), from: 'user', text, time: Date.now() });
  saveUserData();
  input.value = '';
  renderChat();
  setTimeout(() => {
    const reply = supportAutoReply(text);
    userData.chatHistory.push({ id: Date.now()+1, from: 'support', text: reply, time: Date.now() });
    saveUserData();
    renderChat();
  }, 900);
}
$('#supportChatSend')?.addEventListener('click', sendChatMessage);
$('#supportChatInput')?.addEventListener('keypress', e => { if (e.key === 'Enter'){ e.preventDefault(); sendChatMessage(); } });

/* ==================== SECRET ID ==================== */
function ensureSecretId(){
  if (!userData) return;
  if (!userData.secretId){ userData.secretId = 'DV-' + Math.random().toString(36).slice(2,7).toUpperCase(); saveUserData(); }
  const el = $('#secretIdValue'); if (el) el.value = userData.secretId;
}

/* ==================== COPY ==================== */
window.copyToClipboard = function(text, btn){
  const done = () => { const orig = btn.innerHTML; btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Скопировано'; btn.classList.add('copied'); setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 1600); };
  if (navigator.clipboard && window.isSecureContext){ navigator.clipboard.writeText(text).then(done).catch(done); }
  else { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch(e){} document.body.removeChild(ta); done(); }
};

/* ==================== DEPOSIT PURPOSE ==================== */
function updateDepositPurpose(){
  if (!userData) return;
  const amt = $('#depositAmount'), p = $('#depositPurpose');
  if (!amt || !p) return;
  const apply = () => { const v = amt.value; p.textContent = v ? `Пополнение счета ${userData.userNickname} на сумму ${fmtRub(parseFloat(v))}` : `Пополнение счета ${userData.userNickname}`; };
  amt.oninput = apply; apply();
}

/* ==================== ОПЕРАЦИИ ==================== */
function addTransaction(tx){
  if (!userData) return;
  if (!userData.transactions) userData.transactions = [];
  userData.transactions.unshift(tx);
}

$('#submitWithdrawalBtn')?.addEventListener('click', () => {
  if (!userData) return;
  if (userData.accountFrozen){ showAlert('Счет заморожен. Операции недоступны.','warning'); return; }
  const amount = parseFloat($('#withdrawalAmount').value);
  const fullName = $('#withdrawalFullName').value.trim();
  const phone = $('#withdrawalPhone').value.trim();
  const bank = $('#withdrawalBank').value;
  const card = $('#withdrawalCard').value.trim();
  if (!amount || amount < 1000){ showAlert('Минимальная сумма вывода: 1 000 ₽','warning'); return; }
  if (amount > userData.balanceRub){ showAlert('Недостаточно средств','warning'); return; }
  if (!fullName || !phone || !bank || !card){ showAlert('Заполните все поля','warning'); return; }
  showModal('Подтверждение вывода', `Заявка на ${fmtRub(amount)} будет обработана от 24 часов до 3 суток.`, 'info',
    `<div class="row"><span class="lbl">Сумма:</span><span class="val">${fmtRub(amount)}</span></div><div class="row"><span class="lbl">Банк:</span><span class="val">${bankNames[bank]||bank}</span></div><div class="row"><span class="lbl">Срок:</span><span class="val">24ч – 3 суток</span></div>`,
    () => {
      const now = Date.now();
      userData.withdrawalRequests.unshift({ id: now, amount, fullName, phone, bank, bankName: bankNames[bank]||bank, card, createdAt: now, deadline: now + 72*60*60*1000, date: formatDateTime(now), status:'pending' });
      addTransaction({ id: now+1, type:'Заявка на вывод', amount, rub: amount, status:'progress', cls:'out', desc:`${bankNames[bank]||bank} · ${card.slice(-4).padStart(card.length,'*')}`, date: now });
      saveUserData();
      ['withdrawalAmount','withdrawalFullName','withdrawalPhone','withdrawalCard'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      showToast('Заявка создана. Срок зачисления: 24ч – 3 суток.','success','Заявка принята',6000);
      showPage('withdrawalRequests');
    });
});

$('#submitDepositBtn')?.addEventListener('click', () => {
  if (!userData) return;
  if (userData.accountFrozen){ showAlert('Счет заморожен','warning'); return; }
  const amount = parseFloat($('#depositAmount').value);
  const fullName = $('#depositFullName').value.trim();
  const phone = $('#depositPhone').value.trim();
  const bank = $('#depositBank').value;
  const card = $('#depositCard').value.trim();
  if (!amount || amount < 1000){ showAlert('Минимум 1 000 ₽','warning'); return; }
  if (!fullName || !phone || !bank || !card){ showAlert('Заполните все поля','warning'); return; }
  showModal('Подтверждение пополнения', `Пополнить на ${fmtRub(amount)}?`, 'info',
    `<div class="row"><span class="lbl">Сумма:</span><span class="val">${fmtRub(amount)}</span></div><div class="row"><span class="lbl">Банк:</span><span class="val">${bankNames[bank]||bank}</span></div>`,
    () => {
      userData.balanceRub += amount;
      addTransaction({ id: Date.now(), type:'Пополнение картой', amount, rub: amount, status:'ok', cls:'in', desc:`${bankNames[bank]||bank} · ${card.slice(-4).padStart(card.length,'*')}`, date: Date.now() });
      saveUserData();
      updateBalanceDisplay();
      ['depositAmount','depositFullName','depositPhone','depositCard'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      showToast('Заявка на пополнение создана','success');
      showPage('dashboard');
    });
});

/* ==================== ПЕРЕВОДЫ ==================== */
const transferAmount = $('#transferAmount');
transferAmount?.addEventListener('input', () => { const a = parseFloat(transferAmount.value) || 0; const f = a * 0.005; $('#transferFee').value = fmtRub(f); $('#transferTotal').value = fmtRub(a + f); });
$('#submitTransferBtn')?.addEventListener('click', () => {
  if (!userData) return;
  if (userData.accountFrozen){ showAlert('Счет заморожен','warning'); return; }
  const sid = $('#transferSecretId').value.trim();
  const amount = parseFloat($('#transferAmount').value || '0');
  const fee = amount * 0.005;
  const total = amount + fee;
  if (!sid || !amount || amount <= 0){ showToast('Введите ID и сумму','warning'); return; }
  if (total > userData.balanceRub){ showToast('Недостаточно средств','error'); return; }
  showModal('Подтверждение перевода','Введите код 2FA для подтверждения','info',
    `<div class="row"><span class="lbl">Получатель:</span><span class="val">${escapeHtml(sid)}</span></div><div class="row"><span class="lbl">Сумма:</span><span class="val">${fmtRub(amount)}</span></div><div class="row"><span class="lbl">Комиссия:</span><span class="val">${fmtRub(fee)}</span></div><div class="row"><span class="lbl">Итого:</span><span class="val">${fmtRub(total)}</span></div><div style="margin-top:14px"><div style="font-size:12px;color:var(--text-2);margin-bottom:6px;text-align:left">Код 2FA</div><input type="password" id="transfer2FA" placeholder="••••••" autocomplete="one-time-code"></div>`,
    () => {
      const code = document.getElementById('transfer2FA')?.value.trim();
      if (code !== currentUser.twoFa){ showToast('Неверный код 2FA','error'); return; }
      userData.balanceRub -= total;
      addTransaction({ id: Date.now(), type:'Внутренний перевод', amount, rub: amount, status:'ok', cls:'out', desc:`Получатель ${sid}`, date: Date.now() });
      saveUserData();
      updateBalanceDisplay();
      ['transferSecretId','transferAmount','transferFee','transferTotal'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      showToast(`Перевод ${fmtRub(amount)} выполнен`,'success');
      showPage('dashboard');
    });
});

/* ==================== ОБМЕН ==================== */
const swapAmount = $('#swapAmount');
swapAmount?.addEventListener('input', () => {
  const v = parseFloat(swapAmount.value) || 0;
  const rates = {'BTC-ETH':16.5,'BTC-USDT':65000,'ETH-BTC':0.06,'ETH-USDT':3500,'USDT-BTC':1/65000,'USDT-ETH':1/3500};
  const key = `${$('#swapFromCurrency').value}-${$('#swapToCurrency').value}`;
  const r = rates[key] || 1;
  $('#swapResult').value = (v * r).toLocaleString('ru-RU',{maximumFractionDigits:8});
});
$('#swapFromCurrency')?.addEventListener('change', () => swapAmount?.dispatchEvent(new Event('input')));
$('#swapToCurrency')?.addEventListener('change', () => swapAmount?.dispatchEvent(new Event('input')));
$('#submitSwapBtn')?.addEventListener('click', () => {
  const v = parseFloat($('#swapAmount').value || '0');
  if (!v){ showToast('Введите сумму','warning'); return; }
  const from = $('#swapFromCurrency').value, to = $('#swapToCurrency').value;
  addTransaction({ id: Date.now(), type:`Обмен ${from} → ${to}`, amount: v, rub: v * (from === 'USDT' ? USD_RATE : 1), status:'ok', cls:'swap', desc:`${v} ${from} → ${to}`, date: Date.now() });
  saveUserData();
  showToast('Обмен выполнен','success');
  $('#swapAmount').value = ''; $('#swapResult').value = '';
});

/* ==================== ПОДДЕРЖКА ==================== */
window.showSupportCategory = function(cat){
  const map = {deposit:'Пополнение', withdrawal:'Вывод', security:'Безопасность', other:'Другое'};
  const sel = $('#supportCategory'); if (sel) sel.value = cat;
  const top = $('#supportTopic'); if (top){ top.value = `Проблема с ${map[cat]||'сервисом'}`; top.focus(); }
};
window.toggleFaqItem = function(el){ el.classList.toggle('open'); };
$('#clearSupportBtn')?.addEventListener('click', () => { $('#supportTopic').value = ''; $('#supportMessage').value = ''; $('#supportCategory').value = ''; });
$('#submitSupportTicketBtn')?.addEventListener('click', () => {
  const topic = $('#supportTopic').value.trim(), msg = $('#supportMessage').value.trim(), cat = $('#supportCategory').value;
  if (!topic || !msg){ showToast('Заполните тему и описание','warning'); return; }
  if (!cat){ showToast('Выберите категорию','warning'); return; }
  showToast(`Обращение #${Math.floor(Math.random()*10000)} создано`,'success','Обращение создано',6000);
  $('#supportTopic').value = ''; $('#supportMessage').value = ''; $('#supportCategory').value = '';
});

/* ==================== ЗАЯВКИ ==================== */
const HOUR_MS = 60*60*1000;
function getRequestStatus(r){
  const now = Date.now();
  if (r.status === 'cancelled' || r.status === 'completed') return r.status;
  const start = r.createdAt || now;
  const elapsed = now - start;
  if (elapsed >= 72*HOUR_MS) return 'completed';
  if (elapsed >= 24*HOUR_MS) return 'progress';
  return 'pending';
}
function fmtDuration(ms){
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms/1000);
  const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600), m = Math.floor((s%3600)/60), sec = s%60;
  const p = n => String(n).padStart(2,'0');
  if (d > 0) return `${d}д ${p(h)}:${p(m)}:${p(sec)}`;
  return `${p(h)}:${p(m)}:${p(sec)}`;
}
function timerHTML(r){
  const status = getRequestStatus(r);
  const elapsed = Date.now() - (r.createdAt || Date.now());
  const iconClock = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  if (status === 'pending'){ const left = 24*HOUR_MS - elapsed; return `<div class="req-timer">${iconClock}До перехода в обработку: <b data-countdown="${left}">${fmtDuration(left)}</b></div>`; }
  if (status === 'progress'){ const left = 72*HOUR_MS - elapsed; return `<div class="req-timer">${iconClock}Ожидаемое зачисление через: <b data-countdown="${left}">${fmtDuration(left)}</b></div>`; }
  if (status === 'completed'){ return `<div class="req-timer done">${iconClock}Средства успешно зачислены на вашу карту</div>`; }
  return '';
}
function requestCardHTML(r, actions=false){
  const status = getRequestStatus(r);
  const map = { pending:['pending','В обработке'], progress:['progress','Средства в пути'], completed:['completed','Зачислено'], cancelled:['cancelled','Отменена'] };
  const [cls, text] = map[status] || map.pending;
  return `<div class="req-item"><div class="req-item-head"><div class="req-item-id">Заявка №${r.id}</div><div class="req-item-status ${cls}">${text}</div></div><div class="req-item-amount"><div class="req-item-amount-label">Сумма вывода</div><div class="req-item-amount-value">${fmtRub(r.amount)}</div></div><div class="req-item-grid"><div class="req-item-cell"><span class="req-item-cell-label">Получатель</span><span class="req-item-cell-value">${escapeHtml(r.fullName)}</span></div><div class="req-item-cell"><span class="req-item-cell-label">Телефон</span><span class="req-item-cell-value">${escapeHtml(r.phone)}</span></div><div class="req-item-cell"><span class="req-item-cell-label">Банк</span><span class="req-item-cell-value">${escapeHtml(r.bankName)}</span></div><div class="req-item-cell"><span class="req-item-cell-label">Карта</span><span class="req-item-cell-value">${escapeHtml(r.card)}</span></div></div>${timerHTML(r)}<div class="req-item-foot">Создано: ${r.date}</div>${actions && status !== 'completed' && status !== 'cancelled' ? `<div class="req-item-actions"><button class="btn btn-sm btn-danger" onclick="cancelRequest(${r.id})">Отменить</button><button class="btn btn-sm btn-primary" onclick="approveRequest(${r.id})">Одобрить</button></div>` : ''}</div>`;
}
function tickTimers(){
  $$('[data-countdown]').forEach(el => { let left = parseInt(el.getAttribute('data-countdown'), 10) - 1000; if (left < 0) left = 0; el.setAttribute('data-countdown', left); el.textContent = fmtDuration(left); });
}
setInterval(tickTimers, 1000);
function renderWithdrawalRequests(){
  if (!userData) return;
  const c = $('#withdrawalRequestsList'); if (!c) return;
  if (!userData.withdrawalRequests.length){ c.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Заявок пока нет</div>`; return; }
  c.innerHTML = userData.withdrawalRequests.map(r => requestCardHTML(r, false)).join('');
}

/* ==================== АДМИН: ПОЛЬЗОВАТЕЛИ ==================== */
function getAllUsers(){
  const users = [];
  Object.keys(USERS).forEach(login => {
    if (USERS[login].role === 'admin') return;
    const key = 'nebula_user_' + login;
    const data = JSON.parse(localStorage.getItem(key) || 'null') || initUserData(login);
    users.push({ login, ...USERS[login], data });
  });
  return users;
}
function renderAdminUsers(){
  const c = $('#adminUsersList'); if (!c) return;
  const qv = ($('#adminUserSearch')?.value || '').trim().toLowerCase();
  const users = getAllUsers().filter(u => !qv || (u.name + ' ' + u.login).toLowerCase().includes(qv));
  if (!users.length){ c.innerHTML = `<div class="empty">Пользователей пока нет</div>`; return; }
  c.innerHTML = users.map(u => {
    const activeReqs = u.data.withdrawalRequests.filter(r => { const s = getRequestStatus(r); return s === 'pending' || s === 'progress'; }).length;
    const frozen = u.data.accountFrozen;
    const initials = (u.name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    const refEarned = (u.data.referrals || []).reduce((s,r)=>s+r.earned,0);
    return `<div class="req-item" style="margin-bottom:16px">
      <div class="req-item-head">
        <div style="display:flex;align-items:center;gap:12px"><div class="sb-avatar" style="width:46px;height:46px;font-size:15px">${initials}</div><div><div class="req-item-id">${escapeHtml(u.name)}</div><div style="font-size:12px;color:var(--text-2);font-family:var(--mono);margin-top:3px">@${escapeHtml(u.login)}</div></div></div>
        <div class="req-item-status ${frozen ? 'cancelled' : 'completed'}">${frozen ? 'Заморожен' : 'Активен'}</div>
      </div>
      <div class="req-item-grid">
        <div class="req-item-cell"><span class="req-item-cell-label">Баланс</span><span class="req-item-cell-value" style="font-size:16px;color:var(--accent)">${fmtRub(u.data.balanceRub)}<small style="display:block;color:var(--text-3);font-size:11px;font-family:var(--mono);font-weight:500;margin-top:3px">≈ ${fmtUsd(u.data.balanceRub/USD_RATE)}</small></span></div>
        <div class="req-item-cell"><span class="req-item-cell-label">Никнейм</span><span class="req-item-cell-value">${escapeHtml(u.data.userNickname || u.nickname)}</span></div>
        <div class="req-item-cell"><span class="req-item-cell-label">Секретный ID</span><span class="req-item-cell-value">${escapeHtml(u.data.secretId || '—')}</span></div>
        <div class="req-item-cell"><span class="req-item-cell-label">Реферальный доход</span><span class="req-item-cell-value">${fmtRubShort(refEarned)}</span></div>
        <div class="req-item-cell"><span class="req-item-cell-label">Транзакций</span><span class="req-item-cell-value">${(u.data.transactions||[]).length}</span></div>
        <div class="req-item-cell"><span class="req-item-cell-label">Заявок</span><span class="req-item-cell-value">${u.data.withdrawalRequests.length}${activeReqs ? ` · ${activeReqs} активн.` : ''}</span></div>
      </div>
      <div class="req-item-actions">
        <button class="btn btn-sm btn-primary" onclick="openAdminBalance('${escapeHtml(u.login)}')">Управление</button>
        <button class="btn btn-sm" onclick="adminResetUser('${escapeHtml(u.login)}')">Сбросить данные</button>${u.extra ? `<button class="btn btn-sm btn-danger" onclick="adminDeleteUser('${escapeHtml(u.login)}')">Удалить</button>` : ''}
      </div>
    </div>`;
  }).join('');
}
window.openAdminBalance = function(login){
  adminSelectedLogin = login;
  const key = 'nebula_user_' + login;
  const data = JSON.parse(localStorage.getItem(key) || 'null') || initUserData(login);
  $('#adminSelectedUser').value = `${USERS[login].name} (@${login})`;
  $('#adminUserBalance').value = fmtBoth(data.balanceRub);
  $('#adminBalanceSubtitle').textContent = `Управление балансом: ${USERS[login].name}`;
  const s = $('#adminFrozenStatus'), t = $('#adminFreezeToggle');
  if (s){ s.textContent = data.accountFrozen ? 'Заморожен' : 'Активен'; s.style.color = data.accountFrozen ? 'var(--danger)' : 'var(--accent)'; }
  if (t) t.classList.toggle('active', data.accountFrozen);
  renderAdminUserRequests(data);
  showPage('adminBalance');
};
function renderAdminUserRequests(data){
  const c = $('#adminUserRequestsList'); if (!c) return;
  if (!data.withdrawalRequests.length){ c.innerHTML = `<div class="empty">Заявок нет</div>`; return; }
  c.innerHTML = data.withdrawalRequests.map(r => requestCardHTML(r, true)).join('');
}
document.addEventListener('click', e => {
  if (e.target.id === 'adminFreezeToggle' && adminSelectedLogin){
    const key = 'nebula_user_' + adminSelectedLogin;
    const data = JSON.parse(localStorage.getItem(key) || 'null') || initUserData(adminSelectedLogin);
    data.accountFrozen = !data.accountFrozen;
    saveAnyUser(adminSelectedLogin, data);
    const s = $('#adminFrozenStatus');
    s.textContent = data.accountFrozen ? 'Заморожен' : 'Активен';
    s.style.color = data.accountFrozen ? 'var(--danger)' : 'var(--accent)';
    e.target.classList.toggle('active', data.accountFrozen);
    showToast(data.accountFrozen ? 'Пользователь заморожен' : 'Пользователь разморожен', 'success');
    renderAdminUsers();
  }
});
$('#submitAdminBalanceBtn')?.addEventListener('click', () => {
  if (!adminSelectedLogin){ showAlert('Пользователь не выбран','warning'); return; }
  const key = 'nebula_user_' + adminSelectedLogin;
  const data = JSON.parse(localStorage.getItem(key) || 'null') || initUserData(adminSelectedLogin);
  const action = $('#adminBalanceAction').value;
  const amount = parseFloat($('#adminBalanceAmount').value);
  if (!amount || amount <= 0){ showAlert('Введите сумму','warning'); return; }
  let nb = data.balanceRub, txt = '';
  if (action === 'set'){ nb = amount; txt = `установить ${fmtRub(amount)}`; }
  if (action === 'add'){ nb = data.balanceRub + amount; txt = `добавить ${fmtRub(amount)}`; }
  if (action === 'subtract'){ nb = data.balanceRub - amount; txt = `вычесть ${fmtRub(amount)}`; }
  if (nb < 0){ showAlert('Баланс не может быть отрицательным','warning'); return; }
  showModal('Изменение баланса', `Вы уверены, что хотите ${txt} для ${USERS[adminSelectedLogin].name}?`, 'warning',
    `<div class="row"><span class="lbl">Текущий:</span><span class="val">${fmtRub(data.balanceRub)}</span></div><div class="row"><span class="lbl">Новый:</span><span class="val">${fmtRub(nb)}</span></div>`,
    () => {
      data.balanceRub = nb;
      saveAnyUser(adminSelectedLogin, data);
      $('#adminUserBalance').value = fmtBoth(nb);
      $('#adminBalanceAmount').value = '';
      showToast('Баланс обновлён','success');
      renderAdminUsers();
    });
});
window.adminResetUser = function(login){
  showModal('Сбросить данные пользователя?', `Все заявки, чат и настройки ${USERS[login].name} будут удалены. Баланс вернётся к исходному.`, 'warning', null,
    () => {
      localStorage.removeItem('nebula_user_' + login);
      initUserData(login);
      renderAdminUsers();
      showToast('Данные пользователя сброшены','success');
    });
};
window.approveRequest = function(id){
  if (!adminSelectedLogin) return;
  const key = 'nebula_user_' + adminSelectedLogin;
  const data = JSON.parse(localStorage.getItem(key) || 'null') || initUserData(adminSelectedLogin);
  const idx = data.withdrawalRequests.findIndex(r => r.id === id);
  if (idx === -1) return;
  const req = data.withdrawalRequests[idx];
  showModal('Одобрение заявки', `Подтвердить вывод ${fmtRub(req.amount)}?`, 'warning', null,
    () => {
      if (data.balanceRub < req.amount){ showToast('Недостаточно средств','error'); return; }
      data.balanceRub -= req.amount;
      data.withdrawalRequests[idx].status = 'completed';
      saveAnyUser(adminSelectedLogin, data);
      $('#adminUserBalance').value = fmtBoth(data.balanceRub);
      renderAdminUserRequests(data);
      renderAdminUsers();
      showToast('Заявка одобрена, средства списаны','success');
    });
};
window.cancelRequest = function(id){
  if (!adminSelectedLogin) return;
  const key = 'nebula_user_' + adminSelectedLogin;
  const data = JSON.parse(localStorage.getItem(key) || 'null') || initUserData(adminSelectedLogin);
  showModal('Отмена заявки','Вы уверены?','warning',null,
    () => {
      data.withdrawalRequests = data.withdrawalRequests.map(r => r.id === id ? {...r, status:'cancelled'} : r);
      saveAnyUser(adminSelectedLogin, data);
      renderAdminUserRequests(data);
      renderAdminUsers();
      showToast('Заявка отменена','success');
    });
};
function renderAdminRequests(target = 'adminRequestsList', onlyActive = false){
  const c = $('#' + target); if (!c) return;
  const users = getAllUsers();
  const allReqs = [];
  users.forEach(u => u.data.withdrawalRequests.forEach(r => allReqs.push({ ...r, _user: u })));
  allReqs.sort((a,b) => b.id - a.id);
  if (onlyActive){ for (let i = allReqs.length - 1; i >= 0; i--) if (!['pending','progress'].includes(getRequestStatus(allReqs[i]))) allReqs.splice(i, 1); allReqs.splice(5); }
  if (!allReqs.length){ c.innerHTML = `<div class="empty">Нет заявок</div>`; return; }
  c.innerHTML = allReqs.map(r => {
    const u = r._user;
    const status = getRequestStatus(r);
    const map = { pending:['pending','В обработке'], progress:['progress','Средства в пути'], completed:['completed','Зачислено'], cancelled:['cancelled','Отменена'] };
    const [cls, text] = map[status] || map.pending;
    return `<div class="req-item"><div class="req-item-head"><div><div class="req-item-id">Заявка №${r.id}</div><div style="font-size:12px;color:var(--text-2);margin-top:4px">От: <strong>${escapeHtml(u.name)}</strong> (@${escapeHtml(u.login)})</div></div><div class="req-item-status ${cls}">${text}</div></div><div class="req-item-amount"><div class="req-item-amount-label">Сумма вывода</div><div class="req-item-amount-value">${fmtRub(r.amount)}</div></div><div class="req-item-grid"><div class="req-item-cell"><span class="req-item-cell-label">Получатель</span><span class="req-item-cell-value">${escapeHtml(r.fullName)}</span></div><div class="req-item-cell"><span class="req-item-cell-label">Телефон</span><span class="req-item-cell-value">${escapeHtml(r.phone)}</span></div><div class="req-item-cell"><span class="req-item-cell-label">Банк</span><span class="req-item-cell-value">${escapeHtml(r.bankName)}</span></div><div class="req-item-cell"><span class="req-item-cell-label">Карта</span><span class="req-item-cell-value">${escapeHtml(r.card)}</span></div></div><div class="req-item-foot">Создано: ${r.date}</div>${status !== 'completed' && status !== 'cancelled' ? `<div class="req-item-actions"><button class="btn btn-sm" onclick="openAdminBalance('${escapeHtml(u.login)}')">К пользователю</button></div>` : ''}</div>`;
  }).join('');
}

/* ==================== ПРОФИЛЬ / НАСТРОЙКИ ==================== */
$('#saveNicknameBtn')?.addEventListener('click', () => { if (!userData) return; const n = $('#profileNickname').value.trim(); if (n.length < 3){ showAlert('Никнейм минимум 3 символа','warning'); return; } userData.userNickname = n; saveUserData(); showToast('Никнейм сохранён','success'); });
$('#copySecretIdBtn')?.addEventListener('click', () => { const v = $('#secretIdValue')?.value || ''; if (v) copyToClipboard(v, $('#copySecretIdBtn')); });
$('#regenerateSecretIdBtn')?.addEventListener('click', () => { if (!userData) return; userData.secretId = 'DV-' + Math.random().toString(36).slice(2,7).toUpperCase(); saveUserData(); ensureSecretId(); showToast('ID изменён','success'); });
$('#addAddressBtn')?.addEventListener('click', () => {
  if (!userData) return;
  const l = $('#addressLabel').value.trim(), v = $('#addressValue').value.trim();
  if (!l || !v){ showAlert('Заполните все поля','warning'); return; }
  userData.addressBook.push({label:l, value:v});
  saveUserData();
  renderAddressBook();
  $('#addressLabel').value = ''; $('#addressValue').value = '';
  showToast('Адрес добавлен','success');
});
$('#submitKycBtn')?.addEventListener('click', () => { if (!userData) return; userData.kycStatus = 'На проверке'; saveUserData(); $('#kycStatus').value = 'На проверке'; showToast('Заявка на KYC отправлена','success'); });
$('#saveSettingsBtn')?.addEventListener('click', () => { if (!userData) return; saveUserData(); updateBalanceDisplay(); showToast('Настройки сохранены','success'); });
$('#copyReferralLinkBtn')?.addEventListener('click', () => { const el = $('#referralLink'); if (el && el.value) copyToClipboard(el.value, $('#copyReferralLinkBtn')); });
$('#changePasswordBtn')?.addEventListener('click', () => showToast('Смена пароля доступна в службе поддержки','info'));

(function(){
  const t = $('#twoFaToggle'), s = $('#twoFaStatus'); if (!t || !s) return;
  let enabled = localStorage.getItem('twoFaEnabled') === 'true';
  const upd = () => { s.textContent = enabled ? 'Включена' : 'Отключена'; s.style.color = enabled ? 'var(--accent)' : 'var(--text-2)'; t.classList.toggle('active', enabled); };
  upd();
  t.addEventListener('click', () => { enabled = !enabled; localStorage.setItem('twoFaEnabled', enabled); upd(); });
})();

/* ==================== УВЕДОМЛЕНИЯ ==================== */
$('#notificationBtn')?.addEventListener('click', () => {
  if (MODE === 'admin'){ const n = getAllUsers().reduce((s,u) => s + u.data.withdrawalRequests.filter(r => ['pending','progress'].includes(getRequestStatus(r))).length, 0); showToast(n ? `${n} заявок ожидают обработки` : 'Новых заявок нет', 'info', 'Уведомления', 5000); return; }
  if (!userData) return;
  const items = buildNotifications();
  userData.notifSeen = Date.now(); saveUserData(); updateNotifBadge();
  showModal('Уведомления', items.length ? 'Последние события по вашему счёту' : 'Новых уведомлений нет', 'info',
    items.length ? items.map(i => `<div class="row"><span class="lbl">${escapeHtml(i.t)}</span><span class="val">${escapeHtml(i.d)}</span></div>`).join('') : null);
});
function buildNotifications(){
  const d = userData, now = Date.now(), n = [], names = {pending:'В обработке', progress:'Средства в пути', completed:'Зачислено', cancelled:'Отменена'};
  (d.withdrawalRequests||[]).forEach(r => n.push({ ts:r.createdAt, t:'Вывод ' + fmtRubShort(r.amount), d:names[getRequestStatus(r)] || '' }));
  (d.transactions||[]).slice(0,5).forEach(t => n.push({ ts:t.date, t:t.type, d:(txSigned(t)<0?'−':t.cls==='swap'?'':'+') + fmtRubShort(t.rub||t.amount) + ' · ' + formatDateTime(t.date) }));
  (d.referrals||[]).filter(r => now - r.joinedAt < 14*864e5).forEach(r => n.push({ ts:r.joinedAt, t:'Новый реферал', d:`${r.name} (@${r.login})` }));
  if (localStorage.getItem('twoFaEnabled') !== 'true') n.push({ ts:0, t:'Включите 2FA', d:'Раздел «Безопасность»' });
  if ((d.kycStatus||'') !== 'Пройдена') n.push({ ts:0, t:'Верификация KYC', d:d.kycStatus || 'Не пройдена' });
  return n.sort((a,b) => b.ts - a.ts).slice(0,8);
}
function updateNotifBadge(){
  const b = $('#notificationBtn .badge'); if (!b || !userData || MODE === 'admin') return;
  const cnt = buildNotifications().filter(i => i.ts > (userData.notifSeen || 0)).length;
  b.style.display = cnt ? '' : 'none'; b.title = cnt ? cnt + ' новых' : '';
}


/* ==================== АВАТАР / ПРОФИЛЬ ==================== */
const initialsOf = n => (n || '?').split(/\s+/).map(w => w[0]).join('').slice(0,2).toUpperCase();
function paintAvatar(el){
  if (!el || !currentUser) return;
  const a = userData && userData.avatar;
  el.style.backgroundImage = a ? `url(${a})` : ''; el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center';
  el.textContent = a ? '' : (currentUser.role === 'admin' ? 'A' : initialsOf(currentUser.name));
}
function renderProfileHero(){
  if (!userData || !currentUser) return;
  const d = userData, set = (id, v) => { const e = $('#' + id); if (e) e.textContent = v; };
  if (!d.createdAt){ d.createdAt = (d.transactions || []).reduce((m,t) => Math.min(m, t.date), Date.now()); saveUserData(); }
  const tfa = localStorage.getItem('twoFaEnabled') === 'true', kyc = d.kycStatus || 'Не пройдена';
  set('pfName', currentUser.name); set('pfLogin', currentLogin); paintAvatar($('#pfAvatar'));
  const k = $('#pfKyc'); if (k){ k.textContent = 'KYC: ' + kyc.toLowerCase(); k.className = 'pf-chip ' + (kyc === 'Пройдена' ? 'ok' : kyc === 'На проверке' ? 'warn' : ''); }
  const t = $('#pf2fa'); if (t){ t.textContent = '2FA: ' + (tfa ? 'включена' : 'выключена'); t.className = 'pf-chip ' + (tfa ? 'ok' : ''); }
  const s = $('#pfState'); if (s){ s.textContent = d.accountFrozen ? 'Счёт заморожен' : 'Счёт активен'; s.className = 'pf-chip ' + (d.accountFrozen ? 'bad' : 'ok'); }
  set('pfBal', d.balanceHidden ? '••••••' : fmtRubShort(d.balanceRub));
  set('pfTx', (d.transactions || []).length); set('pfRef', (d.referrals || []).length);
  set('pfSince', new Date(d.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' }));
  set('pfLast', d.prevLogin ? formatDateTime(d.prevLogin) : 'Первый вход'); set('pfSecret', d.secretId || '—');
}
$('#pfAvatarBtn')?.addEventListener('click', () => $('#pfAvatarInput').click());
$('#pfAvatarInput')?.addEventListener('change', e => {
  const f = e.target.files[0]; if (!f || !userData) return;
  if (!f.type.startsWith('image/')){ showAlert('Выберите изображение', 'warning'); return; }
  const r = new FileReader();
  r.onload = () => { const img = new Image(); img.onload = () => {
    const S = 192, c = document.createElement('canvas'); c.width = c.height = S; const m = Math.min(img.width, img.height);
    c.getContext('2d').drawImage(img, (img.width - m)/2, (img.height - m)/2, m, m, 0, 0, S, S);
    userData.avatar = c.toDataURL('image/jpeg', .85); saveUserData(); paintAvatar($('#sidebarUserAvatar')); renderProfileHero(); showToast('Фото профиля обновлено', 'success');
  }; img.src = r.result; };
  r.readAsDataURL(f); e.target.value = '';
});
$('#pfAvatarRemove')?.addEventListener('click', () => { if (!userData || !userData.avatar) return; delete userData.avatar; saveUserData(); paintAvatar($('#sidebarUserAvatar')); renderProfileHero(); showToast('Фото удалено', 'success'); });

/* ==================== АДМИН: ОБЗОР / СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ ==================== */
function renderAdminOverview(){
  const c = $('#adminStats'); if (!c) return;
  const users = getAllUsers(), act = r => ['pending','progress'].includes(getRequestStatus(r));
  const reqs = users.flatMap(u => u.data.withdrawalRequests), total = users.reduce((s,u) => s + u.data.balanceRub, 0);
  const card = (cls, p, l, v) => `<div class="stat"><div class="stat-top"><div class="stat-ic ${cls}"><svg viewBox="0 0 24 24">${p}</svg></div></div><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`;
  c.innerHTML = card('blue','<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>','Пользователей',users.length)
    + card('green','<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>','Общий баланс (≈ ' + fmtUsd(total/USD_RATE) + ')',fmtRubShort(total))
    + card('amber','<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>','Заявок в обработке',reqs.filter(act).length)
    + card('red','<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>','Замороженных счетов',users.filter(u => u.data.accountFrozen).length);
  renderAdminRequests('adminOverviewRequests', true);
}
const rndStr = (n, al) => Array.from(crypto.getRandomValues(new Uint32Array(n)), x => al[x % al.length]).join('');
$('#adminUserSearch')?.addEventListener('input', () => renderAdminUsers());
$('#genCredsBtn')?.addEventListener('click', () => { $('#nuPass').value = rndStr(12, 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'); $('#nu2fa').value = rndStr(8, '0123456789'); });
$('#createUserBtn')?.addEventListener('click', () => {
  const name = $('#nuName').value.trim(), login = $('#nuLogin').value.trim().toLowerCase(), pass = $('#nuPass').value, tf = $('#nu2fa').value.trim();
  if (name.length < 2 || !/^[a-z0-9_.]{3,20}$/.test(login)){ showAlert('Укажите ФИО и логин: 3–20 символов (a–z, 0–9, _ .)', 'warning'); return; }
  if (USERS[login]){ showAlert('Такой логин уже существует', 'warning'); return; }
  if (pass.length < 6 || tf.length < 4){ showAlert('Пароль — от 6 символов, код 2FA — от 4', 'warning'); return; }
  const ex = JSON.parse(localStorage.getItem('nebula_extra_users') || '{}');
  ex[login] = { password: pass, twoFa: tf, role: 'user', name, nickname: login, extra: true };
  localStorage.setItem('nebula_extra_users', JSON.stringify(ex)); USERS[login] = ex[login];
  ['nuName','nuLogin','nuPass','nu2fa'].forEach(i => $('#' + i).value = '');
  renderAdminUsers();
  showModal('Пользователь создан', 'Передайте эти данные для входа на сайт кошелька.', 'info',
    `<div class="row"><span class="lbl">Логин:</span><span class="val">${escapeHtml(login)}</span></div><div class="row"><span class="lbl">Пароль:</span><span class="val">${escapeHtml(pass)}</span></div><div class="row"><span class="lbl">Код 2FA:</span><span class="val">${escapeHtml(tf)}</span></div>`);
});
window.adminDeleteUser = function(login){
  showModal('Удалить пользователя?', `Аккаунт @${login} и все его данные будут удалены.`, 'warning', null, () => {
    const ex = JSON.parse(localStorage.getItem('nebula_extra_users') || '{}'); delete ex[login];
    localStorage.setItem('nebula_extra_users', JSON.stringify(ex)); delete USERS[login]; localStorage.removeItem('nebula_user_' + login);
    renderAdminUsers(); renderAdminOverview(); showToast('Пользователь удалён', 'success');
  });
};

/* ==================== INIT ==================== */
function updateMonthNames(){
  const now = new Date();
  $$('[data-month-placeholder]').forEach(el => {
    const k = el.getAttribute('data-month-placeholder');
    if (k === 'currentMonth') el.textContent = `Этот месяц (${monthNames[now.getMonth()]})`;
    if (k === 'twoMonthsAgo') el.textContent = `2 месяца назад (${monthNames[(now.getMonth()-2+12)%12]})`;
  });
}
function checkAuth(){
  const login = localStorage.getItem(SK + 'login'), at = +localStorage.getItem(SK + 'at') || 0;
  if (localStorage.getItem(SK + 'in') === 'true' && roleOk(USERS[login]) && Date.now() - at < SESS_TTL){
    startSession(login);
    const last = localStorage.getItem(SK + 'page') || HOME;
    enterApp(/^admin/.test(last) === (MODE === 'admin') ? last : HOME);
  } else {
    ['in','login','at'].forEach(k => localStorage.removeItem(SK + k));
  }
}
(function initAll(){ initMenuGroups(); updateMonthNames(); checkAuth(); })();
if (!currentUser) setTimeout(() => ($('#loginUsername').value ? $('#loginPassword') : $('#loginUsername')).focus(), 80);
