
import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    console.log('📡 Socket.io initialized');

    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        // Join role-based rooms
        socket.on('join', (role) => {
            if (role) {
                socket.join(role);
                console.log(`👤 Client ${socket.id} joined room: ${role}`);
            }
        });

        // Join specific order room (for customers tracking their order)
        socket.on('join_order', (orderId) => {
            if (orderId) {
                socket.join(`order_${orderId}`);
                console.log(`📦 Client ${socket.id} joined order room: order_${orderId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initSocket first.');
    }
    return io;
};

// Helper: Emit to specific role
export const emitToRole = (role, event, data) => {
    if (io) {
        io.to(role).emit(event, data);
    }
};

// Helper: Emit to specific order room
export const emitToOrder = (orderId, event, data) => {
    if (io) {
        io.to(`order_${orderId}`).emit(event, data);
    }
};

// Helper: Emit to all connected clients
export const emitToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};
