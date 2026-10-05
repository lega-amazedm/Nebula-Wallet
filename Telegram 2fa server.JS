// NebulaWallet: отправка кода входа в Telegram-бота. Node 18+, без зависимостей.
// Запуск: BOT_TOKEN=123:ABC CHAT_SAIDIK05=111111 CHAT_ADMIN=222222 ORIGIN=https://ваш-сайт node telegram-2fa-server.js
// 1) создайте бота в @BotFather, токен храните ТОЛЬКО в переменной окружения (не в HTML!)
// 2) напишите боту /start со своего аккаунта; chat_id смотрите в https://api.telegram.org/bot<TOKEN>/getUpdates
// 3) в nebulawallet.html поставьте window.NW_API='http://localhost:3000'
const http = require('http'), crypto = require('crypto');
const { BOT_TOKEN, PORT = 3000, ORIGIN = '*' } = process.env;
const CHATS = { saidik05: process.env.CHAT_SAIDIK05, admin: process.env.CHAT_ADMIN };
const store = new Map(); // user -> {hash, exp, tries, sent}
const sha = c => crypto.createHash('sha256').update(c).digest('hex');
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Headers': 'Content-Type' }); res.end(JSON.stringify(obj)); };
const tg = (chat, text) => fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' }) }).then(r => r.json());
 
http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  let raw = ''; req.on('data', d => { raw += d; if (raw.length > 2e3) req.destroy(); });
  req.on('end', async () => {
    let b = {}; try { b = JSON.parse(raw || '{}'); } catch { return send(res, 400, { ok: false }); }
    const user = String(b.user || '').toLowerCase(), rec = store.get(user);
    if (req.url === '/auth/send-code') {
      if (!CHATS[user] || !BOT_TOKEN) return send(res, 400, { ok: false, error: 'not_configured' });
      if (rec && Date.now() - rec.sent < 30e3) return send(res, 429, { ok: false, error: 'wait' });
      const code = String(crypto.randomInt(100000, 1000000));
      store.set(user, { hash: sha(code), exp: Date.now() + 5 * 60e3, tries: 0, sent: Date.now() });
      const r = await tg(CHATS[user], `🔐 <b>NebulaWallet</b>\nВаш код входа: <code>${code}</code>\nДействует 5 минут. Никому не сообщайте код.`).catch(() => ({}));
      return send(res, r.ok ? 200 : 502, { ok: !!r.ok });
    }
    if (req.url === '/auth/verify-code') {
      if (!rec || Date.now() > rec.exp || ++rec.tries > 5) { store.delete(user); return send(res, 401, { ok: false }); }
      const ok = crypto.timingSafeEqual(Buffer.from(sha(String(b.code || ''))), Buffer.from(rec.hash));
      if (ok) store.delete(user); // в продакшене здесь выдаётся сессия/JWT
      return send(res, ok ? 200 : 401, { ok });
    }
    send(res, 404, { ok: false });
  });
}).listen(PORT, () => console.log('2FA server on :' + PORT));
 