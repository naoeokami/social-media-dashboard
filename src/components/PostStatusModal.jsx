import { HiCheckCircle, HiRefresh } from 'react-icons/hi';

export default function PostStatusModal({ isOpen, onClose, postTitle, type = 'approval' }) {
  if (!isOpen) return null;

  const isApproval = type === 'approval';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden animate-slide-up">
        {/* Animated Background Glow */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 ${isApproval ? 'bg-success/20' : 'bg-warning/20'} rounded-full blur-[80px]`} />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-brand-500/20 rounded-full blur-[80px]" />

        <div className="relative flex flex-col items-center text-center">
          {/* Icon with Pulse */}
          <div className="relative mb-6">
            <div className={`w-20 h-20 rounded-full ${isApproval ? 'bg-success/10 border-success/20' : 'bg-warning/10 border-warning/20'} flex items-center justify-center border`}>
              {isApproval ? (
                <HiCheckCircle className="w-12 h-12 text-success" />
              ) : (
                <HiRefresh className="w-12 h-12 text-warning animate-spin-slow" />
              )}
            </div>
            
            {/* Decorative Rings (CSS Pulse) */}
            <div className={`absolute inset-0 rounded-full border-2 ${isApproval ? 'border-success/30' : 'border-warning/30'} animate-ping opacity-20`} />
          </div>

          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
            {isApproval ? 'Post Aprovado!' : 'Ajustes Solicitados'}
          </h3>
          
          <p className="text-slate-400 text-sm mb-8 leading-relaxed px-4">
            O post <span className={`${isApproval ? 'text-success' : 'text-warning'} font-bold`}>"{postTitle}"</span> {isApproval ? 'foi movido para agendados com sucesso.' : 'foi enviado para a equipe de produção.'}
          </p>

          <button
            onClick={onClose}
            className={`w-full py-4 ${isApproval ? 'bg-success hover:bg-success/90 shadow-success/20' : 'bg-warning hover:bg-warning/90 shadow-warning/20'} text-dark-900 font-black rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 uppercase text-xs tracking-widest`}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
