import React, { useState } from 'react';
import { IMAGES } from '../constants';
import Modal from './Modal';
import Toast from './Toast';
import { ToastMessage, User } from '../types';

interface LoginProps {
  onLogin: (user: User, remember: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // Estados de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Estados de Funcionalidades Extras
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  // --- Helpers ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validação básica de frontend
    if (!email.includes('@') || !email.includes('.')) {
        setError('Por favor, insira um endereço de e-mail válido.');
        setIsLoading(false);
        return;
    }

    // SIMULAÇÃO DE BACKEND (Autenticação)
    // Em produção, isso seria um fetch('/api/auth/login')
    setTimeout(() => {
      // Perfil SÍNDICO (ADMIN)
      if (email === 'admin@condoflow.com' && password === '123456') {
        const adminUser: User = {
          id: 'adm-001',
          name: 'Sarah Johnson',
          email: 'admin@condoflow.com',
          role: 'admin',
          avatar: IMAGES.USER_AVATAR,
          bio: 'Gestora Profissional',
          token: 'jwt-token-admin-mock' // Simulando JWT
        };
        onLogin(adminUser, rememberMe);
      } 
      // Perfil MORADOR (RESIDENT)
      else if (email === 'morador@condoflow.com' && password === '123456') {
        const residentUser: User = {
          id: 'res-202b',
          name: 'Marcus Morador',
          email: 'morador@condoflow.com',
          role: 'resident',
          avatar: IMAGES.RESIDENT_MARCUS,
          unit: '202-B',
          block: 'Bloco B',
          token: 'jwt-token-resident-mock' // Simulando JWT
        };
        onLogin(residentUser, rememberMe);
      } 
      else {
        // Auditoria de falha de login seria registrada aqui no backend
        setError('Credenciais inválidas. Tente admin@condoflow.com ou morador@condoflow.com');
        setPassword('');
        setIsLoading(false);
      }
    }, 1200);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotOpen(false);
    showToast(`Instruções enviadas para ${recoveryEmail} (se existir na base).`, 'success');
    setRecoveryEmail('');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsContactOpen(false);
      showToast('Solicitação enviada para a administração.', 'success');
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#111621] relative">
      <div className="fixed bottom-0 right-0 z-[60] pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>

      {/* Lado Esquerdo - Visual Institucional */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900">
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop" 
          alt="Condomínio Moderno" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="material-icons text-3xl">apartment</span>
            CondoFlow
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Gestão inteligente e segura.</h2>
            <p className="text-lg text-slate-200 max-w-md">Acesso restrito a moradores e administração autorizada.</p>
          </div>
          <div className="text-sm text-slate-400">
            © 2024 CondoFlow Technologies. Security First.
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-[#111621]">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center items-center gap-2 text-primary font-bold text-2xl mb-8">
               <span className="material-icons">apartment</span>
               CondoFlow
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Acesso ao Portal</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Ambiente seguro para gestão condominial.
            </p>
            
            <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-500 border border-slate-200 dark:border-slate-700">
              <p className="mb-1"><strong className="text-slate-700 dark:text-slate-300">Síndico:</strong> admin@condoflow.com / 123456</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Morador:</strong> morador@condoflow.com / 123456</p>
            </div>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  E-mail
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-slate-400 text-[20px]">email</span>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm py-2.5 transition-shadow"
                    placeholder="nome@dominio.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Senha
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-slate-400 text-[20px]">lock</span>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm py-2.5 transition-shadow"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    >
                      <span className="material-icons text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    Manter conectado
                  </label>
                </div>

                <div className="text-sm">
                  <button 
                    type="button"
                    onClick={() => {
                        setRecoveryEmail(email);
                        setIsForgotOpen(true);
                    }}
                    className="font-medium text-primary hover:text-primary-dark hover:underline outline-none focus:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 animate-fade-in" role="alert">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="material-icons text-red-400 text-[20px]">error</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span className="material-icons animate-spin text-[20px]">refresh</span>
                  ) : (
                    'Acessar Painel'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
               <div className="text-center">
                 <p className="text-xs text-slate-400">
                    Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title="Recuperação de Acesso"
        onSubmit={handleForgotSubmit}
        submitLabel="Enviar Link"
      >
        <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
                Por segurança, enviaremos um link temporário para o e-mail cadastrado na unidade.
            </p>
            <div>
                <label htmlFor="recovery-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  E-mail oficial
                </label>
                <input
                    id="recovery-email"
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="ex: nome@email.com"
                />
            </div>
        </div>
      </Modal>

      <Modal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        title="Primeiro Acesso"
        onSubmit={handleContactSubmit}
        submitLabel="Solicitar Cadastro"
      >
        <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
                Para garantir a segurança do condomínio, novos cadastros passam por aprovação da administração.
            </p>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                <input type="text" required className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidade</label>
                <input type="text" required placeholder="Ex: 204 Bloco A" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" />
            </div>
        </div>
      </Modal>

    </div>
  );
};

export default Login;
