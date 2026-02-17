import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from './StatCard';
import FinancialChart from './FinancialChart';
import ActivityFeed from './ActivityFeed';
import QuickActions from './QuickActions';
import Modal from './Modal';
import Toast from './Toast';
import { RECENT_ACTIVITY } from '../constants';
import { ActivityItem, ToastMessage, User } from '../types';

type ModalType = 'resident' | 'notice' | 'ticket' | null;

interface DashboardProps {
    user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const isAdmin = user.role === 'admin';

  // --- Estados de Dados ---
  const [stats, setStats] = useState({
    revenue: 42500,
    delinquency: 4,
    tickets: 8,
    ticketsUrgent: 2,
    reservations: 5
  });
  
  // Stats do Morador (Mock)
  const residentStats = {
    nextBill: 'R$ 850,00',
    dueDate: '10/12',
    myTickets: 1,
    myReservations: 1
  };

  // FILTRO DE SEGURANÇA (LGPD): Morador vê apenas notificações do sistema ou seus próprios dados.
  // Em produção, isso viria filtrado do backend. Aqui filtramos o mock.
  const initialActivities = isAdmin 
    ? RECENT_ACTIVITY 
    : RECENT_ACTIVITY.filter(item => {
        // Morador vê apenas avisos do sistema ou itens resolvidos gerais (não sensíveis)
        // Oculta pagamentos de terceiros e chamados específicos de outras unidades
        if (item.type === 'payment') return false; 
        if (item.type === 'maintenance') return false;
        if (item.type === 'reservation' && item.action === 'Aprovar') return false; // Oculta solicitações pendentes de outros
        return true; 
      }).map(item => ({
        ...item,
        // Remove ações administrativas da view do morador se sobrarem
        action: isAdmin ? item.action : undefined,
        actionPrimary: isAdmin ? item.actionPrimary : undefined
      }));

  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // --- Estados de UI ---
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [formData, setFormData] = useState<any>({});

  // --- Funções Auxiliares ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleActivityAction = (id: number, action: string) => {
    if (action === 'Aprovar') {
       if (!isAdmin) return; // Segurança extra
       setActivities(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, action: undefined, actionPrimary: false, title: 'Reserva Aprovada', description: 'Salão de Festas reservado com sucesso.', badgeColor: 'bg-emerald-500', icon: 'check_circle' };
        }
        return item;
      }));
      setStats(prev => ({...prev, reservations: Math.max(0, prev.reservations - 1)}));
      showToast('Reserva aprovada com sucesso!');
    } else if (action === 'Ver') {
      navigate('/tickets');
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal === 'resident') {
      showToast(`Convite enviado para ${formData.email}!`);
    } else if (activeModal === 'notice') {
      showToast('Comunicado publicado e enviado por e-mail.');
    } else if (activeModal === 'ticket') {
      const isUrgent = formData.priority === 'high';
      setStats(prev => ({
        ...prev, tickets: prev.tickets + 1, ticketsUrgent: isUrgent ? prev.ticketsUrgent + 1 : prev.ticketsUrgent
      }));
      showToast('Chamado de manutenção aberto com sucesso!');
    }
    setActiveModal(null);
    setFormData({});
  };

  return (
    <div className="space-y-6 relative">
      <div className="fixed bottom-0 right-0 z-50 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>

      {/* Stats Grid - Renderização Condicional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin ? (
            <>
                <StatCard icon="attach_money" iconBg="bg-primary/10" iconColor="text-primary" trend="12%" trendPositive={true} title="Receita Mensal" value={`R$ ${stats.revenue.toLocaleString()}`} subtitle="vs. R$ 37.950 mês passado" onClick={() => navigate('/financial')} />
                <StatCard icon="warning" iconBg="bg-amber-50 dark:bg-amber-900/20" iconColor="text-amber-500" trendLabel="Atenção" isAttention={true} title="Taxa de Inadimplência" value="3.2%" subtitle={`${stats.delinquency} Unidades atrasadas > 30 dias`} onClick={() => navigate('/financial')} />
                <StatCard icon="handyman" iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-500" title="Chamados Abertos" value={stats.tickets} subValue={`${stats.ticketsUrgent} Urgentes`} subtitle="Manutenção Geral" onClick={() => navigate('/tickets')} />
                <StatCard icon="event" iconBg="bg-purple-50 dark:bg-purple-900/20" iconColor="text-purple-500" title="Reservas Pendentes" value={stats.reservations} subtitle="Solicitações aguardando" isAction={stats.reservations > 0} onActionClick={() => navigate('/reservations')} onClick={() => navigate('/reservations')} />
            </>
        ) : (
            <>
                <StatCard icon="receipt_long" iconBg="bg-primary/10" iconColor="text-primary" title="Próximo Boleto" value={residentStats.nextBill} subtitle={`Vence em ${residentStats.dueDate}`} isAction={true} onActionClick={() => navigate('/financial')} onClick={() => navigate('/financial')} />
                <StatCard icon="confirmation_number" iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-500" title="Meus Chamados" value={residentStats.myTickets} subtitle="1 Em andamento" onClick={() => navigate('/tickets')} />
                <StatCard icon="event_available" iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconColor="text-emerald-500" title="Minhas Reservas" value={residentStats.myReservations} subtitle="1 Aprovada para Dezembro" onClick={() => navigate('/reservations')} />
                <StatCard icon="campaign" iconBg="bg-purple-50 dark:bg-purple-900/20" iconColor="text-purple-500" title="Comunicados" value="3" subtitle="Novos avisos esta semana" onClick={() => navigate('/communication')} />
            </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[460px]">
        {/* Gráfico Financeiro apenas para Admin. Morador vê feed maior ou outra info. */}
        {isAdmin ? (
            <FinancialChart />
        ) : (
            <div className="lg:col-span-2 bg-white dark:bg-[#1A2234] rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center justify-center text-center">
                <img src="https://cdni.iconscout.com/illustration/premium/thumb/community-building-2890209-2408557.png" alt="Community" className="h-48 opacity-80 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bem-vindo ao seu lar, {user.name.split(' ')[0]}!</h3>
                <p className="text-slate-500 max-w-md mt-2">Utilize o menu lateral para acessar seus boletos, abrir chamados de manutenção ou reservar áreas comuns. Fique atento aos comunicados no painel ao lado.</p>
                <button onClick={() => setActiveModal('ticket')} className="mt-6 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors">Abrir Chamado</button>
            </div>
        )}
        
        <ActivityFeed 
          activities={activities} 
          onAction={handleActivityAction} 
          onViewAll={() => navigate('/communication')}
        />
      </div>

      {/* Ações Rápidas diferenciadas */}
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
            {isAdmin ? (
                <>
                    <button onClick={() => setActiveModal('resident')} className="bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 active:scale-95">
                        <span className="material-icons text-[18px]">add</span> Novo Morador
                    </button>
                    <button onClick={() => setActiveModal('notice')} className="bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 active:scale-95">
                        <span className="material-icons text-[18px]">campaign</span> Enviar Comunicado
                    </button>
                </>
            ) : (
                <button onClick={() => navigate('/reservations')} className="bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 active:scale-95">
                    <span className="material-icons text-[18px]">calendar_today</span> Reservar Espaço
                </button>
            )}
            <button onClick={() => setActiveModal('ticket')} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/30 flex items-center gap-2 active:scale-95">
                <span className="material-icons text-[18px]">add_circle</span> Criar Chamado
            </button>
        </div>
      </div>
      
      <div className="h-8"></div>

      {/* Modals */}
      {isAdmin && (
        <>
            <Modal isOpen={activeModal === 'resident'} onClose={() => setActiveModal(null)} title="Novo Morador" onSubmit={handleModalSubmit} submitLabel="Enviar Convite">
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label><input name="name" onChange={handleInputChange} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" required /></div>
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidade</label><input name="unit" onChange={handleInputChange} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" required /></div>
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label><input name="email" onChange={handleInputChange} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" required /></div>
                </div>
            </Modal>
            <Modal isOpen={activeModal === 'notice'} onClose={() => setActiveModal(null)} title="Novo Comunicado" onSubmit={handleModalSubmit} submitLabel="Publicar">
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label><input name="title" onChange={handleInputChange} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" required /></div>
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mensagem</label><textarea name="message" onChange={handleInputChange} rows={4} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" required /></div>
                </div>
            </Modal>
        </>
      )}

      <Modal isOpen={activeModal === 'ticket'} onClose={() => setActiveModal(null)} title="Abrir Chamado" onSubmit={handleModalSubmit} submitLabel="Criar Chamado">
        <div className="space-y-4">
           <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Área / Local</label><select name="area" onChange={handleInputChange} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"><option>Área Comum</option><option>Elevadores</option><option>Minha Unidade</option></select></div>
           <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label><textarea name="description" onChange={handleInputChange} rows={3} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" required /></div>
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"><input type="radio" name="priority" value="low" onChange={handleInputChange} className="text-primary focus:ring-primary" /> Baixa</label>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"><input type="radio" name="priority" value="medium" onChange={handleInputChange} className="text-primary focus:ring-primary" defaultChecked /> Média</label>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"><input type="radio" name="priority" value="high" onChange={handleInputChange} className="text-red-500 focus:ring-red-500" /> Alta</label>
              </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;