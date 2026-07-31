import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import G3NewsCanvas from '../components/G3NewsCanvas';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { toast } from 'react-hot-toast';
import {
  HiOutlineNewspaper as IconNewspaper,
  HiOutlinePlus as IconPlus,
  HiOutlinePhotograph as IconPhoto,
  HiOutlineDocumentText as IconPdf,
  HiOutlineTrash as IconTrash,
  HiOutlinePencil as IconEdit,
  HiOutlineSparkles as IconSparkles,
  HiOutlineTrendingUp as IconTrending,
  HiOutlineShieldCheck as IconShield,
  HiOutlineEye as IconEye,
  HiOutlineDuplicate as IconDuplicate,
  HiOutlineClipboardList as IconPaste,
  HiOutlineRefresh as IconAutoSort,
  HiOutlineX as IconX
} from 'react-icons/hi';

const RAW_ITEMS_LIST = [
  // Novas Funções (🟢)
  { type: 'novidade', title: 'Produto Pronto: Adicionar cadastro de produtos prontos', description: '' },
  { type: 'novidade', title: 'G3Sync: adiciona configuração para importar promoções da Scanntech automaticamente', description: '' },
  { type: 'novidade', title: 'G3Hub: adiciona client de consulta de tributação saneada', description: '' },
  { type: 'novidade', title: 'G3Hub: adiciona AppService de consulta de tributação', description: '' },
  { type: 'novidade', title: 'G3Small: Relatorio Food Garcom, novo Relatorio de Vendas Food por Garcom com Produto', description: '' },
  { type: 'novidade', title: 'G3Small: Cadastro de Pessoa: Campos Receitas Óticas', description: '' },
  { type: 'novidade', title: 'G3Small: Produto campo Produto Especial', description: '' },
  { type: 'novidade', title: 'G3Small: G3Food - Cupons de Desconto', description: '' },

  // Melhorias (🔵)
  { type: 'melhoria', title: 'Produto Pronto: Atualizar estoque na entrada de produtos prontos', description: '' },
  { type: 'melhoria', title: 'PdvMiniVarejo: Parametro para Ativar/Desativar Arredondamento de Total de Produtos Pesados', description: '' },
  { type: 'melhoria', title: 'G3Sync: Sincronizar desconto Scanntech nos itens do pedido', description: '' },
  { type: 'melhoria', title: 'G3HubTributacao: aplica tributação saneada de acordo com a transação', description: '' },
  { type: 'melhoria', title: 'G3Small: PDVFood - Indica estoque acima da quantidade se habilitado', description: '' },
  { type: 'melhoria', title: 'G3Sync: sincronizacao multi empresas', description: '' },
  { type: 'melhoria', title: 'G3Small: confeitaria configuracao de tipos de pedidos por unidade', description: '' },
  { type: 'melhoria', title: 'G3Small: Nuvemshop permitir cancelar mesmo com erro na Nuvemshop', description: '' },
  { type: 'melhoria', title: 'G3Food: otimizacao de sincronizacao de grandes volumes', description: '' },
  { type: 'melhoria', title: 'G3Small: Pessoa - campo vender produto valor minimo', description: '' },
  { type: 'melhoria', title: 'G3Small: Pdv aplicar valor minimo de venda conforme pessoa habilitada', description: '' },
  { type: 'melhoria', title: 'G3Small: PdvFood - G3Food - impressao setor tracejado', description: '' },

  // Correções (🔴)
  { type: 'correcao', title: 'Tributacao: persiste campos de IBS e IS', description: '' },
  { type: 'correcao', title: 'G3HubTributacao: corrige atualização visual do checkbox após aplicar tributação', description: '' },
  { type: 'correcao', title: 'G3HubTributacao: carrega automaticamente os produtos quando há apenas um grupo', description: '' },
  { type: 'correcao', title: 'Devolução Troca: Corrigir saída de caixa ao selecionar retirada em dinheiro', description: '' },
  { type: 'correcao', title: 'G3Sync: sincronização de taxas de servico', description: '' },
  { type: 'correcao', title: 'G3Small: Nuvemshop validar pedido sendo recebido mesmo em caso de cancelamento', description: '' },
  { type: 'correcao', title: 'G3Small: Pdv validacao de limite de desconto quando informado diretamente no tipo do limite', description: '' },
  { type: 'correcao', title: 'G3HubTributacao: retorno de fallbacks IMendes da API - produtos não encontrados que ficaram para análise', description: '' }
];

// Helper to auto detect type from item title
function autoDetectType(title) {
  if (!title) return 'melhoria';
  const lower = title.toLowerCase();

  // Correções
  if (
    lower.includes('corrige') ||
    lower.includes('corrigir') ||
    lower.includes('correção') ||
    lower.includes('correcao') ||
    lower.includes('ajuste') ||
    lower.includes('bug') ||
    lower.includes('erro') ||
    lower.includes('persiste') ||
    lower.includes('fallbacks')
  ) {
    return 'correcao';
  }

  // Novidades / Recursos / Adições
  if (
    lower.includes('adicionar') ||
    lower.includes('adiciona') ||
    lower.includes('novo') ||
    lower.includes('nova') ||
    lower.includes('cadastro de') ||
    lower.includes('cupons de desconto') ||
    lower.includes('produto especial')
  ) {
    return 'novidade';
  }

  // Default to melhoria
  return 'melhoria';
}

// Helper to extract software name prefix
function extractSoftware(title) {
  if (!title) return '';
  const parts = title.split(':');
  return parts.length > 1 ? parts[0].trim().toUpperCase() : '';
}

// Helper to sort items by type order (Novidades -> Melhorias -> Correções) AND group by Software
function sortItemsByType(items) {
  const typePriority = { novidade: 1, adicao: 1, melhoria: 2, correcao: 3 };
  return [...items].sort((a, b) => {
    const typeDiff = (typePriority[a.type] || 2) - (typePriority[b.type] || 2);
    if (typeDiff !== 0) return typeDiff;

    const softA = extractSoftware(a.title);
    const softB = extractSoftware(b.title);
    return softA.localeCompare(softB);
  });
}

const INITIAL_BULLETINS = [
  {
    id: 'g3soft-all-updates',
    title: 'Atualizações dos Produtos G3soft',
    productName: 'Ecossistema G3soft',
    date: 'Julho / 2026',
    items: sortItemsByType(RAW_ITEMS_LIST),
    createdAt: new Date().toISOString()
  }
];

// Helper to split items into pages (8 items per page max to prevent any item from getting too close to bottom margin)
function chunkItemsIntoPages(items) {
  if (!items || items.length === 0) return [[]];
  const sorted = sortItemsByType(items);
  const pages = [];
  const PAGE_CAPACITY = 8;

  let remaining = [...sorted];
  while (remaining.length > 0) {
    pages.push(remaining.slice(0, PAGE_CAPACITY));
    remaining = remaining.slice(PAGE_CAPACITY);
  }

  return pages;
}

export default function G3News() {
  const { products } = useApp();
  const [bulletins, setBulletins] = useState(() => {
    const saved = localStorage.getItem('g3news_bulletins_v4');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_BULLETINS;
  });

  const [activeBulletinId, setActiveBulletinId] = useState(bulletins[0]?.id || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRawPasteOpen, setIsRawPasteOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  const pageRefs = useRef([]);

  // Save bulletins to localStorage
  useEffect(() => {
    localStorage.setItem('g3news_bulletins_v4', JSON.stringify(bulletins));
  }, [bulletins]);

  const activeBulletin = bulletins.find(b => b.id === activeBulletinId) || bulletins[0];
  const bulletinPages = chunkItemsIntoPages(activeBulletin.items || []);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    title: 'Informativo de Atualizações',
    productName: 'Ecossistema G3soft',
    date: 'Julho / 2026',
    items: []
  });

  const handleOpenNew = () => {
    setFormData({
      id: Date.now().toString(),
      title: 'Informativo de Atualizações',
      productName: 'Ecossistema G3soft',
      date: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      items: sortItemsByType(RAW_ITEMS_LIST)
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bulletin) => {
    setFormData(JSON.parse(JSON.stringify(bulletin)));
    setIsModalOpen(true);
  };

  const handleDuplicate = (bulletin) => {
    const duplicated = {
      ...JSON.parse(JSON.stringify(bulletin)),
      id: Date.now().toString(),
      title: `${bulletin.title} (Cópia)`,
      createdAt: new Date().toISOString()
    };
    setBulletins([duplicated, ...bulletins]);
    setActiveBulletinId(duplicated.id);
    toast.success('Informativo duplicado!');
  };

  const handleDelete = (id) => {
    if (bulletins.length <= 1) {
      toast.error('Você deve ter pelo menos um informativo cadastrado.');
      return;
    }
    if (window.confirm('Excluir este boletim?')) {
      const updated = bulletins.filter(b => b.id !== id);
      setBulletins(updated);
      if (activeBulletinId === id) {
        setActiveBulletinId(updated[0].id);
      }
      toast.success('Boletim removido.');
    }
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    const sortedFormItems = sortItemsByType(formData.items);
    const updatedData = { ...formData, items: sortedFormItems };

    const existingIndex = bulletins.findIndex(b => b.id === formData.id);
    if (existingIndex >= 0) {
      const copy = [...bulletins];
      copy[existingIndex] = { ...updatedData, updatedAt: new Date().toISOString() };
      setBulletins(copy);
    } else {
      const newEntry = { ...updatedData, id: Date.now().toString(), createdAt: new Date().toISOString() };
      setBulletins([newEntry, ...bulletins]);
      setActiveBulletinId(newEntry.id);
    }

    setIsModalOpen(false);
    toast.success('Informativo categorizado e salvo com sucesso!');
  };

  const handleAutoCategorizeAll = () => {
    setFormData(prev => {
      const autoCategorized = prev.items.map(item => ({
        ...item,
        type: autoDetectType(item.title)
      }));
      const sorted = sortItemsByType(autoCategorized);
      return { ...prev, items: sorted };
    });
    toast.success('Todos os itens foram categorizados e reordenados automaticamente!');
  };

  const handleAddItem = (type) => {
    setFormData(prev => {
      const newItems = [
        ...prev.items,
        { type, title: '', description: '' }
      ];
      return { ...prev, items: sortItemsByType(newItems) };
    });
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      const newType = field === 'title' ? autoDetectType(value) : updated[index].type;
      updated[index] = { ...updated[index], [field]: value, type: newType };
      return { ...prev, items: updated };
    });
  };

  // Parser for raw pasted text (separates and auto-detects types)
  const handleParseRawText = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    let currentType = 'melhoria';
    const parsedItems = [];

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.startsWith('melhorias') || lower.startsWith('melhoria')) {
        currentType = 'melhoria';
        return;
      }
      if (lower.startsWith('correções') || lower.startsWith('correcoes') || lower.startsWith('correcao')) {
        currentType = 'correcao';
        return;
      }
      if (lower.startsWith('novas') || lower.startsWith('novidades') || lower.startsWith('adições')) {
        currentType = 'novidade';
        return;
      }

      const cleanTitle = line.replace(/^[•\-\*]\s*/, '');
      const detectedType = autoDetectType(cleanTitle) || currentType;

      parsedItems.push({
        type: detectedType,
        title: cleanTitle,
        description: ''
      });
    });

    if (parsedItems.length > 0) {
      setFormData(prev => ({
        ...prev,
        items: sortItemsByType([...prev.items, ...parsedItems])
      }));
      toast.success(`${parsedItems.length} itens importados e categorizados automaticamente!`);
      setRawText('');
      setIsRawPasteOpen(false);
    } else {
      toast.error('Nenhum item válido identificado.');
    }
  };

  // Export handlers
  const exportAsImage = async () => {
    if (!pageRefs.current || pageRefs.current.length === 0) return;
    setIsExporting(true);
    const toastId = toast.loading(`Gerando ${bulletinPages.length} imagem(ns) A4...`);

    try {
      for (let i = 0; i < bulletinPages.length; i++) {
        const pageEl = pageRefs.current[i];
        if (!pageEl) continue;

        const dataUrl = await toPng(pageEl, {
          cacheBust: true,
          pixelRatio: 2,
          width: 794,
          height: 1123
        });

        const link = document.createElement('a');
        link.download = `G3News_${activeBulletin.date ? activeBulletin.date.replace(/[^a-zA-Z0-9]/g, '_') : 'G3soft'}_Pagina_${i + 1}.png`;
        link.href = dataUrl;
        link.click();
      }

      toast.success(`${bulletinPages.length} imagem(ns) A4 baixada(s)!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar imagens.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!pageRefs.current || pageRefs.current.length === 0) return;
    setIsExporting(true);
    const toastId = toast.loading(`Gerando PDF A4 com ${bulletinPages.length} página(s)...`);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < bulletinPages.length; i++) {
        const pageEl = pageRefs.current[i];
        if (!pageEl) continue;

        const dataUrl = await toPng(pageEl, {
          cacheBust: true,
          pixelRatio: 2,
          width: 794,
          height: 1123
        });

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297);
      }

      pdf.save(`G3News_${activeBulletin.date ? activeBulletin.date.replace(/[^a-zA-Z0-9]/g, '_') : 'G3soft'}.pdf`);
      toast.success(`PDF A4 com ${bulletinPages.length} página(s) baixado!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-800 p-6 rounded-3xl border border-dark-600 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-2xl text-brand-500">
            <IconNewspaper className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-dark-50 tracking-tight flex items-center gap-2">
              G3News <span className="text-xs bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase">Auto-Categorizado A4</span>
            </h1>
            <p className="text-xs text-dark-300 font-medium mt-0.5">
              Organização automática de Novidades, Melhorias e Correções em boletins A4 multi-páginas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-2xl shadow-md transition-all active:scale-95"
          >
            <IconPlus className="w-4 h-4" />
            Novo Boletim
          </button>
        </div>
      </div>

      {/* Main Grid: Saved List + Live Multi-Page Canvas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Bulletins List */}
        <div className="lg:col-span-4 bg-dark-800 border border-dark-600 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-dark-600">
            <h3 className="text-xs font-extrabold text-dark-100 uppercase tracking-wider flex items-center gap-2">
              <IconEye className="w-4 h-4 text-brand-500" />
              Informativos Salvos ({bulletins.length})
            </h3>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {bulletins.map((b) => {
              const isActive = b.id === activeBulletinId;
              const novidadesCount = b.items?.filter(i => i.type === 'novidade' || i.type === 'adicao').length || 0;
              const melhoriasCount = b.items?.filter(i => i.type === 'melhoria').length || 0;
              const correcoesCount = b.items?.filter(i => i.type === 'correcao').length || 0;
              const numPages = chunkItemsIntoPages(b.items || []).length;

              return (
                <div
                  key={b.id}
                  onClick={() => setActiveBulletinId(b.id)}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-500/10 border-brand-500 text-dark-50 shadow-md'
                      : 'bg-dark-900/60 border-dark-600/60 text-dark-200 hover:bg-dark-700/80 hover:border-dark-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block text-[10px] font-black text-brand-400 uppercase tracking-widest bg-brand-500/20 px-2 py-0.5 rounded-md mb-1 border border-brand-500/30">
                        {b.date || 'Julho / 2026'}
                      </span>
                      <h4 className="text-sm font-bold text-dark-50 leading-tight">
                        {b.title || 'Informativo G3soft'}
                      </h4>
                      <p className="text-[10px] text-dark-300 font-semibold mt-1">
                        📄 {numPages} Página(s) A4
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(b); }}
                        className="p-1.5 rounded-lg text-dark-300 hover:text-brand-400 hover:bg-dark-600/50"
                        title="Editar"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicate(b); }}
                        className="p-1.5 rounded-lg text-dark-300 hover:text-sky-400 hover:bg-dark-600/50"
                        title="Duplicar"
                      >
                        <IconDuplicate className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                        className="p-1.5 rounded-lg text-dark-300 hover:text-rose-400 hover:bg-dark-600/50"
                        title="Excluir"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Badges count */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-dark-600/40 text-[10px] font-bold">
                    {novidadesCount > 0 && (
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        🟢 {novidadesCount} Funções
                      </span>
                    )}
                    {melhoriasCount > 0 && (
                      <span className="text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                        🔵 {melhoriasCount} Melhorias
                      </span>
                    )}
                    {correcoesCount > 0 && (
                      <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                        🔴 {correcoesCount} Correções
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Multi-Page Canvas Preview */}
        <div className="lg:col-span-8 bg-dark-800 border border-dark-600 rounded-3xl p-6 space-y-6 shadow-xl flex flex-col items-center">
          {/* Action Bar */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-dark-600">
            <div>
              <span className="text-[11px] font-bold text-dark-400 uppercase tracking-widest">Informativo Selecionado</span>
              <h2 className="text-lg font-black text-dark-50">
                {activeBulletin.title} ({activeBulletin.date}) — <span className="text-brand-400 font-extrabold">{bulletinPages.length} Página(s)</span>
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleOpenEdit(activeBulletin)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-dark-700 hover:bg-dark-600 text-dark-100 text-xs font-bold rounded-xl border border-dark-500 transition-colors"
              >
                <IconEdit className="w-4 h-4 text-brand-400" />
                Editar
              </button>

              <button
                onClick={exportAsImage}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <IconPhoto className="w-4 h-4" />
                Baixar PNG ({bulletinPages.length} pág)
              </button>

              <button
                onClick={exportAsPDF}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <IconPdf className="w-4 h-4" />
                Baixar PDF ({bulletinPages.length} pág)
              </button>
            </div>
          </div>

          {/* Render All Pages Sequentially */}
          <div className="w-full flex flex-col items-center gap-8 overflow-x-auto p-6 bg-dark-900/80 rounded-2xl border border-dark-700 max-h-[85vh] overflow-y-auto custom-scrollbar">
            {bulletinPages.map((pageItems, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="text-xs font-extrabold text-dark-300 uppercase tracking-widest bg-dark-800 border border-dark-600 px-3 py-1 rounded-full">
                  Página {idx + 1} de {bulletinPages.length}
                </div>
                <div className="transform scale-[0.60] sm:scale-[0.70] md:scale-[0.78] origin-top my-0 shadow-2xl rounded-lg">
                  <G3NewsCanvas
                    ref={(el) => (pageRefs.current[idx] = el)}
                    newsData={activeBulletin}
                    pageIndex={idx}
                    totalPages={bulletinPages.length}
                    pageItems={pageItems}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EDIT / CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-800 border border-dark-600 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-dark-600 flex items-center justify-between bg-dark-800">
              <h3 className="text-base font-black text-dark-50 flex items-center gap-2 uppercase tracking-wide">
                <IconNewspaper className="w-5 h-5 text-brand-500" />
                {formData.id ? 'Editar Informativo G3News' : 'Novo Informativo G3News'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-dark-300 hover:text-dark-50 hover:bg-dark-700 transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-dark-200 uppercase tracking-wider mb-1.5">
                    Título do Informativo
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Atualizações dos Produtos G3soft"
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-3.5 py-2.5 text-xs text-dark-50 font-semibold focus:border-brand-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Date / Month */}
                <div>
                  <label className="block text-xs font-bold text-dark-200 uppercase tracking-wider mb-1.5">
                    Período / Mês
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="Ex: Julho / 2026"
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-3.5 py-2.5 text-xs text-dark-50 font-semibold focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Section Header */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark-600 pb-2">
                  <span className="text-xs font-black text-dark-100 uppercase tracking-wider">
                    Itens ({formData.items.length}) — <span className="text-brand-400 font-extrabold">{chunkItemsIntoPages(formData.items).length} Pág(s)</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoCategorizeAll}
                      className="px-3 py-1 bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 border border-brand-500/40 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      title="Categorizar e organizar itens por tipo de forma automática"
                    >
                      <IconAutoSort className="w-3.5 h-3.5" /> Organizar Automático
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRawPasteOpen(!isRawPasteOpen)}
                      className="px-3 py-1 bg-dark-700 text-dark-200 hover:bg-dark-600 border border-dark-500 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <IconPaste className="w-3.5 h-3.5" /> Colar Texto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('novidade')}
                      className="px-2 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <IconSparkles className="w-3.5 h-3.5" /> + Novidade
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('melhoria')}
                      className="px-2 py-1 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <IconTrending className="w-3.5 h-3.5" /> + Melhoria
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('correcao')}
                      className="px-2 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <IconShield className="w-3.5 h-3.5" /> + Correção
                    </button>
                  </div>
                </div>

                {/* Raw Paste Textarea Box */}
                {isRawPasteOpen && (
                  <div className="p-4 bg-dark-900 border border-brand-500/40 rounded-2xl space-y-2 animate-fade-in">
                    <p className="text-[11px] text-dark-300 font-medium">
                      Cole a lista de melhorias, correções e novidades em texto bruto. O sistema irá categorizar automaticamente cada item:
                    </p>
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder={`Produto Pronto: Adicionar cadastro de produtos...\nG3HubTributacao: corrige atualização visual...\nPdvMiniVarejo: Parametro para Ativar...`}
                      rows={6}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl p-3 text-xs text-dark-100 font-mono focus:border-brand-500 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRawPasteOpen(false)}
                        className="px-3 py-1.5 text-xs text-dark-300 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleParseRawText}
                        className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        Processar e Categorizar
                      </button>
                    </div>
                  </div>
                )}

                {/* Item List */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-dark-900 border border-dark-700 rounded-2xl flex items-center gap-3"
                    >
                      <select
                        value={item.type}
                        onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                        className={`text-xs font-extrabold border rounded-lg px-2.5 py-1 focus:outline-none flex-shrink-0 ${
                          item.type === 'novidade' || item.type === 'adicao'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : item.type === 'correcao'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        }`}
                      >
                        <option value="novidade" className="bg-dark-800 text-dark-50">🟢 Novidade / Função</option>
                        <option value="melhoria" className="bg-dark-800 text-dark-50">🔵 Melhoria</option>
                        <option value="correcao" className="bg-dark-800 text-dark-50">🔴 Correção de Bug</option>
                      </select>

                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                        placeholder="Ex: G3Small: Cadastro de Pessoa..."
                        className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 text-xs text-dark-50 font-semibold focus:border-brand-500 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-dark-400 hover:text-rose-400 p-1 flex-shrink-0"
                        title="Remover Item"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {formData.items.length === 0 && (
                    <p className="text-center text-xs text-dark-400 py-6 italic">
                      Nenhum item na lista. Use o botão "Colar Texto" ou adicione manualmente.
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-dark-600 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  Organizar e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
