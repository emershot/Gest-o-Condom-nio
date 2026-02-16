import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Directory from './components/Directory';
import Reservations from './components/Reservations';
import Communication from './components/Communication';
import Financial from './components/Financial';
import Tickets from './components/Tickets';
import Settings from './components/Settings';
import { IMAGES } from './constants';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Estado Global do Usuário (Persistência Simulada)
  const [user, setUser] = useState({
    name: 'Sarah Johnson',
    email: 'sarah.j@condoflow.com',
    role: 'Síndica Profissional',
    phone: '(11) 99876-5432',
    bio: 'Gestora experiente focada em transparência e eficiência condominial.',
    avatar: IMAGES.USER_AVATAR
  });

  // --- Lógica Global de Tema ---
  useEffect(() => {
    // Verifica preferência salva ou do sistema ao carregar a aplicação
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const getHeaderProps = () => {
    const path = location.pathname;

    switch (path) {
      case '/directory':
        return { showBreadcrumbs: true };
      case '/reservations':
        return { title: 'Reservas', subtitle: 'Gestão de áreas comuns' };
      case '/communication':
        return { title: 'Comunicação', subtitle: 'Mural, Enquetes e Mensagens' };
      case '/financial':
        return { title: 'Financeiro', subtitle: 'Fluxo de caixa e Contas' };
      case '/tickets':
        return { title: 'Chamados', subtitle: 'Manutenção e Solicitações' };
      case '/settings':
        return { title: 'Configurações', subtitle: 'Preferências e Perfil' };
      default:
        // Dashboard (Root)
        return {};
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
      <Sidebar 
        isOpen={isSidebarOpen} 
        closeMobileSidebar={() => setIsSidebarOpen(false)} 
        user={user}
      />
      
      <main className="flex-1 ml-0 md:ml-64 h-screen overflow-y-auto">
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          user={user}
          {...getHeaderProps()}
        />
        
        <div className="p-6 max-w-7xl mx-auto">
           <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/communication" element={<Communication />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/settings" element={<Settings user={user} onUpdateUser={setUser} />} />
           </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;