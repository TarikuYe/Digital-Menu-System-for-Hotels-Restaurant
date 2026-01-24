
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
    const [verifying, setVerifying] = useState(true);
    const [table, setTable] = useState(null);
    const [error, setError] = useState(null);
    const [guestName, setGuestName] = useState('');
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                setVerifying(true);
                const response = await guestAPI.verifyToken(token);
                setTable(response.data.table);
                setLoading(false);
            } catch (err) {
                console.error('QR Verification Error:', err);
                setError('Invalid or expired QR code. Please scan again or ask for assistance.');
                setLoading(false);
            } finally {
                setVerifying(false);
            }
        };

        if (token) {
            verifyToken();
        } else {
            setError('No QR token provided.');
            setLoading(false);
        }
    }, [token]);

    const handleStartSession = async (e) => {
        e.preventDefault();
        if (!guestName.trim()) {
            toast.error('Please enter your name to continue');
            return;
        }

        try {
            setIsStarting(true);
            const response = await guestAPI.startSession({
                table_id: table.id,
                guest_name: guestName
            });

            const { session_token, session } = response.data;

            const guestUserData = {
                id: session.id,
                isGuest: true,
                role: 'customer',
                full_name: guestName,
                table_id: table.id,
                table_number: table.table_number
            };

            loginGuest(session_token, guestUserData);

            // Save guest info redundant but maybe useful for recovery if context lost before reload
            localStorage.setItem('guestInfo', JSON.stringify({
                name: guestName,
                tableNumber: table.table_number,
                sessionId: session.id
            }));

            toast.success(`Welcome ${guestName}!`);
            navigate('/menu');
        } catch (err) {
            console.error('Start Session Error:', err);
            toast.error('Failed to start session. Please try again.');
        } finally {
            setIsStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="mt-4 text-base-content/70">Verifying QR Code...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body text-center">
                        <div className="mx-auto bg-error/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                            <AlertCircle className="w-8 h-8 text-error" />
                        </div>
                        <h2 className="card-title justify-center text-error">Scan Error</h2>
                        <p className="py-4">{error}</p>
                        <div className="card-actions justify-center">
                            <button className="btn btn-primary" onClick={() => window.location.reload()}>
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-64 bg-primary/10 rounded-b-[3rem] -z-0"></div>

            <div className="card w-full max-w-md bg-base-100 shadow-2xl z-10 border-t-8 border-primary">
                <div className="card-body items-center text-center">

                    <div className="bg-primary/10 p-4 rounded-full mb-2">
                        <UtensilsCrossed className="w-10 h-10 text-primary" />
                    </div>

                    <h1 className="text-3xl font-bold font-heading text-base-content">Welcome!</h1>
                    <p className="text-base-content/60">We're glad to have you here.</p>

                    <div className="w-full my-6 bg-base-200/50 p-6 rounded-xl border border-base-300">
                        <div className="flex flex-col items-center">
                            <span className="text-sm uppercase tracking-widest text-base-content/50 mb-1">You are seated at</span>
                            <div className="flex items-center gap-2">
                                <span className="text-4xl font-black text-primary">Table {table?.table_number}</span>
                            </div>
                            <p className="text-xs text-base-content/50 mt-2">Capacity: {table?.capacity} Guests</p>
                        </div>
                    </div>

                    <form onSubmit={handleStartSession} className="w-full space-y-4">
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium">What's your name?</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                                <input
                                    type="text"
                                    placeholder="Enter your name (e.g. John)"
                                    className="input input-bordered w-full pl-10 focus:input-primary transition-all"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary w-full btn-lg mt-4 shadow-lg shadow-primary/30 group ${isStarting ? 'loading' : ''}`}
                            disabled={isStarting}
                        >
                            {!isStarting && (
                                <>
                                    Start Ordering <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-xs text-base-content/40 mt-6">
                        By continuing, you agree to our terms of service.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GuestEntry;
