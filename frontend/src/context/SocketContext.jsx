
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        // Use proxy in dev, or absolute URL in prod
        const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

        console.log(`🔌 Attempting socket connection to: ${socketUrl}`);

        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000
        });

        newSocket.on('connect', () => {
            console.log('📡 Connected to server via socket', newSocket.id);
            setConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('🔌 Disconnected from socket server:', reason);
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
            setConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.off('connect');
            newSocket.off('disconnect');
            newSocket.off('connect_error');
            newSocket.close();
        };
    }, []);

    // Handle room joining when connected or auth state changes
    useEffect(() => {
        if (socket && connected && isAuthenticated && user) {
            console.log(`👤 Socket joining rooms for: ${user.role} (${user.id})`);
            if (user.role) socket.emit('join', user.role);
            if (user.id) socket.emit('join_user', user.id);
        }
    }, [socket, connected, isAuthenticated, user]);

    const value = {
        socket,
        connected
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
