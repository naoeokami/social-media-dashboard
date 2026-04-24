import { useLocation } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineBell, HiOutlineMenu } from 'react-icons/hi';
import { useApp } from '../contexts/AppContext';
import { useState, useRef, useEffect } from 'react';
import ProfileModal from './ProfileModal';
import PostModal from './PostModal';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const pageTitles = {
  '/': 'Dashboard',
  '/calendario': 'Calendário de Conteúdo',
  '/aprovacao': 'Aprovação de Conteúdo',
  '/cronograma': 'Cronograma Semanal',
  '/swipe-file': 'Swipe File',
  '/relatorios': 'Relatórios',
  '/tarefas': 'Guia de Tarefas',
  '/produtos': 'Produtos e Segmentos',
  '/agente': 'Agente IA',
  '/comandas': 'Gerar Comandas',
};

export default function TopBar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';
  const { sidebarOpen, setSidebarOpen, profile, posts, updatePost } = useApp();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState(() => JSON.parse(localStorage.getItem('socialhub_read_notifs') || '[]'));
  const notifRef = useRef(null);

  // Chave unica para estado da notificacao
  const getNotifKey = (notif) => `${notif.id}-${notif.status}-${notif.feedback_note || ''}`;

  // Fecha notificação ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = (posts || [])
    .filter(p => !readNotifs.includes(getNotifKey(p)))
    .filter(p => p.status === 'agendado' || (p.status === 'producao' && p.feedback_note))
    .sort((a, b) => new Date(b.created_at || new Date()) - new Date(a.created_at || new Date()))
    .slice(0, 5);

  const handleNotifClick = (notif) => {
    const key = getNotifKey(notif);
    if (!readNotifs.includes(key)) {
      const newReads = [...readNotifs, key];
      setReadNotifs(newReads);
      localStorage.setItem('socialhub_read_notifs', JSON.stringify(newReads));
    }
    
    setEditingPost(notif);
    setIsPostModalOpen(true);
    setShowNotif(false);
  };

  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-dark-600/50 bg-dark-800/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 -ml-2 text-dark-300 hover:text-white transition-colors"
          >
            <HiOutlineMenu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white truncate max-w-[150px] sm:max-w-none">{title}</h1>
        <p className="hidden sm:block text-xs text-dark-400 mt-0.5">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        {/* <div className="relative hidden md:block">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 w-64 transition-all"
          />
        </div> */}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2.5 rounded-xl bg-dark-700/50 border border-dark-600/50 text-dark-300 hover:text-white hover:border-dark-500 transition-all"
          >
            <HiOutlineBell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full animate-pulse-slow" />
            )}
          </button>

          {showNotif && (
            <div className="absolute top-12 right-0 w-80 bg-dark-800 border border-dark-600/50 rounded-2xl shadow-2xl overflow-hidden z-50 animate-slide-up">
              <div className="p-4 border-b border-dark-600/50 flex items-center justify-between">
                <h3 className="font-bold text-white">Notificações</h3>
                <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded-md">{notifications.length} novas</span>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-sm text-dark-400 p-6 text-center">Nenhuma notificação no momento.</p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => handleNotifClick(notif)}
                      className="p-4 border-b border-dark-600/30 hover:bg-dark-700/30 transition-colors cursor-pointer flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-2">
                        {notif.status === 'agendado' ? (
                           <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                        ) : (
                           <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0 animate-pulse" />
                        )}
                        <span className="text-sm font-semibold text-white truncate">{notif.title}</span>
                      </div>
                      <p className="text-xs text-dark-300 ml-4">
                        {notif.status === 'agendado' ? 'Post foi Aprovado pelo cliente!' : `Ajustes: ${notif.feedback_note}`}
                      </p>
                      {notif.date && (
                        <p className="text-[10px] text-dark-400 ml-4 mt-1">
                           Para: {format(parseISO(notif.date), "dd/MM/yyyy")}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div 
          onClick={() => setShowProfileModal(true)}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-brand-500/20 transition-all overflow-hidden"
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-semibold text-sm">{profile?.name ? profile.name.charAt(0).toUpperCase() : ''}</span>
          )}
        </div>
      </div>
    </header>
    <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    <PostModal 
      isOpen={isPostModalOpen} 
      onClose={() => { setIsPostModalOpen(false); setEditingPost(null); }} 
      onSave={(data) => updatePost(editingPost.id, data)} 
      editingPost={editingPost} 
    />
    </>
  );
}
