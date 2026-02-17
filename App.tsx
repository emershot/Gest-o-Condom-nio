import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Directory from './components/Directory';
import Reservations from './components/Reservations';
import Communication from './components/Communication';
import Financial from './components/Financial';
import Tickets from './components/Tickets';
import Settings from './components/Settings';
import Login from './components/Login';
import { IMAGES } from './constants';

const App: React.FC = () => {
  // --- Auth State ---
  // Verifica ambos os storages ao iniciar
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('auth_token') === 'true' || sessionStorage.getItem('auth_token') === 'true';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // --- Handlers de Auth ---
  const handleLogin = (remember: boolean) => {
    if (remember) {
      localStorage.setItem('auth_token', 'true');
    } else {
      sessionStorage.setItem('auth_token', 'true');
    }
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  // --- Helper do Header ---
  const getHeaderProps = () => {
    const path = location.pathname;
    switch (path) {
      case '/directory': return { showBreadcrumbs: true };
      case '/reservations': return { title: 'Reservas', subtitle: 'Gestão de áreas comuns' };
      case '/communication': return { title: 'Comunicação', subtitle: 'Mural, Enquetes e Mensagens' };
      case '/financial': return { title: 'Financeiro', subtitle: 'Fluxo de caixa e Contas' };
      case '/tickets': return { title: 'Chamados', subtitle: 'Manutenção e Solicitações' };
      case '/settings': return { title: 'Configurações', subtitle: 'Preferências e Perfil' };
      default: return {};
    }
  };

  // Se não estiver autenticado, renderiza APENAS o Login (ou redireciona)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Layout do Dashboard (Protegido)
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
              <Route path="/login" element={<Navigate to="/" replace />} />
           </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;