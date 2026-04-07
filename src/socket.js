import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Frontend socket conectado:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Frontend socket desconectado:', reason);
});

export default socket;