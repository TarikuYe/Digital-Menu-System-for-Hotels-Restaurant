import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Send,
    ChefHat,
    Shield,
    Users,
    Info,
    AlertTriangle,
    Clock,
    MessageSquare,
    Bell,
    CheckCircle2
} from 'lucide-react';
import { communicationAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const ChatSidebar = ({ user, onClose }) => {
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [targetRole, setTargetRole] = useState(user?.role === 'kitchen' ? 'staff' : 'kitchen');
    const [priority, setPriority] = useState('info');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    const roles = [
        { id: 'kitchen', label: 'Kitchen', icon: <ChefHat size={14} />, color: 'text-orange-500' },
        { id: 'manager', label: 'Manager', icon: <Shield size={14} />, color: 'text-purple-500' },
        { id: 'staff', label: 'Waiters', icon: <Users size={14} />, color: 'text-blue-500' },
        { id: 'all', label: 'Broadcast', icon: <Bell size={14} />, color: 'text-gold' }
    ];

    const quickMessages = [
        "Order status please?",
        "86 check on Fish?",
        "Kitchen is backed up.",
        "Table needs water.",
        "Bill requested."
    ];

    useEffect(() => {
        loadMessages();

        if (socket) {
            const handleNewMessage = (msg) => {
                setMessages(prev => {
                    const exists = prev.some(m => m.id === msg.id);
                    if (exists) return prev;
                    return [...prev, msg];
                });
                scrollToBottom();
            };

            const handleStaffAlert = (alert) => {
                // Alerts are also messages in our new system
                setMessages(prev => [...prev, {
                    ...alert,
                    id: alert.id || `alert-${Math.random()}`,
                    is_alert: true,
                    created_at: new Date()
                }]);
                scrollToBottom();
            };

            socket.on('new_chat_message', handleNewMessage);
            socket.on('staff_alert', handleStaffAlert);

            return () => {
                socket.off('new_chat_message', handleNewMessage);
                socket.off('staff_alert', handleStaffAlert);
            };
        }
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            const res = await communicationAPI.getMessages();
            setMessages(res.data.messages);
        } catch (error) {
            console.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await communicationAPI.sendMessage({
                recipient_role: targetRole,
                message: newMessage,
                priority: priority,
                table_number: null // Optional: could be passed from parent
            });

            // The socket 'new_chat_message' handler will take care of adding this to the UI
            // for everyone, including the sender if they are in the target role room.
            // If the sender is NOT in the target room, we add it manually here but with a check.

            setMessages(prev => {
                const exists = prev.some(m => m.id === res.data.chatMessage.id);
                if (exists) return prev;
                return [...prev, res.data.chatMessage];
            });
            setNewMessage('');
            setPriority('info');
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const getMessageColor = (msg) => {
        if (msg.priority === 'urgent') return 'border-red-500 bg-red-500/10';
        if (msg.priority === 'warning') return 'border-orange-500 bg-orange-500/10';
        return 'border-white/5 bg-white/5';
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-md h-screen bg-brand-dark/95 backdrop-blur-2xl border-l border-white/10 z-[200] flex flex-col shadow-2xl"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-dark/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gold/10 text-gold">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-display font-bold">Team Communication</h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Internal Network Active</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Target Selection */}
            <div className="px-6 py-4 bg-white/2 border-b border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Target Department</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setTargetRole(role.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border whitespace-nowrap
                                ${targetRole === role.id
                                    ? 'bg-gold text-black border-gold'
                                    : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'}`}
                        >
                            {role.icon} {role.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar scroll-smooth"
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-600">
                        <Clock className="animate-spin" size={32} />
                        <p className="text-sm font-medium uppercase tracking-[0.2em]">Synchronizing...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-12 opacity-30">
                        <MessageSquare size={48} className="mb-4" />
                        <p className="text-sm">No messages yet. Start a conversation with the team.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <motion.div
                            key={msg.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-2xl border transition-all ${getMessageColor(msg)}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                                        {msg.sender_role || 'STAFF'}
                                    </span>
                                    <span className="text-xs font-bold text-white/80">{msg.sender_name}</span>
                                </div>
                                <span className="text-[9px] text-gray-500 font-medium">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                {msg.priority === 'urgent' && <AlertTriangle size={14} className="text-red-500 shrink-0 mt-1" />}
                                <p className="text-sm text-gray-300 font-light leading-relaxed">
                                    {msg.message}
                                </p>
                            </div>

                            {msg.table_number && (
                                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
                                    <span className="text-[9px] font-black bg-gold/10 text-gold px-2 py-0.5 rounded-full uppercase">Table {msg.table_number}</span>
                                </div>
                            )}

                            <div className="flex justify-end mt-2">
                                {msg.is_alert ? (
                                    <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1">
                                        <Bell size={8} /> System Alert
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-1 text-[8px] font-black text-gray-600 uppercase">
                                        To: {msg.recipient_role}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-3 bg-white/2 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
                {quickMessages.map(msg => (
                    <button
                        key={msg}
                        onClick={() => setNewMessage(msg)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400 hover:text-white hover:border-gold/30 whitespace-nowrap transition-all"
                    >
                        {msg}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-surface-dark border-t border-white/10">
                <form onSubmit={handleSendMessage} className="space-y-4">
                    <div className="flex gap-4 mb-2">
                        {['info', 'warning', 'urgent'].map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all
                                    ${priority === p
                                        ? (p === 'urgent' ? 'bg-red-500 text-white border-red-500' : p === 'warning' ? 'bg-orange-500 text-white border-orange-500' : 'bg-gold text-black border-gold')
                                        : 'bg-white/5 text-gray-500 border-transparent hover:text-white'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Message to ${targetRole}...`}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 pr-16 text-sm focus:border-gold outline-none h-24 resize-none transition-all placeholder:text-gray-600"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="absolute bottom-4 right-4 p-3 bg-gold text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default ChatSidebar;
