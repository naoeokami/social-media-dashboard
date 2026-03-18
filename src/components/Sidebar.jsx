import { NavLink } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import {
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineLightBulb,
  HiOutlineChartBar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSparkles,
  HiOutlineClipboardList,
  HiOutlineShoppingBag,
} from 'react-icons/hi';

const navItems = [
  { path: '/', label: 'Dashboard', icon: HiOutlineHome },
  { path: '/calendario', label: 'Calendário', icon: HiOutlineCalendar },
  { path: '/aprovacao', label: 'Aprovação', icon: HiOutlineCheckCircle },
  { path: '/swipe-file', label: 'Swipe File', icon: HiOutlineLightBulb },
  { path: '/relatorios', label: 'Relatórios', icon: HiOutlineChartBar },
  { path: '/tarefas', label: 'Guia de Tarefas', icon: HiOutlineClipboardList },
  { path: '/produtos', label: 'Produtos e Segmentos', icon: HiOutlineShoppingBag },
  { path: '/agente', label: 'Agente IA', icon: HiOutlineSparkles },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp();

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'
        } bg-dark-800/95 backdrop-blur-xl border-r border-dark-600/50`}
      >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-dark-600/50">
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 shadow-lg glow-brand">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        {sidebarOpen && (
          <span className="font-bold text-lg bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap animate-fade-in">
            SocialHub
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => {
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400 shadow-lg shadow-brand-500/10'
                  : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-500 rounded-r-full" />
                )}
                <Icon className="w-6 h-6 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium text-sm whitespace-nowrap animate-fade-in">
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t border-dark-600/50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-dark-300 hover:text-white hover:bg-dark-700/50 transition-all duration-200 hidden md:flex"
        >
          {sidebarOpen ? (
            <>
              <HiOutlineChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Recolher</span>
            </>
          ) : (
            <HiOutlineChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
