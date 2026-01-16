import React from 'react';

export const Input = ({
    label,
    error,
    icon: Icon,
    className = '',
    ...props
}) => {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    className={`
            w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow
            ${error
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-slate-200 focus:border-blue-500 hover:border-slate-300'
                        }
            ${Icon ? 'pl-10' : ''}
          `}
                    {...props}
                />
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Icon size={18} />
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
};
