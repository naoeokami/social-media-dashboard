import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import PostModal from '../components/PostModal';
import NoteModal from '../components/NoteModal';
import EventModal from '../components/EventModal';
import { postStatuses } from '../data/mockData';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePlus,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineExclamationCircle,
  HiOutlineAnnotation,
  HiOutlineClock,
  HiOutlineDotsVertical,
  HiOutlineDocumentText,
  HiOutlineVideoCamera,
  HiOutlinePhotograph,
  HiOutlineCamera,
  HiOutlineCollection,
} from 'react-icons/hi';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Calendar() {
  const { 
    posts, addPost, updatePost, deletePost,
    notes, addNote, updateNote, deleteNote,
    events, addEvent, updateEvent, deleteEvent
  } = useApp();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' | 'week'
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    post: true,
    note: true,
    event: true
  });
  
  // Modal states
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  
  // Editing states
  const [editingPost, setEditingPost] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // New Item Dropdown
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNewDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInView = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      const days = [];
      let day = start;
      while (day <= end) {
        days.push(day);
        day = addDays(day, 1);
      }
      return days;
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
  }, [currentDate, view]);

  const getItemsForDay = (day) => {
    const dayPosts = activeFilters.post ? posts.filter(p => p.date && isSameDay(parseISO(p.date), day)).map(p => ({ ...p, calendarType: 'post' })) : [];
    const dayNotes = activeFilters.note ? notes.filter(n => n.date && isSameDay(parseISO(n.date), day)).map(n => ({ ...n, calendarType: 'note' })) : [];
    const dayEvents = activeFilters.event ? events.filter(e => e.date && isSameDay(parseISO(e.date), day)).map(e => ({ ...e, calendarType: 'event' })) : [];
    
    return [...dayPosts, ...dayNotes, ...dayEvents].sort((a, b) => {
      if (a.calendarType === 'event' && b.calendarType === 'event') {
        return (a.startTime || '').localeCompare(b.startTime || '');
      }
      return 0;
    });
  };

  const navigatePrev = () => {
    setCurrentDate(prev => view === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1));
  };

  const navigateNext = () => {
    setCurrentDate(prev => view === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1));
  };

  const handleDayClick = (day) => {
    setSelectedDate(format(day, 'yyyy-MM-dd'));
    setNewDropdownOpen(true);
  };

  const handleEditItem = (item, e) => {
    e.stopPropagation();
    if (item.calendarType === 'post') {
      setEditingPost(item);
      setPostModalOpen(true);
    } else if (item.calendarType === 'note') {
      setEditingNote(item);
      setNoteModalOpen(true);
    } else if (item.calendarType === 'event') {
      setEditingEvent(item);
      setEventModalOpen(true);
    }
  };

  const handleDeleteItem = (item, e) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    if (item.calendarType === 'post') deletePost(item.id);
    else if (item.calendarType === 'note') deleteNote(item.id);
    else if (item.calendarType === 'event') deleteEvent(item.id);
  };

  const handleSavePost = (formData) => {
    if (editingPost) updatePost(editingPost.id, formData);
    else addPost({ ...formData, date: formData.date || selectedDate });
  };

  const handleSaveNote = (formData) => {
    if (editingNote) updateNote(editingNote.id, formData);
    else addNote({ ...formData, date: formData.date || selectedDate });
  };

  const handleSaveEvent = (formData) => {
    if (editingEvent) updateEvent(editingEvent.id, formData);
    else addEvent({ ...formData, date: formData.date || selectedDate });
  };

  const getContentTypeStyle = (contentType) => {
    const type = String(contentType || '').toLowerCase();
    if (type.includes('reels')) {
      return { color: '#ec4899', label: 'Reels' }; // Pink
    }
    if (type.includes('carrossel')) {
      return { color: '#f59e0b', label: 'Carrossel' }; // Amber
    }
    if (type.includes('imagem') || type.includes('estatica') || type.includes('estática') || type.includes('unica') || type.includes('única')) {
      return { color: '#10b981', label: 'Imagem Estática' }; // Emerald
    }
    if (type.includes('story')) {
      return { color: '#f97316', label: 'Story' }; // Orange
    }
    if (type.includes('artigo')) {
      return { color: '#6366f1', label: 'Artigo' }; // Indigo
    }
    return { color: '#94a3b8', label: 'Post' }; // Slate
  };

  const getStatusColor = (item) => {
    if (item.calendarType === 'post') {
      return getContentTypeStyle(item.contentType).color;
    }
    if (item.calendarType === 'note') return item.color || '#94a3b8';
    if (item.calendarType === 'event') return '#3b82f6'; // Event blue
    return '#94a3b8';
  };

  const getItemIcon = (item) => {
    if (item.calendarType === 'note') return <HiOutlineAnnotation className="w-3.5 h-3.5 shrink-0" />;
    if (item.calendarType === 'event') return <HiOutlineClock className="w-3.5 h-3.5 shrink-0" />;
    if (item.calendarType === 'post') {
      const type = String(item.contentType || '').toLowerCase();
      if (type.includes('reels')) {
        return <HiOutlineVideoCamera className="w-3.5 h-3.5 shrink-0" title="Reels" />;
      }
      if (type.includes('carrossel')) {
        return <HiOutlineCollection className="w-3.5 h-3.5 shrink-0" title="Carrossel" />;
      }
      if (type.includes('imagem') || type.includes('estatica') || type.includes('estática') || type.includes('unica') || type.includes('única')) {
        return <HiOutlinePhotograph className="w-3.5 h-3.5 shrink-0" title="Imagem Estática" />;
      }
      if (type.includes('story')) {
        return <HiOutlineCamera className="w-3.5 h-3.5 shrink-0" title="Story" />;
      }
      if (type.includes('artigo')) {
        return <HiOutlineDocumentText className="w-3.5 h-3.5 shrink-0" title="Artigo" />;
      }
      return <HiOutlineDocumentText className="w-3.5 h-3.5 shrink-0" title="Post" />;
    }
    return null;
  };

  const handleDragStart = (e, item) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, calendarType: item.calendarType }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetDay) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { id, calendarType } = JSON.parse(dataStr);
      const targetDateStr = format(targetDay, 'yyyy-MM-dd');
      
      if (calendarType === 'post') {
        const post = posts.find(p => p.id === id);
        if (post) updatePost(id, { ...post, date: targetDateStr });
      } else if (calendarType === 'note') {
        const note = notes.find(n => n.id === id);
        if (note) updateNote(id, { ...note, date: targetDateStr });
      } else if (calendarType === 'event') {
        const event = events.find(e => e.id === id);
        if (event) updateEvent(id, { ...event, date: targetDateStr });
      }
    } catch (err) {
      console.error('Error dropping item', err);
    }
  };

  const selectedDateObj = selectedDate ? parseISO(selectedDate) : new Date();

  return (
    <div className="space-y-4 animate-fade-in lg:h-[calc(100vh-9.5rem)] lg:overflow-hidden flex flex-col pb-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1">
            <button onClick={navigatePrev} className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700/50 transition-all">
              <HiOutlineChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white min-w-[200px] text-center capitalize">
              {format(currentDate, view === 'month' ? 'MMMM yyyy' : "'Semana de' dd MMM", { locale: ptBR })}
            </h2>
            <button onClick={navigateNext} className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700/50 transition-all">
              <HiOutlineChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-medium text-brand-400 border border-brand-500/30 rounded-lg hover:bg-brand-500/10 transition-all"
          >
            Hoje
          </button>

          {/* Filtros */}
          <div className="flex items-center gap-1 bg-dark-800/80 p-1 rounded-xl border border-dark-600/50">
            <button
              onClick={() => setActiveFilters(prev => ({ ...prev, post: !prev.post }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeFilters.post 
                  ? 'bg-brand-500/20 text-brand-400 border-brand-500/30' 
                  : 'text-dark-400 hover:text-dark-200 border-transparent'
              }`}
            >
              <HiOutlineDocumentText className="w-3.5 h-3.5" />
              Posts
            </button>
            <button
              onClick={() => setActiveFilters(prev => ({ ...prev, note: !prev.note }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeFilters.note 
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                  : 'text-dark-400 hover:text-dark-200 border-transparent'
              }`}
            >
              <HiOutlineAnnotation className="w-3.5 h-3.5" />
              Anotações
            </button>
            <button
              onClick={() => setActiveFilters(prev => ({ ...prev, event: !prev.event }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeFilters.event 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                  : 'text-dark-400 hover:text-dark-200 border-transparent'
              }`}
            >
              <HiOutlineClock className="w-3.5 h-3.5" />
              Eventos
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-dark-700/50 rounded-lg border border-dark-600/50 p-0.5">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'month' ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'}`}
            >
              <HiOutlineViewGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'week' ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'}`}
            >
              <HiOutlineViewList className="w-4 h-4" />
            </button>
          </div>

          {/* New Item Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
                setNewDropdownOpen(!newDropdownOpen);
              }}
              className="flex items-center gap-2 px-4 py-2 gradient-brand rounded-xl text-white text-sm font-medium hover:shadow-lg hover:shadow-brand-500/25 transition-all"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Novo
            </button>
            
            {newDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-600/50 rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-fade-in">
                <button
                  onClick={() => { setPostModalOpen(true); setEditingPost(null); setNewDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark-200 hover:text-white hover:bg-dark-700 transition-all"
                >
                  <HiOutlinePlus className="w-4 h-4 text-brand-400" />
                  Novo Post
                </button>
                <button
                  onClick={() => { setNoteModalOpen(true); setEditingNote(null); setNewDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark-200 hover:text-white hover:bg-dark-700 transition-all"
                >
                  <HiOutlineAnnotation className="w-4 h-4 text-purple-400" />
                  Nova Anotação
                </button>
                <button
                  onClick={() => { setEventModalOpen(true); setEditingEvent(null); setNewDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark-200 hover:text-white hover:bg-dark-700 transition-all"
                >
                  <HiOutlineClock className="w-4 h-4 text-blue-400" />
                  Novo Agendamento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Layout: Calendar + Sidebar Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Calendar Grid Container */}
        <div className="lg:col-span-3 glass-card overflow-hidden flex flex-col min-h-0">
          <div className="overflow-x-auto custom-scrollbar flex-1 flex flex-col min-h-0">
            <div className="min-w-[700px] flex-1 flex flex-col min-h-0">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-dark-600/50 shrink-0">
                {WEEKDAYS.map(day => (
                  <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 auto-rows-fr flex-1 min-h-0">
                {getDaysInView.map((day, index) => {
                  const dayItems = getItemsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const today = isToday(day);
                  const isSelected = selectedDate && isSameDay(parseISO(selectedDate), day);

                  return (
                    <div
                      key={index}
                      onClick={() => handleDayClick(day)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day)}
                      className={`calendar-day p-2 border-b border-r border-dark-600/30 cursor-pointer transition-all flex flex-col overflow-hidden min-h-0 ${
                        !isCurrentMonth && view === 'month' ? 'opacity-30' : ''
                      } ${today ? 'bg-brand-500/5 border-brand-500/20' : ''} ${isSelected ? 'ring-1 ring-brand-500/50 bg-brand-500/5' : ''}`}
                    >
                      <div className={`text-xs font-medium mb-1 shrink-0 ${today ? 'text-brand-400 font-bold' : 'text-dark-300'}`}>
                        {format(day, 'd')}
                      </div>

                      <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-0.5">
                        {dayItems.slice(0, view === 'week' ? 15 : 4).map(item => {
                          const itemColor = getStatusColor(item);
                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item)}
                              onClick={(e) => handleEditItem(item, e)}
                              className="group relative flex items-center gap-1.5 px-2 py-1.5 mb-1 rounded-md text-xs transition-all hover:brightness-125 cursor-grab active:cursor-grabbing"
                              style={{ 
                                borderLeft: `4px solid ${itemColor}`,
                                backgroundColor: `${itemColor}20` 
                              }}
                            >
                              <span className="truncate flex-1 flex items-center gap-1.5 text-dark-100 font-medium">
                                {getItemIcon(item)}
                                {item.calendarType === 'post' && item.status === 'producao' && item.feedback_note && (
                                  <HiOutlineExclamationCircle className="w-3.5 h-3.5 text-warning shrink-0" title="Ajustes Solicitados" />
                                )}
                                {item.calendarType === 'event' && <span className="text-[10px] font-bold opacity-70 shrink-0">{item.startTime}</span>}
                                {item.title}
                              </span>
                              <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => handleEditItem(item, e)}
                                  className="p-1 text-dark-300 hover:text-brand-400 transition-colors bg-dark-800/80 rounded-md"
                                  title="Editar"
                                >
                                  <HiOutlinePencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteItem(item, e)}
                                  className="p-1 text-dark-300 hover:text-danger transition-colors bg-dark-800/80 rounded-md"
                                  title="Excluir"
                                >
                                  <HiOutlineTrash className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {dayItems.length > (view === 'week' ? 15 : 4) && (
                          <span className="text-[10px] text-brand-400 px-1.5 font-medium shrink-0">+{dayItems.length - (view === 'week' ? 15 : 4)} mais</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel: Selected Day Details & Posting Options */}
        <div className="lg:col-span-1 glass-card p-4 flex flex-col gap-4 overflow-hidden min-h-0">
          <div className="shrink-0 pb-3 border-b border-dark-600/30">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1">Dia Selecionado</h3>
            <p className="text-lg font-bold text-white capitalize">
              {format(selectedDateObj, "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          <div className="shrink-0 space-y-2">
            <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Opções de Postagem</h4>
            <button
              onClick={() => { setPostModalOpen(true); setEditingPost(null); }}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-xl text-sm font-medium transition-all"
            >
              <span className="flex items-center gap-2">
                <HiOutlineDocumentText className="w-4 h-4" />
                Novo Post
              </span>
              <HiOutlinePlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setNoteModalOpen(true); setEditingNote(null); }}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl text-sm font-medium transition-all"
            >
              <span className="flex items-center gap-2">
                <HiOutlineAnnotation className="w-4 h-4" />
                Nova Anotação
              </span>
              <HiOutlinePlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setEventModalOpen(true); setEditingEvent(null); }}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium transition-all"
            >
              <span className="flex items-center gap-2">
                <HiOutlineClock className="w-4 h-4" />
                Novo Agendamento
              </span>
              <HiOutlinePlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Legenda de Tipos */}
          <div className="shrink-0 p-3 bg-dark-700/20 rounded-xl border border-dark-600/30 space-y-2">
            <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Legenda de Tipos</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 text-xs text-dark-200">
                <div className="w-5 h-5 rounded bg-[#ec4899]/10 text-[#ec4899] flex items-center justify-center border border-[#ec4899]/20 shrink-0">
                  <HiOutlineVideoCamera className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Reels</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-dark-200">
                <div className="w-5 h-5 rounded bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center border border-[#f59e0b]/20 shrink-0">
                  <HiOutlineCollection className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Carrossel</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-dark-200">
                <div className="w-5 h-5 rounded bg-[#10b981]/10 text-[#10b981] flex items-center justify-center border border-[#10b981]/20 shrink-0">
                  <HiOutlinePhotograph className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Im. Estática</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-dark-200">
                <div className="w-5 h-5 rounded bg-[#f97316]/10 text-[#f97316] flex items-center justify-center border border-[#f97316]/20 shrink-0">
                  <HiOutlineCamera className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Story</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-dark-200 col-span-2">
                <div className="w-5 h-5 rounded bg-[#6366f1]/10 text-[#6366f1] flex items-center justify-center border border-[#6366f1]/20 shrink-0">
                  <HiOutlineDocumentText className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Artigo</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider shrink-0">Itens do Dia</h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
              {getItemsForDay(selectedDateObj).length === 0 ? (
                <div className="h-full min-h-[120px] flex flex-col items-center justify-center p-4 text-center border border-dashed border-dark-600/50 rounded-xl">
                  <p className="text-xs text-dark-400">Nenhum item para este dia.</p>
                </div>
              ) : (
                getItemsForDay(selectedDateObj).map(item => {
                  const itemColor = getStatusColor(item);
                  return (
                    <div
                      key={item.id}
                      onClick={(e) => handleEditItem(item, e)}
                      className="group flex flex-col gap-2 p-3 bg-dark-700/30 border border-dark-600/30 rounded-xl hover:border-dark-500 transition-all cursor-pointer"
                      style={{ borderLeft: `4px solid ${itemColor}` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-white line-clamp-2">
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-dark-700 text-dark-300">
                          {item.calendarType === 'post' ? 'Post' : item.calendarType === 'note' ? 'Anotação' : 'Evento'}
                        </span>
                      </div>
                      
                      {item.calendarType === 'event' && (
                        <div className="flex items-center gap-1 text-[11px] text-dark-300">
                          <HiOutlineClock className="w-3 h-3 text-blue-400" />
                          <span>{item.startTime} {item.endTime ? `- ${item.endTime}` : ''}</span>
                        </div>
                      )}

                      {item.calendarType === 'post' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5 text-[10px] text-dark-300 font-medium">
                            {getItemIcon(item)}
                            <span className="capitalize">{item.contentType || 'Post'}</span>
                          </span>
                          {item.status && (
                            <>
                              <span className="text-[10px] text-dark-500">•</span>
                              <span className="text-[10px] text-dark-300 capitalize">{item.status}</span>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-dark-600/10 shrink-0">
                        <button
                          onClick={(e) => handleEditItem(item, e)}
                          className="text-xs text-dark-300 hover:text-white transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => handleDeleteItem(item, e)}
                          className="text-xs text-danger hover:brightness-125 transition-all"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      <PostModal
        isOpen={postModalOpen}
        onClose={() => { setPostModalOpen(false); setEditingPost(null); }}
        onSave={handleSavePost}
        editingPost={editingPost}
        initialDate={selectedDate}
      />
      
      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => { setNoteModalOpen(false); setEditingNote(null); }}
        onSave={handleSaveNote}
        editingNote={editingNote}
        initialDate={selectedDate}
      />
      
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => { setEventModalOpen(false); setEditingEvent(null); }}
        onSave={handleSaveEvent}
        editingEvent={editingEvent}
        initialDate={selectedDate}
      />
    </div>
  );
}
