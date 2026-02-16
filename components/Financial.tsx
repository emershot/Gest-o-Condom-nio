import React, { useState, useEffect, useRef } from 'react';
import StatCard from './StatCard';
import Modal from './Modal';
import Toast from './Toast';
import { ToastMessage } from '../types';

// Tipos locais
type TransactionType = 'income' | 'expense';
type TransactionStatus = 'completed' | 'pending' | 'overdue';
type SortKey = 'description' | 'entity' | 'date' | 'amount' | 'status';

interface Transaction {
  id: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: TransactionType;
  status: TransactionStatus;
  entity: string; // Unidade ou Fornecedor
  receiptUrl?: string; // Link para comprovante
}

// Mock Data
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, description: 'Taxa Condominial - Dezembro', category: 'Cota Mensal', amount: 850.00, date: '2023-12-10', type: 'income', status: 'completed', entity: 'Unidade 302-B' },
  { id: 2, description: 'Manutenção de Elevadores', category: 'Manutenção', amount: 1200.00, date: '2023-12-09', type: 'expense', status: 'completed', entity: 'Otis Elevadores' },
  { id: 3, description: 'Serviço de Jardinagem', category: 'Jardinagem', amount: 450.00, date: '2023-12-08', type: 'expense', status: 'pending', entity: 'Verde Vida Paisagismo' },
  { id: 4, description: 'Taxa Condominial - Dezembro', category: 'Cota Mensal', amount: 850.00, date: '2023-12-10', type: 'income', status: 'overdue', entity: 'Unidade 105-A' },
  { id: 5, description: 'Conta de Energia (Áreas Comuns)', category: 'Utilidades', amount: 3240.50, date: '2023-12-05', type: 'expense', status: 'completed', entity: 'Enel' },
  { id: 6, description: 'Multa por Barulho', category: 'Multas', amount: 250.00, date: '2023-12-04', type: 'income', status: 'pending', entity: 'Unidade 501-C' },
  { id: 7, description: 'Produtos de Limpeza', category: 'Insumos', amount: 380.90, date: '2023-12-02', type: 'expense', status: 'completed', entity: 'Limpa Tudo Ltda' },
  { id: 8, description: 'Reserva Salão de Festas', category: 'Reservas', amount: 150.00, date: '2023-12-12', type: 'income', status: 'completed', entity: 'Unidade 204-A' },
  { id: 9, description: 'Seguro Predial (Parcela 10/12)', category: 'Seguros', amount: 980.00, date: '2023-12-01', type: 'expense', status: 'completed', entity: 'Porto Seguro' },
];

const Financial: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting & Pagination States
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Context Menu
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    date: '',
    type: 'expense',
    status: 'pending',
    entity: '',
    receiptUrl: ''
  });

  // Cálculos Financeiros (Business Logic)
  const realIncome = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0);
  const realExpense = transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = realIncome - realExpense;

  const pendingIncome = transactions.filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'overdue')).reduce((acc, curr) => acc + curr.amount, 0);
  const pendingExpense = transactions.filter(t => t.type === 'expense' && (t.status === 'pending' || t.status === 'overdue')).reduce((acc, curr) => acc + curr.amount, 0);

  // Helpers
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getSortIcon = (columnKey: SortKey) => {
    if (sortConfig?.key !== columnKey) return 'unfold_more';
    return sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more';
  };

  // Exportar para CSV
  const handleExport = () => {
    // Cabeçalho do CSV
    const headers = ['ID', 'Descrição', 'Categoria', 'Entidade', 'Data', 'Tipo', 'Valor', 'Status'];
    
    // Converte os dados filtrados para formato CSV
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => {
        return [
          t.id,
          `"${t.description}"`, // Aspas para evitar quebra se houver vírgula na descrição
          t.category,
          `"${t.entity}"`,
          t.date,
          t.type === 'income' ? 'Receita' : 'Despesa',
          t.amount.toFixed(2),
          t.status
        ].join(',');
      })
    ].join('\n');

    // Cria o Blob e o link de download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Relatório exportado com sucesso!', 'success');
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

  // CRUD Actions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setModalMode('create');
    const today = new Date();
    const localISODate = today.toLocaleDateString('en-CA');
    
    setFormData({ description: '', category: '', amount: '', date: localISODate, type: 'expense', status: 'pending', entity: '', receiptUrl: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transaction) => {
    setModalMode('edit');
    setEditingId(t.id);
    setFormData({
      description: t.description,
      category: t.category,
      amount: t.amount.toString(),
      date: t.date,
      type: t.type,
      status: t.status,
      entity: t.entity,
      receiptUrl: t.receiptUrl || ''
    });
    setActiveMenuId(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este lançamento?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast('Lançamento removido.', 'info');
    }
    setActiveMenuId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(formData.amount);
    
    if (isNaN(amountValue) || amountValue <= 0) {
        showToast('O valor deve ser maior que zero.', 'error');
        return;
    }

    if (modalMode === 'create') {
      const newTransaction: Transaction = {
        id: Date.now(),
        description: formData.description,
        category: formData.category,
        amount: amountValue,
        date: formData.date,
        type: formData.type as TransactionType,
        status: formData.status as TransactionStatus,
        entity: formData.entity,
        receiptUrl: formData.receiptUrl
      };
      setTransactions([newTransaction, ...transactions]);
      showToast('Transação lançada com sucesso!');
    } else {
      setTransactions(prev => prev.map(t => {
        if (t.id === editingId) {
          return {
            ...t,
            description: formData.description,
            category: formData.category,
            amount: amountValue,
            date: formData.date,
            type: formData.type as TransactionType,
            status: formData.status as TransactionStatus,
            entity: formData.entity,
            receiptUrl: formData.receiptUrl
          };
        }
        return t;
      }));
      showToast('Lançamento atualizado com sucesso!');
    }
    
    setIsModalOpen(false);
  };

  // Sorting Logic
  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtragem, Ordenação e Paginação
  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.entity.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let valA: any = a[key as keyof Transaction];
    let valB: any = b[key as keyof Transaction];

    if (key === 'amount') {
      valA = Number(valA);
      valB = Number(valB);
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'completed': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Pago / Recebido</span>;
      case 'pending': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">Pendente</span>;
      case 'overdue': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">Atrasado</span>;
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão Financeira</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Fluxo de caixa, contas a pagar e receber.</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-primary px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium shadow-sm"
            onClick={handleExport}
          >
            <span className="material-icons text-[20px]">file_download</span>
            <span className="hidden sm:inline">Exportar Relatório</span>
          </button>
          <button 
            onClick={openCreateModal}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-500/30 transition-all active:scale-95 text-sm font-medium"
          >
            <span className="material-icons text-[20px]">add</span>
            Lançar Transação
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon="account_balance_wallet"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600"
          title="Saldo em Caixa"
          value={formatCurrency(balance)}
          subtitle="Disponível (Realizado)"
          trend="+5%"
          trendPositive={true}
        />
        <StatCard 
          icon="arrow_upward"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600"
          title="Receitas (Realizadas)"
          value={formatCurrency(realIncome)}
          subtitle={`+ ${formatCurrency(pendingIncome)} a receber`}
        />
        <StatCard 
          icon="arrow_downward"
          iconBg="bg-red-50 dark:bg-red-900/20"
          iconColor="text-red-600"
          title="Despesas (Pagas)"
          value={formatCurrency(realExpense)}
          subtitle={`+ ${formatCurrency(pendingExpense)} a pagar`}
        />
        <StatCard 
          icon="pending"
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-600"
          title="Inadimplência"
          value={formatCurrency(pendingIncome)}
          subtitle="Valores vencidos ou pendentes"
          isAttention={pendingIncome > 1000}
          trendLabel={pendingIncome > 1000 ? "Atenção" : "Normal"}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#1A2234] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-full md:w-auto">
          <button 
            onClick={() => setFilterType('all')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setFilterType('income')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            Receitas
          </button>
          <button 
            onClick={() => setFilterType('expense')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            Despesas
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Buscar por descrição ou entidade..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm"
          />
          <span className="material-icons absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-[#1A2234] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th 
                  onClick={() => handleSort('description')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                >
                  <div className="flex items-center gap-1">
                    Descrição
                    <span className={`material-icons text-[16px] ${sortConfig?.key === 'description' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {getSortIcon('description')}
                    </span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('entity')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                >
                  <div className="flex items-center gap-1">
                    Entidade
                    <span className={`material-icons text-[16px] ${sortConfig?.key === 'entity' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {getSortIcon('entity')}
                    </span>
                  </div>
                </th>
                <th 
                   onClick={() => handleSort('date')}
                   className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                >
                  <div className="flex items-center gap-1">
                    Data
                    <span className={`material-icons text-[16px] ${sortConfig?.key === 'date' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {getSortIcon('date')}
                    </span>
                  </div>
                </th>
                <th 
                   onClick={() => handleSort('amount')}
                   className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                >
                  <div className="flex items-center gap-1">
                    Valor
                    <span className={`material-icons text-[16px] ${sortConfig?.key === 'amount' ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {getSortIcon('amount')}
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
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                          <span className="material-icons text-[20px]">{t.type === 'income' ? 'arrow_downward' : 'arrow_upward'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {t.description}
                            {t.receiptUrl && <span className="material-icons text-[14px] text-slate-400 ml-1" title="Comprovante Anexado">attachment</span>}
                          </p>
                          <p className="text-xs text-slate-500">{t.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {t.entity}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold whitespace-nowrap">
                      <span className={t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === t.id ? null : t.id);
                        }}
                        className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                      >
                        <span className="material-icons text-[20px]">more_vert</span>
                      </button>

                      {/* Context Menu */}
                      {activeMenuId === t.id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-8 top-8 w-40 bg-white dark:bg-[#1A2234] rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-10 overflow-hidden animate-fade-in"
                          >
                              <button 
                                  onClick={() => openEditModal(t)}
                                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                              >
                                  <span className="material-icons text-[16px]">edit</span>
                                  Editar
                              </button>
                              {t.receiptUrl && (
                                  <a 
                                    href={t.receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <span className="material-icons text-[16px]">visibility</span>
                                    Ver Comprovante
                                  </a>
                              )}
                              <button 
                                  onClick={() => handleDelete(t.id)}
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
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-icons text-4xl mb-2 opacity-50">receipt_long</span>
                      <p className="font-medium">Nenhuma transação encontrada</p>
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
                        Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedTransactions.length)}</span> de <span className="font-medium">{sortedTransactions.length}</span> resultados
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

      {/* Modal Lançar/Editar Transação */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? "Nova Transação Financeira" : "Editar Transação"}
        onSubmit={handleSubmit}
        submitLabel={modalMode === 'create' ? "Salvar Lançamento" : "Atualizar Lançamento"}
      >
        <div className="space-y-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
             <button 
               type="button"
               onClick={() => setFormData({...formData, type: 'income'})}
               className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${formData.type === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}
             >
               <span className="material-icons text-[18px]">arrow_downward</span> Receita
             </button>
             <button 
               type="button"
               onClick={() => setFormData({...formData, type: 'expense'})}
               className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-600' : 'text-slate-500'}`}
             >
               <span className="material-icons text-[18px]">arrow_upward</span> Despesa
             </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <input 
              name="description" 
              value={formData.description}
              onChange={handleInputChange}
              type="text" 
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
              placeholder={formData.type === 'income' ? "Ex: Aluguel Salão de Festas" : "Ex: Compra de Lâmpadas"} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
               <input 
                 name="amount" 
                 value={formData.amount}
                 onChange={handleInputChange}
                 type="number" 
                 step="0.01"
                 min="0.01"
                 className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                 placeholder="0,00" 
                 required 
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
               <input 
                 name="date" 
                 value={formData.date}
                 onChange={handleInputChange}
                 type="date" 
                 className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                 required 
               />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
               <select 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                  required
               >
                 <option value="">Selecione...</option>
                 {formData.type === 'income' ? (
                   <>
                     <option value="Cota Mensal">Cota Mensal</option>
                     <option value="Multas">Multas</option>
                     <option value="Reservas">Reservas</option>
                     <option value="Outros">Outros</option>
                   </>
                 ) : (
                   <>
                     <option value="Manutenção">Manutenção</option>
                     <option value="Utilidades">Utilidades (Água/Luz)</option>
                     <option value="Pessoal">Pessoal/Folha</option>
                     <option value="Insumos">Insumos/Limpeza</option>
                     <option value="Outros">Outros</option>
                   </>
                 )}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Entidade</label>
               <input 
                 name="entity" 
                 value={formData.entity}
                 onChange={handleInputChange}
                 type="text" 
                 className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                 placeholder={formData.type === 'income' ? "Unidade..." : "Fornecedor..."} 
               />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-2">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
               <select 
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
               >
                 <option value="pending">Pendente</option>
                 <option value="completed">{formData.type === 'income' ? 'Recebido' : 'Pago'}</option>
                 <option value="overdue">Atrasado</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Comprovante (URL)</label>
               <input 
                 name="receiptUrl" 
                 value={formData.receiptUrl}
                 onChange={handleInputChange}
                 type="text" 
                 className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                 placeholder="https://..." 
               />
             </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Financial;