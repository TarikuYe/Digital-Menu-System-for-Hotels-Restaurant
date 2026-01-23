import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, Play, Flame, Bell, AlertTriangle, Check, User, Hash } from 'lucide-react';
import axios from 'axios';
import { ORDER_STATUS } from '../utils/constants.js';

const KitchenDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastOrderId, setLastOrderId] = useState(null);
    const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/kitchen/orders`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const kitchenOrders = response.data;

            if (kitchenOrders.length > 0) {
                const latestId = kitchenOrders[0].id;
                if (lastOrderId && latestId !== lastOrderId) {
                    playNotificationSound();
                    setShowNewOrderAlert(true);
                    setTimeout(() => setShowNewOrderAlert(false), 5000);
                }
                setLastOrderId(latestId);
            }

            setOrders(kitchenOrders);
        } catch (error) {
            console.error('Error loading kitchen orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const playNotificationSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
    };

    const handleStatusUpdate = async (orderId, currentStatus) => {
        const statusOrder = ['pending', 'confirmed', 'preparing', 'ready'];
        const currentIndex = statusOrder.indexOf(currentStatus);
        if (currentIndex < statusOrder.length - 1) {
            const nextStatus = statusOrder[currentIndex + 1];
            try {
                const token = localStorage.getItem('token');
                await axios.put(
                    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/kitchen/orders/${orderId}/status`,
                    { status: nextStatus },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                loadOrders();
            } catch (error) {
                console.error('Failed to update status:', error);
                alert('Failed to update status: ' + (error.response?.data?.error || error.message));
            }
        }
    };

    const getStatusActionLabel = (status) => {
        switch (status) {
            case 'pending': return 'CONFIRM';
            case 'confirmed': return 'START PREP';
            case 'preparing': return 'MARK READY';
            case 'ready': return 'MARK SERVED';
            default: return 'DONE';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-accent-amber border-accent-amber/20 bg-accent-amber/5';
            case 'confirmed': return 'text-gold border-gold/20 bg-gold/5';
            case 'preparing': return 'text-orange-500 border-orange-500/20 bg-orange-500/5';
            case 'ready': return 'text-accent-emerald border-accent-emerald/20 bg-accent-emerald/5';
            default: return 'text-gray-400 border-white/5 bg-white/5';
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark text-white p-6">
            {/* KDS Header */}
            <header className="flex justify-between items-center mb-10 bg-surface/50 backdrop-blur-md p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center text-accent-red">
                        <Flame size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold tracking-tight">Kitchen <span className="text-gold">Command</span></h1>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Live Order Stream</p>
                    </div>
                </div>

                <div className="flex gap-6 items-center">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] mb-1">Queue Status</p>
                        <div className="flex gap-3">
                            <span className="px-3 py-1 rounded-lg bg-white/5 text-xs font-bold border border-white/10">{orders.length} Active</span>
                            <span className="px-3 py-1 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-bold border border-orange-500/20">
                                {orders.filter(o => o.status === 'preparing').length} Cooking
                            </span>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-white/5" />
                    <button className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all relative">
                        <Bell size={20} className="text-gray-400" />
                        <span className="absolute top-3 right-3 w-2 h-2 bg-accent-red rounded-full ring-4 ring-brand-dark" />
                    </button>
                </div>
            </header>

            {/* New Order Alert Banner */}
            <AnimatePresence>
                {showNewOrderAlert && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, y: -20 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -20 }}
                        className="mb-8 overflow-hidden"
                    >
                        <div className="bg-gold p-4 rounded-2xl flex items-center justify-between shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                            <div className="flex items-center gap-4 text-brand-dark">
                                <div className="w-10 h-10 rounded-xl bg-brand-dark/20 flex items-center justify-center animate-bounce">
                                    <Bell size={20} className="fill-current" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tighter">New Order Incoming!</h3>
                                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">A guest has just placed a selective order.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNewOrderAlert(false)}
                                className="bg-brand-dark/10 hover:bg-brand-dark/20 p-2 rounded-xl transition-colors font-bold text-brand-dark"
                            >
                                DISMISS
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid of Order Tickets */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-96 rounded-[2.5rem] bg-white/5 animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                    <AnimatePresence mode="popLayout">
                        {orders.map((order, idx) => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: -100 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="glass-card flex flex-col min-h-[450px] shadow-2xl relative group"
                            >
                                {/* Visual Status Indicator (Glow) */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${order.status === 'preparing' ? 'bg-orange-500 shadow-[0_4px_20px_rgba(249,115,22,0.4)]' : order.status === 'ready' ? 'bg-accent-emerald shadow-[0_4px_20px_rgba(16,185,129,0.4)]' : 'bg-gold/40'}`} />

                                {/* Ticket Header */}
                                <div className="p-6 border-b border-white/5 bg-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Queue ID</span>
                                            <span className="text-xl font-bold font-display text-white">#{order.id.slice(0, 6)}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Table</span>
                                            <div className="flex items-center gap-2 bg-gold/10 text-gold px-3 py-1 rounded-xl border border-gold/20">
                                                <Hash size={14} className="font-extrabold" />
                                                <span className="text-lg font-bold">{order.table_number || '--'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-6">
                                        <div className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.2em] ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                            <Clock size={14} />
                                            <span>{Math.floor((new Date() - new Date(order.created_at)) / 60000)}m ago</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ticket Body (Items) */}
                                <div className="p-6 flex-1 space-y-4 max-h-[250px] overflow-y-auto no-scrollbar">
                                    {order.items?.map(item => (
                                        <div key={item.id} className="flex justify-between items-start group/item">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-surface-light border border-white/5 flex items-center justify-center font-extrabold text-gold text-sm">
                                                    {item.quantity}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white group-hover/item:text-gold transition-colors leading-tight">{item.food_name}</p>
                                                    {item.special_instructions && (
                                                        <p className="text-[10px] text-accent-red font-bold uppercase mt-1 flex items-center gap-1">
                                                            <AlertTriangle size={10} /> {item.special_instructions}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {order.special_instructions && (
                                        <div className="mt-4 p-4 rounded-2xl bg-accent-amber/5 border border-accent-amber/20 italic text-xs text-accent-amber/80 font-medium">
                                            Note: {order.special_instructions}
                                        </div>
                                    )}
                                </div>

                                {/* Ticket Footer (Actions) */}
                                <div className="p-6 bg-surface-dark border-t border-white/5">
                                    <button
                                        onClick={() => handleStatusUpdate(order.id, order.status)}
                                        className={`w-full !py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 group/btn
                      ${order.status === 'ready'
                                                ? 'bg-accent-emerald text-brand-dark font-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                                : 'bg-gold text-brand-dark font-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'}`}
                                    >
                                        <span className="text-[11px] uppercase tracking-[0.3em]">{getStatusActionLabel(order.status)}</span>
                                        <Play size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default KitchenDashboard;
