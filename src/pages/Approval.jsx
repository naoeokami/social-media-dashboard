import { useApp } from '../contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  HiOutlineCheck,
  HiOutlineRefresh,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineInbox,
  HiOutlineLink,
  HiOutlineHeart,
  HiOutlineChat,
  HiOutlinePaperAirplane,
  HiOutlineBookmark,
  HiBadgeCheck
} from 'react-icons/hi';
import { FaInstagram, FaFacebook, FaLinkedin, FaEllipsisH } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
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

export default function Approval() {
  const { posts, updatePost } = useApp();

  const pendingPosts = posts.filter(p => p.status === 'aprovacao');

  const handleApprove = (id) => {
    updatePost(id, { status: 'agendado' });
    toast.success('Post aprovado com sucesso!');
  };

  const handleRequestAdjustment = (id) => {
    const note = window.prompt("Quais ajustes são necessários?");
    if (note !== null) {
      updatePost(id, { status: 'producao', feedback_note: note });
      toast.success('Post enviado para ajustes.');
    }
  };

  const handleCopyLink = (id) => {
    const link = `${window.location.origin}/p/${id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link do cliente copiado!');
  };

  if (pendingPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-dark-700/30 border border-dark-600/30 flex items-center justify-center mb-4">
          <HiOutlineInbox className="w-10 h-10 text-dark-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Nenhum post aguardando aprovação</h2>
        <p className="text-dark-400 text-sm text-center max-w-md">
          Quando um post tiver o status "Aguardando Aprovação", ele aparecerá aqui para revisão.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-brand-500/15 text-brand-400 text-xs font-bold uppercase tracking-wider">
            {pendingPosts.length} post{pendingPosts.length !== 1 ? 's' : ''} pendente{pendingPosts.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {pendingPosts.map(post => (
          <div key={post.id} className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl animate-slide-up flex flex-col hover:border-slate-700/50 transition-all duration-300 group">
            
            {/* Post Header (Instagram Style) */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                   <span className="text-[10px] font-black text-white">G3</span>
                </div>
                <div>
                   <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white leading-tight">g3softecnologia</span>
                      <HiBadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                   </div>
                   <div className="text-[9px] text-slate-500 uppercase tracking-tighter font-bold">Aguardando Aprovação</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex gap-1">
                    {post.platforms?.map(p => {
                       const Icon = platformIcons[p];
                       return Icon ? <Icon key={p} className="w-3.5 h-3.5" style={{ color: platformColors[p] }} /> : null;
                    })}
                 </div>
                 <FaEllipsisH className="text-slate-700 w-3 h-3 hover:text-slate-400 cursor-pointer transition-colors" />
              </div>
            </div>

            {/* Preview Media */}
            {(post.fileUrls?.length > 0) || post.fileUrl ? (
               <div className="aspect-square w-full bg-dark-900 relative">
                 <ImageCarousel images={post.fileUrls?.length > 0 ? post.fileUrls : [post.fileUrl]} />
               </div>
            ) : (
              <div className="aspect-square bg-slate-800/30 flex items-center justify-center border-b border-white/5">
                <div className="text-center opacity-30">
                  <HiOutlineDocumentText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{post.contentType || 'Sem Mídia'}</span>
                </div>
              </div>
            )}

            {/* Interaction Row */}
            <div className="p-4 pt-4 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <HiOutlineHeart className="w-6 h-6 text-slate-400 hover:text-red-500 transition-colors cursor-pointer" />
                  <HiOutlineChat className="w-[1.4rem] h-[1.4rem] text-slate-400 hover:text-white transition-colors cursor-pointer" />
                  <HiOutlinePaperAirplane className="w-5 h-5 text-slate-400 hover:text-white transition-colors cursor-pointer rotate-90" />
               </div>
               <HiOutlineBookmark className="w-5 h-5 text-slate-400 hover:text-white transition-colors cursor-pointer" />
            </div>

            {/* Content & Caption */}
            <div className="px-4 pb-4 space-y-3 flex-1">
              <h3 className="font-bold text-white text-sm line-clamp-1">{post.title}</h3>

              {post.caption && (
                <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed h-8">
                  <span className="font-bold text-white mr-2">g3softecnologia</span>
                  {post.caption}
                </div>
              )}

              {/* Date/Time Tag */}
              {post.date && (
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-tighter pt-1">
                  <HiOutlineCalendar className="w-3 h-3" />
                  <span>
                    {format(parseISO(post.date), "dd 'de' MMMM", { locale: ptBR })}
                    {post.time && ` • ${post.time}`}
                  </span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 bg-white/5 border-t border-white/5">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleCopyLink(post.id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-slate-300 text-[11px] font-bold transition-all"
                >
                  <HiOutlineLink className="w-3.5 h-3.5" />
                  LINK DO CLIENTE
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleRequestAdjustment(post.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-warning/10 border border-warning/20 rounded-xl text-warning text-[11px] font-black hover:bg-warning/20 transition-all uppercase"
                  >
                    <HiOutlineRefresh className="w-3.5 h-3.5" />
                    AJUSTAR
                  </button>
                  <button
                    onClick={() => handleApprove(post.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-success hover:bg-success/90 rounded-xl text-dark-900 text-[11px] font-black transition-all shadow-lg shadow-success/20 uppercase"
                  >
                    <HiOutlineCheck className="w-3.5 h-3.5 font-bold" />
                    APROVAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
