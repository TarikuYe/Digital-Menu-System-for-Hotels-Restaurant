import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    Clock,
    DollarSign,
    Activity,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Bell,
    MessageSquare,
    FileText,
    BarChart3,
    Settings,
    UserCheck,
    ChefHat,
    Utensils,
    CreditCard,
    Star,
    AlertTriangle,
    Eye,
    ThumbsUp,
    ThumbsDown,
    Download,
    Send,
    Filter,
    Calendar,
    TrendingDown,
    Award,
    Target,
    Zap,
    LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { managerAPI, ordersAPI, adminAPI, feedbackAPI, paymentsAPI, tablesAPI, exportAPI, communicationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import ChatSidebar from '../components/Waiter/ChatSidebar';
import { useCallback } from 'react';

const ManagerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const [activeTab, setActiveTab] = useState('overview'); // overview, staff, orders, financial, feedback, reports
    const [stats, setStats] = useState({
        revenue: 0,
        totalOrders: 0,
        activeTables: 0,
        pendingOrders: 0,
        staffCount: 0,
        avgServiceTime: 0
    });
    const [activity, setActivity] = useState([]);
    const [staff, setStaff] = useState([]);
    const [orders, setOrders] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [payments, setPayments] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [showApprovalModal, setShowApprovalModal] = useState(null);
    const [financial, setFinancial] = useState({
        cash: 0,
        card: 0,
        digital: 0,
        mobile: 0
    });
    const [selectedPeriod, setSelectedPeriod] = useState('today'); // today, week, month
    const { socket } = useSocket();
    const [showChat, setShowChat] = useState(false);
    const [chatNotifications, setChatNotifications] = useState([]);

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

    const loadData = async () => {
        try {
            setLoading(true);
            const [
                statsRes,
                activityRes,
                staffRes,
                ordersRes,
                feedbackRes,
                paymentsRes,
                tablesRes,
                financialRes
            ] = await Promise.all([
                managerAPI.getStats(),
                managerAPI.getActivity(),
                adminAPI.getUsers(),
                ordersAPI.getAll(),
                feedbackAPI.getAll(),
                paymentsAPI.getPayments(),
                tablesAPI.getAll(),
                managerAPI.getFinancial()
            ]);

            setStats(statsRes.data);
            setActivity(activityRes.data || []);
            setStaff(staffRes.data.users?.filter(u =>
                // Show all staff in same branch or global staff, but exclude admin
                u.role !== 'admin' &&
                (user.role === 'admin' || !u.branch_id || u.branch_id === user.branch_id)
            ) || []);
            setOrders(ordersRes.data.orders || []);
            setFeedback(feedbackRes.data.feedback || []);
            setPayments(paymentsRes.data.payments || []);
            setTables(tablesRes.data.tables || []);
            setFinancial(financialRes.data);

            // Generate notifications
            const newNotifications = [];
            const delayedOrders = ordersRes.data.orders?.filter(o =>
                o.status === 'preparing' &&
                new Date() - new Date(o.created_at) > 30 * 60 * 1000
            );
            if (delayedOrders?.length > 0) {
                newNotifications.push({
                    type: 'warning',
                    message: `${delayedOrders.length} orders delayed over 30 minutes`,
                    action: 'View Orders'
                });
            }

            const pendingFeedback = feedbackRes.data.feedback?.filter(f => !f.admin_response);
            if (pendingFeedback?.length > 0) {
                newNotifications.push({
                    type: 'info',
                    message: `${pendingFeedback.length} customer feedback awaiting response`,
                    action: 'View Feedback'
                });
            }

            setNotifications(newNotifications);
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (socket) {
            const handleNewOrder = (data) => {
                toast.success(data.message || 'New order placed!', { icon: '💰' });
                playNotificationSound('info');
                loadData();
            };

            const handleAlert = (data) => {
                toast(data.message, { icon: '📢' });
                playNotificationSound('high');
            };

            const handleNewChat = (data) => {
                if (data.sender_id === user?.id) return;
                if (!showChat) {
                    setChatNotifications(prev => [...prev, data]);
                    toast(`${data.sender_name}: ${data.message.slice(0, 30)}...`, { icon: '💬' });
                    playNotificationSound(data.priority === 'urgent' ? 'high' : 'info');
                }
            };

            socket.on('new_order', handleNewOrder);
            socket.on('staff_alert', handleAlert);
            socket.on('new_chat_message', handleNewChat);

            return () => {
                socket.off('new_order', handleNewOrder);
                socket.off('staff_alert', handleAlert);
                socket.off('new_chat_message', handleNewChat);
            };
        }
    }, [socket, showChat]);

    const handleApproveDiscount = async (orderId, discountAmount) => {
        try {
            // Implement discount approval logic
            toast.success('Discount approved');
            setShowApprovalModal(null);
            loadData();
        } catch (error) {
            toast.error('Failed to approve discount');
        }
    };

    const handleRespondToFeedback = async (feedbackId, response) => {
        try {
            await feedbackAPI.respond(feedbackId, response);
            toast.success('Response sent to customer');
            loadData();
        } catch (error) {
            toast.error('Failed to send response');
        }
    };

    const handleExport = async (type) => {
        try {
            let response;
            let filename = '';

            if (type === 'sales') {
                response = await exportAPI.downloadSales();
                filename = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
            } else if (type === 'orders') {
                response = await exportAPI.downloadOrders();
                filename = `orders_report_${new Date().toISOString().split('T')[0]}.csv`;
            } else if (type === 'feedback') {
                response = await exportAPI.downloadFeedback();
                filename = `feedback_report_${new Date().toISOString().split('T')[0]}.csv`;
            }

            if (response) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success('Report downloaded successfully');
            }
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export report');
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, trend, prefix = '' }) => (
        <motion.div
            layout
            className="glass-card p-6 border-l-4"
            style={{ borderLeftColor: color }}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{title}</p>
                    <p className="text-3xl font-black text-white">
                        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20` }}>
                    <Icon size={24} style={{ color }} />
                </div>
            </div>
            {trend && (
                <div className="flex items-center gap-2 text-xs">
                    {trend > 0 ? (
                        <TrendingUp size={14} className="text-green-500" />
                    ) : (
                        <TrendingDown size={14} className="text-red-500" />
                    )}
                    <span className={trend > 0 ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(trend)}% vs yesterday
                    </span>
                </div>
            )}
        </motion.div>
    );

    if (loading && !stats.revenue) {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw size={48} className="animate-spin text-gold mx-auto mb-4" />
                    <p className="text-gray-400">Loading manager dashboard...</p>
                </div>
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
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                                    <LayoutDashboard size={28} />
                                </div>
                                Manager <span className="text-gold">Command</span> Center
                            </h1>
                            <p className="text-gray-500 font-medium uppercase tracking-[0.3em] text-[10px] mt-2">
                                {user?.full_name} • Operations Supervisor
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="glass-card px-4 py-2 flex items-center gap-2">
                                <Calendar size={16} className="text-gold" />
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                                >
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                            </div>
                            <button
                                onClick={loadData}
                                className="glass-card px-4 py-2 hover:bg-white/10 transition-all"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <div className="relative">
                                <button className="premium-button !py-2 !px-6 flex items-center gap-2 text-xs uppercase">
                                    <Bell size={16} />
                                    Alerts
                                    {notifications.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                                            {notifications.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setShowChat(true);
                                    setChatNotifications([]);
                                }}
                                className="premium-button !py-2 !px-6 flex items-center gap-2 text-xs uppercase relative"
                            >
                                <MessageSquare size={16} />
                                Chat
                                {chatNotifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                        {chatNotifications.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 group"
                                title="Sign Out"
                            >
                                <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Notifications Bar */}
                {notifications.length > 0 && (
                    <div className="mb-8 space-y-3">
                        {notifications.map((notif, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`glass-card p-4 border-l-4 flex justify-between items-center
                ${notif.type === 'warning' ? 'border-red-500 bg-red-500/10' : 'border-blue-500 bg-blue-500/10'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <AlertCircle size={20} className={notif.type === 'warning' ? 'text-red-500' : 'text-blue-500'} />
                                    <span className="text-sm font-medium">{notif.message}</span>
                                </div>
                                <button className="text-xs font-bold uppercase text-gold hover:underline">
                                    {notif.action}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        title="Today's Revenue"
                        value={stats.revenue || 0}
                        prefix="$"
                        icon={DollarSign}
                        color="#10b981"
                        trend={stats.revenueTrend}
                    />
                    <StatCard
                        title="Total Orders"
                        value={stats.totalOrders || 0}
                        icon={TrendingUp}
                        color="#3b82f6"
                        trend={stats.ordersTrend}
                    />
                    <StatCard
                        title="Active Tables"
                        value={stats.activeTables || 0}
                        icon={Users}
                        color="#8b5cf6"
                    />
                    <StatCard
                        title="Staff Active"
                        value={stats.staffCount || 0}
                        icon={UserCheck}
                        color="#eab308"
                    />
                    <StatCard
                        title="Avg Service"
                        value={stats.avgServiceTime ? `${stats.avgServiceTime}m` : '0m'}
                        icon={Clock}
                        color="#ec4899"
                    />
                    <StatCard
                        title="Pending Orders"
                        value={stats.pendingOrders || 0}
                        icon={Utensils}
                        color="#f59e0b"
                    />
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5 mb-8 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
                        { id: 'staff', label: 'Staff Management', icon: <Users size={16} /> },
                        { id: 'orders', label: 'Order Control', icon: <Utensils size={16} /> },
                        { id: 'financial', label: 'Financial', icon: <DollarSign size={16} /> },
                        { id: 'feedback', label: 'Customer Feedback', icon: <MessageSquare size={16} /> },
                        { id: 'reports', label: 'Reports', icon: <BarChart3 size={16} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap
              ${activeTab === tab.id ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Activity */}
                        <div className="lg:col-span-2 glass-card p-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Activity className="text-gold" size={24} />
                                Live Operations Feed
                            </h2>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                {activity.length === 0 && (
                                    <p className="text-gray-500 text-center py-12">No recent activity</p>
                                )}
                                {activity.slice(0, 20).map((item, index) => (
                                    <div key={index} className="p-4 bg-white/5 rounded-xl flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${item.status === 'pending' ? 'bg-yellow-500' :
                                                item.status === 'preparing' ? 'bg-blue-500' :
                                                    item.status === 'ready' ? 'bg-green-500' : 'bg-gray-500'
                                                }`} />
                                            <div>
                                                <p className="font-bold">
                                                    {item.table_number ? `Table ${item.table_number}` : 'Order'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {item.customer_name || item.guest_name || 'Guest'} • {new Date(item.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gold">${item.total_amount}</p>
                                            <span className="text-xs px-2 py-1 bg-white/10 rounded-full uppercase">
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-6">
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Zap className="text-gold" size={20} />
                                    Quick Actions
                                </h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={async () => {
                                            const title = prompt('Announcement Title:');
                                            const message = prompt('Announcement Message:');
                                            if (title && message) {
                                                try {
                                                    await communicationAPI.createAnnouncement({ title, message, target_role: 'all' });
                                                    toast.success('Announcement broadcasted');
                                                } catch (e) { toast.error('Failed to broadcast'); }
                                            }
                                        }}
                                        className="w-full py-3 bg-gold/20 text-gold rounded-xl text-sm font-bold hover:bg-gold hover:text-black transition-all"
                                    >
                                        Announce to All Staff
                                    </button>
                                    <button className="w-full py-3 bg-blue-500/20 text-blue-500 rounded-xl text-sm font-bold hover:bg-blue-500 hover:text-white transition-all">
                                        View Staff Schedule
                                    </button>
                                    <button
                                        onClick={() => handleExport('sales')}
                                        className="w-full py-3 bg-green-500/20 text-green-500 rounded-xl text-sm font-bold hover:bg-green-500 hover:text-white transition-all"
                                    >
                                        Export Daily Report
                                    </button>
                                </div>
                            </div>

                            <div className="glass-card p-6 border-l-4 border-purple-500 bg-purple-500/5">
                                <h3 className="text-lg font-bold mb-2">Performance Insight</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    {stats.serviceImprovement > 0
                                        ? `Service time improved by ${stats.serviceImprovement}% compared to yesterday. Great job team!`
                                        : stats.serviceImprovement < 0
                                            ? `Service time is ${Math.abs(stats.serviceImprovement)}% slower than yesterday. Let's pick up the pace.`
                                            : "Service time is holding steady. Stay focused on quality service."}
                                </p>
                                <div className={`flex items-center gap-2 text-sm font-bold ${stats.serviceImprovement >= 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                                    <Award size={16} />
                                    {stats.serviceImprovement > 0 ? 'On Track for Monthly Target' : 'Keep Pushing for Excellence'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff Management Tab */}
                {activeTab === 'staff' && (
                    <div className="glass-card p-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Users className="text-gold" size={24} />
                            Staff Supervision
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {staff.map(member => (
                                <div key={member.id} className="p-6 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg">{member.full_name}</h3>
                                            <p className="text-xs text-gray-500 uppercase tracking-widest">
                                                {member.role === 'staff' ? 'Waiter' :
                                                    member.role === 'kitchen' ? 'Kitchen Staff' :
                                                        member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                            }`}>
                                            {member.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Email:</span>
                                            <span className="font-medium">{member.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Joined:</span>
                                            <span className="font-medium">{new Date(member.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                                        <button
                                            onClick={() => alert(`Details for ${member.full_name}:\nRole: ${member.role}\nEmail: ${member.email}\nPhone: ${member.phone || 'N/A'}`)}
                                            className="flex-1 py-2 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/20 transition-all"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => {
                                                alert("Shift assignment feature coming in next update"); // Placeholder for now or implement modal
                                            }}
                                            className="flex-1 py-2 bg-gold/20 text-gold rounded-lg text-xs font-bold hover:bg-gold hover:text-black transition-all"
                                        >
                                            Assign Shift
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Orders Control Tab */}
                {activeTab === 'orders' && (
                    <div className="glass-card p-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Utensils className="text-gold" size={24} />
                            Order Exception Handling
                        </h2>
                        <div className="space-y-4">
                            {orders.filter(o => o.status !== 'cancelled').map(order => (
                                <div key={order.id} className="p-6 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
                                            <p className="text-sm text-gray-400">Table {order.table_number} • {new Date(order.created_at).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-gold">${order.total_amount}</p>
                                            <span className="text-xs px-3 py-1 bg-blue-500/20 text-blue-500 rounded-full uppercase font-bold">
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await ordersAPI.updateStatus(order.id, { priority: 'high' });
                                                    toast.success('Priority approved');
                                                    loadData(false);
                                                } catch (e) { toast.error('Failed to update priority'); }
                                            }}
                                            className="px-4 py-2 bg-green-500/20 text-green-500 rounded-lg text-xs font-bold hover:bg-green-500 hover:text-white transition-all"
                                        >
                                            Approve Priority
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Are you sure you want to cancel this order?')) return;
                                                try {
                                                    await ordersAPI.updateStatus(order.id, { status: 'cancelled' });
                                                    toast.success('Order cancelled');
                                                    loadData(false);
                                                } catch (e) { toast.error('Failed to cancel order'); }
                                            }}
                                            className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            Cancel Order
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const discount = prompt('Enter discount percentage (e.g. 10 for 10%):');
                                                if (discount && !isNaN(discount)) {
                                                    const newTotal = (parseFloat(order.total_amount) * (1 - parseFloat(discount) / 100)).toFixed(2);
                                                    if (confirm(`New total will be $${newTotal}. Apply?`)) {
                                                        try {
                                                            await ordersAPI.updateStatus(order.id, { total_amount: newTotal });
                                                            toast.success(`Discount applied. New total: $${newTotal}`);
                                                            loadData(false);
                                                        } catch (e) { toast.error('Failed to apply discount'); }
                                                    }
                                                }
                                            }}
                                            className="px-4 py-2 bg-gold/20 text-gold rounded-lg text-xs font-bold hover:bg-gold hover:text-black transition-all"
                                        >
                                            Apply Discount
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Financial Tab */}
                {activeTab === 'financial' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-card p-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <DollarSign className="text-gold" size={24} />
                                Revenue Breakdown
                            </h2>
                            <div className="space-y-4">
                                <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                                    <p className="text-sm text-gray-400 mb-2">Cash Payments</p>
                                    <p className="text-3xl font-black text-green-500">${financial.cash.toFixed(2)}</p>
                                </div>
                                <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <p className="text-sm text-gray-400 mb-2">Card Payments</p>
                                    <p className="text-3xl font-black text-blue-500">${financial.card.toFixed(2)}</p>
                                </div>
                                <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                    <p className="text-sm text-gray-400 mb-2">Mobile/Digital</p>
                                    <p className="text-3xl font-black text-purple-500">${(financial.mobile + financial.digital).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-8">
                            <h2 className="text-2xl font-bold mb-6">Pending Approvals</h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold">Refund Request</span>
                                        <span className="text-red-500 font-bold">-$45.00</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-4">Table 12 • Wrong order delivered</p>
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold">
                                            Approve
                                        </button>
                                        <button className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold">
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Tab */}
                {activeTab === 'feedback' && (
                    <div className="glass-card p-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <MessageSquare className="text-gold" size={24} />
                            Customer Feedback Management
                        </h2>
                        <div className="space-y-6">
                            {feedback.slice(0, 10).map(item => (
                                <div key={item.id} className="p-6 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={16}
                                                        className={i < item.rating ? 'text-gold fill-gold' : 'text-gray-600'}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.admin_response ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                                            }`}>
                                            {item.admin_response ? 'Responded' : 'Pending'}
                                        </span>
                                    </div>
                                    <p className="text-sm mb-4 italic">"{item.comment}"</p>
                                    {!item.admin_response && (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Type your response..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm"
                                            />
                                            <button
                                                onClick={() => handleRespondToFeedback(item.id, 'Thank you for your feedback!')}
                                                className="px-6 py-2 bg-gold text-black rounded-lg text-xs font-bold hover:bg-gold/80 transition-all"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="glass-card p-8">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <BarChart3 className="text-gold" size={24} />
                            Performance Reports
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => handleExport('sales')}
                                className="p-8 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all text-left"
                            >
                                <FileText size={32} className="text-gold mb-4" />
                                <h3 className="font-bold text-lg mb-2">Daily Sales Report</h3>
                                <p className="text-sm text-gray-400 mb-4">Comprehensive sales breakdown</p>
                                <div className="flex items-center gap-2 text-gold text-sm font-bold">
                                    <Download size={16} />
                                    Download CSV
                                </div>
                            </button>

                            <button
                                onClick={() => handleExport('orders')}
                                className="p-8 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all text-left"
                            >
                                <Users size={32} className="text-blue-500 mb-4" />
                                <h3 className="font-bold text-lg mb-2">Order Performance</h3>
                                <p className="text-sm text-gray-400 mb-4">Detailed order metrics and timing</p>
                                <div className="flex items-center gap-2 text-blue-500 text-sm font-bold">
                                    <Download size={16} />
                                    Download CSV
                                </div>
                            </button>

                            <button
                                onClick={() => handleExport('sales')}
                                className="p-8 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all text-left"
                            >
                                <TrendingUp size={32} className="text-green-500 mb-4" />
                                <h3 className="font-bold text-lg mb-2">Revenue Trends</h3>
                                <p className="text-sm text-gray-400 mb-4">Weekly and monthly analysis</p>
                                <div className="flex items-center gap-2 text-green-500 text-sm font-bold">
                                    <Download size={16} />
                                    Download CSV
                                </div>
                            </button>

                            <button
                                onClick={() => handleExport('feedback')}
                                className="p-8 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all text-left"
                            >
                                <Star size={32} className="text-purple-500 mb-4" />
                                <h3 className="font-bold text-lg mb-2">Customer Satisfaction</h3>
                                <p className="text-sm text-gray-400 mb-4">Feedback and ratings summary</p>
                                <div className="flex items-center gap-2 text-purple-500 text-sm font-bold">
                                    <Download size={16} />
                                    Download CSV
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Chat Sidebar */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200]">
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowChat(false)} />
                            <ChatSidebar
                                user={user}
                                onClose={() => {
                                    setShowChat(false);
                                    setChatNotifications([]);
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ManagerDashboard;
