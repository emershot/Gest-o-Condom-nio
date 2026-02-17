import React, { useState, useRef, useEffect } from 'react';
import { MOCK_NOTIFICATIONS } from '../constants';
import { NotificationItem, User } from '../types';
import Modal from './Modal';

interface HeaderProps {
  toggleSidebar: () => void;
  title?: string;
  subtitle?: string;
  showBreadcrumbs?: boolean;
  user: User;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, title, subtitle, showBreadcrumbs, user }) => {
  // Notification State & Filtering
  const isAdmin = user.role === 'admin';
  
  // FILTRO DE NOTIFICAÇÕES (LGPD)
  // Admin: Vê tudo.
  // Morador: Vê infos gerais, manutenção, e alertas APENAS se forem genéricos ou da própria unidade.
  // Mock Data ID 2: "Pagamento em Atraso - Unidade 102". Se Marcus é 202-B, ele não pode ver isso.
  const filteredNotifications = isAdmin 
    ? MOCK_NOTIFICATIONS 
    : MOCK_NOTIFICATIONS.filter(n => {
        // Se for alerta de atraso e não for da unidade do usuário, ocultar.
        if (n.type === 'alert' && n.title.includes('Pagamento')) return false; 
        return true;
    });

  const [notifications, setNotifications] = useState<NotificationItem[]>(filteredNotifications as NotificationItem[]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Help Modal State
  const [showHelp, setShowHelp] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const getIconByType = (type: string) => {
    switch(type) {
      case 'alert': return { icon: 'warning', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' };
      case 'success': return { icon: 'check_circle', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' };
      default: return { icon: 'info', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
    }
  };

  // Extrai o primeiro nome para saudação
  const firstName = user.name ? user.name.split(' ')[0] : 'Usuário';

  return (
    <>
      <header className="bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              onClick={toggleSidebar}
            >
              <span className="material-icons">menu</span>
            </button>
            
            {showBreadcrumbs ? (
              <nav aria-label="Breadcrumb" className="flex">
                <ol className="flex items-center space-x-2">
                  <li><a className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm" href="#">Propriedade</a></li>
                  <li><span className="text-slate-400 dark:text-slate-600">/</span></li>
                  <li><span className="text-slate-900 dark:text-slate-100 font-medium text-sm">Diretório</span></li>
                </ol>
              </nav>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title || `Bom dia, ${firstName}`}</h1>
                <p className="text-sm text-slate-500">{subtitle || "Veja o que está acontecendo no Sunrise Towers hoje."}</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {!showBreadcrumbs && (
              <div className="relative hidden sm:block">
                <select className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer w-48">
                  <option>Sunrise Towers</option>
                  <option>Oakwood Gardens</option>
                  <option>The Pinnacle</option>
                </select>
                <span className="material-icons absolute right-3 top-2.5 text-slate-400 pointer-events-none text-xl">expand_more</span>
              </div>
            )}
            
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2.5 pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
              />
              <span className="material-icons absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
            </div>
            
            {/* Notification Dropdown Container */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={toggleNotifications}
                className={`relative p-2 rounded-full transition-colors ${
                  showNotifications 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-icons">notifications_none</span>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#1A2234]"></span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-[#1A2234] rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-fade-in-up origin-top-right">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white">Notificações</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-primary hover:text-primary-dark"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => {
                        const style = getIconByType(notification.type);
                        return (
                          <div 
                            key={notification.id} 
                            onClick={() => markAsRead(notification.id)}
                            className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3 relative ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                          >
                            {!notification.read && (
                              <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></span>
                            )}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style.color}`}>
                              <span className="material-icons text-[16px]">{style.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notification.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1.5">{notification.time}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                        <span className="material-icons text-3xl mb-2 text-slate-300">notifications_off</span>
                        <p className="text-sm">Nenhuma notificação</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
                    <button className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                      Ver histórico completo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowHelp(true)}
              className="p-2 text-slate-400 hover:text-primary transition-colors"
              title="Central de Ajuda"
            >
              <span className="material-icons">help_outline</span>
            </button>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      <Modal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="Central de Ajuda"
        showFooter={false}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 border border-blue-100 dark:border-blue-900/30">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full h-fit text-blue-600 dark:text-blue-300">
              <span className="material-icons text-xl">support_agent</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Precisa de suporte urgente?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">Nossa equipe de especialistas está disponível 24/7 para emergências no condomínio.</p>
              <a href="tel:0800123456" className="inline-flex items-center gap-1 text-primary text-sm font-bold hover:underline">
                <span className="material-icons text-[16px]">call</span> 0800 123 456
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Perguntas Frequentes</h4>
            <div className="space-y-2">
              <details className="group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between p-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none">
                  Como cadastrar novo morador?
                  <span className="material-icons text-slate-400 transition group-open:rotate-180 text-[18px]">expand_more</span>
                </summary>
                <div className="p-3 pt-0 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 hidden group-open:block animate-fade-in">
                  Acesse o menu "Unidades" ou use o botão de "Ações Rápidas" na Dashboard para enviar um convite por e-mail. O morador receberá um link para completar o cadastro.
                </div>
              </details>
              
              <details className="group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between p-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none">
                  Como emitir segunda via de boleto?
                  <span className="material-icons text-slate-400 transition group-open:rotate-180 text-[18px]">expand_more</span>
                </summary>
                <div className="p-3 pt-0 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 hidden group-open:block animate-fade-in">
                  Vá até a seção "Financeiro" no menu lateral, selecione a unidade desejada na lista e clique no botão "Gerar Boleto" no canto superior direito.
                </div>
              </details>

              <details className="group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between p-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none">
                  Como reservar o salão de festas?
                  <span className="material-icons text-slate-400 transition group-open:rotate-180 text-[18px]">expand_more</span>
                </summary>
                <div className="p-3 pt-0 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 hidden group-open:block animate-fade-in">
                  Acesse o menu "Reservas", verifique a disponibilidade no calendário e clique no dia desejado para iniciar o processo de solicitação.
                </div>
              </details>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
             <a href="#" className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-slate-400 group-hover:text-primary text-[20px]">description</span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Documentação Completa</span>
                </div>
                <span className="material-icons text-slate-400 text-[18px]">open_in_new</span>
             </a>
             <a href="#" className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-slate-400 group-hover:text-primary text-[20px]">play_circle</span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Tutoriais em Vídeo</span>
                </div>
                <span className="material-icons text-slate-400 text-[18px]">open_in_new</span>
             </a>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Header;