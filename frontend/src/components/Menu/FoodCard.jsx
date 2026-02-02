import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Info, Flame, Leaf, Wheat, Clock, Heart, Star as StarIcon, Plus, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { SPICE_LEVELS } from '../../utils/constants.js';
import toast from 'react-hot-toast';
import FoodDetailModal from './FoodDetailModal.jsx';

const FoodCard = React.forwardRef(({ food }, ref) => {
  const [showDetail, setShowDetail] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const spiceInfo = SPICE_LEVELS[food.spice_level] || SPICE_LEVELS[0];

  return (
    <>
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        className="group relative bg-[#121212] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-gold/20 transition-all duration-500 shadow-2xl"
      >
        {/* Image Section */}
        <div className="relative aspect-[4/4.5] overflow-hidden">
          {food.image_url ? (
            <img
              src={food.image_url}
              alt={food.name}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
              }}
            />
          ) : (
            <div className="w-full h-full bg-surface-light flex items-center justify-center">
              <span className="text-white/20 font-display text-4xl">Gourmet</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
            <div className="flex flex-wrap gap-2">
              {food.is_vegetarian && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-[8px] font-black uppercase tracking-wider text-white border border-emerald-400/20">
                  Vegetarian
                </span>
              )}
              {food.is_vegan && (
                <span className="px-3 py-1 rounded-full bg-blue-500/80 backdrop-blur-md text-[8px] font-black uppercase tracking-wider text-white border border-blue-400/20">
                  Vegan
                </span>
              )}
            </div>
            {food.is_gluten_free && (
              <span className="px-3 py-1 rounded-full bg-cyan-500/80 backdrop-blur-md text-[8px] font-black uppercase tracking-wider text-white border border-cyan-400/20">
                Gluten-Free
              </span>
            )}
          </div>

          {/* Bottom Content Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="flex justify-between items-end gap-4 mb-4">
              <div>
                <h3 className="text-lg font-display font-black text-white leading-tight">
                  {food.name}
                </h3>
              </div>
              <div className="text-xl font-black text-gold">
                ${food.price}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDetail(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-full transition-all group/btn"
              >
                <Info size={16} className="text-white/60 group-hover/btn:text-white" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Details</span>
              </button>

              <button
                onClick={() => {
                  addToCart(food);
                  toast.success(`${food.name} added to cart!`);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-black px-4 py-2.5 rounded-full transition-all active:scale-95"
              >
                <ShoppingCart size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Order Now</span>
              </button>
            </div>
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

