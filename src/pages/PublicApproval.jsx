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

  // States para interação do cliente com Stickers do Story
  const [pollVotes, setPollVotes] = useState({});
  const [questionReplies, setQuestionReplies] = useState({});
  const [sliderValues, setSliderValues] = useState({});
  const [countdownTicks, setCountdownTicks] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      if (!post || !post.storyStickers) return;
      const newTicks = {};
      post.storyStickers.forEach(sticker => {
        if (sticker.type === 'countdown' && sticker.targetDate) {
          const diff = new Date(sticker.targetDate).getTime() - Date.now();
          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            const formatNum = (n) => String(n).padStart(2, '0');
            newTicks[sticker.id] = {
              days: formatNum(days),
              hours: formatNum(hours),
              minutes: formatNum(minutes),
              seconds: formatNum(seconds)
            };
          } else {
            newTicks[sticker.id] = { days: '00', hours: '00', minutes: '00', seconds: '00' };
          }
        }
      });
      setCountdownTicks(newTicks);
    }, 1000);

    return () => clearInterval(timer);
  }, [post]);

  const renderApprovalStickers = (stickers) => {
    if (!stickers || stickers.length === 0) return null;
    return stickers.map((sticker) => {
      let content = null;
      if (sticker.type === 'poll') {
        const votedIdx = pollVotes[sticker.id];
        const hasVoted = votedIdx !== undefined;
        
        const mockPercentages = [];
        if (hasVoted) {
          const optsCount = sticker.options?.length || 2;
          let remaining = 100;
          for (let i = 0; i < optsCount; i++) {
            if (i === votedIdx) {
              mockPercentages.push(Math.round(55 + Math.random() * 20));
            } else {
              mockPercentages.push(0);
            }
          }
          const votedPct = mockPercentages[votedIdx];
          const restPct = Math.round((100 - votedPct) / (optsCount - 1 || 1));
          for (let i = 0; i < optsCount; i++) {
            if (i !== votedIdx) {
              mockPercentages[i] = restPct;
            }
          }
          const sum = mockPercentages.reduce((a, b) => a + b, 0);
          if (sum !== 100) {
            mockPercentages[0] += (100 - sum);
          }
        }

        content = (
          <div className="bg-white text-black p-3.5 rounded-3xl w-52 shadow-2xl border border-neutral-100/50 flex flex-col items-center gap-2 select-none pointer-events-auto">
            <span className="text-[11px] font-black text-center text-neutral-800 line-clamp-2 uppercase tracking-wide">
              {sticker.question || 'Faça uma enquete'}
            </span>
            <div className="w-full space-y-1.5 mt-1">
              {(sticker.options || ['Sim', 'Não']).map((opt, oIdx) => {
                const isSelected = votedIdx === oIdx;
                const pct = hasVoted ? mockPercentages[oIdx] : 0;
                
                return (
                  <button 
                    key={oIdx} 
                    type="button"
                    onClick={() => {
                      if (!hasVoted) {
                        setPollVotes(prev => ({ ...prev, [sticker.id]: oIdx }));
                      }
                    }}
                    className="w-full relative overflow-hidden h-9 rounded-2xl text-[10px] font-extrabold text-center transition-all border border-neutral-200 flex items-center justify-center"
                    style={{ backgroundColor: isSelected ? '#ea580c10' : '#f5f5f5', borderColor: isSelected ? '#ea580c50' : '#e5e5e5' }}
                  >
                    {hasVoted && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-neutral-200/80 transition-all duration-700 ease-out" 
                        style={{ width: `${pct}%`, backgroundColor: isSelected ? '#ea580c25' : '#e5e5e5' }}
                      />
                    )}
                    
                    <span className="relative z-10 text-neutral-700 px-2 truncate">
                      {opt || `Opção ${oIdx + 1}`}
                    </span>
                    
                    {hasVoted && (
                      <span className="absolute right-3.5 z-10 text-[10px] font-black text-neutral-800">
                        {pct}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      } else if (sticker.type === 'question') {
        const replyText = questionReplies[sticker.id] || '';
        const isSent = replyText.startsWith('__SENT__');
        const typedText = isSent ? replyText.replace('__SENT__', '') : replyText;

        content = (
          <div className="bg-white rounded-3xl overflow-hidden w-52 shadow-2xl border border-neutral-100 flex flex-col pointer-events-auto">
            <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white text-center py-2 px-3 text-[10px] font-black tracking-wide uppercase">
              {sticker.question || 'Faça uma pergunta'}
            </div>
            <div className="p-2.5 bg-neutral-50 flex flex-col gap-1.5 border-t border-neutral-100">
              {isSent ? (
                <div className="text-center py-3 text-[10px] font-bold text-green-600 animate-fade-in">
                  ✓ Resposta enviada!
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={typedText}
                    onChange={(e) => setQuestionReplies(prev => ({ ...prev, [sticker.id]: e.target.value }))}
                    placeholder="Responda aqui..."
                    className="w-full bg-white border border-neutral-200 rounded-2xl py-2 px-3 text-[9px] text-neutral-700 font-bold focus:outline-none focus:border-brand-500 placeholder-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (typedText.trim()) {
                        setQuestionReplies(prev => ({ ...prev, [sticker.id]: `__SENT__${typedText}` }));
                      }
                    }}
                    className="w-full py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-[8px] font-black tracking-wider rounded-xl uppercase transition-colors"
                  >
                    Enviar
                  </button>
                </>
              )}
            </div>
          </div>
        );
      } else if (sticker.type === 'link') {
        content = (
          <a
            href={sticker.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-blue-500 px-5 py-2.5 rounded-full shadow-2xl border border-neutral-100 flex items-center justify-center gap-1 font-black text-[11px] tracking-wider select-none pointer-events-auto uppercase hover:scale-[1.05] transition-transform"
          >
            🔗 {sticker.linkText || 'SAIBA MAIS'}
          </a>
        );
      } else if (sticker.type === 'slider') {
        const val = sliderValues[sticker.id] || 50;
        
        content = (
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-3xl w-48 shadow-2xl border border-neutral-200/50 flex flex-col items-center gap-1.5 select-none pointer-events-auto">
            <span className="text-[10px] font-black text-center text-neutral-700 line-clamp-2 uppercase">
              {sticker.question || 'Gostou?'}
            </span>
            <div className="w-full flex items-center justify-center py-3 relative">
              <input
                type="range"
                min="0"
                max="100"
                value={val}
                onChange={(e) => {
                  const newval = Number(e.target.value);
                  setSliderValues(prev => ({ ...prev, [sticker.id]: newval }));
                }}
                className="w-full accent-brand-500 bg-neutral-200 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div 
                className="absolute w-7 h-7 rounded-full bg-white shadow-md border border-neutral-200 flex items-center justify-center text-base pointer-events-none transition-all"
                style={{ left: `calc(${val}% - 14px)`, top: '6px' }}
              >
                {sticker.emoji || '😍'}
              </div>
            </div>
          </div>
        );
      } else if (sticker.type === 'countdown') {
        const tick = countdownTicks[sticker.id] || { days: '00', hours: '00', minutes: '00', seconds: '00' };
        
        content = (
          <div className="bg-neutral-900/95 text-white p-3 rounded-2xl w-52 shadow-2xl border border-neutral-800 flex flex-col items-center gap-1 select-none pointer-events-auto">
            <span className="text-[8px] font-bold text-neutral-400 tracking-wider uppercase text-center line-clamp-1">
              {sticker.question || 'Contagem Regressiva'}
            </span>
            <div className="flex gap-1.5 mt-1">
              {[tick.days, tick.hours, tick.minutes, tick.seconds].map((val, bIdx) => (
                <div key={bIdx} className="flex flex-col items-center">
                  <div className="bg-white/10 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-black tracking-widest text-center text-neutral-100 min-w-[24px]">
                    {val}
                  </div>
                  <span className="text-[5px] text-neutral-500 uppercase font-black mt-0.5">
                    {['Dias', 'Horas', 'Min', 'Seg'][bIdx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      return (
        <div
          key={sticker.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-200 hover:scale-[1.02]"
          style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
        >
          {content}
        </div>
      );
    });
  };

  const [isAskingAdjustment, setIsAskingAdjustment] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [socialProfiles, setSocialProfiles] = useState([]);

  useEffect(() => {
    async function loadPost() {
      let fetchedData = null;
      let fetchedProfiles = [];
      
      if (hasSupabaseConfig) {
        try {
          const { data } = await supabase.from('social_profiles').select('*');
          fetchedProfiles = (data || []).map(p => ({
            ...p,
            avatarUrl: p.avatar_url || p.avatarUrl
          }));
        } catch(e) {}
      }
      
      if (fetchedProfiles.length === 0) {
        fetchedProfiles = JSON.parse(localStorage.getItem('socialhub_social_profiles') || '[]');
      }
      setSocialProfiles(fetchedProfiles);

      if (hasSupabaseConfig) {
        const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
        if (error) console.error('Erro ao buscar post do Supabase:', error);
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
         if (fetchedData.profile_ids) {
            try { fetchedData.profileIds = typeof fetchedData.profile_ids === 'string' ? JSON.parse(fetchedData.profile_ids) : fetchedData.profile_ids; } catch(e) { fetchedData.profileIds = []; }
         } else if (fetchedData.profileIds) {
            try { fetchedData.profileIds = typeof fetchedData.profileIds === 'string' ? JSON.parse(fetchedData.profileIds) : fetchedData.profileIds; } catch(e) { fetchedData.profileIds = []; }
         } else {
            fetchedData.profileIds = [];
         }
         if (fetchedData.story_stickers) {
            try { fetchedData.storyStickers = typeof fetchedData.story_stickers === 'string' ? JSON.parse(fetchedData.story_stickers) : fetchedData.story_stickers; } catch(e) { fetchedData.storyStickers = []; }
         } else if (fetchedData.storyStickers) {
            try { fetchedData.storyStickers = typeof fetchedData.storyStickers === 'string' ? JSON.parse(fetchedData.storyStickers) : fetchedData.storyStickers; } catch(e) { fetchedData.storyStickers = []; }
         } else {
            fetchedData.storyStickers = [];
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
      const { error } = await supabase.from('posts').update(updateData).eq('id', id);
      if (error) console.error('Erro ao atualizar post no Supabase:', error);
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

  const selected = (socialProfiles || []).filter(p => post.profileIds?.includes(p.id));
  const previewName = selected.length > 0 ? selected.map(p => p.handle).join(' • ') : 'g3softecnologia';

  const renderHeaderAvatar = (sizeClass = "w-10 h-10") => {
    const isW8 = sizeClass.includes("w-8");
    const isW7 = sizeClass.includes("w-7");
    const itemSize = isW8 ? "w-6 h-6" : isW7 ? "w-5 h-5" : "w-7 h-7";
    
    if (selected.length <= 1) {
      const p = selected.length === 1 ? selected[0] : { name: 'G3', avatarUrl: '' };
      return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1.5px] flex-shrink-0`}>
          <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center p-[1px]">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-[9px] font-bold">{p.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    const p1 = selected[0];
    const p2 = selected[1];
    return (
      <div className={`relative ${sizeClass} flex-shrink-0`}>
        <div className={`absolute top-0 left-0 ${itemSize} rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1px] z-10`}>
          <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center p-[0.5px]">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center overflow-hidden">
              {p1.avatarUrl ? (
                <img src={p1.avatarUrl} alt={p1.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-[7px] font-bold">{p1.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
        <div className={`absolute bottom-0 right-0 ${itemSize} rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1px] z-20`}>
          <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center p-[0.5px]">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center overflow-hidden">
              {p2.avatarUrl ? (
                <img src={p2.avatarUrl} alt={p2.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-[7px] font-bold">{p2.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 lg:flex">
      {/* Sidebar - Fixed on desktop, hidden on mobile or shown as header */}
      <aside className="lg:w-[320px] lg:h-screen lg:fixed lg:left-0 lg:top-0 lg:border-r border-dark-600 bg-dark-800 p-6 overflow-y-auto z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg glow-brand">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-dark-50">SocialHub</span>
        </div>

        <div className="space-y-8">
          {/* Section: Perfis */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Perfis</h3>
            <div className="flex flex-wrap gap-2">
              {selected.length === 0 ? (
                <div className="px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
                  G3 Soft
                </div>
              ) : (
                selected.map(p => (
                  <div key={p.id} className="px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center overflow-hidden">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-[8px] font-bold">{p.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    {p.name}
                  </div>
                ))
              )}
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
        {(() => {
          const isStory = post.contentType === 'Story';
          const isReels = post.contentType === 'Reels';
          
          if (isStory) {
            return (
              <div className="w-full max-w-[360px] aspect-[9/16] bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-slide-up mb-24 relative flex flex-col">
                {/* Figurinhas Interativas */}
                {renderApprovalStickers(post.storyStickers)}
                
                {/* Story Media */}
                <div className="absolute inset-0 z-0">
                  {(post.fileUrls?.length > 0) || post.fileUrl ? (
                    <ImageCarousel images={post.fileUrls?.length > 0 ? post.fileUrls : [post.fileUrl]} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-3 bg-dark-900">
                      <HiOutlineDocumentText className="w-16 h-16 opacity-20" />
                      <span className="text-xs font-medium uppercase tracking-widest opacity-40">Sem Mídia</span>
                    </div>
                  )}
                </div>
                
                {/* Story Top/Bottom Gradient Overlay */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/60 to-transparent z-[5] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/60 to-transparent z-[5] pointer-events-none"></div>
                
                {/* Story Top Overlay */}
                <div className="absolute top-0 left-0 w-full p-4 z-10 flex items-center gap-3">
                  <div className="flex-1 flex gap-1 mb-2 absolute top-2 left-4 right-4">
                    <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                       <div className="h-full bg-white w-full rounded-full"></div>
                    </div>
                  </div>
                  {renderHeaderAvatar("w-8 h-8")}
                  <div className="flex items-center gap-2 mt-3 drop-shadow-md">
                    <span className="text-xs font-bold text-white shadow-sm">{previewName}</span>
                    <span className="text-xs text-white/90 font-medium">1h</span>
                  </div>
                  <div className="flex-1"></div>
                  <FaEllipsisH className="text-white w-4 h-4 mt-3 drop-shadow-md" />
                </div>

                {/* Story Bottom Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-4 z-10 flex items-center gap-3">
                  <div className="flex-1 border border-white/40 rounded-full px-4 py-2 bg-black/20 backdrop-blur-sm shadow-md">
                    <span className="text-sm text-white/90 drop-shadow-sm">Enviar mensagem...</span>
                  </div>
                  <HiOutlineHeart className="w-7 h-7 text-white drop-shadow-md" />
                  <HiOutlinePaperAirplane className="w-6 h-6 text-white drop-shadow-md rotate-90" />
                </div>
              </div>
            );
          }

          if (isReels) {
            return (
              <div className="w-full max-w-[360px] aspect-[9/16] bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-slide-up mb-24 relative flex flex-col">
                {/* Reels Media */}
                <div className="absolute inset-0 z-0">
                  {(post.fileUrls?.length > 0) || post.fileUrl ? (
                    <ImageCarousel images={post.fileUrls?.length > 0 ? post.fileUrls : [post.fileUrl]} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-3 bg-dark-900">
                      <HiOutlineDocumentText className="w-16 h-16 opacity-20" />
                      <span className="text-xs font-medium uppercase tracking-widest opacity-40">Sem Mídia</span>
                    </div>
                  )}
                </div>

                {/* Reels Top/Bottom Gradient Overlay */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/50 to-transparent z-[5] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black/70 to-transparent z-[5] pointer-events-none"></div>

                {/* Reels Header Overlay */}
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
                   <span className="text-white font-bold text-lg drop-shadow-md">Reels</span>
                </div>

                {/* Reels Right Actions */}
                <div className="absolute bottom-6 right-2 flex flex-col items-center gap-5 z-10">
                  <div className="flex flex-col items-center gap-1">
                    <HiOutlineHeart className="w-8 h-8 text-white drop-shadow-md hover:text-red-500 transition-colors cursor-pointer" />
                    <span className="text-white text-xs drop-shadow-md font-medium">1.2k</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <HiOutlineChat className="w-8 h-8 text-white drop-shadow-md hover:text-slate-300 transition-colors cursor-pointer" />
                    <span className="text-white text-xs drop-shadow-md font-medium">45</span>
                  </div>
                  <HiOutlinePaperAirplane className="w-7 h-7 text-white drop-shadow-md hover:text-slate-300 transition-colors cursor-pointer rotate-90" />
                  <FaEllipsisH className="w-5 h-5 text-white drop-shadow-md mt-2 cursor-pointer hover:text-slate-300 transition-colors" />
                  <div className="w-8 h-8 rounded-md border-2 border-white overflow-hidden mt-4 flex items-center justify-center bg-slate-800 shadow-md">
                     <span className="text-[8px] font-bold text-white">AUDIO</span>
                  </div>
                </div>

                {/* Reels Bottom Info */}
                <div className="absolute bottom-0 left-0 w-[calc(100%-60px)] p-4 z-10">
                  <div className="flex items-center gap-2 mb-2">
                    {renderHeaderAvatar("w-8 h-8")}
                    <span className="text-sm font-bold text-white drop-shadow-md">{previewName}</span>
                    <button className="border border-white text-white text-xs px-2 py-0.5 rounded-md ml-2 drop-shadow-md bg-transparent">Seguir</button>
                  </div>
                  <div className="text-sm text-white drop-shadow-md line-clamp-2 mb-2 leading-tight">
                    {post.caption}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white drop-shadow-md bg-black/30 w-max px-2 py-1 rounded-full backdrop-blur-sm">
                    <span>🎵</span>
                    <span>Áudio original - {previewName}</span>
                  </div>
                </div>
              </div>
            );
          }

          // Default Feed Layout
          return (
            <div className="w-full max-w-[500px] bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-slide-up mb-24">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  {renderHeaderAvatar("w-10 h-10")}
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-white">{previewName}</span>
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
              <div className="aspect-[4/5] w-full bg-dark-900 relative">
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
                    <span className="font-bold text-white mr-2">{previewName}</span>
                    {post.caption}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-warning/50 mb-4 resize-y min-h-[80px]"
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
