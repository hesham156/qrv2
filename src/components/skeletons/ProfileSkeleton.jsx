import React from 'react';

export default function ProfileSkeleton() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="w-full max-w-md bg-white/90 backdrop-blur border border-white/40 rounded-3xl shadow-xl overflow-hidden relative">

                {/* Header Skeleton */}
                <div className="h-44 bg-slate-200 animate-pulse relative">
                    <div className="absolute top-4 left-4 w-24 h-8 bg-slate-300 rounded-2xl"></div>
                    <div className="absolute top-4 right-4 w-20 h-8 bg-slate-300 rounded-2xl"></div>
                </div>

                <div className="relative px-6 pb-8">
                    {/* Avatar Skeleton */}
                    <div className="absolute right-1/2 translate-x-1/2 -top-12 w-24 h-24 rounded-3xl border-4 border-white bg-slate-200 animate-pulse"></div>

                    {/* Info Skeleton */}
                    <div className="mt-16 text-center space-y-3 flex flex-col items-center">
                        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
                        <div className="h-4 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
                    </div>

                    {/* Social Icons Skeleton */}
                    <div className="flex justify-center gap-3 mt-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-10 h-10 rounded-2xl bg-slate-200 animate-pulse"></div>
                        ))}
                    </div>

                    {/* Action Buttons Skeleton */}
                    <div className="grid grid-cols-2 gap-3 mt-8">
                        <div className="h-14 bg-slate-200 rounded-2xl animate-pulse"></div>
                        <div className="h-14 bg-slate-200 rounded-2xl animate-pulse"></div>
                        <div className="h-14 bg-slate-200 rounded-2xl animate-pulse col-span-2"></div>
                        <div className="h-14 bg-slate-200 rounded-2xl animate-pulse col-span-2"></div>
                    </div>

                    {/* Tab Buttons Skeleton */}
                    <div className="mt-8 flex gap-2 p-1 bg-slate-100 rounded-2xl">
                        <div className="h-10 flex-1 bg-slate-200 rounded-2xl animate-pulse"></div>
                        <div className="h-10 flex-1 bg-slate-200 rounded-2xl animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
