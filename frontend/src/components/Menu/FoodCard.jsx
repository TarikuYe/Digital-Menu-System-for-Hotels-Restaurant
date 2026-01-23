import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Info, Flame, Leaf, Wheat, Clock, Heart, Star as StarIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { SPICE_LEVELS } from '../../utils/constants.js';
import FoodDetailModal from './FoodDetailModal.jsx';

const FoodCard = React.forwardRef(({ food }, ref) => {
  const [showDetail, setShowDetail] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const spiceInfo = SPICE_LEVELS[food.spice_level] || SPICE_LEVELS[0];

  const allergenTypes = food.ingredients
    ?.filter((ing) => ing.allergen_type)
    .map((ing) => ing.allergen_type)
    .filter((value, index, self) => self.indexOf(value) === index) || [];

  return (
    <>
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="glass-card overflow-hidden group hover:border-gold/30 transition-colors"
      >
        {/* Image Section */}
        <div className="relative h-56 overflow-hidden">
          {food.image_url ? (
            <img
              src={food.image_url}
              alt={food.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
              }}
            />
          ) : (
            <div className="w-full h-full bg-surface-light flex items-center justify-center">
              <span className="text-white/20 font-display text-4xl">Gourmet</span>
            </div>
          )}

          {/* Badge Overlay */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {food.is_vegetarian && (
              <div className="bg-accent-emerald/90 backdrop-blur-md text-white p-1.5 rounded-lg shadow-lg" title="Vegetarian">
                <Leaf size={16} />
              </div>
            )}
            {food.is_gluten_free && (
              <div className="bg-gold/90 backdrop-blur-md text-brand-dark p-1.5 rounded-lg shadow-lg" title="Gluten Free">
                <Wheat size={16} />
              </div>
            )}
            {food.average_rating >= 4.5 && (
              <div className="bg-accent-amber/90 backdrop-blur-md text-brand-dark px-2 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5" title="Top Choice">
                <StarIcon size={12} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Tourist Favorite</span>
              </div>
            )}
          </div>

          {/* Spice Level Indicator */}
          {food.spice_level > 0 && (
            <div className="absolute bottom-4 left-4 bg-brand-dark/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
              <Flame size={14} className={food.spice_level >= 3 ? 'text-accent-red' : 'text-accent-amber'} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{spiceInfo.label}</span>
            </div>
          )}

          {/* Prep Time */}
          {food.preparation_time && (
            <div className="absolute bottom-4 right-4 bg-brand-dark/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
              <Clock size={14} className="text-white/60" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{food.preparation_time} min</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-2 gap-4">
            <h3 className="text-xl font-display font-bold text-white group-hover:text-gold transition-colors line-clamp-1">
              {food.name}
            </h3>
            <span className="text-xl font-bold text-gold shrink-0">${food.price}</span>
          </div>

          <p className="text-white/50 text-xs mb-6 line-clamp-2 min-h-[32px] leading-relaxed font-medium tracking-wide">
            {food.description}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowDetail(true)}
              className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10 py-3 rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
            >
              <Info size={18} className="text-gray-400 group-hover/btn:text-white transition-colors" />
              <span className="text-xs font-bold uppercase tracking-widest">Details</span>
            </button>
            <button
              onClick={() => {
                if (isAuthenticated) {
                  addToCart(food);
                } else {
                  if (confirm('Please login to add items to cart.')) navigate('/login');
                }
              }}
              className="flex-1 premium-button !p-0 !h-auto flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Add</span>
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetail && (
          <FoodDetailModal food={food} onClose={() => setShowDetail(false)} />
        )}
      </AnimatePresence>
    </>
  );
});

FoodCard.displayName = 'FoodCard';

export default FoodCard;

