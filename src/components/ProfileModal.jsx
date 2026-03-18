import { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import { useApp } from '../contexts/AppContext';

export default function ProfileModal({ isOpen, onClose }) {
  const { profile, updateProfile, apiKeys, updateApiKeys } = useApp();
  const [activeTab, setActiveTab] = useState('profile');

  const [form, setForm] = useState({
    name: 'G3',
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

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || 'G3',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-dark-800 border border-dark-600/50 rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-dark-800/95 backdrop-blur-xl border-b border-dark-600/50 z-10">
          <h2 className="text-lg font-bold text-white">Configurações de Perfil</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex bg-dark-800 border-b border-dark-600/50">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'profile' ? 'border-brand-500 text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            Perfil Público
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'integrations' ? 'border-brand-500 text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            Integrações (APIs)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === 'profile' ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center overflow-hidden">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xl">{form.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-dark-200 mb-1">Link do Avatar (URL)</label>
                  <input
                    type="url"
                    value={form.avatarUrl}
                    onChange={e => handleChange('avatarUrl', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Nome de Exibição</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Página do Instagram</label>
                <input
                  type="url"
                  value={form.instagramUrl}
                  onChange={e => handleChange('instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/seu_perfil"
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Página do Facebook</label>
                <input
                  type="url"
                  value={form.facebookUrl}
                  onChange={e => handleChange('facebookUrl', e.target.value)}
                  placeholder="https://facebook.com/seu_perfil"
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Página do LinkedIn</label>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={e => handleChange('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/company/sua_empresa"
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm"
                />
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

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-xl text-dark-200 hover:text-white hover:bg-dark-700 transition-all text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 gradient-brand rounded-xl text-white font-medium text-sm hover:shadow-lg transition-all"
            >
              Salvar Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
