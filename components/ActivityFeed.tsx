import React from 'react';
import { ActivityItem } from '../types';

interface ActivityFeedProps {
  activities: ActivityItem[];
  onAction: (id: number, actionType: string) => void;
  onViewAll?: () => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onAction, onViewAll }) => {
  return (
    <div className="lg:col-span-1 bg-white dark:bg-[#1A2234] rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-0 flex flex-col h-[460px]">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Avisos Recentes</h3>
        <button 
          onClick={onViewAll}
          className="text-xs font-semibold text-primary hover:text-primary-dark"
        >
          Ver Todos
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activities.map((item: ActivityItem) => (
          <div key={item.id} className="group flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            {item.image ? (
              <div className="relative">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className={`w-10 h-10 rounded-full object-cover ${item.grayscale ? 'grayscale opacity-70' : ''}`}
                />
                <div className={`absolute -bottom-1 -right-1 ${item.badgeColor} rounded-full p-0.5 border-2 border-white dark:border-[#1A2234]`}>
                  <span className={`material-icons text-[10px] ${item.iconColor} block`}>{item.icon}</span>
                </div>
              </div>
            ) : (
              <div className={`relative w-10 h-10 rounded-full ${item.fallbackColor} flex items-center justify-center`}>
                <span className="material-icons text-[20px]">{item.fallbackIcon}</span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                {item.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">{item.time}</span>
            </div>
            
            {item.action && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(item.id, item.action!);
                }}
                className={`text-xs px-2 py-1 rounded transition-colors active:scale-95 ${
                  item.actionPrimary 
                    ? 'bg-primary text-white hover:bg-primary-dark' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.action}
              </button>
            )}
          </div>
        ))}
        {activities.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <span className="material-icons text-4xl mb-2">notifications_off</span>
            <p className="text-sm">Nenhuma atividade recente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;