import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getItemById, updateItem } from '../services/storageService';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HiOutlineCheck, HiOutlineRefresh, HiOutlineDocumentText, HiOutlineCalendar, HiOutlineLink, HiOutlineX } from 'react-icons/hi';
import { FaInstagram, FaFacebook, FaLinkedin } from 'react-icons/fa';
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

  if (loading) return null;

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
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-brand-500/20 text-brand-400">
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
    <div className="min-h-screen bg-dark-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10 animate-fade-in">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mx-auto mb-4 shadow-lg glow-brand">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Revisão de Conteúdo</h1>
          <p className="text-dark-400 text-sm mt-2">Por favor, revise o post abaixo e aprove ou solicite ajustes.</p>
        </div>

        <div className="glass-card overflow-hidden animate-slide-up bg-dark-800">
          {(post.fileUrls?.length > 0) || post.fileUrl ? (
            <div className="h-64 sm:h-96 w-full bg-dark-900 border-b border-dark-600/50 flex items-center justify-center p-0 relative">
              <ImageCarousel images={post.fileUrls?.length > 0 ? post.fileUrls : [post.fileUrl]} />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center border-b border-dark-600/30">
              <div className="text-center">
                <HiOutlineDocumentText className="w-12 h-12 text-brand-400 mx-auto mb-2" />
                <span className="text-xs text-dark-400 font-medium">{post.contentType || 'Post'}</span>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-bold text-white text-xl mb-3">{post.title}</h3>
              {post.caption && (
                <div 
                  className="text-sm text-dark-200 leading-relaxed bg-dark-900 p-4 rounded-xl border border-dark-600/30 whitespace-pre-wrap"
                >
                  {post.caption}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm pt-2">
              {post.platforms && post.platforms.length > 0 && (
                <div className="flex gap-2">
                  {post.platforms.map(platform => {
                    const Icon = platformIcons[platform];
                    return Icon ? (
                      <div
                        key={platform}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium"
                        style={{ backgroundColor: platformColors[platform] + '15', color: platformColors[platform] }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {platform}
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {post.date && (
                <div className="flex items-center gap-2 text-dark-300 ml-auto">
                  <HiOutlineCalendar className="w-4 h-4" />
                  <span>
                    {format(parseISO(post.date), "dd 'de' MMMM', ' yyyy", { locale: ptBR })}
                    {post.time && ` às ${post.time}`}
                  </span>
                </div>
              )}
            </div>

            <hr className="border-dark-600/30" />

            {isAskingAdjustment ? (
              <div className="animate-fade-in space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">Observações / Ajustes Necessários</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Descreva o que precisa ser alterado neste post..."
                    rows={4}
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-warning/50 focus:ring-1 focus:ring-warning/20 transition-all text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsAskingAdjustment(false)}
                    className="flex-1 px-4 py-3 bg-dark-700/50 hover:bg-dark-700 border border-dark-600/50 rounded-xl text-white text-sm font-medium transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleAction('producao')}
                    disabled={!feedback.trim()}
                    className="flex-1 px-4 py-3 bg-warning hover:bg-warning/90 border border-warning rounded-xl text-dark-900 text-sm font-bold transition-all disabled:opacity-50"
                  >
                    Enviar Observação
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setIsAskingAdjustment(true)}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-dark-700/50 hover:bg-warning/10 border border-dark-600/50 hover:border-warning/30 rounded-xl text-dark-200 hover:text-warning text-sm font-semibold transition-all duration-300"
                >
                  <HiOutlineRefresh className="w-5 h-5 flex-shrink-0" />
                  Solicitar Ajustes
                </button>
                <button
                  onClick={() => handleAction('agendado')}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-brand-500 hover:bg-brand-400 border border-brand-500 hover:border-brand-400 rounded-xl text-white text-sm font-semibold transition-all duration-300 shadow-lg glow-brand"
                >
                  <HiOutlineCheck className="w-5 h-5 flex-shrink-0" />
                  Aprovar Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
