import { io } from "socket.io-client";

// Detectar el entorno y usar la URL correcta
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ||
    (import.meta.env.MODE === 'production'
        ? window.location.origin  // En producción, usar el mismo origen (nginx hace proxy)
        : "http://localhost:3000"); // En desarrollo, conectar directamente al servidor

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'], // Intentar WebSocket primero, luego polling
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});
