
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guestAPI } from '../services/api';
import { QrCode, ArrowRight, User, UtensilsCrossed, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const GuestEntry = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { loginGuest } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [table, setTable] = useState(null);

    useEffect(() => {
        const autoStart = async () => {
            try {
                setLoading(true);
                // 1. Verify QR Token
                const verifyRes = await guestAPI.verifyToken(token);
                const tableInfo = verifyRes.data.table;
                setTable(tableInfo);

                // 2. Automatically Start Session as 'Guest'
                const sessionRes = await guestAPI.startSession({
                    table_id: tableInfo.id,
                    guest_name: 'Guest' // Default name to save time
                });

                const { session } = sessionRes.data;
                const guestUserData = {
                    id: session.id,
                    isGuest: true,
                    role: 'customer',
                    full_name: 'Guest',
                    table_id: tableInfo.id,
                    table_number: tableInfo.table_number
                };

                loginGuest(session.session_token, guestUserData);

                toast.success(`Welcome! You are at Table ${tableInfo.table_number}`);
                navigate('/menu');
            } catch (err) {
                console.error('Guest Entry Error:', err);
                setError(err.response?.data?.error || 'Invalid or expired QR code.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            autoStart();
        } else {
            setError('No table token provided.');
            setLoading(false);
        }
    }, [token, navigate, loginGuest]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-gold rounded-[1.5rem] flex items-center justify-center animate-spin mb-8">
                    <div className="w-6 h-6 border-4 border-black" />
                </div>
                <h2 className="text-2xl font-display font-black text-white mb-2">Establishing Connection</h2>
                <p className="text-[#999] text-sm font-medium">Please wait while we set up your gourmet experience...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
                <div className="bg-[#121212] border border-red-500/20 p-10 rounded-[2.5rem] max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-display font-black text-white mb-4">Connection Failed</h2>
                    <p className="text-[#999] text-sm mb-8 leading-relaxed">{error}</p>
                    <button
                        onClick={() => navigate('/menu')}
                        className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        Browse Menu Anyway
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default GuestEntry;
