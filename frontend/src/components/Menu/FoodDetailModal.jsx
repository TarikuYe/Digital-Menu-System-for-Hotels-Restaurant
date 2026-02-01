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

const Accordion = ({ title, content, isOpen, onToggle }) => (
  <div className="border-t border-white/5">
    <button
      onClick={onToggle}
      className="w-full flex justify-between items-center py-4 text-left group"
    >
      <span className="text-sm font-bold uppercase tracking-widest text-[#999] group-hover:text-white transition-colors">{title}</span>
      {isOpen ? <ChevronUp size={18} className="text-[#999]" /> : <ChevronDown size={18} className="text-[#999]" />}
    </button>
    {isOpen && (
      <div className="pb-6">
        {Array.isArray(content) ? (
          <ul className="space-y-3">
            {content.map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm text-[#ccc]">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#ccc] leading-relaxed">{content}</p>
        )}
      </div>
    )}
  </div>
);

const FoodDetailModal = ({ food, onClose }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [spiceLevel, setSpiceLevel] = useState(food.spice_level || 3);
  const [openSection, setOpenSection] = useState('Ingredients');

  const spiceOptions = [
    { label: 'None', level: 0 },
    { label: 'Mild', level: 1 },
    { label: 'Leaf', level: 2 }, // Matches image
    { label: 'Medium', level: 3 },
    { label: 'Hot', level: 4 },
    { label: 'Very Hot', level: 5 },
    { label: 'Extreme', level: 6 }
  ];

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      if (confirm('Please login to add items to cart.')) navigate('/login');
      return;
    }
    const customizedFood = { ...food, customizations: { spiceLevel } };
    addToCart(customizedFood);
    toast.success(`${food.name} added to cart!`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#000]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1a1c] w-full max-w-3xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] relative"
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 text-white/50 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="overflow-y-auto no-scrollbar p-10">
          {/* Header */}
          <div className="mb-8 pr-12">
            <h2 className="text-3xl font-display font-black text-white mb-3">
              {food.name}
            </h2>
            <p className="text-[#999] text-sm leading-relaxed max-w-2xl">
              {food.description || "A rich and aromatic dish, crafted with the finest ingredients and spices."}
            </p>
          </div>

          {/* Large Image */}
          <div className="rounded-3xl overflow-hidden aspect-[16/8] mb-8">
            <img
              src={food.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"}
              alt={food.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Quick Info */}
          <div className="flex items-center gap-6 mb-10">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gold" />
              <span className="text-[#999] text-xs font-bold uppercase tracking-widest">{food.preparation_time || 25} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-gold" />
              <span className="text-[#999] text-xs font-bold uppercase tracking-widest">{food.calories || 680} kcal</span>
            </div>
          </div>

          {/* Spice Level Section */}
          <div className="mb-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6">Spice Level Preference</h3>
            <div className="flex flex-wrap gap-2">
              {spiceOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setSpiceLevel(opt.level)}
                  className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                    ${spiceLevel === opt.level
                      ? 'bg-gold text-black'
                      : 'bg-black/40 text-white border border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center gap-2">
                    {opt.level > 0 && <Flame size={12} className={spiceLevel === opt.level ? 'text-black' : 'text-white/60'} />}
                    {opt.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail Accordions */}
          <div className="space-y-0">
            {[
              { title: 'Ingredients', content: food.details?.ingredients || ['Fresh selection', 'Chef\'s spices', 'Signature sauce'] },
              { title: 'Main Ingredients', content: food.details?.main_ingredients || ['Premium Protein', 'Organic Vegetables'] },
              { title: 'Spices', content: food.details?.spices || ['Turmeric', 'Cumin', 'Coriander', 'Garam Masala', 'Chili Powder', 'Bay Leaves'] },
              { title: 'Garnish', content: food.details?.garnish || ['Fresh Cilantro'] },
              { title: 'Allergens', content: food.details?.allergens || ['None reported'] }
            ].map(section => (
              <Accordion
                key={section.title}
                title={section.title}
                content={section.content}
                isOpen={openSection === section.title}
                onToggle={() => setOpenSection(openSection === section.title ? null : section.title)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 px-10 border-t border-white/5 flex items-center justify-between bg-[#1a1a1c]">
          <div>
            <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest mb-1">Price</p>
            <p className="text-3xl font-black text-gold">${food.price}</p>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-3 bg-gold hover:bg-gold-light text-black px-10 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-gold/10"
          >
            <ShoppingCart size={18} />
            Order Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FoodDetailModal;
