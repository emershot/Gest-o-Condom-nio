import React, { useState, useEffect, useRef } from 'react';
import StatCard from './StatCard';
import Modal from './Modal';
import Toast from './Toast';
import { ToastMessage } from '../types';
import { IMAGES } from '../constants';

// Tipos locais
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved';
type SortKey = 'id' | 'title' | 'category' | 'requester' | 'date' | 'priority' | 'status' | 'location';

interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  requester: string; // Unidade ou Nome
  requesterAvatar?: string;
  date: string;
  priority: TicketPriority;
  status: TicketStatus;
  location: string;
  assignedTo?: string; // Nome do funcionário/prestador
  updatedAt: string;
  imageUrl?: string; // URL da imagem do problema
}

// Mock Data
const INITIAL_TICKETS: Ticket[] = [
  {
    id: 1042,
    title: 'Vazamento no teto da garagem',
    description: 'Há uma goteira constante em cima da vaga 42, parece vir da tubulação principal.',
    category: 'Hidráulica',
    requester: 'Unidade 302-A',
    requesterAvatar: IMAGES.RESIDENT_1,
    date: '2023-12-10',
    priority: 'high',
    status: 'in_progress',
    location: 'Garagem G1',
    assignedTo: 'José (Zelador)',
    updatedAt: '2 horas atrás',
    imageUrl: 'https://images.unsplash.com/photo-1585909696001-e22b64d60639?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 1041,
    title: 'Portão de pedestres travando',
    description: 'O portão da eclusa está demorando para fechar e as vezes trava aberto.',
    category: 'Segurança',
    requester: 'Portaria',
    date: '2023-12-09',
    priority: 'critical',
    status: 'open',
    location: 'Entrada Principal',
    updatedAt: '1 dia atrás'
  },
  {
    id: 1040,
    title: 'Lâmpada queimada no Hall',
    description: 'Lâmpada do corredor do 5º andar queimada.',
    category: 'Elétrica',
    requester: 'Unidade 504-B',
    requesterAvatar: IMAGES.RESIDENT_2,
    date: '2023-12-08',
    priority: 'low',
    status: 'resolved',
    location: 'Bloco B - 5º Andar',
    assignedTo: 'Eletricista Externo',
    updatedAt: 'Ontem',
    imageUrl: 'https://images.unsplash.com/photo-1550974868-b34e55490f3c?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 1039,
    title: 'Barulho excessivo após 22h',
    description: 'Som alto vindo da unidade 102 ontem à noite.',
    category: 'Reclamação',
    requester: 'Unidade 101-A',
    date: '2023-12-08',
    priority: 'medium',
    status: 'waiting',
    location: 'Bloco A',
    updatedAt: '2 dias atrás'
  },
  {
    id: 1038,
    title: 'Limpeza da Piscina',
    description: 'A água está um pouco turva, precisa de tratamento.',
    category: 'Manutenção',
    requester: 'Unidade 202-C',
    requesterAvatar: IMAGES.RESIDENT_MARCUS,
    date: '2023-12-07',
    priority: 'medium',
    status: 'open',
    location: 'Área Comum',
    updatedAt: '3 dias atrás',
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b468848?q=80&w=600&auto=format&fit=crop'
  }
];

const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null); // Para ver detalhes
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Menu Contexto
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Manutenção',
    location: '',
    priority: 'medium',
    requester: 'Administração',
    imageUrl: ''
  });

  // Helpers
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getSortIcon = (columnKey: SortKey) => {
    if (sortConfig?.key !== columnKey) return 'unfold_more';
    return sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more';
  };

  // Fecha o menu se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // CRUD & Logic
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: Ticket = {
      id: Math.floor(Date.now() / 1000), // ID único baseado em timestamp
      title: formData.title,
      description: formData.description,
      category: formData.category,
      requester: formData.requester,
      date: new Date().toISOString().split('T')[0],
      priority: formData.priority as TicketPriority,
      status: 'open',
      location: formData.location,
      updatedAt: 'Agora mesmo',
      imageUrl: formData.imageUrl
    };
    
    setTickets([newTicket, ...tickets]);
    setIsCreateModalOpen(false);
    showToast('Chamado criado com sucesso!');
    setFormData({ title: '', description: '', category: 'Manutenção', location: '', priority: 'medium', requester: 'Administração', imageUrl: '' });
  };

  const handleUpdateStatus = (id: number, newStatus: TicketStatus, assignedTo?: string) => {
    setTickets(prev => prev.map(t => 
      t.id === id ? { ...t, status: newStatus, assignedTo: assignedTo || t.assignedTo, updatedAt: 'Agora mesmo' } : t
    ));
    setSelectedTicket(null); // Fecha modal de detalhes se estiver aberto
    setActiveMenuId(null);   // Fecha menu se estiver aberto
    showToast('Status do chamado atualizado!', 'success');
  };

  const handleDelete = (id: number) => {
    if(window.confirm("Tem certeza que deseja excluir este chamado?")) {
        setTickets(prev => prev.filter(t => t.id !== id));
        setActiveMenuId(null);
        showToast('Chamado excluído.', 'info');
    }
  };

  // Sorting Logic
  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getPriorityWeight = (priority: TicketPriority) => {
    switch(priority) {
        case 'critical': return 4;
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
    }
  };

  // Filter Logic
  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toString().includes(searchQuery);
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    if (key === 'priority') {
        const weightA = getPriorityWeight(a.priority);
        const weightB = getPriorityWeight(b.priority);
        if (weightA < weightB) return direction === 'asc' ? -1 : 1;
        if (weightA > weightB) return direction === 'asc' ? 1 : -1;
        return 0;
    }

    let valA: any = a[key as keyof Ticket] || '';
    let valB: any = b[key as keyof Ticket] || '';
    
    // Normalização para string case-insensitive
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const paginatedTickets = sortedTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Export Logic
  const handleExport = () => {
    const headers = ['ID', 'Título', 'Categoria', 'Local', 'Solicitante', 'Data', 'Prioridade', 'Status', 'Atribuído', 'Imagem'];
    const csvContent = [
      headers.join(','),
      ...filteredTickets.map(t => {
        return [
          t.id,
          `"${t.title}"`,
          t.category,
          t.location,
          t.requester,
          t.date,
          t.priority,
          t.status,
          t.assignedTo || '-',
          t.imageUrl || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chamados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório de chamados exportado!');
  };

  // Visual Helpers
  const getPriorityBadge = (priority: TicketPriority) => {
    switch(priority) {
      case 'critical': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse">Crítica</span>;
      case 'high': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">Alta</span>;
      case 'medium': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">Média</span>;
      case 'low': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Baixa</span>;
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch(status) {
      case 'open': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Aberto</span>;
      case 'in_progress': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Em Andamento</span>;
      case 'waiting': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Aguardando</span>;
      case 'resolved': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Resolvido</span>;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Container */}
      <div className="fixed bottom-0 right-0 z-50 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Central de Chamados</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie manutenções, reclamações e solicitações de serviço.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleExport}
                className="bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-primary px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium shadow-sm"
            >
                <span className="material-icons text-[20px]">file_download</span>
                <span className="hidden sm:inline">Relatório</span>
            </button>
            <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-500/30 transition-all active:scale-95 text-sm font-medium"
            >
            <span className="material-icons text-[20px]">add_circle</span>
            Abrir Chamado
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon="confirmation_number"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600"
          title="Em Aberto"
          value={tickets.filter(t => t.status === 'open').length}
          subtitle="Novas solicitações"
          onClick={() => { setFilterStatus('open'); setCurrentPage(1); }}
        />
        <StatCard 
          icon="engineering"
          iconBg="bg-orange-50 dark:bg-orange-900/20"
          iconColor="text-orange-600"
          title="Em Andamento"
          value={tickets.filter(t => t.status === 'in_progress').length}
          subtitle="Sendo resolvidas"
          onClick={() => { setFilterStatus('in_progress'); setCurrentPage(1); }}
        />
        <StatCard 
          icon="priority_high"
          iconBg="bg-red-50 dark:bg-red-900/20"
          iconColor="text-red-600"
          title="Alta Prioridade"
          value={tickets.filter(t => t.priority === 'high' || t.priority === 'critical').length}
          subtitle="Requer atenção imediata"
          isAttention={true}
          onClick={() => { setFilterPriority('critical'); setCurrentPage(1); }}
        />
        <StatCard 
          icon="check_circle"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600"
          title="Resolvidos (Total)"
          value={tickets.filter(t => t.status === 'resolved').length}
          subtitle="Chamados finalizados"
          trend="+8%"
          trendPositive={true}
          onClick={() => { setFilterStatus('resolved'); setCurrentPage(1); }}
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-[#1A2234] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select 
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer min-w-[140px]"
          >
            <option value="all">Status: Todos</option>
            <option value="open">Abertos</option>
            <option value="in_progress">Em Andamento</option>
            <option value="waiting">Aguardando</option>
            <option value="resolved">Resolvidos</option>
          </select>
          <select 
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer min-w-[140px]"
          >
            <option value="all">Prioridade: Todas</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Buscar chamado (ID, título, unidade)..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm"
          />
          <span className="material-icons absolute left-3 top-2 text-slate-400 text-[20px]">search</span>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-[#1A2234] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th 
                  onClick={() => handleSort('id')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none w-24"
                >
                  <div className="flex items-center gap-1">
                    ID
                    <span className={`material-icons text-[16px] ${sortConfig?.key === 'id' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {getSortIcon('id')}
                    </span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('title')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                >
                  <div className="flex items-center gap-1">
                    Chamado / Descrição
                    <span className={`material-icons text-[16px] ${sortConfig?.key === 'title' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {getSortIcon('title')}
                    </span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('category')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                >
                  <div className="flex items-center gap-1">
                    Categoria / Local
                    <span className={`material-icons text-[16px] ${sortConfig?.key === 'category' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {getSortIcon('category')}
                    </span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('requester')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                >
                  <div className="flex items-center gap-1">
                    Solicitante
                    <span className={`material-icons text-[16px] ${sortConfig?.key === 'requester' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {getSortIcon('requester')}
                    </span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('priority')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                >
                  <div className="flex items-center gap-1">
                    Prioridade
                    <span className={`material-icons text-[16px] ${sortConfig?.key === 'priority' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {getSortIcon('priority')}
                    </span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                >
                  <div className="flex items-center gap-1">
                    Status
                    <span className={`material-icons text-[16px] ${sortConfig?.key === 'status' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {getSortIcon('status')}
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedTickets.length > 0 ? (
                paginatedTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">
                      #{t.id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={t.title}>
                        {t.title}
                        {t.imageUrl && <span className="material-icons text-[14px] text-slate-400 ml-1 align-middle" title="Imagem Anexada">image</span>}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]" title={t.description}>{t.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 dark:text-white">{t.category}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="material-icons text-[10px]">place</span>
                        {t.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         {t.requesterAvatar ? (
                             <img src={t.requesterAvatar} alt="" className="w-6 h-6 rounded-full" />
                         ) : (
                             <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                {t.requester.charAt(0)}
                             </div>
                         )}
                         <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.requester}</p>
                            <p className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {getPriorityBadge(t.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {getStatusBadge(t.status)}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                        <button 
                            onClick={() => setSelectedTicket(t)}
                            className="text-slate-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10 mr-1"
                            title="Ver Detalhes"
                        >
                            <span className="material-icons text-[20px]">visibility</span>
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === t.id ? null : t.id);
                            }}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            <span className="material-icons text-[20px]">more_vert</span>
                        </button>

                         {/* Menu Contexto Tabela */}
                         {activeMenuId === t.id && (
                             <div 
                                ref={menuRef}
                                className="absolute right-8 top-8 w-48 bg-white dark:bg-[#1A2234] rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-10 overflow-hidden animate-fade-in"
                             >
                                <div className="p-2 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 uppercase">
                                    Mudar Status
                                </div>
                                <button onClick={() => handleUpdateStatus(t.id, 'in_progress', 'José (Zelador)')} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Em Andamento
                                </button>
                                <button onClick={() => handleUpdateStatus(t.id, 'waiting')} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Aguardando
                                </button>
                                <button onClick={() => handleUpdateStatus(t.id, 'resolved')} className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Resolvido
                                </button>
                                {t.imageUrl && (
                                    <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                                        <a 
                                            href={t.imageUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full text-left px-4 py-2 text-xs text-primary hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                        >
                                            <span className="material-icons text-[14px]">image</span> Ver Anexo
                                        </a>
                                    </div>
                                )}
                                <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                                    <button onClick={() => handleDelete(t.id)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
                                        <span className="material-icons text-[14px]">delete</span> Excluir
                                    </button>
                                </div>
                             </div>
                         )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-icons text-4xl mb-2 opacity-50">task_alt</span>
                      <p className="font-medium">Nenhum chamado encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-white dark:bg-[#1a2234] px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-700 dark:text-slate-400">
                        Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedTickets.length)}</span> de <span className="font-medium">{sortedTickets.length}</span> resultados
                    </p>
                </div>
                <div>
                    <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button 
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Anterior</span>
                            <span className="material-icons text-[20px]">chevron_left</span>
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page 
                                      ? 'z-10 bg-primary border-primary text-white' 
                                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                          >
                              {page}
                          </button>
                        ))}
                        
                        <button 
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages || totalPages === 0}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Próximo</span>
                            <span className="material-icons text-[20px]">chevron_right</span>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
      </div>

      {/* Modal Criar Chamado */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Abrir Novo Chamado"
        onSubmit={handleCreateSubmit}
        submitLabel="Registrar Chamado"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título do Problema</label>
            <input 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              type="text" 
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
              placeholder="Ex: Portão da Garagem Travado" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
               <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
               >
                 <option>Manutenção</option>
                 <option>Elétrica</option>
                 <option>Hidráulica</option>
                 <option>Segurança</option>
                 <option>Limpeza</option>
                 <option>Jardinagem</option>
                 <option>Reclamação</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Localização</label>
               <input 
                 value={formData.location}
                 onChange={(e) => setFormData({...formData, location: e.target.value})}
                 type="text" 
                 className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                 placeholder="Ex: Hall Bloco B" 
                 required
               />
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição Detalhada</label>
             <textarea 
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
               rows={4} 
               className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
               placeholder="Descreva o problema com detalhes..." 
               required
             />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Foto/Anexo (URL)</label>
             <input 
               value={formData.imageUrl}
               onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
               type="text" 
               className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
               placeholder="https://..." 
             />
             <p className="text-[10px] text-slate-400 mt-1">Cole um link direto para a imagem do problema.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Prioridade</label>
            <div className="flex gap-4">
               {['low', 'medium', 'high', 'critical'].map((p) => (
                 <label key={p} className="flex items-center gap-2 cursor-pointer">
                   <input 
                     type="radio" 
                     name="priority" 
                     value={p}
                     checked={formData.priority === p}
                     onChange={(e) => setFormData({...formData, priority: e.target.value})}
                     className="text-primary focus:ring-primary"
                   />
                   <span className="text-sm capitalize text-slate-600 dark:text-slate-400">
                     {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : p === 'high' ? 'Alta' : 'Crítica'}
                   </span>
                 </label>
               ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Detalhes do Chamado (Gerenciar) */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Chamado #${selectedTicket?.id}`}
        showFooter={false}
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{selectedTicket.title}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                   <span className="material-icons text-[16px]">person</span> {selectedTicket.requester}
                   <span>•</span>
                   <span>{new Date(selectedTicket.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                </div>
              </div>
              {getPriorityBadge(selectedTicket.priority)}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
               <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                 {selectedTicket.description}
               </p>
               
               {selectedTicket.imageUrl && (
                 <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Imagem Anexada</p>
                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img 
                        src={selectedTicket.imageUrl} 
                        alt="Evidência do problema" 
                        className="w-full h-auto object-cover max-h-60"
                      />
                    </div>
                    <a 
                      href={selectedTicket.imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                    >
                      <span className="material-icons text-[14px]">open_in_new</span>
                      Abrir original
                    </a>
                 </div>
               )}

               <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Categoria:</span> {selectedTicket.category}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Local:</span> {selectedTicket.location}
                  </div>
               </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Gerenciar Status</h3>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}
                   className={`p-2 rounded-lg border text-sm font-medium transition-all ${selectedTicket.status === 'open' ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}
                 >
                   Reabrir / Aberto
                 </button>
                 <button 
                   onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress', 'José (Zelador)')}
                   className={`p-2 rounded-lg border text-sm font-medium transition-all ${selectedTicket.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 border-blue-200' : 'border-slate-200 dark:border-slate-800 hover:bg-blue-50 text-blue-600'}`}
                 >
                   Em Andamento
                 </button>
                 <button 
                   onClick={() => handleUpdateStatus(selectedTicket.id, 'waiting')}
                   className={`p-2 rounded-lg border text-sm font-medium transition-all ${selectedTicket.status === 'waiting' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 border-amber-200' : 'border-slate-200 dark:border-slate-800 hover:bg-amber-50 text-amber-600'}`}
                 >
                   Aguardando Peças
                 </button>
                 <button 
                   onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                   className={`p-2 rounded-lg border text-sm font-medium transition-all ${selectedTicket.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 border-emerald-200' : 'border-slate-200 dark:border-slate-800 hover:bg-emerald-50 text-emerald-600'}`}
                 >
                   Marcar Resolvido
                 </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
               <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-slate-700 text-sm font-medium">Fechar Detalhes</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tickets;