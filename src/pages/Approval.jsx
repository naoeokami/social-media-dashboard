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
import { useState, useEffect } from 'react';

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
  const { posts, updatePost, socialProfiles } = useApp();

  // States para interação do cliente com Stickers do Story
  const [pollVotes, setPollVotes] = useState({});
  const [questionReplies, setQuestionReplies] = useState({});
  const [sliderValues, setSliderValues] = useState({});
  const [countdownTicks, setCountdownTicks] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      if (!posts) return;
      const newTicks = {};
      posts.forEach(post => {
        if (post.storyStickers) {
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
        }
      });
      setCountdownTicks(newTicks);
    }, 1000);

    return () => clearInterval(timer);
  }, [posts]);

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
          <div className="bg-white text-black p-2.5 rounded-2xl w-40 shadow-2xl border border-neutral-100/50 flex flex-col items-center gap-1.5 select-none pointer-events-auto">
            <span className="text-[9px] font-black text-center text-neutral-800 line-clamp-2 uppercase tracking-wide">
              {sticker.question || 'Faça uma enquete'}
            </span>
            <div className="w-full space-y-1 mt-1">
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
                    className="w-full relative overflow-hidden h-7 rounded-xl text-[8px] font-extrabold text-center transition-all border border-neutral-200 flex items-center justify-center"
                    style={{ backgroundColor: isSelected ? '#ea580c10' : '#f5f5f5', borderColor: isSelected ? '#ea580c50' : '#e5e5e5' }}
                  >
                    {hasVoted && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-neutral-200/80 transition-all duration-700 ease-out" 
                        style={{ width: `${pct}%`, backgroundColor: isSelected ? '#ea580c25' : '#e5e5e5' }}
                      />
                    )}
                    
                    <span className="relative z-10 text-neutral-700 px-1 truncate">
                      {opt || `Opção ${oIdx + 1}`}
                    </span>
                    
                    {hasVoted && (
                      <span className="absolute right-2 z-10 text-[8px] font-black text-neutral-800">
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
          <div className="bg-white rounded-2xl overflow-hidden w-40 shadow-2xl border border-neutral-100 flex flex-col pointer-events-auto">
            <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white text-center py-1.5 px-2 text-[8px] font-black tracking-wide uppercase">
              {sticker.question || 'Faça uma pergunta'}
            </div>
            <div className="p-2 bg-neutral-50 flex flex-col gap-1 border-t border-neutral-100">
              {isSent ? (
                <div className="text-center py-2 text-[8px] font-bold text-green-600 animate-fade-in">
                  ✓ Resposta enviada!
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={typedText}
                    onChange={(e) => setQuestionReplies(prev => ({ ...prev, [sticker.id]: e.target.value }))}
                    placeholder="Responda..."
                    className="w-full bg-white border border-neutral-200 rounded-xl py-1 px-2 text-[8px] text-neutral-700 font-bold focus:outline-none focus:border-brand-500 placeholder-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (typedText.trim()) {
                        setQuestionReplies(prev => ({ ...prev, [sticker.id]: `__SENT__${typedText}` }));
                      }
                    }}
                    className="w-full py-1 bg-brand-500 hover:bg-brand-600 text-white text-[7px] font-black tracking-wider rounded-lg uppercase transition-colors"
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
            className="bg-white text-blue-500 px-4 py-2 rounded-full shadow-2xl border border-neutral-100 flex items-center justify-center gap-1 font-black text-[9px] tracking-wider select-none pointer-events-auto uppercase hover:scale-[1.05] transition-transform"
          >
            🔗 {sticker.linkText || 'SAIBA MAIS'}
          </a>
        );
      } else if (sticker.type === 'slider') {
        const val = sliderValues[sticker.id] || 50;
        
        content = (
          <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl w-36 shadow-2xl border border-neutral-200/50 flex flex-col items-center gap-1 select-none pointer-events-auto">
            <span className="text-[8px] font-black text-center text-neutral-700 line-clamp-2 uppercase">
              {sticker.question || 'Gostou?'}
            </span>
            <div className="w-full flex items-center justify-center py-2 relative">
              <input
                type="range"
                min="0"
                max="100"
                value={val}
                onChange={(e) => {
                  const newval = Number(e.target.value);
                  setSliderValues(prev => ({ ...prev, [sticker.id]: newval }));
                }}
                className="w-full accent-brand-500 bg-neutral-200 h-1 rounded-lg appearance-none cursor-pointer"
              />
              <div 
                className="absolute w-5 h-5 rounded-full bg-white shadow border border-neutral-200 flex items-center justify-center text-xs pointer-events-none transition-all"
                style={{ left: `calc(${val}% - 10px)`, top: '6px' }}
              >
                {sticker.emoji || '😍'}
              </div>
            </div>
          </div>
        );
      } else if (sticker.type === 'countdown') {
        const tick = countdownTicks[sticker.id] || { days: '00', hours: '00', minutes: '00', seconds: '00' };
        
        content = (
          <div className="bg-neutral-900/95 text-white p-2.5 rounded-2xl w-40 shadow-2xl border border-neutral-800 flex flex-col items-center gap-1 select-none pointer-events-auto">
            <span className="text-[7px] font-bold text-neutral-400 tracking-wider uppercase text-center line-clamp-1">
              {sticker.question || 'Contagem Regressiva'}
            </span>
            <div className="flex gap-1 mt-1">
              {[tick.days, tick.hours, tick.minutes, tick.seconds].map((val, bIdx) => (
                <div key={bIdx} className="flex flex-col items-center">
                  <div className="bg-white/10 rounded-md px-1 py-0.5 text-[8px] font-mono font-black tracking-widest text-center text-neutral-100 min-w-[18px]">
                    {val}
                  </div>
                  <span className="text-[4px] text-neutral-500 uppercase font-black mt-0.5">
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
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-200 hover:scale-[1.02] scale-[0.8] origin-center"
          style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
        >
          {content}
        </div>
      );
    });
  };

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
        {pendingPosts.map(post => {
          const selected = (socialProfiles || []).filter(p => post.profileIds?.includes(p.id));
          const previewName = selected.length > 0 ? selected.map(p => p.handle).join(' • ') : 'g3softecnologia';
          
          const renderHeaderAvatar = (sizeClass = "w-9 h-9") => {
            const isW8 = sizeClass.includes("w-8") || sizeClass.includes("w-9");
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
            <div key={post.id} className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl animate-slide-up flex flex-col hover:border-slate-700/50 transition-all duration-300 group">
              
              {/* Post Header (Instagram Style) */}
              <div className="p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  {renderHeaderAvatar()}
                  <div>
                     <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white leading-tight">{previewName}</span>
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
                 <div className="aspect-[4/5] w-full bg-dark-900 relative overflow-hidden">
                   {/* Figurinhas Interativas */}
                   {post.contentType === 'Story' && renderApprovalStickers(post.storyStickers)}
                   <ImageCarousel images={post.fileUrls?.length > 0 ? post.fileUrls : [post.fileUrl]} />
                 </div>
              ) : (
                <div className="aspect-[4/5] bg-slate-800/30 flex items-center justify-center border-b border-white/5">
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
                    <span className="font-bold text-white mr-2">{previewName}</span>
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
        );
      })}
      </div>
    </div>
  );
}
