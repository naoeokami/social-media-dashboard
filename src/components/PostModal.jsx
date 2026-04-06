import { useState, useEffect } from 'react';
import { HiX, HiOutlineLink, HiOutlineCurrencyDollar } from 'react-icons/hi';
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
  fileUrls: [], // Substitui fileUrl para múltiplos
  fileUrl: '', // Mantido por compatibilidade
  hasPaidTraffic: false,
  budget: '',
};

export default function PostModal({ isOpen, onClose, onSave, editingPost, initialDate }) {
  const { segments, products } = useApp();
  const [form, setForm] = useState(emptyPost);

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editingPost) {
      setForm({
         ...editingPost,
         fileUrls: editingPost.fileUrls || (editingPost.fileUrl ? [editingPost.fileUrl] : []),
      });
    } else {
      setForm({ ...emptyPost, date: initialDate || '' });
    }
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
      toast.error('Máximo de 10 imagens permitidas!');
      return;
    }

    try {
      setIsUploading(true);
      const toastId = toast.loading(`Fazendo upload de ${files.length} imagem(ns)...`);

      const newUrls = [];
      const options = {
        maxSizeMB: 1, // Max 1MB
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };

      for (const file of files) {
        let compressedFile = file;
        try {
          compressedFile = await imageCompression(file, options);
        } catch (err) {
          console.warn('Compression failed, using original file', err);
        }
        
        const safeName = (file.name || 'image.jpg').replace(/[^a-zA-Z0-9.\-_]/g, '');
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
        fileUrl: prev.fileUrl || newUrls[0] // Set primary for compat
      }));
      
      toast.success('Upload concluído com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Erro detalhado no upload:', error);
      toast.error('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
      // Reset input
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    setForm(emptyPost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-800 border border-dark-600/50 rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-dark-800/95 backdrop-blur-xl border-b border-dark-600/50 rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-white">
            {editingPost ? 'Editar Post' : 'Novo Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {form.status === 'producao' && form.feedback_note && (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 animate-fade-in">
              <h3 className="text-warning font-semibold text-sm mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                Ajustes Solicitados pelo Cliente
              </h3>
              <p className="text-dark-200 text-sm italic">"{form.feedback_note}"</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Título da Peça</label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="Ex: Post sobre lançamento do produto"
              className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm"
              required
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Legenda (Copy)</label>
            <textarea
              value={form.caption}
              onChange={e => handleChange('caption', e.target.value)}
              placeholder="Escreva a legenda do post..."
              rows={4}
              className="rich-editor w-full"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Data</label>
              <input
                type="date"
                value={form.date}
                onChange={e => handleChange('date', e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Hora</label>
              <input
                type="time"
                value={form.time}
                onChange={e => handleChange('time', e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Content Type & Segment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Tipo de Conteúdo</label>
              <select
                value={form.contentType}
                onChange={e => handleChange('contentType', e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm appearance-none cursor-pointer"
              >
                {contentTypes.map(type => (
                  <option key={type} value={type} className="bg-dark-800">{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Segmento de Mercado</label>
              <select
                value={form.segment}
                onChange={e => handleChange('segment', e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="" className="bg-dark-800">Selecione um segmento</option>
                {segments.map(seg => (
                  <option key={seg.id} value={seg.name} className="bg-dark-800">{seg.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Produto Divulgado</label>
            <select
              value={form.productId}
              onChange={e => handleChange('productId', e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="" className="bg-dark-800">Nenhum produto</option>
              {products.map(prod => (
                <option key={prod.id} value={prod.id} className="bg-dark-800">
                  {prod.name} ({prod.segment || 'Sem segmento'})
                </option>
              ))}
            </select>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Plataformas</label>
            <div className="flex gap-3">
              {platforms.map(({ name, color }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => togglePlatform(name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    form.platforms.includes(name)
                      ? 'border-transparent text-white shadow-lg'
                      : 'border-dark-600/50 text-dark-300 hover:border-dark-500 bg-dark-700/30'
                  }`}
                  style={form.platforms.includes(name) ? { backgroundColor: color + '20', borderColor: color, color: color } : {}}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Tool & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Ferramenta</label>
              <select
                value={form.tool}
                onChange={e => handleChange('tool', e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm appearance-none cursor-pointer"
              >
                {tools.map(t => (
                  <option key={t} value={t} className="bg-dark-800">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => handleChange('status', e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm appearance-none cursor-pointer"
              >
                {postStatuses.map(s => (
                  <option key={s.value} value={s.value} className="bg-dark-800">{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* File URL and Upload */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Mídia (Upload ou Link)</label>
            <div className="flex flex-col gap-3">
              <div className="relative flex-1">
                <HiOutlineLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="url"
                  value={form.fileUrl}
                  onChange={e => {
                    handleChange('fileUrl', e.target.value);
                    if (e.target.value && (!form.fileUrls || form.fileUrls.length === 0)) {
                       handleChange('fileUrls', [e.target.value]);
                    }
                  }}
                  placeholder="https://drive.google.com/... ou faça upload abaixo"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploading || (form.fileUrls?.length >= 10)}
                  className="block w-full text-sm text-dark-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-brand-500/20 file:text-brand-400
                    hover:file:bg-brand-500/30 file:transition-all
                    file:cursor-pointer disabled:opacity-50"
                />
              </div>

              {/* Image Previews */}
              {form.fileUrls?.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2">
                  {form.fileUrls.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-dark-600/50 group">
                      <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <HiX className="w-4 h-4 text-white" />
                      </button>
                      <span className="absolute bottom-0 right-0 bg-black/80 px-1 text-[10px] text-white">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Paid Traffic */}
          <div className="p-4 bg-dark-700/30 rounded-xl border border-dark-600/30 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasPaidTraffic}
                onChange={e => handleChange('hasPaidTraffic', e.target.checked)}
                className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-brand-500 focus:ring-brand-500/30 cursor-pointer"
              />
              <span className="text-sm font-medium text-dark-200">Terá Tráfego Pago?</span>
            </label>
            {form.hasPaidTraffic && (
              <div className="relative animate-fade-in">
                <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="number"
                  value={form.budget}
                  onChange={e => handleChange('budget', e.target.value)}
                  placeholder="Orçamento (R$)"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-dark-200 hover:text-white hover:bg-dark-700 transition-all text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 px-4 py-2.5 gradient-brand rounded-xl text-white font-medium text-sm hover:shadow-lg hover:shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {isUploading ? 'Aguarde...' : (editingPost ? 'Salvar Alterações' : 'Criar Post')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
