import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (editingPost) {
      setForm({
         ...editingPost,
         fileUrls: editingPost.fileUrls || (editingPost.fileUrl ? [editingPost.fileUrl] : []),
         profileIds: editingPost.profileIds || [],
      });
    } else {
      setForm({ ...emptyPost, date: initialDate || '', profileIds: [] });
    }
    setCurrentSlide(0);
  }, [editingPost, isOpen, initialDate]);

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

            {/* === PHONE PREVIEW === */}
            <div className="hidden lg:block relative select-none">
              <div className="sticky top-6 w-full">
                <div className="text-center mb-4 flex items-center justify-center gap-2">
                  <span className="text-xs font-bold text-dark-300 uppercase tracking-widest flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                    Preview: {contentType}
                  </span>
                </div>
                
                <div className="relative w-full aspect-[9/16] bg-dark-900 rounded-[2.5rem] border-[6px] border-dark-800 shadow-2xl overflow-hidden flex flex-col group/phone hover:border-dark-700 transition-colors duration-500">
                  {/* Notch Fake */}
                  <div className="absolute top-0 w-full h-6 z-20 flex justify-center items-start">
                    <div className="w-1/3 h-4 bg-dark-800 rounded-b-xl" />
                  </div>

                  {isStory ? (
                    <div className="relative flex-1 bg-black">
                      {isVideo(mediaUrl) ? (
                        <video src={mediaUrl} className="w-full h-full object-cover opacity-90" autoPlay muted loop playsInline />
                      ) : (
                        <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover opacity-90" />
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
                      
                      {/* Text Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center p-6 z-20 pointer-events-none">
                        {form.caption && (
                          <p className="text-white font-bold text-center drop-shadow-lg text-sm leading-snug bg-black/40 p-3 rounded-xl backdrop-blur-sm">
                            {form.caption.replace(/<[^>]*>?/gm, '')}
                          </p>
                        )}
                      </div>

                      {/* Footer Story */}
                      <div className="absolute bottom-0 w-full p-4 flex gap-3 items-center z-30 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex-1 border border-white/40 rounded-full px-4 py-2.5 bg-transparent">
                          <span className="text-white/60 text-[10px] uppercase font-semibold">Enviar mensagem</span>
                        </div>
                        <HiHeart className="text-white w-6 h-6 drop-shadow-md" />
                        <HiPaperAirplane className="text-white w-6 h-6 -rotate-45 drop-shadow-md" />
                      </div>
                      
                      {/* Nav Story */}
                      {fileUrls.length > 1 && (
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

