import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Plus,
    Clock,
    ChefHat,
    MessageSquare,
    Receipt,
    DollarSign,
    Bell,
    Search,
    Filter,
    Utensils,
    X,
    Send,
    AlertTriangle,
    Info,
    Flame,
    Leaf,
    ShoppingCart,
    Eye,
    Check,
    Loader,
    TrendingUp,
    History,
    Star,
    MapPin,
    LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tablesAPI, ordersAPI, foodsAPI, menusAPI, communicationAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import ChatSidebar from '../components/Waiter/ChatSidebar';

const WaiterDashboard = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const { socket, connected } = useSocket();
    const [tables, setTables] = useState([]);
    const [orders, setOrders] = useState([]);
    const [menus, setMenus] = useState([]);
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('tables'); // tables, orders, newOrder
    const [selectedTable, setSelectedTable] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showFoodDetails, setShowFoodDetails] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showChat, setShowChat] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [stats, setStats] = useState({ ordersServed: 0, avgServiceTime: 0 });
    const [staffList, setStaffList] = useState([]);
    const [statusLoading, setStatusLoading] = useState(false);

    const playNotificationSound = useCallback((priority = 'info') => {
        try {
            const soundUrl = priority === 'high'
                ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' // Urgent alert
                : 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'; // Standard notification
            const audio = new Audio(soundUrl);
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play blocked by browser'));
        } catch (e) {
            console.error('Failed to play sound');
        }
    }, []);

    const loadData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const [tablesRes, ordersRes, menusRes, foodsRes, staffRes] = await Promise.all([
                tablesAPI.getAll(),
                ordersAPI.getAll(),
                menusAPI.getAll(),
                foodsAPI.getAll(),
                communicationAPI.getStaff()
            ]);
            setTables(tablesRes.data.tables);
            setOrders(ordersRes.data.orders);
            setMenus(menusRes.data.menus);
            setFoods(foodsRes.data.foods);
            setStaffList(staffRes.data.staff);
        } catch (error) {
            console.error('Error loading waiter data:', error);
            if (showLoading) toast.error('Failed to load data');
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();

        if (socket) {
            const handleNewOrder = (data) => {
                toast.success(data.message || 'New order received!', { icon: '📝' });
                playNotificationSound('info');
                loadData(false);
            };

            const handleStatusUpdate = (data) => {
                const { status, tableNumber } = data;
                if (status === 'ready') {
                    toast.success(`Order for Table ${tableNumber} is READY!`, {
                        icon: '🔔',
                        duration: 6000
                    });
                    playNotificationSound('high');
                }
                loadData(false);
            };

            const handleAlert = (data) => {
                const isAssignedToMe = data.assigned_to === user?.id;
                const message = isAssignedToMe ? `🎯 ASSIGNED TO YOU: ${data.message}` : data.message;

                toast(message, {
                    icon: isAssignedToMe ? '🎯' : '📢',
                    style: {
                        border: isAssignedToMe ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                        background: isAssignedToMe ? '#1a1a1a' : undefined
                    },
                    duration: isAssignedToMe ? 8000 : 5000
                });

                setNotifications(prev => [...prev, { ...data, isAssignedToMe }]);
                playNotificationSound(isAssignedToMe || data.priority === 'urgent' || data.priority === 'high' ? 'high' : 'info');
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
            socket.on('table_status_updated', (data) => {
                toast(`Table ${data.table_number || data.table_id} is now ${data.status}`, { icon: '🍽️' });
                loadData(false);
            });
            socket.on('guest_session_started', (data) => {
                toast(`Guest seated at Table ${data.table_number || data.table_id}`, { icon: '🛋️' });
                loadData(false);
            });
            socket.on('user_status_updated', (data) => {
                setStaffList(prev => prev.map(s => s.id === data.id ? { ...s, status: data.status } : s));
            });

            return () => {
                socket.off('new_order', handleNewOrder);
                socket.off('order_status_updated', handleStatusUpdate);
                socket.off('staff_alert', handleAlert);
                socket.off('new_chat_message', handleNewChat);
                socket.off('table_status_updated');
                socket.off('user_status_updated');
            };
        }
    }, [socket, loadData]);

    const handleTableStatusChange = async (tableId, newStatus) => {
        try {
            await tablesAPI.updateStatus(tableId, newStatus);
            toast.success(`Table status updated`);
            // loadData() will be triggered by real-time event if added to backend, 
            // but for now we call it manually just in case
            loadData(false);
        } catch (error) {
            toast.error('Failed to update table');
        }
    };

    const handleCreateOrder = () => {
        if (!selectedTable) {
            toast.error('Please select a table first');
            return;
        }
        setActiveView('newOrder');
    };

    const addToOrder = (food) => {
        const existing = orderItems.find(item => item.food_id === food.id);
        if (existing) {
            setOrderItems(orderItems.map(item =>
                item.food_id === food.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setOrderItems([...orderItems, {
                food_id: food.id,
                food_name: food.name,
                food_price: food.price,
                quantity: 1,
                special_instructions: ''
            }]);
        }
        toast.success(`${food.name} added`);
    };

    const updateItemQuantity = (foodId, delta) => {
        setOrderItems(orderItems.map(item => {
            if (item.food_id === foodId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean));
    };

    const handleSubmitOrder = async () => {
        if (orderItems.length === 0) {
            toast.error('Add items to order');
            return;
        }

        try {
            await ordersAPI.create({
                items: orderItems.map(item => ({
                    food_id: item.food_id,
                    quantity: item.quantity,
                    special_instructions: item.special_instructions
                })),
                table_number: selectedTable.table_number,
                special_instructions: specialInstructions
            });
            toast.success('Order sent to kitchen!');
            setOrderItems([]);
            setSpecialInstructions('');
            setActiveView('tables');
            setSelectedTable(null);
            loadData();
        } catch (error) {
            toast.error('Failed to submit order');
        }
    };

    const handleMarkServed = async (orderId) => {
        try {
            await ordersAPI.updateStatus(orderId, { status: 'served' });
            toast.success('Order marked as served');
            loadData();
        } catch (error) {
            toast.error('Failed to update order');
        }
    };

    const handleStatusToggle = async (newStatus) => {
        try {
            setStatusLoading(true);
            const response = await authAPI.updateStatus(newStatus);
            updateUser({ status: response.data.user.status });
            toast.success(`Status updated to ${newStatus}`);
            loadData(false);
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setStatusLoading(false);
        }
    };

    const getTableStatusColor = (status) => {
        switch (status) {
            case 'available': return 'border-green-500 bg-green-500/10';
            case 'occupied': return 'border-gold bg-gold/10';
            case 'dirty': return 'border-red-500 bg-red-500/10';
            case 'reserved': return 'border-blue-500 bg-blue-500/10';
            default: return 'border-white/10 bg-white/5';
        }
    };

    const getOrderStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-gray-400';
            case 'confirmed': return 'text-blue-400';
            case 'preparing': return 'text-gold';
            case 'ready': return 'text-green-500';
            case 'served': return 'text-blue-500';
            default: return 'text-gray-500';
        }
    };

    const filteredFoods = foods.filter(food => {
        const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || food.menu_id === selectedCategory;
        return matchesSearch && matchesCategory && food.is_available;
    });

    const orderTotal = orderItems.reduce((sum, item) => sum + (item.food_price * item.quantity), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center">
                <Loader className="animate-spin text-gold" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-dark text-white p-4 md:p-8 font-sans overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto">
                {/* Header Section - Sticky for better control */}
                <header className="sticky top-0 z-[60] bg-brand-dark/80 backdrop-blur-xl -mx-4 md:-mx-8 px-4 md:px-8 py-6 mb-8 border-b border-white/5">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-display font-extrabold flex items-center gap-3">
                                <Utensils className="text-gold" size={40} />
                                Service <span className="text-gold">Command</span> Center
                            </h1>
                            <div className="flex items-center gap-4 mt-2">
                                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${connected ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                                    {connected ? 'Live' : 'Offline'}
                                </span>
                                <p className="text-gray-500 font-medium uppercase tracking-[0.3em] text-[10px] border-l border-white/10 pl-4">
                                    {user?.full_name}
                                </p>
                                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/5">
                                    {['online', 'busy', 'offline'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handleStatusToggle(s)}
                                            disabled={statusLoading}
                                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${user?.status === s
                                                ? s === 'online' ? 'bg-green-500 text-white' : s === 'busy' ? 'bg-gold text-black' : 'bg-gray-600 text-white'
                                                : 'text-gray-500 hover:text-white'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="glass-card flex items-center gap-4 px-6 py-3 border-l-4 border-gold bg-gold/5">
                                <TrendingUp className="text-gold" size={24} />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500">Orders Today</p>
                                    <p className="text-xl font-black">{orders.filter(o => o.status === 'served').length}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className="premium-button !py-3 !px-8 flex items-center gap-2 text-xs uppercase relative"
                            >
                                <MessageSquare size={16} /> Chat
                                {notifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 group"
                                title="Sign Out"
                            >
                                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Navigation and Team Status */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                    <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5">
                        {[
                            { id: 'tables', label: 'Tables', icon: <MapPin size={16} /> },
                            { id: 'orders', label: 'Active Orders', icon: <Receipt size={16} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveView(tab.id)}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2
                ${activeView === tab.id ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto pb-2 max-w-full">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 whitespace-nowrap">Team Status:</span>
                        {staffList.filter(s => s.id !== user?.id).map(staff => (
                            <div key={staff.id} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 min-w-fit">
                                <div className={`w-2 h-2 rounded-full ${staff.status === 'online' ? 'bg-green-500' : staff.status === 'busy' ? 'bg-gold' : 'bg-gray-600'
                                    }`} />
                                <span className="text-[10px] font-bold text-gray-300">{staff.full_name.split(' ')[0]}</span>
                            </div>
                        ))}
                        {staffList.length <= 1 && <span className="text-[10px] italic text-gray-600">No other staff online</span>}
                    </div>
                </div>

                {/* Tables View */}
                {activeView === 'tables' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">
                                Table Overview
                            </h2>
                            <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {tables.map(table => (
                                <motion.div
                                    key={table.id}
                                    layout
                                    className={`glass-card p-6 border-2 ${getTableStatusColor(table.status)} cursor-pointer group`}
                                    onClick={() => setSelectedTable(table)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-3xl font-black">#{table.table_number}</h3>
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">
                                                {table.status}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {table.active_orders_count > 0 && (
                                                <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-black rounded-full">
                                                    {table.active_orders_count} Orders
                                                </span>
                                            )}
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <Users size={14} /> {table.capacity}
                                            </div>
                                        </div>
                                    </div>

                                    {table.guest_name && (
                                        <div className="p-2 bg-white/5 rounded-lg text-xs mb-4">
                                            <span className="text-gray-500">Guest:</span> {table.guest_name}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {table.status === 'available' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleTableStatusChange(table.id, 'occupied');
                                                }}
                                                className="flex-1 py-2 bg-gold/20 text-gold rounded-lg text-[10px] font-black uppercase hover:bg-gold hover:text-black transition-all"
                                            >
                                                Seat Guest
                                            </button>
                                        )}
                                        {table.status === 'occupied' && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTable(table);
                                                        handleCreateOrder();
                                                    }}
                                                    className="flex-1 py-2 bg-gold text-black rounded-lg text-[10px] font-black uppercase hover:bg-gold/80 transition-all"
                                                >
                                                    <Plus size={12} className="inline mr-1" /> Order
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTableStatusChange(table.id, 'dirty');
                                                    }}
                                                    className="flex-1 py-2 bg-white/5 text-white rounded-lg text-[10px] font-black uppercase hover:bg-white/10 transition-all"
                                                >
                                                    Clear
                                                </button>
                                            </>
                                        )}
                                        {table.status === 'dirty' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleTableStatusChange(table.id, 'available');
                                                }}
                                                className="flex-1 py-2 bg-green-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-green-600 transition-all"
                                            >
                                                <Check size={12} className="inline mr-1" /> Clean
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Orders View */}
                {activeView === 'orders' && (
                    <div className="space-y-6">
                        {orders.filter(o => o.status !== 'served' && o.status !== 'cancelled').map(order => (
                            <motion.div
                                key={order.id}
                                layout
                                className="glass-card overflow-hidden"
                            >
                                <div className="p-6 bg-white/2 border-b border-white/5 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-black">Table #{order.table_number}</span>
                                            <span className={`text-xs font-bold uppercase ${getOrderStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            <Clock size={12} className="inline mr-1" />
                                            {new Date(order.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    {order.status === 'ready' && (
                                        <button
                                            onClick={() => handleMarkServed(order.id)}
                                            className="premium-button !py-3 !px-6 flex items-center gap-2 text-xs uppercase"
                                        >
                                            <CheckCircle size={16} /> Mark Served
                                        </button>
                                    )}
                                </div>

                                <div className="p-6">
                                    <div className="space-y-3">
                                        {order.items?.map(item => (
                                            <div key={item.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gold font-black">x{item.quantity}</span>
                                                    <span className="font-medium">{item.food_name}</span>
                                                </div>
                                                <span className="font-bold">${item.subtotal}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {order.special_instructions && (
                                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs italic">
                                            <Info size={12} className="inline mr-2" />
                                            {order.special_instructions}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* New Order View */}
                {activeView === 'newOrder' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Menu Selection */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search dishes..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-gold outline-none"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="all">All Categories</option>
                                    {menus.map(menu => (
                                        <option key={menu.id} value={menu.id}>{menu.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredFoods.map(food => (
                                    <div key={food.id} className="glass-card p-4 group cursor-pointer" onClick={() => setShowFoodDetails(food)}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white group-hover:text-gold transition-colors">{food.name}</h4>
                                                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{food.description}</p>
                                            </div>
                                            <span className="text-gold font-black text-lg ml-3">${food.price}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            {food.is_vegetarian && <Leaf size={14} className="text-green-500" title="Vegetarian" />}
                                            {food.spice_level > 0 && (
                                                <div className="flex gap-0.5">
                                                    {[...Array(food.spice_level)].map((_, i) => (
                                                        <Flame key={i} size={12} className="text-red-500" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToOrder(food);
                                            }}
                                            className="w-full py-2 bg-gold/20 text-gold rounded-lg text-xs font-black uppercase hover:bg-gold hover:text-black transition-all"
                                        >
                                            <Plus size={14} className="inline mr-1" /> Add to Order
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="glass-card p-6 h-fit sticky top-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Order Summary</h3>
                                <button onClick={() => setActiveView('tables')} className="text-gray-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-3 bg-gold/10 border border-gold/20 rounded-lg mb-6">
                                <p className="text-xs font-bold text-gold">Table #{selectedTable?.table_number}</p>
                            </div>

                            <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
                                {orderItems.map(item => (
                                    <div key={item.food_id} className="p-3 bg-white/5 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-sm">{item.food_name}</span>
                                            <span className="font-bold">${(item.food_price * item.quantity).toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 bg-brand-dark rounded-lg p-1">
                                                <button
                                                    onClick={() => updateItemQuantity(item.food_id, -1)}
                                                    className="p-1 hover:text-gold"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-bold">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateItemQuantity(item.food_id, 1)}
                                                    className="p-1 hover:text-gold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Special notes..."
                                                className="flex-1 bg-brand-dark border border-white/10 rounded px-2 py-1 text-xs"
                                                value={item.special_instructions}
                                                onChange={(e) => setOrderItems(orderItems.map(i =>
                                                    i.food_id === item.food_id ? { ...i, special_instructions: e.target.value } : i
                                                ))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <textarea
                                placeholder="General instructions for kitchen..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-6 h-20"
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                            />

                            <div className="border-t border-white/5 pt-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Total</span>
                                    <span className="text-3xl font-black text-gold">${orderTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmitOrder}
                                disabled={orderItems.length === 0}
                                className="w-full premium-button !py-4 flex items-center justify-center gap-2 text-sm uppercase disabled:opacity-50"
                            >
                                <Send size={16} /> Send to Kitchen
                            </button>
                        </div>
                    </div>
                )}

                {/* Food Details Modal */}
                <AnimatePresence>
                    {showFoodDetails && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowFoodDetails(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                className="glass-card p-8 max-w-2xl w-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2">{showFoodDetails.name}</h2>
                                        <p className="text-gold text-2xl font-black">${showFoodDetails.price}</p>
                                    </div>
                                    <button onClick={() => setShowFoodDetails(null)} className="text-gray-500 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>

                                <p className="text-gray-400 mb-6">{showFoodDetails.description}</p>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <p className="text-xs text-gray-500 mb-1">Spice Level</p>
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Flame
                                                    key={i}
                                                    size={16}
                                                    className={i < showFoodDetails.spice_level ? 'text-red-500' : 'text-gray-700'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <p className="text-xs text-gray-500 mb-1">Dietary</p>
                                        <div className="flex gap-2">
                                            {showFoodDetails.is_vegetarian && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">Vegetarian</span>}
                                            {showFoodDetails.is_vegan && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">Vegan</span>}
                                            {showFoodDetails.is_gluten_free && <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded">Gluten Free</span>}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        addToOrder(showFoodDetails);
                                        setShowFoodDetails(null);
                                    }}
                                    className="w-full premium-button !py-4"
                                >
                                    Add to Order
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Sidebar */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150]">
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowChat(false)} />
                            <ChatSidebar
                                user={user}
                                onClose={() => {
                                    setShowChat(false);
                                    setNotifications([]); // Clear unread on close
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WaiterDashboard;
