import React from 'react';

interface QuickActionsProps {
  onNewResident: () => void;
  onNewNotice: () => void;
  onNewTicket: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNewResident, onNewNotice, onNewTicket }) => {
  return (
    <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="bg-primary text-white p-3 rounded-lg shadow-lg shadow-primary/30">
          <span className="material-icons">rocket_launch</span>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">Ações Rápidas</h4>
          <p className="text-sm text-slate-500">Tarefas comuns para economizar seu tempo.</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 justify-center md:justify-end">
        <button 
          onClick={onNewResident}
          className="bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 active:scale-95"
        >
          <span className="material-icons text-[18px]">add</span> Novo Morador
        </button>
        <button 
          onClick={onNewNotice}
          className="bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 active:scale-95"
        >
          <span className="material-icons text-[18px]">campaign</span> Enviar Comunicado
        </button>
        <button 
          onClick={onNewTicket}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/30 flex items-center gap-2 active:scale-95"
        >
          <span className="material-icons text-[18px]">add_circle</span> Criar Chamado
        </button>
      </div>
    </div>
  );
};

export default QuickActions;