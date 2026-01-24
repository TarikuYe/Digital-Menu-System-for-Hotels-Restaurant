
import React, { useState, useEffect } from 'react';
import { kitchenAPI } from '../services/api';
import toast from 'react-hot-toast';
import { RefreshCw, Clock, CheckCircle, ChefHat, AlertCircle } from 'lucide-react';

const KitchenDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            setRefreshing(true);
            const response = await kitchenAPI.getOrders();
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch kitchen orders:', error);
            toast.error('Failed to update orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await kitchenAPI.updateStatus(orderId, newStatus);
            toast.success(`Order updated to ${newStatus}`);
            fetchOrders();
        } catch (error) {
            console.error('Failed to update order status:', error);
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
            case 'preparing': return 'bg-blue-100 border-blue-300 text-blue-800';
            case 'ready': return 'bg-green-100 border-green-300 text-green-800';
            default: return 'bg-gray-100 border-gray-300 text-gray-800';
        }
    };

    const calculateTimeElapsed = (dateString) => {
        const start = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - start) / 60000); // minutes
        return `${diff} min`;
    };

    const OrderCard = ({ order }) => (
        <div className={`p-4 rounded-lg border-2 shadow-sm mb-4 transition-all hover:shadow-md ${getStatusColor(order.status)}`}>
            <div className="flex justify-between items-start mb-2 border-b border-black/10 pb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    Table {order.table_number}
                </h3>
                <span className="text-sm font-mono flex items-center gap-1">
                    <Clock size={14} /> {calculateTimeElapsed(order.created_at)}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                        <span className="font-medium"><span className="inline-block w-6 text-center bg-white/50 rounded mr-1">{item.quantity}x</span> {item.food_name}</span>
                    </div>
                ))}
                {order.special_instructions && (
                    <div className="text-xs italic mt-2 p-1 bg-white/40 rounded">
                        Note: {order.special_instructions}
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-4">
                {order.status === 'pending' && (
                    <button
                        onClick={() => handleStatusUpdate(order.id, 'preparing')}
                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                        <ChefHat size={16} /> Start Cooking
                    </button>
                )}
                {order.status === 'preparing' && (
                    <button
                        onClick={() => handleStatusUpdate(order.id, 'ready')}
                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={16} /> Mark Ready
                    </button>
                )}
                {order.status === 'ready' && (
                    <div className="w-full text-center text-sm font-bold opacity-75">Waiting for Pickup</div>
                )}
            </div>
        </div>
    );

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    if (loading) return <div className="p-8 text-center text-xl">Loading kitchen dashboard...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <ChefHat className="text-orange-600" /> Kitchen Display System
                </h1>
                <button
                    onClick={fetchOrders}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending Column */}
                <div className="bg-gray-50 p-4 rounded-xl min-h-[600px] border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-yellow-700 flex items-center gap-2">
                        <AlertCircle size={20} /> New Orders ({pendingOrders.length})
                    </h2>
                    <div className="space-y-4">
                        {pendingOrders.length === 0 && <p className="text-gray-400 text-center py-8">No new orders</p>}
                        {pendingOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    </div>
                </div>

                {/* Preparing Column */}
                <div className="bg-gray-50 p-4 rounded-xl min-h-[600px] border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
                        <ChefHat size={20} /> In Preparation ({preparingOrders.length})
                    </h2>
                    <div className="space-y-4">
                        {preparingOrders.length === 0 && <p className="text-gray-400 text-center py-8">Nothing cooking currently</p>}
                        {preparingOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    </div>
                </div>

                {/* Ready Column */}
                <div className="bg-gray-50 p-4 rounded-xl min-h-[600px] border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
                        <CheckCircle size={20} /> Ready to Serve ({readyOrders.length})
                    </h2>
                    <div className="space-y-4">
                        {readyOrders.length === 0 && <p className="text-gray-400 text-center py-8">No ready orders</p>}
                        {readyOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KitchenDashboard;
