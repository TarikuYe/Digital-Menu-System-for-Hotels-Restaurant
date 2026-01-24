import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    CreditCard,
    CheckCircle,
    Receipt,
    RefreshCw,
    User,
    Clock,
    Filter,
    Search,
    Printer,
    Download,
    X,
    AlertCircle,
    TrendingUp,
    Wallet,
    Smartphone,
    QrCode,
    Split,
    Tag,
    FileText,
    BarChart3,
    LogOut,
    Shield,
    Eye,
    ChevronRight,
    Calculator,
    History,
    CheckSquare
} from 'lucide-react';
import { ordersAPI, paymentsAPI, tablesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CashierDashboard = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({
        total_cash: 0,
        total_card: 0,
        total_mobile: 0,
        transactions_count: 0,
        shift_start_cash: 0
    });
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeView, setActiveView] = useState('pending'); // pending, history, shift
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountTendered, setAmountTendered] = useState('');
    const [splitMode, setSplitMode] = useState(false);
    const [splitAmount, setSplitAmount] = useState('');
    const [discountCode, setDiscountCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [shiftOpen, setShiftOpen] = useState(true);

    const loadData = async () => {
        try {
            const [ordersRes, paymentsRes, statsRes] = await Promise.all([
                ordersAPI.getAll({ status: 'ready,served' }),
                paymentsAPI.getPayments(),
                paymentsAPI.getStats()
            ]);

            // Filter unpaid orders
            const unpaidOrders = ordersRes.data.orders.filter(
                o => o.payment_status !== 'paid' && (o.status === 'ready' || o.status === 'served')
            );

            setOrders(unpaidOrders);
            setPayments(paymentsRes.data.payments || []);
            setStats(statsRes.data.stats || stats);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 15000); // Real-time polling
        return () => clearInterval(interval);
    }, []);

    const calculateTotal = () => {
        if (!selectedOrder) return 0;
        const subtotal = parseFloat(selectedOrder.total_amount);
        return (subtotal - discountAmount).toFixed(2);
    };

    const calculateChange = () => {
        const total = parseFloat(calculateTotal());
        const tendered = parseFloat(amountTendered) || 0;
        return Math.max(0, tendered - total).toFixed(2);
    };

    const handleProcessPayment = async () => {
        if (!selectedOrder) {
            toast.error('No order selected');
            return;
        }

        const total = parseFloat(calculateTotal());
        const tendered = parseFloat(amountTendered) || 0;

        if (paymentMethod === 'cash' && tendered < total) {
            toast.error('Insufficient amount tendered');
            return;
        }

        try {
            setProcessing(true);

            // Create payment record
            await paymentsAPI.create({
                order_id: selectedOrder.id,
                amount: total,
                payment_method: paymentMethod,
                transaction_reference: `TXN-${Date.now()}`
            });

            // Update order payment status
            await ordersAPI.updateStatus(selectedOrder.id, 'served', null);

            // Update table status to dirty (needs cleaning)
            if (selectedOrder.table_id) {
                await tablesAPI.updateStatus(selectedOrder.table_id, 'dirty');
            }

            const receipt = {
                receipt_number: `RCP-${Date.now()}`,
                order_id: selectedOrder.id,
                table_number: selectedOrder.table_number,
                items: selectedOrder.items,
                subtotal: selectedOrder.total_amount,
                discount: discountAmount,
                total: total,
                payment_method: paymentMethod,
                amount_tendered: tendered,
                change_due: calculateChange(),
                cashier: user?.full_name,
                timestamp: new Date().toISOString()
            };

            setShowReceipt(receipt);
            toast.success('Payment processed successfully!');
            loadData();
        } catch (error) {
            toast.error('Payment processing failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleApplyDiscount = () => {
        if (discountCode === 'PROMO10') {
            const discount = parseFloat(selectedOrder.total_amount) * 0.1;
            setDiscountAmount(discount);
            toast.success('10% discount applied');
        } else if (discountCode === 'MANAGER20') {
            const discount = parseFloat(selectedOrder.total_amount) * 0.2;
            setDiscountAmount(discount);
            toast.success('20% manager discount applied');
        } else {
            toast.error('Invalid discount code');
        }
    };

    const handlePrintReceipt = () => {
        window.print();
        toast.success('Receipt sent to printer');
    };

    const handleCloseShift = () => {
        const endingCash = stats.total_cash;
        const expectedCash = stats.shift_start_cash + endingCash;
        toast.success(`Shift closed. Cash: $${endingCash.toFixed(2)}`);
        setShiftOpen(false);
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.table_number?.toString().includes(searchQuery) ||
            order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id.includes(searchQuery);

        return matchesSearch;
    });

    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'cash': return <DollarSign size={18} />;
            case 'card': return <CreditCard size={18} />;
            case 'mobile': return <Smartphone size={18} />;
            case 'qr': return <QrCode size={18} />;
            default: return <Wallet size={18} />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin text-gold mb-4">
                        <RefreshCw size={48} />
                    </div>
                    <p className="text-gray-400">Loading cashier station...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-dark text-white p-4 md:p-8">
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-display font-extrabold flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                            <DollarSign size={28} />
                        </div>
                        Cashier <span className="text-gold">Terminal</span>
                    </h1>
                    <p className="text-gray-500 font-medium uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
                        <Shield size={12} /> {user?.full_name} • Shift {shiftOpen ? 'Active' : 'Closed'}
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className="glass-card flex items-center gap-4 px-6 py-3 border-l-4 border-green-500 bg-green-500/5">
                        <DollarSign className="text-green-500" size={24} />
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-500">Cash</p>
                            <p className="text-xl font-black">${stats.total_cash?.toFixed(2) || '0.00'}</p>
                        </div>
                    </div>
                    <div className="glass-card flex items-center gap-4 px-6 py-3 border-l-4 border-blue-500 bg-blue-500/5">
                        <CreditCard className="text-blue-400" size={24} />
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-500">Card</p>
                            <p className="text-xl font-black">${stats.total_card?.toFixed(2) || '0.00'}</p>
                        </div>
                    </div>
                    <div className="glass-card flex items-center gap-4 px-6 py-3 border-l-4 border-purple-500 bg-purple-500/5">
                        <BarChart3 className="text-purple-400" size={24} />
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-500">Transactions</p>
                            <p className="text-xl font-black">{stats.transactions_count || 0}</p>
                        </div>
                    </div>
                    {shiftOpen && (
                        <button
                            onClick={handleCloseShift}
                            className="premium-button !py-3 !px-8 flex items-center gap-2 text-xs uppercase bg-red-500 hover:bg-red-600"
                        >
                            <LogOut size={16} /> Close Shift
                        </button>
                    )}
                </div>
            </header>

            {/* Navigation */}
            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5 mb-8">
                {[
                    { id: 'pending', label: 'Awaiting Payment', icon: <Clock size={16} />, count: orders.length },
                    { id: 'history', label: 'Transaction History', icon: <History size={16} /> },
                    { id: 'shift', label: 'Shift Report', icon: <FileText size={16} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveView(tab.id)}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2
              ${activeView === tab.id ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        {tab.icon} {tab.label}
                        {tab.count > 0 && (
                            <span className="bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Pending Orders View */}
            {activeView === 'pending' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Orders List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by table, customer, or order ID..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-gold outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button onClick={loadData} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <Receipt size={48} className="mx-auto text-gray-700 mb-4" />
                                <p className="text-gray-400">No orders awaiting payment</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredOrders.map(order => (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setAmountTendered('');
                                            setDiscountAmount(0);
                                            setDiscountCode('');
                                        }}
                                        className={`glass-card p-6 cursor-pointer border-2 transition-all
                      ${selectedOrder?.id === order.id ? 'border-gold bg-gold/5' : 'border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-gold/10 border border-gold/20 flex flex-col items-center justify-center">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Table</p>
                                                    <p className="text-2xl font-black text-gold">{order.table_number || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
                                                    <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                                                        <User size={14} /> {order.customer_name || 'Guest'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                        <Clock size={12} /> {new Date(order.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-white">${order.total_amount}</p>
                                                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-[10px] font-black uppercase mt-2">
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>

                                        {order.items && order.items.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                <p className="text-xs text-gray-500 mb-2">Items ({order.items.length})</p>
                                                <div className="space-y-1">
                                                    {order.items.slice(0, 3).map(item => (
                                                        <div key={item.id} className="flex justify-between text-sm">
                                                            <span className="text-gray-400">{item.quantity}x {item.food_name}</span>
                                                            <span className="font-medium">${item.subtotal}</span>
                                                        </div>
                                                    ))}
                                                    {order.items.length > 3 && (
                                                        <p className="text-xs text-gray-600">+{order.items.length - 3} more items</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment Panel */}
                    <div className="glass-card p-6 h-fit sticky top-8">
                        {selectedOrder ? (
                            !showReceipt ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold">Process Payment</h2>
                                        <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-white">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="p-4 bg-gold/10 border border-gold/20 rounded-xl">
                                        <p className="text-xs text-gold font-bold mb-1">Table #{selectedOrder.table_number}</p>
                                        <p className="text-sm text-gray-400">Order #{selectedOrder.id.slice(0, 8)}</p>
                                    </div>

                                    {/* Bill Summary */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Subtotal</span>
                                            <span className="font-medium">${selectedOrder.total_amount}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between text-sm text-green-500">
                                                <span>Discount</span>
                                                <span>-${discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-2xl font-black border-t border-white/10 pt-3">
                                            <span>Total</span>
                                            <span className="text-gold">${calculateTotal()}</span>
                                        </div>
                                    </div>

                                    {/* Discount Code */}
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-gray-500 mb-2">Discount Code</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter code..."
                                                className="flex-1 bg-brand-dark border border-white/10 rounded-xl px-4 py-2 text-sm"
                                                value={discountCode}
                                                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                            />
                                            <button
                                                onClick={handleApplyDiscount}
                                                className="px-4 py-2 bg-gold/20 text-gold rounded-xl text-xs font-bold hover:bg-gold hover:text-black transition-all"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-gray-500 mb-3">Payment Method</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: 'cash', label: 'Cash', icon: <DollarSign size={18} />, color: 'green' },
                                                { id: 'card', label: 'Card', icon: <CreditCard size={18} />, color: 'blue' },
                                                { id: 'mobile', label: 'Mobile', icon: <Smartphone size={18} />, color: 'purple' },
                                                { id: 'qr', label: 'QR Pay', icon: <QrCode size={18} />, color: 'pink' }
                                            ].map(method => (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setPaymentMethod(method.id)}
                                                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-sm font-bold
                            ${paymentMethod === method.id
                                                            ? `border-${method.color}-500 bg-${method.color}-500/20 text-${method.color}-500`
                                                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}
                                                >
                                                    {method.icon} {method.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Amount Tendered (Cash only) */}
                                    {paymentMethod === 'cash' && (
                                        <div>
                                            <label className="block text-xs uppercase font-bold text-gray-500 mb-2">Amount Tendered</label>
                                            <div className="relative">
                                                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full bg-brand-dark border border-white/10 rounded-xl pl-10 pr-4 py-3 text-lg font-bold focus:border-gold outline-none"
                                                    value={amountTendered}
                                                    onChange={(e) => setAmountTendered(e.target.value)}
                                                />
                                            </div>
                                            {amountTendered && parseFloat(amountTendered) >= parseFloat(calculateTotal()) && (
                                                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-green-500">Change Due</span>
                                                        <span className="text-2xl font-black text-green-500">${calculateChange()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Process Button */}
                                    <button
                                        onClick={handleProcessPayment}
                                        disabled={processing || (paymentMethod === 'cash' && parseFloat(amountTendered) < parseFloat(calculateTotal()))}
                                        className="w-full premium-button !py-4 flex items-center justify-center gap-2 text-sm uppercase disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin" /> Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={16} /> Complete Payment
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle size={40} className="text-white" />
                                        </div>
                                        <h2 className="text-3xl font-bold mb-2">Payment Complete!</h2>
                                        <p className="text-gray-400">Receipt generated successfully</p>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-6 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Receipt #</span>
                                            <span className="font-mono">{showReceipt.receipt_number}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Payment Method</span>
                                            <span className="uppercase font-bold">{showReceipt.payment_method}</span>
                                        </div>
                                        {showReceipt.payment_method === 'cash' && (
                                            <div className="flex justify-between text-lg font-bold text-green-500 border-t border-white/10 pt-3">
                                                <span>Change Due</span>
                                                <span>${showReceipt.change_due}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handlePrintReceipt}
                                            className="py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
                                        >
                                            <Printer size={16} /> Print
                                        </button>
                                        <button
                                            onClick={() => toast.success('Receipt sent via email')}
                                            className="py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
                                        >
                                            <Download size={16} /> Email
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setShowReceipt(null);
                                            setSelectedOrder(null);
                                            setAmountTendered('');
                                        }}
                                        className="w-full premium-button !py-4"
                                    >
                                        Process Next Order
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="h-96 flex flex-col items-center justify-center text-gray-500">
                                <Receipt size={64} className="mb-4 opacity-20" />
                                <p className="text-center">Select an order to process payment</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Transaction History View */}
            {activeView === 'history' && (
                <div className="glass-card p-8">
                    <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
                    <div className="space-y-4">
                        {payments.slice(0, 20).map(payment => (
                            <div key={payment.id} className="p-4 bg-white/5 rounded-xl flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                        {getPaymentMethodIcon(payment.payment_method)}
                                    </div>
                                    <div>
                                        <p className="font-bold">Table #{payment.table_number}</p>
                                        <p className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-green-500">${payment.amount}</p>
                                    <p className="text-xs text-gray-500 uppercase">{payment.payment_method}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Shift Report View */}
            {activeView === 'shift' && (
                <div className="glass-card p-8">
                    <h2 className="text-2xl font-bold mb-6">Shift Report</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <p className="text-sm text-gray-400 mb-2">Cash Payments</p>
                            <p className="text-3xl font-black text-green-500">${stats.total_cash?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <p className="text-sm text-gray-400 mb-2">Card Payments</p>
                            <p className="text-3xl font-black text-blue-500">${stats.total_card?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <p className="text-sm text-gray-400 mb-2">Mobile Payments</p>
                            <p className="text-3xl font-black text-purple-500">${stats.total_mobile?.toFixed(2) || '0.00'}</p>
                        </div>
                    </div>
                    <div className="p-6 bg-gold/10 border border-gold/20 rounded-xl">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Total Revenue (Shift)</p>
                                <p className="text-4xl font-black text-gold">
                                    ${((stats.total_cash || 0) + (stats.total_card || 0) + (stats.total_mobile || 0)).toFixed(2)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-400 mb-2">Transactions</p>
                                <p className="text-4xl font-black">{stats.transactions_count || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierDashboard;
