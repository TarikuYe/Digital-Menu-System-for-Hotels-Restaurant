import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Globe, ChevronRight, Star, Clock, Flame, Leaf, Bell, Pizza, Coffee, Utensils, Zap, User, ShoppingBag, Timer } from 'lucide-react';
import { foodsAPI, menusAPI, ordersAPI, communicationAPI } from '../services/api.js';
import FoodCard from '../components/Menu/FoodCard.jsx';
import LanguageSelector from '../components/Menu/LanguageSelector.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import toast from 'react-hot-toast';

const MenuPage = () => {
  const { user } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [foods, setFoods] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kitchenStats, setKitchenStats] = useState({ estimated_wait_minutes: '--', kitchen_load: 'loading' });
  const [filters, setFilters] = useState({
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
  });
  const [calling, setCalling] = useState(false);
  const [hasOrders, setHasOrders] = useState(false);

  useEffect(() => {
    loadMenus();
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        ordersAPI.getPrepTimeAnalytics(),
        user ? ordersAPI.getAll() : Promise.resolve({ data: { orders: [] } })
      ]);
      setKitchenStats(analyticsRes.data);
      if (user && ordersRes.data.orders?.length > 0) {
        setHasOrders(true);
      }
    } catch (e) { console.error('Analytics/Orders failed'); }
  };

  useEffect(() => {
    loadFoods();
  }, [selectedMenu, language, filters]);

  const loadMenus = async () => {
    try {
      const response = await menusAPI.getAll({ include_foods: false });
      setMenus(response.data.menus);
    } catch (error) {
      console.error('Error loading menus:', error);
    }
  };

  const loadFoods = async () => {
    try {
      setLoading(true);
      const params = {
        language,
        is_available: true,
        ...(selectedMenu && { menu_id: selectedMenu }),
        ...(filters.is_vegetarian && { is_vegetarian: true }),
        ...(filters.is_vegan && { is_vegan: true }),
        ...(filters.is_gluten_free && { is_gluten_free: true }),
      };
      const response = await foodsAPI.getAll(params);
      setFoods(response.data.foods);
    } catch (error) {
      console.error('Error loading foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    food.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCallWaiter = async () => {
    let tableNum = user?.table_number;

    if (!tableNum) {
      tableNum = prompt("Please enter your table number:");
      if (!tableNum) return;
    }

    try {
      setCalling(true);
      await communicationAPI.sendStaffAlert({
        recipient_role: 'staff',
        title: 'Table Service Request',
        message: `Guest at Table ${tableNum} needs assistance.`,
        priority: 'high',
        table_number: tableNum
      });
      toast.success('Your request has been sent to the staff!', { icon: '👋' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to call waiter. Please try again.');
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans">
      {/* Hero Section */}
      <section className="relative pt-24 px-6">
        <div className="max-w-7xl mx-auto relative rounded-3xl overflow-hidden h-[450px] group">
          <img
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-sm">
                Exquisite Selection
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black mb-6 tracking-tight">
              The <span className="text-gold">Digital</span> Menu
            </h1>
            <p className="text-gray-300 max-w-xl mx-auto text-sm md:text-base mb-8 leading-relaxed">
              Indulge in a curated selection of culinary masterpieces, crafted with the finest ingredients and passion for innovation.
            </p>

            {/* Quick Stats Overlay & Track Button */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-8 bg-black/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gold" />
                  <span className="text-xs font-bold">{kitchenStats.estimated_wait_minutes} mins</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-gold" />
                  <span className="text-xs font-bold capitalize">{kitchenStats.kitchen_load}</span>
                </div>
              </div>

              {hasOrders && (
                <button
                  onClick={() => navigate('/orders')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                  <Timer size={14} className="animate-pulse" />
                  Track Live Orders
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="sticky top-28 space-y-8">
              {/* Refine Taste */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold mb-6">
                  <Filter size={18} className="text-gold" />
                  Refine Taste
                </h3>
                <div className="space-y-4">
                  {[
                    { id: 'is_vegetarian', label: 'Vegetarian', icon: <Leaf size={16} className="text-green-500" /> },
                    { id: 'is_vegan', label: 'Vegan', icon: <Utensils size={16} className="text-gold" /> },
                    { id: 'is_gluten_free', label: 'Gluten Free', icon: <Zap size={16} className="text-orange-500" /> },
                  ].map(filter => (
                    <label
                      key={filter.id}
                      className="flex items-center gap-4 cursor-pointer group"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={filters[filter.id]}
                          onChange={() => setFilters(prev => ({ ...prev, [filter.id]: !prev[filter.id] }))}
                          className="peer w-5 h-5 appearance-none rounded border border-white/20 bg-white/5 checked:bg-gold checked:border-gold transition-all cursor-pointer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                          <svg className="w-3 h-3 text-black fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {filter.icon}
                        <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                          {filter.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                <button className="w-full mt-6 text-xs font-bold text-gold text-left flex items-center gap-2 hover:translate-x-1 transition-transform">
                  Browse all restrictions <ChevronRight size={14} />
                </button>
              </div>

              {/* Chef's Choice */}
              <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-6 bg-surface-dark">
                <h4 className="font-display font-bold text-lg mb-2">Chef's Choice</h4>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Discover our seasonal highlights inspired by local spices.
                </p>
                <button className="text-xs font-bold text-gold flex items-center gap-1 hover:gap-2 transition-all">
                  Learn More <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </aside>

          {/* Grid Content */}
          <main className="flex-1 space-y-8">
            {/* Search and Categories */}
            <div className="space-y-6">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Search for your favorite dish..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Chips */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                <button
                  onClick={() => setSelectedMenu(null)}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                    ${selectedMenu === null
                      ? 'bg-gold text-black shadow-lg shadow-gold/20'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
                >
                  All Selection
                </button>
                {menus.map((menu) => (
                  <button
                    key={menu.id}
                    onClick={() => setSelectedMenu(menu.id)}
                    className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                      ${selectedMenu === menu.id
                        ? 'bg-gold text-black shadow-lg shadow-gold/20'
                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
                  >
                    {menu.name}
                  </button>
                ))}
                <button className="px-6 py-2.5 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10">
                  ... More
                </button>
              </div>
            </div>

            {/* Food Grid */}
            <div className="relative">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-[4/5] rounded-[2rem] bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredFoods.map((food) => (
                      <FoodCard key={food.id} food={food} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Cart/Notify/Track FABs */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/orders?cart=true')}
          className="w-14 h-14 rounded-full bg-surface-light text-gold shadow-2xl flex items-center justify-center relative group border border-gold/20"
          title="Open Cart"
        >
          <ShoppingBag size={24} />
          {getItemCount() > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red text-white text-[10px] font-bold rounded-full border-2 border-brand-dark flex items-center justify-center">
              {getItemCount()}
            </span>
          )}
        </motion.button>

        {hasOrders && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/orders')}
            className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center relative group"
            title="Track My Orders"
          >
            <Clock size={24} />
            <span className="absolute right-full mr-4 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Track My Order
            </span>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-black text-[10px] font-bold rounded-full border-2 border-brand-dark flex items-center justify-center animate-pulse">
              !
            </span>
          </motion.button>
        )}

        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleCallWaiter}
          disabled={calling}
          className="w-14 h-14 rounded-full bg-gold text-black shadow-2xl flex items-center justify-center"
          title="Call Waiter"
        >
          <Bell size={24} className={calling ? 'animate-bounce' : ''} />
        </motion.button>
      </div>
    </div>
  );
};

export default MenuPage;


