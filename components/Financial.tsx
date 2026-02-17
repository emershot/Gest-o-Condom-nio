import React, { useState, useEffect, useRef } from 'react';
import StatCard from './StatCard';
import Modal from './Modal';
import Toast from './Toast';
import { ToastMessage, User } from '../types';

interface FinancialProps {
    user: User;
}

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
  entity: string;
  receiptUrl?: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, description: 'Taxa Condominial - Dezembro', category: 'Cota Mensal', amount: 850.00, date: '2023-12-10', type: 'income', status: 'completed', entity: 'Unidade 302-B' },
  { id: 2, description: 'Manutenção de Elevadores', category: 'Manutenção', amount: 1200.00, date: '2023-12-09', type: 'expense', status: 'completed', entity: 'Otis Elevadores' },
  { id: 3, description: 'Serviço de Jardinagem', category: 'Jardinagem', amount: 450.00, date: '2023-12-08', type: 'expense', status: 'pending', entity: 'Verde Vida Paisagismo' },
  { id: 4, description: 'Taxa Condominial - Dezembro', category: 'Cota Mensal', amount: 850.00, date: '2023-12-10', type: 'income', status: 'overdue', entity: 'Unidade 105-A' },
  { id: 10, description: 'Taxa Condominial - Dezembro', category: 'Cota Mensal', amount: 850.00, date: '2023-12-10', type: 'expense', status: 'pending', entity: 'Condomínio' }, // Mock para o morador (expense dele)
  { id: 11, description: 'Taxa Condominial - Novembro', category: 'Cota Mensal', amount: 850.00, date: '2023-11-10', type: 'expense', status: 'completed', entity: 'Condomínio' } // Mock para o morador
];

const Financial: React.FC<FinancialProps> = ({ user }) => {
  const isAdmin = user.role === 'admin';
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    description: '', category: '', amount: '', date: '', type: 'expense', status: 'pending', entity: '', receiptUrl: ''
  });

  // Business Logic
  // Admin: Vê tudo. Morador: Vê apenas o que é "Cota Mensal" ou "Multas" associado a ele (mockado aqui por ID > 9 para simplificar a demo de morador)
  const userTransactions = isAdmin 
    ? transactions.filter(t => t.id < 10) 
    : transactions.filter(t => t.id >= 10);

  const realIncome = userTransactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0);
  const realExpense = userTransactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = realIncome - realExpense;

  // Helpers
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const getSortIcon = (key: SortKey) => sortConfig?.key !== key ? 'unfold_more' : sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setActiveMenuId(null);
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ description: '', category: '', amount: '', date: new Date().toLocaleDateString('en-CA'), type: 'expense', status: 'pending', entity: '', receiptUrl: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transaction) => {
    setModalMode('edit');
    setEditingId(t.id);
    setFormData({ description: t.description, category: t.category, amount: t.amount.toString(), date: t.date, type: t.type, status: t.status, entity: t.entity, receiptUrl: t.receiptUrl || '' });
    setActiveMenuId(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Confirmar exclusão?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast('Lançamento removido.', 'info');
    }
    setActiveMenuId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return; // Morador não cria transação
    const amountValue = parseFloat(formData.amount);
    const newTransaction: Transaction = {
        id: modalMode === 'create' ? Date.now() : editingId!,
        description: formData.description,
        category: formData.category,
        amount: amountValue,
        date: formData.date,
        type: formData.type as TransactionType,
        status: formData.status as TransactionStatus,
        entity: formData.entity,
        receiptUrl: formData.receiptUrl
    };

    if (modalMode === 'create') {
        setTransactions([newTransaction, ...transactions]);
        showToast('Transação criada!');
    } else {
        setTransactions(prev => prev.map(t => t.id === editingId ? newTransaction : t));
        showToast('Atualizado com sucesso!');
    }
    setIsModalOpen(false);
  };

  const handleSort = (key: SortKey) => {
    setSortConfig({ key, direction: sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  };

  const filtered = userTransactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.entity.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let valA: any = a[key], valB: any = b[key];
    if (key === 'amount') { valA = Number(valA); valB = Number(valB); } else { valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase(); }
    return (valA < valB ? -1 : 1) * (direction === 'asc' ? 1 : -1);
  });

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getStatusBadge = (status: TransactionStatus) => {
    const labels = { completed: 'Pago/Recebido', pending: 'Pendente', overdue: 'Atrasado' };
    const styles = { completed: 'bg-emerald-100 text-emerald-800', pending: 'bg-blue-100 text-blue-800', overdue: 'bg-red-100 text-red-800' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="space-y-6 relative">
      <div className="fixed bottom-0 right-0 z-50 pointer-events-none">{toasts.map(t => <div key={t.id} className="pointer-events-auto"><Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} /></div>)}</div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isAdmin ? 'Gestão Financeira' : 'Meus Boletos e Contas'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isAdmin ? 'Fluxo de caixa geral.' : 'Histórico de pagamentos da sua unidade.'}</p>
        </div>
        {isAdmin && (
            <div className="flex gap-3">
            <button onClick={openCreateModal} className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium"><span className="material-icons text-[20px]">add</span> Lançar Transação</button>
            </div>
        )}
      </div>

      {/* Cards - Adaptados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdmin ? (
            <>
                <StatCard icon="account_balance_wallet" iconBg="bg-blue-50" iconColor="text-blue-600" title="Saldo em Caixa" value={formatCurrency(balance)} subtitle="Total Disponível" />
                <StatCard icon="arrow_downward" iconBg="bg-red-50" iconColor="text-red-600" title="Despesas Pagas" value={formatCurrency(realExpense)} subtitle="Mês Atual" />
                <StatCard icon="arrow_upward" iconBg="bg-emerald-50" iconColor="text-emerald-600" title="Receitas Recebidas" value={formatCurrency(realIncome)} subtitle="Mês Atual" />
            </>
        ) : (
            <>
                <StatCard icon="receipt" iconBg="bg-blue-50" iconColor="text-blue-600" title="Próximo Vencimento" value="10 Dez 2023" subtitle="Boleto mensal" />
                <StatCard icon="payment" iconBg="bg-red-50" iconColor="text-red-600" title="Valor Aberto" value={formatCurrency(850)} subtitle="Aguardando pagamento" isAttention={true} />
                <StatCard icon="history" iconBg="bg-emerald-50" iconColor="text-emerald-600" title="Último Pago" value={formatCurrency(850)} subtitle="Em 10 Nov 2023" />
            </>
        )}
      </div>

      <div className="bg-white dark:bg-[#1A2234] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase">
                <th onClick={() => handleSort('description')} className="px-6 py-4 cursor-pointer">Descrição</th>
                <th onClick={() => handleSort('date')} className="px-6 py-4 cursor-pointer">Data</th>
                <th onClick={() => handleSort('amount')} className="px-6 py-4 cursor-pointer">Valor</th>
                <th onClick={() => handleSort('status')} className="px-6 py-4 cursor-pointer">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.length > 0 ? paginated.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4"><p className="text-sm font-bold text-slate-900 dark:text-white">{t.description}</p><p className="text-xs text-slate-500">{t.category}</p></td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-bold"><span className={t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}>{t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}</span></td>
                    <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                    <td className="px-6 py-4 text-right relative">
                      {isAdmin ? (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === t.id ? null : t.id); }} className="text-slate-400 hover:text-primary p-2"><span className="material-icons">more_vert</span></button>
                            {activeMenuId === t.id && (
                                <div ref={menuRef} className="absolute right-8 top-8 w-40 bg-white dark:bg-[#1A2234] rounded-lg shadow-xl border z-10">
                                    <button onClick={() => openEditModal(t)} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex gap-2"><span className="material-icons text-[16px]">edit</span> Editar</button>
                                    <button onClick={() => handleDelete(t.id)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex gap-2"><span className="material-icons text-[16px]">delete</span> Excluir</button>
                                </div>
                            )}
                        </>
                      ) : (
                        t.status === 'pending' && <button className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark">2ª Via</button>
                      )}
                    </td>
                </tr>
              )) : <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Nenhum registro.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Nova Transação" : "Editar"} onSubmit={handleSubmit} submitLabel="Salvar">
        <div className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-lg"><button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-2 text-sm font-bold rounded ${formData.type === 'income' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>Receita</button><button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-2 text-sm font-bold rounded ${formData.type === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Despesa</button></div>
            <input name="description" value={formData.description} onChange={handleInputChange} className="w-full rounded border p-2 text-sm" placeholder="Descrição" required />
            <div className="grid grid-cols-2 gap-4">
                <input name="amount" value={formData.amount} onChange={handleInputChange} type="number" className="w-full rounded border p-2 text-sm" placeholder="Valor" required />
                <input name="date" value={formData.date} onChange={handleInputChange} type="date" className="w-full rounded border p-2 text-sm" required />
            </div>
            <select name="category" value={formData.category} onChange={handleInputChange} className="w-full rounded border p-2 text-sm"><option value="">Categoria...</option><option value="Manutenção">Manutenção</option><option value="Cota Mensal">Cota Mensal</option><option value="Outros">Outros</option></select>
        </div>
      </Modal>}
    </div>
  );
};

export default Financial;
