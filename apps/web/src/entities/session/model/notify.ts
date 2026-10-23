export function notifySessionChange() {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel('spc-auth')
  channel.postMessage('changed')
  channel.close()
}
