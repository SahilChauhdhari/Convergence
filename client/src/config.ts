const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = isLocal ? '' : 'https://convergence-xn4f.onrender.com';
export const SOCKET_URL = isLocal ? '/' : 'https://convergence-xn4f.onrender.com';