import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { fetchAllMetrics } from '../services/apiService';
// import { mockMetrics } from '../data/mockData';
import {
  HiOutlineUsers,
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { FaInstagram, FaFacebook, FaLinkedin } from 'react-icons/fa';

const platformIcons = {
  instagram: FaInstagram,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
};

function MetricCard({ data }) {
  const PlatformIcon = platformIcons[data.icon];

  return (
    <div className="glass-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: data.color + '15' }}
          >
            <PlatformIcon className="w-5 h-5" style={{ color: data.color }} />
          </div>
          <span className="font-semibold text-white text-sm">{data.platform}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-dark-300 text-xs">
            <HiOutlineUsers className="w-3.5 h-3.5" />
            <span>Seguidores</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-dark-400 text-xs">(indisponível)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-dark-300 text-xs">
            <HiOutlineEye className="w-3.5 h-3.5" />
            <span>Alcance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-dark-400 text-xs">(indisponível)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-dark-300 text-xs">
            <HiOutlineHeart className="w-3.5 h-3.5" />
            <span>Engajamento</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-dark-400 text-xs">(indisponível)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TodoWidget() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useApp();
  const [newTodo, setNewTodo] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newTodo.trim()) {
      addTodo(newTodo.trim());
      setNewTodo('');
    }
  };

  const completedCount = todos.filter(t => t.done).length;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm">Tarefas do Dia</h3>
        <span className="text-xs text-dark-400">{completedCount}/{todos.length}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-dark-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full gradient-brand transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Todo List */}
      <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
        {todos.map(todo => (
          <div
            key={todo.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg group transition-all duration-200 ${
              todo.done ? 'bg-dark-700/20' : 'bg-dark-700/40 hover:bg-dark-700/60'
            }`}
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
              className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-brand-500 focus:ring-brand-500/30 cursor-pointer flex-shrink-0"
            />
            <span className={`text-sm flex-1 transition-all ${todo.done ? 'line-through text-dark-500' : 'text-dark-200'}`}>
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-dark-500 hover:text-danger transition-all"
            >
              <HiOutlineTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Todo Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="Nova tarefa..."
          className="flex-1 px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm placeholder-dark-400 focus:outline-none focus:border-brand-500/50 transition-all"
        />
        <button
          type="submit"
          className="p-2 gradient-brand rounded-lg text-white hover:shadow-lg hover:shadow-brand-500/25 transition-all"
        >
          <HiOutlinePlus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const { posts, shortcuts, addShortcut, deleteShortcut } = useApp();
  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [newShortcut, setNewShortcut] = useState({ name: '', url: '', icon: '🔗', color: '#6366f1' });
  
  const [metricsData, setMetricsData] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  /*
  // Em desenvolvimento
  useEffect(() => {
    fetchAllMetrics().then(data => {
      setMetricsData(Object.values(data));
      setLoadingMetrics(false);
    });
  }, []);
  */

  const handleAddShortcut = (e) => {
    e.preventDefault();
    if (newShortcut.name.trim() && newShortcut.url.trim()) {
      addShortcut(newShortcut);
      setNewShortcut({ name: '', url: '', icon: '🔗', color: '#6366f1' });
      setShowAddShortcut(false);
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics Cards 
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loadingMetrics ? (
          <div className="md:col-span-3 py-6 text-center text-dark-300 text-sm">Carregando métricas reais da API...</div>
        ) : (
          metricsData.map(m => (
            <MetricCard key={m.platform} data={m} />
          ))
        )}
      </div>
      */}

      {/* Quick Shortcuts */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">Atalhos Rápidos</h3>
          <button
            onClick={() => setShowAddShortcut(!showAddShortcut)}
            className="text-xs text-brand-400 hover:text-white transition-colors flex items-center gap-1"
          >
            {showAddShortcut ? 'Cancelar' : <><HiOutlinePlus className="w-3 h-3"/> Novo Atalho</>}
          </button>
        </div>

        {showAddShortcut && (
          <form onSubmit={handleAddShortcut} className="mb-4 flex flex-col sm:flex-row gap-2 animate-slide-up p-3 bg-dark-700/30 rounded-xl border border-dark-600/30">
            <input type="text" placeholder="Nome" value={newShortcut.name} onChange={e => setNewShortcut({...newShortcut, name: e.target.value})} className="flex-1 px-3 py-1.5 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-xs" required />
            <input type="url" placeholder="URL" value={newShortcut.url} onChange={e => setNewShortcut({...newShortcut, url: e.target.value})} className="flex-1 px-3 py-1.5 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-xs" required />
            <input maxLength={1} type="text" placeholder="Emoji" value={newShortcut.icon} onChange={e => setNewShortcut({...newShortcut, icon: e.target.value})} className="w-16 px-3 py-1.5 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-xs text-center" />
            <button type="submit" className="px-3 py-1.5 gradient-brand rounded-lg text-white text-xs font-medium">Salvar</button>
          </form>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {shortcuts.map(shortcut => (
            <div key={shortcut.id} className="relative group/shortcut">
              <a
                href={shortcut.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-dark-700/30 border border-dark-600/30 hover:border-dark-500 hover:bg-dark-700/60 transition-all duration-200 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{shortcut.icon}</span>
                <span className="text-xs text-dark-300 group-hover:text-white transition-colors font-medium text-center">{shortcut.name}</span>
              </a>
              <button 
                onClick={() => deleteShortcut(shortcut.id)}
                className="absolute -top-2 -right-2 p-1.5 bg-danger text-white rounded-full opacity-0 group-hover/shortcut:opacity-100 hover:scale-110 transition-all shadow-lg"
              >
                <HiOutlineTrash className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Todo Widget */}
        <div className="lg:col-span-1">
          <TodoWidget />
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Resumo da Semana</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-dark-700/30">
              <p className="text-2xl font-bold gradient-text">{posts.filter(p => p.status === 'agendado').length}</p>
              <p className="text-xs text-dark-400 mt-1">Posts Agendados</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-dark-700/30">
              <p className="text-2xl font-bold text-success">{posts.filter(p => p.status === 'publicado').length}</p>
              <p className="text-xs text-dark-400 mt-1">Publicados</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-dark-700/30">
              <p className="text-2xl font-bold text-warning">{posts.filter(p => p.status === 'aprovacao' || p.status === 'producao').length}</p>
              <p className="text-xs text-dark-400 mt-1">Aguardando</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-dark-700/30">
              <p className="text-2xl font-bold text-brand-400">N/D</p>
              <p className="text-xs text-dark-400 mt-1">Alcance Total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
