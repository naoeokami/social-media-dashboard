import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { swipeCategories } from '../data/mockData';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlineSearch,
  HiOutlineFilter,
  HiX,
  HiOutlineLightBulb,
} from 'react-icons/hi';

const categoryColors = {
  'Trend': '#f43f5e',
  'Áudio': '#8b5cf6',
  'Referência Visual': '#06b6d4',
  'Copy': '#f59e0b',
  'Inspiração': '#10b981',
  'Concorrência': '#ec4899',
};

export default function SwipeFile() {
  const { swipeItems, addSwipeItem, deleteSwipeItem } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [form, setForm] = useState({ title: '', url: '', category: 'Trend', notes: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addSwipeItem(form);
    setForm({ title: '', url: '', category: 'Trend', notes: '' });
    setShowForm(false);
  };

  const filteredItems = swipeItems.filter(item => {
    const matchesSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1 group">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 group-focus-within:text-brand-400 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar referências..."
              className="w-full pl-10 pr-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-sm placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
          <div className="relative group">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="pl-10 pr-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 appearance-none cursor-pointer transition-all"
            >
              <option value="" className="bg-dark-800">Todas as Categorias</option>
              {swipeCategories.map(cat => (
                <option key={cat} value={cat} className="bg-dark-800">{cat}</option>
              ))}
            </select>
            <HiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 group-focus-within:text-brand-400 pointer-events-none transition-colors" />
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all duration-300 ${showForm ? 'bg-dark-700 hover:bg-dark-600' : 'gradient-brand hover:shadow-[0_0_20px_rgba(var(--brand-500),0.3)] hover:scale-[1.02]'}`}
        >
          {showForm ? <HiX className="w-5 h-5" /> : <HiOutlinePlus className="w-5 h-5" />}
          {showForm ? 'Fechar' : 'Nova Referência'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="relative p-6 bg-dark-800/80 backdrop-blur-xl border border-dark-600/50 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)] animate-slide-up overflow-hidden mb-8 mt-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-purple-500" />
          <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
             Adicionar Referência ao Swipe File
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="group">
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Título</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nome da referência"
                className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-sm placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
                required
              />
            </div>
            <div className="group">
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">URL</label>
              <input
                type="url"
                value={form.url}
                onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-sm placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
            <div className="group">
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 appearance-none cursor-pointer transition-all"
              >
                {swipeCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-dark-800">{cat}</option>
                ))}
              </select>
            </div>
            <div className="group">
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Notas</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações rápidas..."
                className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-sm placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end mt-8 border-t border-dark-600/30 pt-6">
            <button
              type="submit"
              className="px-8 py-3 gradient-brand rounded-xl text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(var(--brand-500),0.3)] hover:scale-[1.02] transition-all min-w-[150px]"
            >
              Salvar
            </button>
          </div>
        </form>
      )}

      {/* Masonry Grid */}
      {filteredItems.length > 0 ? (
        <div className="masonry-grid mt-6">
          {filteredItems.map(item => {
            const color = categoryColors[item.category] || '#6366f1';
            return (
              <div key={item.id} className="masonry-item relative bg-dark-800/80 backdrop-blur-md border border-dark-600/50 rounded-2xl p-6 group animate-slide-up hover:border-brand-500/30 hover:shadow-[0_0_30px_rgba(var(--brand-500),0.1)] transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
                
                <div className="flex items-start justify-between gap-2 mb-4">
                  <span
                    className="px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase border"
                    style={{
                      backgroundColor: `${color}15`,
                      color: color,
                      borderColor: `${color}30`
                    }}
                  >
                    {item.category}
                  </span>
                  <button
                    onClick={() => deleteSwipeItem(item.id)}
                    className="p-2 text-dark-500 hover:text-danger hover:bg-danger/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="font-bold text-white text-base mb-2 group-hover:text-brand-400 transition-colors">{item.title}</h4>
                {item.notes && <p className="text-sm text-dark-300 mb-4 leading-relaxed">{item.notes}</p>}

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700/50 hover:bg-dark-700 border border-dark-600/50 hover:border-brand-500/50 rounded-xl text-xs font-semibold text-brand-400 hover:text-brand-300 transition-all w-fit"
                  >
                    <HiOutlineExternalLink className="w-4 h-4" />
                    Abrir link
                  </a>
                )}

                {item.createdAt && (
                  <p className="text-[10px] font-semibold text-dark-500 mt-5 uppercase tracking-wider">
                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-16 h-16 rounded-2xl bg-dark-700/30 border border-dark-600/30 flex items-center justify-center mb-4">
            <HiOutlineLightBulb className="w-8 h-8 text-dark-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {search || filterCategory ? 'Nenhum resultado encontrado' : 'Seu Swipe File está vazio'}
          </h3>
          <p className="text-dark-400 text-sm text-center max-w-md">
            {search || filterCategory ? 'Tente ajustar sua busca ou filtro.' : 'Salve referências, trends e inspirações para usar nos seus projetos.'}
          </p>
        </div>
      )}
    </div>
  );
}
