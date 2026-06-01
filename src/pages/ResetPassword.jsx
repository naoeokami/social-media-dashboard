import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import { toast } from 'react-hot-toast';
import { HiOutlineLockClosed, HiOutlineSparkles, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

export default function ResetPassword() {
  const { setIsPasswordRecovery } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem. Por favor, verifique.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success('Senha redefinida com sucesso! Acessando o painel...');
      
      // Limpa estado de redefinição
      sessionStorage.removeItem('isPasswordRecovery');
      setIsPasswordRecovery(false);
    } catch (error) {
      toast.error(error.message || 'Erro ao tentar redefinir sua senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      // Efetua logout para limpar a sessão temporária de redefinição
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      sessionStorage.removeItem('isPasswordRecovery');
      setIsPasswordRecovery(false);
      toast.success('Retornando à tela de login.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-800 border border-dark-600/50 rounded-3xl p-8 shadow-2xl animate-fade-in relative overflow-hidden">
        {/* Decorative Blur */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 gradient-brand rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <HiOutlineSparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Nova Senha
            </h1>
            <p className="text-dark-300 text-sm">
              Crie uma senha forte e segura para a sua conta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Nova Senha</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors outline-none"
                >
                  {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Confirmar Nova Senha</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors outline-none"
                >
                  {showConfirmPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 gradient-brand rounded-xl text-white font-medium hover:shadow-lg hover:shadow-brand-500/25 transition-all outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50"
            >
              {loading ? 'Redefinindo...' : 'Atualizar Senha'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-dark-400 hover:text-white transition-colors outline-none"
            >
              Cancelar e voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
