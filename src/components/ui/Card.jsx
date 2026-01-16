import React from 'react';

export const Card = ({ children, className = '', noPadding = false, ...props }) => {
    return (
        <div
            className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${noPadding ? '' : 'p-6'} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '' }) => (
    <div className={`mb-4 ${className}`}>
        {children}
    </div>
);

export const CardBody = ({ children, className = '' }) => (
    <div className={className}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = '' }) => (
    <div className={`mt-6 pt-4 border-t border-slate-100 ${className}`}>
        {children}
    </div>
);
