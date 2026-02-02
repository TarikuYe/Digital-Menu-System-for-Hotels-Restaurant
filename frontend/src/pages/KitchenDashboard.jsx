import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Timer,
    Users,
    ChefHat,
    Flame,
    Utensils,
    MoreVertical,
    ArrowRight,
    RefreshCw,
    Wind,
    ShieldCheck,
    AlertTriangle,
    History,
    Info,
    Activity,
    MessageSquare,
    LogOut,
    User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { kitchenAPI, foodsAPI } from '../services/api.js';
import { ORDER_STATUS } from '../utils/constants.js';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ChatSidebar from '../components/Waiter/ChatSidebar.jsx';

const KitchenDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ prepared_count: 0, avg_prep_time: 0 });
    const [peakHour, setPeakHour] = useState(null);
    const [kitchenLoad, setKitchenLoad] = useState('normal');
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const [activeFilter, setActiveFilter] = useState('all');
    const [inventory, setInventory] = useState([]);
    const [showLogModal, setShowLogModal] = useState(false);
    const [logType, setLogType] = useState('hygiene');

    const { socket, connected } = useSocket();

    const playNotificationSound = useCallback((priority = 'info') => {
        try {
            const soundUrl = priority === 'high'
                ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
                : 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';
            const audio = new Audio(soundUrl);
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play blocked'));
        } catch (e) {
            console.error('Audio failed');
        }
    }, []);

    const loadData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const [orderRes, statRes, foodRes] = await Promise.all([
                kitchenAPI.getOrders(),
                kitchenAPI.getStats(),
                foodsAPI.getAll()
            ]);
            setOrders(orderRes.data.orders);
            setStats(statRes.data.stats);
            setPeakHour(statRes.data.peak_hour);
            setKitchenLoad(statRes.data.kitchen_load);
            setInventory(foodRes.data.foods);

        } catch (error) {
            console.error('Error loading kitchen data:', error);
            // Don't show toast for background updates
            if (showLoading) toast.error('Failed to update kitchen feed');
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();

        if (socket) {
            const handleNewOrder = (data) => {
                toast.success(data.message || 'New order received!', {
                    icon: '🍳',
                    duration: 5000
                });
                playNotificationSound('info');
                loadData(false); // Background update
            };

            const handleStatusUpdate = (data) => {
                loadData(false); // Background update
            };

            const handleAlert = (data) => {
                toast(data.message, {
                    icon: '🚨',
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
                setNotifications(prev => [...prev, data]);
                playNotificationSound('high');
            };

            const handleNewChat = (data) => {
                if (data.sender_id === user?.id) return;
                if (!showChat) {
                    setNotifications(prev => [...prev, data]);
                    toast(`${data.sender_name}: ${data.message.slice(0, 30)}...`, { icon: '💬' });
                    playNotificationSound(data.priority === 'urgent' ? 'high' : 'info');
                }
            };

            socket.on('new_order', handleNewOrder);
            socket.on('order_status_updated', handleStatusUpdate);
            socket.on('staff_alert', handleAlert);
            socket.on('new_chat_message', handleNewChat);

            return () => {
                socket.off('new_order', handleNewOrder);
                socket.off('order_status_updated', handleStatusUpdate);
                socket.off('staff_alert', handleAlert);
                socket.off('new_chat_message', handleNewChat);
            };
        }
    }, [socket, loadData]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await kitchenAPI.updateStatus(orderId, { status: newStatus });
            toast.success(`Order marked as ${newStatus}`);
            // real-time update will be handled by socket event
        } catch (error) {
            toast.error('Status update failed');
        }
    };

    const handlePrepTimeUpdate = async (orderId, time) => {
        try {
            await kitchenAPI.updateStatus(orderId, { estimated_prep_time: time });
            toast.success(`ETC updated to ${time} mins`);
            loadData();
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const toggleInventory = async (foodId, currentAvailable) => {
        try {
            await kitchenAPI.updateInventory(foodId, { is_available: !currentAvailable });
            toast.success('Inventory updated');
            loadData();
        } catch (error) {
            toast.error('Stock update failed');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-gold bg-gold/10 border-gold/20';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark text-white p-4 md:p-8 font-sans overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto">
                {/* Header Section - Sticky for better control */}
                <header className="sticky top-0 z-[60] bg-brand-dark/80 backdrop-blur-xl -mx-4 md:-mx-8 px-4 md:px-8 py-6 mb-8 border-b border-white/5">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-display font-extrabold flex items-center gap-3">
                                <ChefHat className="text-gold" size={40} />
                                Kitchen <span className="text-gold">Display</span> System
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${connected ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                                    {connected ? 'Live Connection' : 'Disconnected'}
                                </span>
                                <p className="text-gray-500 font-medium uppercase tracking-[0.3em] text-[10px] flex items-center gap-2 border-l border-white/10 pl-3">
                                    <Flame size={12} className="text-red-500 animate-pulse" /> Live Culinary Operations
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                            <div className="glass-card flex items-center gap-4 px-6 py-3 border-l-4 border-gold bg-gold/5">
                                <Timer className="text-gold" size={24} />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Avg. Prep Time</p>
                                    <p className="text-xl font-black">{Math.round(stats.avg_prep_time || 0)} <span className="text-xs text-gray-400">min</span></p>
                                </div>
                            </div>
                            <div className="glass-card flex items-center gap-4 px-6 py-3 border-l-4 border-blue-500 bg-blue-500/5">
                                <Users className="text-blue-400" size={24} />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Workload</p>
                                    <p className="text-xl font-black uppercase">{kitchenLoad}</p>
                                </div>
                            </div>
                            <div className="glass-card hidden sm:flex items-center gap-4 px-6 py-3 border-l-4 border-purple-500 bg-purple-500/5">
                                <Activity className="text-purple-400" size={24} />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Peak Hour</p>
                                    <p className="text-xl font-black">{peakHour ? `${peakHour.peak_hour}:00` : '...'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowChat(true);
                                    setNotifications([]);
                                }}
                                className="glass-card flex items-center gap-4 px-6 py-3 border-l-4 border-gold bg-gold/5 relative group hover:bg-gold/10 transition-all"
                            >
                                <MessageSquare className="text-gold" size={24} />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Team Chat</p>
                                    <p className="text-xs font-bold uppercase">{notifications.length > 0 ? `${notifications.length} New` : 'Open Feed'}</p>
                                </div>
                                {notifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-bounce shadow-lg">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setShowLogModal(true)}
                                className="premium-button !py-3 !px-8 flex items-center gap-2 text-xs uppercase tracking-widest"
                            >
                                <ShieldCheck size={16} /> Compliance Log
                            </button>

                            {/* User Profile & Logout */}
                            <div className="flex items-center gap-4 pl-4 border-l border-white/5">
                                <div className="hidden md:flex flex-col items-end">
                                    <span className="text-xs font-black text-white leading-none mb-1">{user?.full_name}</span>
                                    <span className="text-[8px] font-black text-gold uppercase tracking-[0.2em]">{user?.role}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 group"
                                    title="Sign Out"
                                >
                                    <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>

                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {/* Active Orders Grid */}
                    <div className="xl:col-span-3 space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Active Preparation Pipeline
                            </h2>
                            <div className="flex gap-2">
                                {['all', 'pending', 'preparing', 'urgent'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all
                    ${activeFilter === filter ? 'bg-gold text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {orders
                                    .filter(o => activeFilter === 'all' || o.status === activeFilter || (activeFilter === 'urgent' && o.priority === 'urgent'))
                                    .map((order, index) => (
                                        <motion.div
                                            key={order.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={`glass-card overflow-hidden group border-t-4 
                    ${order.status === 'preparing' ? 'border-gold' : 'border-blue-500/30'}`}
                                        >
                                            {/* Order Card Header */}
                                            <div className="p-5 bg-white/2 border-b border-white/5 flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xl font-black font-display tracking-tighter">#{order.table_number || 'DEL'}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getPriorityColor(order.priority)}`}>
                                                            {order.priority}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 uppercase tracking-widest">
                                                        <Clock size={10} /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase text-gold leading-none">{order.status}</p>
                                                    <p className="text-[9px] text-gray-600 mt-1 uppercase truncate max-w-[80px]">{order.customer_name || 'Guest'}</p>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto">
                                                {order.items.map(item => (
                                                    <div key={item.id} className="flex gap-3">
                                                        <div className="text-gold font-black text-lg">x{item.quantity}</div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold leading-none mb-1">{item.food_name}</p>
                                                            {item.special_instructions && (
                                                                <div className="flex items-start gap-1 p-1.5 rounded-lg bg-red-500/5 border border-red-500/10">
                                                                    <AlertCircle size={10} className="text-red-500 mt-0.5 shrink-0" />
                                                                    <p className="text-[10px] text-red-300 italic">{item.special_instructions}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {order.special_instructions && (
                                                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[10px] text-blue-300 italic flex items-start gap-2">
                                                        <Info size={12} className="shrink-0" />
                                                        <span>Global Note: {order.special_instructions}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions Footer */}
                                            <div className="p-4 bg-black/20 border-t border-white/5 space-y-3">
                                                <div className="flex gap-2">
                                                    <select
                                                        onChange={(e) => handlePrepTimeUpdate(order.id, e.target.value)}
                                                        className="bg-brand-dark border border-white/10 rounded-lg text-[9px] font-black uppercase p-2 flex-1 text-center outline-none focus:border-gold"
                                                        value={order.estimated_prep_time || ""}
                                                    >
                                                        <option value="">Set ETC</option>
                                                        {[5, 10, 15, 20, 30, 45].map(m => <option key={m} value={m}>{m} MIN</option>)}
                                                    </select>

                                                    {order.status !== 'ready' && (
                                                        <div className="flex gap-2 flex-[2]">
                                                            <button
                                                                onClick={() => handleStatusUpdate(order.id, 'unavailable')}
                                                                className="p-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                                title="Cannot Prepare"
                                                            >
                                                                <AlertTriangle size={14} />
                                                            </button>

                                                            <button
                                                                onClick={() => handleStatusUpdate(order.id, order.status === 'pending' || order.status === 'confirmed' ? 'preparing' : 'ready')}
                                                                className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                                                            ${order.status === 'preparing' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-gold text-black shadow-lg shadow-gold/20'}`}
                                                            >
                                                                {order.status === 'preparing' ? <><CheckCircle2 size={14} /> Ready</> : <><RefreshCw size={14} /> Start</>}
                                                            </button>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                            </AnimatePresence>
                            {orders.length === 0 && (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-600">
                                    <Wind size={60} strokeWidth={1} className="mb-4 opacity-20" />
                                    <p className="font-display text-xl font-bold uppercase tracking-widest opacity-40">Kitchen Order Path Clear</p>
                                    <p className="text-xs uppercase tracking-tighter mt-2 font-black">All stations currently idle</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inventory & Sidebar */}
                    <div className="space-y-8">
                        <div className="glass-card flex flex-col h-full bg-brand-dark/50">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                    <Utensils size={14} /> Stock Alerts
                                </h3>
                                <p className="text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-black">LIVE</p>
                            </div>
                            <div className="p-4 space-y-3 overflow-y-auto max-h-[50vh]">
                                {inventory.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-white/2 border border-white/5 group hover:bg-white/5 transition-all">
                                        <div className="flex-1 min-w-0 mr-3">
                                            <p className={`text-xs font-bold truncate ${!item.is_available ? 'text-gray-600 line-through' : ''}`}>{item.name}</p>
                                            {item.is_low_stock && <p className="text-[8px] font-black uppercase text-red-500">Low Stock Alert</p>}
                                        </div>
                                        <button
                                            onClick={() => toggleInventory(item.id, item.is_available)}
                                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all
                      ${item.is_available ? 'bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-500' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
                                        >
                                            {item.is_available ? 'Stock Normal' : 'Out of Stock'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 mt-auto border-t border-white/5 bg-black/40">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Kitchen Reports</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-all">
                                            <AlertTriangle size={16} className="text-gold" />
                                            <span className="text-[8px] font-black uppercase">Report Delay</span>
                                        </button>
                                        <button className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-all">
                                            <Users size={16} className="text-blue-400" />
                                            <span className="text-[8px] font-black uppercase">Pantry Sync</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 border-l-4 border-blue-500 bg-blue-500/5">
                            <div className="flex items-center gap-3 mb-4">
                                <History className="text-blue-400" size={20} />
                                <h3 className="text-sm font-bold">Shift Log</h3>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed mb-4">
                                Shift started at 18:00. <br />
                                Head Chef: Mark S.
                            </p>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-white/5 mb-3">Recent Logs</div>
                            <div className="space-y-2 opacity-60">
                                <div className="flex justify-between text-[9px]">
                                    <span>Pantry Check</span>
                                    <span className="text-green-500 font-bold">Passed</span>
                                </div>
                                <div className="flex justify-between text-[9px]">
                                    <span>Cooler Temp</span>
                                    <span className="text-gold font-bold">4.2°C</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Log Modal */}
                <AnimatePresence>
                    {showLogModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                className="glass-card p-8 w-full max-w-md border-t-8 border-gold"
                            >
                                <h2 className="text-2xl font-bold font-display mb-2">Compliance Log</h2>
                                <p className="text-xs text-gray-400 mb-6">Log kitchen incidents or safety checks for administrative overview.</p>

                                <div className="space-y-4">
                                    <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 mb-4">
                                        {['hygiene', 'safety', 'incident'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setLogType(type)}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all
                        ${logType === type ? 'bg-gold text-black' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none h-32 text-sm"
                                        placeholder="Provide specific details about the check or incident..."
                                    />

                                    <div className="flex gap-4">
                                        <button onClick={() => setShowLogModal(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest hover:text-white text-gray-500">Cancel</button>
                                        <button
                                            onClick={() => {
                                                toast.success('Shift log recorded');
                                                setShowLogModal(false);
                                            }}
                                            className="flex-1 premium-button !rounded-xl !py-4 text-xs uppercase"
                                        >
                                            Submit Entry
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Sidebar */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200]">
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowChat(false)} />
                            <ChatSidebar
                                user={user}
                                onClose={() => {
                                    setShowChat(false);
                                    setNotifications([]);
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default KitchenDashboard;
