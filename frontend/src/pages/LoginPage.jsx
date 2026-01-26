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
        // Redirect to role-specific dashboard
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
        // Redirect to role-specific dashboard
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
    <div className="min-h-screen flex items-center justify-center bg-brand-dark relative overflow-hidden px-4">
      {/* Abstract brand-dark Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] -ml-48 -mb-48" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gold/10 border border-gold/20 text-gold mb-8 shadow-[0_0_30px_rgba(212,175,55,0.15)]"
          >
            <Star size={40} />
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-display font-black text-white mb-4 tracking-tighter">
            Welcome <span className="text-gold">Home</span>
          </h2>
          <p className="text-white/50 font-medium tracking-wide text-sm">
            {isLogin ? 'Enter your credentials to access the world class menu.' : 'Join the elite list for an exquisite culinary journey.'}
          </p>
        </div>

        <div className="glass-card p-10 md:p-12">
          {/* Form Content */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                  <input
                    name="full_name"
                    type="text"
                    required
                    className="premium-input w-full pl-12 placeholder:text-white/20"
                    placeholder="FULL NAME"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                <input
                  name="email"
                  type="email"
                  required
                  className="premium-input w-full pl-12 placeholder:text-white/20"
                  placeholder="EMAIL ADDRESS"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                <input
                  name="password"
                  type="password"
                  required
                  className="premium-input w-full pl-12 placeholder:text-white/20"
                  placeholder="SECRET PASSWORD"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {!isLogin && (
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                  <input
                    name="phone"
                    type="tel"
                    className="premium-input w-full pl-12 placeholder:text-white/20"
                    placeholder="PHONE (OPTIONAL)"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="premium-button w-full !py-5 flex items-center justify-center gap-3 group text-sm"
            >
              {loading ? 'Processing...' : isLogin ? 'Authenticate' : 'Establish Account'}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />}
            </button>

            <div className="text-center pt-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-white/40 hover:text-gold text-xs font-bold uppercase tracking-widest transition-all"
              >
                {isLogin ? "New Member? Register Here" : 'Existing Member? Access Now'}
              </button>
            </div>
          </form>
        </div>

        {/* Guest Access Shortcut */}
        {isLogin && (
          <div className="mt-12 text-center">
            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] mb-6 animate-pulse">Guest Experience</p>
            <button
              onClick={() => navigate('/menu')}
              className="px-8 py-3 rounded-2xl border border-white/5 bg-white/5 text-white/50 text-xs font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl"
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

