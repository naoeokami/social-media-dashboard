import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlinePrinter,
  HiOutlineDuplicate,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiCheck,
  HiX
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  isWithinInterval,
  subWeeks,
  addWeeks,
  isSameDay
} from 'date-fns';

const DAYS_OF_WEEK_PT = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

const CATEGORIES = [
  { value: 'Desenvolvimento', label: 'Desenvolvimento', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'Reunião', label: 'Reunião', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'Design', label: 'Design', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { value: 'Suporte', label: 'Suporte', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { value: 'Planejamento', label: 'Planejamento', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'Outros', label: 'Outros', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
];

export default function Activities() {
  const { activities, addActivity, updateActivity, deleteActivity } = useApp();
  
  // Tab control
  const [activeTab, setActiveTab] = useState('diario'); // 'diario' or 'relatorio'
  
  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('Desenvolvimento');
  const [description, setDescription] = useState('');
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  
  // Weekly report state
  const [currentWeekDate, setCurrentWeekDate] = useState(() => new Date());

  // Week calculation based on currentWeekDate (starts on Monday)
  const weekStart = useMemo(() => startOfWeek(currentWeekDate, { weekStartsOn: 1 }), [currentWeekDate]);
  const weekEnd = useMemo(() => endOfWeek(currentWeekDate, { weekStartsOn: 1 }), [currentWeekDate]);
  const daysInterval = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  // Filter activities for selected week
  const weekActivities = useMemo(() => {
    return activities.filter(act => {
      try {
        const actDate = parseISO(act.date);
        return isWithinInterval(actDate, { start: weekStart, end: weekEnd });
      } catch (err) {
        return false;
      }
    });
  }, [activities, weekStart, weekEnd]);

  // Calculate metrics for selected week
  const totalHours = useMemo(() => {
    return weekActivities.reduce((acc, curr) => acc + (Number(curr.duration) || 0), 0);
  }, [weekActivities]);

  const categoryStats = useMemo(() => {
    const stats = {};
    weekActivities.forEach(act => {
      const cat = act.category || 'Outros';
      const hrs = Number(act.duration) || 0;
      if (!stats[cat]) {
        stats[cat] = { count: 0, hours: 0 };
      }
      stats[cat].count += 1;
      stats[cat].hours += hrs;
    });
    return stats;
  }, [weekActivities]);

  // Handle Form Submit (Add or Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Por favor, insira o título da atividade.");
      return;
    }

    const activityData = {
      title: title.trim(),
      date,
      time: time.trim() || null,
      duration: duration ? parseFloat(duration) : null,
      category,
      description: description.trim() || null
    };

    if (editingId) {
      updateActivity(editingId, activityData);
      setEditingId(null);
    } else {
      addActivity(activityData);
    }

    // Reset Form
    setTitle('');
    setTime('');
    setDuration('');
    setDescription('');
  };

  // Start Edit Mode
  const handleStartEdit = (act) => {
    setEditingId(act.id);
    setTitle(act.title);
    setDate(act.date);
    setTime(act.time || '');
    setDuration(act.duration || '');
    setCategory(act.category || 'Desenvolvimento');
    setDescription(act.description || '');
    setActiveTab('diario'); // Focus on form tab
    
    // Smooth scroll to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Edit Mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setTime('');
    setDuration('');
    setDescription('');
  };

  // Copy Markdown Report
  const handleCopyMarkdown = () => {
    if (weekActivities.length === 0) {
      toast.error("Nenhuma atividade registrada nesta semana para exportar.");
      return;
    }

    const startStr = format(weekStart, 'dd/MM/yyyy');
    const endStr = format(weekEnd, 'dd/MM/yyyy');
    
    let md = `# Relatório Semanal de Atividades\n`;
    md += `**Período:** ${startStr} a ${endStr}\n`;
    md += `**Total de Atividades:** ${weekActivities.length}\n`;
    md += `**Total de Horas Dedicadas:** ${totalHours.toFixed(1)}h\n\n`;
    md += `---\n\n`;

    daysInterval.forEach(day => {
      const dayActs = weekActivities.filter(act => isSameDay(parseISO(act.date), day));
      if (dayActs.length > 0) {
        const dayLabel = DAYS_OF_WEEK_PT[day.getDay()];
        const dateStr = format(day, 'dd/MM');
        md += `## ${dayLabel} (${dateStr})\n`;
        
        // Sort by time
        const sortedActs = [...dayActs].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        sortedActs.forEach(act => {
          const durStr = act.duration ? ` (${act.duration}h)` : '';
          const timePrefix = act.time ? `[${act.time}${durStr}] ` : (durStr ? `[${act.duration}h] ` : '');
          md += `- **${timePrefix}${act.title}**: ${act.description || 'Sem descrição detalhada.'} *(${act.category})*\n`;
        });
        md += `\n`;
      }
    });

    navigator.clipboard.writeText(md);
    toast.success("Relatório em Markdown copiado!");
  };

  // Print Weekly Report
  const handlePrint = () => {
    if (weekActivities.length === 0) {
      toast.error("Nenhuma atividade registrada nesta semana para imprimir.");
      return;
    }
    window.print();
  };

  return (
    <>
      {/* Screen layout (Hidden during printing) */}
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <HiOutlineClipboardList className="w-8 h-8 text-brand-500" />
              Diário de Atividades
            </h1>
            <p className="text-dark-300 mt-2">
              Registre suas atividades diárias e acompanhe o esforço de trabalho semanalmente.
            </p>
          </div>
          
          {/* Quick Metrics */}
          <div className="flex gap-4">
            <div className="bg-dark-800 border border-dark-600/50 rounded-xl px-4 py-2 flex flex-col items-center min-w-[100px]">
              <span className="text-2xl font-bold text-white">{activities.length}</span>
              <span className="text-[10px] text-dark-300 uppercase tracking-widest font-semibold mt-1">Total Geral</span>
            </div>
            <div className="bg-dark-800 border border-dark-600/50 rounded-xl px-4 py-2 flex flex-col items-center min-w-[100px]">
              <span className="text-2xl font-bold text-brand-400">{weekActivities.length}</span>
              <span className="text-[10px] text-dark-300 uppercase tracking-widest font-semibold mt-1">Esta Semana</span>
            </div>
            <div className="bg-dark-800 border border-dark-600/50 rounded-xl px-4 py-2 flex flex-col items-center min-w-[100px]">
              <span className="text-2xl font-bold text-purple-400">{totalHours.toFixed(1)}h</span>
              <span className="text-[10px] text-dark-300 uppercase tracking-widest font-semibold mt-1">Horas/Semana</span>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-dark-600/30 pb-px">
          <button
            onClick={() => setActiveTab('diario')}
            className={`pb-4 px-4 font-semibold text-sm transition-all border-b-2 -mb-px ${
              activeTab === 'diario'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-dark-300 hover:text-white'
            }`}
          >
            Anotar Atividades
          </button>
          <button
            onClick={() => setActiveTab('relatorio')}
            className={`pb-4 px-4 font-semibold text-sm transition-all border-b-2 -mb-px ${
              activeTab === 'relatorio'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-dark-300 hover:text-white'
            }`}
          >
            Relatório Semanal
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'diario' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1">
              <div className="bg-dark-800 border border-dark-600/50 rounded-2xl p-5 shadow-xl sticky top-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <HiOutlineClock className="w-5 h-5 text-brand-500" />
                  {editingId ? 'Editar Anotação' : 'Anotar Atividade'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-1.5">Atividade / Título</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Ex: Refatoração do módulo X"
                      className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm"
                    />
                  </div>

                  {/* Date and Time Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-1.5">Data</label>
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 transition-all text-sm cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-1.5">Horário</label>
                      <input
                        type="text"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        placeholder="Ex: 14:00 ou Manhã"
                        className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Duration and Category Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-1.5">Duração (Horas)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                        placeholder="Ex: 1.5 ou 4"
                        className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-1.5">Categoria</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 transition-all text-sm cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value} className="bg-dark-800 text-white">
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-1.5">Descrição</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Descreva brevemente os detalhes do que foi realizado..."
                      rows={4}
                      className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 transition-all text-sm resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 px-4 py-2.5 border border-dark-600 text-dark-300 hover:text-white rounded-xl text-sm font-semibold transition-all hover:bg-dark-700/50 flex items-center justify-center gap-1"
                      >
                        <HiX className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-2 flex-grow px-5 py-2.5 gradient-brand text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      {editingId ? <HiCheck className="w-4 h-4" /> : <HiOutlinePlus className="w-4 h-4" />}
                      {editingId ? 'Salvar Edição' : 'Adicionar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HiOutlineCalendar className="w-5 h-5 text-brand-500" />
                Histórico Recente
              </h3>

              {activities.length === 0 ? (
                <div className="bg-dark-800/40 border border-dark-600/30 rounded-2xl p-12 text-center text-dark-400">
                  <HiOutlineClock className="w-16 h-16 mx-auto mb-4 opacity-30 text-brand-500 animate-pulse" />
                  <p className="text-base font-medium">Nenhum registro encontrado.</p>
                  <p className="text-xs text-dark-400 mt-1">Preencha o formulário para fazer a sua primeira anotação.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {activities.map(act => {
                    const catObj = CATEGORIES.find(c => c.value === act.category) || CATEGORIES[5];
                    const dateFormatted = format(parseISO(act.date), 'dd/MM/yyyy');
                    
                    return (
                      <div
                        key={act.id}
                        className="bg-dark-800/60 border border-dark-600/40 rounded-xl p-4 flex gap-4 items-start hover:border-dark-500 transition-all hover:bg-dark-800/80 group"
                      >
                        <div className="flex-grow space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${catObj.color}`}>
                              {act.category}
                            </span>
                            <span className="text-xs text-dark-300 flex items-center gap-1 font-medium">
                              <HiOutlineCalendar className="w-3.5 h-3.5" />
                              {dateFormatted}
                            </span>
                            {(act.time || act.duration) && (
                              <span className="text-xs text-dark-300 flex items-center gap-1 font-medium">
                                <HiOutlineClock className="w-3.5 h-3.5" />
                                {act.time ? act.time : ''} {act.duration ? `(${act.duration}h)` : ''}
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-bold text-white text-base">{act.title}</h4>
                          {act.description && (
                            <p className="text-xs text-dark-300 font-normal leading-relaxed">{act.description}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(act)}
                            className="p-1.5 text-dark-300 hover:text-white rounded-lg hover:bg-dark-700 transition-all"
                            title="Editar"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteActivity(act.id)}
                            className="p-1.5 text-dark-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                            title="Excluir"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Weekly Report Tab */
          <div className="space-y-6">
            {/* Week Selector Nav */}
            <div className="bg-dark-800 border border-dark-600/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentWeekDate(prev => subWeeks(prev, 1))}
                  className="p-2 border border-dark-600/50 text-dark-300 hover:text-white hover:bg-dark-700/50 rounded-lg transition-all"
                  title="Semana Anterior"
                >
                  <HiOutlineChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center px-2">
                  <span className="text-xs font-semibold text-brand-400 uppercase block tracking-wider">Período Selecionado</span>
                  <span className="text-sm sm:text-base font-bold text-white">
                    {format(weekStart, 'dd/MM/yyyy')} a {format(weekEnd, 'dd/MM/yyyy')}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentWeekDate(prev => addWeeks(prev, 1))}
                  className="p-2 border border-dark-600/50 text-dark-300 hover:text-white hover:bg-dark-700/50 rounded-lg transition-all"
                  title="Próxima Semana"
                >
                  <HiOutlineChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentWeekDate(new Date())}
                  className="px-4 py-2 border border-dark-600/50 text-xs font-bold text-white hover:bg-dark-700/50 rounded-xl transition-all"
                >
                  Esta Semana
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-xs font-bold text-brand-400 rounded-xl transition-all flex items-center gap-1.5 border border-brand-500/20"
                >
                  <HiOutlineDuplicate className="w-4 h-4" />
                  Copiar Markdown
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 gradient-brand hover:opacity-90 text-xs font-bold text-white rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-brand-500/10"
                >
                  <HiOutlinePrinter className="w-4 h-4" />
                  Imprimir / PDF
                </button>
              </div>
            </div>

            {weekActivities.length === 0 ? (
              <div className="bg-dark-800 border border-dark-600/50 rounded-2xl p-12 text-center text-dark-400">
                <HiOutlineCalendar className="w-16 h-16 mx-auto mb-4 opacity-30 text-brand-500" />
                <h3 className="text-lg font-bold text-white">Sem atividades nesta semana</h3>
                <p className="text-sm mt-1">Não há anotações correspondentes ao período de {format(weekStart, 'dd/MM/yyyy')} a {format(weekEnd, 'dd/MM/yyyy')}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Statistics Cards */}
                <div className="md:col-span-1 space-y-4">
                  <div className="bg-dark-800 border border-dark-600/50 rounded-2xl p-5 space-y-4 shadow-xl">
                    <h3 className="font-bold text-white text-base border-b border-dark-600/30 pb-3">Resumo da Semana</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-dark-300">Total de Atividades</span>
                        <span className="font-bold text-white text-base">{weekActivities.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-dark-300">Total de Horas Logadas</span>
                        <span className="font-bold text-brand-400 text-base">{totalHours.toFixed(1)}h</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Summary */}
                  <div className="bg-dark-800 border border-dark-600/50 rounded-2xl p-5 space-y-4 shadow-xl">
                    <h3 className="font-bold text-white text-base border-b border-dark-600/30 pb-3">Por Categoria</h3>
                    
                    <div className="space-y-3">
                      {CATEGORIES.map(cat => {
                        const stat = categoryStats[cat.value] || { count: 0, hours: 0 };
                        if (stat.count === 0) return null;
                        
                        return (
                          <div key={cat.value} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-white">{cat.label}</span>
                              <span className="text-dark-300">{stat.count} {stat.count === 1 ? 'task' : 'tasks'} | {stat.hours.toFixed(1)}h</span>
                            </div>
                            <div className="w-full bg-dark-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="gradient-brand h-full rounded-full"
                                style={{ width: `${(stat.hours / (totalHours || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Timeline Report Column */}
                <div className="md:col-span-2 space-y-4">
                  <div className="bg-dark-800 border border-dark-600/50 rounded-2xl p-6 shadow-xl space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white">Quadro Semanal de Atividades</h2>
                      <p className="text-xs text-dark-300 mt-1">Detalhamento dia a dia das atividades realizadas no período.</p>
                    </div>

                    <div className="space-y-6 border-l border-dark-600/50 ml-2 pl-4">
                      {daysInterval.map(day => {
                        const dayActs = weekActivities.filter(act => isSameDay(parseISO(act.date), day));
                        if (dayActs.length === 0) return null;

                        const dayLabel = DAYS_OF_WEEK_PT[day.getDay()];
                        
                        return (
                          <div key={day.toISOString()} className="space-y-3 relative">
                            {/* Marker dot */}
                            <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-dark-800 shadow" />
                            
                            <h4 className="font-bold text-brand-400 text-sm flex items-center gap-1.5">
                              {dayLabel}
                              <span className="text-xs text-dark-300 font-medium">({format(day, 'dd/MM')})</span>
                            </h4>

                            <div className="space-y-2">
                              {dayActs.map(act => (
                                <div key={act.id} className="bg-dark-700/30 border border-dark-600/20 rounded-xl p-3 text-xs space-y-1.5 hover:bg-dark-700/50 transition-all">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-bold text-white text-sm">{act.title}</span>
                                    <div className="flex items-center gap-2">
                                      {act.time && (
                                        <span className="text-dark-300 font-medium">{act.time}</span>
                                      )}
                                      {act.duration && (
                                        <span className="text-dark-300 font-bold bg-dark-700/50 px-1.5 py-0.5 rounded">{act.duration}h</span>
                                      )}
                                      <span className="text-dark-400 italic">#{act.category}</span>
                                    </div>
                                  </div>
                                  {act.description && (
                                    <p className="text-dark-300 leading-normal">{act.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Print-Only Layout (Visible when window.print() is called) */}
      <div className="hidden print:block bg-white text-black p-8 font-sans min-h-screen">
        <div className="flex justify-between items-end border-b-2 border-gray-800 pb-3 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">RELATÓRIO DE ATIVIDADES</h1>
            <p className="text-gray-600 text-sm mt-1 uppercase tracking-wide">Mktdash - Diário Semanal</p>
          </div>
          <div className="text-right text-sm">
            <div className="font-bold text-gray-800">PERÍODO</div>
            <div>{format(weekStart, 'dd/MM/yyyy')} a {format(weekEnd, 'dd/MM/yyyy')}</div>
          </div>
        </div>

        {/* Print Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase">Atividades Registradas</div>
            <div className="text-2xl font-bold">{weekActivities.length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase">Total de Horas Dedicadas</div>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase">Data de Emissão</div>
            <div className="text-2xl font-bold">{format(new Date(), 'dd/MM/yyyy')}</div>
          </div>
        </div>

        {/* Print Content Grouped by Day */}
        <div className="space-y-6">
          {daysInterval.map(day => {
            const dayActs = weekActivities.filter(act => isSameDay(parseISO(act.date), day));
            if (dayActs.length === 0) return null;

            const dayLabel = DAYS_OF_WEEK_PT[day.getDay()];
            
            return (
              <div key={day.toISOString()} className="avoid-break space-y-3">
                <h3 className="text-md font-bold border-b border-gray-300 pb-1 mb-2 uppercase text-gray-800 tracking-wide">
                  {dayLabel} - {format(day, 'dd/MM/yyyy')}
                </h3>

                <div className="space-y-3 pl-2">
                  {dayActs.map(act => (
                    <div key={act.id} className="text-xs border-l-2 border-gray-300 pl-3 py-0.5 space-y-1">
                      <div className="flex justify-between items-start font-semibold">
                        <span className="text-sm font-bold text-gray-900">{act.title}</span>
                        <div className="text-gray-600 font-normal">
                          {act.time && <span className="mr-2">Horário: {act.time}</span>}
                          {act.duration && <span className="mr-2">Duração: {act.duration}h</span>}
                          <span className="italic">[{act.category}]</span>
                        </div>
                      </div>
                      {act.description && (
                        <p className="text-gray-700 leading-normal font-normal pl-1">{act.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          Gerado automaticamente pelo Mktdash em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}.
        </div>
      </div>

      {/* CSS overrides for print compatibility */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .avoid-break {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
}
