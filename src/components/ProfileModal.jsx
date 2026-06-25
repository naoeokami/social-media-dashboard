import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiX } from 'react-icons/hi';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export default function ProfileModal({ isOpen, onClose }) {
  const { 
    profile, updateProfile, apiKeys, updateApiKeys, 
    socialProfiles, addSocialProfile, deleteSocialProfile 
  } = useApp();
  const [activeTab, setActiveTab] = useState('profile');

  const [form, setForm] = useState({
    name: '',
    avatarUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
  });

  const [keysForm, setKeysForm] = useState({
    metaToken: '',
    igAccountId: '',
    linkedinToken: ''
  });

  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialHandle, setNewSocialHandle] = useState('');
  const [newSocialAvatar, setNewSocialAvatar] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        avatarUrl: profile.avatarUrl || '',
        instagramUrl: profile.instagramUrl || '',
        facebookUrl: profile.facebookUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
      });
    }
    if (apiKeys) {
      setKeysForm({
        metaToken: apiKeys.metaToken || '',
        igAccountId: apiKeys.igAccountId || '',
        linkedinToken: apiKeys.linkedinToken || '',
      });
    }
  }, [profile, apiKeys, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleKeysChange = (field, value) => {
    setKeysForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'profile') {
      const ok = await updateProfile(form);
      if (ok) onClose();
    } else if (activeTab === 'api') {
      const ok = await updateApiKeys(keysForm);
      if (ok) onClose();
    }
  };

  const handleAddSocial = async (e) => {
    e.preventDefault();
    if (!newSocialName || !newSocialHandle) return;
    const ok = await addSocialProfile({
      name: newSocialName,
      handle: newSocialHandle,
      avatarUrl: newSocialAvatar
    });
    if (ok) {
      setNewSocialName('');
      setNewSocialHandle('');
      setNewSocialAvatar('');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await supabase.auth.signOut();
      onClose();
      window.location.reload();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-dark-800 border border-dark-600/50 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-slide-up overflow-hidden">
        
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500" />

        <div className="flex items-center justify-between px-6 py-5 bg-dark-800/80 backdrop-blur-xl border-b border-dark-600/30 z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Configurações de Perfil</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="text-xs text-danger font-bold px-3 py-2 rounded-xl bg-danger/10 hover:bg-danger/20 hover:scale-105 transition-all"
            >
              Sair
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700/50 transition-all"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex bg-dark-800 border-b border-dark-600/50">
          <button 
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'profile' ? 'border-brand-500 text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            Perfil Público
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('social')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'social' ? 'border-brand-500 text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            Contas Sociais
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'api' ? 'border-brand-500 text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            APIs & Chaves
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                  placeholder="Seu nome..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">URL do Avatar</label>
                <input
                  type="url"
                  value={form.avatarUrl}
                  onChange={e => handleChange('avatarUrl', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                  placeholder="https://exemplo.com/foto.jpg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">URL Instagram</label>
                <input
                  type="url"
                  value={form.instagramUrl}
                  onChange={e => handleChange('instagramUrl', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                  placeholder="https://instagram.com/seu-perfil"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">URL Facebook</label>
                <input
                  type="url"
                  value={form.facebookUrl}
                  onChange={e => handleChange('facebookUrl', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                  placeholder="https://facebook.com/seu-perfil"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">URL LinkedIn</label>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={e => handleChange('linkedinUrl', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                  placeholder="https://linkedin.com/in/seu-perfil"
                />
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              {/* Form de adicionar */}
              <div className="bg-dark-700/30 border border-dark-600/50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Adicionar Perfil Social</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nome (Ex: Instagram G3)"
                    value={newSocialName}
                    onChange={e => setNewSocialName(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-600/50 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Identificador (Ex: @g3marketing)"
                    value={newSocialHandle}
                    onChange={e => setNewSocialHandle(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-600/50 rounded-lg text-xs text-white"
                  />
                  <input
                    type="url"
                    placeholder="Avatar URL (Opcional)"
                    value={newSocialAvatar}
                    onChange={e => setNewSocialAvatar(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-600/50 rounded-lg text-xs text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSocial}
                  className="w-full py-2 bg-brand-500 text-white rounded-lg text-xs font-semibold hover:bg-brand-600 transition-colors"
                >
                  Adicionar Conta
                </button>
              </div>

              {/* Lista */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Contas Vinculadas</h4>
                {socialProfiles.length === 0 ? (
                  <p className="text-xs text-dark-400 italic">Nenhum perfil cadastrado.</p>
                ) : (
                  socialProfiles.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-dark-700/20 border border-dark-600/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center overflow-hidden">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-brand-400 font-bold uppercase">{p.name.slice(0,2)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{p.name}</p>
                          <p className="text-[10px] text-dark-400">{p.handle}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Excluir perfil "${p.name}"?`)) deleteSocialProfile(p.id);
                        }}
                        className="text-xs text-danger hover:brightness-125 font-bold"
                      >
                        Excluir
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Meta Access Token</label>
                <input
                  type="password"
                  value={keysForm.metaToken}
                  onChange={e => handleKeysChange('metaToken', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                  placeholder="Token do app da Meta..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Meta Instagram Account ID</label>
                <input
                  type="text"
                  value={keysForm.igAccountId}
                  onChange={e => handleKeysChange('igAccountId', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                  placeholder="ID numérico da conta de negócios..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">LinkedIn Access Token</label>
                <input
                  type="password"
                  value={keysForm.linkedinToken}
                  onChange={e => handleKeysChange('linkedinToken', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                  placeholder="Token do app LinkedIn..."
                />
              </div>
            </div>
          )}

          {activeTab !== 'social' ? (
            <div className="flex gap-3 pt-4 border-t border-dark-600/30 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-dark-700/50 text-dark-200 rounded-xl text-sm font-semibold hover:bg-dark-600 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 gradient-brand text-white rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(var(--brand-500),0.3)] hover:scale-[1.02] transition-all duration-200"
              >
                Salvar Alterações
              </button>
            </div>
          ) : (
            <div className="flex gap-3 pt-4 border-t border-dark-600/30 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-3 bg-dark-700/50 text-dark-200 rounded-xl text-sm font-semibold hover:bg-dark-600 hover:text-white transition-all"
              >
                Fechar
              </button>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}
