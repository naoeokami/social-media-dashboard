import { useState, useEffect } from 'react';
import { HiX, HiOutlineDocumentText, HiOutlineCalendar, HiOutlineColorSwatch, HiOutlineMenuAlt2, HiOutlinePencilAlt, HiCheck } from 'react-icons/hi';

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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-dark-800 border border-dark-600/50 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-slide-up overflow-hidden">
        
        {/* Top Header line with dynamic color */}
        <div className="absolute top-0 left-0 right-0 h-1 transition-colors duration-300" style={{ backgroundColor: form.color }} />

        <div className="flex items-center justify-between px-6 py-5 border-b border-dark-600/30 bg-dark-800/80 backdrop-blur-xl z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="p-2 rounded-lg bg-dark-700/50 transition-colors duration-300" style={{ color: form.color }}>
              <HiOutlineDocumentText className="w-5 h-5" />
            </div>
            {editingNote ? 'Editar Anotação' : 'Nova Anotação'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700/50 transition-all">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Título */}
          <div className="group">
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 transition-colors duration-300" style={form.title ? { color: form.color } : {}}>Título</label>
            <div className="relative">
              <HiOutlinePencilAlt className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 transition-colors duration-300" style={form.title ? { color: form.color } : {}} />
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 transition-all text-sm"
                style={{ '--tw-ring-color': form.color + '40', borderColor: form.title ? form.color + '80' : '' }}
                placeholder="Sobre o que é esta anotação?"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="group">
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 transition-colors duration-300" style={form.content ? { color: form.color } : {}}>Conteúdo</label>
            <div className="relative">
              <HiOutlineMenuAlt2 className="absolute left-3 top-3 w-5 h-5 text-dark-400 transition-colors duration-300" style={form.content ? { color: form.color } : {}} />
              <textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                rows={4}
                className="w-full pl-10 pr-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 transition-all text-sm resize-y min-h-[100px]"
                style={{ '--tw-ring-color': form.color + '40', borderColor: form.content ? form.color + '80' : '' }}
                placeholder="Escreva os detalhes aqui..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Data */}
            <div className="group">
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 transition-colors duration-300" style={form.date ? { color: form.color } : {}}>Data</label>
              <div className="relative">
                <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 transition-colors duration-300 z-10 pointer-events-none" style={form.date ? { color: form.color } : {}} />
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:ring-2 transition-all text-sm [color-scheme:dark]"
                  style={{ '--tw-ring-color': form.color + '40', borderColor: form.date ? form.color + '80' : '' }}
                />
              </div>
            </div>

            {/* Cor */}
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 transition-colors duration-300" style={{ color: form.color }}>Cor</label>
              <div className="flex flex-wrap gap-2 items-center h-[46px]">
                {colors.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm({ ...form, color: c.value })}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${form.color === c.value ? 'scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                    style={{ backgroundColor: c.value, boxShadow: form.color === c.value ? `0 0 15px ${c.value}60` : '' }}
                    title={c.name}
                  >
                    {form.color === c.value && <HiCheck className="w-5 h-5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-dark-600/30 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-dark-700/50 text-dark-200 rounded-xl text-sm font-semibold hover:bg-dark-600 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
              style={{ backgroundColor: form.color, boxShadow: `0 4px 20px ${form.color}50` }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
