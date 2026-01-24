
import React, { useState, useEffect } from 'react';
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
  Shield,
  Lock,
  Power
} from 'lucide-react';
import { foodsAPI, menusAPI, feedbackAPI, ordersAPI, adminAPI } from '../services/api.js';
import { ORDER_STATUS, SPICE_LEVELS, USER_ROLES } from '../utils/constants.js';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [menus, setMenus] = useState([]);
  const [foods, setFoods] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [menuSubTab, setMenuSubTab] = useState('dishes'); // 'dishes', 'categories', 'ingredients'
  const [loading, setLoading] = useState(false);


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
    phone: ''
  };

  const [formData, setFormData] = useState(initialFoodState);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
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
        const response = await feedbackAPI.getAll();
        setFeedback(response.data.feedback);
      } else if (activeTab === 'orders') {
        const response = await ordersAPI.getAll();
        setOrders(response.data.orders);
      } else if (activeTab === 'users') {
        const response = await adminAPI.getUsers();
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      toast.success('Order status updated');
      loadData();
    } catch (error) {
      toast.error('Failed to update status');
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
                          </div>
                        </div>
                        <div className="flex flex-col justify-between items-end gap-6">
                          <span className="text-2xl font-black text-white">${order.total_amount}</span>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-gold transition-colors"
                          >
                            {Object.entries(ORDER_STATUS).map(([key, value]) => (
                              <option key={key} value={key}>{value.label.toUpperCase()}</option>
                            ))}
                          </select>
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

                {/* Feedback View */}
                {activeTab === 'feedback' && (
                  <div className="space-y-4">
                    {feedback.length === 0 && <div className="text-center text-gray-500 py-12">No feedback received yet.</div>}
                    {feedback.map(item => (
                      <div key={item.id} className="glass-card p-6">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1 text-gold">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < item.rating ? 'fill-current' : 'text-gray-700'}>★</span>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 ml-2">{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="text-gray-300 italic">"{item.comment}"</p>
                        {item.food_name && <p className="text-xs text-gray-500 mt-2">On dish: {item.food_name}</p>}
                      </div>
                    ))}
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

                  </div>
                )}

                {(formType === 'food' || formType === 'menu') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</label>
                    <textarea
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none transition-colors h-24"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                )}

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

                <button
                  disabled={formLoading}
                  type="submit"
                  className="w-full premium-button !rounded-xl !py-4 flex justify-center items-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  {formLoading ? <Clock className="animate-spin" /> : <Save />}
                  Save {formType === 'food' ? 'Dish' : formType === 'menu' ? 'Menu' : 'User'}
                </button>

              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
