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
import { User } from './types';

const App: React.FC = () => {
  // --- Auth State & Security ---
  // Verifica token no storage para persistência (JWT)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('auth_token') !== null || sessionStorage.getItem('auth_token') !== null;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Estado Global do Usuário (Carregado do Storage ou Padrão Seguro)
  const [user, setUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('user_data');
    if (savedUser) {
        try {
            return JSON.parse(savedUser);
        } catch (e) {
            console.error("Erro ao parsear usuário", e);
        }
    }
    
    // Default Seguro: Usuário vazio/não autenticado
    return {
      id: '',
      name: '',
      email: '',
      role: 'resident', // Princípio do menor privilégio
      avatar: ''
    };
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
  const handleLogin = (userData: User, remember: boolean) => {
    // Em produção: userData viria do decode do JWT
    const token = userData.token || 'mock-token'; 
    
    if (remember) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
    }
    
    setUser(userData);
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleLogout = () => {
    // Limpeza completa de sessão
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('auth_token');
    
    // Reset estado
    setUser({ id: '', name: '', email: '', role: 'resident', avatar: '' });
    setIsAuthenticated(false);
    navigate('/login');
  };

  // --- Helper do Header ---
  const getHeaderProps = () => {
    const path = location.pathname;
    switch (path) {
      case '/directory': return { title: 'Diretório', subtitle: 'Unidades e Moradores' };
      case '/reservations': return { title: 'Reservas', subtitle: 'Gestão de áreas comuns' };
      case '/communication': return { title: 'Comunicação', subtitle: 'Mural, Enquetes e Mensagens' };
      case '/financial': return { title: 'Financeiro', subtitle: user.role === 'admin' ? 'Fluxo de caixa e Contas' : 'Meus Boletos e Pagamentos' };
      case '/tickets': return { title: 'Chamados', subtitle: 'Manutenção e Solicitações' };
      case '/settings': return { title: 'Configurações', subtitle: 'Preferências e Perfil' };
      default: return {};
    }
  };

  // 1. Rota Pública: Login
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 2. Rotas Protegidas (Layout App)
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
           {/* RBAC: Passamos o objeto User para todos os componentes.
               Cada componente é responsável por renderizar a view correta (Admin vs Resident)
               baseado em user.role, simulando a resposta do backend.
           */}
           <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/directory" element={<Directory user={user} />} />
              <Route path="/reservations" element={<Reservations user={user} />} />
              <Route path="/communication" element={<Communication user={user} />} />
              <Route path="/financial" element={<Financial user={user} />} />
              <Route path="/tickets" element={<Tickets user={user} />} />
              <Route path="/settings" element={<Settings user={user} onUpdateUser={setUser} />} />
              {/* Fallback para rota inicial */}
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
           </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;
