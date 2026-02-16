import React from 'react';

interface StatCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendPositive?: boolean;
  trendLabel?: string;
  title: string;
  value: string | number;
  subtitle: string;
  subValue?: string;
  isAttention?: boolean;
  isAction?: boolean;
  onActionClick?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  iconBg, 
  iconColor, 
  trend, 
  trendPositive,
  trendLabel, 
  title, 
  value, 
  subtitle,
  subValue,
  isAttention,
  isAction,
  onActionClick,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-[#1A2234] p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-primary/30' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 ${iconBg} rounded-lg ${iconColor}`}>
          <span className="material-icons">{icon}</span>
        </div>
        
        {trend && (
          <span className={`flex items-center text-xs font-semibold ${trendPositive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-red-600 bg-red-50'} px-2 py-1 rounded-full`}>
            <span className="material-icons text-[14px] mr-0.5">{trendPositive ? 'trending_up' : 'trending_down'}</span> 
            {trend}
          </span>
        )}
        
        {trendLabel && !trend && (
           <span className={`flex items-center text-xs font-semibold ${isAttention ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' : 'text-slate-600 bg-slate-50'} px-2 py-1 rounded-full`}>
             {trendLabel}
           </span>
        )}

        {isAction && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onActionClick?.(e);
            }}
            className="text-xs font-medium text-primary hover:text-primary-dark hover:underline focus:outline-none z-10 relative"
          >
            Ver Todas
          </button>
        )}
      </div>
      
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className="flex items-end gap-2 mt-1">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
          {subValue && (
            <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded mb-1">{subValue}</span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

export default StatCard;