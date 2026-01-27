import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Flame,
  Clock,
  Zap,
  AlertTriangle,
  Check,
  ShieldCheck,
  Plus,
  Minus,
  ShoppingCart,
  MessageSquare,
  Star,
  Info,
  Leaf,
  Wheat,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { SPICE_LEVELS } from '../../utils/constants.js';
import toast from 'react-hot-toast';

const FoodDetailModal = ({ food, onClose }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [spiceLevel, setSpiceLevel] = useState(food.spice_level);
  const [customizations, setCustomizations] = useState({
    removeIngredients: [],
    addExtras: [],
    specialInstructions: ''
  });
  const [showIngredients, setShowIngredients] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);

  const spiceInfo = SPICE_LEVELS[spiceLevel] || SPICE_LEVELS[0];

  const allergenTypes = food.ingredients
    ?.filter((ing) => ing.allergen_type)
    .map((ing) => ing.allergen_type)
    .filter((value, index, self) => self.indexOf(value) === index) || [];

  const ingredients = food.ingredients || [
    'Premium ingredients',
    'Fresh herbs',
    'Chef\'s special blend'
  ];

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      if (confirm('Please login to add items to cart.')) {
        navigate('/login');
      }
      return;
    }

    const customizedFood = {
      ...food,
      quantity,
      customizations: {
        spiceLevel: spiceLevel !== food.spice_level ? SPICE_LEVELS[spiceLevel] : null,
        removeIngredients: customizations.removeIngredients,
        addExtras: customizations.addExtras,
        specialInstructions: customizations.specialInstructions
      }
    };

    for (let i = 0; i < quantity; i++) {
      addToCart(customizedFood);
    }

    toast.success(`${quantity}x ${food.name} added to cart!`);
    onClose();
  };

  const toggleIngredientRemoval = (ingredient) => {
    setCustomizations(prev => ({
      ...prev,
      removeIngredients: prev.removeIngredients.includes(ingredient)
        ? prev.removeIngredients.filter(i => i !== ingredient)
        : [...prev.removeIngredients, ingredient]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card max-w-6xl w-full my-8 overflow-hidden relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-3 bg-brand-dark/80 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-brand-dark transition-all"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative h-96 lg:h-auto overflow-hidden bg-surface-dark">
            {food.image_url ? (
              <img
                src={food.image_url}
                alt={food.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white/10 font-display text-6xl">Gourmet</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent" />

            {/* Floating Badges */}
            <div className="absolute top-6 left-6 flex flex-wrap gap-3">
              {food.is_vegetarian && (
                <div className="px-4 py-2 bg-green-500/90 backdrop-blur-md text-white rounded-full flex items-center gap-2 shadow-lg">
                  <Leaf size={16} />
                  <span className="text-xs font-bold uppercase">Vegetarian</span>
                </div>
              )}
              {food.is_vegan && (
                <div className="px-4 py-2 bg-green-600/90 backdrop-blur-md text-white rounded-full flex items-center gap-2 shadow-lg">
                  <ShieldCheck size={16} />
                  <span className="text-xs font-bold uppercase">Vegan</span>
                </div>
              )}
              {food.is_gluten_free && (
                <div className="px-4 py-2 bg-gold/90 backdrop-blur-md text-brand-dark rounded-full flex items-center gap-2 shadow-lg">
                  <Wheat size={16} />
                  <span className="text-xs font-bold uppercase">Gluten Free</span>
                </div>
              )}
              {food.average_rating >= 4.5 && (
                <div className="px-4 py-2 bg-purple-500/90 backdrop-blur-md text-white rounded-full flex items-center gap-2 shadow-lg">
                  <Star size={16} fill="white" />
                  <span className="text-xs font-bold uppercase">Popular</span>
                </div>
              )}
            </div>

            {/* Price Tag */}
            <div className="absolute bottom-6 right-6 px-6 py-3 bg-gold backdrop-blur-md text-brand-dark rounded-2xl shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-widest mb-1">Price</p>
              <p className="text-3xl font-black">${food.price}</p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 lg:p-12 overflow-y-auto max-h-[80vh]">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-0.5 w-12 bg-gold rounded-full" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Chef's Specialty</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-display font-extrabold text-white mb-4 leading-tight">
                {food.name}
              </h2>
              <p className="text-gray-300 leading-relaxed text-lg font-light italic">
                "{food.description}"
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-gold mb-2">
                  <Clock size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Prep Time</span>
                </div>
                <div className="text-2xl font-black">{food.preparation_time || 15} min</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <Zap size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Calories</span>
                </div>
                <div className="text-2xl font-black">{food.calories || '---'} kcal</div>
              </div>
            </div>

            {/* Spice Level Customization */}
            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                <Flame size={16} className="text-red-500" /> Spice Level Preference
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setSpiceLevel(level)}
                    className={`p-3 rounded-xl border-2 transition-all text-sm font-bold uppercase
                      ${spiceLevel === level
                        ? 'border-red-500 bg-red-500/20 text-red-500'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}
                  >
                    {SPICE_LEVELS[level].emoji} {SPICE_LEVELS[level].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="mb-8">
              <button
                onClick={() => setShowIngredients(!showIngredients)}
                className="w-full flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
              >
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300 flex items-center gap-2">
                  <Info size={16} /> Full Ingredients List
                </h3>
                {showIngredients ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {showIngredients && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-4 space-y-2"
                >
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-gray-300">{ingredient}</span>
                      <button
                        onClick={() => toggleIngredientRemoval(ingredient)}
                        className={`text-xs font-bold uppercase px-3 py-1 rounded-full transition-all
                          ${customizations.removeIngredients.includes(ingredient)
                            ? 'bg-red-500 text-white'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                      >
                        {customizations.removeIngredients.includes(ingredient) ? 'Removed' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Allergen Warning */}
            {allergenTypes.length > 0 && (
              <div className="p-6 rounded-2xl bg-red-500/10 border-2 border-red-500/30 mb-8">
                <div className="flex items-center gap-3 text-red-500 mb-3">
                  <AlertTriangle size={24} />
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Allergy Alert</h3>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  This dish contains <span className="text-white font-bold">{allergenTypes.join(', ')}</span>.
                  Please inform our staff if you have any allergies.
                </p>
              </div>
            )}

            {/* Special Instructions */}
            <div className="mb-8">
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <MessageSquare size={16} /> Special Instructions (Optional)
              </label>
              <textarea
                placeholder="e.g., Extra sauce, no onions, less salt..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none h-24 resize-none"
                value={customizations.specialInstructions}
                onChange={(e) => setCustomizations(prev => ({ ...prev, specialInstructions: e.target.value }))}
              />
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <Minus size={20} />
                </button>
                <span className="text-3xl font-black w-16 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Total Price */}
            <div className="p-6 bg-gold/10 border border-gold/20 rounded-2xl mb-8">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold uppercase tracking-widest text-gray-300">Total</span>
                <span className="text-4xl font-black text-gold">${(food.price * quantity).toFixed(2)}</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAddToCart}
              className="w-full premium-button !py-5 text-base tracking-[0.2em] flex items-center justify-center gap-3 group"
            >
              <ShoppingCart size={20} />
              Add to Cart
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>

            {/* Tourist-Friendly Note */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-300 text-center flex items-center justify-center gap-2">
                <Info size={14} />
                Need help? Our multilingual staff is here to assist you!
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FoodDetailModal;
