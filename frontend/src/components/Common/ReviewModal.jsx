
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, onSubmit, foodName, loading }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ rating, comment });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.form
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="relative w-full max-w-md bg-surface border border-white/10 rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-xl font-bold font-display text-white">
                            Review <span className="text-gold">{foodName}</span>
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex flex-col items-center gap-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-widest">Rate your experience</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <Star
                                            size={32}
                                            className={`${(hoverRating || rating) >= star ? 'fill-gold text-gold' : 'text-gray-600'
                                                } transition-colors`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm font-bold text-gold">
                                {['Terrible', 'Bad', 'Average', 'Good', 'Excellent'][(hoverRating || rating) - 1]}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 uppercase tracking-widest">Your Feedback</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us what you liked or how we can improve..."
                                className="w-full h-32 bg-brand-dark/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-gold focus:ring-1 focus:ring-gold outline-none resize-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="premium-button px-6 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </motion.form>
            </div>
        </AnimatePresence>
    );
};

export default ReviewModal;
