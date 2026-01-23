import React from 'react';
import { motion } from 'framer-motion';
import { X, Flame, Clock, Zap, AlertTriangle, Check, ShieldCheck } from 'lucide-react';
import { SPICE_LEVELS } from '../../utils/constants.js';

const FoodDetailModal = ({ food, onClose }) => {
  const spiceInfo = SPICE_LEVELS[food.spice_level] || SPICE_LEVELS[0];

  const allergenTypes = food.ingredients
    ?.filter((ing) => ing.allergen_type)
    .map((ing) => ing.allergen_type)
    .filter((value, index, self) => self.indexOf(value) === index) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-dark/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 md:p-8"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-brand-dark/50 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-brand-dark/80 transition-all"
        >
          <X size={20} />
        </button>

        {/* Image Section */}
        <div className="md:w-1/2 h-64 md:h-auto overflow-hidden bg-surface-dark relative">
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
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/80 via-transparent to-transparent md:bg-gradient-to-r" />
        </div>

        {/* Content Section */}
        <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-0.5 w-8 bg-gold rounded-full" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Chef's Specialty</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-4 leading-tight">
              {food.name}
            </h2>
            <div className="flex items-center gap-4 text-2xl font-bold text-gold">
              ${food.price}
            </div>
          </div>

          <div className="space-y-8">
            {/* Description */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Description</h3>
              <p className="text-gray-300 leading-relaxed text-lg font-light italic">
                "{food.description}"
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-gold mb-1">
                  <Clock size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Prep Time</span>
                </div>
                <div className="text-lg font-bold">{food.preparation_time || 15} min</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-accent-amber mb-1">
                  <Zap size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Calories</span>
                </div>
                <div className="text-lg font-bold">{food.calories || '---'} kcal</div>
              </div>
            </div>

            {/* Dietary Selection */}
            <div className="flex flex-wrap gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 ${food.spice_level >= 3 ? 'bg-accent-red/10 text-accent-red border-accent-red/20' : 'bg-white/5 text-gray-300'}`}>
                <Flame size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">{spiceInfo.label} Heat</span>
              </div>
              {food.is_vegetarian && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
                  <ShieldCheck size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Vegetarian</span>
                </div>
              )}
              {food.is_gluten_free && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold border border-gold/20">
                  <Check size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Gluten Free</span>
                </div>
              )}
            </div>

            {/* Allergen & Ingredients */}
            {allergenTypes.length > 0 && (
              <div className="p-6 rounded-2xl bg-accent-red/5 border border-accent-red/20">
                <div className="flex items-center gap-2 text-accent-red mb-3">
                  <AlertTriangle size={18} />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Allergy Information</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed font-light">
                  This delicacy contains <span className="text-white font-medium">{allergenTypes.join(', ')}</span>. Please consult our staff for personalized safety adjustments.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-6">
              <button className="w-full premium-button !py-4 text-sm tracking-[0.2em] flex items-center justify-center gap-3 group">
                Add to your order
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FoodDetailModal;

