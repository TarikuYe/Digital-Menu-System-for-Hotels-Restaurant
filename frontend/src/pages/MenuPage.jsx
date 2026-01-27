import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Globe, ChevronRight, Star, Clock, Flame, Leaf, Bell } from 'lucide-react';
import { foodsAPI, menusAPI, ordersAPI, communicationAPI } from '../services/api.js';
import FoodCard from '../components/Menu/FoodCard.jsx';
import LanguageSelector from '../components/Menu/LanguageSelector.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const MenuPage = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    loadMenus();
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await ordersAPI.getPrepTimeAnalytics();
      setKitchenStats(response.data);
    } catch (e) { console.error('Analytics failed'); }
  };

  useEffect(() => {
    loadFoods();
  }, [selectedMenu, language, filters]);

  const loadMenus = async () => {
    try {
      const response = await menusAPI.getAll({ include_foods: false });
      setMenus(response.data.menus);
      if (response.data.menus.length > 0 && !selectedMenu) {
        // setSelectedMenu(response.data.menus[0].id); // Keep it null initially to show "All"
      }
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
      if (!tableNum) return; // User cancelled
    }

    try {
      setCalling(true);
      await communicationAPI.sendStaffAlert({
        recipient_role: 'staff', // This targets the Waiter role (mapped to 'staff' in DB)
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
    <div className="min-h-screen bg-brand-dark text-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover opacity-30 scale-105"
            alt="Hero brand-dark"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/40 via-brand-dark/80 to-brand-dark" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4"
        >
          <span className="inline-block px-5 py-1.5 rounded-full bg-gold/20 border border-gold/30 text-gold text-[10px] font-black uppercase tracking-[0.4em] mb-8 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            Exquisite Dining
          </span>
          <h1 className="text-6xl md:text-9xl font-display font-black mb-8 tracking-tighter drop-shadow-2xl">
            The <span className="text-gold">Digital</span> Menu
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg md:text-2xl leading-relaxed font-light drop-shadow-lg">
            Indulge in a curated selection of culinary masterpieces, <br className="hidden md:block" />
            crafted with the finest ingredients and global inspiration.
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-20">

        {/* Live Kitchen Analytics Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-10"
        >
          <div className="glass-card !py-3 !px-8 flex items-center gap-12 border-gold/10">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-gold" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Est. Prep Time</span>
              <span className="text-sm font-bold text-white">{kitchenStats.estimated_wait_minutes} mins</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <Flame size={16} className={kitchenStats.kitchen_load === 'high' ? 'text-accent-red animate-pulse' : 'text-gold'} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Kitchen Load</span>
              <span className={`text-sm font-bold uppercase ${kitchenStats.kitchen_load === 'high' ? 'text-accent-red' : 'text-gold'}`}>
                {kitchenStats.kitchen_load}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Search & Actions Bar */}
        <div className="glass-card p-4 md:p-6 mb-12 flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search for your favorite dish..."
              className="w-full premium-input pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <LanguageSelector language={language} setLanguage={setLanguage} />
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="mb-12 overflow-x-auto no-scrollbar py-2">
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedMenu(null)}
              className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all whitespace-nowrap border-2 
                ${selectedMenu === null
                  ? 'bg-gold border-gold text-[#050505] shadow-[0_0_30px_rgba(212,175,55,0.3)]'
                  : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
            >
              All Selection
            </button>
            {menus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => setSelectedMenu(menu.id)}
                className={`px-8 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all whitespace-nowrap border-2 
                  ${selectedMenu === menu.id
                    ? 'bg-gold border-gold text-[#050505] shadow-[0_0_30px_rgba(212,175,55,0.3)]'
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
              >
                {menu.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-8">
              <h3 className="flex items-center gap-2 font-display text-xl font-bold mb-6">
                <Filter size={20} className="text-gold" />
                Refine Taste
              </h3>

              <div className="space-y-4">
                {[
                  { id: 'is_vegetarian', label: 'Vegetarian', icon: <Leaf size={16} /> },
                  { id: 'is_vegan', label: 'Vegan', icon: <Star size={16} /> },
                  { id: 'is_gluten_free', label: 'Gluten Free', icon: <ChevronRight size={16} /> },
                ].map(filter => (
                  <label
                    key={filter.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-white/30 group-hover:text-gold transition-colors">{filter.icon}</span>
                      <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{filter.label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={filters[filter.id]}
                      onChange={() => setFilters(prev => ({ ...prev, [filter.id]: !prev[filter.id] }))}
                      className="w-5 h-5 rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                    />
                  </label>
                ))}
              </div>

              {/* Promo Card */}
              <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-gold/20 to-transparent border border-gold/10">
                <h4 className="font-display font-bold text-lg mb-2 text-gold">Chef's Choice</h4>
                <p className="text-sm text-gray-400 mb-4 font-light">Discover our seasonal highlights inspired by local spices.</p>
                <button className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-white hover:text-gold transition-colors">
                  Learn More <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-96 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : filteredFoods.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10"
              >
                <div className="w-24 h-24 rounded-full bg-gold/5 flex items-center justify-center mx-auto mb-8 border border-gold/10">
                  <Search size={40} className="text-gold/50" />
                </div>
                <h3 className="text-3xl font-display font-bold mb-3 text-white">No delicacies found</h3>
                <p className="text-white/40 max-w-xs mx-auto font-light">We couldn't find any matches for your current selection. <br /> Try adjusting your filters.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredFoods.map((food) => (
                    <FoodCard key={food.id} food={food} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Call Waiter Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleCallWaiter}
        disabled={calling}
        className={`fixed bottom-8 right-8 z-[100] w-16 h-16 rounded-full bg-gold text-black shadow-[0_10px_40px_rgba(212,175,55,0.4)] border-4 border-brand-dark flex items-center justify-center group ${calling ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <Bell size={24} className={`group-hover:animate-ring ${calling ? 'animate-pulse' : ''}`} />
        <span className="absolute right-full mr-4 px-4 py-2 bg-brand-dark/90 backdrop-blur-md border border-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-gold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {calling ? 'Calling...' : 'Call Waiter'}
        </span>
      </motion.button>
    </div>
  );
};

export default MenuPage;

