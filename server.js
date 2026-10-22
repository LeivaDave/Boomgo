'use strict';
// Servidor en línea de Boomgo. Sin dependencias: solo Node.js (versión 18 o más).
const http = require('http'), crypto = require('crypto'), fs = require('fs'), vm = require('vm'), path = require('path');
const PORT = process.env.PORT || 8080;
const MAX_ROOMS = +process.env.MAX_ROOMS || 40;
const CORE = fs.readFileSync(path.join(__dirname, 'gamecore.js'), 'utf8');
const ARENAS = ['classic', 'rock', 'ast', 'cryo', 'bh', 'mc'];
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const TICK = 1 / 60;
const pick = a => a[Math.floor(Math.random() * a.length)];

// ---------- WebSocket mínimo (RFC 6455) ----------
class Conn {
  constructor(socket) {
    this.s = socket; this.buf = Buffer.alloc(0); this.alive = true; this.room = null; this.slot = -1;
    this.count = 0; this.winStart = Date.now(); this.onmsg = null; this.onclose = null;
    socket.on('data', d => { this.buf = Buffer.concat([this.buf, d]); this.parse(); });
    socket.on('close', () => this.close()); socket.on('error', () => this.close());
  }
  parse() {
    while (this.buf.length >= 2) {
      const b0 = this.buf[0], b1 = this.buf[1], op = b0 & 15, masked = (b1 & 128) !== 0;
      let len = b1 & 127, off = 2;
      if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (this.buf.length < 10) return; len = Number(this.buf.readBigUInt64BE(2)); off = 10; }
      if (len > 8192) { this.close(); return; }
      const need = off + (masked ? 4 : 0) + len;
      if (this.buf.length < need) return;
      let payload = Buffer.from(this.buf.slice(off + (masked ? 4 : 0), need));
      if (masked) { const m = this.buf.slice(off, off + 4); for (let i = 0; i < payload.length; i++) payload[i] ^= m[i & 3]; }
      this.buf = this.buf.slice(need);
      if (op === 8) { this.close(); return; }
      if (op === 9) { this.raw(10, payload); continue; }
      if (op === 1) {
        const now = Date.now();
        if (now - this.winStart > 1000) { this.winStart = now; this.count = 0; }
        if (++this.count > 80) { this.close(); return; }
        if (this.onmsg) this.onmsg(payload.toString('utf8'));
      }
    }
  }
  raw(op, payload) {
    if (!this.alive) return;
    const n = payload.length; let h;
    if (n < 126) h = Buffer.from([128 | op, n]);
    else if (n < 65536) { h = Buffer.alloc(4); h[0] = 128 | op; h[1] = 126; h.writeUInt16BE(n, 2); }
    else { h = Buffer.alloc(10); h[0] = 128 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); }
    try { this.s.write(Buffer.concat([h, payload])); } catch (e) { this.close(); }
  }
  send(o) { this.raw(1, Buffer.from(typeof o === 'string' ? o : JSON.stringify(o))); }
  close() { if (!this.alive) return; this.alive = false; try { this.s.destroy(); } catch (e) {} if (this.onclose) this.onclose(); }
}

// ---------- Mundo del juego (el mismo código del juego, sin pantalla) ----------
function makeCtx() {
  const P = () => new Proxy(function () {}, { get: (t, k) => k === 'naturalWidth' ? 100 : k === 'naturalHeight' ? 100 : k === 'dataset' ? {} : k === Symbol.toPrimitive ? () => 0 : k === 'length' ? 0 : P(), apply: () => P(), set: () => true, construct: () => P() });
  const el = () => ({ getContext: () => P(), querySelector: () => P(), classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, style: {}, addEventListener() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 132 }), firstChild: {}, click() {}, appendChild() {}, innerHTML: '', textContent: '', dataset: {} });
  const sandbox = {
    console, document: { getElementById: () => el(), createElement: () => el(), querySelectorAll: () => [], body: { classList: { contains: () => false, toggle() {} } }, documentElement: { style: { setProperty() {} } } },
    window: { devicePixelRatio: 1 }, innerWidth: 390, innerHeight: 800, performance: { now: () => Date.now() },
    addEventListener() {}, requestAnimationFrame() {}, setInterval() { return 0; }, setTimeout() { return 0; }, clearTimeout() {},
    Image: function () { return { naturalWidth: 0, naturalHeight: 0 }; }, URLSearchParams: URLSearchParams, location: { search: '' }, localStorage: { getItem: () => null, setItem() {} }
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(CORE, ctx, { timeout: 10000 });
  return ctx;
}

// ---------- Salas ----------
const rooms = new Map();
function newCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; for (;;) { let c = ''; for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)]; if (!rooms.has(c)) return c; } }

class Room {
  constructor(pub) { this.code = newCode(); this.pub = pub; this.players = [null, null, null, null]; this.host = null; this.state = 'lobby'; this.ctx = null; this.startAt = pub ? Date.now() + 30000 : 0; this.tickN = 0; rooms.set(this.code, this); }
  humans() { return this.players.filter(Boolean); }
  add(conn) {
    const slot = this.players.findIndex(p => !p); if (slot < 0) return false;
    this.players[slot] = conn; conn.room = this; conn.slot = slot; if (!this.host) this.host = conn;
    if (this.pub && this.humans().length >= 2) this.startAt = Math.min(this.startAt, Date.now() + 10000);
    this.info(); return true;
  }
  remove(conn) {
    const i = this.players.indexOf(conn); if (i < 0) return;
    this.players[i] = null; conn.room = null; conn.slot = -1;
    if (this.state === 'play' && this.ctx) { try { this.ctx.NET.leave(i); } catch (e) {} }
    if (this.host === conn) this.host = this.humans()[0] || null;
    if (!this.humans().length) { rooms.delete(this.code); this.ctx = null; return; }
    if (this.state === 'lobby') this.info();
  }
  info() {
    const p = []; this.players.forEach((c, s) => { if (c) p.push({ s }); });
    const cd = this.pub && this.state === 'lobby' ? Math.max(0, Math.ceil((this.startAt - Date.now()) / 1000)) : 0;
    this.players.forEach((c, s) => { if (c) c.send({ t: 'room', code: this.code, pub: this.pub ? 1 : 0, p, me: s, host: this.host ? this.host.slot : -1, cd }); });
  }
  begin() {
    if (this.state !== 'lobby') return;
    const hs = this.humans(); if (!hs.length) return;
    this.players = [null, null, null, null]; hs.forEach((c, i) => { this.players[i] = c; c.slot = i; });
    this.ctx = makeCtx(); const arena = pick(ARENAS);
    this.ctx.NET.start(arena, hs.length); this.state = 'play'; this.tickN = 0;
    this.players.forEach((c, i) => { if (c) c.send({ t: 'start', slot: i, arena, n: hs.length }); });
  }
  tick() {
    try { this.ctx.NET.tick(TICK); } catch (e) { console.error('tick error', e.message); return; }
    if (++this.tickN % 3 === 0) {
      let snap; try { snap = JSON.stringify(this.ctx.NET.snap()); } catch (e) { console.error('snap error', e.message); return; }
      this.players.forEach(c => { if (c) c.send(snap); });
    }
  }
}

function handle(conn, raw) {
  let m; try { m = JSON.parse(raw); } catch (e) { return; }
  if (!m || typeof m.t !== 'string') return;
  const r = conn.room;
  switch (m.t) {
    case 'quick': {
      if (r) return;
      let room = [...rooms.values()].find(x => x.pub && x.state === 'lobby' && x.humans().length < 4);
      if (!room) { if (rooms.size >= MAX_ROOMS) { conn.send({ t: 'err', m: 'Servidor lleno, intenta en un momento' }); return; } room = new Room(true); }
      room.add(conn); break;
    }
    case 'create': {
      if (r) return;
      if (rooms.size >= MAX_ROOMS) { conn.send({ t: 'err', m: 'Servidor lleno, intenta en un momento' }); return; }
      new Room(false).add(conn); break;
    }
    case 'join': {
      if (r) return;
      const room = rooms.get(String(m.code || '').toUpperCase());
      if (!room) { conn.send({ t: 'err', m: 'No existe esa sala' }); return; }
      if (room.state !== 'lobby') { conn.send({ t: 'err', m: 'Esa partida ya empezó' }); return; }
      if (!room.add(conn)) conn.send({ t: 'err', m: 'La sala está llena' });
      break;
    }
    case 'start': if (r && r.state === 'lobby' && r.host === conn) r.begin(); break;
    case 'in': if (r && r.state === 'play' && conn.slot >= 0) { try { r.ctx.NET.inp(conn.slot, m.x, m.y); } catch (e) {} } break;
    case 'act': if (r && r.state === 'play' && conn.slot >= 0 && ['b', 'z', 'd', 'pR', 'pI', 'aR', 'aI'].includes(m.a)) { try { r.ctx.NET.act(conn.slot, m.a); } catch (e) {} } break;
    case 'rematch': if (r && r.state === 'play') { try { r.ctx.NET.rematch(pick(ARENAS)); } catch (e) {} } break;
    case 'leave': if (r) r.remove(conn); break;
  }
}

// ---------- HTTP + WebSocket ----------
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' });
  res.end('Boomgo servidor OK\nsalas: ' + rooms.size + '\n');
});
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  socket.setNoDelay(true);
  const conn = new Conn(socket);
  conn.onmsg = raw => handle(conn, raw);
  conn.onclose = () => { if (conn.room) conn.room.remove(conn); };
  const ping = setInterval(() => { if (!conn.alive) clearInterval(ping); else conn.raw(9, Buffer.alloc(0)); }, 25000);
});

// reloj fijo a 60 pasos por segundo para todas las salas en juego
let last = Date.now(), acc = 0;
setInterval(() => {
  const now = Date.now(); acc = Math.min(0.25, acc + (now - last) / 1000); last = now;
  while (acc >= TICK) { acc -= TICK; for (const r of rooms.values()) if (r.state === 'play' && r.ctx) r.tick(); }
}, 8);
// salas públicas: arrancan solas con la cuenta regresiva
setInterval(() => {
  const now = Date.now();
  for (const r of rooms.values()) {
    if (r.state !== 'lobby' || !r.pub) continue;
    if (r.humans().length >= 4 || now >= r.startAt) r.begin(); else r.info();
  }
}, 1000);

server.listen(PORT, () => console.log('Boomgo servidor escuchando en el puerto ' + PORT));
