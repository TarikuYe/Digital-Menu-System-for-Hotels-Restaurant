import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { authAPI } from '../services/api.js';
import { getRoleDashboard } from '../utils/roleRedirect.js';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboard = getRoleDashboard(user);
      navigate(dashboard, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password,
        });
        login(response.data.token, response.data.user);
        const dashboard = getRoleDashboard(response.data.user);
        navigate(dashboard);
      } else {
        const response = await authAPI.register({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
        });
        login(response.data.token, response.data.user);
        const dashboard = getRoleDashboard(response.data.user);
        navigate(dashboard);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden px-4 font-sans">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] -ml-48 -mb-48 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            animate={{ rotate: [45, 90, 45] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-gold flex items-center justify-center mb-8 shadow-2xl shadow-gold/20"
          >
            <div className="w-8 h-8 border-4 border-black" />
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4 tracking-tighter">
            Abebe Zeleke <br />
            <span className="text-gold">Digital Menu</span>
          </h2>
          <p className="text-[#999] font-medium text-sm">
            {isLogin ? 'Enter your credentials to access the world class menu.' : 'Join the elite list for an exquisite culinary journey.'}
          </p>
        </div>

        <div className="bg-[#121212] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              {!isLogin && (
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-[#555] group-focus-within:text-gold transition-colors" size={18} />
                  <input
                    name="full_name"
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all font-medium text-white"
                    placeholder="FULL NAME"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#555] group-focus-within:text-gold transition-colors" size={18} />
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all font-medium text-white"
                  placeholder="EMAIL ADDRESS"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#555] group-focus-within:text-gold transition-colors" size={18} />
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all font-medium text-white"
                  placeholder="SECRET PASSWORD"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-light text-black py-5 rounded-2xl flex items-center justify-center gap-3 group text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-gold/10 active:scale-[0.98]"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Establish Account'}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />}
            </button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-[#666] hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {isLogin ? "New Member? Register Here" : 'Existing Member? Access Now'}
              </button>
            </div>
          </form>
        </div>

        {/* Guest Access Shortcut */}
        {isLogin && (
          <div className="mt-12 text-center">
            <p className="text-[10px] text-[#444] font-black uppercase tracking-[0.3em] mb-6">Guest Experience</p>
            <button
              onClick={() => navigate('/menu')}
              className="px-10 py-3 rounded-full border border-white/10 bg-white/5 text-white/50 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all"
            >
              Enter as Guest
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};


export default LoginPage;

