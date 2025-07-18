const { Server } = require("socket.io");

let io;

module.exports = {
    init: httpServer => {
        io = new Server(httpServer, {cors: {origin: "*"}});
        return io;
    },
    getIO: () => {
        if(!io) {
            const error = new Error("Socket.io not initialized");
            throw error;
        }
        return io;
    }
};