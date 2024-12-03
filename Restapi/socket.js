// socket.js
const socketIo = require("socket.io");

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.WS,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  // Listen for connection events
  io.on("connection", (socket) => {
     // console.log("New client connected");

    socket.on("updateStatus", (data) => {
       // console.log("data send");
      io.emit("statusUpdated", data);
    });

    socket.on("disconnect", () => {
       // console.log("Client disconnected");
    });
  });

  return io;
};

const getSocketInstance = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
};

module.exports = { initializeSocket, getSocketInstance };
