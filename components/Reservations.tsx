import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Toast from './Toast';
import { ToastMessage, User } from '../types';

interface ReservationsProps {
    user: User;
}

// ... Interfaces Reservation, AREAS ... (Mantidas para brevidade)
interface Reservation { id: number; area: string; residentName: string; unit: string; date: string; startTime: string; endTime: string; guests: number; status: 'pending' | 'approved' | 'rejected' | 'completed'; notes?: string; image?: string; }
const AREAS = [{ id: 'salao', name: 'Salão de Festas', capacity: 80 }, { id: 'churrasqueira', name: 'Churrasqueira', capacity: 20 }];

// Mock Data Inicial
const INITIAL_RESERVATIONS: Reservation[] = [
  { id: 1, area: 'Salão de Festas', residentName: 'Ana Souza', unit: '302-B', date: '2023-12-24', startTime: '18:00', endTime: '23:59', guests: 45, status: 'pending' },
  { id: 2, area: 'Churrasqueira', residentName: 'Marcus Morador', unit: '202-B', date: '2023-12-20', startTime: '12:00', endTime: '18:00', guests: 10, status: 'approved' }
];

const Reservations: React.FC<ReservationsProps> = ({ user }) => {
  const isAdmin = user.role === 'admin';
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming'>('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [formData, setFormData] = useState({ area: AREAS[0].name, date: '', startTime: '', endTime: '', guests: '', notes: '' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  // Filtro: Admin vê tudo, Morador vê as suas
  const userReservations = isAdmin ? reservations : reservations.filter(r => r.unit === (user.unit || '202-B'));

  const filtered = userReservations.filter(res => {
     if (activeTab === 'pending') return res.status === 'pending';
     if (activeTab === 'upcoming') return res.status === 'approved';
     return false;
  });

  const handleStatusChange = (id: number, status: 'approved' | 'rejected') => {
    if (!isAdmin) return;
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    showToast(`Reserva ${status === 'approved' ? 'Aprovada' : 'Rejeitada'}!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRes: Reservation = {
        id: Date.now(),
        area: formData.area,
        residentName: user.name,
        unit: user.unit || '202-B',
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        guests: Number(formData.guests),
        status: 'pending',
        notes: formData.notes
    };
    setReservations([newRes, ...reservations]);
    setIsModalOpen(false);
    showToast('Solicitação enviada! Aguarde aprovação.');
  };

  return (
    <div className="space-y-6 relative">
      <div className="fixed bottom-0 right-0 z-50 pointer-events-none">{toasts.map(t => <div key={t.id} className="pointer-events-auto"><Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} /></div>)}</div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reservas</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium">Nova Reserva</button>
      </div>

      <div className="flex gap-4 border-b dark:border-slate-800">
         <button onClick={() => setActiveTab('pending')} className={`pb-2 border-b-2 ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Pendentes</button>
         <button onClick={() => setActiveTab('upcoming')} className={`pb-2 border-b-2 ${activeTab === 'upcoming' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Aprovadas</button>
      </div>

      <div className="space-y-4">
        {filtered.map(res => (
            <div key={res.id} className="bg-white dark:bg-[#1A2234] p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{res.area}</h3>
                    <p className="text-sm text-slate-500">{res.date} • {res.startTime} - {res.endTime}</p>
                    <p className="text-xs text-slate-400">{res.residentName} ({res.unit})</p>
                </div>
                <div className="flex gap-2">
                    {res.status === 'pending' && isAdmin ? (
                        <>
                            <button onClick={() => handleStatusChange(res.id, 'approved')} className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded text-xs font-bold">Aprovar</button>
                            <button onClick={() => handleStatusChange(res.id, 'rejected')} className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs font-bold">Rejeitar</button>
                        </>
                    ) : (
                        <span className={`px-3 py-1 rounded text-xs font-bold ${res.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {res.status === 'approved' ? 'Aprovada' : 'Aguardando'}
                        </span>
                    )}
                </div>
            </div>
        ))}
        {filtered.length === 0 && <p className="text-slate-500 text-center py-8">Nenhuma reserva encontrada.</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Reserva" onSubmit={handleSubmit} submitLabel="Solicitar">
         <div className="space-y-4">
            <select className="w-full border rounded p-2" onChange={e => setFormData({...formData, area: e.target.value})}><option>Salão de Festas</option><option>Churrasqueira</option></select>
            <input type="date" className="w-full border rounded p-2" onChange={e => setFormData({...formData, date: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
                <input type="time" className="w-full border rounded p-2" onChange={e => setFormData({...formData, startTime: e.target.value})} required />
                <input type="time" className="w-full border rounded p-2" onChange={e => setFormData({...formData, endTime: e.target.value})} required />
            </div>
            <input type="number" placeholder="Convidados" className="w-full border rounded p-2" onChange={e => setFormData({...formData, guests: e.target.value})} required />
         </div>
      </Modal>
    </div>
  );
};

export default Reservations;
