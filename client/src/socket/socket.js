import { io } from 'socket.io-client';
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const socket = io(`${VITE_BACKEND_URL}`);

export default socket;