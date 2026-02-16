import React, { useState, useEffect, useRef } from 'react';
import { DIRECTORY_DATA } from '../constants';
import Modal from './Modal';
import Toast from './Toast';
import { ToastMessage } from '../types';

// Interface baseada nos dados existentes
interface Resident {
  name: string;
  since?: string;
  image?: string;
  initials?: string;
  initialsColor?: string;
}

interface Contact {
  phone: string;
  email: string;
}

interface Unit {
  id: string;
  unit: string;
  block: string;
  resident: Resident | null;
  type: string;
  typeColor?: string;
  contact: Contact | null;
  owner: string;
  ownerItalic?: boolean;
  status: string;
  statusColor: string;
  statusDot: string;
}

type SortKey = 'unit' | 'resident' | 'type' | 'status';

const Directory: React.FC = () => {
  // Estado dos Dados
  const [units, setUnits] = useState<Unit[]>(DIRECTORY_DATA as Unit[]);
  
  // Estados de Filtro
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlock, setFilterBlock] = useState('Todos');
  const [filterType, setFilterType] = useState('Todos');

  // Ordenação
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    unit: '',
    block: 'Bloco A',
    type: 'Inquilino',
    phone: '',
    imageUrl: '',
    ownerName: '',
    status: 'Ocupado'
  });

  // --- Helpers ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterBlock('Todos');
    setFilterType('Todos');
    setSortConfig(null);
    setCurrentPage(1);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Vago': 
        return { color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', dot: 'bg-slate-400' };
      case 'Pagamento Pendente': 
        return { color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50', dot: 'bg-red-500' };
      case 'Em Manutenção': 
        return { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/50', dot: 'bg-amber-500' };
      default: // Ocupado
        return { color: 'bg-primary/10 text-primary border-primary/20', dot: 'bg-primary' };
    }
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

  // --- Lógica de Ordenação ---
  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- Lógica de Negócio ---

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ 
      name: '', 
      email: '', 
      unit: '', 
      block: 'Bloco A', 
      type: 'Inquilino', 
      phone: '', 
      imageUrl: '',
      ownerName: '',
      status: 'Ocupado'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (unit: Unit) => {
    setModalMode('edit');
    setEditingId(unit.id);
    setFormData({
      name: unit.resident?.name || '',
      email: unit.contact?.email || '',
      unit: unit.unit,
      block: unit.block,
      type: unit.type === '-' ? 'Inquilino' : unit.type,
      phone: unit.contact?.phone || '',
      imageUrl: unit.resident?.image || '',
      ownerName: unit.owner === 'Mesmo do Morador' ? '' : unit.owner,
      status: unit.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    setActiveMenuId(null);
    showToast('Registro removido com sucesso.', 'info');
  };

  const handleVacate = (id: string) => {
    setUnits(prev => prev.map(u => {
      if (u.id === id) {
        return {
          ...u,
          resident: null,
          contact: null,
          type: '-',
          typeColor: '',
          // Lógica de Sênior: Se o dono era o morador e ele saiu, reseta para evitar dados órfãos
          owner: u.owner === 'Mesmo do Morador' ? 'Não Informado' : u.owner,
          ownerItalic: true,
          status: 'Vago',
          statusColor: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          statusDot: 'bg-slate-400'
        };
      }
      return u;
    }));
    setActiveMenuId(null);
    showToast('Unidade marcada como vaga.', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determina proprietário
    let ownerDisplay = formData.ownerName;
    let ownerItalic = false;

    if (!ownerDisplay) {
      if (formData.type === 'Proprietário') {
        ownerDisplay = 'Mesmo do Morador';
        ownerItalic = true;
      } else {
        ownerDisplay = 'Não Informado';
        ownerItalic = true;
      }
    }

    // Determina estilos de status
    const statusStyles = getStatusStyles(formData.status);

    const residentData: Resident = {
      name: formData.name,
      since: modalMode === 'create' ? 'Novo' : 'Atualizado',
      initials: formData.name.substring(0, 2).toUpperCase(),
      initialsColor: 'bg-blue-100 text-blue-600 border-blue-200',
      image: formData.imageUrl || undefined
    };

    const contactData: Contact = {
      phone: formData.phone || 'Pendente',
      email: formData.email
    };

    const typeColor = formData.type === 'Proprietário' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';

    if (modalMode === 'create') {
      const newUnit: Unit = {
        id: Date.now().toString(),
        unit: formData.unit,
        block: formData.block,
        resident: residentData,
        type: formData.type,
        typeColor: typeColor,
        contact: contactData,
        owner: ownerDisplay,
        ownerItalic: ownerItalic,
        status: formData.status,
        statusColor: statusStyles.color,
        statusDot: statusStyles.dot
      };
      setUnits([newUnit, ...units]);
      showToast(`Convite enviado para ${formData.email}!`);
    } else {
      setUnits(prev => prev.map(u => {
        if (u.id === editingId) {
           return {
             ...u,
             unit: formData.unit,
             block: formData.block,
             resident: residentData,
             type: formData.type,
             typeColor: typeColor,
             contact: contactData,
             owner: ownerDisplay,
             ownerItalic: ownerItalic,
             status: formData.status,
             statusColor: statusStyles.color,
             statusDot: statusStyles.dot
           };
        }
        return u;
      }));
      showToast('Dados da unidade atualizados com sucesso!');
    }

    setIsModalOpen(false);
  };

  // --- Filtragem e Ordenação ---
  const filteredUnits = units.filter(unit => {
    const matchesSearch = 
      unit.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.resident?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.contact?.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBlock = filterBlock === 'Todos' || unit.block.includes(filterBlock);
    const matchesType = filterType === 'Todos' || unit.type === filterType;

    return matchesSearch && matchesBlock && matchesType;
  });

  const sortedUnits = [...filteredUnits].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    
    let valueA: string = '';
    let valueB: string = '';

    switch (key) {
      case 'unit':
        valueA = a.unit;
        valueB = b.unit;
        break;
      case 'resident':
        valueA = a.resident?.name || '';
        valueB = b.resident?.name || '';
        break;
      case 'type':
        valueA = a.type;
        valueB = b.type;
        break;
      case 'status':
        valueA = a.status;
        valueB = b.status;
        break;
    }

    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // --- Paginação ---
  const totalPages = Math.ceil(sortedUnits.length / itemsPerPage);
  const paginatedUnits = sortedUnits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Estatísticas Dinâmicas
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === 'Ocupado' || u.status === 'Pagamento Pendente').length;
  const vacantUnits = units.filter(u => u.status === 'Vago').length;
  const totalResidents = units.filter(u => u.resident !== null).length;

  const getSortIcon = (columnKey: SortKey) => {
    if (sortConfig?.key !== columnKey) return 'unfold_more';
    return sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more';
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Diretório de Unidades e Moradores</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie detalhes de ocupação, proprietários e inquilinos em todas as torres.</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-500/30 transition-all active:scale-95 text-sm font-medium"
          >
              <span className="material-icons text-[20px]">add</span>
              Convidar Novo Morador
          </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1a2234] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-icons">apartment</span>
              </div>
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total de Unidades</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalUnits}</p>
              </div>
          </div>
          <div className="bg-white dark:bg-[#1a2234] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <span className="material-icons">check_circle</span>
              </div>
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ocupados</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{occupiedUnits}</p>
              </div>
          </div>
          <div className="bg-white dark:bg-[#1a2234] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <span className="material-icons">vpn_key</span>
              </div>
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Vagos</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{vacantUnits}</p>
              </div>
          </div>
          <div className="bg-white dark:bg-[#1a2234] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <span className="material-icons">group</span>
              </div>
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Resid. Ativos</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalResidents}</p>
              </div>
          </div>
      </div>

      <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="relative w-full lg:w-96">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <span className="material-icons text-[20px]">search</span>
                  </span>
                  <input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm" 
                      placeholder="Buscar por nome, unidade ou email..." 
                      type="text" 
                  />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                      <select 
                        value={filterBlock}
                        onChange={(e) => setFilterBlock(e.target.value)}
                        className="appearance-none bg-white dark:bg-[#1a2234] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                      >
                          <option value="Todos">Todos os Blocos</option>
                          <option value="Bloco A">Bloco A</option>
                          <option value="Bloco B">Bloco B</option>
                          <option value="Bloco C">Bloco C</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                          <span className="material-icons text-[18px]">expand_more</span>
                      </div>
                  </div>
                  <div className="relative">
                      <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="appearance-none bg-white dark:bg-[#1a2234] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                      >
                          <option value="Todos">Todos os Tipos</option>
                          <option value="Proprietário">Proprietário</option>
                          <option value="Inquilino">Inquilino</option>
                          <option value="-">Vago</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                          <span className="material-icons text-[18px]">expand_more</span>
                      </div>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                  <button 
                    onClick={clearFilters}
                    className="text-slate-500 hover:text-primary text-sm font-medium px-2 hidden sm:block"
                  >
                    Limpar
                  </button>
              </div>
          </div>
      </div>

      <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px] flex flex-col justify-between">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th 
                            onClick={() => handleSort('unit')}
                            className="px-6 py-4 w-24 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                          >
                            <div className="flex items-center gap-1">
                              Unidade
                              <span className={`material-icons text-[16px] ${sortConfig?.key === 'unit' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                {getSortIcon('unit')}
                              </span>
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('resident')}
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                          >
                            <div className="flex items-center gap-1">
                              Morador
                              <span className={`material-icons text-[16px] ${sortConfig?.key === 'resident' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                {getSortIcon('resident')}
                              </span>
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('type')}
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                          >
                            <div className="flex items-center gap-1">
                              Tipo
                              <span className={`material-icons text-[16px] ${sortConfig?.key === 'type' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                {getSortIcon('type')}
                              </span>
                            </div>
                          </th>
                          <th className="px-6 py-4">Contato</th>
                          <th className="px-6 py-4">Proprietário</th>
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
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {paginatedUnits.length > 0 ? (
                        paginatedUnits.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{row.unit}</div>
                                    <div className="text-xs text-slate-500">{row.block}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {row.resident ? (
                                            <>
                                                {row.resident.image ? (
                                                    <img 
                                                        alt={row.resident.name} 
                                                        className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-600" 
                                                        src={row.resident.image}
                                                    />
                                                ) : (
                                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${row.resident.initialsColor || 'bg-slate-200 text-slate-600'}`}>
                                                        {row.resident.initials}
                                                    </div>
                                                )}
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{row.resident.name}</div>
                                                    <div className="text-xs text-slate-500">Desde {row.resident.since}</div>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">Sem Morador</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {row.type !== '-' ? (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.typeColor}`}>
                                            {row.type}
                                        </span>
                                    ) : (
                                        <span className="text-slate-300 dark:text-slate-600">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {row.contact ? (
                                        <>
                                            <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <span className="material-icons text-[14px] text-slate-400">phone</span> {row.contact.phone}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <span className="material-icons text-[14px] text-slate-400">email</span> {row.contact.email}
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-slate-300 dark:text-slate-600">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className={`text-sm ${row.ownerItalic ? 'text-slate-400 italic' : 'text-slate-900 dark:text-white'}`}>
                                        {row.owner}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${row.statusColor}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${row.statusDot}`}></span>
                                        {row.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                    <button 
                                      onClick={() => openEditModal(row)}
                                      className="text-slate-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10"
                                      title="Editar"
                                    >
                                        <span className="material-icons text-[20px]">edit</span>
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === row.id ? null : row.id);
                                        }}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 ml-1"
                                    >
                                        <span className="material-icons text-[20px]">more_vert</span>
                                    </button>

                                    {/* Context Menu */}
                                    {activeMenuId === row.id && (
                                        <div 
                                          ref={menuRef}
                                          className="absolute right-8 top-8 w-40 bg-white dark:bg-[#1A2234] rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-10 overflow-hidden animate-fade-in"
                                        >
                                            {row.status !== 'Vago' && (
                                                <button 
                                                    onClick={() => handleVacate(row.id)}
                                                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                                >
                                                    <span className="material-icons text-[16px] text-amber-500">logout</span>
                                                    Desocupar
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(row.id)}
                                                className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                                            >
                                                <span className="material-icons text-[16px]">delete</span>
                                                Excluir
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                             <div className="flex flex-col items-center justify-center">
                                <span className="material-icons text-4xl mb-2 opacity-50">search_off</span>
                                <p>Nenhuma unidade encontrada.</p>
                                <button onClick={clearFilters} className="text-primary hover:underline mt-2 text-sm">Limpar filtros</button>
                             </div>
                          </td>
                        </tr>
                      )}
                  </tbody>
              </table>
          </div>
          
          <div className="bg-white dark:bg-[#1a2234] px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                      <p className="text-sm text-slate-700 dark:text-slate-400">
                          Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUnits.length)}</span> de <span className="font-medium">{filteredUnits.length}</span> resultados
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
                                aria-current={currentPage === page ? 'page' : undefined}
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
      
      {/* Modal Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? "Convidar Novo Morador" : "Editar Unidade"}
        onSubmit={handleSubmit}
        submitLabel={modalMode === 'create' ? "Enviar Convite" : "Salvar Alterações"}
      >
        <div className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
              <input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                type="text" 
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                placeholder="Ex: Maria Silva" 
                required 
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
              <input 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                type="email" 
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                placeholder="Ex: maria@email.com" 
                required 
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
              <input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                type="tel" 
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                placeholder="Ex: (11) 99999-9999" 
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Foto do Morador (URL)</label>
              <input 
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                type="text" 
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                placeholder="https://exemplo.com/foto.jpg" 
              />
              <p className="text-[10px] text-slate-400 mt-1">Cole um link direto para a imagem do perfil.</p>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidade</label>
                <input 
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  type="text" 
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                  placeholder="Ex: 504" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bloco</label>
                <select 
                  value={formData.block}
                  onChange={(e) => setFormData({...formData, block: e.target.value})}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option>Bloco A</option>
                  <option>Bloco B</option>
                  <option>Bloco C</option>
                </select>
              </div>
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Ocupação</label>
              <div className="flex gap-4">
                 <label className="flex items-center gap-2 text-sm cursor-pointer">
                   <input 
                     type="radio" 
                     name="type" 
                     checked={formData.type === 'Inquilino'} 
                     onChange={() => setFormData({...formData, type: 'Inquilino'})}
                     className="text-primary focus:ring-primary"
                   />
                   Inquilino
                 </label>
                 <label className="flex items-center gap-2 text-sm cursor-pointer">
                   <input 
                     type="radio" 
                     name="type" 
                     checked={formData.type === 'Proprietário'} 
                     onChange={() => setFormData({...formData, type: 'Proprietário'})}
                     className="text-primary focus:ring-primary"
                   />
                   Proprietário
                 </label>
              </div>
           </div>

           {/* Novos Campos: Proprietário e Status */}
           <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status da Unidade</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option>Ocupado</option>
                  <option>Vago</option>
                  <option>Pagamento Pendente</option>
                  <option>Em Manutenção</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Proprietário</label>
                <input 
                  value={formData.ownerName}
                  onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                  type="text" 
                  disabled={formData.type === 'Proprietário'}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none disabled:opacity-50" 
                  placeholder={formData.type === 'Proprietário' ? "(O mesmo)" : "Nome do Dono"} 
                />
              </div>
           </div>
        </div>
      </Modal>

      <div className="h-8"></div>
    </div>
  );
};

export default Directory;