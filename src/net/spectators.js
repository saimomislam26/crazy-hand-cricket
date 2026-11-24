// Host-side relay: the host browser pushes match snapshots to any spectators (no server involved).
export function createSpectators() {
  const links = new Set();
  let last = null;
  let countCb = null;
  const notify = () => countCb && countCb(links.size);
  return {
    add(link) {
      links.add(link);
      link.onClose(() => { links.delete(link); notify(); });
      link.send(last || { type: 'snap', stage: 'lobby' });
      notify();
    },
    publish(snap) { last = snap; links.forEach((l) => l.send(snap)); },
    onCount(fn) { countCb = fn; fn(links.size); },
    closeAll() { links.forEach((l) => l.closeConn()); links.clear(); },
  };
}
