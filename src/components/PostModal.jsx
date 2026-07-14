import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  HiX, HiOutlineLink, HiOutlineCurrencyDollar, HiHeart, HiChat, 
  HiPaperAirplane, HiBookmark, HiDotsHorizontal, HiChevronLeft, 
  HiChevronRight, HiMusicNote, HiDotsVertical 
} from 'react-icons/hi';
import { contentTypes, platforms, tools, postStatuses } from '../data/mockData';
import imageCompression from 'browser-image-compression';
import { useApp } from '../contexts/AppContext';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const emptyPost = {
  title: '',
  caption: '',
  date: '',
  time: '12:00',
  contentType: 'Reels',
  platforms: [],
  segment: '',
  productId: '',
  tool: 'Canva',
  status: 'ideia',
  fileUrls: [],
  fileUrl: '',
  hasPaidTraffic: false,
  budget: '',
  profileIds: [],
  storyStickers: [],
};

const isVideo = (url) => {
  if (!url) return false;
  if (typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') || 
         lowerUrl.includes('.webm') || 
         lowerUrl.includes('.ogg') || 
         lowerUrl.includes('.mov') ||
         lowerUrl.includes('.mkv') ||
         lowerUrl.includes('.avi') ||
         lowerUrl.startsWith('data:video/');
};

export default function PostModal({ isOpen, onClose, onSave, editingPost, initialDate }) {
  const { segments, products, socialProfiles } = useApp();
  const [form, setForm] = useState(emptyPost);
  const [isUploading, setIsUploading] = useState(false);
  
  // States para o preview e drag & drop
  const [currentSlide, setCurrentSlide] = useState(0);
  const [draggedIdx, setDraggedIdx] = useState(null);

  // States para stickers de Story
  const [isCustomizingStory, setIsCustomizingStory] = useState(false);
  const [selectedStickerIdx, setSelectedStickerIdx] = useState(null);
  const [showStickerList, setShowStickerList] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const storyContainerRef = useRef(null);

  useEffect(() => {
    if (editingPost) {
      setForm({
         ...editingPost,
         fileUrls: editingPost.fileUrls || (editingPost.fileUrl ? [editingPost.fileUrl] : []),
         profileIds: editingPost.profileIds || [],
         storyStickers: editingPost.storyStickers || [],
      });
    } else {
      setForm({ ...emptyPost, date: initialDate || '', profileIds: [], storyStickers: [] });
    }
    setCurrentSlide(0);
    setIsCustomizingStory(false);
    setSelectedStickerIdx(null);
    setShowStickerList(false);
  }, [editingPost, isOpen, initialDate]);

  const addSticker = (type) => {
    const newSticker = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(),
      type,
      x: 50,
      y: 50,
    };
    
    if (type === 'poll') {
      newSticker.question = 'Faça uma enquete';
      newSticker.options = ['Sim', 'Não'];
    } else if (type === 'question') {
      newSticker.question = 'Faça uma pergunta';
    } else if (type === 'link') {
      newSticker.linkText = 'CLIQUE AQUI';
      newSticker.url = 'https://g3soft.com.br';
    } else if (type === 'slider') {
      newSticker.question = 'Gostou?';
      newSticker.emoji = '😍';
    } else if (type === 'countdown') {
      newSticker.question = 'Contagem Regressiva';
      const target = new Date();
      target.setDate(target.getDate() + 3);
      newSticker.targetDate = target.toISOString().substring(0, 16);
    }
    
    setForm(prev => ({
      ...prev,
      storyStickers: [...(prev.storyStickers || []), newSticker]
    }));
    setSelectedStickerIdx(form.storyStickers?.length || 0);
    setShowStickerList(false);
  };

  const removeSticker = (idx) => {
    setForm(prev => {
      const stickers = (prev.storyStickers || []).filter((_, i) => i !== idx);
      return { ...prev, storyStickers: stickers };
    });
    setSelectedStickerIdx(null);
  };

  const updateStickerData = (idx, field, value) => {
    setForm(prev => {
      const stickers = [...(prev.storyStickers || [])];
      stickers[idx] = { ...stickers[idx], [field]: value };
      return { ...prev, storyStickers: stickers };
    });
  };

  const handleStickerDragStart = (e, idx) => {
    e.stopPropagation();
    setDraggingIdx(idx);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    });
  };

  const handleStickerDragMove = (e) => {
    if (draggingIdx === null || !storyContainerRef.current) return;
    const rect = storyContainerRef.current.getBoundingClientRect();
    
    let x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    let y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, Math.round(x)));
    y = Math.max(0, Math.min(100, Math.round(y)));
    
    setForm(prev => {
      const stickers = [...(prev.storyStickers || [])];
      stickers[draggingIdx] = { ...stickers[draggingIdx], x, y };
      return { ...prev, storyStickers: stickers };
    });
  };

  const handleStickerDragEnd = () => {
    setDraggingIdx(null);
  };

  const renderStickers = (stickers, interactive = false, onStickerClick = null) => {
    if (!stickers || stickers.length === 0) return null;
    return stickers.map((sticker, idx) => {
      const isSelected = selectedStickerIdx === idx && isCustomizingStory;
      
      let content = null;
      if (sticker.type === 'poll') {
        content = (
          <div className="bg-white text-black p-3 rounded-2xl w-44 shadow-xl border border-neutral-100 flex flex-col items-center gap-1.5 select-none pointer-events-auto">
            <span className="text-[10px] font-black text-center text-neutral-800 line-clamp-2 uppercase tracking-wide">
              {sticker.question || 'Faça uma enquete'}
            </span>
            <div className="w-full space-y-1 mt-1">
              {(sticker.options || ['Sim', 'Não']).map((opt, oIdx) => (
                <div 
                  key={oIdx} 
                  className="w-full py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[9px] font-bold text-center text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer"
                >
                  {opt || `Opção ${oIdx + 1}`}
                </div>
              ))}
            </div>
          </div>
        );
      } else if (sticker.type === 'question') {
        content = (
          <div className="bg-white rounded-2xl overflow-hidden w-44 shadow-xl border border-neutral-100 flex flex-col select-none pointer-events-auto">
            <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white text-center py-2 px-3 text-[9px] font-extrabold tracking-wide uppercase">
              {sticker.question || 'Faça uma pergunta'}
            </div>
            <div className="p-2 bg-neutral-50 border-t border-neutral-100 flex flex-col">
              <div className="w-full bg-white border border-neutral-200 rounded-xl py-2 px-3 text-[8px] text-neutral-400 font-medium">
                Escreva algo...
              </div>
            </div>
          </div>
        );
      } else if (sticker.type === 'link') {
        content = (
          <div className="bg-white text-blue-500 px-4 py-2 rounded-full shadow-lg border border-neutral-100 flex items-center justify-center gap-1 font-black text-[10px] tracking-wider select-none pointer-events-auto uppercase">
            🔗 {sticker.linkText || 'SAIBA MAIS'}
          </div>
        );
      } else if (sticker.type === 'slider') {
        content = (
          <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl w-40 shadow-xl border border-neutral-200/50 flex flex-col items-center gap-1 select-none pointer-events-auto">
            <span className="text-[9px] font-black text-center text-neutral-700 line-clamp-2 uppercase">
              {sticker.question || 'Gostou?'}
            </span>
            <div className="w-full flex items-center justify-center py-2 relative">
              <div className="w-full h-1.5 bg-neutral-200 rounded-full" />
              <div className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow border border-neutral-200 flex items-center justify-center text-xs">
                {sticker.emoji || '😍'}
              </div>
            </div>
          </div>
        );
      } else if (sticker.type === 'countdown') {
        content = (
          <div className="bg-neutral-900/95 text-white p-3 rounded-2xl w-48 shadow-2xl border border-neutral-800 flex flex-col items-center gap-1 select-none pointer-events-auto">
            <span className="text-[8px] font-bold text-neutral-400 tracking-wider uppercase text-center line-clamp-1">
              {sticker.question || 'Contagem Regressiva'}
            </span>
            <div className="flex gap-1 mt-1">
              {['00', '00', '00', '00'].map((val, bIdx) => (
                <div key={bIdx} className="flex flex-col items-center">
                  <div className="bg-white/10 rounded-md px-1 py-0.5 text-[10px] font-mono font-black tracking-widest text-center text-neutral-100 min-w-[20px]">
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
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move z-30 select-none ${
            isSelected ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-dark-900 rounded-2xl shadow-2xl scale-[1.05]' : 'hover:scale-[1.02]'
          } transition-transform duration-200`}
          style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
          onPointerDown={(e) => {
            if (!isCustomizingStory) return;
            handleStickerDragStart(e, idx);
            if (onStickerClick) onStickerClick(idx);
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onStickerClick) onStickerClick(idx);
          }}
        >
          {content}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const togglePlatform = (name) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(name)
        ? prev.platforms.filter(p => p !== name)
        : [...prev.platforms, name]
    }));
  };

  const handleImageUpload = async (e) => {
    const target = e.target;
    const files = Array.from(target.files);
    if (!files.length) return;

    if (!hasSupabaseConfig) {
      toast.error('Supabase não configurado! Configure as chaves no .env.local para fazer upload.');
      return;
    }
    
    if ((form.fileUrls?.length || 0) + files.length > 10) {
      toast.error('Máximo de 10 mídias permitidas!');
      return;
    }

    try {
      setIsUploading(true);
      const toastId = toast.loading(`Fazendo upload de ${files.length} mídia(s)...`);

      const newUrls = [];
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };

      for (const file of files) {
        let compressedFile = file;
        if (file.type.startsWith('image/')) {
          try {
            compressedFile = await imageCompression(file, options);
          } catch (err) {
            console.warn('Compression failed, using original file', err);
          }
        }
        
        const safeName = (file.name || 'file.jpg').replace(/[^a-zA-Z0-9.\-_]/g, '');
        const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2);
        const fileName = `${uuid}-${safeName}`;
        
        const { data, error } = await supabase.storage
          .from('posts_images')
          .upload(fileName, compressedFile);

        if (error) {
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('posts_images')
          .getPublicUrl(fileName);
          
        newUrls.push(publicUrl);
      }

      setForm((prev) => ({
        ...prev,
        fileUrls: [...(prev.fileUrls || []), ...newUrls],
        fileUrl: prev.fileUrl || newUrls[0]
      }));
      
      toast.success('Upload concluído com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Erro detalhado no upload:', error);
      toast.error('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
      if (target) target.value = null;
    }
  };

  const removeImage = (indexToRemove) => {
    setForm((prev) => {
      const updatedUrls = prev.fileUrls.filter((_, i) => i !== indexToRemove);
      return {
        ...prev,
        fileUrls: updatedUrls,
        fileUrl: updatedUrls.length > 0 ? updatedUrls[0] : ''
      };
    });
    // Ajusta o slide atual se deletar a imagem que está sendo vista
    if (currentSlide >= form.fileUrls.length - 1) {
      setCurrentSlide(Math.max(0, form.fileUrls.length - 2));
    }
  };

  // Funções de Drag & Drop para reordenar imagens
  const handleDragStart = (idx) => setDraggedIdx(idx);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (targetIdx) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newUrls = [...(form.fileUrls || [])];
    const item = newUrls.splice(draggedIdx, 1)[0];
    newUrls.splice(targetIdx, 0, item);
    handleChange('fileUrls', newUrls);
    if (newUrls.length > 0) handleChange('fileUrl', newUrls[0]);
    setDraggedIdx(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    setForm(emptyPost);
    onClose();
  };

  // Preview Logic
  const selectedProfiles = (socialProfiles || []).filter(p => form.profileIds?.includes(p.id));
  
  const previewName = selectedProfiles.length > 0 
    ? selectedProfiles.map(p => p.handle).join(' • ')
    : 'suamarca';

  const renderAvatars = (sizeClass = "w-7 h-7") => {
    const isW8 = sizeClass.includes("w-8");
    const isW7 = sizeClass.includes("w-7");
    const itemSize = isW8 ? "w-6 h-6" : isW7 ? "w-5 h-5" : "w-7 h-7";
    
    if (selectedProfiles.length <= 1) {
      const p = selectedProfiles.length === 1 ? selectedProfiles[0] : { name: 'G3', avatarUrl: '' };
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
    
    const p1 = selectedProfiles[0];
    const p2 = selectedProfiles[1];
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

  const contentType = form.contentType || 'Feed';
  const isStory = contentType === 'Story';
  const isReels = contentType === 'Reels';
  const fileUrls = form.fileUrls?.length > 0 ? form.fileUrls : ['https://images.unsplash.com/photo-1616469829581-73993eb86b02?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'];
  const safeSlide = Math.min(currentSlide, fileUrls.length - 1);
  const mediaUrl = fileUrls[safeSlide];
  
  const nextSlide = () => setCurrentSlide(p => Math.min(p + 1, fileUrls.length - 1));
  const prevSlide = () => setCurrentSlide(p => Math.max(p - 1, 0));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-dark-800 border border-dark-600/50 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-slide-up no-scrollbar">
        
        {/* Top Gradient Line */}
        <div className="sticky top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 z-20" />

        {/* Header */}
        <div className="sticky top-1 flex items-center justify-between px-6 py-5 bg-dark-800/80 backdrop-blur-xl border-b border-dark-600/30 z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <HiOutlineLink className="w-5 h-5" />
            </div>
            {editingPost ? 'Editar Post' : 'Novo Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700/50 transition-all"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 lg:p-8">
          {form.status === 'producao' && form.feedback_note && (
            <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 animate-fade-in mb-8">
              <h3 className="text-warning font-semibold text-sm mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                Ajustes Solicitados pelo Cliente
              </h3>
              <p className="text-dark-200 text-sm italic">"{form.feedback_note}"</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
            {/* === FORM STEPS === */}
            {isCustomizingStory ? (
              <div className="space-y-6 bg-dark-700/20 border border-dark-600/30 p-6 rounded-2xl animate-fade-in text-white h-fit">
                <div className="flex items-center justify-between border-b border-dark-600/30 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Configurações do Story</h3>
                    <p className="text-xs text-dark-400 mt-0.5">Personalize os textos e figurinhas interativas</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomizingStory(false)}
                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    ← Detalhes do Post
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setShowStickerList(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                  >
                    <span>➕ Adicionar Figurinha</span>
                  </button>
                </div>

                {/* Stickers List / Selected Sticker Config */}
                <div className="space-y-5">
                  {(!form.storyStickers || form.storyStickers.length === 0) ? (
                    <div className="p-8 text-center border border-dashed border-dark-600 rounded-2xl bg-dark-900/20">
                      <p className="text-xs text-dark-500">Nenhuma figurinha adicionada ainda.</p>
                      <p className="text-[10px] text-dark-500 mt-1">Abra o menu de figurinhas e adicione elementos ao seu Story!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider">Figurinhas no Story</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {form.storyStickers.map((sticker, idx) => (
                          <button
                            key={sticker.id}
                            type="button"
                            onClick={() => setSelectedStickerIdx(idx)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                              selectedStickerIdx === idx
                                ? 'bg-brand-500/10 border-brand-500 text-white shadow'
                                : 'bg-dark-800/40 border-dark-600/50 text-dark-300 hover:bg-dark-800'
                            }`}
                          >
                            <span className="capitalize">{sticker.type} ({Math.round(sticker.x)}%, {Math.round(sticker.y)}%)</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSticker(idx);
                              }}
                              className="text-red-400 hover:text-red-300 px-1 py-0.5 text-[10px] font-bold"
                            >
                              Remover
                            </button>
                          </button>
                        ))}
                      </div>

                      {/* Selected Sticker Config Inputs */}
                      {selectedStickerIdx !== null && form.storyStickers[selectedStickerIdx] && (
                        <div className="bg-dark-800/60 border border-dark-600/40 p-4 rounded-xl space-y-4 mt-6 animate-fade-in">
                          <div className="flex items-center justify-between border-b border-dark-600/20 pb-2 mb-2">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Editar Figurinha: {form.storyStickers[selectedStickerIdx].type}</span>
                            <button
                              type="button"
                              onClick={() => removeSticker(selectedStickerIdx)}
                              className="text-xs text-red-400 hover:text-red-300 font-bold"
                            >
                              Remover do Story
                            </button>
                          </div>

                          {/* Poll (Enquete) Config */}
                          {form.storyStickers[selectedStickerIdx].type === 'poll' && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-dark-300 uppercase mb-1">Pergunta</label>
                                <input
                                  type="text"
                                  value={form.storyStickers[selectedStickerIdx].question || ''}
                                  onChange={(e) => updateStickerData(selectedStickerIdx, 'question', e.target.value)}
                                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-dark-300 uppercase">Alternativas</label>
                                {(form.storyStickers[selectedStickerIdx].options || []).map((opt, oIdx) => (
                                  <div key={oIdx} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const newOpts = [...form.storyStickers[selectedStickerIdx].options];
                                        newOpts[oIdx] = e.target.value;
                                        updateStickerData(selectedStickerIdx, 'options', newOpts);
                                      }}
                                      className="flex-1 bg-dark-700 border border-dark-600 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                                      placeholder={`Opção ${oIdx + 1}`}
                                    />
                                    {oIdx > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newOpts = form.storyStickers[selectedStickerIdx].options.filter((_, i) => i !== oIdx);
                                          updateStickerData(selectedStickerIdx, 'options', newOpts);
                                        }}
                                        className="text-red-400 hover:text-red-300 text-xs font-bold"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {form.storyStickers[selectedStickerIdx].options.length < 4 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOpts = [...form.storyStickers[selectedStickerIdx].options, ''];
                                      updateStickerData(selectedStickerIdx, 'options', newOpts);
                                    }}
                                    className="text-[10px] font-bold text-brand-400 hover:text-brand-300 mt-1"
                                  >
                                    + Adicionar Alternativa
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Questions (Perguntas) Config */}
                          {form.storyStickers[selectedStickerIdx].type === 'question' && (
                            <div>
                              <label className="block text-[10px] font-bold text-dark-300 uppercase mb-1">Título/Pergunta</label>
                              <input
                                type="text"
                                value={form.storyStickers[selectedStickerIdx].question || ''}
                                onChange={(e) => updateStickerData(selectedStickerIdx, 'question', e.target.value)}
                                className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                              />
                            </div>
                          )}

                          {/* Link Config */}
                          {form.storyStickers[selectedStickerIdx].type === 'link' && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-dark-300 uppercase mb-1">Texto do Link</label>
                                <input
                                  type="text"
                                  value={form.storyStickers[selectedStickerIdx].linkText || ''}
                                  onChange={(e) => updateStickerData(selectedStickerIdx, 'linkText', e.target.value)}
                                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                                  placeholder="CLIQUE AQUI"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-dark-300 uppercase mb-1">URL de Destino</label>
                                <input
                                  type="text"
                                  value={form.storyStickers[selectedStickerIdx].url || ''}
                                  onChange={(e) => updateStickerData(selectedStickerIdx, 'url', e.target.value)}
                                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                                  placeholder="https://suamarca.com.br"
                                />
                              </div>
                            </div>
                          )}

                          {/* Emoji Slider Config */}
                          {form.storyStickers[selectedStickerIdx].type === 'slider' && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-dark-300 uppercase mb-1">Pergunta</label>
                                <input
                                  type="text"
                                  value={form.storyStickers[selectedStickerIdx].question || ''}
                                  onChange={(e) => updateStickerData(selectedStickerIdx, 'question', e.target.value)}
                                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-dark-300 uppercase mb-1">Emoji</label>
                                <select
                                  value={form.storyStickers[selectedStickerIdx].emoji || '😍'}
                                  onChange={(e) => updateStickerData(selectedStickerIdx, 'emoji', e.target.value)}
                                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white appearance-none cursor-pointer focus:outline-none focus:border-brand-500"
                                >
                                  {['😍', '🔥', '😮', '😂', '👏', '💯', '❤️', '👍'].map(em => (
                                    <option key={em} value={em} className="bg-dark-800">{em}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Countdown (Contagem Regressiva) Config */}
                          {form.storyStickers[selectedStickerIdx].type === 'countdown' && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-dark-300 uppercase mb-1">Título</label>
                                <input
                                  type="text"
                                  value={form.storyStickers[selectedStickerIdx].question || ''}
                                  onChange={(e) => updateStickerData(selectedStickerIdx, 'question', e.target.value)}
                                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-dark-300 uppercase mb-1">Data/Hora Alvo</label>
                                <input
                                  type="datetime-local"
                                  value={form.storyStickers[selectedStickerIdx].targetDate || ''}
                                  onChange={(e) => updateStickerData(selectedStickerIdx, 'targetDate', e.target.value)}
                                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-brand-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-10">

              {/* STEP 1 — Identificação */}
              <div className="relative pl-6 border-l-2 border-brand-500/30 hover:border-brand-500/70 transition-colors duration-300">
                <div className="absolute -left-[18px] top-0 w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-brand-500/30">
                  1
                </div>
                <div className="mb-5">
                  <h3 className="text-base font-bold text-white">Identificação</h3>
                  <p className="text-xs text-dark-400 mt-0.5">Dê um nome claro à peça e escreva a legenda</p>
                </div>
                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">
                      Título da Peça <span className="text-brand-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => handleChange('title', e.target.value)}
                      placeholder="Ex: Post sobre lançamento do produto"
                      className="w-full px-4 py-3.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15 transition-all text-sm"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="group">
                    <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">
                      Legenda (Copy)
                    </label>
                    <textarea
                      value={form.caption}
                      onChange={e => handleChange('caption', e.target.value)}
                      placeholder="Escreva a legenda que vai no post, inclua os emojis e hashtags..."
                      rows={5}
                      className="rich-editor w-full bg-dark-700/30 border-dark-600/50 rounded-xl focus:ring-brand-500/15 focus:border-brand-500/60 text-white placeholder-dark-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2 — Agendamento */}
              <div className="relative pl-6 border-l-2 border-purple-500/30 hover:border-purple-500/70 transition-colors duration-300">
                <div className="absolute -left-[18px] top-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-purple-500/30">
                  2
                </div>
                <div className="mb-5">
                  <h3 className="text-base font-bold text-white">Agendamento</h3>
                  <p className="text-xs text-dark-400 mt-0.5">Quando esse conteúdo será publicado?</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-purple-400 transition-colors">Data</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => handleChange('date', e.target.value)}
                      className="w-full px-4 py-3.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all text-sm [color-scheme:dark]"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-purple-400 transition-colors">Hora</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={e => handleChange('time', e.target.value)}
                      className="w-full px-4 py-3.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all text-sm [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3 — Tipo & Classificação */}
              <div className="relative pl-6 border-l-2 border-pink-500/30 hover:border-pink-500/70 transition-colors duration-300">
                <div className="absolute -left-[18px] top-0 w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-pink-500/30">
                  3
                </div>
                <div className="mb-5">
                  <h3 className="text-base font-bold text-white">Tipo & Classificação</h3>
                  <p className="text-xs text-dark-400 mt-0.5">Formato do conteúdo, segmento e produto relacionado</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-pink-400 transition-colors">Tipo de Conteúdo</label>
                      <select
                        value={form.contentType}
                        onChange={e => handleChange('contentType', e.target.value)}
                        className="w-full px-4 py-3.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/15 transition-all text-sm appearance-none cursor-pointer"
                      >
                        {contentTypes.map(type => (
                          <option key={type} value={type} className="bg-dark-800">{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-pink-400 transition-colors">Segmento</label>
                      <select
                        value={form.segment}
                        onChange={e => handleChange('segment', e.target.value)}
                        className="w-full px-4 py-3.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/15 transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-dark-800">Selecione o segmento</option>
                        {segments.map(seg => (
                          <option key={seg.id} value={seg.name} className="bg-dark-800">{seg.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-pink-400 transition-colors">Produto Divulgado</label>
                    <select
                      value={form.productId}
                      onChange={e => handleChange('productId', e.target.value)}
                      className="w-full px-4 py-3.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/15 transition-all text-sm appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-dark-800">Nenhum produto</option>
                      {products.map(prod => (
                        <option key={prod.id} value={prod.id} className="bg-dark-800">
                          {prod.name} ({prod.segment || 'Sem segmento'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* STEP 4 — Distribuição */}
              <div className="relative pl-6 border-l-2 border-cyan-500/30 hover:border-cyan-500/70 transition-colors duration-300">
                <div className="absolute -left-[18px] top-0 w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-cyan-500/30">
                  4
                </div>
                <div className="mb-5">
                  <h3 className="text-base font-bold text-white">Distribuição</h3>
                  <p className="text-xs text-dark-400 mt-0.5">Onde e por quem esse post será publicado</p>
                </div>
                <div className="space-y-5">
                  {/* Platforms */}
                  <div>
                    <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-3">Plataformas</label>
                    <div className="flex flex-wrap gap-2.5">
                      {platforms.map(({ name, color }) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => togglePlatform(name)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                            form.platforms.includes(name)
                              ? 'border-transparent text-white shadow-lg scale-[1.02]'
                              : 'border-dark-600/50 text-dark-300 hover:border-dark-500 bg-dark-700/30 hover:bg-dark-700/60'
                          }`}
                          style={form.platforms.includes(name) ? { backgroundColor: color + '25', borderColor: color, color: color, boxShadow: `0 4px 15px ${color}25` } : {}}
                        >
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: form.platforms.includes(name) ? `0 0 8px ${color}` : '' }} />
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Perfis */}
                  <div>
                    <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-3">
                      Perfis de Publicação <span className="normal-case text-dark-500 font-normal">(Collab / opcional)</span>
                    </label>
                    {socialProfiles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {socialProfiles.map(p => {
                          const isSelected = form.profileIds?.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setForm(prev => {
                                  const profileIds = prev.profileIds || [];
                                  const updated = profileIds.includes(p.id)
                                    ? profileIds.filter(id => id !== p.id)
                                    : [...profileIds, p.id];
                                  return { ...prev, profileIds: updated };
                                });
                              }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border ${
                                isSelected
                                  ? 'border-brand-500 bg-brand-500/10 text-white shadow-lg'
                                  : 'border-dark-600/50 text-dark-300 hover:border-dark-500 bg-dark-700/30 hover:bg-dark-700/60'
                              }`}
                            >
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {p.avatarUrl ? (
                                  <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white text-[9px] font-bold">{p.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              {p.name}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-dark-500 italic">Nenhum perfil cadastrado. Configure em Configurações de Perfil.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 5 — Conteúdo & Mídia */}
              <div className="relative pl-6 border-l-2 border-amber-500/30 hover:border-amber-500/70 transition-colors duration-300">
                <div className="absolute -left-[18px] top-0 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-amber-500/30">
                  5
                </div>
                <div className="mb-5">
                  <h3 className="text-base font-bold text-white">Conteúdo & Mídia</h3>
                  <p className="text-xs text-dark-400 mt-0.5">Faça upload dos arquivos ou adicione um link externo</p>
                </div>

                <div className="p-5 rounded-2xl border border-dark-600/40 bg-dark-700/20 space-y-4">
                  <div className="relative group">
                    <HiOutlineLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 group-focus-within:text-amber-400 transition-colors" />
                    <input
                      type="url"
                      value={form.fileUrl?.includes('supabase') ? '' : form.fileUrl}
                      onChange={e => {
                        const val = e.target.value;
                        handleChange('fileUrl', val);
                        if (val && (!form.fileUrls || form.fileUrls.length === 0)) {
                          handleChange('fileUrls', [val]);
                        }
                      }}
                      placeholder="Link externo (Drive, Pinterest, etc.)"
                      className="w-full pl-10 pr-4 py-3.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 transition-all text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-3 text-dark-500 text-xs">
                    <div className="flex-1 h-px bg-dark-600/50" />
                    <span className="font-medium">ou faça upload</span>
                    <div className="flex-1 h-px bg-dark-600/50" />
                  </div>

                  <label className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${isUploading || (form.fileUrls?.length >= 10) ? 'opacity-50 cursor-not-allowed border-dark-600/30' : 'border-dark-600/50 hover:border-amber-500/50 hover:bg-amber-500/5'}`}>
                    <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
                      <HiOutlineLink className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-sm font-semibold text-dark-200">Clique para selecionar arquivos</span>
                    <span className="text-xs text-dark-500">Imagens ou vídeos — máximo 10 arquivos</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={isUploading || (form.fileUrls?.length >= 10)}
                      className="hidden"
                    />
                  </label>

                  {form.fileUrls?.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {form.fileUrls.map((url, idx) => (
                        <div
                          key={idx}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(idx)}
                          className={`relative w-20 h-20 rounded-xl overflow-hidden border ${draggedIdx === idx ? 'border-amber-500 opacity-50' : 'border-dark-600/50'} group/img shadow-lg cursor-grab active:cursor-grabbing`}
                        >
                          {isVideo(url) ? (
                            <video src={url} className="w-full h-full object-cover pointer-events-none" muted playsInline />
                          ) : (
                            <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover/img:scale-110 duration-500 pointer-events-none" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-300 z-10"
                          >
                            <HiX className="w-5 h-5 text-white hover:scale-110 transition-transform" />
                          </button>
                          <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-medium pointer-events-none">
                            {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 6 — Produção */}
              <div className="relative pl-6 border-l-2 border-emerald-500/30 hover:border-emerald-500/70 transition-colors duration-300">
                <div className="absolute -left-[18px] top-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-emerald-500/30">
                  6
                </div>
                <div className="mb-5">
                  <h3 className="text-base font-bold text-white">Produção</h3>
                  <p className="text-xs text-dark-400 mt-0.5">Ferramenta utilizada, status do projeto e tráfego pago</p>
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-emerald-400 transition-colors">Ferramenta</label>
                      <select
                        value={form.tool}
                        onChange={e => handleChange('tool', e.target.value)}
                        className="w-full px-4 py-3.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all text-sm appearance-none cursor-pointer"
                      >
                        {tools.map(t => (
                          <option key={t} value={t} className="bg-dark-800">{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-emerald-400 transition-colors">Status</label>
                      <select
                        value={form.status}
                        onChange={e => handleChange('status', e.target.value)}
                        className="w-full px-4 py-3.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all text-sm appearance-none cursor-pointer"
                      >
                        {postStatuses.map(s => (
                          <option key={s.value} value={s.value} className="bg-dark-800">{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-dark-600/40 bg-dark-700/20">
                    <label className="flex items-center gap-3 cursor-pointer group/check w-fit">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${form.hasPaidTraffic ? 'bg-emerald-500 border-emerald-500' : 'border-dark-500 bg-dark-700 group-hover/check:border-emerald-500/50'}`}>
                        {form.hasPaidTraffic && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input
                        type="checkbox"
                        checked={form.hasPaidTraffic}
                        onChange={e => handleChange('hasPaidTraffic', e.target.checked)}
                        className="hidden"
                      />
                      <div>
                        <span className="text-sm font-semibold text-dark-100 group-hover/check:text-white transition-colors block">Terá Tráfego Pago?</span>
                        <span className="text-xs text-dark-500">Impulsionamento via Meta Ads ou similar</span>
                      </div>
                    </label>
                    {form.hasPaidTraffic && (
                      <div className="relative animate-fade-in group mt-4">
                        <HiOutlineCurrencyDollar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="number"
                          value={form.budget}
                          onChange={e => handleChange('budget', e.target.value)}
                          placeholder="Orçamento previsto (R$)"
                          className="w-full pl-10 pr-4 py-3.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

            {/* === PHONE PREVIEW === */}
            <div className="hidden lg:block relative select-none">
              <div className="sticky top-6 w-full">
                <div className="text-center mb-4 flex flex-col items-center justify-center gap-2">
                  <span className="text-xs font-bold text-dark-300 uppercase tracking-widest flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                    Preview: {contentType}
                  </span>
                  {isStory && (
                    <button
                      type="button"
                      onClick={() => setIsCustomizingStory(p => !p)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isCustomizingStory 
                          ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg glow-brand animate-pulse-slow'
                          : 'bg-dark-700 hover:bg-dark-600 border border-dark-600 text-dark-200'
                      }`}
                    >
                      {isCustomizingStory ? '✕ Concluir' : '🎨 Personalizar Story'}
                    </button>
                  )}
                </div>
                
                <div className="relative w-full aspect-[9/16] bg-dark-900 rounded-[2.5rem] border-[6px] border-dark-800 shadow-2xl overflow-hidden flex flex-col group/phone hover:border-dark-700 transition-colors duration-500">
                  {/* Notch Fake */}
                  <div className="absolute top-0 w-full h-6 z-20 flex justify-center items-start">
                    <div className="w-1/3 h-4 bg-dark-800 rounded-b-xl" />
                  </div>

                  {isStory ? (
                    <div 
                      ref={storyContainerRef}
                      className="relative flex-1 bg-black overflow-hidden select-none"
                      onPointerMove={handleStickerDragMove}
                      onPointerUp={handleStickerDragEnd}
                      onPointerLeave={handleStickerDragEnd}
                    >
                      {isVideo(mediaUrl) ? (
                        <video src={mediaUrl} className="w-full h-full object-cover opacity-90" autoPlay muted loop playsInline />
                      ) : (
                        <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover opacity-90 pointer-events-none" />
                      )}
                      
                      {/* Barrinhas de Progresso Story */}
                      <div className="absolute top-2 w-full px-2 flex gap-1 z-30">
                        {fileUrls.map((_, i) => (
                          <div key={i} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div className={`h-full bg-white ${i === safeSlide ? 'w-full' : i < safeSlide ? 'w-full' : 'w-0'}`} />
                          </div>
                        ))}
                      </div>

                      {/* Header Story */}
                      <div className="absolute top-4 left-0 w-full px-3 flex items-center justify-between z-30">
                        <div className="flex items-center gap-2">
                          {renderAvatars("w-8 h-8")}
                          <span className="text-white text-xs font-semibold drop-shadow-md">{previewName}</span>
                          <span className="text-white/70 text-[10px] drop-shadow-md">2h</span>
                        </div>
                        <HiX className="text-white w-5 h-5 drop-shadow-md" />
                      </div>
                      
                      {/* Stickers Overlay */}
                      {renderStickers(form.storyStickers, true, (idx) => setSelectedStickerIdx(idx))}

                      {/* Floating Sticker Button (Instagram Style) */}
                      {isCustomizingStory && (
                        <div className="absolute top-12 right-3 z-40 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setShowStickerList(p => !p)}
                            className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors shadow"
                            title="Figurinhas"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Sticker List popover */}
                      {showStickerList && (
                        <div className="absolute inset-x-0 bottom-0 top-1/4 bg-dark-950/95 backdrop-blur-lg border-t border-dark-600/50 rounded-t-3xl p-4 z-50 flex flex-col animate-slide-up pointer-events-auto">
                          <div className="flex items-center justify-between border-b border-dark-600/30 pb-2 mb-3">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Adesivos</span>
                            <button
                              type="button"
                              onClick={() => setShowStickerList(false)}
                              className="text-dark-400 hover:text-white text-[10px] font-bold"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1 no-scrollbar">
                            {[
                              { type: 'poll', name: 'Enquete', icon: '📊' },
                              { type: 'question', name: 'Pergunta', icon: '❓' },
                              { type: 'link', name: 'Link', icon: '🔗' },
                              { type: 'slider', name: 'Emoji Slider', icon: '😍' },
                              { type: 'countdown', name: 'Contagem', icon: '⏰' }
                            ].map(stickerType => (
                              <button
                                key={stickerType.type}
                                type="button"
                                onClick={() => addSticker(stickerType.type)}
                                className="flex flex-col items-center justify-center p-3 bg-dark-800 hover:bg-dark-700 border border-dark-600/40 rounded-2xl transition-all hover:scale-[1.03]"
                              >
                                <span className="text-2xl mb-1">{stickerType.icon}</span>
                                <span className="text-[9px] font-bold text-white uppercase tracking-wider">{stickerType.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Text Overlay */}
                      {!isCustomizingStory && (
                        <div className="absolute inset-0 flex items-center justify-center p-6 z-20 pointer-events-none">
                          {form.caption && (
                            <p className="text-white font-bold text-center drop-shadow-lg text-sm leading-snug bg-black/40 p-3 rounded-xl backdrop-blur-sm">
                              {form.caption.replace(/<[^>]*>?/gm, '')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Footer Story */}
                      <div className="absolute bottom-0 w-full p-4 flex gap-3 items-center z-30 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex-1 border border-white/40 rounded-full px-4 py-2.5 bg-transparent">
                          <span className="text-white/60 text-[10px] uppercase font-semibold">Enviar mensagem</span>
                        </div>
                        <HiHeart className="text-white w-6 h-6 drop-shadow-md" />
                        <HiPaperAirplane className="text-white w-6 h-6 -rotate-45 drop-shadow-md" />
                      </div>
                      
                      {/* Nav Story */}
                      {!isCustomizingStory && fileUrls.length > 1 && (
                        <>
                          <button type="button" onClick={prevSlide} className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-2/3 z-40 bg-transparent" />
                          <button type="button" onClick={nextSlide} className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-2/3 z-40 bg-transparent" />
                        </>
                      )}
                    </div>
                  ) : isReels ? (
                    <div className="relative flex-1 bg-black">
                      {isVideo(mediaUrl) ? (
                        <video src={mediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : (
                        <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      
                      {/* Right side actions Reels */}
                      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 z-30">
                        <div className="flex flex-col items-center gap-1 cursor-pointer">
                          <HiHeart className="w-6 h-6 text-white drop-shadow-md" />
                          <span className="text-white text-[10px] font-medium drop-shadow-md">10K</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 cursor-pointer">
                          <HiChat className="w-6 h-6 text-white drop-shadow-md" />
                          <span className="text-white text-[10px] font-medium drop-shadow-md">100</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 cursor-pointer">
                          <HiPaperAirplane className="w-6 h-6 text-white -rotate-45 drop-shadow-md" />
                          <span className="text-white text-[10px] font-medium drop-shadow-md">50</span>
                        </div>
                        <HiDotsVertical className="w-5 h-5 text-white drop-shadow-md mt-1" />
                        <div className="w-7 h-7 rounded-md bg-dark-700 border-2 border-white overflow-hidden mt-2 flex items-center justify-center">
                           <HiMusicNote className="text-white w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                      </div>

                      {/* Bottom Info Reels */}
                      <div className="absolute bottom-0 left-0 w-[85%] p-4 z-30 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          {renderAvatars("w-7 h-7")}
                          <span className="text-white text-xs font-semibold drop-shadow-md">{previewName}</span>
                          <button className="border border-white/50 px-2 py-0.5 rounded-md text-white text-[9px] font-medium backdrop-blur-sm">Seguir</button>
                        </div>
                        <p className="text-white/90 text-[11px] line-clamp-2 drop-shadow-md mb-2">
                          {form.caption ? form.caption.replace(/<[^>]*>?/gm, '') : 'Sua legenda do Reels vai aparecer aqui...'}
                        </p>
                        <div className="flex items-center gap-1 bg-white/20 w-fit px-2 py-1 rounded-full backdrop-blur-sm">
                          <HiMusicNote className="text-white w-3 h-3" />
                          <span className="text-white text-[9px] truncate max-w-[120px]">Áudio original - {previewName}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 bg-dark-900 flex flex-col pt-6 relative">
                      <div className="flex items-center justify-between px-3 py-2 bg-dark-900">
                        <div className="flex items-center gap-2">
                          {renderAvatars("w-7 h-7")}
                          <span className="text-white text-xs font-semibold">{previewName}</span>
                        </div>
                        <HiDotsHorizontal className="text-dark-300 w-4 h-4" />
                      </div>
                      
                      <div className="w-full aspect-square bg-dark-800 relative group/feedimg">
                        {isVideo(mediaUrl) ? (
                          <video src={mediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                        ) : (
                          <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        
                        {/* Carousel Arrows Feed */}
                        {fileUrls.length > 1 && (
                          <>
                            {safeSlide > 0 && (
                              <button type="button" onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10">
                                <HiChevronLeft className="w-4 h-4 -ml-0.5" />
                              </button>
                            )}
                            {safeSlide < fileUrls.length - 1 && (
                              <button type="button" onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10">
                                <HiChevronRight className="w-4 h-4 -mr-0.5" />
                              </button>
                            )}
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] px-2 py-1 rounded-full z-10 font-semibold backdrop-blur-sm">
                              {safeSlide + 1}/{fileUrls.length}
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="px-3 py-2 bg-dark-900 flex flex-col gap-1">
                        <div className="flex items-center justify-between relative">
                          <div className="flex items-center gap-3">
                            <HiHeart className="w-5 h-5 text-white hover:text-danger cursor-pointer transition-colors" />
                            <HiChat className="w-5 h-5 text-white hover:text-brand-400 cursor-pointer transition-colors" />
                            <HiPaperAirplane className="w-5 h-5 text-white hover:text-brand-400 cursor-pointer transition-colors -rotate-45" />
                          </div>
                          {fileUrls.length > 1 && (
                            <div className="absolute left-1/2 -translate-x-1/2 flex gap-1">
                              {fileUrls.map((_, i) => (
                                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === safeSlide ? 'bg-brand-500' : 'bg-dark-600'}`} />
                              ))}
                            </div>
                          )}
                          <HiBookmark className="w-5 h-5 text-white hover:text-brand-400 cursor-pointer transition-colors" />
                        </div>
                        <span className="text-white text-[10px] font-semibold mt-1">1.234 curtidas</span>
                      </div>
                      <div className="px-3 flex-1 overflow-y-auto no-scrollbar pb-4 bg-dark-900">
                        <p className="text-white text-[11px] leading-relaxed">
                          <span className="font-semibold mr-1.5">{previewName}</span>
                          {form.caption ? form.caption.replace(/<[^>]*>?/gm, '') : 'Sua legenda vai aparecer aqui...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-8 border-t border-dark-600/30 mt-10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-dark-700/50 text-dark-200 rounded-xl text-sm font-semibold hover:bg-dark-600 hover:text-white transition-all min-w-[120px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-8 py-3 gradient-brand rounded-xl text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(var(--brand-500),0.3)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 min-w-[150px]"
            >
              {isUploading ? 'Aguarde...' : (editingPost ? 'Salvar Alterações' : 'Criar Post')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

