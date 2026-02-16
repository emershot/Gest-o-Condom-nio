import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UserData {
    name: string;
    role: string;
    avatar: string;
}

interface SidebarProps {
  isOpen: boolean;
  closeMobileSidebar: () => void;
  user: UserData;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeMobileSidebar, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
    closeMobileSidebar();
  };

  const isActive = (path: string) => {
    // Verifica se o path atual corresponde ao botão
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getButtonClass = (path: string) => {
    const active = isActive(path);
    return `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-colors ${
      active 
        ? 'bg-primary/10 text-primary' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 group'
    }`;
  };

  const getIconClass = (path: string) => {
    const active = isActive(path);
    return `material-icons text-[20px] ${active ? '' : 'text-slate-400 group-hover:text-primary transition-colors'}`;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}
      
      <aside 
        className={`w-64 bg-white dark:bg-[#1A2234] border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed inset-y-0 z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <span className="material-icons">apartment</span>
            CondoFlow
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <button 
            onClick={() => handleNav('/')}
            className={getButtonClass('/')}
          >
            <span className={getIconClass('/')}>dashboard</span>
            Dashboard
          </button>
          
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Gestão</div>
          
          <button 
            onClick={() => handleNav('/directory')}
            className={getButtonClass('/directory')}
          >
            <span className={getIconClass('/directory')}>home_work</span>
            Unidades
          </button>
          
          <button 
            onClick={() => handleNav('/reservations')}
            className={getButtonClass('/reservations')}
          >
            <span className={getIconClass('/reservations')}>calendar_month</span>
            Reservas
            <span className="ml-auto bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">2</span>
          </button>
          
          <button 
            onClick={() => handleNav('/communication')}
            className={getButtonClass('/communication')}
          >
            <span className={getIconClass('/communication')}>forum</span>
            Comunicação
          </button>
          
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Operacional</div>
          
          <button 
            onClick={() => handleNav('/financial')}
            className={getButtonClass('/financial')}
          >
            <span className={getIconClass('/financial')}>account_balance_wallet</span>
            Financeiro
          </button>
          
          <button 
            onClick={() => handleNav('/tickets')}
            className={getButtonClass('/tickets')}
          >
            <span className={getIconClass('/tickets')}>build</span>
            Chamados
            <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">2</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
            <button 
              onClick={() => handleNav('/settings')}
              className={`p-1.5 rounded-lg transition-colors ${isActive('/settings') ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Configurações"
            >
              <span className="material-icons text-[20px]">settings</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;