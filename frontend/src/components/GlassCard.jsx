import React from 'react';

const GlassCard = ({ children, className = '', hover = true, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-effect rounded-2xl p-6 transition-all duration-300 ${
        hover ? 'hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
