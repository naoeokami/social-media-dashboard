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
    const dayPosts = posts.filter(p => p.date && isSameDay(parseISO(p.date), day)).map(p => ({ ...p, calendarType: 'post' }));
    const dayNotes = notes.filter(n => n.date && isSameDay(parseISO(n.date), day)).map(n => ({ ...n, calendarType: 'note' }));
    const dayEvents = events.filter(e => e.date && isSameDay(parseISO(e.date), day)).map(e => ({ ...e, calendarType: 'event' }));
    
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

  const getStatusColor = (item) => {
    if (item.calendarType === 'post') {
      const found = postStatuses.find(s => s.value === item.status);
      return found ? found.color : '#94a3b8';
    }
    if (item.calendarType === 'note') return item.color || '#94a3b8';
    if (item.calendarType === 'event') return '#3b82f6'; // Event blue
    return '#94a3b8';
  };

  const getItemIcon = (item) => {
    if (item.calendarType === 'note') return <HiOutlineAnnotation className="w-3.5 h-3.5 shrink-0" />;
    if (item.calendarType === 'event') return <HiOutlineClock className="w-3.5 h-3.5 shrink-0" />;
    if (item.calendarType === 'post' && item.status === 'producao' && item.feedback_note) {
      return <HiOutlineExclamationCircle className="w-3.5 h-3.5 text-warning shrink-0" title="Ajustes Solicitados" />;
    }
    return null;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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

      {/* Calendar Grid */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <div className="min-w-[700px]">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-dark-600/50">
              {WEEKDAYS.map(day => (
                <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className={`grid grid-cols-7 ${view === 'week' ? 'min-h-[400px]' : ''}`}>
              {getDaysInView.map((day, index) => {
                const dayItems = getItemsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const today = isToday(day);

                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`calendar-day min-h-[100px] ${view === 'week' ? 'min-h-[400px]' : ''} p-2 border-b border-r border-dark-600/30 cursor-pointer ${
                      !isCurrentMonth && view === 'month' ? 'opacity-30' : ''
                    } ${today ? 'bg-brand-500/5 border-brand-500/20' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 ${today ? 'text-brand-400' : 'text-dark-300'}`}>
                      {format(day, 'd')}
                    </div>

                    <div className="space-y-1">
                      {dayItems.slice(0, view === 'week' ? 15 : 4).map(item => (
                        <div
                          key={item.id}
                          onClick={(e) => handleEditItem(item, e)}
                          className="group relative flex items-center gap-1 px-1.5 py-1.5 rounded-md text-xs transition-all hover:bg-dark-700/50 cursor-pointer"
                          style={{ borderLeft: `2px solid ${getStatusColor(item)}` }}
                        >
                          <span className="truncate flex-1 flex items-center gap-1 text-dark-100">
                            {getItemIcon(item)}
                            {item.calendarType === 'event' && <span className="text-[10px] font-bold opacity-70">{item.startTime}</span>}
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
                      ))}
                      {dayItems.length > (view === 'week' ? 15 : 4) && (
                        <span className="text-[10px] text-brand-400 px-1.5">+{dayItems.length - (view === 'week' ? 15 : 4)} mais</span>
                      )}
                    </div>
                  </div>
                );
              })}
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
