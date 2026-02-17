import React, { useState, useEffect, useRef } from 'react';
import StatCard from './StatCard';
import Modal from './Modal';
import Toast from './Toast';
import { ToastMessage, User } from '../types';
import { IMAGES } from '../constants';

type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved';

interface TicketsProps {
    user: User;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  requester: string;
  requesterAvatar?: string;
  date: string;
  priority: TicketPriority;
  status: TicketStatus;
  location: string;
  assignedTo?: string;
  updatedAt: string;
  imageUrl?: string;
}

// Mock inicial
const INITIAL_TICKETS: Ticket[] = [
  { id: 1042, title: 'Vazamento no teto da garagem', description: 'Goteira na vaga 42.', category: 'Hidráulica', requester: 'Unidade 302-A', date: '2023-12-10', priority: 'high', status: 'in_progress', location: 'Garagem G1', updatedAt: '2h', imageUrl: 'https://images.unsplash.com/photo-1585909696001-e22b64d60639?q=80&w=600&auto=format&fit=crop' },
  { id: 1041, title: 'Portão travando', description: 'Portão da eclusa.', category: 'Segurança', requester: 'Portaria', date: '2023-12-09', priority: 'critical', status: 'open', location: 'Entrada', updatedAt: '1d' },
  // Ticket do Morador Mockado
  { id: 1040, title: 'Interfone mudo', description: 'Não ouço a portaria.', category: 'Elétrica', requester: 'Unidade 202-B', requesterAvatar: IMAGES.RESIDENT_MARCUS, date: '2023-12-12', priority: 'medium', status: 'open', location: 'Unidade 202-B', updatedAt: 'Agora' }
];

const Tickets: React.FC<TicketsProps> = ({ user }) => {
  const isAdmin = user.role === 'admin';
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({ title: '', description: '', category: 'Manutenção', location: '', priority: 'medium', imageUrl: '' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setActiveMenuId(null);
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filtragem por Perfil
  const userTickets = isAdmin 
    ? tickets 
    : tickets.filter(t => t.requester.includes(user.unit || '202-B')); // Mock de filtro pelo unit

  const filteredTickets = userTickets.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: Ticket = {
      id: Math.floor(Date.now() / 1000),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      requester: isAdmin ? 'Administração' : `Unidade ${user.unit || '202-B'}`,
      date: new Date().toISOString().split('T')[0],
      priority: formData.priority as TicketPriority,
      status: 'open',
      location: formData.location,
      updatedAt: 'Agora mesmo',
      imageUrl: formData.imageUrl
    };
    setTickets([newTicket, ...tickets]);
    setIsCreateModalOpen(false);
    showToast('Chamado registrado!');
    setFormData({ title: '', description: '', category: 'Manutenção', location: '', priority: 'medium', imageUrl: '' });
  };

  const handleUpdateStatus = (id: number, newStatus: TicketStatus) => {
    if (!isAdmin) return;
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus, updatedAt: 'Agora mesmo' } : t));
    showToast('Status atualizado!');
    setActiveMenuId(null);
  };

  const handleDelete = (id: number) => {
    // Morador só deleta se estiver "open", Admin deleta qualquer
    const ticket = tickets.find(t => t.id === id);
    if (!isAdmin && ticket?.status !== 'open') {
        showToast('Você só pode cancelar chamados que ainda não foram atendidos.', 'error');
        return;
    }
    if(window.confirm("Excluir chamado?")) {
        setTickets(prev => prev.filter(t => t.id !== id));
        showToast('Chamado excluído.', 'info');
    }
    setActiveMenuId(null);
  };

  const getStatusBadge = (status: TicketStatus) => {
     const labels = { open: 'Aberto', in_progress: 'Em Andamento', waiting: 'Aguardando', resolved: 'Resolvido' };
     const colors = { open: 'bg-slate-100 text-slate-700', in_progress: 'bg-blue-100 text-blue-700', waiting: 'bg-amber-100 text-amber-700', resolved: 'bg-emerald-100 text-emerald-700' };
     return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="space-y-6 relative">
      <div className="fixed bottom-0 right-0 z-50 pointer-events-none">{toasts.map(t => <div key={t.id} className="pointer-events-auto"><Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} /></div>)}</div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isAdmin ? 'Central de Chamados' : 'Meus Chamados'}</h1>
        <button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium"><span className="material-icons">add_circle</span> Abrir Chamado</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon="confirmation_number" iconBg="bg-blue-50" iconColor="text-blue-600" title="Abertos" value={userTickets.filter(t => t.status === 'open').length} subtitle="Novos" onClick={() => setFilterStatus('open')} />
          <StatCard icon="engineering" iconBg="bg-orange-50" iconColor="text-orange-600" title="Em Andamento" value={userTickets.filter(t => t.status === 'in_progress').length} subtitle="Sendo resolvidos" onClick={() => setFilterStatus('in_progress')} />
          <StatCard icon="check_circle" iconBg="bg-emerald-50" iconColor="text-emerald-600" title="Resolvidos" value={userTickets.filter(t => t.status === 'resolved').length} subtitle="Finalizados" onClick={() => setFilterStatus('resolved')} />
      </div>

      <div className="bg-white dark:bg-[#1A2234] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
         <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 uppercase">
                <tr><th className="px-6 py-4">Título</th><th className="px-6 py-4">Categoria</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTickets.map(t => (
                    <tr key={t.id}>
                        <td className="px-6 py-4"><p className="font-bold text-sm text-slate-900 dark:text-white">{t.title}</p><p className="text-xs text-slate-500">{t.location} • {t.date}</p></td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{t.category}</td>
                        <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                        <td className="px-6 py-4 text-right relative">
                            <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === t.id ? null : t.id); }} className="text-slate-400 hover:text-primary"><span className="material-icons">more_vert</span></button>
                            {activeMenuId === t.id && (
                                <div ref={menuRef} className="absolute right-8 top-8 w-48 bg-white dark:bg-[#1A2234] rounded-lg shadow-xl border z-10">
                                    <button onClick={() => setSelectedTicket(t)} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50">Ver Detalhes</button>
                                    {isAdmin && (
                                        <>
                                            <div className="border-t my-1"></div>
                                            <button onClick={() => handleUpdateStatus(t.id, 'in_progress')} className="w-full text-left px-4 py-2 text-xs hover:bg-blue-50 text-blue-600">Iniciar</button>
                                            <button onClick={() => handleUpdateStatus(t.id, 'resolved')} className="w-full text-left px-4 py-2 text-xs hover:bg-emerald-50 text-emerald-600">Resolver</button>
                                        </>
                                    )}
                                    <button onClick={() => handleDelete(t.id)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50">Excluir</button>
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Chamado" onSubmit={handleCreateSubmit} submitLabel="Abrir Chamado">
         <div className="space-y-4">
            <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded p-2" placeholder="Título" required />
            <div className="grid grid-cols-2 gap-4">
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border rounded p-2"><option>Manutenção</option><option>Elétrica</option><option>Limpeza</option></select>
                <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border rounded p-2" placeholder="Local" required />
            </div>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded p-2" rows={4} placeholder="Descrição" required />
            <div><span className="text-sm">Prioridade: </span><select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="border rounded p-1"><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select></div>
         </div>
      </Modal>

      <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title="Detalhes" showFooter={false}>
         {selectedTicket && <div className="p-2"><h2 className="font-bold text-lg">{selectedTicket.title}</h2><p className="mt-2 text-slate-600">{selectedTicket.description}</p><div className="mt-4 text-xs text-slate-400">Status: {selectedTicket.status}</div></div>}
      </Modal>
    </div>
  );
};

export default Tickets;
