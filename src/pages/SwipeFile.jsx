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
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar referências..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white text-sm placeholder-dark-400 focus:outline-none focus:border-brand-500/50 transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500/50 appearance-none cursor-pointer transition-all"
            >
              <option value="" className="bg-dark-800">Todas</option>
              {swipeCategories.map(cat => (
                <option key={cat} value={cat} className="bg-dark-800">{cat}</option>
              ))}
            </select>
            <HiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 gradient-brand rounded-xl text-white text-sm font-medium hover:shadow-lg hover:shadow-brand-500/25 transition-all"
        >
          {showForm ? <HiX className="w-4 h-4" /> : <HiOutlinePlus className="w-4 h-4" />}
          {showForm ? 'Fechar' : 'Nova Referência'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-5 animate-slide-up">
          <h3 className="font-semibold text-white text-sm mb-4">Adicionar Referência</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Título</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nome da referência"
                className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white text-sm placeholder-dark-400 focus:outline-none focus:border-brand-500/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">URL</label>
              <input
                type="url"
                value={form.url}
                onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white text-sm placeholder-dark-400 focus:outline-none focus:border-brand-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500/50 appearance-none cursor-pointer transition-all"
              >
                {swipeCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-dark-800">{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Notas</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações rápidas..."
                className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white text-sm placeholder-dark-400 focus:outline-none focus:border-brand-500/50 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="px-6 py-2.5 gradient-brand rounded-xl text-white text-sm font-medium hover:shadow-lg hover:shadow-brand-500/25 transition-all"
            >
              Salvar
            </button>
          </div>
        </form>
      )}

      {/* Masonry Grid */}
      {filteredItems.length > 0 ? (
        <div className="masonry-grid">
          {filteredItems.map(item => (
            <div key={item.id} className="masonry-item glass-card p-4 group animate-slide-up">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: (categoryColors[item.category] || '#6366f1') + '15',
                    color: categoryColors[item.category] || '#6366f1'
                  }}
                >
                  {item.category}
                </span>
                <button
                  onClick={() => deleteSwipeItem(item.id)}
                  className="p-1 text-dark-500 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="font-semibold text-white text-sm mb-2">{item.title}</h4>
              {item.notes && <p className="text-xs text-dark-400 mb-3 leading-relaxed">{item.notes}</p>}

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <HiOutlineExternalLink className="w-3 h-3" />
                  Abrir link
                </a>
              )}

              {item.createdAt && (
                <p className="text-xs text-dark-600 mt-2">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          ))}
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
