import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from './StatCard';
import FinancialChart from './FinancialChart';
import ActivityFeed from './ActivityFeed';
import QuickActions from './QuickActions';
import Modal from './Modal';
import Toast from './Toast';
import { RECENT_ACTIVITY, IMAGES } from '../constants';
import { ActivityItem, ToastMessage } from '../types';

type ModalType = 'resident' | 'notice' | 'ticket' | null;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // --- Estados de Dados (Simulando Backend) ---
  const [stats, setStats] = useState({
    revenue: 42500,
    delinquency: 4, // Unidades inadimplentes
    tickets: 8,
    ticketsUrgent: 2,
    reservations: 5
  });

  const [activities, setActivities] = useState<ActivityItem[]>(RECENT_ACTIVITY);
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

  // --- Ações de Negócio ---

  const handleActivityAction = (id: number, action: string) => {
    if (action === 'Aprovar') {
      // Atualiza a lista de atividades visualmente
      setActivities(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            action: undefined,
            actionPrimary: false,
            title: 'Reserva Aprovada',
            description: 'Salão de Festas reservado com sucesso.',
            badgeColor: 'bg-emerald-500',
            icon: 'check_circle'
          };
        }
        return item;
      }));
      
      // Atualiza Estatística
      setStats(prev => ({...prev, reservations: Math.max(0, prev.reservations - 1)}));
      showToast('Reserva aprovada com sucesso!');
    } else if (action === 'Ver') {
      // Navega para a página de tickets se for um chamado
      navigate('/tickets');
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Lógica Específica por Tipo de Modal
    if (activeModal === 'resident') {
      const newActivity: ActivityItem = {
        id: Date.now(),
        type: 'system',
        title: 'Novo Morador Cadastrado',
        description: `${formData.name || 'Novo morador'} adicionado à unidade ${formData.unit || '...'}`,
        time: 'Agora mesmo',
        image: null,
        fallbackIcon: 'person_add',
        fallbackColor: 'bg-purple-100 text-purple-500',
        badgeColor: 'bg-purple-500'
      };
      
      setActivities(prev => [newActivity, ...prev]);
      showToast(`Convite enviado para ${formData.email}!`);
    } 
    
    else if (activeModal === 'notice') {
      const newActivity: ActivityItem = {
        id: Date.now(),
        type: 'system',
        title: formData.title || 'Novo Comunicado',
        description: formData.message ? formData.message.substring(0, 40) + '...' : 'Comunicado enviado.',
        time: 'Agora mesmo',
        image: IMAGES.ADMIN_TOM, 
        icon: 'campaign',
        iconColor: 'text-white',
        badgeColor: 'bg-primary'
      };

      setActivities(prev => [newActivity, ...prev]);
      showToast('Comunicado publicado e enviado por e-mail.');
    } 
    
    else if (activeModal === 'ticket') {
      const isUrgent = formData.priority === 'high';
      
      setStats(prev => ({
        ...prev,
        tickets: prev.tickets + 1,
        ticketsUrgent: isUrgent ? prev.ticketsUrgent + 1 : prev.ticketsUrgent
      }));

      const newActivity: ActivityItem = {
        id: Date.now(),
        type: 'maintenance',
        title: 'Novo Chamado Aberto',
        description: `${formData.area}: ${formData.description || 'Solicitação de manutenção'}`,
        time: 'Agora mesmo',
        image: null,
        fallbackIcon: 'build',
        fallbackColor: isUrgent ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500',
        action: 'Ver',
        badgeColor: ''
      };

      setActivities(prev => [newActivity, ...prev]);
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
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => removeToast(toast.id)} 
            />
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon="attach_money"
          iconBg="bg-primary/10"
          iconColor="text-primary"
          trend="12%"
          trendPositive={true}
          title="Receita Mensal"
          value={`R$ ${stats.revenue.toLocaleString()}`}
          subtitle="vs. R$ 37.950 mês passado"
          onClick={() => navigate('/financial')}
        />
        <StatCard 
          icon="warning"
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-500"
          trendLabel="Atenção"
          isAttention={true}
          title="Taxa de Inadimplência"
          value="3.2%"
          subtitle={`${stats.delinquency} Unidades atrasadas > 30 dias`}
          onClick={() => navigate('/financial')}
        />
        <StatCard 
          icon="handyman"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-500"
          title="Chamados de Manutenção"
          value={stats.tickets}
          subValue={`${stats.ticketsUrgent} Urgentes`}
          subtitle="Resolução média: 24h"
          onClick={() => navigate('/tickets')}
        />
        <StatCard 
          icon="event"
          iconBg="bg-purple-50 dark:bg-purple-900/20"
          iconColor="text-purple-500"
          title="Reservas Pendentes"
          value={stats.reservations}
          subtitle={stats.reservations === 0 ? "Tudo em dia!" : "Solicitações aguardando aprovação"}
          isAction={stats.reservations > 0}
          onActionClick={() => navigate('/reservations')}
          onClick={() => navigate('/reservations')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[460px]">
        <FinancialChart />
        <ActivityFeed 
          activities={activities} 
          onAction={handleActivityAction} 
          onViewAll={() => navigate('/communication')}
        />
      </div>

      <QuickActions 
        onNewResident={() => setActiveModal('resident')}
        onNewNotice={() => setActiveModal('notice')}
        onNewTicket={() => setActiveModal('ticket')}
      />
      
      <div className="h-8"></div>

      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'resident'} 
        onClose={() => setActiveModal(null)} 
        title="Novo Morador"
        onSubmit={handleModalSubmit}
        submitLabel="Enviar Convite"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
            <input name="name" onChange={handleInputChange} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Ex: João Silva" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidade</label>
              <input name="unit" onChange={handleInputChange} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Ex: 101-A" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
              <select name="type" onChange={handleInputChange} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all">
                <option>Proprietário</option>
                <option>Inquilino</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <input name="email" onChange={handleInputChange} type="email" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="email@exemplo.com" required />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'notice'} 
        onClose={() => setActiveModal(null)} 
        title="Novo Comunicado"
        onSubmit={handleModalSubmit}
        submitLabel="Publicar"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
            <input name="title" onChange={handleInputChange} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Ex: Manutenção da Piscina" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mensagem</label>
            <textarea name="message" onChange={handleInputChange} rows={4} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Digite o comunicado aqui..." required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="email-notify" name="emailNotify" onChange={handleInputChange} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
            <label htmlFor="email-notify" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">Notificar por e-mail</label>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'ticket'} 
        onClose={() => setActiveModal(null)} 
        title="Abrir Chamado"
        onSubmit={handleModalSubmit}
        submitLabel="Criar Chamado"
      >
        <div className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Área / Local</label>
              <select name="area" onChange={handleInputChange} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all">
                <option>Área Comum</option>
                <option>Elevadores</option>
                <option>Garagem</option>
                <option>Jardim</option>
                <option>Piscina</option>
              </select>
            </div>
            <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição do Problema</label>
            <textarea name="description" onChange={handleInputChange} rows={3} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Descreva o problema..." required />
          </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input type="radio" name="priority" value="low" onChange={handleInputChange} className="text-primary focus:ring-primary" /> Baixa
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input type="radio" name="priority" value="medium" onChange={handleInputChange} className="text-primary focus:ring-primary" defaultChecked /> Média
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input type="radio" name="priority" value="high" onChange={handleInputChange} className="text-red-500 focus:ring-red-500" /> Alta
                </label>
              </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;