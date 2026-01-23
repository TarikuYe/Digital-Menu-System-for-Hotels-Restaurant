import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronLeft, Trash2, Plus, Minus, Clock, MapPin, Receipt, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { ordersAPI } from '../services/api.js';
import { ORDER_STATUS } from '../utils/constants.js';

const OrderPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, getTotal } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
      // Polling for status updates (in a real app, use WebSockets)
      const interval = setInterval(loadOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      const orderData = {
        items: cart.map((item) => ({
          food_id: item.food_id,
          quantity: item.quantity,
        })),
        table_number: tableNumber || null,
        special_instructions: specialInstructions || null,
      };
      await ordersAPI.create(orderData);
      clearCart();
      setTableNumber('');
      setSpecialInstructions('');
      setShowCart(false);
      loadOrders();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to place order');
    }
  };

  const getStatusStep = (status) => {
    const steps = ['pending', 'confirmed', 'preparing', 'ready', 'served'];
    return steps.indexOf(status);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 max-w-md w-full">
          <ShoppingBag size={64} className="mx-auto text-gold mb-6" />
          <h2 className="text-3xl font-display font-bold mb-4">Member Access</h2>
          <p className="text-gray-400 mb-8 font-light leading-relaxed">Please sign in to view your culinary journey and manage your orders.</p>
          <button
            onClick={() => navigate('/login')}
            className="premium-button w-full"
          >
            Sign In to Continue
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white pb-20">
      {/* Header */}
      <div className="bg-surface/50 backdrop-blur-md sticky top-0 z-40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-display font-bold">Order History</h1>
            {user && <span className="text-xs bg-gold/10 text-gold px-3 py-1 rounded-full font-bold uppercase tracking-wider">{user.full_name}</span>}
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="premium-button !py-2 !px-5 flex items-center gap-2 relative group"
          >
            <ShoppingBag size={18} />
            <span className="text-sm">Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent-red text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center border-2 border-brand-dark font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-12">
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map(i => <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <ShoppingBag size={64} className="mx-auto text-gray-700 mb-6" />
            <h3 className="text-3xl font-display font-bold mb-3">No active orders</h3>
            <p className="text-gray-400 max-w-xs mx-auto font-light">Your table is empty. Visit the menu to start your gourmet experience.</p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card relative overflow-hidden group"
              >
                {/* Order Progress Header */}
                <div className="p-8 border-b border-white/5">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-12">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gold font-bold font-display text-2xl tracking-tighter">ORDER #{order.id.slice(0, 6)}</span>
                        <div className="h-4 w-px bg-white/10" />
                        <span className="text-gray-500 text-sm font-light tracking-wide">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MapPin size={14} className="text-gold" />
                        <span>Table {order.table_number || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white mb-1">${order.total_amount}</div>
                      <div className="text-xs font-bold uppercase tracking-widest text-gold">{ORDER_STATUS[order.status]?.label}</div>
                    </div>
                  </div>

                  {/* Tracking Stepper */}
                  {order.status !== 'cancelled' && (
                    <div className="relative pt-10 pb-4">
                      <div className="absolute top-[50px] left-0 w-full h-1 bg-white/5 rounded-full" />
                      <div
                        className="absolute top-[50px] left-0 h-1 bg-gold rounded-full transition-all duration-1000"
                        style={{ width: `${(getStatusStep(order.status) / 4) * 100}%` }}
                      />
                      <div className="flex justify-between items-center relative">
                        {['pending', 'confirmed', 'preparing', 'ready', 'served'].map((step, i) => {
                          const isActive = getStatusStep(order.status) >= i;
                          return (
                            <div key={step} className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full border-4 border-brand-dark z-10 transition-colors duration-500 ${isActive ? 'bg-gold ring-4 ring-gold/20' : 'bg-surface-light group-hover:bg-white/20'}`} />
                              <span className={`text-[10px] mt-4 font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-gold' : 'text-gray-500'}`}>
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Accordion / List */}
                <div className="bg-white/5 p-8 flex flex-col md:flex-row gap-12">
                  <div className="flex-1">
                    <h4 className="flex items-center gap-2 font-display font-bold mb-6 text-sm uppercase tracking-widest text-gray-400">
                      <Receipt size={16} /> Selected Delicacies
                    </h4>
                    <ul className="space-y-4">
                      {order.items?.map(item => (
                        <li key={item.id} className="flex justify-between items-center group/item">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-surface-light flex items-center justify-center text-xs font-bold text-gold border border-white/5">
                              {item.quantity}x
                            </div>
                            <span className="text-gray-300 font-medium group-hover/item:text-white transition-colors">{item.food_name}</span>
                          </div>
                          <span className="font-bold text-white">${item.subtotal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {order.special_instructions && (
                    <div className="md:w-64 p-6 rounded-2xl bg-gold/5 border border-gold/10 italic text-sm text-gray-400 font-light leading-relaxed">
                      "<span className="text-gold/80 font-bold uppercase text-[9px] block mb-2 not-italic tracking-widest">Guest Note</span> {order.special_instructions}"
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Premium Cart Drawer Overlay */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-surface border-l border-white/5 shadow-2xl flex flex-col"
            >
              <div className="p-8 h-20 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="text-gold" size={24} />
                  <h2 className="text-2xl font-display font-bold">Your Selection</h2>
                </div>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <ChevronLeft size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <ShoppingBag size={32} className="text-gray-600" />
                    </div>
                    <p className="text-gray-500 font-light">Your cart is echoing... <br />Time for some flavor.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.food_id} className="flex justify-between items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group/item">
                      <div className="flex-1">
                        <h4 className="font-bold text-white group-hover/item:text-gold transition-colors">{item.food_name}</h4>
                        <div className="text-xs text-gray-500 mt-1">${item.food_price} / unit</div>
                      </div>
                      <div className="flex items-center gap-3 bg-brand-dark rounded-xl p-1 border border-white/5">
                        <button onClick={() => updateQuantity(item.food_id, item.quantity - 1)} className="p-1 hover:text-gold transition-colors"><Minus size={14} /></button>
                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.food_id, item.quantity + 1)} className="p-1 hover:text-gold transition-colors"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.food_id)} className="text-gray-600 hover:text-accent-red transition-colors p-2"><Trash2 size={16} /></button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 bg-surface-dark border-t border-white/5 space-y-6">
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="TABLE CODE (e.g. T-12)"
                      className="premium-input w-full text-center tracking-[0.3em] font-bold text-gold"
                      value={tableNumber}
                      onChange={e => setTableNumber(e.target.value)}
                    />
                    <textarea
                      placeholder="Chef's notes, allergies, or special requests..."
                      className="premium-input w-full min-h-[100px] text-sm font-light italic"
                      value={specialInstructions}
                      onChange={e => setSpecialInstructions(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between items-center py-4 border-t border-white/5">
                    <span className="text-gray-400 font-light">Total Selection Value</span>
                    <span className="text-3xl font-display font-bold text-gold">${getTotal().toFixed(2)}</span>
                  </div>
                  <button onClick={handlePlaceOrder} className="w-full premium-button !py-5 text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                    Submit to Kitchen <ChevronLeft className="rotate-180" size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderPage;

