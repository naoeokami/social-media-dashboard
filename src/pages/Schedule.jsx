import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineClock, HiOutlinePencil } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

const DAYS_OF_WEEK = [
  'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
];

export default function Schedule() {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    dayOfWeek: 'Segunda',
    startTime: '08:00',
    endTime: '09:00',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error('Título é obrigatório');
    
    if (editingId) {
      updateSchedule(editingId, formData);
      toast.success('Tarefa atualizada!');
    } else {
      addSchedule(formData);
      toast.success('Tarefa adicionada!');
    }
    closeModal();
  };

  const openModal = (schedule = null) => {
    if (schedule) {
      setEditingId(schedule.id);
      setFormData({
        title: schedule.title || '',
        dayOfWeek: schedule.dayOfWeek || 'Segunda',
        startTime: schedule.startTime || schedule.time || '08:00',
        endTime: schedule.endTime || '',
        description: schedule.description || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        dayOfWeek: 'Segunda',
        startTime: '08:00',
        endTime: '09:00',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Cronograma Semanal</h1>
          <p className="text-dark-300">Planeje e acompanhe suas tarefas da semana</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Nova Tarefa
        </button>
      </div>

      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 min-h-[500px] h-[calc(100vh-12rem)] min-w-max pr-4">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="bg-dark-800 rounded-xl border border-dark-600/50 p-4 flex flex-col w-[300px] flex-shrink-0 h-full max-h-full shadow-md relative overflow-hidden group/board">
                {/* Glow Effect no board */}
                <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent opacity-0 group-hover/board:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <h3 className="font-semibold text-white mb-4 pb-3 border-b border-dark-600/50 text-center flex items-center justify-between">
                  <span className="bg-dark-700 px-3 py-1 rounded-full text-brand-400 text-sm">{day}</span>
                  <span className="text-xs text-dark-400 font-medium">
                    {schedules.filter(s => s.dayOfWeek === day).length} tarefas
                  </span>
                </h3>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-2">
                  {schedules
                    .filter(s => s.dayOfWeek === day)
                    .sort((a, b) => (a.startTime || a.time || '').localeCompare(b.startTime || b.time || ''))
                    .map(schedule => (
                    <div key={schedule.id} className="bg-dark-900 rounded-lg p-3.5 border border-dark-600/30 group relative hover:border-brand-500/30 transition-all shadow-sm hover:shadow-brand-500/10 hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="font-medium text-white text-sm truncate pr-6">{schedule.title}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center text-xs text-dark-300 mb-2">
                        <div className="flex items-center gap-1 bg-dark-800 px-2 py-0.5 rounded text-brand-300">
                          <HiOutlineClock className="w-3.5 h-3.5" />
                          <span className="font-medium">
                            {schedule.startTime || schedule.time} {schedule.endTime ? `às ${schedule.endTime}` : ''}
                          </span>
                        </div>
                      </div>
                      {schedule.description && (
                        <p className="text-xs text-dark-400 line-clamp-3 mt-1.5 bg-dark-800/50 p-2 rounded border border-dark-600/20">{schedule.description}</p>
                      )}
                      
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5 bg-dark-900/90 backdrop-blur pb-1 pl-1 rounded-bl">
                        <button 
                          onClick={() => openModal(schedule)}
                          className="p-1.5 text-dark-300 hover:text-white bg-dark-700 hover:bg-brand-500/20 rounded-md transition-colors"
                          title="Editar"
                        >
                          <HiOutlinePencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta tarefa?')) deleteSchedule(schedule.id);
                          }}
                          className="p-1.5 text-dark-300 hover:text-red-400 bg-dark-700 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Excluir"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {schedules.filter(s => s.dayOfWeek === day).length === 0 && (
                    <div className="text-center text-dark-400 text-sm py-8 border-2 border-dashed border-dark-600/30 rounded-lg h-full flex flex-col items-center justify-center opacity-70">
                      <HiOutlineClock className="w-6 h-6 mb-2 text-dark-500" />
                      Nenhuma tarefa<br/>planejada
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-600/50 shadow-2xl overflow-hidden animate-fade-in ring-1 ring-white/5">
            <div className="p-6 border-b border-dark-600/50 flex justify-between items-center bg-dark-800/80">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <HiOutlineClock className="w-5 h-5 text-brand-400" />
                {editingId ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Título da Tarefa</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner"
                  placeholder="Ex: Reunião de planejamento"
                  autoFocus
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Dia da Semana</label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                  className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner appearance-none bg-no-repeat bg-[right_1rem_center]"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Horário de Início</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner custom-time-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Horário de Término</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner custom-time-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Descrição (Opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner resize-none h-28 custom-scrollbar"
                  placeholder="Detalhes adicionais, links, ou notas importantes..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-dark-600/30">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-dark-700 hover:bg-dark-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-2.5"
                >
                  {editingId ? 'Salvar Alterações' : 'Adicionar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
