import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Utensils, ClipboardList, LayoutDashboard, Flame, LogOut, User as UserIcon, ChefHat, DollarSign, Globe, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { getRoleDashboard } from '../../utils/roleRedirect.js';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/menu', label: 'Menu', icon: <Utensils size={18} />, roles: ['customer'], showForGuest: true },
    { to: '/orders', label: 'My Orders', icon: <ClipboardList size={18} />, roles: ['customer'], auth: true },
    { to: '/kitchen', label: 'Kitchen', icon: <ChefHat size={18} />, roles: ['kitchen'] },
    { to: '/waiter', label: 'Tables', icon: <ClipboardList size={18} />, roles: ['staff'] },
    { to: '/cashier', label: 'Cashier', icon: <DollarSign size={18} />, roles: ['cashier'] },
    { to: '/manager', label: 'Manager', icon: <LayoutDashboard size={18} />, roles: ['manager'] },
    { to: '/admin', label: 'Admin', icon: <LayoutDashboard size={18} />, roles: ['admin'] },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5 py-4 px-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to={getRoleDashboard(user)} className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gold rounded flex items-center justify-center transform rotate-45 group-hover:rotate-90 transition-transform duration-500">
              <div className="w-4 h-4 border-2 border-black"></div>
            </div>
            <span className="font-display font-black text-lg tracking-tight text-white hidden sm:block">
              Abebe Zeleke <span className="text-gold">Digital Menu</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              if (!isAuthenticated) {
                if (!link.showForGuest) return null;
              } else {
                if (link.roles && (!user || !link.roles.includes(user.role))) {
                  return null;
                }
              }

              const isActive = location.pathname === link.to;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2
                    ${isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  {link.label}
                  {link.label === 'My Orders' && getItemCount() > 0 && (
                    <span className="bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {getItemCount()}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
            <Globe size={16} className="text-[#999]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">English</span>
            <ChevronDown size={14} className="text-[#999]" />
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-4 pl-4 border-l border-white/5">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-black text-white leading-none mb-1">{user?.full_name}</span>
                <span className="text-[8px] font-black text-gold uppercase tracking-[0.2em]">{user?.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-gold px-6 py-2.5 rounded-full text-black font-black text-[10px] uppercase tracking-widest hover:bg-gold-light transition-all shadow-lg shadow-gold/20"
            >
              <UserIcon size={14} />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

