import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Toast from './Toast';
import { ToastMessage } from '../types';

// Tipos locais para Reservas
interface Reservation {
  id: number;
  area: string;
  residentName: string;
  unit: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  image?: string;
}

// Mock Data Inicial
const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 1,
    area: 'Salão de Festas Master',
    residentName: 'Ana Souza',
    unit: '302-B',
    date: '2023-12-24',
    startTime: '18:00',
    endTime: '23:59',
    guests: 45,
    status: 'pending',
    notes: 'Ceia de Natal da família',
    image: 'celebration'
  },
  {
    id: 2,
    area: 'Churrasqueira Gourmet',
    residentName: 'Carlos Oliveira',
    unit: '105-A',
    date: '2023-12-16',
    startTime: '12:00',
    endTime: '18:00',
    guests: 15,
    status: 'approved',
    image: 'outdoor_grill'
  },
  {
    id: 3,
    area: 'Quadra Poliesportiva',
    residentName: 'Grupo do Futebol (Marcos)',
    unit: '202-C',
    date: '2023-12-14',
    startTime: '19:00',
    endTime: '21:00',
    guests: 10,
    status: 'completed',
    image: 'sports_soccer'
  },
  {
    id: 4,
    area: 'Espaço Gourmet',
    residentName: 'Fernanda Lima',
    unit: '401-A',
    date: '2023-12-20',
    startTime: '19:30',
    endTime: '23:00',
    guests: 8,
    status: 'pending',
    notes: 'Jantar de noivado íntimo',
    image: 'restaurant'
  }
];

const AREAS = [
  { id: 'salao', name: 'Salão de Festas Master', icon: 'celebration', capacity: 80 },
  { id: 'churrasqueira', name: 'Churrasqueira Gourmet', icon: 'outdoor_grill', capacity: 20 },
  { id: 'quadra', name: 'Quadra Poliesportiva', icon: 'sports_soccer', capacity: 20 },
  { id: 'gourmet', name: 'Espaço Gourmet', icon: 'restaurant', capacity: 15 },
  { id: 'cinema', name: 'Cinema', icon: 'movie', capacity: 12 },
];

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'history'>('pending');
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Context Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    residentName: '',
    unit: '',
    area: AREAS[0].name,
    date: '',
    startTime: '',
    endTime: '',
    guests: '',
    notes: ''
  });

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

  // Helpers
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Helper de Data Robusto (Sem problemas de timezone)
  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    // Cria data localmente meio-dia para evitar virada de dia por timezone
    return new Date(year, month - 1, day, 12, 0, 0); 
  };

  const getDisplayDate = (dateString: string) => {
    const date = parseDate(dateString);
    const day = dateString.split('-')[2]; // Pega o dia direto da string para garantir
    const month = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    return { day, month };
  };

  const isDatePast = (dateString: string) => {
    const date = parseDate(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera hora para comparar apenas datas
    
    // Comparação simples: se a data da reserva for menor que hoje (ontem ou antes)
    // Se for hoje, não é passado.
    return date < today; 
  };

  const handleStatusChange = (id: number, newStatus: 'approved' | 'rejected') => {
    // Se for aprovar, precisamos verificar conflitos novamente
    if (newStatus === 'approved') {
       const targetReservation = reservations.find(r => r.id === id);
       if (targetReservation) {
          const hasConflict = reservations.some(existing => {
             if (existing.id === id) return false;
             if (existing.status !== 'approved') return false;
             if (existing.area !== targetReservation.area) return false;
             if (existing.date !== targetReservation.date) return false;

             return (targetReservation.startTime < existing.endTime && targetReservation.endTime > existing.startTime);
          });

          if (hasConflict) {
             showToast('Conflito de horário! Já existe uma reserva aprovada neste período.', 'error');
             return;
          }
       }
    }

    setReservations(prev => prev.map(res => 
      res.id === id ? { ...res, status: newStatus } : res
    ));
    const msg = newStatus === 'approved' ? 'Reserva aprovada com sucesso!' : 'Reserva rejeitada.';
    showToast(msg, newStatus === 'approved' ? 'success' : 'info');
  };

  const handleDelete = (id: number) => {
    setReservations(prev => prev.filter(r => r.id !== id));
    setActiveMenuId(null);
    showToast('Reserva cancelada/removida.', 'info');
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      residentName: '',
      unit: '',
      area: AREAS[0].name,
      date: '',
      startTime: '',
      endTime: '',
      guests: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (reservation: Reservation) => {
    setModalMode('edit');
    setEditingId(reservation.id);
    setFormData({
      residentName: reservation.residentName,
      unit: reservation.unit,
      area: reservation.area,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      guests: reservation.guests.toString(),
      notes: reservation.notes || ''
    });
    setActiveMenuId(null);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedArea = AREAS.find(a => a.name === formData.area);
    
    // 1. Validação de Capacidade
    const guestCount = Number(formData.guests);
    if (selectedArea && guestCount > selectedArea.capacity) {
      showToast(`Capacidade excedida! O local suporta máx. ${selectedArea.capacity} pessoas.`, 'error');
      return;
    }

    // 2. Validação Temporal (Início vs Fim)
    if (formData.startTime >= formData.endTime) {
      showToast('Horário inválido. O início deve ser antes do fim.', 'error');
      return;
    }

    // 3. Validação de Conflitos (Overlap)
    const hasConflict = reservations.some(existing => {
      if (modalMode === 'edit' && existing.id === editingId) return false; // Ignora a si mesmo na edição
      if (existing.status === 'rejected') return false;
      
      if (existing.area !== formData.area) return false;
      if (existing.date !== formData.date) return false;

      return (formData.startTime < existing.endTime && formData.endTime > existing.startTime);
    });

    if (hasConflict) {
      showToast('Horário indisponível! Já existe uma reserva para este local neste período.', 'error');
      return;
    }

    if (modalMode === 'create') {
      const newReservation: Reservation = {
        id: Date.now(),
        area: formData.area,
        residentName: formData.residentName,
        unit: formData.unit,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        guests: guestCount,
        status: 'pending',
        notes: formData.notes,
        image: selectedArea?.icon || 'event'
      };
      setReservations([newReservation, ...reservations]);
      showToast('Nova reserva criada e aguardando aprovação!');
    } else {
      setReservations(prev => prev.map(res => {
        if (res.id === editingId) {
          return {
            ...res,
            area: formData.area,
            residentName: formData.residentName,
            unit: formData.unit,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            guests: guestCount,
            notes: formData.notes,
            image: selectedArea?.icon || 'event'
          };
        }
        return res;
      }));
      showToast('Reserva atualizada com sucesso!');
    }

    setIsModalOpen(false);
  };

  // Filter Logic Robusta
  const filteredReservations = reservations.filter(res => {
    const isPast = isDatePast(res.date);

    if (activeTab === 'pending') {
      return res.status === 'pending';
    }
    if (activeTab === 'upcoming') {
      // Apenas aprovadas que NÃO estão no passado
      return res.status === 'approved' && !isPast;
    }
    if (activeTab === 'history') {
      // Completas, Rejeitadas, ou Aprovadas que JÁ passaram
      return res.status === 'completed' || res.status === 'rejected' || (res.status === 'approved' && isPast);
    }
    return false;
  });

  const getStatusColor = (status: string, dateStr: string) => {
    // Se estiver no histórico e for aprovada (mas data passada), mostra como concluída visualmente
    if (status === 'approved' && isDatePast(dateStr)) {
       return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }

    switch(status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'completed': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
  };

  const getStatusLabel = (status: string, dateStr: string) => {
    if (status === 'approved' && isDatePast(dateStr)) {
      return 'Realizada';
    }

    switch(status) {
      case 'approved': return 'Aprovada';
      case 'rejected': return 'Rejeitada';
      case 'completed': return 'Concluída';
      default: return 'Pendente';
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

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reservas de Áreas Comuns</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie solicitações e a agenda do condomínio.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-500/30 transition-all active:scale-95 text-sm font-medium"
        >
          <span className="material-icons text-[20px]">add</span>
          Nova Reserva
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1A2234] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
            <span className="material-icons">event_available</span>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total este mês</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{reservations.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1A2234] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
            <span className="material-icons">pending_actions</span>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Aguardando Aprovação</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {reservations.filter(r => r.status === 'pending').length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1A2234] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
            <span className="material-icons">check_circle</span>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Taxa de Ocupação</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">68%</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('pending')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-icons text-[18px]">notifications_active</span>
            Solicitações Pendentes
            {reservations.filter(r => r.status === 'pending').length > 0 && (
               <span className="bg-amber-100 text-amber-600 text-xs py-0.5 px-2 rounded-full font-bold ml-1">
                 {reservations.filter(r => r.status === 'pending').length}
               </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
             <span className="material-icons text-[18px]">calendar_month</span>
            Próximas Reservas
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
             <span className="material-icons text-[18px]">history</span>
            Histórico
          </button>
        </nav>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-[#1A2234] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        {filteredReservations.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReservations.map((res) => {
               const { day, month } = getDisplayDate(res.date);
               return (
              <div key={res.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative">
                {/* Date Box */}
                <div className="flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg p-3 flex flex-col items-center justify-center w-16 h-16 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase">{month}</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{day}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{res.area}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(res.status, res.date)}`}>
                      {getStatusLabel(res.status, res.date)}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[16px]">schedule</span>
                      {res.startTime} - {res.endTime}
                    </span>
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[16px]">person</span>
                      {res.residentName} (Unid. {res.unit})
                    </span>
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[16px]">group</span>
                      {res.guests} convidados
                    </span>
                  </div>
                  {res.notes && (
                    <p className="text-xs text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded inline-block">
                      <span className="font-bold">Nota:</span> {res.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  {res.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleStatusChange(res.id, 'approved')}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors tooltip"
                        title="Aprovar"
                      >
                        <span className="material-icons">check_circle</span>
                      </button>
                      <button 
                        onClick={() => handleStatusChange(res.id, 'rejected')}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Rejeitar"
                      >
                        <span className="material-icons">cancel</span>
                      </button>
                      {/* Botão de edição para pendentes também */}
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === res.id ? null : res.id);
                          }}
                          className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                        >
                          <span className="material-icons">more_vert</span>
                        </button>
                        {activeMenuId === res.id && (
                          <div 
                             ref={menuRef}
                             className="absolute right-0 top-10 w-40 bg-white dark:bg-[#1A2234] rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-10 overflow-hidden animate-fade-in"
                          >
                            <button 
                                onClick={() => openEditModal(res)}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                                <span className="material-icons text-[16px]">edit</span>
                                Editar
                            </button>
                            <button 
                                onClick={() => handleDelete(res.id)}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                            >
                                <span className="material-icons text-[16px]">delete</span>
                                Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === res.id ? null : res.id);
                        }}
                        className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                      >
                        <span className="material-icons">more_vert</span>
                      </button>
                       {activeMenuId === res.id && (
                          <div 
                             ref={menuRef}
                             className="absolute right-0 top-10 w-40 bg-white dark:bg-[#1A2234] rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-10 overflow-hidden animate-fade-in"
                          >
                            <button 
                                onClick={() => openEditModal(res)}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                                <span className="material-icons text-[16px]">edit</span>
                                Editar
                            </button>
                            <button 
                                onClick={() => handleDelete(res.id)}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                            >
                                <span className="material-icons text-[16px]">delete</span>
                                Excluir
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            )})
            }
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
               <span className="material-icons text-3xl opacity-50">event_busy</span>
            </div>
            <p className="font-medium">Nenhuma reserva encontrada nesta categoria.</p>
          </div>
        )}
      </div>

      {/* Modal Nova/Editar Reserva */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? "Nova Reserva de Área Comum" : "Editar Reserva"}
        onSubmit={handleSubmit}
        submitLabel={modalMode === 'create' ? "Criar Reserva" : "Salvar Alterações"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Morador</label>
              <input name="residentName" value={formData.residentName} onChange={handleInputChange} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidade</label>
              <input name="unit" value={formData.unit} onChange={handleInputChange} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" required />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Área Desejada</label>
            <select name="area" value={formData.area} onChange={handleInputChange} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none">
              {AREAS.map(area => (
                <option key={area.id} value={area.name}>{area.name} (Max: {area.capacity})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
              <input name="date" value={formData.date} onChange={handleInputChange} type="date" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" required />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nº Convidados</label>
              <input name="guests" value={formData.guests} onChange={handleInputChange} type="number" min="1" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Início</label>
              <input name="startTime" value={formData.startTime} onChange={handleInputChange} type="time" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" required />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fim</label>
              <input name="endTime" value={formData.endTime} onChange={handleInputChange} type="time" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações (Opcional)</label>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="Motivo da reserva, equipamentos extras, etc..."></textarea>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reservations;