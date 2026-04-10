import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getItemById, updateItem } from '../services/storageService';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  HiOutlineCheck, 
  HiOutlineRefresh, 
  HiOutlineDocumentText, 
  HiOutlineCalendar, 
  HiOutlineLink, 
  HiOutlineHeart,
  HiOutlineChat,
  HiOutlinePaperAirplane,
  HiOutlineBookmark,
  HiBadgeCheck
} from 'react-icons/hi';
import { FaInstagram, FaFacebook, FaLinkedin, FaEllipsisH } from 'react-icons/fa';
import ImageCarousel from '../components/ImageCarousel';

const platformIcons = {
  Instagram: FaInstagram,
  Facebook: FaFacebook,
  LinkedIn: FaLinkedin,
};

const platformColors = {
  Instagram: '#E4405F',
  Facebook: '#1877F2',
  LinkedIn: '#0A66C2',
};

export default function PublicApproval() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState(null);
  const [isAskingAdjustment, setIsAskingAdjustment] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      let fetchedData = null;
      if (hasSupabaseConfig) {
        const { data } = await supabase.from('posts').select('*').eq('id', id).single();
        fetchedData = data;
      } else {
        fetchedData = getItemById('posts', id);
      }

      if (fetchedData) {
         if (fetchedData.fileUrl && fetchedData.fileUrl.startsWith('[')) {
            try { fetchedData.fileUrls = JSON.parse(fetchedData.fileUrl); } catch(e) {}
         }
         if (!fetchedData.fileUrls && fetchedData.fileUrl) {
            fetchedData.fileUrls = [fetchedData.fileUrl];
         }
         setPost(fetchedData);
      }
      setLoading(false);
    }
    loadPost();
  }, [id]);

  const handleAction = async (actionStatus) => {
    const updateData = { status: actionStatus };
    if (actionStatus === 'producao' && feedback.trim()) {
      updateData.feedback_note = feedback.trim();
    }

    if (hasSupabaseConfig) {
      await supabase.from('posts').update(updateData).eq('id', id);
    } else {
      updateItem('posts', id, updateData);
    }
    
    setStatus(actionStatus);
  };

  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!post) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center animate-fade-in max-w-sm w-full">
          <HiOutlineLink className="w-12 h-12 text-dark-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Post não encontrado</h2>
          <p className="text-dark-400 text-sm">Este link pode ter expirado ou estava incorreto.</p>
        </div>
      </div>
    );
  }

  if (status || post.status !== 'aprovacao') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center animate-fade-in max-w-sm w-full">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-success/20 text-success border border-success/30">
            <HiOutlineCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Avaliação Concluída</h2>
          <p className="text-dark-400 text-sm">
            Obrigado! O post agora está marcado como: <br/> 
            <strong className="text-white capitalize">{status || post.status}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 lg:flex">
      {/* Sidebar - Fixed on desktop, hidden on mobile or shown as header */}
      <aside className="lg:w-[320px] lg:h-screen lg:fixed lg:left-0 lg:top-0 lg:border-r border-slate-800/50 bg-[#020617] p-6 overflow-y-auto z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg glow-brand">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">SocialHub</span>
        </div>

        <div className="space-y-8">
          {/* Section: Perfis */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Perfís</h3>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
                G3 Soft
              </div>
            </div>
          </div>

          {/* Section: Agendamento */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Agendamento</h3>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <HiOutlineCalendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {post.date ? format(parseISO(post.date), "dd/MM", { locale: ptBR }) : '--/--'}
                  </div>
                  <div className="text-xs text-slate-400">{post.time || '00:00'} (GMT-3)</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {post.platforms?.map(platform => {
                  const Icon = platformIcons[platform];
                  return (
                    <div 
                      key={platform} 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: platformColors[platform] }}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Título do Post</h3>
             <p className="text-sm text-slate-300 font-medium">{post.title}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[320px] relative min-h-screen bg-dark-900 flex flex-col items-center py-10 px-4">
        {/* Post Preview Container */}
        <div className="w-full max-w-[500px] bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-slide-up mb-24">
          {/* Post Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center p-[2px]">
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">G3</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-white">g3softecnologia</span>
                  <HiBadgeCheck className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Publicidade</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex gap-1.5">
                  {post.platforms?.map(platform => {
                    const Icon = platformIcons[platform];
                    return Icon ? (
                      <Icon key={platform} className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity" style={{ color: platformColors[platform] }} />
                    ) : null;
                  })}
               </div>
               <FaEllipsisH className="text-slate-600 w-4 h-4 cursor-pointer" />
            </div>
          </div>

          {/* Post Media */}
          <div className="aspect-square w-full bg-dark-900 relative">
            {(post.fileUrls?.length > 0) || post.fileUrl ? (
              <ImageCarousel images={post.fileUrls?.length > 0 ? post.fileUrls : [post.fileUrl]} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-3">
                <HiOutlineDocumentText className="w-16 h-16 opacity-20" />
                <span className="text-xs font-medium uppercase tracking-widest opacity-40">Sem Mídia</span>
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <HiOutlineHeart className="w-7 h-7 text-slate-300 hover:text-red-500 transition-colors cursor-pointer" />
                <HiOutlineChat className="w-[1.65rem] h-[1.65rem] text-slate-300 hover:text-slate-100 transition-colors cursor-pointer" />
                <HiOutlinePaperAirplane className="w-6 h-6 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer rotate-90" />
              </div>
              <HiOutlineBookmark className="w-6 h-6 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer" />
            </div>

            {/* Post Caption */}
            <div className="space-y-2">
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                <span className="font-bold text-white mr-2">g3softecnologia</span>
                {post.caption}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Actions */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 lg:left-[calc(50%+160px)] flex items-center gap-4 z-30">
          {isAskingAdjustment ? (
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-3xl shadow-2xl animate-slide-up w-[90vw] max-w-md">
              <h4 className="text-sm font-bold text-white mb-3">Solicitar Ajustes</h4>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="O que precisa ser alterado?"
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-warning/50 mb-4"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAskingAdjustment(false)}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleAction('producao')}
                  disabled={!feedback.trim()}
                  className="flex-1 py-3 px-4 bg-warning hover:bg-warning/90 text-dark-900 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-full shadow-2xl flex items-center gap-2">
              <button
                onClick={() => setIsAskingAdjustment(true)}
                className="flex items-center gap-2 pl-6 pr-4 py-3 bg-white/5 hover:bg-white/10 rounded-full text-white text-xs font-bold transition-all border border-transparent hover:border-warning/30 group"
              >
                <HiOutlineRefresh className="w-4 h-4 text-warning group-hover:rotate-180 transition-transform duration-500" />
                SOLICITAR AJUSTES
              </button>
              <button
                onClick={() => handleAction('agendado')}
                className="flex items-center gap-2 pl-4 pr-6 py-3 bg-success hover:bg-success/90 rounded-full text-dark-900 text-xs font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                <HiOutlineCheck className="w-5 h-5" />
                APROVAR AGORA
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
