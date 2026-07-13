import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineLightBulb,
  HiOutlineSparkles,
  HiOutlineClipboardList,
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineQrcode,
  HiOutlineEye,
  HiOutlineBookOpen,
  HiOutlineDotsHorizontal,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineCog,
} from 'react-icons/hi';

const staticNavItems = [
  { path: '/', label: 'Dashboard', icon: HiOutlineHome },
  { path: '/calendario', label: 'Calendário', icon: HiOutlineCalendar },
  { path: '/cronograma', label: 'Cronograma', icon: HiOutlineClock },
  { path: '/aprovacao', label: 'Aprovação', icon: HiOutlineCheckCircle },
  { path: '/swipe-file', label: 'Swipe File', icon: HiOutlineLightBulb },
  { path: '/visualizacao-ideia', label: 'Visualização de Ideia', icon: HiOutlineEye },
  { path: '/tarefas', label: 'Guia de Tarefas', icon: HiOutlineClipboardList },
  { path: '/atividades', label: 'Diário de Atividades', icon: HiOutlineBookOpen },
  { path: '/produtos', label: 'Produtos e Segmentos', icon: HiOutlineShoppingBag },
  { path: '/comandas', label: 'Gerar Comandas', icon: HiOutlineQrcode },
  { path: '/agente', label: 'Agente IA', icon: HiOutlineSparkles },
];

export default function Sidebar() {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempOrder, setTempOrder] = useState([]);

  // Load custom order from localStorage or fallback to default
  const [itemsOrder, setItemsOrder] = useState(() => {
    const saved = localStorage.getItem('socialhub_dock_order');
    if (saved) {
      try {
        const paths = JSON.parse(saved);
        const ordered = paths
          .map(p => staticNavItems.find(item => item.path === p))
          .filter(Boolean);
        const missing = staticNavItems.filter(item => !paths.includes(item.path));
        return [...ordered, ...missing];
      } catch (e) {
        return [...staticNavItems];
      }
    }
    return [...staticNavItems];
  });

  const coreItems = itemsOrder.slice(0, 4);
  const moreItems = itemsOrder.slice(4);

  const openEditing = () => {
    setTempOrder([...itemsOrder]);
    setIsEditing(true);
  };

  const handleMove = (index, direction) => {
    const newOrder = [...tempOrder];
    if (direction === 'up' && index > 0) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[index - 1];
      newOrder[index - 1] = temp;
    } else if (direction === 'down' && index < newOrder.length - 1) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[index + 1];
      newOrder[index + 1] = temp;
    }
    setTempOrder(newOrder);
  };

  const handleSave = () => {
    setItemsOrder(tempOrder);
    localStorage.setItem('socialhub_dock_order', JSON.stringify(tempOrder.map(item => item.path)));
    setIsEditing(false);
  };

  return (
    <>
      {/* DESKTOP FLOATING DOCK */}
      <aside
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 border border-dark-600 shadow-xl rounded-2xl px-4 py-1.5 hidden md:flex items-center gap-1.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Logo / Home Navigation */}
        <NavLink
          to="/"
          className="flex items-center justify-center pr-3.5 border-r border-dark-600"
          title="Ir para Dashboard"
        >
          <span className="text-base font-black text-brand-500 hover:scale-110 active:scale-95 transition-all cursor-pointer">S</span>
        </NavLink>

        {/* Navigation List */}
        <nav className="flex items-center gap-1">
          {itemsOrder.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `relative group flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-brand-500 scale-110' 
                    : 'text-dark-300 hover:text-dark-50 hover:scale-115'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5.5 h-5.5 flex-shrink-0" />
                  
                  {/* Tooltip */}
                  <span className="absolute bottom-14 bg-dark-50 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap shadow-md z-[60] border border-dark-200">
                    {label}
                  </span>

                  {/* Active Indicator Dot */}
                  <span className={`absolute bottom-0 w-1.5 h-1.5 rounded-full bg-brand-500 transition-all duration-300 ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`} />
                </>
              )}
            </NavLink>
          ))}

          {/* Personalize Button (Gear) */}
          <button
            onClick={openEditing}
            className="relative flex flex-col items-center justify-center p-2.5 rounded-xl text-dark-300 hover:text-dark-50 hover:scale-115 transition-all duration-200"
            title="Personalizar Atalhos"
          >
            <HiOutlineCog className="w-5.5 h-5.5 flex-shrink-0" />
          </button>
        </nav>
      </aside>

      {/* MOBILE FLOATING DOCK (Ubuntu style centered, fully balanced) */}
      <aside
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 border border-dark-600 shadow-xl rounded-full px-5 py-2 flex md:hidden items-center justify-between w-[92vw] max-w-sm"
      >
        {/* Logo */}
        <NavLink
          to="/"
          className="flex items-center justify-center pr-3.5 border-r border-dark-600 text-lg font-black text-brand-500"
        >
          S
        </NavLink>

        {/* Core items */}
        <nav className="flex-1 flex items-center justify-around px-2">
          {coreItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-brand-500 scale-110' 
                    : 'text-dark-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-7 h-7 flex-shrink-0" />
                  
                  {/* Active Indicator Dot */}
                  <span className={`absolute bottom-0 w-1.5 h-1.5 rounded-full bg-brand-500 transition-all duration-300 ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`} />
                </>
              )}
            </NavLink>
          ))}

          {/* More Items Trigger Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
              showMoreMenu ? 'text-brand-500 scale-110' : 'text-dark-300'
            }`}
          >
            <HiOutlineDotsHorizontal className="w-7 h-7 flex-shrink-0" />
          </button>
        </nav>
      </aside>

      {/* MOBILE MORE MENU OVERLAY */}
      {showMoreMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[92vw] max-w-sm z-[45] md:hidden">
            <div className="bg-white border border-dark-600 rounded-3xl shadow-2xl p-5 flex flex-col gap-2.5 animate-slide-up w-full">
              <div className="px-2 pb-3 border-b border-dark-600 mb-2 flex items-center justify-between">
                <span className="text-[12px] font-bold text-dark-300 uppercase tracking-widest">Mais Recursos</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setShowMoreMenu(false); openEditing(); }}
                    className="text-xs text-brand-500 font-bold hover:text-brand-600"
                  >
                    Editar
                  </button>
                  <span className="text-dark-600">|</span>
                  <button 
                    onClick={() => setShowMoreMenu(false)}
                    className="text-xs text-dark-300 font-bold hover:text-dark-100"
                  >
                    Fechar
                  </button>
                </div>
              </div>
              {/* 2-column grid layout to remain low-height */}
              <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-0.5 custom-scrollbar">
                {moreItems.map(({ path, label, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => setShowMoreMenu(false)}
                    className={({ isActive }) =>
                      `flex flex-col items-start gap-2 p-3 rounded-2xl border transition-all duration-150 ${
                        isActive 
                          ? 'bg-brand-50 border-brand-200 text-brand-500 font-bold' 
                          : 'bg-dark-800 border-dark-600/40 text-dark-200 hover:bg-dark-700 hover:text-dark-50'
                      }`
                    }
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    <span className="text-[11px] font-bold leading-tight mt-0.5">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* PERSONALIZATION MODAL */}
      {isEditing && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setIsEditing(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-full max-w-sm bg-white border border-dark-600 rounded-3xl shadow-2xl p-6 z-[55] flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-dark-600 pb-3">
              <h3 className="font-extrabold text-sm text-dark-50 uppercase tracking-wider">Personalizar Dock</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-xs text-dark-300 hover:text-dark-50 font-semibold"
              >
                Cancelar
              </button>
            </div>
            
            <p className="text-[11px] text-dark-400 font-medium leading-relaxed">
              Ordene os itens usando as setas. Os <strong>4 primeiros itens</strong> do topo serão fixados diretamente no dock do celular.
            </p>

            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-1.5 custom-scrollbar">
              {tempOrder.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={item.path} 
                    className="flex items-center justify-between p-2.5 bg-dark-800 border border-dark-600/60 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-dark-300" />
                      <span className="text-xs font-semibold text-dark-100">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className={`p-1.5 rounded-lg border border-dark-600 transition-colors ${
                          index === 0 ? 'text-dark-400 bg-dark-700/50 cursor-not-allowed' : 'text-dark-100 hover:bg-dark-700'
                        }`}
                      >
                        <HiOutlineArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === tempOrder.length - 1}
                        className={`p-1.5 rounded-lg border border-dark-600 transition-colors ${
                          index === tempOrder.length - 1 ? 'text-dark-400 bg-dark-700/50 cursor-not-allowed' : 'text-dark-100 hover:bg-dark-700'
                        }`}
                      >
                        <HiOutlineArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-md transition-colors text-xs"
            >
              Salvar Alterações
            </button>
          </div>
        </>
      )}
    </>
  );
}
