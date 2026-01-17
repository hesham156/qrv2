import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { chatWithProfileAI } from '../../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileChatbot({ profileData, themeColor, t }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim() || loading) return;

        const userMsg = message;
        setMessage('');

        // 1. Update UI history immediately
        const newMsg = { role: 'user', parts: [{ text: userMsg }] };
        setChatHistory(prev => [...prev, newMsg]);
        setLoading(true);

        try {
            const profileContext = {
                name: profileData.name_en || profileData.name || "this professional",
                jobTitle: profileData.jobTitle_en || profileData.jobTitle,
                bio: profileData.bio_en || profileData.bio,
                skills: profileData.skills || [],
                products: [...(profileData.products || []), ...(profileData.portfolio || [])]
            };

            // 2. We pass the old history to the API
            const aiResponse = await chatWithProfileAI(userMsg, profileContext, chatHistory);

            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: aiResponse }] }]);
        } catch (error) {
            console.error("Chat Error:", error);
            let errorText = t?.errorMsg || "Sorry, I'm having trouble connecting right now.";

            // Debug info
            if (error.message) {
                errorText += `\n\n(Debug: ${error.message})`;
            }

            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: errorText }] }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[60]">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[350px] sm:w-[400px] flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between border-b" style={{ backgroundColor: themeColor }}>
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Ask AI about {profileData.name || 'Profile'}</h4>
                                    <div className="flex items-center gap-1 text-[10px] text-white/80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        Online & Helpful
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="h-[400px] overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {chatHistory.length === 0 && (
                                <div className="text-center py-8 px-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Sparkles size={24} />
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium">Hello! How can I help you today?</p>
                                    <p className="text-xs text-slate-400 mt-1">You can ask about my skills, projects, or how to contact me.</p>
                                </div>
                            )}

                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                        : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                                        }`}>
                                        {msg.parts[0].text}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl border border-slate-100 rounded-tl-none flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 border-t bg-white">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your question..."
                                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !message.trim()}
                                    className="p-2 rounded-xl text-white transition-all transform active:scale-95 disabled:opacity-50"
                                    style={{ backgroundColor: themeColor }}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Float Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white relative group"
                style={{ backgroundColor: themeColor }}
            >
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                <MessageSquare size={24} />
                <div className="absolute right-full mr-3 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity font-bold">
                    Talk to my AI 🪄
                </div>
            </motion.button>
        </div>
    );
}
