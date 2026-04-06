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
} from 'react-icons/hi';
import { FaInstagram, FaFacebook, FaLinkedin } from 'react-icons/fa';
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 text-xs font-semibold">
          {pendingPosts.length} {pendingPosts.length === 1 ? 'post' : 'posts'} pendente{pendingPosts.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {pendingPosts.map(post => (
          <div key={post.id} className="glass-card overflow-hidden animate-slide-up">
            {/* Preview Header */}
            {(post.fileUrls?.length > 0) || post.fileUrl ? (
               <div className="h-64 w-full bg-dark-900 border-b border-dark-600/30 flex items-center justify-center p-0 relative">
                 <ImageCarousel images={post.fileUrls?.length > 0 ? post.fileUrls : [post.fileUrl]} />
               </div>
            ) : (
              <div className="h-40 bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center border-b border-dark-600/30">
                <div className="text-center">
                  <HiOutlineDocumentText className="w-12 h-12 text-brand-400 mx-auto mb-2" />
                  <span className="text-xs text-dark-400 font-medium">{post.contentType || 'Post'}</span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-5 space-y-4">
              <h3 className="font-bold text-white text-base">{post.title}</h3>

              {post.caption && (
                <div className="text-sm text-dark-300 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                  {post.caption}
                </div>
              )}

              {/* Platforms */}
              {post.platforms && post.platforms.length > 0 && (
                <div className="flex gap-2">
                  {post.platforms.map(platform => {
                    const Icon = platformIcons[platform];
                    return Icon ? (
                      <div
                        key={platform}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: platformColors[platform] + '15', color: platformColors[platform] }}
                      >
                        <Icon className="w-3 h-3" />
                        {platform}
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {/* Date */}
              {post.date && (
                <div className="flex items-center gap-2 text-dark-400 text-xs">
                  <HiOutlineCalendar className="w-3.5 h-3.5" />
                  <span>
                    {format(parseISO(post.date), "dd 'de' MMMM',' yyyy", { locale: ptBR })}
                    {post.time && ` às ${post.time}`}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => handleCopyLink(post.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500/10 border border-brand-500/30 rounded-xl text-brand-400 text-sm font-medium hover:bg-brand-500/20 transition-all"
                >
                  <HiOutlineLink className="w-4 h-4" />
                  Copiar Link para o Cliente
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRequestAdjustment(post.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-warning/10 border border-warning/30 rounded-xl text-warning text-sm font-medium hover:bg-warning/20 transition-all"
                  >
                    <HiOutlineRefresh className="w-4 h-4" />
                    Solicitar Ajuste
                  </button>
                  <button
                    onClick={() => handleApprove(post.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-success/10 border border-success/30 rounded-xl text-success text-sm font-medium hover:bg-success/20 transition-all"
                  >
                    <HiOutlineCheck className="w-4 h-4" />
                    Aprovar
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
