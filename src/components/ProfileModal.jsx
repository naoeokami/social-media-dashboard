import { useState, useEffect } from 'react';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(form);
    updateApiKeys(keysForm);
    onClose();
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onClose();
    window.location.reload();
  };

  return (
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
            onClick={() => setActiveTab('social_profiles')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'social_profiles' ? 'border-brand-500 text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            Perfis de Post
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('integrations')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'integrations' ? 'border-brand-500 text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            Integrações (APIs)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === 'profile' ? (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-5 mb-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-brand-500/30 transition-all duration-300">
                    {form.avatarUrl ? (
                      <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <span className="text-white font-bold text-2xl">{form.name.charAt(0).toUpperCase() || '?'}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 group">
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Link do Avatar (URL)</label>
                  <input
                    type="url"
                    value={form.avatarUrl}
                    onChange={e => handleChange('avatarUrl', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Nome de Exibição</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                  required
                />
              </div>

              <div className="group">
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Página do Instagram</label>
                <input
                  type="url"
                  value={form.instagramUrl}
                  onChange={e => handleChange('instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/seu_perfil"
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                />
              </div>
              
              <div className="group">
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Página do Facebook</label>
                <input
                  type="url"
                  value={form.facebookUrl}
                  onChange={e => handleChange('facebookUrl', e.target.value)}
                  placeholder="https://facebook.com/seu_perfil"
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                />
              </div>

              <div className="group">
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 group-focus-within:text-brand-400 transition-colors">Página do LinkedIn</label>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={e => handleChange('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/company/sua_empresa"
                  className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                />
              </div>
            </div>
          ) : activeTab === 'social_profiles' ? (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl mb-2">
                <p className="text-xs text-brand-300">
                  Cadastre aqui as contas/perfis que serão utilizados para as publicações (incluindo collab).
                </p>
              </div>

              {/* Add social profile form */}
              <div className="bg-dark-700/25 p-4 rounded-xl border border-dark-600/30 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Novo Perfil</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-dark-300 uppercase tracking-wider mb-1">Nome</label>
                    <input
                      type="text"
                      placeholder="Ex: G3 Soft"
                      value={newSocialName}
                      onChange={e => setNewSocialName(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-xs placeholder-dark-400 focus:outline-none focus:border-brand-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-dark-300 uppercase tracking-wider mb-1">@handle</label>
                    <input
                      type="text"
                      placeholder="g3softecnologia"
                      value={newSocialHandle}
                      onChange={e => setNewSocialHandle(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-xs placeholder-dark-400 focus:outline-none focus:border-brand-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 uppercase tracking-wider mb-1">Avatar (URL)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newSocialAvatar}
                    onChange={e => setNewSocialAvatar(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-xs placeholder-dark-400 focus:outline-none focus:border-brand-500/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newSocialName.trim() || !newSocialHandle.trim()) {
                      toast.error('Preencha Nome e Handle!');
                      return;
                    }
                    addSocialProfile({
                      name: newSocialName.trim(),
                      handle: newSocialHandle.trim(),
                      avatarUrl: newSocialAvatar.trim()
                    });
                    setNewSocialName('');
                    setNewSocialHandle('');
                    setNewSocialAvatar('');
                    toast.success('Perfil de publicação cadastrado!');
                  }}
                  className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Adicionar Perfil
                </button>
              </div>

              {/* Registered Profiles List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-dark-300 uppercase tracking-wider">Perfis Cadastrados</h4>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {socialProfiles.length === 0 ? (
                    <p className="text-xs text-dark-400 text-center py-2">Nenhum perfil cadastrado.</p>
                  ) : (
                    socialProfiles.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-dark-700/30 rounded-xl border border-dark-600/20">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center overflow-hidden">
                            {p.avatarUrl ? (
                              <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-xs font-bold">{p.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white leading-tight">{p.name}</div>
                            <div className="text-[10px] text-dark-400">@{p.handle}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Deseja remover o perfil "${p.name}"?`)) {
                              deleteSocialProfile(p.id);
                              toast.success('Perfil removido!');
                            }
                          }}
                          className="text-[10px] text-danger hover:underline px-2 py-1 bg-danger/10 hover:bg-danger/25 rounded-md transition-all font-semibold"
                        >
                          Excluir
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl mb-4">
                <p className="text-xs text-brand-300">
                  Preencha os tokens de acesso para buscar os dados reais direto nas redes sociais (Graph API).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Meta Access Token (Instagram/FB)</label>
                <input
                  type="password"
                  value={keysForm.metaToken}
                  onChange={e => handleKeysChange('metaToken', e.target.value)}
                  placeholder="EAA..."
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Instagram Account ID</label>
                <input
                  type="text"
                  value={keysForm.igAccountId}
                  onChange={e => handleKeysChange('igAccountId', e.target.value)}
                  placeholder="178414..."
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">LinkedIn Access Token</label>
                <input
                  type="password"
                  value={keysForm.linkedinToken}
                  onChange={e => handleKeysChange('linkedinToken', e.target.value)}
                  placeholder="AQV..."
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          )}

          {activeTab !== 'social_profiles' ? (
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
                Salvar Perfil
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
    </div>
  );
}
