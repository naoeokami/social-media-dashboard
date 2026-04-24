import { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';

const colors = [
  { name: 'Cinza', value: '#94a3b8' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f59e0b' },
  { name: 'Verde', value: '#10b981' },
];

const emptyNote = {
  title: '',
  content: '',
  date: '',
  color: '#94a3b8',
};

export default function NoteModal({ isOpen, onClose, onSave, editingNote, initialDate }) {
  const [form, setForm] = useState(emptyNote);

  useEffect(() => {
    if (editingNote) {
      setForm(editingNote);
    } else {
      setForm({ ...emptyNote, date: initialDate || '' });
    }
  }, [editingNote, isOpen, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-dark-800 border border-dark-600/50 rounded-2xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-600/50">
          <h2 className="text-lg font-bold text-white">
            {editingNote ? 'Editar Anotação' : 'Nova Anotação'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-all">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Conteúdo</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Data</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, color: c.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c.value ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-700 text-dark-200 rounded-xl text-sm font-medium hover:bg-dark-600 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 gradient-brand text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
