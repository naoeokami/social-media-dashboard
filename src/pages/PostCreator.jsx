import { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  HiOutlineSparkles, 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineDownload, 
  HiOutlineChevronLeft, 
  HiOutlineChevronRight,
  HiOutlinePhotograph,
  HiOutlineClipboardCopy,
  HiOutlineTemplate,
  HiOutlineEye,
  HiOutlineUpload,
  HiOutlineArrowsExpand,
  HiOutlineDeviceTablet,
  HiOutlineDocumentText
} from 'react-icons/hi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toPng } from 'html-to-image';
import { toast } from 'react-hot-toast';

const gradientPresets = [
  { name: 'G3 Laranja', start: '#ea580c', end: '#f97316' },
  { name: 'Encerramento Roxo', start: '#090514', end: '#2e1065' },
  { name: 'Deep Space', start: '#020617', end: '#1e1b4b' },
  { name: 'Sunset Glow', start: '#451a03', end: '#0f172a' },
  { name: 'Cyberpunk', start: '#030712', end: '#500747' },
  { name: 'Clean White', start: '#ffffff', end: '#e2e8f0' },
  { name: 'Midnight', start: '#000000', end: '#171717' },
];

const postFormats = [
  { id: 'square', name: 'Quadrado (1:1 - Feed)', aspect: 'aspect-square', width: 1080, height: 1080, previewWidth: 'max-w-[460px]' },
  { id: 'portrait', name: 'Retrato (4:5 - Feed)', aspect: 'aspect-[4/5]', width: 1080, height: 1350, previewWidth: 'max-w-[400px]' },
  { id: 'story', name: 'Story / Reels (9:16)', aspect: 'aspect-[9/16]', width: 1080, height: 1920, previewWidth: 'max-w-[320px]' },
];

export default function PostCreator() {
  const { segments, products } = useApp();
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  // Tabs navigation
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'design' | 'ai'

  // AI settings
  const [provider] = useState(() => localStorage.getItem('@g3_agent_provider') || 'gemini');
  const [geminiModel] = useState(() => localStorage.getItem('@g3_agent_gemini_model') || 'gemini-2.5-flash');
  const [openRouterModel] = useState(() => localStorage.getItem('@g3_agent_openrouter_model') || 'google/gemini-2.5-flash');
  const [customGeminiKey] = useState(() => localStorage.getItem('@g3_agent_custom_gemini_key') || '');
  const [customOpenRouterKey] = useState(() => localStorage.getItem('@g3_agent_custom_openrouter_key') || '');

  // Post State
  const [activeSlide, setActiveSlide] = useState(0);
  const [caption, setCaption] = useState('Texto de legenda do post com hashtags...');
  const [postFormat, setPostFormat] = useState('square');
  const [slides, setSlides] = useState([
    {
      title: 'Gargalo no Caixa da [Conveniência]?',
      subtitle: 'Use um sistema que organiza comandas, acelera o caixa e aumenta suas vendas',
      cta: 'Manda JULHO — preparamos o próximo mês juntos',
      imagePrompt: 'white receipt paper, bar code, glowing tech lines orange',
      imageUrl: '',
      showImage: true,
      // Mockup type: 'laptop' | 'phone' | 'raw'
      mockupType: 'laptop',
      // Colors
      customBgStart: '#ea580c',
      customBgEnd: '#f97316',
      customTextColor: '#ffffff',
      customCtaBg: '#ffffff',
      customCtaTextColor: '#ea580c',
      customLogoColor: '#ffffff',
      // Comparison layout lists
      comparisonSem: ['Dados espalhados em planilhas', 'Alto índice de retrabalho manual', 'Vulnerabilidade e perda de histórico'],
      comparisonCom: ['Mobilidade corporativa', 'Conciliação financeira ágil', 'Departamentos 100% integrados', 'Segurança de dados'],
      // Layout
      layout: 'g3-split-card', // 'centered' | 'left-aligned' | 'split-top-image' | 'split-bottom-image' | 'custom' | 'g3-split-card' | 'g3-waves-badge' | 'g3-comparison'
      // Percentage coordinates for custom dragging
      positions: {
        logo: { x: 50, y: 15 },
        title: { x: 50, y: 42 },
        subtitle: { x: 50, y: 62 },
        cta: { x: 50, y: 83 }
      }
    }
  ]);

  // AI & Parsing UI states
  const [aiPrompt, setAiPrompt] = useState('');
  const [rawText, setRawText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isParsingText, setIsParsingText] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);

  // Dragging states
  const [draggingElement, setDraggingElement] = useState(null);

  // Pollinations AI generator
  const getPollinationsUrl = (prompt) => {
    if (!prompt) return '';
    const cleanPrompt = encodeURIComponent(prompt.trim());
    return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
  };

  const handleGenerateImage = (index) => {
    const prompt = slides[index].imagePrompt;
    if (!prompt) {
      toast.error('Escreva uma descrição de imagem antes de gerar.');
      return;
    }
    const url = getPollinationsUrl(prompt);
    updateSlideField(index, 'imageUrl', url);
    updateSlideField(index, 'showImage', true);
    toast.success('Gerando fundo de imagem via Pollinations... (Carregando no preview)');
  };

  const updateSlideField = (index, field, value) => {
    setSlides(prev => prev.map((slide, i) => i === index ? { ...slide, [field]: value } : slide));
  };

  const updateSlidePosition = (index, element, coords) => {
    setSlides(prev => prev.map((slide, i) => {
      if (i === index) {
        return {
          ...slide,
          positions: {
            ...slide.positions,
            [element]: coords
          }
        };
      }
      return slide;
    }));
  };

  const addNewSlide = () => {
    const lastSlide = slides[slides.length - 1] || {};
    setSlides(prev => [
      ...prev,
      {
        title: 'Título do Novo Slide',
        subtitle: 'Subtítulo ou descrição curta',
        cta: lastSlide.cta || 'Saiba Mais',
        imagePrompt: 'abstract technology, smooth gradient, 3d object',
        imageUrl: '',
        showImage: lastSlide.showImage !== undefined ? lastSlide.showImage : true,
        mockupType: lastSlide.mockupType || 'laptop',
        customBgStart: lastSlide.customBgStart || '#ea580c',
        customBgEnd: lastSlide.customBgEnd || '#f97316',
        customTextColor: lastSlide.customTextColor || '#ffffff',
        customCtaBg: lastSlide.customCtaBg || '#ffffff',
        customCtaTextColor: lastSlide.customCtaTextColor || '#ea580c',
        customLogoColor: lastSlide.customLogoColor || '#ffffff',
        comparisonSem: lastSlide.comparisonSem ? [...lastSlide.comparisonSem] : ['Item sem sistema 1', 'Item sem sistema 2'],
        comparisonCom: lastSlide.comparisonCom ? [...lastSlide.comparisonCom] : ['Benefício com sistema 1', 'Benefício com sistema 2'],
        layout: lastSlide.layout || 'g3-split-card',
        positions: lastSlide.positions ? JSON.parse(JSON.stringify(lastSlide.positions)) : {
          logo: { x: 50, y: 15 },
          title: { x: 50, y: 42 },
          subtitle: { x: 50, y: 62 },
          cta: { x: 50, y: 83 }
        }
      }
    ]);
    setActiveSlide(slides.length);
  };

  const deleteSlide = (index) => {
    if (slides.length <= 1) {
      toast.error('O post precisa ter no menos 1 slide.');
      return;
    }
    setSlides(prev => prev.filter((_, i) => i !== index));
    setActiveSlide(prev => Math.max(0, prev - 1));
  };

  // Local Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      updateSlideField(activeSlide, 'imageUrl', dataUrl);
      updateSlideField(activeSlide, 'showImage', true);
      toast.success('Imagem carregada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Drag and Drop pointer handlers
  const handlePointerDown = (e, element) => {
    if (slides[activeSlide]?.layout !== 'custom') return;
    e.preventDefault();
    setDraggingElement(element);
  };

  const handlePointerMove = (e) => {
    if (!draggingElement || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = Math.max(0, Math.min(100, Math.round(x)));
    y = Math.max(0, Math.min(100, Math.round(y)));
    updateSlidePosition(activeSlide, draggingElement, { x, y });
  };

  const handlePointerUp = () => {
    setDraggingElement(null);
  };

  // LLM AI generation
  const callLlmForSlides = async (userInput, isRawTextParsing) => {
    try {
      const activeProductsStr = products.map(p => `- ${p.name} (Segmento: ${p.segment || 'Geral'})`).join('\n');
      const activeSegmentsStr = segments.map(s => `- ${s.name}`).join('\n');

      const systemPrompt = `Você é um Designer e Copywriter de Social Media altamente criativo, focado na marca G3Soft / G3Small.
Sua tarefa é gerar a estrutura completa de um post em formato carrossel ou estático baseado na solicitação do usuário.
Você deve responder estritamente com um objeto JSON válido, sem blocos de código markdown desnecessários (como \`\`\`json ... \`\`\`), apenas o JSON puro para que possamos parsear diretamente.

Estrutura do JSON esperada:
{
  "caption": "Legenda completa do post otimizada para engajamento e com hashtags estratégicas.",
  "slides": [
    {
      "title": "Título marcante do slide 1. Use colchetes para destacar palavras que devem virar um crachá de destaque (ex: 'Gargalo no Caixa da [Conveniência]?').",
      "subtitle": "Subtítulo curto com dados ou benefício do slide 1",
      "cta": "Chamada para ação curta (opcional)",
      "imagePrompt": "Prompt em inglês detalhado para gerador de imagens conceituais (ex: 'laptop device on office desk, minimalist orange theme')",
      "mockupType": "laptop",
      "showImage": true,
      "customBgStart": "#ea580c",
      "customBgEnd": "#f97316",
      "customTextColor": "#ffffff",
      "customCtaBg": "#ffffff",
      "customCtaTextColor": "#ea580c",
      "customLogoColor": "#ffffff",
      "comparisonSem": ["Problema 1 sem o sistema", "Problema 2 sem o sistema"],
      "comparisonCom": ["Solução 1 com o sistema", "Solução 2 com o sistema"],
      "layout": "g3-split-card"
    }
  ]
}

Selecione cores em Hexadecimal adequadas para a paleta nas propriedades (o padrão da G3 é Laranja como #ea580c / #f97316, mas ajuste se necessário).
Opções de "mockupType": "laptop", "phone", "raw".
Opções de "layout": "g3-split-card", "g3-waves-badge", "g3-comparison", "centered", "left-aligned", "custom".

Contexto do negócio do usuário:
Produtos:
${activeProductsStr || 'Nenhum produto específico.'}
Segmentos de atuação:
${activeSegmentsStr || 'Nenhum segmento específico.'}

Entrada do usuário: "${userInput}"`;

      let responseText = '';
      if (provider === 'gemini') {
        const apiKey = customGeminiKey || import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('Chave API do Gemini não configurada!');
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: geminiModel });
        const result = await model.generateContent(systemPrompt);
        responseText = result.response.text();
      } else {
        const apiKey = customOpenRouterKey || import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!apiKey) throw new Error('Chave API do OpenRouter não configurada!');

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: openRouterModel,
            messages: [{ role: 'user', content: systemPrompt }],
            temperature: 0.7
          })
        });

        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content;
      }

      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.caption) setCaption(parsed.caption);
      if (parsed.slides && Array.isArray(parsed.slides)) {
        const hydratedSlides = parsed.slides.map(slide => {
          const imgUrl = slide.imagePrompt ? getPollinationsUrl(slide.imagePrompt) : '';
          return {
            title: slide.title || 'Título',
            subtitle: slide.subtitle || 'Subtítulo',
            cta: slide.cta || '',
            imagePrompt: slide.imagePrompt || 'neon line abstract',
            imageUrl: imgUrl,
            showImage: slide.showImage !== undefined ? slide.showImage : true,
            mockupType: slide.mockupType || 'laptop',
            customBgStart: slide.customBgStart || '#ea580c',
            customBgEnd: slide.customBgEnd || '#f97316',
            customTextColor: slide.customTextColor || '#ffffff',
            customCtaBg: slide.customCtaBg || '#ffffff',
            customCtaTextColor: slide.customCtaTextColor || '#ea580c',
            customLogoColor: slide.customLogoColor || '#ffffff',
            comparisonSem: slide.comparisonSem || [],
            comparisonCom: slide.comparisonCom || [],
            layout: slide.layout || 'g3-split-card',
            positions: {
              logo: { x: 50, y: 15 },
              title: { x: 50, y: 42 },
              subtitle: { x: 50, y: 62 },
              cta: { x: 50, y: 83 }
            }
          };
        });
        setSlides(hydratedSlides);
        setActiveSlide(0);
        toast.success(isRawTextParsing ? 'Texto transformado em slides!' : 'Post gerado com sucesso!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar via IA: ' + err.message);
    } finally {
      setIsGenerating(false);
      setIsParsingText(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Por favor, descreva o tema.');
      return;
    }
    setIsGenerating(true);
    await callLlmForSlides(aiPrompt, false);
  };

  const handleParseRawText = async () => {
    if (!rawText.trim()) {
      toast.error('Por favor, insira o texto.');
      return;
    }
    setIsParsingText(true);
    await callLlmForSlides(rawText, true);
  };

  const handleDownloadActiveSlide = async () => {
    if (!previewRef.current) return;
    setIsSavingImage(true);

    const activeFormat = postFormats.find(f => f.id === postFormat) || postFormats[0];

    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        width: activeFormat.width,
        height: activeFormat.height,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${activeFormat.width}px`,
          height: `${activeFormat.height}px`,
        }
      });

      const link = document.createElement('a');
      link.download = `slide-${activeSlide + 1}-${postFormat}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Imagem exportada com sucesso!');
    } catch (error) {
      console.error('Falha ao exportar imagem:', error);
      toast.error('Erro ao exportar.');
    } finally {
      setIsSavingImage(false);
    }
  };

  // Helper to highlight bracketed words in titles
  const renderHighlightedTitle = (titleText, textColor) => {
    if (!titleText) return '';
    const parts = titleText.split(/\[(.*?)\]/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <span 
            key={i} 
            className="bg-white px-3 py-1 rounded-xl font-black inline-block shadow-md mx-1 transform rotate-[-1deg]"
            style={{ color: slides[activeSlide]?.customCtaTextColor || '#ea580c' }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const activeFormatObj = postFormats.find(f => f.id === postFormat) || postFormats[0];
  const activeSlideObj = slides[activeSlide] || {};

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-dark-800 border border-brand-500/30 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <HiOutlineTemplate className="w-7 h-7 text-brand-500" />
            Criador de Posts G3 Premium
          </h1>
          <p className="text-sm text-dark-300 mt-1">
            Gere designs corporativos de carrossel no padrão G3Soft com Live Preview avançado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Format size selector */}
          <div className="p-4 bg-dark-800/80 backdrop-blur-xl border border-dark-600/50 rounded-2xl shadow-lg">
            <label className="block text-[11px] font-bold text-dark-300 uppercase tracking-wider mb-2">Formato da Imagem</label>
            <div className="grid grid-cols-3 gap-2">
              {postFormats.map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => setPostFormat(fmt.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all truncate ${
                    postFormat === fmt.id
                      ? 'border-brand-500 bg-brand-500/15 text-white'
                      : 'border-dark-600/50 bg-dark-700/30 text-dark-300 hover:text-white'
                  }`}
                >
                  {fmt.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Control Tabs */}
          <div className="flex bg-dark-850 p-1.5 rounded-xl border border-dark-600/30">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'content' ? 'bg-dark-700 text-white shadow' : 'text-dark-300 hover:text-white'
              }`}
            >
              <HiOutlineDocumentText className="w-4 h-4" /> Conteúdo
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'design' ? 'bg-dark-700 text-white shadow' : 'text-dark-300 hover:text-white'
              }`}
            >
              <HiOutlineTemplate className="w-4 h-4" /> Design e Cores
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ai' ? 'bg-dark-700 text-white shadow' : 'text-dark-300 hover:text-white'
              }`}
            >
              <HiOutlineSparkles className="w-4 h-4" /> Geração IA
            </button>
          </div>

          {/* Tab Content Box */}
          <div className="p-6 bg-dark-800/80 backdrop-blur-xl border border-dark-600/50 rounded-2xl shadow-xl">
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-dark-600/30 pb-3">
                  <h3 className="font-bold text-white text-sm">Editor de Slide ({activeSlide + 1} de {slides.length})</h3>
                  <div className="flex gap-1.5">
                    <button
                      onClick={addNewSlide}
                      className="px-2.5 py-1.5 bg-brand-500/20 hover:bg-brand-500/35 text-brand-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <HiOutlinePlus className="w-3.5 h-3.5" /> Slide
                    </button>
                    <button
                      onClick={() => deleteSlide(activeSlide)}
                      className="px-2 py-1.5 bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 text-red-400 rounded-lg text-xs transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Slides selector row */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeSlide === idx 
                          ? 'bg-brand-500 text-white'
                          : 'bg-dark-700/55 text-dark-300 hover:text-white'
                      }`}
                    >
                      S{idx + 1}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                    Título Principal
                  </label>
                  <input
                    type="text"
                    value={activeSlideObj.title || ''}
                    onChange={e => updateSlideField(activeSlide, 'title', e.target.value)}
                    placeholder="Use [destaque] para palavras grifadas em branco"
                    className="w-full px-4 py-2.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Subtítulo / Descrição</label>
                  <textarea
                    value={activeSlideObj.subtitle || ''}
                    onChange={e => updateSlideField(activeSlide, 'subtitle', e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500/50 transition-all h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Texto do Botão (CTA)</label>
                  <input
                    type="text"
                    value={activeSlideObj.cta || ''}
                    onChange={e => updateSlideField(activeSlide, 'cta', e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-sm focus:outline-none"
                  />
                </div>

                {/* Comparison Lists input if layout is comparison */}
                {activeSlideObj.layout === 'g3-comparison' && (
                  <div className="space-y-4 border-t border-dark-600/30 pt-4">
                    <h4 className="font-bold text-xs text-brand-400 uppercase tracking-wider">Itens de Comparação</h4>
                    <div>
                      <label className="block text-[10px] font-semibold text-dark-400 mb-1">Coluna "SEM" (Lista de Dores, separada por linhas)</label>
                      <textarea
                        value={activeSlideObj.comparisonSem?.join('\n') || ''}
                        onChange={e => updateSlideField(activeSlide, 'comparisonSem', e.target.value.split('\n'))}
                        className="w-full px-4 py-2 bg-dark-700/30 border border-dark-600/50 rounded-xl text-xs text-white h-20 resize-none focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-dark-400 mb-1">Coluna "COM" (Lista de Benefícios, separada por linhas)</label>
                      <textarea
                        value={activeSlideObj.comparisonCom?.join('\n') || ''}
                        onChange={e => updateSlideField(activeSlide, 'comparisonCom', e.target.value.split('\n'))}
                        className="w-full px-4 py-2 bg-dark-700/30 border border-dark-600/50 rounded-xl text-xs text-white h-20 resize-none focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'design' && (
              <div className="space-y-5">
                {/* Layout Preset selector */}
                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2.5">Modelo de Layout</label>
                  <select
                    value={activeSlideObj.layout || 'g3-split-card'}
                    onChange={e => updateSlideField(activeSlide, 'layout', e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500/50 transition-all cursor-pointer"
                  >
                    <option value="g3-split-card">Split Laranja/Branco Card (Padrão G3)</option>
                    <option value="g3-waves-badge">Fundo Ondas e Crachá de Destaque</option>
                    <option value="g3-comparison">Comparação Sem vs Com (Vertical Split)</option>
                    <option value="centered">Texto Centralizado Padrão</option>
                    <option value="left-aligned">Alinhado à Esquerda</option>
                    <option value="custom">Posicionamento Livre (Arrastar com Mouse)</option>
                  </select>
                </div>

                {/* Show/Hide Image Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2.5">Modo de Exibição</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateSlideField(activeSlide, 'showImage', true)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        activeSlideObj.showImage !== false
                          ? 'border-brand-500 bg-brand-500/10 text-white'
                          : 'border-dark-600/50 bg-dark-700/30 text-dark-300 hover:text-white'
                      }`}
                    >
                      Com Imagem / Mockup
                    </button>
                    <button
                      onClick={() => updateSlideField(activeSlide, 'showImage', false)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        activeSlideObj.showImage === false
                          ? 'border-brand-500 bg-brand-500/10 text-white'
                          : 'border-dark-600/50 bg-dark-700/30 text-dark-300 hover:text-white'
                      }`}
                    >
                      Sem Imagem (Apenas Texto)
                    </button>
                  </div>
                </div>

                {/* Mockup Frame selector */}
                {activeSlideObj.showImage !== false && (
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2.5">Moldura da Imagem (Mockup)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'laptop', name: 'Notebook' },
                        { id: 'phone', name: 'Celular' },
                        { id: 'raw', name: 'Imagem Pura' }
                      ].map(mock => (
                        <button
                          key={mock.id}
                          onClick={() => updateSlideField(activeSlide, 'mockupType', mock.id)}
                          className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                            activeSlideObj.mockupType === mock.id
                              ? 'border-brand-500 bg-brand-500/10 text-white'
                              : 'border-dark-600/50 bg-dark-700/30 text-dark-300 hover:text-white'
                          }`}
                        >
                          {mock.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Customization */}
                <div className="border-t border-dark-600/30 pt-4 space-y-3">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Cores Customizadas</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-dark-400 mb-1">Gradiente Início</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={activeSlideObj.customBgStart || '#ea580c'}
                          onChange={e => updateSlideField(activeSlide, 'customBgStart', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeSlideObj.customBgStart || ''}
                          onChange={e => updateSlideField(activeSlide, 'customBgStart', e.target.value)}
                          className="w-full px-2 py-1 bg-dark-700/30 border border-dark-600/50 rounded text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-dark-400 mb-1">Gradiente Fim</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={activeSlideObj.customBgEnd || '#f97316'}
                          onChange={e => updateSlideField(activeSlide, 'customBgEnd', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeSlideObj.customBgEnd || ''}
                          onChange={e => updateSlideField(activeSlide, 'customBgEnd', e.target.value)}
                          className="w-full px-2 py-1 bg-dark-700/30 border border-dark-600/50 rounded text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-dark-400 mb-1">Cor do Texto</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={activeSlideObj.customTextColor || '#ffffff'}
                          onChange={e => updateSlideField(activeSlide, 'customTextColor', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeSlideObj.customTextColor || ''}
                          onChange={e => updateSlideField(activeSlide, 'customTextColor', e.target.value)}
                          className="w-full px-2 py-1 bg-dark-700/30 border border-dark-600/50 rounded text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-dark-400 mb-1">Destaque / CTA Texto</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={activeSlideObj.customCtaTextColor || '#ea580c'}
                          onChange={e => updateSlideField(activeSlide, 'customCtaTextColor', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeSlideObj.customCtaTextColor || ''}
                          onChange={e => updateSlideField(activeSlide, 'customCtaTextColor', e.target.value)}
                          className="w-full px-2 py-1 bg-dark-700/30 border border-dark-600/50 rounded text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick presets */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-semibold text-dark-400 mb-1.5">Presets Rápidos de Marca</label>
                    <div className="flex flex-wrap gap-1.5">
                      {gradientPresets.map(preset => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            updateSlideField(activeSlide, 'customBgStart', preset.start);
                            updateSlideField(activeSlide, 'customBgEnd', preset.end);
                            if (preset.name === 'Clean White') {
                              updateSlideField(activeSlide, 'customTextColor', '#0f172a');
                              updateSlideField(activeSlide, 'customLogoColor', '#0f172a');
                              updateSlideField(activeSlide, 'customCtaBg', '#3b82f6');
                              updateSlideField(activeSlide, 'customCtaTextColor', '#ffffff');
                            } else {
                              updateSlideField(activeSlide, 'customTextColor', '#ffffff');
                              updateSlideField(activeSlide, 'customLogoColor', '#ffffff');
                              updateSlideField(activeSlide, 'customCtaBg', '#ffffff');
                              updateSlideField(activeSlide, 'customCtaTextColor', preset.start);
                            }
                          }}
                          className="px-2 py-1 bg-dark-700/50 hover:bg-dark-600 text-[10px] rounded border border-dark-600/50 text-white"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upload image background */}
                {activeSlideObj.showImage !== false && (
                  <div className="border-t border-dark-600/30 pt-4">
                    <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Imagem do Post (Fundo/Mockup)</label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={triggerFileInput}
                        className="w-full py-2 px-3 bg-dark-750 hover:bg-dark-700 border border-dashed border-dark-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <HiOutlineUpload className="w-4 h-4 text-purple-400" />
                        Fazer Upload de Imagem
                      </button>
                      {activeSlideObj.imageUrl && (
                        <button
                          onClick={() => updateSlideField(activeSlide, 'imageUrl', '')}
                          className="w-full py-2 bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 text-red-400 rounded-xl text-xs"
                        >
                          Remover Imagem
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <HiOutlineSparkles className="w-4 h-4 text-brand-400" />
                    Gerar da Ideia
                  </h3>
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ex: Crie um post carrossel mostrando como o G3Small ajuda no controle fiscal de mercadorias em conveniências."
                    className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-xs placeholder-dark-400 focus:outline-none focus:border-brand-500/50 transition-all h-20 resize-none"
                  />
                  <button
                    onClick={handleAiGenerate}
                    disabled={isGenerating || isParsingText}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 gradient-brand rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isGenerating ? 'Gerando...' : 'Gerar Post Completo'}
                  </button>
                </div>

                <div className="border-t border-dark-650 my-2" />

                <div className="space-y-2">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <HiOutlineArrowsExpand className="w-4 h-4 text-purple-400" />
                    Transformar Artigo/Texto Longo
                  </h3>
                  <textarea
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder="Cole aqui o texto do seu artigo ou do blog..."
                    className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-xs placeholder-dark-400 focus:outline-none h-24 resize-none"
                  />
                  <button
                    onClick={handleParseRawText}
                    disabled={isGenerating || isParsingText}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isParsingText ? 'Dividindo...' : 'Dividir Texto em Slides'}
                  </button>
                </div>

                <div className="border-t border-dark-650 my-2" />

                <div className="space-y-2">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">Prompt de Imagem de Fundo (Pollinations IA)</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={activeSlideObj.imagePrompt || ''}
                      onChange={e => updateSlideField(activeSlide, 'imagePrompt', e.target.value)}
                      placeholder="Descreva a imagem em inglês..."
                      className="flex-1 px-3 py-2 bg-dark-700/30 border border-dark-600/50 rounded-xl text-xs text-white placeholder-dark-400 focus:outline-none"
                    />
                    <button
                      onClick={() => handleGenerateImage(activeSlide)}
                      className="py-2 px-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <HiOutlinePhotograph className="w-3.5 h-3.5 text-brand-400" />
                      Gerar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Live Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-6 sticky top-6">
          <div className="p-4 bg-dark-800/80 backdrop-blur-xl border border-dark-600/50 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-dark-600/30 pb-3 mb-4">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <HiOutlineEye className="w-5 h-5 text-brand-400" /> Live Preview
              </h2>
              <button
                onClick={handleDownloadActiveSlide}
                disabled={isSavingImage}
                className="flex items-center gap-1.5 px-4 py-2 gradient-brand hover:shadow-md rounded-xl text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {isSavingImage ? 'Renderizando...' : 'Baixar Imagem'}
              </button>
            </div>

            {/* Simulated Frame */}
            <div className={`mx-auto bg-black rounded-3xl border border-dark-700 overflow-hidden shadow-2xl transition-all duration-300 ${activeFormatObj.previewWidth}`}>
              {/* Insta Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-dark-900 border-b border-dark-800 select-none">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[1.5px]">
                    <div className="w-full h-full rounded-full bg-dark-800 flex items-center justify-center font-bold text-white text-[10px] border border-black">
                      G3
                    </div>
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold flex items-center gap-1">
                      g3soft_oficial
                    </div>
                    <div className="text-[9px] text-dark-400">Patrocinado</div>
                  </div>
                </div>
                <div className="text-white font-bold text-sm select-none">•••</div>
              </div>

              {/* Main Canvas (Downloader Targets This) */}
              <div 
                className={`w-full relative overflow-hidden bg-dark-950 select-none cursor-default ${activeFormatObj.aspect}`} 
                ref={previewRef} 
                id="post-card-preview"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                
                {/* SVG wave background pattern for g3-waves-badge */}
                <div 
                  className="w-full h-full flex flex-col justify-between relative"
                  style={{
                    background: `linear-gradient(135deg, ${activeSlideObj.customBgStart || '#ea580c'} 0%, ${activeSlideObj.customBgEnd || '#f97316'} 100%)`
                  }}
                >
                  
                  {/* Subtle Vector wavy line backdrop (matching G3 waves templates) */}
                  {activeSlideObj.layout === 'g3-waves-badge' && (
                    <div className="absolute inset-0 z-0 opacity-15 pointer-events-none mix-blend-overlay">
                      <svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-100,200 C150,300 350,100 550,250 C750,400 850,250 1000,350 L1000,900 L-100,900 Z" fill="none" stroke="#ffffff" strokeWidth="4" />
                        <path d="M-100,300 C200,450 400,200 600,350 C800,500 850,300 1000,450 L1000,900 L-100,900 Z" fill="none" stroke="#ffffff" strokeWidth="2" />
                        <path d="M-100,400 C100,500 250,300 450,400 C650,500 800,400 1000,550 L1000,900 L-100,900 Z" fill="none" stroke="#ffffff" strokeWidth="1" />
                      </svg>
                    </div>
                  )}

                  {/* Render Mockup Image Layer if layout is NOT split comparison or split card */}
                  {activeSlideObj.imageUrl && activeSlideObj.showImage !== false && !['g3-split-card', 'g3-comparison'].includes(activeSlideObj.layout) && (
                    <div className="absolute inset-0 z-0 pointer-events-none">
                      <img 
                        src={activeSlideObj.imageUrl} 
                        alt="Visual asset" 
                        className="w-full h-full object-cover opacity-35"
                      />
                      <div className="absolute inset-0 bg-black/10" />
                    </div>
                  )}

                  {/* CARD LAYOUT RENDERING */}
                  
                  {/* 1. G3 SPLIT CARD LAYOUT */}
                  {activeSlideObj.layout === 'g3-split-card' && (
                    <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-stretch p-6 gap-6">
                      
                      {/* Left Side: Brand content */}
                      <div className={`flex-1 flex flex-col justify-between py-6 ${activeSlideObj.showImage === false ? 'px-10 text-center items-center' : 'pr-2'}`}>
                        {/* Header logo */}
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm tracking-wider text-white">G3SOFT</span>
                          <span className="w-[1px] h-4 bg-white/40" />
                          <span className="font-semibold text-xs text-white/90">G3SMALL</span>
                        </div>

                        {/* Title & subtitle */}
                        <div className="my-auto space-y-4 pt-4">
                          <h3 
                            className={`font-black leading-tight tracking-tight ${activeSlideObj.showImage === false ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}
                            style={{ color: activeSlideObj.customTextColor || '#ffffff' }}
                          >
                            {renderHighlightedTitle(activeSlideObj.title)}
                          </h3>
                          <p className={`font-semibold leading-relaxed text-white/90 opacity-90 ${activeSlideObj.showImage === false ? 'text-sm max-w-md mx-auto' : 'text-xs'}`}>
                            {activeSlideObj.subtitle}
                          </p>
                        </div>

                        {/* CTA / Footer badge */}
                        {activeSlideObj.cta && (
                          <div 
                            className="py-2.5 px-4 bg-white rounded-xl text-center text-[10px] font-black shadow-md mt-4 max-w-[200px]"
                            style={{ color: activeSlideObj.customCtaTextColor || '#ea580c' }}
                          >
                            {activeSlideObj.cta}
                          </div>
                        )}
                      </div>

                      {/* Right Side: Floating Rounded White Card (Mimics G3 layout) */}
                      {activeSlideObj.showImage !== false && (
                        <div className="flex-[1.2] bg-white rounded-[2.5rem] shadow-xl p-8 flex flex-col justify-between items-center relative overflow-hidden">
                          
                          {/* Inner mockup label */}
                          <div className="text-[22px] font-black text-black tracking-tighter flex items-center gap-1 mb-4 select-none">
                            <span className="text-orange-600">G3</span>SMALL
                          </div>

                          {/* Mockup Frame Content */}
                          <div className="flex-1 w-full flex items-center justify-center my-auto">
                            {renderMockupContainer(activeSlideObj)}
                          </div>

                          <p className="text-[10px] text-center font-bold text-neutral-400 mt-4 leading-normal max-w-[180px]">
                            Tecnologia ao seu alcance
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. G3 WAVES BADGE LAYOUT */}
                  {activeSlideObj.layout === 'g3-waves-badge' && (
                    <div className="relative z-10 w-full h-full flex flex-col justify-between p-10">
                      {/* Header Logo */}
                      <div className="flex justify-center items-center gap-2">
                        <span className="font-extrabold text-sm tracking-wider text-white">G3SOFT</span>
                        <span className="w-[1px] h-4 bg-white/40" />
                        <span className="font-semibold text-xs text-white/90">G3SMALL</span>
                      </div>

                      {/* Title block with badge wraps */}
                      <div className="text-center px-4 my-2">
                        <h3 
                          className="text-xl md:text-2xl font-black leading-snug tracking-tight"
                          style={{ color: activeSlideObj.customTextColor || '#ffffff' }}
                        >
                          {renderHighlightedTitle(activeSlideObj.title)}
                        </h3>
                      </div>

                      {/* Mockup centered */}
                      {activeSlideObj.showImage !== false && (
                        <div className="flex-1 w-full flex items-center justify-center my-2 max-h-[45%]">
                          {renderMockupContainer(activeSlideObj)}
                        </div>
                      )}

                      {/* Subtitle / Footer CTA */}
                      <div className="text-center space-y-4">
                        <p className={`font-extrabold text-white/90 leading-relaxed max-w-md mx-auto ${activeSlideObj.showImage === false ? 'text-sm' : 'text-xs'}`}>
                          {activeSlideObj.subtitle}
                        </p>
                        {activeSlideObj.cta && (
                          <div className="flex justify-center">
                            <span 
                              className="px-6 py-2 bg-white rounded-full text-[10px] font-black shadow-lg uppercase tracking-wider"
                              style={{ color: activeSlideObj.customCtaTextColor || '#ea580c' }}
                            >
                              {activeSlideObj.cta}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. G3 COMPARISON LAYOUT (SEM VS COM) */}
                  {activeSlideObj.layout === 'g3-comparison' && (
                    <div className="relative z-10 w-full h-full flex flex-col justify-between">
                      {/* Logo header */}
                      <div className="flex justify-center items-center gap-2 py-4 bg-black/10 border-b border-white/5 select-none">
                        <span className="font-extrabold text-xs tracking-wider text-white">G3SOFT</span>
                        <span className="w-[1px] h-3 bg-white/35" />
                        <span className="font-bold text-[10px] text-white/90">G3ERP</span>
                      </div>

                      {/* 50/50 Body Split */}
                      <div className="flex-1 grid grid-cols-2 items-stretch">
                        {/* Left Half (SEM) */}
                        <div className="bg-neutral-50 p-6 pt-8 flex flex-col justify-between items-center text-center">
                          <h4 className="text-sm font-black text-orange-600 mb-4 select-none">Sem G3ERP</h4>
                          <ul className="space-y-3 text-left w-full max-w-[170px] text-[10px] text-neutral-500 font-semibold list-disc list-inside">
                            {activeSlideObj.comparisonSem?.map((item, idx) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            )) || <li>Nenhum item adicionado</li>}
                          </ul>
                          <div className="h-6" />
                        </div>

                        {/* Right Half (COM) */}
                        <div 
                          className="p-6 pt-8 flex flex-col justify-between items-center text-center relative"
                          style={{
                            background: `linear-gradient(180deg, ${activeSlideObj.customBgStart || '#ea580c'} 0%, ${activeSlideObj.customBgEnd || '#f97316'} 100%)`
                          }}
                        >
                          <h4 className="text-sm font-black text-white mb-4 select-none">Com G3ERP</h4>
                          <ul className="space-y-3 text-left w-full max-w-[170px] text-[10px] text-white/90 font-semibold list-disc list-inside">
                            {activeSlideObj.comparisonCom?.map((item, idx) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            )) || <li>Nenhum item adicionado</li>}
                          </ul>
                          <div className="h-6" />
                        </div>
                      </div>

                      {/* Floating Overlap Mockup centered at the bottom of the split */}
                      {activeSlideObj.showImage !== false && (
                        <div className="absolute left-1/2 bottom-8 -translate-x-1/2 w-4/5 flex justify-center max-h-[35%] z-20 pointer-events-none drop-shadow-2xl">
                          {renderMockupContainer(activeSlideObj)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. CUSTOM POSITIONING LAYOUT (DRAG & DROP) */}
                  {activeSlideObj.layout === 'custom' && (
                    <div className="w-full h-full relative p-6">
                      {/* Logo */}
                      <div 
                        className="absolute cursor-move select-none p-1.5 rounded border border-transparent hover:border-brand-500/40 hover:bg-white/5 active:bg-white/10"
                        style={{
                          left: `${activeSlideObj.positions?.logo?.x ?? 50}%`,
                          top: `${activeSlideObj.positions?.logo?.y ?? 15}%`,
                          transform: 'translate(-50%, -50%)',
                          color: activeSlideObj.customLogoColor || '#ffffff'
                        }}
                        onPointerDown={(e) => handlePointerDown(e, 'logo')}
                      >
                        <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-[10px] font-bold tracking-widest uppercase">
                          G3 SOFT
                        </div>
                      </div>

                      {/* Title */}
                      <div 
                        className="absolute cursor-move select-none p-2 rounded border border-transparent hover:border-brand-500/40 hover:bg-white/5 active:bg-white/10 w-4/5 text-center"
                        style={{
                          left: `${activeSlideObj.positions?.title?.x ?? 50}%`,
                          top: `${activeSlideObj.positions?.title?.y ?? 42}%`,
                          transform: 'translate(-50%, -50%)',
                          color: activeSlideObj.customTextColor || '#ffffff'
                        }}
                        onPointerDown={(e) => handlePointerDown(e, 'title')}
                      >
                        <h3 className="text-xl md:text-2xl font-black leading-tight tracking-tight">
                          {renderHighlightedTitle(activeSlideObj.title)}
                        </h3>
                      </div>

                      {/* Subtitle */}
                      <div 
                        className="absolute cursor-move select-none p-2 rounded border border-transparent hover:border-brand-500/40 hover:bg-white/5 active:bg-white/10 w-4/5 text-center"
                        style={{
                          left: `${activeSlideObj.positions?.subtitle?.x ?? 50}%`,
                          top: `${activeSlideObj.positions?.subtitle?.y ?? 62}%`,
                          transform: 'translate(-50%, -50%)',
                          color: activeSlideObj.customTextColor || '#ffffff'
                        }}
                        onPointerDown={(e) => handlePointerDown(e, 'subtitle')}
                      >
                        <p className="text-xs opacity-90 leading-relaxed font-semibold">
                          {activeSlideObj.subtitle}
                        </p>
                      </div>

                      {/* CTA Button */}
                      {activeSlideObj.cta && (
                        <div 
                          className="absolute cursor-move select-none p-2 rounded border border-transparent hover:border-brand-500/40 hover:bg-white/5 active:bg-white/10 w-4/5 flex justify-center"
                          style={{
                            left: `${activeSlideObj.positions?.cta?.x ?? 50}%`,
                            top: `${activeSlideObj.positions?.cta?.y ?? 83}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          onPointerDown={(e) => handlePointerDown(e, 'cta')}
                        >
                          <div 
                            className="w-full max-w-xs py-2.5 px-6 rounded-xl text-center text-[10px] font-black shadow-lg border border-white/10"
                            style={{
                              backgroundColor: activeSlideObj.customCtaBg || '#ffffff',
                              color: activeSlideObj.customCtaTextColor || '#ea580c'
                            }}
                          >
                            {activeSlideObj.cta}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. CENTERED LAYOUT */}
                  {activeSlideObj.layout === 'centered' && (
                    <div className="w-full h-full flex flex-col justify-between p-12">
                      <div className="flex justify-between items-center w-full">
                        <div 
                          className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase"
                          style={{ color: activeSlideObj.customTextColor || '#ffffff' }}
                        >
                          G3 SOFT
                        </div>
                      </div>

                      <div 
                        className="my-auto text-center space-y-6"
                        style={{ color: activeSlideObj.customTextColor || '#ffffff' }}
                      >
                        <h3 className="text-2xl font-black leading-tight tracking-tight">
                          {renderHighlightedTitle(activeSlideObj.title)}
                        </h3>
                        <p className="text-xs opacity-90 leading-relaxed font-semibold max-w-sm mx-auto">
                          {activeSlideObj.subtitle}
                        </p>
                        {activeSlideObj.showImage !== false && (
                          <div className="flex justify-center max-h-[140px] overflow-hidden rounded-xl">
                            {renderMockupContainer(activeSlideObj)}
                          </div>
                        )}
                      </div>

                      {activeSlideObj.cta && (
                        <div className="w-full mt-auto pt-6 flex justify-center">
                          <div 
                            className="w-full max-w-xs py-2.5 px-6 rounded-xl text-center text-[10px] font-black shadow-lg border border-white/10"
                            style={{ 
                              backgroundColor: activeSlideObj.customCtaBg || '#ffffff',
                              color: activeSlideObj.customCtaTextColor || '#ea580c'
                            }}
                          >
                            {activeSlideObj.cta}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. LEFT ALIGNED LAYOUT */}
                  {activeSlideObj.layout === 'left-aligned' && (
                    <div className="w-full h-full flex flex-col justify-between p-12">
                      <div className="flex justify-between items-center w-full">
                        <div 
                          className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase"
                          style={{ color: activeSlideObj.customTextColor || '#ffffff' }}
                        >
                          G3 SOFT
                        </div>
                      </div>

                      <div 
                        className="my-auto text-left space-y-6 pl-4 border-l-2 border-white/30"
                        style={{ color: activeSlideObj.customTextColor || '#ffffff' }}
                      >
                        <h3 className="text-2xl font-black leading-tight tracking-tight">
                          {renderHighlightedTitle(activeSlideObj.title)}
                        </h3>
                        <p className="text-xs opacity-90 leading-relaxed font-semibold max-w-sm">
                          {activeSlideObj.subtitle}
                        </p>
                        {activeSlideObj.showImage !== false && (
                          <div className="flex justify-start max-h-[140px] overflow-hidden rounded-xl">
                            {renderMockupContainer(activeSlideObj)}
                          </div>
                        )}
                      </div>

                      {activeSlideObj.cta && (
                        <div className="w-full mt-auto pt-6 flex justify-start">
                          <div 
                            className="w-full max-w-xs py-2.5 px-6 rounded-xl text-center text-[10px] font-black shadow-lg border border-white/10"
                            style={{ 
                              backgroundColor: activeSlideObj.customCtaBg || '#ffffff',
                              color: activeSlideObj.customCtaTextColor || '#ea580c'
                            }}
                          >
                            {activeSlideObj.cta}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>

              {/* Insta Footer */}
              <div className="px-4 py-3 bg-dark-900 space-y-3 select-none">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <svg className="w-6 h-6 hover:text-red-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    <svg className="w-6 h-6 hover:text-brand-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <svg className="w-6 h-6 hover:text-brand-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 10.742l4.684-2.342m0 5.2l-4.684-2.342M12 11.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6-5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm-12 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"></path></svg>
                  </div>
                  <svg className="w-6 h-6 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                </div>

                {/* Slides Dots (if carousel) */}
                {slides.length > 1 && (
                  <div className="flex justify-center gap-1.5">
                    {slides.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          activeSlide === idx ? 'bg-brand-500' : 'bg-dark-600'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Carousel Controls */}
                {slides.length > 1 && (
                  <div className="flex justify-between items-center text-xs text-dark-300 bg-dark-800/40 p-2 rounded-xl">
                    <button 
                      onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                      disabled={activeSlide === 0}
                      className="flex items-center gap-1 hover:text-white disabled:opacity-30 disabled:hover:text-dark-300"
                    >
                      <HiOutlineChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <span className="font-semibold text-white">Slide {activeSlide + 1} de {slides.length}</span>
                    <button 
                      onClick={() => setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))}
                      disabled={activeSlide === slides.length - 1}
                      className="flex items-center gap-1 hover:text-white disabled:opacity-30 disabled:hover:text-dark-300"
                    >
                      Seguinte <HiOutlineChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Likes & Caption */}
                <div className="text-xs text-white">
                  <div className="font-semibold mb-1">Curtido por g3soft_oficial e outras 42 pessoas</div>
                  <div className="space-y-1.5 leading-relaxed text-dark-200">
                    <span className="font-semibold text-white mr-2">g3soft_oficial</span>
                    <span className="whitespace-pre-line">{caption}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Caption Section */}
            <div className="mt-6 border-t border-dark-600/30 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider">Legenda do Post (Instagram Copy)</label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(caption);
                    toast.success('Legenda copiada!');
                  }}
                  className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold"
                >
                  <HiOutlineClipboardCopy className="w-4 h-4" /> Copiar Legenda
                </button>
              </div>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="w-full px-4 py-3 bg-dark-750 border border-dark-600/50 rounded-xl text-white text-xs placeholder-dark-400 focus:outline-none focus:border-brand-500/50 transition-all h-28 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render device frame mockups (Laptop or Phone wrapper)
function renderMockupContainer(slideObj) {
  if (!slideObj.imageUrl) {
    return (
      <div className="w-full h-32 bg-neutral-100 border border-dashed border-neutral-300 rounded-2xl flex items-center justify-center text-xs text-neutral-400 select-none font-semibold">
        Sem imagem (Upload ou Gerar)
      </div>
    );
  }

  // 1. LAPTOP MOCKUP CONTAINER
  if (slideObj.mockupType === 'laptop') {
    return (
      <div className="w-full max-w-[280px] flex flex-col items-center select-none scale-[1.05] origin-center drop-shadow-lg">
        {/* Screen Bezel */}
        <div className="w-full aspect-[16/10] bg-neutral-900 rounded-t-xl p-2 border-2 border-neutral-800 shadow-2xl relative">
          <div className="w-full h-full bg-neutral-950 overflow-hidden rounded relative">
            <img src={slideObj.imageUrl} alt="Laptop screen mockup" className="w-full h-full object-cover" />
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neutral-800/80" /> {/* Camera */}
          </div>
        </div>
        {/* Keyboard Base Line */}
        <div className="w-[108%] h-2.5 bg-neutral-300 rounded-b-lg border-t border-neutral-400/50 shadow-md relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-neutral-500/30 rounded-b-md" /> {/* Trackpad notch */}
        </div>
      </div>
    );
  }

  // 2. PHONE MOCKUP CONTAINER
  if (slideObj.mockupType === 'phone') {
    return (
      <div className="w-[130px] aspect-[9/19] bg-neutral-900 rounded-[2rem] p-[5px] border-[3px] border-neutral-800 shadow-2xl relative flex flex-col select-none overflow-hidden">
        <div className="w-full h-full bg-neutral-950 overflow-hidden rounded-[1.7rem] relative">
          <img src={slideObj.imageUrl} alt="Phone mockup content" className="w-full h-full object-cover" />
          {/* Dynamic Island Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-neutral-900 rounded-full" />
        </div>
      </div>
    );
  }

  // 3. RAW IMAGE
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-neutral-200/55 shadow-lg max-h-[180px]">
      <img src={slideObj.imageUrl} className="w-full h-full object-cover" alt="Raw visual asset" />
    </div>
  );
}
