import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronLeft, Trash2, Plus, Minus, Clock, MapPin, Receipt, CheckCircle2, Timer, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { ordersAPI, communicationAPI, feedbackAPI } from '../services/api.js';
import ReviewModal from '../components/Common/ReviewModal.jsx';
import { ORDER_STATUS } from '../utils/constants.js';
import { useSocket } from '../context/SocketContext.jsx';
import toast from 'react-hot-toast';

const STATUS_DETAILS = {
  pending: { label: 'Awaiting Confirmation', color: 'text-gray-400' },
  confirmed: { label: 'Order Confirmed', color: 'text-blue-400' },
  preparing: { label: 'Chef is Preparing', color: 'text-gold' },
  ready: { label: 'Ready to Serve', color: 'text-green-500' },
  served: { label: 'Bon Appétit', color: 'text-blue-500' },
  cancelled: { label: 'Cancelled', color: 'text-red-500' },
};


const OrderPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { socket } = useSocket();
  const { cart, removeFromCart, updateQuantity, clearCart, getTotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const handleReviewSubmit = async (data) => {
    try {
      setReviewLoading(true);
      await feedbackAPI.create({
        ...data,
        food_id: reviewTarget.food_id,
        order_id: reviewTarget.order_id
      });
      toast.success('Thank you for your feedback!');
      setReviewTarget(null);
    } catch (error) {
      toast.error('Failed to submit review');
      console.error(error);
    } finally {
      setReviewLoading(false);
    }
  };

  const loadOrders = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const response = await ordersAPI.getAll();
      setOrders(response.data.orders);

      // Join individual order rooms for real-time updates
      if (socket && response.data.orders) {
        response.data.orders.forEach(order => {
          if (order.status !== 'served' && order.status !== 'cancelled') {
            socket.emit('join_order', order.id);
          }
        });
      }

      // If user is guest, join their session room
      if (socket && user?.isGuest) {
        socket.emit('join_user', user.id);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [socket]);

  useEffect(() => {
    // Both authenticated and guests (who have user object set) can load orders
    if (user) {
      loadOrders();
    }
  }, [user, loadOrders]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('cart') === 'true') {
      setShowCart(true);
      // Clean up URL
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (socket && user) {
      const handleStatusChange = (data) => {
        toast.success(data.message || `Order status updated to ${data.status}`, {
          icon: '🍽️',
          duration: 4000
        });
        loadOrders(false);
      };

      socket.on('order_status_changed', handleStatusChange);

      return () => {
        socket.off('order_status_changed', handleStatusChange);
      };
    }
  }, [socket, isAuthenticated, loadOrders]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      const orderData = {
        items: cart.map((item) => ({
          food_id: item.food_id,
          quantity: item.quantity,
        })),
        table_number: tableNumber || user?.table_number || null,
        special_instructions: specialInstructions || null,
      };
      const res = await ordersAPI.create(orderData);
      toast.success('Order placed successfully!', { icon: '🚀' });
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

  // No early return for !isAuthenticated anymore

  return (
    <div className="min-h-screen bg-brand-dark text-white pb-20">
      {/* Header */}
      <div className="bg-surface/50 backdrop-blur-md sticky top-20 z-40 border-b border-white/5">
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
              <span className="absolute -top-1 -right-1 bg-accent-red text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center border-2 border-brand-dark font-bold group-hover:scale-110 transition-transform">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-12">
        {!isAuthenticated ? (
          <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/5 mb-12">
            <h3 className="text-2xl font-display font-black text-white mb-3">Welcome to our Kitchen</h3>
            <p className="text-[#999] text-sm max-w-sm mx-auto mb-8 font-medium">Add your favorite items from the menu and submit your order whenever you're ready.</p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-gold text-black px-10 py-3 rounded-full text-xs font-black uppercase tracking-widest"
            >
              Back to Menu
            </button>
          </div>
        ) : loading ? (
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
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs font-bold uppercase tracking-widest text-gold">{STATUS_DETAILS[order.status]?.label || order.status}</div>
                        <div className="flex gap-2">
                          {order.payment_status === 'paid' && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                              <CheckCircle2 size={10} className="text-green-500" />
                              <span className="text-[9px] font-black uppercase text-green-500">PAID</span>
                            </div>
                          )}
                          {order.estimated_prep_time && order.status !== 'ready' && order.status !== 'served' && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 rounded-full border border-gold/20">
                              <Timer size={10} className="text-gold" />
                              <span className="text-[9px] font-black uppercase text-gold">ETC: {order.estimated_prep_time} MIN</span>
                            </div>
                          )}
                        </div>
                      </div>
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
                            <div>
                              <span className="text-gray-300 font-medium group-hover/item:text-white transition-colors block">{item.food_name}</span>
                              {order.status === 'served' && (
                                <button
                                  onClick={() => setReviewTarget({ food_id: item.food_id, order_id: order.id, food_name: item.food_name })}
                                  className="text-[10px] text-gold hover:underline mt-1 flex items-center gap-1"
                                >
                                  <Star size={10} /> Leave a Review
                                </button>
                              )}
                            </div>
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
                  cart.map((item, idx) => (
                    <div key={`${item.food_id}-${idx}`} className="flex justify-between items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group/item">
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
                      value={tableNumber || user?.table_number || ''}
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

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleReviewSubmit}
        foodName={reviewTarget?.food_name}
        loading={reviewLoading}
      />
    </div >
  );
};

export default OrderPage;

