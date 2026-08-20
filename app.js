const $ = (selector) => document.querySelector(selector);
const settings = $('#settings');
const connectionButton = $('#connection');
const hint = $('#hint');
const volume = $('#volume');
const volumeValue = $('#volume-value');
const mute = $('#mute');
let socket;
let reconnectTimer;
let previousTouch;
let volumeTimer;

function savedUrl() { return localStorage.getItem('mediaRemoteUrl') || ''; }
function setStatus(connected, label) { connectionButton.classList.toggle('online', connected); connectionButton.querySelector('b').textContent = label; hint.textContent = connected ? 'Ansluten till din dator' : 'Tryck på statusen ovan för att ändra anslutningen.'; }
function send(message) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)); }
function connect() {
  const url = savedUrl();
  clearTimeout(reconnectTimer);
  if (!url) { setStatus(false, 'Ej inställd'); return; }
  setStatus(false, 'Ansluter…');
  try { socket = new WebSocket(url); } catch { setStatus(false, 'Ogiltig adress'); return; }
  socket.onopen = () => { setStatus(true, 'Ansluten'); send({ action: 'state' }); };
  socket.onmessage = ({ data }) => { const message = JSON.parse(data); if (message.type === 'state') { volume.value = message.volume; volumeValue.value = `${message.volume}%`; mute.classList.toggle('muted', message.muted); mute.querySelector('span').textContent = message.muted ? 'Tyst' : 'Ljud på'; } };
  socket.onclose = () => { setStatus(false, 'Ej ansluten'); reconnectTimer = setTimeout(connect, 2500); };
  socket.onerror = () => socket.close();
}

connectionButton.addEventListener('click', () => { $('#server-url').value = savedUrl(); settings.showModal(); });
$('#save-server').addEventListener('click', () => { const url = $('#server-url').value.trim(); if (url) { localStorage.setItem('mediaRemoteUrl', url); connect(); } });
document.querySelectorAll('[data-click]').forEach((button) => button.addEventListener('click', () => send({ action: 'click', button: button.dataset.click })));
document.querySelectorAll('[data-media]').forEach((button) => button.addEventListener('click', () => send({ action: 'media', key: button.dataset.media })));
$('#fullscreen').addEventListener('click', () => send({ action: 'fullscreen' }));
mute.addEventListener('click', () => send({ action: 'mute' }));
volume.addEventListener('input', () => { volumeValue.value = `${volume.value}%`; clearTimeout(volumeTimer); volumeTimer = setTimeout(() => send({ action: 'volume', value: Number(volume.value) }), 60); });
$('#touchpad').addEventListener('touchstart', (event) => { previousTouch = event.touches[0]; }, { passive: true });
$('#touchpad').addEventListener('touchmove', (event) => { const touch = event.touches[0]; if (!previousTouch) return; const dx = (touch.clientX - previousTouch.clientX) * 1.45; const dy = (touch.clientY - previousTouch.clientY) * 1.45; if (dx || dy) send({ action: 'move', dx, dy }); previousTouch = touch; }, { passive: true });
$('#touchpad').addEventListener('touchend', () => { previousTouch = undefined; });
connect();
