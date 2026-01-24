import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, DollarSign, CreditCard, CheckCircle, Receipt, User, Hash } from 'lucide-react';

const CashierDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ transactions_count: 0, total_revenue: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [amountTendered, setAmountTendered] = useState('');
    const [processing, setProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [ordersRes, statsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/cashier/orders`, config),
                axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/cashier/stats`, config)
            ]);

            setOrders(ordersRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error loading cashier data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        setAmountTendered('');
        setPaymentSuccess(null);
    };

    const handleProcessPayment = async (method) => {
        if (!amountTendered || parseFloat(amountTendered) < parseFloat(selectedOrder.total_amount)) {
            alert('Please enter a valid amount equal to or greater than the total.');
            return;
        }

        try {
            setProcessing(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/cashier/pay`,
                {
                    order_id: selectedOrder.id,
                    payment_method: method,
                    amount_tendered: amountTendered
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPaymentSuccess(response.data);
            loadData(); // Refresh list to remove paid order
        } catch (error) {
            console.error('Payment failed:', error);
            alert('Payment processing failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark text-white p-6">
            <header className="flex justify-between items-center mb-8 bg-surface/50 backdrop-blur-md p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-bold">Cashier <span className="text-gold">Station</span></h1>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Payment Processing</p>
                    </div>
                </div>

                <div className="flex gap-6">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] mb-1">Today's Revenue</p>
                        <p className="text-xl font-bold text-accent-emerald">${Number(stats.total_revenue).toFixed(2)}</p>
                    </div>
                    <div className="text-right border-l border-white/10 pl-6">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] mb-1">Transactions</p>
                        <p className="text-xl font-bold text-white">{stats.transactions_count}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Orders List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Receipt size={18} className="text-gold" />
                        Awaiting Payment
                        <span className="bg-white/10 px-2 py-0.5 rounded text-xs ml-2">{orders.length}</span>
                        <button onClick={loadData} className="ml-auto hover:bg-white/10 p-2 rounded-full transition-colors">
                            <RefreshCw size={16} />
                        </button>
                    </h2>

                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface rounded-2xl"></div>)}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="bg-surface/30 rounded-2xl p-12 text-center border border-white/5">
                            <p className="text-gray-400">No orders waiting for payment.</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => handleSelectOrder(order)}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer hover:bg-white/5
                                    ${selectedOrder?.id === order.id
                                        ? 'bg-white/10 border-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                                        : 'bg-surface border-white/5'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-brand-dark rounded-xl px-3 py-2 border border-white/10 text-center">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Table</p>
                                            <p className="text-lg font-bold text-gold">{order.table_number}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">Order #{order.id.slice(0, 6)}</h3>
                                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                                <User size={12} /> {order.customer_name || 'Guest'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-white">${order.total_amount}</p>
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Payment Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-surface rounded-3xl border border-white/5 p-6 sticky top-24 min-h-[500px]">
                        {selectedOrder ? (
                            !paymentSuccess ? (
                                <>
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        Processing Payment
                                    </h2>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between text-gray-400 text-sm">
                                            <span>Subtotal</span>
                                            <span>${Number(selectedOrder.total_amount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-white text-xl font-bold border-t border-white/10 pt-4">
                                            <span>Total Due</span>
                                            <span className="text-gold">${Number(selectedOrder.total_amount).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs uppercase font-bold text-gray-500 mb-2">Amount Tendered</label>
                                            <div className="relative">
                                                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={amountTendered}
                                                    onChange={e => setAmountTendered(e.target.value)}
                                                    className="w-full bg-brand-dark/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-gold focus:outline-none transition-colors"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-4">
                                            <button
                                                onClick={() => handleProcessPayment('cash')}
                                                disabled={processing}
                                                className="bg-accent-emerald hover:bg-accent-emerald/90 text-brand-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                <DollarSign size={18} /> Cash
                                            </button>
                                            <button
                                                onClick={() => handleProcessPayment('card')}
                                                disabled={processing}
                                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                <CreditCard size={18} /> Card
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-accent-emerald rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle size={32} className="text-brand-dark" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Payment Complete!</h2>
                                    <p className="text-gray-400 mb-6">Receipt generated successfully.</p>

                                    <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-400">Transaction ID</span>
                                            <span className="font-mono text-sm">{paymentSuccess.receipt_number}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-gold">
                                            <span>Change Due</span>
                                            <span>${Number(paymentSuccess.change_due).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setSelectedOrder(null); setPaymentSuccess(null); }}
                                        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors"
                                    >
                                        Process Next Order
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 py-20">
                                <CreditCard size={48} className="mb-4 opacity-20" />
                                <p>Select an order to receive payment</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashierDashboard;
