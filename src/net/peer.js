import Peer from 'peerjs';

const PREFIX = 'hand-cricket-game-';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = () => Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

// Wrap a data connection; buffers messages until a handler is attached.
function makeLink(peer, conn) {
  let handler = null;
  let closeHandler = null;
  const buffer = [];
  conn.on('data', (msg) => (handler ? handler(msg) : buffer.push(msg)));
  conn.on('close', () => closeHandler && closeHandler());
  conn.on('error', () => closeHandler && closeHandler());
  return {
    send: (msg) => { try { conn.open && conn.send(msg); } catch {} },
    setHandler(fn) {
      handler = fn;
      while (buffer.length) fn(buffer.shift());
    },
    onClose(fn) { closeHandler = fn; },
    closeConn() { try { conn.close(); } catch {} }, // close only this connection (peer stays up)
    close() { try { conn.close(); peer.destroy(); } catch {} }, // end everything
  };
}

export function hostRoom(onError, tries = 0) {
  const code = randomCode();
  const peer = new Peer(PREFIX + code);
  let connHandler = null;
  const early = [];
  const room = {
    code, peer,
    destroy: () => peer.destroy(),
    // Every incoming connection (the opponent AND spectators) is handed to this callback.
    setConnHandler(fn) { connHandler = fn; while (early.length) fn(early.shift()); },
  };
  const ready = new Promise((resolve, reject) => {
    peer.on('open', () => resolve(room));
    peer.on('error', (e) => {
      if (e.type === 'unavailable-id' && tries < 5) {
        peer.destroy();
        hostRoom(onError, tries + 1).then(resolve, reject);
      } else {
        onError && onError(e);
        reject(e);
      }
    });
  });
  peer.on('connection', (conn) => {
    conn.on('open', () => {
      const link = makeLink(peer, conn);
      connHandler ? connHandler(link) : early.push(link);
    });
  });
  return ready;
}

export function joinRoom(code) {
  return new Promise((resolve, reject) => {
    const peer = new Peer();
    const timer = setTimeout(() => { peer.destroy(); reject(new Error('timeout')); }, 12000);
    peer.on('error', (e) => { clearTimeout(timer); peer.destroy(); reject(e); });
    peer.on('open', () => {
      const conn = peer.connect(PREFIX + code.toUpperCase().trim(), { reliable: true });
      conn.on('open', () => { clearTimeout(timer); resolve(makeLink(peer, conn)); });
      conn.on('error', (e) => { clearTimeout(timer); reject(e); });
    });
  });
}
