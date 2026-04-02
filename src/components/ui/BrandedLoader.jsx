import React from 'react';
import { motion } from 'framer-motion';

const BrandedLoader = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="relative">
                {/* Outer Glow/Ring */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full"
                />

                {/* Main Logo/Spinner */}
                <div className="relative w-16 h-16">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        className="w-full h-full border-4 border-slate-200 border-t-blue-600 rounded-full"
                    />

                    {/* Inner pulsating logo */}
                    <motion.img
                        src="/logo192.png"
                        alt="Loading"
                        animate={{
                            scale: [0.8, 1, 0.8],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute inset-0 m-auto w-24 h-24 object-contain drop-shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                    />
                </div>
            </div>

            {/* Text Animation */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-slate-400 font-medium tracking-widest text-xs uppercase"
            >
                Loading experience...
            </motion.p>
        </div>
    );
};

export default BrandedLoader;
