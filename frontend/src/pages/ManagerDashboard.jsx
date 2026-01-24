
import React, { useState, useEffect } from 'react';
import { managerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { LayoutDashboard, TrendingUp, Users, Clock, DollarSign, Activity, AlertCircle } from 'lucide-react';

const ManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsRes, activityRes] = await Promise.all([
                managerAPI.getStats(),
                managerAPI.getActivity()
            ]);
            setStats(statsRes.data);
            setActivity(activityRes.data);
        } catch (error) {
            console.error('Failed to fetch manager data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) return <div className="p-8 text-center text-xl">Loading manager dashboard...</div>;

    const StatCard = ({ title, value, icon: Icon, color, prefix = '' }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
                <p className={`text-3xl font-bold ${color}`}>
                    {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
                </p>
            </div>
            <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')} ${color}`}>
                <Icon size={24} />
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <LayoutDashboard className="text-indigo-600" /> Manager Overview
                </h1>
                <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Today's Revenue"
                    value={stats?.revenue || 0}
                    prefix="$"
                    icon={DollarSign}
                    color="text-emerald-600"
                />
                <StatCard
                    title="Total Orders"
                    value={stats?.totalOrders || 0}
                    icon={TrendingUp}
                    color="text-blue-600"
                />
                <StatCard
                    title="Active Tables"
                    value={stats?.activeTables || 0}
                    icon={Users}
                    color="text-purple-600"
                />
                <StatCard
                    title="Pending Orders"
                    value={stats?.pendingOrders || 0}
                    icon={Clock}
                    color="text-orange-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Feed */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Activity className="text-gray-400" /> Recent Activity
                    </h2>
                    <div className="space-y-6">
                        {activity.length === 0 && <p className="text-gray-400 text-center">No recent activity</p>}
                        {activity.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                                <div className={`w-2 h-2 mt-2 rounded-full ${item.status === 'pending' ? 'bg-yellow-400' :
                                        item.status === 'ready' ? 'bg-green-400' :
                                            'bg-gray-300'
                                    }`} />
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium text-gray-900">
                                            {item.table_number ? `Table ${item.table_number}` : 'Delivery/Pickup'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(item.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        New order placed by <span className="font-medium">{item.guest_name || item.customer_name || 'Guest'}</span>
                                    </p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 uppercase font-bold tracking-wider">
                                            {item.status}
                                        </span>
                                        <span className="font-mono text-gray-400">
                                            ${item.total_amount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions / Alerts */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">
                            <AlertCircle size={20} /> Attention Needed
                        </h2>
                        {stats?.pendingOrders > 5 ? (
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-2">
                                High backlog: {stats.pendingOrders} orders pending!
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Operations are running smoothly.</p>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
                        <h2 className="text-lg font-bold mb-2">Manager Tip</h2>
                        <p className="text-white/80 text-sm">
                            Review staff performance weekly to keep morale high!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
