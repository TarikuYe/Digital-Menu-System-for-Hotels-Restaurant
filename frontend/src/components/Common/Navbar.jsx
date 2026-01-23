import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Utensils, ClipboardList, LayoutDashboard, Flame, LogOut, User as UserIcon, ChefHat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/menu', label: 'Menu', icon: <Utensils size={18} /> },
    { to: '/orders', label: 'My Orders', icon: <ClipboardList size={18} />, auth: true },
    { to: '/kitchen', label: 'Kitchen', icon: <ChefHat size={18} />, staff: true },
    { to: '/admin', label: 'Admin', icon: <LayoutDashboard size={18} />, admin: true },
  ];

  const isStaff = user?.role === 'staff' || user?.role === 'kitchen' || user?.role === 'manager' || isAdmin;

  return (
    <nav className="bg-brand-dark/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-8">
            <Link to="/menu" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                <Utensils size={20} />
              </div>
              <span className="text-xl font-display font-black text-white tracking-tighter">
                Gourmet<span className="text-gold">OS</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                if (link.auth && !isAuthenticated) return null;
                if (link.admin && !isAdmin) return null;
                if (link.staff && !isStaff) return null;

                const isActive = location.pathname === link.to;

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2
                      ${isActive
                        ? 'text-white bg-white/10'
                        : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {link.icon}
                    {link.label}
                    {link.label === 'My Orders' && getItemCount() > 0 && (
                      <span className="bg-accent-red text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                        {getItemCount()}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-gold rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4 pl-4 border-l border-white/5">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-sm font-black text-white leading-none mb-1">{user?.full_name}</span>
                  <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">{user?.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-accent-red hover:bg-accent-red/10 transition-all"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="premium-button !py-2.5 !px-6 text-xs uppercase tracking-widest flex items-center gap-2"
              >
                <UserIcon size={16} />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

