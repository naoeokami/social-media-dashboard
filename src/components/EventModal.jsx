import { useState, useEffect } from 'react';
import { HiX, HiOutlineClock } from 'react-icons/hi';

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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-dark-800 border border-dark-600/50 rounded-2xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-600/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HiOutlineClock className="w-5 h-5 text-brand-400" />
            {editingEvent ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-all">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Título do Evento/Reunião</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm"
              placeholder="Ex: Reunião com Cliente X"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Tipo</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm appearance-none cursor-pointer"
            >
              {eventTypes.map(t => (
                <option key={t} value={t} className="bg-dark-800">{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Data</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm [color-scheme:dark]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Início</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Término</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Descrição (Opcional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm resize-none"
              placeholder="Detalhes do agendamento..."
            />
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
