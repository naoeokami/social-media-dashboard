import React, { forwardRef } from 'react';
import g3newsBg from '../assets/g3news.jpg';
import { HiOutlineSparkles, HiOutlineTrendingUp, HiOutlineShieldCheck, HiOutlineCheckCircle } from 'react-icons/hi';

const G3NewsCanvas = forwardRef(({ newsData, pageIndex = 0, totalPages = 1, pageItems = [] }, ref) => {
  const {
    title = 'Informativo de Atualizações',
    date = 'Julho / 2026'
  } = newsData || {};

  const itemsToRender = pageItems && pageItems.length > 0 ? pageItems : (newsData?.items || []);

  const novidades = itemsToRender.filter(item => item.type === 'novidade' || item.type === 'adicao');
  const melhorias = itemsToRender.filter(item => item.type === 'melhoria');
  const correcoes = itemsToRender.filter(item => item.type === 'correcao');

  // Global item counter for the page to apply dynamic width (top items = w-full, bottom items = max-w-[470px])
  let globalItemIndex = 0;

  // Utility to parse software prefix if present (e.g. "G3Small: Cadastro..." -> badge "G3Small")
  const renderItemTitle = (itemTitle) => {
    if (!itemTitle) return null;
    const parts = itemTitle.split(':');
    if (parts.length > 1 && parts[0].trim().length <= 20) {
      const softwareName = parts[0].trim();
      const rest = parts.slice(1).join(':').trim();
      return (
        <span className="leading-snug">
          <span className="inline-block bg-dark-800 text-brand-400 font-extrabold text-xs uppercase px-2 py-0.5 rounded-md mr-2 border border-dark-600">
            {softwareName}
          </span>
          <span className="text-gray-800 font-medium text-xs sm:text-sm">{rest}</span>
        </span>
      );
    }
    return <span className="text-gray-800 font-medium text-xs sm:text-sm leading-snug">{itemTitle}</span>;
  };

  const renderCard = (item, idx, dotColorClass, borderColorClass) => {
    const itemPos = globalItemIndex++;
    // Items 0..6 (top and middle of page) take full width w-full to fill right space.
    // Items 7+ (bottom near triangle icon) take max-w-[470px] to clear warning icon.
    const widthClass = itemPos < 7 ? 'w-full' : 'max-w-[470px]';

    return (
      <div key={idx} className={`flex items-start gap-2.5 bg-white p-2.5 rounded-xl border ${borderColorClass} shadow-xs ${widthClass}`}>
        <span className={`w-2 h-2 rounded-full ${dotColorClass} mt-1.5 flex-shrink-0`} />
        <div className="flex-1">
          {renderItemTitle(item.title)}
          {item.description && (
            <p className="text-xs text-gray-500 font-normal leading-tight mt-1">{item.description}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className="relative bg-white text-dark-900 shadow-2xl overflow-hidden font-sans select-none"
      style={{
        width: '794px',
        height: '1123px', // Proporção A4 (210mm x 297mm @ 96dpi)
        minWidth: '794px',
        minHeight: '1123px',
        maxWidth: '794px',
        maxHeight: '1123px'
      }}
    >
      {/* Background Image (g3news.jpg) */}
      <img
        src={g3newsBg}
        alt="G3News Template Fundo"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      />

      {/* Top Right Page Indicator Badge */}
      {totalPages > 1 && (
        <div className="absolute top-7 right-10 z-20 bg-dark-800 text-brand-400 border border-dark-600 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
          Página {pageIndex + 1} de {totalPages}
        </div>
      )}

      {/* Dynamic Content Overlay */}
      {/* Top Padding: 235px (Abaixo do título 'Novidades sobre os produtos G3soft!') */}
      {/* Bottom Padding: 125px (Acima da faixa laranja do rodapé) */}
      <div className="relative z-10 pt-[235px] pb-[125px] px-12 flex flex-col h-full justify-between">
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b-2 border-brand-500/20 pb-3">
            <div>
              <span className="inline-block bg-brand-500 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm mb-1">
                G3soft Multi-Software
              </span>
              <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mt-1">
                {title}
              </h2>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Período / Mês</div>
              <div className="text-sm font-black text-brand-600">
                {date || 'Atualizações Recentes'}
              </div>
            </div>
          </div>

          {/* Categorized Items List */}
          <div className="space-y-4 pt-1">
            {/* 🟢 NOVAS FUNÇÕES */}
            {novidades.length > 0 && (
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-black text-sm uppercase tracking-wide border-b border-emerald-200/60 pb-1.5">
                  <span className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-sm">
                    <HiOutlineSparkles className="w-4 h-4" />
                  </span>
                  Novas Funções & Recursos ({novidades.length})
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {novidades.map((item, idx) => renderCard(item, idx, 'bg-emerald-500', 'border-emerald-200/80'))}
                </div>
              </div>
            )}

            {/* 🔵 MELHORIAS */}
            {melhorias.length > 0 && (
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2 text-sky-700 font-black text-sm uppercase tracking-wide border-b border-sky-200/60 pb-1.5">
                  <span className="p-1.5 bg-sky-500 text-white rounded-lg shadow-sm">
                    <HiOutlineTrendingUp className="w-4 h-4" />
                  </span>
                  Melhorias nos Softwares ({melhorias.length})
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {melhorias.map((item, idx) => renderCard(item, idx, 'bg-sky-500', 'border-sky-200/80'))}
                </div>
              </div>
            )}

            {/* 🔴 CORREÇÕES */}
            {correcoes.length > 0 && (
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2 text-rose-700 font-black text-sm uppercase tracking-wide border-b border-rose-200/60 pb-1.5">
                  <span className="p-1.5 bg-rose-500 text-white rounded-lg shadow-sm">
                    <HiOutlineShieldCheck className="w-4 h-4" />
                  </span>
                  Correções de Erros ({correcoes.length})
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {correcoes.map((item, idx) => renderCard(item, idx, 'bg-rose-500', 'border-rose-200/80'))}
                </div>
              </div>
            )}

            {itemsToRender.length === 0 && (
              <div className="text-center py-16 bg-gray-50/60 border border-dashed border-gray-300 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Nenhum item nesta página</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note Overlay */}
        {/* CRITICAL: w-[470px] max-w-[470px] garante que a linha divisória (border-t) JAMAIS passe por cima do ícone de aviso */}
        <div className="w-[470px] max-w-[470px] pt-3 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="truncate">Informativo oficial dos produtos G3soft</span>
          </div>
          <span className="font-extrabold text-brand-600 flex-shrink-0">g3soft.com.br</span>
        </div>
      </div>
    </div>
  );
});

export default G3NewsCanvas;
