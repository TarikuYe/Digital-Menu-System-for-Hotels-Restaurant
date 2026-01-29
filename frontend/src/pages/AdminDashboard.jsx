
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Menu as MenuIcon,
  MessageSquare,
  Plus,
  Edit3,
  Trash2,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  DollarSign,
  Users,
  Power,
  Languages,
  Settings,
  Globe,
  CreditCard,
  FileText,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  MessageCircle,
  Bell,
  Megaphone,
  Send,
  Store,
  Layout,
  QrCode,
  Shield,
  HardDrive,
  Lock,
  Building2,
  MapPin,
  Share2,
  Database,
  Key,
  Link,
  Brain
} from 'lucide-react';

import {
  foodsAPI, menusAPI, feedbackAPI, ordersAPI, adminAPI, localizationAPI,
  paymentsAPI, analyticsAPI, communicationAPI, settingsAPI, tablesAPI,
  auditAPI, branchAPI, exportAPI, integrationAPI
} from '../services/api.js';

import { ORDER_STATUS, SPICE_LEVELS, USER_ROLES } from '../utils/constants.js';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ChatSidebar from '../components/Waiter/ChatSidebar.jsx';

const AdminDashboard = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
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
  const [menus, setMenus] = useState([]);
  const [foods, setFoods] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [menuSubTab, setMenuSubTab] = useState('dishes'); // 'dishes', 'categories', 'ingredients'
  const [languages, setLanguages] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [settingsSubTab, setSettingsSubTab] = useState('languages'); // 'languages', 'translations'
  const [paymentStats, setPaymentStats] = useState(null);
  const [analyticsSales, setAnalyticsSales] = useState(null);
  const [analyticsBehavior, setAnalyticsBehavior] = useState(null);
  const [feedbackInsights, setFeedbackInsights] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [commSettings, setCommSettings] = useState({});
  const [resProfile, setResProfile] = useState(null);
  const [systemSettings, setSystemSettings] = useState({});
  const [tables, setTables] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [securityInsights, setSecurityInsights] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchPerformance, setBranchPerformance] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);

  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('food'); // 'food' or 'menu'
  const [editingItem, setEditingItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const initialFoodState = {
    name: '',
    description: '',
    price: '',
    menu_id: '',
    spice_level: 0,
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    is_special: false,
    is_recommended: false,
    is_available: true,
    available_from: '',
    available_until: '',
    seasonal_start: '',
    seasonal_end: '',
    preparation_time: '',
    calories: '',
    image_url: '',
    ingredient_ids: []
  };

  const initialMenuState = {
    name: '',
    description: '',
    is_active: true
  };

  const initialUserState = {
    email: '',
    password: '',
    full_name: '',
    role: USER_ROLES.STAFF,
    phone: '',
    branch_id: ''
  };


  const [formData, setFormData] = useState(initialFoodState);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (activeTab === 'menu') {
        const [foodRes, menuRes, ingRes] = await Promise.all([
          foodsAPI.getAll(),
          menusAPI.getAll(),
          foodsAPI.getIngredients()
        ]);
        setFoods(foodRes.data.foods);
        setMenus(menuRes.data.menus);
        setAllIngredients(ingRes.data.ingredients);
      } else if (activeTab === 'feedback') {
        const [feedbackRes, insightRes] = await Promise.all([
          feedbackAPI.getAll(),
          feedbackAPI.getInsights()
        ]);
        setFeedback(feedbackRes.data.feedback);
        setFeedbackInsights(insightRes.data);
      }
      else if (activeTab === 'orders') {
        const [orderRes, userRes] = await Promise.all([
          ordersAPI.getAll(),
          adminAPI.getUsers()
        ]);
        setOrders(orderRes.data.orders);
        setUsers(userRes.data.users);
      }
      else if (activeTab === 'users') {
        const response = await adminAPI.getUsers();
        setUsers(response.data.users);
      } else if (activeTab === 'settings') {
        const [langRes, profRes, setRes] = await Promise.all([
          localizationAPI.getLanguages(),
          settingsAPI.getProfile(),
          settingsAPI.getAll()
        ]);
        setLanguages(langRes.data.languages);
        setResProfile(profRes.data.profile);
        setSystemSettings(setRes.data.settings);

        if (!selectedLanguage && langRes.data.languages.length > 0) {
          const def = langRes.data.languages.find(l => l.is_default) || langRes.data.languages[0];
          setSelectedLanguage(def);
        }

        const tableRes = await tablesAPI.getAll();
        setTables(tableRes.data.tables);
      } else if (activeTab === 'security') {
        const [logRes, insightRes] = await Promise.all([
          auditAPI.getLogs(),
          auditAPI.getInsights()
        ]);
        setAuditLogs(logRes.data.logs);
        setSecurityInsights(insightRes.data);
      } else if (activeTab === 'branches') {
        const [branchRes, perfRes] = await Promise.all([
          branchAPI.getAll(),
          branchAPI.getPerformance()
        ]);
        setBranches(branchRes.data.branches);
        setBranchPerformance(perfRes.data.performance);
      } else if (activeTab === 'integrations') {
        const response = await integrationAPI.getKeys();
        setApiKeys(response.data.keys);
      }
      else if (activeTab === 'payments') {
        const [payRes, statRes] = await Promise.all([
          paymentsAPI.getPayments(),
          paymentsAPI.getStats()
        ]);
        setPayments(payRes.data.payments);
        setPaymentStats(statRes.data.stats);
      } else if (activeTab === 'analytics') {
        const [salesRes, behaviorRes] = await Promise.all([
          analyticsAPI.getSales(),
          analyticsAPI.getBehavior()
        ]);
        setAnalyticsSales(salesRes.data);
        setAnalyticsBehavior(behaviorRes.data);
      } else if (activeTab === 'communications') {
        const [announceRes, settingsRes] = await Promise.all([
          communicationAPI.getAnnouncements(),
          communicationAPI.getSettings()
        ]);
        setAnnouncements(announceRes.data.announcements);
        setCommSettings(settingsRes.data.settings);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      if (showLoading) toast.error('Failed to load data');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeTab, selectedLanguage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (socket) {
      const handleNewOrder = (data) => {
        if (activeTab === 'orders') {
          loadData(false);
        }
        toast.success(data.message || 'New order placed!', { icon: '💰' });
      };

      const handleUpdate = () => {
        loadData(false);
      };

      socket.on('new_order', handleNewOrder);
      socket.on('order_status_updated', handleUpdate);
      socket.on('new_announcement', (data) => {
        toast(data.title, { icon: '📣' });
        playNotificationSound('info');
        if (activeTab === 'communications') loadData(false);
      });

      socket.on('staff_alert', (data) => {
        toast(data.message, { icon: '📢' });
        playNotificationSound('high');
      });

      socket.on('new_chat_message', (data) => {
        // Don't show notification for our own messages
        if (data.sender_id === user?.id) return;

        if (!showChat) {
          setChatNotifications(prev => [...prev, data]);
          toast(`${data.sender_name}: ${data.message.slice(0, 30)}...`, { icon: '💬' });
          playNotificationSound(data.priority === 'urgent' ? 'high' : 'info');
        }
      });

      return () => {
        socket.off('new_order', handleNewOrder);
        socket.off('order_status_updated', handleUpdate);
        socket.off('new_announcement');
        socket.off('staff_alert');
        socket.off('new_chat_message');
      };
    }
  }, [socket, activeTab, loadData]);


  const handleUpdateOrderStatus = async (orderId, status, assigned_to) => {
    try {
      await ordersAPI.updateStatus(orderId, { status, assigned_to });
      toast.success('Order updated successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const handleUpdatePaymentStatus = async (paymentId, status) => {
    try {
      await paymentsAPI.updateStatus(paymentId, status);
      toast.success('Payment updated');
      loadData();
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const handleExport = async (exportFunction, filename) => {
    try {
      toast.loading('Preparing export...');
      const response = await exportFunction();

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Export completed!');
    } catch (error) {
      toast.dismiss();
      toast.error('Export failed');
      console.error('Export error:', error);
    }
  };




  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      if (type === 'food') await foodsAPI.delete(id);
      if (type === 'menu') await menusAPI.delete(id);
      if (type === 'user') await adminAPI.deleteUser(id);
      toast.success('Deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleEdit = (item, type) => {
    setFormType(type);
    setEditingItem(item);
    if (type === 'food') {
      setFormData({
        ...item,
        menu_id: item.menu_id || '',
        ingredient_ids: item.ingredients?.map(i => i.id) || []
      });
    } else {
      setFormData(item);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (formType === 'food') {
        if (editingItem) {
          await foodsAPI.update(editingItem.id, formData);
          toast.success('Dish updated');
        } else {
          await foodsAPI.create(formData);
          toast.success('Dish created');
        }
      } else if (formType === 'menu') {
        if (editingItem) {
          await menusAPI.update(editingItem.id, formData);
          toast.success('Menu updated');
        } else {
          await menusAPI.create(formData);
          toast.success('Menu created');
        }
      } else if (formType === 'user') {
        if (editingItem) {
          await adminAPI.updateUser(editingItem.id, formData);
          if (formData.password) {
            await adminAPI.resetPassword(editingItem.id, formData.password);
          }
          toast.success('User updated');
        } else {
          await adminAPI.createUser(formData);
          toast.success('User created');
        }
      }


      setShowForm(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const openNewForm = (type) => {
    setFormType(type);
    setEditingItem(null);
    if (type === 'food') setFormData(initialFoodState);
    else if (type === 'menu') setFormData(initialMenuState);
    else if (type === 'user') setFormData(initialUserState);
    setShowForm(true);
  };

  const tabs = [
    { id: 'orders', label: 'Live Orders', icon: <Clock size={18} /> },
    { id: 'menu', label: 'Menu & Food', icon: <Utensils size={18} /> },
    { id: 'users', label: 'Staff Management', icon: <Users size={18} /> },
    { id: 'feedback', label: 'Performance & Feedback', icon: <MessageSquare size={18} /> },
    { id: 'payments', label: 'Finance & Payments', icon: <DollarSign size={18} /> },
    { id: 'analytics', label: 'Reports & Analytics', icon: <BarChart3 size={18} /> },
    { id: 'communications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'branches', label: 'Multi-Branch', icon: <Building2 size={18} /> },
    { id: 'integrations', label: 'Integrations', icon: <Link size={18} /> },
    { id: 'security', label: 'Security & Audit', icon: <Shield size={18} /> },


    { id: 'settings', label: 'System Settings', icon: <Settings size={18} /> },
  ];






  return (
    <div className="min-h-screen bg-brand-dark text-white p-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-display font-extrabold flex items-center gap-3">
            Admin <span className="text-gold">Intelligence</span>
          </h1>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">Management Command Center</p>
        </div>

        <div className="flex gap-4">
          {activeTab === 'menu' && (
            <>
              <button
                onClick={() => {
                  const name = prompt('New Ingredient Name:');
                  if (name) foodsAPI.createIngredient({ name }).then(loadData);
                }}
                className="px-6 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Ingredient
              </button>
              <button
                onClick={() => openNewForm('menu')}
                className="px-6 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Category
              </button>
              <button
                onClick={() => openNewForm('food')}
                className="premium-button !py-2.5 !px-6 text-xs uppercase tracking-widest flex items-center gap-2"
              >
                <Plus size={16} /> Dish
              </button>
            </>
          )}

          {activeTab === 'users' && (
            <button
              onClick={() => openNewForm('user')}
              className="premium-button !py-2.5 !px-6 text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <Plus size={16} /> New Staff
            </button>
          )}

          {activeTab === 'orders' && (
            <button
              onClick={() => handleExport(exportAPI.downloadOrders, 'orders_export.csv')}
              className="px-6 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Download size={16} /> Export CSV
            </button>
          )}

          {activeTab === 'feedback' && (
            <button
              onClick={() => handleExport(exportAPI.downloadFeedback, 'feedback_export.csv')}
              className="px-6 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Download size={16} /> Export CSV
            </button>
          )}

          {activeTab === 'analytics' && (
            <button
              onClick={() => handleExport(exportAPI.downloadSales, 'sales_analytics.csv')}
              className="px-6 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Download size={16} /> Export Data
            </button>
          )}

          {activeTab === 'settings' && (
            <button
              onClick={() => {
                const name = prompt('Language Name (e.g. Amharic):');
                const code = prompt('Language Code (e.g. am):');
                if (name && code) localizationAPI.createLanguage({ name, code }).then(loadData);
              }}
              className="premium-button !py-2.5 !px-6 text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <Plus size={16} /> New Language
            </button>
          )}

          <button
            onClick={() => {
              setShowChat(true);
              setChatNotifications([]);
            }}
            className="premium-button !py-2.5 !px-6 text-xs uppercase tracking-widest flex items-center gap-2 relative bg-purple-600/20 border-purple-400/30 text-purple-400 hover:bg-purple-600 hover:text-white transition-all"
          >
            <MessageSquare size={16} /> Chat
            {chatNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {chatNotifications.length}
              </span>
            )}
          </button>
        </div>
      </header>



      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Sidebar */}
        <nav className="lg:w-64 shrink-0">
          <div className="sticky top-8 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group
                  ${activeTab === tab.id
                    ? 'bg-gold/10 text-gold border border-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                    : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
              >
                <div className={`p-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-gold/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                  {tab.icon}
                </div>
                <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
              </button>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1">
          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="glass-card p-6 border-l-4 border-gold">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Shift Revenue</p>
                <h3 className="text-3xl font-black font-display text-white">
                  ${orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? parseFloat(o.total_amount) : 0), 0).toFixed(2)}
                </h3>
              </div>
              <div className="glass-card p-6 border-l-4 border-blue-500">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Active Orders</p>
                <h3 className="text-3xl font-black font-display text-white">
                  {orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length}
                </h3>
              </div>
              <div className="glass-card p-6 border-l-4 border-green-500">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Completed (Shift)</p>
                <h3 className="text-3xl font-black font-display text-white">
                  {orders.filter(o => o.status === 'served').length}
                </h3>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">

            {loading ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse" />)}
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Orders View */}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    {orders.length === 0 && <div className="text-gray-500 text-center py-20">No orders found.</div>}
                    {orders.map(order => (
                      <div key={order.id} className="glass-card p-6 flex flex-col md:flex-row justify-between gap-6 group">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <span className="text-xl font-bold font-display">#{order.id.slice(0, 8)}</span>
                            <div className="px-3 py-1 rounded-full bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest border border-gold/20">
                              Table {order.table_number || 'N/A'}
                            </div>
                            {new Date() - new Date(order.created_at) > 15 * 60 * 1000 && order.status !== 'served' && order.status !== 'cancelled' && (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-tighter animate-pulse border border-red-500/20">
                                <AlertCircle size={12} /> Delayed (15m+)
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 text-sm text-gray-500 font-light">
                            <p className="flex items-center gap-2"><Clock size={14} /> {new Date(order.created_at).toLocaleString()}</p>
                            <p className="font-bold text-white mt-4 uppercase text-[10px] tracking-[0.2em] mb-2">Items</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-gray-400">
                                  <span>{item.food_name} x{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            {order.assigned_staff_name && (
                              <p className="mt-4 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                                Assigned To: {order.assigned_staff_name}
                              </p>
                            )}
                          </div>

                        </div>
                        <div className="flex flex-col justify-between items-end gap-6 text-right">
                          <div className="space-y-1">
                            <span className="text-2xl font-black text-white block">${order.total_amount}</span>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                              {order.customer_name || order.guest_name ? `By: ${order.customer_name || order.guest_name}` : 'Unknown Customer'}
                            </p>
                          </div>

                          <div className="flex flex-col gap-3 items-end">
                            <div className="flex gap-2">
                              <select
                                value={order.assigned_to || ''}
                                onChange={(e) => handleUpdateOrderStatus(order.id, order.status, e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-gold transition-colors"
                              >
                                <option value="">Unassigned</option>
                                {users.filter(u => [USER_ROLES.STAFF, USER_ROLES.KITCHEN].includes(u.role)).map(staff => (
                                  <option key={staff.id} value={staff.id}>{staff.full_name.toUpperCase()}</option>
                                ))}
                              </select>

                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                className={`bg-white/5 border rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none transition-colors
                                  ${ORDER_STATUS[order.status]?.color === 'red' ? 'border-red-500/50 text-red-500' : 'border-white/10 text-white focus:border-gold'}`}
                              >
                                {Object.entries(ORDER_STATUS).map(([key, value]) => (
                                  <option key={key} value={key}>{value.label.toUpperCase()}</option>
                                ))}
                              </select>
                            </div>

                            {order.status !== 'cancelled' && order.status !== 'served' && (
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to cancel this order?')) handleUpdateOrderStatus(order.id, 'cancelled');
                                }}
                                className="text-[9px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors flex items-center gap-1"
                              >
                                <X size={12} /> Cancel Order
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

                {/* Menu & Food Consolidated View */}
                {activeTab === 'menu' && (
                  <div className="space-y-8">
                    {/* Sub-navigation */}
                    <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5">
                      <button
                        onClick={() => setMenuSubTab('dishes')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                          ${menuSubTab === 'dishes' ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        All Dishes
                      </button>
                      <button
                        onClick={() => setMenuSubTab('categories')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                          ${menuSubTab === 'categories' ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        Categories
                      </button>
                      <button
                        onClick={() => setMenuSubTab('ingredients')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                          ${menuSubTab === 'ingredients' ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        Ingredients
                      </button>
                    </div>

                    {menuSubTab === 'dishes' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {foods.map(food => (
                          <div key={food.id} className="glass-card p-0 overflow-hidden group">
                            <div className="h-56 bg-gray-800 relative">
                              {food.image_url ? (
                                <img src={food.image_url} alt={food.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20">
                                  <Utensils size={48} />
                                </div>
                              )}

                              <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                  onClick={() => {
                                    const newStatus = !food.is_available;
                                    foodsAPI.update(food.id, { is_available: newStatus })
                                      .then(() => {
                                        toast.success(`Dish ${newStatus ? 'available' : 'hidden'}`);
                                        loadData();
                                      })
                                      .catch(() => toast.error('Status update failed'));
                                  }}
                                  className={`p-2 rounded-full backdrop-blur-md shadow-lg ${food.is_available ? 'bg-black/50 hover:bg-gold hover:text-black' : 'bg-red-500 text-white'} transition-all`}
                                  title={food.is_available ? 'Mark Out of Stock' : 'Mark Available'}
                                >
                                  <Power size={14} />
                                </button>
                                <button onClick={() => handleEdit(food, 'food')} className="p-2 rounded-full bg-black/50 backdrop-blur-md hover:bg-white hover:text-black transition-all">
                                  <Edit3 size={14} />
                                </button>
                                <button onClick={() => handleDelete(food.id, 'food')} className="p-2 rounded-full bg-black/50 backdrop-blur-md hover:bg-red-500 hover:text-white transition-all">
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {!food.is_available && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                  <span className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-2xl">Out of Stock</span>
                                </div>
                              )}
                            </div>

                            <div className="p-6">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="text-xl font-bold font-display">{food.name}</h3>
                                  <p className="text-[10px] text-gold uppercase font-bold tracking-widest">
                                    {menus.find(m => m.id === food.menu_id)?.name || 'Uncategorized'}
                                  </p>
                                </div>
                                <span className="text-2xl font-black text-white">${food.price}</span>
                              </div>

                              <p className="text-sm text-gray-400 line-clamp-2 mb-6 font-light leading-relaxed">{food.description}</p>

                              <div className="space-y-4">
                                {/* Details Row */}
                                <div className="grid grid-cols-2 gap-4 text-[10px] bg-white/5 p-3 rounded-xl border border-white/5">
                                  <div className="space-y-1">
                                    <span className="text-gray-500 uppercase font-black tracking-widest block">Spice</span>
                                    <span className="flex items-center gap-1.5 text-white font-bold">
                                      {SPICE_LEVELS[food.spice_level]?.emoji} {SPICE_LEVELS[food.spice_level]?.label}
                                      {SPICE_LEVELS[food.spice_level]?.warning && <AlertCircle size={10} className="text-orange-500 animate-pulse" />}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-gray-500 uppercase font-black tracking-widest block">Status</span>
                                    <span className={`font-bold ${food.is_available ? 'text-green-400' : 'text-red-400'}`}>
                                      {food.is_available ? 'Active' : 'Sold Out'}
                                    </span>
                                  </div>
                                </div>

                                {/* Availability Schedule */}
                                {(food.available_from || food.seasonal_start) && (
                                  <div className="p-3 bg-gold/5 rounded-xl border border-gold/10 space-y-2">
                                    <span className="text-[8px] text-gold uppercase font-black tracking-widest block">Availability Schedule</span>
                                    <div className="flex flex-col gap-1 text-[10px]">
                                      {food.available_from && (
                                        <p className="flex justify-between">
                                          <span className="text-gray-500">Daily:</span>
                                          <span className="text-white font-bold">{food.available_from.slice(0, 5)} - {food.available_until?.slice(0, 5)}</span>
                                        </p>
                                      )}
                                      {food.seasonal_start && (
                                        <p className="flex justify-between">
                                          <span className="text-gray-500">Season:</span>
                                          <span className="text-white font-bold">{new Date(food.seasonal_start).toLocaleDateString()} - {new Date(food.seasonal_end).toLocaleDateString()}</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2">
                                  {food.is_special && <span className="px-2 py-1 rounded bg-gold text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1"><Shield size={10} /> Chef Special</span>}
                                  {food.is_recommended && <span className="px-2 py-1 rounded bg-blue-500 text-white text-[9px] font-black uppercase tracking-wider">Top Seller</span>}
                                  {food.is_vegetarian && <span className="px-2 py-1 rounded border border-green-500/50 bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-wider">Vegetarian</span>}
                                  {food.is_vegan && <span className="px-2 py-1 rounded border border-green-400/50 bg-green-400/10 text-green-400 text-[9px] font-black uppercase tracking-wider">Vegan</span>}
                                  {food.is_gluten_free && <span className="px-2 py-1 rounded border border-amber-500/50 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-wider">Gluten Free</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {menuSubTab === 'categories' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menus.map(menu => (
                          <div key={menu.id} className="glass-card p-6 flex flex-col justify-between group h-full">
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${menu.is_active ? 'bg-gold/10 text-gold' : 'bg-red-500/10 text-red-500'}`}>
                                  <MenuIcon size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEdit(menu, 'menu')} className="p-2 rounded-lg bg-white/5 hover:bg-white hover:text-black transition-all"><Edit3 size={16} /></button>
                                  <button onClick={() => handleDelete(menu.id, 'menu')} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                                </div>
                              </div>
                              <h3 className="text-2xl font-bold font-display mb-2">{menu.name}</h3>
                              <p className="text-gray-400 text-sm font-light mb-6">{menu.description || 'No description provided for this category.'}</p>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                {foods.filter(f => f.menu_id === menu.id).length} Dishes
                              </span>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${menu.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {menu.is_active ? 'Active on Menu' : 'Hidden'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {menuSubTab === 'ingredients' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {allIngredients.map(ing => (
                          <div key={ing.id} className="glass-card p-4 flex justify-between items-center group">
                            <div>
                              <p className="font-bold text-sm">{ing.name}</p>
                              {ing.allergen_type && (
                                <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">
                                  {ing.allergen_type}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${ing.name}?`)) foodsAPI.deleteIngredient(ing.id).then(loadData);
                              }}
                              className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const name = prompt('Ingredient Name:');
                            const allergen = prompt('Allergen Type (dairy, gluten, nuts, egg, soy, seafood, or leave blank):');
                            if (name) foodsAPI.createIngredient({ name, allergen_type: allergen }).then(loadData);
                          }}
                          className="border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 text-gray-500 hover:border-gold hover:text-gold transition-all group"
                        >
                          <Plus className="group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Add Ingredient</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Users View */}
                {activeTab === 'users' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {users.map(user => (
                      <div key={user.id} className="glass-card p-6 flex justify-between items-start group">
                        <div className="flex gap-4">
                          <div className={`p-3 rounded-2xl ${user.is_active ? 'bg-gold/10 text-gold' : 'bg-red-500/10 text-red-400'}`}>
                            <Users size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold mb-1">{user.full_name}</h3>
                            <p className="text-sm text-gray-500 mb-2 uppercase tracking-widest font-bold text-[10px]">{user.role}</p>
                            <div className="space-y-1 text-xs text-gray-400">
                              <p>{user.email}</p>
                              {user.phone && <p>{user.phone}</p>}
                            </div>
                            <div className="flex gap-2 mt-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${user.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              const newStatus = !user.is_active;
                              adminAPI.setUserStatus(user.id, newStatus)
                                .then(() => {
                                  toast.success(`User ${newStatus ? 'activated' : 'deactivated'}`);
                                  loadData();
                                })
                                .catch(() => toast.error('Status update failed'));
                            }}
                            className={`p-2 rounded-lg ${user.is_active ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-green-500/20 text-green-400'}`}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={18} />
                          </button>
                          <button onClick={() => handleEdit(user, 'user')} className="p-2 rounded-lg hover:bg-white/10" title="Edit User"><Edit3 size={18} /></button>
                          <button onClick={() => handleDelete(user.id, 'user')} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400" title="Delete User"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Feedback & AI Sentiment View */}
                {activeTab === 'feedback' && (
                  <div className="space-y-8">
                    {/* AI Insights & Patterns */}
                    {feedbackInsights && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-card p-6 border-l-4 border-gold bg-gold/5">
                          <div className="flex items-center gap-3 mb-6">
                            <Brain className="text-gold" size={24} />
                            <h3 className="text-lg font-bold font-display">AI Pattern Detection</h3>
                          </div>
                          <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Frequently Mentioned Complaints</p>
                            <div className="flex flex-wrap gap-2">
                              {feedbackInsights.commonComplaints.map(([word, count], i) => (
                                <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white flex items-center gap-2">
                                  {word} <span className="text-gold">{count}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="glass-card p-6 border-l-4 border-red-500 bg-red-500/5">
                          <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="text-red-500 rotate-180" size={24} />
                            <h3 className="text-lg font-bold font-display text-red-500">Needing Improvement</h3>
                          </div>
                          <div className="space-y-3">
                            {feedbackInsights.needingImprovement.map((food, i) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                <span className="font-bold text-white">{food.name}</span>
                                <span className="text-red-400 font-mono flex items-center gap-1">
                                  {food.negative_count} negative feedbacks
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Feedback List with Monitoring & Control */}
                    <div className="space-y-4">
                      {feedback.length === 0 && <div className="text-center text-gray-500 py-12">No feedback received yet.</div>}
                      {feedback.map(item => (
                        <div key={item.id} className="glass-card p-6 group">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <div className="flex gap-1 text-gold">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < item.rating ? 'fill-current' : 'text-gray-700'}>★</span>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500 font-mono">{new Date(item.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-sm font-bold text-white">
                                {item.user_name || 'Guest'} <span className="text-[10px] text-gray-500 font-normal ml-2">{item.user_email}</span>
                              </p>
                            </div>

                            {/* Sentiment Badge */}
                            <div className="flex gap-2 items-center">
                              {item.sentiment_label ? (
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border
                                  ${item.sentiment_label === 'positive' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    item.sentiment_label === 'negative' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                      'bg-white/5 text-gray-400 border-white/10'}`}>
                                  <Brain size={12} /> {item.sentiment_label}
                                </div>
                              ) : (
                                <button
                                  onClick={() => feedbackAPI.analyzeSentiment(item.id).then(loadData)}
                                  className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all border border-white/5"
                                >
                                  Analyze Sentiment
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="p-4 bg-white/2 rounded-2xl border border-white/5 relative mb-4">
                            <p className="text-gray-300 italic text-sm">"{item.comment}"</p>
                            {item.food_name && (
                              <div className="absolute -top-2 right-4 px-2 py-0.5 bg-brand-dark border border-white/5 text-[8px] font-black uppercase tracking-widest text-gold rounded">
                                {item.food_name}
                              </div>
                            )}
                          </div>

                          {/* Response Section */}
                          <div className="space-y-3">
                            {item.admin_response ? (
                              <div className="flex gap-3 items-start p-4 bg-brand-dark/50 border border-gold/10 rounded-2xl">
                                <MessageCircle size={18} className="text-gold mt-1 shrink-0" />
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-gold">Official Response</p>
                                  <p className="text-xs text-gray-400">{item.admin_response}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <input
                                  placeholder="Respond to customer..."
                                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-gold outline-none transition-all"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value) {
                                      feedbackAPI.respond(item.id, e.target.value).then(() => {
                                        toast.success('Response sent');
                                        loadData();
                                      });
                                    }
                                  }}
                                />
                                <button className="px-4 py-2 bg-gold text-black rounded-xl text-[10px] font-black uppercase tracking-widest">
                                  Send
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Payments & Finance View */}
                {activeTab === 'payments' && (
                  <div className="space-y-8">
                    {/* Finance Highlights */}
                    {paymentStats && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="glass-card p-6 border-l-4 border-gold bg-gold/5">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">Monthly Revenue</p>
                            <Calendar size={14} className="text-gold" />
                          </div>
                          <h3 className="text-3xl font-black font-display text-white">${parseFloat(paymentStats.monthly_revenue).toFixed(2)}</h3>
                        </div>
                        <div className="glass-card p-6 border-l-4 border-blue-500 bg-blue-500/5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Weekly Performance</p>
                          <h3 className="text-3xl font-black font-display text-white">${parseFloat(paymentStats.weekly_revenue).toFixed(2)}</h3>
                        </div>
                        <div className="glass-card p-6 border-l-4 border-emerald-500 bg-emerald-500/5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">Cash Flows</p>
                          <h3 className="text-lg font-bold text-white">{paymentStats.cash_transactions} Txns</h3>
                        </div>
                        <div className="glass-card p-6 border-l-4 border-purple-500 bg-purple-500/5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-2">Digital Growth</p>
                          <h3 className="text-lg font-bold text-white">{paymentStats.digital_transactions} Txns</h3>
                        </div>
                      </div>
                    )}

                    <div className="glass-card overflow-hidden">
                      <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-xl font-bold font-display flex items-center gap-2">
                          <CreditCard size={20} className="text-gold" />
                          Transaction History
                        </h3>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">
                          <Download size={14} /> Export CSV
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                              <th className="p-4">Reference</th>
                              <th className="p-4">Customer</th>
                              <th className="p-4">Method</th>
                              <th className="p-4">Amount</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Date</th>
                              <th className="p-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map(pay => (
                              <tr key={pay.id} className="border-b border-white/5 text-sm hover:bg-white/2 transition-colors">
                                <td className="p-4 font-mono text-[10px]">{pay.transaction_reference || pay.id.slice(0, 8)}</td>
                                <td className="p-4">
                                  <div className="font-bold">{pay.customer_name || 'Guest'}</div>
                                  <div className="text-[10px] text-gray-500">Table {pay.table_number || 'N/A'}</div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter
                                    ${pay.payment_method === 'cash' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {pay.payment_method}
                                  </span>
                                </td>
                                <td className="p-4 font-black text-white">${pay.amount}</td>
                                <td className="p-4">
                                  <select
                                    value={pay.status}
                                    onChange={(e) => handleUpdatePaymentStatus(pay.id, e.target.value)}
                                    className={`bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none
                                      ${pay.status === 'completed' ? 'text-green-400' : pay.status === 'failed' ? 'text-red-400' : 'text-gray-400'}`}
                                  >
                                    <option value="pending" className="bg-brand-dark">Pending</option>
                                    <option value="completed" className="bg-brand-dark">Completed</option>
                                    <option value="failed" className="bg-brand-dark">Failed</option>
                                    <option value="refunded" className="bg-brand-dark">Refunded</option>
                                  </select>
                                </td>
                                <td className="p-4 text-xs text-gray-400">{new Date(pay.created_at).toLocaleDateString()}</td>
                                <td className="p-4">
                                  <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all" title="View/Print Receipt">
                                    <FileText size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reports & Analytics View */}
                {activeTab === 'analytics' && analyticsSales && analyticsBehavior && (
                  <div className="space-y-12">
                    {/* Performance Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Best Sellers */}
                      <div className="glass-card p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold font-display flex items-center gap-2">
                            <TrendingUp size={20} className="text-gold" />
                            Best Selling Items
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {analyticsSales.bestSelling.map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                              <span className="w-6 text-xs font-black text-gray-600">0{i + 1}</span>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-bold">{item.name}</span>
                                  <span className="text-xs text-gold font-mono">{item.total_sold} sold</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.total_sold / analyticsSales.bestSelling[0].total_sold) * 100}%` }}
                                    className="h-full bg-gold"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Peak Ordering Times */}
                      <div className="glass-card p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold font-display flex items-center gap-2">
                            <Activity size={20} className="text-blue-400" />
                            Peak Ordering Hours
                          </h3>
                        </div>
                        <div className="flex items-end gap-2 h-48 pt-4">
                          {analyticsSales.peakTimes.map((time, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                              <div className="w-full bg-blue-500/20 rounded-t-lg transition-all group-hover:bg-blue-500/40 relative min-h-[4px]"
                                style={{ height: `${(time.order_count / Math.max(...analyticsSales.peakTimes.map(t => t.order_count))) * 100}%` }}>
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  {time.order_count}
                                </span>
                              </div>
                              <span className="text-[8px] font-black text-gray-500">{time.hour}:00</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Customer Insights Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Tourist Favorites */}
                      <div className="glass-card p-6 col-span-1">
                        <h3 className="text-lg font-bold font-display mb-6 flex items-center gap-2">
                          <Globe size={18} className="text-emerald-400" />
                          Tourist Favorites
                        </h3>
                        <div className="space-y-4">
                          {analyticsBehavior.touristFavorites.map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white/2 rounded-xl border border-white/5">
                              <span className="text-xs font-bold">{item.name}</span>
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black uppercase">
                                {item.order_count} Guests
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dietary Preferences */}
                      <div className="glass-card p-6 col-span-1">
                        <h3 className="text-lg font-bold font-display mb-6 flex items-center gap-2">
                          <PieChart size={18} className="text-purple-400" />
                          Dietary Popularity
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(analyticsBehavior.preferences).map(([key, val]) => (
                            <div key={key} className="p-4 bg-white/2 rounded-2xl border border-white/5 text-center">
                              <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">{key.replace('_sold', '').replace('_', ' ')}</p>
                              <p className="text-xl font-black text-white">{val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Loyalty */}
                      <div className="glass-card p-6 col-span-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold font-display mb-6 flex items-center gap-2">
                            <Users size={18} className="text-gold" />
                            Customer Loyalty
                          </h3>
                          <div className="text-center py-8">
                            <div className="text-5xl font-black text-gold mb-2">
                              {analyticsBehavior.customerLoyalty.total_customers > 0
                                ? Math.round((analyticsBehavior.customerLoyalty.repeat_customers / analyticsBehavior.customerLoyalty.total_customers) * 100)
                                : 0}%
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Repeat Customer Rate</p>
                          </div>
                        </div>
                        <div className="pt-6 border-t border-white/5 flex justify-between text-[10px] font-bold uppercase text-gray-400">
                          <span>{analyticsBehavior.customerLoyalty.repeat_customers} Loyal</span>
                          <span>{analyticsBehavior.customerLoyalty.total_customers} Total</span>
                        </div>
                      </div>
                    </div>

                    {/* Low Performing Alerts */}
                    <div className="glass-card p-6 border-l-4 border-red-500 bg-red-500/5">
                      <div className="flex items-center gap-2 mb-4 text-red-500">
                        <AlertCircle size={20} />
                        <h3 className="text-lg font-bold font-display">Optimization Suggestions (Low Performance)</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analyticsSales.lowPerforming.map((item, i) => (
                          <span key={i} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold border border-red-500/20">
                            {item.name} ({item.total_sold} sales)
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 text-[10px] text-gray-500 italic">Consider updating descriptions, photos, or adjusting prices for these items.</p>
                    </div>
                  </div>
                )}

                {/* System Settings & Localization View */}


                {/* Notifications & Communication View */}
                {activeTab === 'communications' && (
                  <div className="space-y-8">
                    {/* Communication Control Center */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Announcement Composer */}
                      <div className="lg:col-span-2 glass-card p-8 border-t-4 border-gold">
                        <div className="flex items-center gap-3 mb-8">
                          <Megaphone className="text-gold" size={24} />
                          <h3 className="text-2xl font-bold font-display">Broadcast Center</h3>
                        </div>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Target Audience</label>
                              <select
                                id="announce-role"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none transition-all"
                              >
                                <option value="all">Everyone (Global)</option>
                                <option value="staff">Staff Only</option>
                                <option value="kitchen">Kitchen Staff</option>
                                <option value="customer">Customers Only</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Priority Level</label>
                              <select
                                id="announce-priority"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none transition-all"
                              >
                                <option value="info">Information (Blue)</option>
                                <option value="warning">Warning (Yellow)</option>
                                <option value="urgent">Urgent (Red)</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Announcement Title</label>
                            <input
                              id="announce-title"
                              placeholder="System Maintenance, New Dish Release..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Message Content Content Content</label>
                            <textarea
                              id="announce-content"
                              rows={4}
                              placeholder="Write your announcement message here..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none transition-all resize-none"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const title = document.getElementById('announce-title').value;
                              const content = document.getElementById('announce-content').value;
                              const target_role = document.getElementById('announce-role').value;
                              const priority = document.getElementById('announce-priority').value;

                              if (title && content) {
                                communicationAPI.createAnnouncement({ title, content, target_role, priority }).then(() => {
                                  toast.success('Announcement broadcasted!');
                                  document.getElementById('announce-title').value = '';
                                  document.getElementById('announce-content').value = '';
                                  loadData();
                                });
                              }
                            }}
                            className="premium-button w-full !py-4 flex justify-center items-center gap-2 text-sm uppercase tracking-[0.2em] font-black"
                          >
                            <Send size={18} /> Broadcast Now
                          </button>
                        </div>
                      </div>

                      {/* Notification Settings */}
                      <div className="glass-card p-8 h-fit">
                        <div className="flex items-center gap-3 mb-8">
                          <Settings className="text-gray-400" size={20} />
                          <h3 className="text-lg font-bold font-display">Alert Preferences</h3>
                        </div>
                        <div className="space-y-6">
                          {[
                            { key: 'notify_email', label: 'Email Notifications', desc: 'Summary of daily reports' },
                            { key: 'notify_sms', label: 'Urgent SMS Alerts', desc: 'For cancelled or delayed orders' },
                            { key: 'notify_push', label: 'In-App Push', desc: 'Real-time kitchen feedback' },
                            { key: 'order_status_alerts', label: 'Smart Status Updates', desc: 'AI-timed customer alerts' }
                          ].map(setting => (
                            <label key={setting.key} className="flex items-start gap-4 p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all cursor-pointer group">
                              <input
                                type="checkbox"
                                className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-gold focus:ring-gold"
                                checked={commSettings[setting.key] === 'true'}
                                onChange={(e) => {
                                  const newSettings = { [setting.key]: e.target.checked.toString() };
                                  communicationAPI.updateSettings({ settings: newSettings }).then(loadData);
                                }}
                              />
                              <div>
                                <p className="text-xs font-bold text-white mb-0.5">{setting.label}</p>
                                <p className="text-[10px] text-gray-500 font-medium">{setting.desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Announcement History */}
                    <div className="glass-card overflow-hidden">
                      <div className="p-6 border-b border-white/5 bg-white/2">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <Clock size={14} /> Active Broadcast History
                        </h3>
                      </div>
                      <div className="divide-y divide-white/5">
                        {announcements.length === 0 && <div className="p-12 text-center text-gray-500 italic">No previous announcements found.</div>}
                        {announcements.map(item => (
                          <div key={item.id} className="p-6 flex justify-between items-start hover:bg-white/2 transition-all">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter
                                  ${item.priority === 'urgent' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                  {item.priority}
                                </span>
                                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                              </div>
                              <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">{item.content}</p>
                              <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-600">
                                <span className="flex items-center gap-1"><Users size={10} /> To: {item.target_role}</span>
                                <span><Calendar size={10} /> {new Date(item.created_at).toLocaleDateString()}</span>
                                <span className="text-gray-700">By: {item.sender_name}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => communicationAPI.deleteAnnouncement(item.id).then(loadData)}
                              className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* Multi-Branch & Scalability Management View */}
                {activeTab === 'branches' && (
                  <div className="space-y-12">
                    {/* Multi-Branch Performance Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {branchPerformance.map(perf => (
                        <div key={perf.id} className="glass-card p-6 border-l-4 border-gold bg-gold/5">
                          <h4 className="text-lg font-bold mb-4 flex justify-between items-center">
                            {perf.name}
                            <div className="p-1.5 bg-gold/10 text-gold rounded-lg"><TrendingUp size={16} /></div>
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-gray-500">Revenue</p>
                              <p className="text-xl font-black text-white">${parseFloat(perf.total_revenue).toFixed(0)}</p>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-[10px] font-black uppercase text-gray-500">Orders</p>
                              <p className="text-xl font-black text-white">{perf.total_orders}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Branch Management List */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold font-display">Branch Network</h3>
                        <button
                          onClick={() => {
                            const name = prompt('Branch Name:');
                            if (name) branchAPI.create({ name }).then(loadData);
                          }}
                          className="premium-button !py-2 !px-8 text-xs uppercase"
                        >
                          Establish New Branch
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {branches.map(branch => (
                          <div key={branch.id} className="glass-card p-8 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => confirm('Suspend Branch?') && branchAPI.delete(branch.id).then(loadData)}
                                className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                              <div className="p-4 bg-brand-dark rounded-2xl border border-white/10 group-hover:border-gold transition-all">
                                <Building2 className="text-gold" size={32} />
                              </div>
                              <div>
                                <h4 className="text-xl font-bold">{branch.name}</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12} /> {branch.city || 'Location Pending'}</p>
                              </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Currency</span>
                                <span className="text-white font-mono">{branch.currency || 'USD'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Contact</span>
                                <span className="text-white">{branch.phone || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Status</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${branch.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {branch.is_active ? 'Operational' : 'Suspended'}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                const newName = prompt('Rename Branch:', branch.name);
                                if (newName) branchAPI.update(branch.id, { name: newName }).then(loadData);
                              }}
                              className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Configure Branch
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Export & Integration View */}
                {activeTab === 'integrations' && (
                  <div className="space-y-8">
                    {/* Integration Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="glass-card p-8 border-t-4 border-gold bg-gold/5">
                        <div className="flex items-center gap-3 mb-6">
                          <Share2 className="text-gold" size={24} />
                          <h3 className="text-xl font-bold font-display">API Access Management</h3>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed mb-8 italic">
                          Grant third-party systems access to your restaurant ecosystem. Manage secure keys for POS integrations, accounting software, and custom mobile apps.
                        </p>
                        <button
                          onClick={() => {
                            const name = prompt('Application Name (e.g. QuickBooks Integration):');
                            if (name) {
                              integrationAPI.createKey({ key_name: name, permissions: { read: true, write: false } }).then(res => {
                                alert(`IMPORTANT: Your API Key is: ${res.data.key}\n\nPlease copy and store it somewhere safe. It will NEVER be shown again.`);
                                loadData();
                              });
                            }
                          }}
                          className="premium-button !py-4 flex justify-center items-center gap-2 text-xs uppercase tracking-widest"
                        >
                          <Key size={16} /> Generate New API Key
                        </button>
                      </div>

                      <div className="glass-card p-8 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-6">
                            <Database className="text-blue-400" size={24} />
                            <h3 className="text-xl font-bold font-display">Bulk Data Handlers</h3>
                          </div>
                          <div className="space-y-4">
                            {[
                              { label: 'Order History Matrix', file: 'orders_historical.csv', api: exportAPI.downloadOrders },
                              { label: 'Customer Sentiment Ledger', file: 'feedback_comprehensive.csv', api: exportAPI.downloadFeedback },
                              { label: 'Sales & Revenue Aggregates', file: 'sales_performance.csv', api: exportAPI.downloadSales }
                            ].map(item => (
                              <div key={item.label} className="flex justify-between items-center p-4 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all">
                                <span className="text-xs font-bold text-gray-300">{item.label}</span>
                                <button
                                  onClick={() => handleExport(item.api, item.file)}
                                  className="text-[10px] font-black uppercase text-gold hover:underline flex items-center gap-1"
                                >
                                  <Download size={12} /> CSV
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-600 mt-6 uppercase tracking-[0.2em] font-black text-center">Standard ISO-8601 Data Formats</p>
                      </div>
                    </div>

                    {/* API Key List */}
                    <div className="glass-card overflow-hidden">
                      <div className="p-6 border-b border-white/5 bg-white/2 flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <Lock size={14} /> Active Application Keys
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5">
                              <th className="p-4">Integration Name</th>
                              <th className="p-4">Permissions</th>
                              <th className="p-4">Created At</th>
                              <th className="p-4">Last Sync</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {apiKeys.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-12 text-center text-gray-600 italic text-xs">No active integrations found.</td>
                              </tr>
                            )}
                            {apiKeys.map(key => (
                              <tr key={key.id} className="text-xs hover:bg-white/2 transition-colors">
                                <td className="p-4">
                                  <div className="font-bold text-white">{key.key_name}</div>
                                  <div className="text-[9px] font-mono text-gray-500 uppercase">UID: {key.id.split('-')[0]}...</div>
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-1">
                                    {Object.entries(key.permissions).map(([perm, val]) => val && (
                                      <span key={perm} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] uppercase font-black">{perm}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 text-gray-400">{new Date(key.created_at).toLocaleDateString()}</td>
                                <td className="p-4 font-mono text-[10px] text-gray-500">{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never Sync'}</td>
                                <td className="p-4">
                                  <button
                                    onClick={() => integrationAPI.toggleKey(key.id, !key.is_active).then(loadData)}
                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all
                                      ${key.is_active ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                  >
                                    {key.is_active ? 'Active' : 'Revoked'}
                                  </button>
                                </td>
                                <td className="p-4">
                                  <button
                                    onClick={() => confirm('Permanently delete this key?') && integrationAPI.deleteKey(key.id).then(loadData)}
                                    className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}


                {/* Security & Audit Management View */}
                {activeTab === 'security' && (
                  <div className="space-y-8">
                    {/* Threat Detection & Insights */}
                    {securityInsights && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="glass-card p-6 border-l-4 border-red-500 bg-red-500/5">
                          <div className="flex items-center gap-3 mb-6">
                            <AlertCircle className="text-red-500" size={24} />
                            <h3 className="text-lg font-bold font-display">Brute Force Alerts</h3>
                          </div>
                          <div className="space-y-4">
                            {securityInsights.failedLogins.length === 0 ? (
                              <p className="text-xs text-gray-500">No suspicious login attempts detected.</p>
                            ) : (
                              securityInsights.failedLogins.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm p-2 bg-red-500/10 rounded-lg">
                                  <span className="font-mono text-[10px]">{item.ip_address}</span>
                                  <span className="text-red-400 font-bold">{item.attempt_count} failures</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="glass-card p-6 border-l-4 border-gold bg-gold/5">
                          <div className="flex items-center gap-3 mb-6">
                            <Lock className="text-gold" size={24} />
                            <h3 className="text-lg font-bold font-display">Role Privilege Changes</h3>
                          </div>
                          <div className="space-y-3">
                            {securityInsights.roleChanges.map((log, i) => (
                              <div key={i} className="text-xs">
                                <p className="font-bold text-white">{log.actor_name}</p>
                                <p className="text-gray-500">{log.details.email}: {log.details.old_role} → {log.details.new_role}</p>
                              </div>
                            ))}
                            {securityInsights.roleChanges.length === 0 && <p className="text-xs text-gray-500 italic">No role escalations in 7 days.</p>}
                          </div>
                        </div>

                        <div className="glass-card p-6 border-l-4 border-blue-500 bg-blue-500/5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-6">
                              <HardDrive className="text-blue-400" size={24} />
                              <h3 className="text-lg font-bold font-display">System Resilience</h3>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed mb-6">
                              Secure your restaurant data with automated snapshots. Backups include menus, user roles, financial records, and feedback history.
                            </p>
                          </div>
                          <button
                            onClick={() => auditAPI.triggerBackup().then(res => toast.success(res.data.message))}
                            className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-blue-500/20"
                          >
                            Initiate Vault Backup
                          </button>
                        </div>
                      </div>
                    )}

                    {/* System Activity Log */}
                    <div className="glass-card overflow-hidden">
                      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <Activity size={14} /> Comprehensive Audit Trail
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5">
                              <th className="p-4">Timestamp</th>
                              <th className="p-4">Principal</th>
                              <th className="p-4">Action</th>
                              <th className="p-4">Resources</th>
                              <th className="p-4">IP Address</th>
                              <th className="p-4">Severity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {auditLogs.map(log => (
                              <tr key={log.id} className="text-xs hover:bg-white/2 transition-colors">
                                <td className="p-4 font-mono text-[10px] text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                                <td className="p-4">
                                  <div className="font-bold">{log.user_name || 'System'}</div>
                                  <div className="text-[10px] text-gray-500">{log.user_email || 'automated@service'}</div>
                                </td>
                                <td className="p-4">
                                  <span className="font-black uppercase tracking-tighter text-white">{log.action.replace(/_/g, ' ')}</span>
                                </td>
                                <td className="p-4 italic text-gray-400">{log.entity_type || 'N/A'}</td>
                                <td className="p-4 font-mono text-[10px]">{log.ip_address || 'Internal'}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase 
                                    ${log.severity === 'critical' ? 'bg-red-500 text-white' :
                                      log.severity === 'warning' ? 'bg-gold text-black' : 'bg-white/10 text-gray-400'}`}>
                                    {log.severity}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}


                {activeTab === 'settings' && (


                  <div className="space-y-8">
                    {/* Sub-navigation */}
                    <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5">
                      <button
                        onClick={() => setSettingsSubTab('languages')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                          ${settingsSubTab === 'languages' ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        Language Management
                      </button>
                      <button
                        onClick={() => setSettingsSubTab('translations')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                          ${settingsSubTab === 'translations' ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        Menu Translations
                      </button>
                      <button
                        onClick={() => setSettingsSubTab('profile')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                          ${settingsSubTab === 'profile' ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        Restaurant Profile
                      </button>
                      <button
                        onClick={() => setSettingsSubTab('tables')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                          ${settingsSubTab === 'tables' ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        Table Management
                      </button>
                    </div>


                    {settingsSubTab === 'languages' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {languages.map(lang => (
                          <div key={lang.id} className="glass-card p-6 flex flex-col justify-between group">
                            <div className="flex justify-between items-start mb-4">
                              <div className={`p-3 rounded-2xl bg-white/5 text-white`}>
                                <Globe size={24} />
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!lang.is_default && (
                                  <button
                                    onClick={() => localizationAPI.updateLanguage(lang.id, { is_default: true }).then(loadData)}
                                    className="px-3 py-1 bg-white/5 hover:bg-gold hover:text-black rounded text-[8px] font-black uppercase tracking-widest transition-all"
                                  >
                                    Set Default
                                  </button>
                                )}
                                <button
                                  onClick={() => confirm(`Permanently delete ${lang.name}?`) && localizationAPI.deleteLanguage(lang.id).then(loadData)}
                                  className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold font-display flex items-center gap-2">
                                {lang.name}
                                {lang.is_default && <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded border border-gold/30 uppercase">Default</span>}
                              </h3>
                              <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1">CODE: {lang.code}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {settingsSubTab === 'translations' && (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Translating To:</span>
                            <div className="flex gap-2">
                              {languages.map(lang => (
                                <button
                                  key={lang.id}
                                  onClick={() => setSelectedLanguage(lang)}
                                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border
                                    ${selectedLanguage?.id === lang.id ? 'bg-gold text-black border-gold' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                                >
                                  {lang.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-gold/60 font-bold uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle size={14} /> Local language: {selectedLanguage?.name} ({selectedLanguage?.code})
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="glass-card overflow-hidden">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5">
                                  <th className="p-4">Original (English)</th>
                                  <th className="p-4">Localized Translation</th>
                                  <th className="p-4 w-32">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {translations.map(t => (
                                  <tr key={t.food_id} className="border-b border-white/5 text-sm hover:bg-white/2">
                                    <td className="p-4 font-bold">{t.original_name}</td>
                                    <td className="p-4">
                                      <div className="space-y-2">
                                        <input
                                          placeholder="Translation for Name"
                                          className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 focus:border-gold outline-none transition-all text-xs"
                                          defaultValue={t.translated_name}
                                          onBlur={(e) => {
                                            if (e.target.value && e.target.value !== t.translated_name) {
                                              localizationAPI.upsertTranslation({
                                                food_id: t.food_id,
                                                language_id: selectedLanguage.id,
                                                name: e.target.value,
                                                description: t.translated_description
                                              }).then(() => toast.success('Saved')).catch(() => toast.error('Error'));
                                            }
                                          }}
                                        />
                                        <textarea
                                          placeholder="Tourist-friendly description / Local explanation..."
                                          className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 focus:border-gold outline-none transition-all text-[10px] h-16"
                                          defaultValue={t.translated_description}
                                          onBlur={(e) => {
                                            if (e.target.value !== t.translated_description) {
                                              localizationAPI.upsertTranslation({
                                                food_id: t.food_id,
                                                language_id: selectedLanguage.id,
                                                name: t.translated_name || t.original_name,
                                                description: e.target.value
                                              }).then(() => toast.success('Saved')).catch(() => toast.error('Error'));
                                            }
                                          }}
                                        />
                                      </div>
                                    </td>
                                    <td className="p-4 text-center">
                                      {t.translated_name ? (
                                        <span className="text-green-500 flex items-center gap-1 text-[10px] font-black uppercase"><CheckCircle2 size={12} /> Translated</span>
                                      ) : (
                                        <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Clock size={12} /> Pending</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSubTab === 'profile' && resProfile && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Profile Info */}
                        <div className="glass-card p-8 space-y-6">
                          <h3 className="text-xl font-bold font-display flex items-center gap-2">
                            <Store className="text-gold" size={24} /> Restaurant Identity
                          </h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500">Business Name</label>
                                <input
                                  defaultValue={resProfile.name}
                                  onBlur={(e) => settingsAPI.updateProfile({ ...resProfile, name: e.target.value }).then(loadData)}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500">Primary Email</label>
                                <input
                                  defaultValue={resProfile.email}
                                  onBlur={(e) => settingsAPI.updateProfile({ ...resProfile, email: e.target.value }).then(loadData)}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold outline-none"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-gray-500">Physical Address</label>
                              <textarea
                                defaultValue={resProfile.address}
                                onBlur={(e) => settingsAPI.updateProfile({ ...resProfile, address: e.target.value }).then(loadData)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold outline-none resize-none"
                                rows={2}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500">City</label>
                                <input defaultValue={resProfile.city} onBlur={(e) => settingsAPI.updateProfile({ ...resProfile, city: e.target.value }).then(loadData)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold outline-none" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500">Currency</label>
                                <input defaultValue={resProfile.currency} onBlur={(e) => settingsAPI.updateProfile({ ...resProfile, currency: e.target.value }).then(loadData)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold outline-none" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-500">Phone</label>
                                <input defaultValue={resProfile.phone} onBlur={(e) => settingsAPI.updateProfile({ ...resProfile, phone: e.target.value }).then(loadData)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold outline-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* System Modules & Taxes */}
                        <div className="space-y-8">
                          <div className="glass-card p-8">
                            <h3 className="text-xl font-bold font-display flex items-center gap-2 mb-6">
                              <DollarSign size={20} className="text-gold" /> Rates & Taxes
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              {['tax_rate', 'service_charge'].map(key => (
                                <div key={key} className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-gray-500">{key.replace('_', ' ')} (%)</label>
                                  <input
                                    type="number" step="0.01"
                                    defaultValue={systemSettings[key]?.value || 0}
                                    onBlur={(e) => settingsAPI.update({ [key]: e.target.value }).then(loadData)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold outline-none font-mono"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="glass-card p-8">
                            <h3 className="text-xl font-bold font-display flex items-center gap-2 mb-6">
                              <Layout size={20} className="text-blue-400" /> System Modules
                            </h3>
                            <div className="space-y-4">
                              {[
                                { key: 'enable_guest_ordering', label: 'Guest QR Ordering' },
                                { key: 'enable_online_payment', label: 'Online Payments' },
                                { key: 'enable_feedback_ai', label: 'AI Feedback Analysis' }
                              ].map(module => (
                                <label key={module.key} className="flex justify-between items-center p-3 rounded-xl bg-white/2 border border-white/5 cursor-pointer hover:bg-white/5 transition-all">
                                  <span className="text-xs font-bold text-gray-300">{module.label}</span>
                                  <div
                                    onClick={() => {
                                      const newVal = systemSettings[module.key]?.value === 'true' ? 'false' : 'true';
                                      settingsAPI.update({ [module.key]: newVal }).then(loadData);
                                    }}
                                    className={`w-10 h-5 rounded-full relative transition-all ${systemSettings[module.key]?.value === 'true' ? 'bg-gold' : 'bg-gray-700'}`}
                                  >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${systemSettings[module.key]?.value === 'true' ? 'right-1' : 'left-1'}`} />
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSubTab === 'tables' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-2xl font-bold font-display">Table Configuration</h3>
                          <button
                            onClick={() => {
                              const num = prompt('Table Number:');
                              const cap = prompt('Capacity:', '4');
                              if (num) tablesAPI.create({ table_number: num, capacity: cap }).then(loadData);
                            }}
                            className="premium-button !py-2 !px-6 text-xs uppercase"
                          >
                            Add New Table
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {tables.map(table => (
                            <div key={table.id} className="glass-card p-6 flex flex-col items-center group relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => confirm('Delete Table?') && tablesAPI.delete(table.id).then(loadData)} className="p-1.5 bg-red-500/10 text-red-500 rounded"><Trash2 size={14} /></button>
                              </div>
                              <div className="p-4 bg-white rounded-2xl mb-4">
                                <QrCode size={80} className="text-black" />
                              </div>
                              <h4 className="text-lg font-bold">Table {table.table_number}</h4>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-4">Capacity: {table.capacity} Persons</p>
                              <button className="text-[10px] font-black uppercase text-gold hover:underline">Download QR Code</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}



              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-dark border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-brand-dark/95 backdrop-blur z-10">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {editingItem ? <Edit3 size={20} className="text-gold" /> : <Plus size={20} className="text-gold" />}
                  {editingItem ? 'Edit' : 'New'} {formType === 'food' ? 'Dish' : formType === 'menu' ? 'Menu' : 'User'}
                </h2>

                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {(formType === 'food' || formType === 'menu') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Name</label>
                      <input
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    {formType === 'food' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Price ($)</label>
                        <input
                          type="number" step="0.01" required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors font-mono"
                          value={formData.price}
                          onChange={e => setFormData({ ...formData, price: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}

                {formType === 'user' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                        <input
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                          value={formData.full_name}
                          onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Role</label>
                        <select
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                          value={formData.role}
                          onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                          {Object.entries(USER_ROLES).map(([key, value]) => (
                            <option key={key} value={value}>{key}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Email</label>
                        <input
                          type="email" required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Phone</label>
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        {editingItem ? 'New Password (leave blank to keep current)' : 'Password'}
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          required={!editingItem}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                        <Lock className="absolute right-4 top-3.5 text-gray-500" size={18} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Branch Assignment</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                        value={formData.branch_id || ''}
                        onChange={e => setFormData({ ...formData, branch_id: e.target.value })}
                      >
                        <option value="">Global / No Branch</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {(formType === 'food' || formType === 'menu') && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</label>
                      <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors h-24"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    {formType === 'food' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Category</label>
                            <select
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                              value={formData.menu_id}
                              onChange={e => setFormData({ ...formData, menu_id: e.target.value })}
                              required
                            >
                              <option value="">Select Category</option>
                              {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Spice Level</label>
                            <select
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                              value={formData.spice_level}
                              onChange={e => setFormData({ ...formData, spice_level: parseInt(e.target.value) })}
                            >
                              {Object.entries(SPICE_LEVELS).map(([val, info]) => (
                                <option key={val} value={val}>{info.emoji} {info.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                          {['is_vegetarian', 'is_vegan', 'is_gluten_free', 'is_special', 'is_recommended', 'is_available'].map(key => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData[key]}
                                onChange={e => setFormData({ ...formData, [key]: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-gold focus:ring-gold"
                              />
                              <span className="text-[10px] font-bold uppercase tracking-wider">
                                {key.replace('is_', '').replace('_', ' ')}
                              </span>
                            </label>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            Ingredients & Allergens
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-4 bg-white/5 rounded-xl border border-white/5">
                            {allIngredients.map(ingredient => (
                              <label key={ingredient.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={formData.ingredient_ids?.includes(ingredient.id)}
                                  onChange={e => {
                                    const ids = formData.ingredient_ids || [];
                                    if (e.target.checked) setFormData({ ...formData, ingredient_ids: [...ids, ingredient.id] });
                                    else setFormData({ ...formData, ingredient_ids: ids.filter(id => id !== ingredient.id) });
                                  }}
                                  className="w-3 h-3 rounded border-gray-600 bg-gray-700 text-gold focus:ring-gold"
                                />
                                <span className="text-xs">{ingredient.name}</span>
                                {ingredient.allergen_type && <span className="text-[8px] px-1 bg-red-500/20 text-red-400 rounded uppercase font-bold">{ingredient.allergen_type}</span>}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Available From</label>
                            <input
                              type="time"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                              value={formData.available_from || ''}
                              onChange={e => setFormData({ ...formData, available_from: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Available Until</label>
                            <input
                              type="time"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                              value={formData.available_until || ''}
                              onChange={e => setFormData({ ...formData, available_until: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Image URL</label>
                          <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors"
                            value={formData.image_url || ''}
                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </>
                    )}

                    {formType === 'menu' && (
                      <label className="flex items-center gap-2 cursor-pointer p-4 rounded-xl bg-white/5 border border-white/5">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-gold focus:ring-gold"
                        />
                        <span className="text-sm font-medium">Active (Visible to customers)</span>
                      </label>
                    )}

                    {formType === 'food' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Seasonal Start</label>
                          <input
                            type="date"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors text-white"
                            value={formData.seasonal_start ? new Date(formData.seasonal_start).toISOString().split('T')[0] : ''}
                            onChange={e => setFormData({ ...formData, seasonal_start: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Seasonal End</label>
                          <input
                            type="date"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors text-white"
                            value={formData.seasonal_end ? new Date(formData.seasonal_end).toISOString().split('T')[0] : ''}
                            onChange={e => setFormData({ ...formData, seasonal_end: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button
                  disabled={formLoading}
                  type="submit"
                  className="w-full premium-button !rounded-xl !py-4 flex justify-center items-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  {formLoading ? <Clock className="animate-spin" /> : <Save />}
                  Save {formType === 'food' ? 'Dish' : formType === 'menu' ? 'Menu' : 'User'}
                </button>
              </form>

            </motion.div >
          </motion.div >
        )
        }
      </AnimatePresence >

      {/* Chat Sidebar */}
      < AnimatePresence >
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
      </AnimatePresence >
    </div>
  );
};

export default AdminDashboard;
