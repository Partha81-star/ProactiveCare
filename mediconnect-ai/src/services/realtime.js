export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const VOICE_BASE_URL = import.meta.env.VITE_VOICE_BASE_URL || 'http://localhost:8001';

export function subscribeAppointments(refresh) {
  let socket;
  let reconnect;
  let closed = false;
  const connect = () => {
    const url = new URL(API_BASE_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws/appointments';
    socket = new WebSocket(url);
    socket.onmessage = (event) => {
      try {
        if (JSON.parse(event.data).event === 'refresh_appointments') refresh();
      } catch { /* Ignore malformed events; periodic refresh still updates the list. */ }
    };
    socket.onopen = refresh;
    socket.onclose = () => { if (!closed) reconnect = setTimeout(connect, 5000); };
    socket.onerror = () => socket.close();
  };
  connect();
  // Also updates across backend workers, which do not share websocket memory.
  const poll = setInterval(refresh, 15000);
  return () => { closed = true; clearTimeout(reconnect); clearInterval(poll); socket?.close(); };
}
