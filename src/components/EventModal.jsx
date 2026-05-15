import { useState, useEffect } from 'react';
import { HiX, HiOutlineClock, HiOutlineCalendar, HiOutlineTag, HiOutlineMenuAlt2, HiOutlineSparkles } from 'react-icons/hi';

const eventTypes = [
  'Reunião',
  'Evento',
  'Lançamento',
  'Live',
  'Consultoria',
  'Outro',
];

const emptyEvent = {
  title: '',
  description: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  type: 'Reunião',
};

export default function EventModal({ isOpen, onClose, onSave, editingEvent, initialDate }) {
  const [form, setForm] = useState(emptyEvent);

  useEffect(() => {
    if (editingEvent) {
      setForm(editingEvent);
    } else {
      setForm({ ...emptyEvent, date: initialDate || '' });
    }
  }, [editingEvent, isOpen, initialDate]);

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
        
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500" />

        <div className="flex items-center justify-between px-6 py-5 border-b border-dark-600/30 bg-dark-800/80 backdrop-blur-xl z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <HiOutlineClock className="w-5 h-5" />
            </div>
            {editingEvent ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700/50 transition-all">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Título */}
          <div className="group">
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Título do Evento/Reunião</label>
            <div className="relative">
              <HiOutlineSparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 group-focus-within:text-brand-400 transition-colors" />
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                placeholder="Ex: Reunião com Cliente X"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo */}
            <div className="group">
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Tipo</label>
              <div className="relative">
                <HiOutlineTag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 group-focus-within:text-brand-400 transition-colors" />
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm appearance-none cursor-pointer"
                >
                  {eventTypes.map(t => (
                    <option key={t} value={t} className="bg-dark-800">{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data */}
            <div className="group">
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Data</label>
              <div className="relative">
                <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 group-focus-within:text-brand-400 transition-colors z-10 pointer-events-none" />
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm [color-scheme:dark]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Início</label>
              <div className="relative">
                <HiOutlineClock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 group-focus-within:text-brand-400 transition-colors z-10 pointer-events-none" />
                <input
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="group">
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Término</label>
              <div className="relative">
                <HiOutlineClock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 group-focus-within:text-brand-400 transition-colors z-10 pointer-events-none" />
                <input
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="group">
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Descrição (Opcional)</label>
            <div className="relative">
              <HiOutlineMenuAlt2 className="absolute left-3 top-3 w-5 h-5 text-dark-400 group-focus-within:text-brand-400 transition-colors" />
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full pl-10 pr-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm resize-y min-h-[100px] placeholder-dark-400"
                placeholder="Detalhes do agendamento..."
              />
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
              className="flex-1 px-4 py-3 gradient-brand text-white rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(var(--brand-500),0.3)] hover:scale-[1.02] transition-all duration-200"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
