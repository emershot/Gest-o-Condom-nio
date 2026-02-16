import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import Modal from './Modal';
import { ToastMessage } from '../types';

interface UserData {
  name: string;
  email: string;
  role: string;
  phone: string;
  bio: string;
  avatar: string;
}

interface SettingsProps {
  user: UserData;
  onUpdateUser: (data: UserData) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'security'>('profile');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Form States
  const [profileData, setProfileData] = useState(user);
  
  // UI States
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Sincroniza estado local se o pai mudar
  useEffect(() => {
    setProfileData(user);
  }, [user]);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushTickets: true,
    pushPayments: false,
    newsletter: true
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // --- Theme Logic ---
  useEffect(() => {
    // Apenas lê o estado atual para sincronizar o botão, a inicialização é feita no App.tsx
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  // --- Helpers ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveProfile = () => {
    setIsLoading(true);
    // Simula delay de rede
    setTimeout(() => {
      onUpdateUser(profileData); // Atualiza estado global no App.tsx
      setIsLoading(false);
      showToast('Perfil atualizado com sucesso!', 'success');
      setShowAvatarInput(false);
    }, 800);
  };

  const handlePasswordUpdate = () => {
    if (security.newPassword !== security.confirmPassword) {
        showToast('As senhas não coincidem.', 'error');
        return;
    }
    if (security.newPassword.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }

    setIsLoading(true);
    setTimeout(() => { 
        setIsLoading(false); 
        showToast('Senha atualizada com segurança!', 'success'); 
        setSecurity({currentPassword: '', newPassword: '', confirmPassword: ''});
    }, 1000);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    showToast("Sessão encerrada com segurança.", "info");
    // Aqui iria a lógica de redirecionamento real
  };

  return (
    <div className="relative max-w-4xl mx-auto pb-10">
      {/* Toast Container */}
      <div className="fixed bottom-0 right-0 z-50 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar de Navegação das Configurações */}
        <div className="md:col-span-3">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-[#1A2234] text-primary shadow-sm border border-slate-200 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-icons text-[20px]">person</span>
              Meu Perfil
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'appearance'
                  ? 'bg-white dark:bg-[#1A2234] text-primary shadow-sm border border-slate-200 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-icons text-[20px]">palette</span>
              Aparência
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-white dark:bg-[#1A2234] text-primary shadow-sm border border-slate-200 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-icons text-[20px]">notifications</span>
              Notificações
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'security'
                  ? 'bg-white dark:bg-[#1A2234] text-primary shadow-sm border border-slate-200 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-icons text-[20px]">lock</span>
              Segurança
            </button>
          </nav>
        </div>

        {/* Área de Conteúdo */}
        <div className="md:col-span-9 space-y-6">
          
          {/* PERFIL */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-[#1A2234] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Informações do Perfil</h2>
              <p className="text-sm text-slate-500 mb-6">Atualize seus dados pessoais e informações de contato.</p>

              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="relative group cursor-pointer" onClick={() => setShowAvatarInput(!showAvatarInput)}>
                  <img 
                    src={profileData.avatar} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-700 object-cover shadow-sm" 
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-icons text-white text-[24px]">camera_alt</span>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left w-full">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{profileData.name}</h3>
                  <p className="text-sm text-slate-500 mb-2">{profileData.role}</p>
                  
                  {showAvatarInput ? (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 text-left">URL da Imagem</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={profileData.avatar}
                                onChange={(e) => setProfileData({...profileData, avatar: e.target.value})}
                                placeholder="https://..."
                                className="flex-1 text-xs rounded border border-slate-300 dark:border-slate-600 p-2 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary outline-none"
                            />
                            <button 
                                onClick={() => setShowAvatarInput(false)}
                                className="p-2 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 transition-colors"
                            >
                                <span className="material-icons text-[16px] text-slate-600 dark:text-slate-300">close</span>
                            </button>
                        </div>
                    </div>
                  ) : (
                    <button 
                        onClick={() => setShowAvatarInput(true)} 
                        className="text-xs text-primary font-bold hover:underline flex items-center justify-center sm:justify-start gap-1"
                    >
                        <span className="material-icons text-[14px]">edit</span> Alterar foto
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo / Função</label>
                  <input 
                    type="text" 
                    value={profileData.role}
                    onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                  <input 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                  <input 
                    type="tel" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio / Sobre</label>
                <textarea 
                  rows={3}
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-all active:scale-95 flex items-center gap-2"
                >
                  {isLoading && <span className="material-icons animate-spin text-[16px]">refresh</span>}
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {/* APARÊNCIA */}
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-[#1A2234] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Aparência do Sistema</h2>
              <p className="text-sm text-slate-500 mb-6">Personalize como o CondoFlow é exibido para você.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => handleThemeChange('light')}
                  className={`group relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                    theme === 'light' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full h-24 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative shadow-inner">
                    <div className="absolute top-2 left-2 w-16 h-4 bg-white rounded shadow-sm"></div>
                    <div className="absolute top-8 left-2 w-8 h-12 bg-white rounded shadow-sm"></div>
                    <div className="absolute top-8 left-12 w-full h-12 bg-white rounded shadow-sm"></div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`material-icons ${theme === 'light' ? 'text-primary' : 'text-slate-400'}`}>light_mode</span>
                     <span className={`font-medium ${theme === 'light' ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>Modo Claro</span>
                  </div>
                  {theme === 'light' && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="material-icons text-white text-[10px]">check</span>
                    </div>
                  )}
                </button>

                <button 
                  onClick={() => handleThemeChange('dark')}
                  className={`group relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                    theme === 'dark' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full h-24 bg-[#111621] rounded-lg border border-slate-700 overflow-hidden relative shadow-inner">
                    <div className="absolute top-2 left-2 w-16 h-4 bg-[#1A2234] rounded shadow-sm"></div>
                    <div className="absolute top-8 left-2 w-8 h-12 bg-[#1A2234] rounded shadow-sm"></div>
                    <div className="absolute top-8 left-12 w-full h-12 bg-[#1A2234] rounded shadow-sm"></div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`material-icons ${theme === 'dark' ? 'text-primary' : 'text-slate-400'}`}>dark_mode</span>
                     <span className={`font-medium ${theme === 'dark' ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>Modo Escuro</span>
                  </div>
                  {theme === 'dark' && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="material-icons text-white text-[10px]">check</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICAÇÕES */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-[#1A2234] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Preferências de Notificação</h2>
              <p className="text-sm text-slate-500 mb-6">Escolha como e quando você quer ser avisado.</p>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Alertas por E-mail</p>
                    <p className="text-xs text-slate-500">Receba um resumo diário das atividades.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.emailAlerts} onChange={() => setNotifications({...notifications, emailAlerts: !notifications.emailAlerts})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Novos Chamados</p>
                    <p className="text-xs text-slate-500">Notificação push imediata ao abrir chamado.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.pushTickets} onChange={() => setNotifications({...notifications, pushTickets: !notifications.pushTickets})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Pagamentos Recebidos</p>
                    <p className="text-xs text-slate-500">Notificar quando uma cota for quitada.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.pushPayments} onChange={() => setNotifications({...notifications, pushPayments: !notifications.pushPayments})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                 <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Newsletter do CondoFlow</p>
                    <p className="text-xs text-slate-500">Novidades e atualizações da plataforma.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.newsletter} onChange={() => setNotifications({...notifications, newsletter: !notifications.newsletter})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button 
                  onClick={() => {
                      showToast('Preferências salvas!', 'success');
                  }}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-all active:scale-95"
                >
                   Salvar Preferências
                </button>
              </div>
            </div>
          )}

           {/* SEGURANÇA */}
           {activeTab === 'security' && (
            <div className="bg-white dark:bg-[#1A2234] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Segurança da Conta</h2>
              <p className="text-sm text-slate-500 mb-6">Gerencie sua senha e sessões ativas.</p>

              <div className="space-y-4 max-w-md">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha Atual</label>
                  <input 
                    type="password" 
                    value={security.currentPassword}
                    onChange={(e) => setSecurity({...security, currentPassword: e.target.value})}
                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
                  <input 
                    type="password" 
                    value={security.newPassword}
                    onChange={(e) => setSecurity({...security, newPassword: e.target.value})}
                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    value={security.confirmPassword}
                    onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})}
                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                <div className="text-left">
                     <p className="text-xs font-bold text-slate-500 uppercase mb-2">Zona de Perigo</p>
                     <button 
                        onClick={() => setShowLogoutModal(true)}
                        className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 flex items-center gap-1"
                     >
                         <span className="material-icons text-[16px]">logout</span> Sair da Conta
                     </button>
                </div>

                <button 
                  onClick={handlePasswordUpdate}
                  disabled={isLoading || !security.newPassword}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                   {isLoading && <span className="material-icons animate-spin text-[16px]">refresh</span>}
                   Atualizar Senha
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Logout Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Encerrar Sessão"
        onSubmit={confirmLogout}
        submitLabel="Sair"
      >
        <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                <span className="material-icons text-3xl">logout</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Tem certeza que deseja sair?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
                Você precisará fazer login novamente para acessar o painel administrativo.
            </p>
        </div>
      </Modal>

    </div>
  );
};

export default Settings;