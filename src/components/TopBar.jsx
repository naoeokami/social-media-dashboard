import { useLocation } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineBell, HiOutlineMenu } from 'react-icons/hi';
import { useApp } from '../contexts/AppContext';
import { useState } from 'react';
import ProfileModal from './ProfileModal';

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
};

export default function TopBar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';
  const { sidebarOpen, setSidebarOpen, profile } = useApp();
  const [showProfileModal, setShowProfileModal] = useState(false);

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
        <div className="relative hidden md:block">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-sm text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 w-64 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl bg-dark-700/50 border border-dark-600/50 text-dark-300 hover:text-white hover:border-dark-500 transition-all">
          <HiOutlineBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full animate-pulse-slow" />
        </button>

        {/* Avatar */}
        <div 
          onClick={() => setShowProfileModal(true)}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-brand-500/20 transition-all overflow-hidden"
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-semibold text-sm">{profile?.name ? profile.name.charAt(0).toUpperCase() : 'G3'}</span>
          )}
        </div>
      </div>
    </header>
    <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </>
  );
}
