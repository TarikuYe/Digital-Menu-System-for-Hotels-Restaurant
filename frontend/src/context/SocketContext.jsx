
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
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('📡 Connected to server via socket');

            // Join user-specific rooms
            if (isAuthenticated && user) {
                if (user.role) newSocket.emit('join', user.role);
                if (user.id) newSocket.emit('join_user', user.id);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('🔌 Disconnected from socket server');
        });

        return () => newSocket.close();
    }, [isAuthenticated, user]);

    // Role-based room joining when auth state changes
    useEffect(() => {
        if (socket && isAuthenticated && user) {
            if (user.role) socket.emit('join', user.role);
            if (user.id) socket.emit('join_user', user.id);
        }
    }, [socket, isAuthenticated, user]);

    const value = {
        socket,
        connected: socket?.connected || false
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
