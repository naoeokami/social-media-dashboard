import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import PostModal from '../components/PostModal';
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
} from 'react-icons/hi';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Calendar() {
  const { posts, addPost, updatePost, deletePost } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' | 'week'
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

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

  const getPostsForDay = (day) => {
    return posts.filter(p => p.date && isSameDay(parseISO(p.date), day));
  };

  const navigatePrev = () => {
    setCurrentDate(prev => view === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1));
  };

  const navigateNext = () => {
    setCurrentDate(prev => view === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1));
  };

  const handleDayClick = (day) => {
    setSelectedDate(format(day, 'yyyy-MM-dd'));
    setEditingPost(null);
    setModalOpen(true);
  };

  const handleEditPost = (post, e) => {
    e.stopPropagation();
    setEditingPost(post);
    setModalOpen(true);
  };

  const handleDeletePost = (id, e) => {
    e.stopPropagation();
    deletePost(id);
  };

  const handleSavePost = (formData) => {
    if (editingPost) {
      updatePost(editingPost.id, formData);
    } else {
      addPost({ ...formData, date: formData.date || selectedDate });
    }
  };

  const getStatusColor = (status) => {
    const found = postStatuses.find(s => s.value === status);
    return found ? found.color : '#94a3b8';
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

          {/* Add Post Button */}
          <button
            onClick={() => { setSelectedDate(format(new Date(), 'yyyy-MM-dd')); setEditingPost(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 gradient-brand rounded-xl text-white text-sm font-medium hover:shadow-lg hover:shadow-brand-500/25 transition-all"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Novo Post
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card overflow-hidden">
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
            const dayPosts = getPostsForDay(day);
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
                  {dayPosts.slice(0, view === 'week' ? 10 : 3).map(post => (
                    <div
                      key={post.id}
                      className="group relative flex items-center gap-1 px-1.5 py-1 rounded-md text-xs transition-all hover:bg-dark-700/50"
                      style={{ borderLeft: `2px solid ${getStatusColor(post.status)}` }}
                    >
                      <span className="truncate flex-1 flex items-center gap-1" style={{ color: post.status === 'producao' && post.feedback_note ? '#fbbf24' : '#e2e8f0' }}>
                        {post.status === 'producao' && post.feedback_note && (
                          <HiOutlineExclamationCircle className="w-3 h-3 text-warning shrink-0" title="Ajustes Solicitados" />
                        )}
                        {post.title}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={(e) => handleEditPost(post, e)}
                          className="p-0.5 text-dark-400 hover:text-brand-400 transition-colors"
                        >
                          <HiOutlinePencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="p-0.5 text-dark-400 hover:text-danger transition-colors"
                        >
                          <HiOutlineTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {dayPosts.length > (view === 'week' ? 10 : 3) && (
                    <span className="text-xs text-brand-400 px-1.5">+{dayPosts.length - (view === 'week' ? 10 : 3)} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Modal */}
      <PostModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingPost(null); }}
        onSave={handleSavePost}
        editingPost={editingPost}
      />
    </div>
  );
}
