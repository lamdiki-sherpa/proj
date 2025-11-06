// realtime/socket.js
export function initSocket(io) {
  io.on('connection', (socket) => {
    // client should emit 'auth' right after connect with their userId
    socket.on('auth', ({ userId }) => {
      if (!userId) return;
      socket.join(String(userId)); // room per user
    });

    socket.on('disconnect', () => {});
  });
}
