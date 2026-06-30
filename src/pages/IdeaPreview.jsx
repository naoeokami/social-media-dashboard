import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  HiOutlineUpload, 
  HiOutlineDocumentText, 
  HiOutlineDownload, 
  HiOutlineClipboardCopy,
  HiOutlineTrash,
  HiOutlineFilter,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineHeart,
  HiOutlineChat,
  HiOutlinePaperAirplane,
  HiOutlineBookmark,
  HiOutlineCheckCircle,
  HiOutlineEye
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { toPng } from 'html-to-image';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import PostModal from '../components/PostModal';

export default function IdeaPreview() {
  const [ideas, setIdeas] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [activePreviewTab, setActivePreviewTab] = useState('image'); // 'image' | 'instagram' | 'story' | 'details'
  
  // Input fields
  const [rawText, setRawText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const imagePreviewRef = useRef(null);
  const { user, addPost, products } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [promoPost, setPromoPost] = useState(null);

  useEffect(() => {
    setIsEditing(false);
    setEditForm(null);
  }, [selectedIdea]);

  // Load ideas on mount
  useEffect(() => {
    async function loadIdeas() {
      if (hasSupabaseConfig && user) {
        try {
          const { data, error } = await supabase
            .from('post_ideas')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          const mapped = (data || []).map(item => ({
            ...item,
            createdAt: item.created_at || item.createdAt
          }));
          
          setIdeas(mapped);
          if (mapped.length > 0) {
            setSelectedIdea(mapped[0]);
          }
          return;
        } catch (e) {
          console.warn("Erro ao carregar Supabase. Usando local:", e);
        }
      }
      
      const saved = localStorage.getItem('socialhub_ideas');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setIdeas(parsed);
          if (parsed.length > 0) {
            setSelectedIdea(parsed[0]);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        // Default idea based on user pattern
        const defaultIdea = {
          id: '1',
          dia: 1,
          mes: 7,
          tipo: 'estatico',
          produto: 'G3ERP',
          especial: 'Abertura de Julho',
          titulo: 'G3ERP: o dia a dia de quem não precisa mais ligar para o contador',
          hook: 'Toda decisão importante do seu negócio devia caber em uma olhada na tela — não em uma ligação de 20 minutos.',
          copy: `📊 Julho começou — e seu negócio merece começar com clareza.

No dia a dia real de quem usa o G3ERP:

🌅 8h — Abre o sistema, vê o faturamento de ontem em 3 segundos
📦 10h — Confere estoque crítico sem sair do computador
💰 14h — Emite NF-e direto na tela, sem sistema externo
📈 17h — Olha o DRE do mês — sem esperar o contador
🌙 19h — Fecha o dia sabendo exatamente onde está o negócio

Tudo isso é rotina. Não é exceção.

📩 Comenta ERP — consultor entra em contato hoje.`,
          facilidades: [
            { icone: '📊', texto: 'Dashboard com faturamento, estoque e caixa em tempo real, sem precisar pedir relatório pra ninguém' },
            { icone: '🧾', texto: 'Emissão de NF-e, NFC-e e CT-e direto na tela — sem alternar entre sistemas' },
            { icone: '📈', texto: 'DRE automático todo mês — você sabe a margem real sem esperar o contador' },
          ],
          story: `📊 Story de abertura:
"Julho chegou. Seu dia a dia também pode mudar.

Comenta ERP no direct — te mostramos como fica seu dashboard."`,
          cta: 'Comenta ERP — consultor entra em contato hoje',
          objetivo: 'Abertura de mês com foco no uso prático diário do G3ERP',
          tags: ['G3ERP', 'DashboardEmTempoReal', 'Julho'],
          createdAt: new Date().toISOString()
        };
        setIdeas([defaultIdea]);
        setSelectedIdea(defaultIdea);
        localStorage.setItem('socialhub_ideas', JSON.stringify([defaultIdea]));
      }
    }
    loadIdeas();
  }, [user]);

  // Save ideas
  const saveAllIdeas = async (updatedIdeas, newItems = [], deletedId = null) => {
    setIdeas(updatedIdeas);
    localStorage.setItem('socialhub_ideas', JSON.stringify(updatedIdeas));

    if (hasSupabaseConfig && user) {
      try {
        if (deletedId) {
          const { error } = await supabase.from('post_ideas').delete().eq('id', deletedId);
          if (error) console.error("Erro ao deletar do Supabase:", error);
        }
        
        if (newItems.length > 0) {
          const toInsert = newItems.map(item => ({
            id: item.id,
            user_id: user.id,
            dia: item.dia,
            mes: item.mes,
            tipo: item.tipo,
            produto: item.produto,
            especial: item.especial,
            titulo: item.titulo,
            hook: item.hook,
            copy: item.copy,
            facilidades: item.facilidades,
            story: item.story,
            cta: item.cta,
            objetivo: item.objetivo,
            tags: item.tags
          }));
          
          const { error } = await supabase.from('post_ideas').insert(toInsert);
          if (error) throw error;
        }
      } catch (e) {
        console.error("Erro de sincronização com o banco:", e);
        toast.error("Erro ao sincronizar com o Supabase.");
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.titulo.trim()) {
      toast.error('O título é obrigatório.');
      return;
    }
    
    const updatedIdeas = ideas.map(idea => idea.id === editForm.id ? editForm : idea);
    setIdeas(updatedIdeas);
    localStorage.setItem('socialhub_ideas', JSON.stringify(updatedIdeas));
    setSelectedIdea(editForm);
    setIsEditing(false);

    if (hasSupabaseConfig && user) {
      try {
        const { error } = await supabase
          .from('post_ideas')
          .update({
            dia: editForm.dia,
            mes: editForm.mes,
            tipo: editForm.tipo,
            produto: editForm.produto,
            especial: editForm.especial,
            titulo: editForm.titulo,
            hook: editForm.hook,
            copy: editForm.copy,
            facilidades: editForm.facilidades,
            story: editForm.story,
            cta: editForm.cta,
            objetivo: editForm.objetivo,
            tags: editForm.tags
          })
          .eq('id', editForm.id);

        if (error) throw error;
        toast.success('Ideia atualizada no Supabase!');
      } catch (e) {
        console.error("Erro ao atualizar no Supabase:", e);
        toast.error("Erro ao sincronizar com o banco.");
      }
    } else {
      toast.success('Ideia atualizada localmente!');
    }
  };

  const handlePromoteToPost = (type = 'feed') => {
    if (!selectedIdea) return;
    
    const currentYear = new Date().getFullYear();
    const formattedMonth = String(selectedIdea.mes).padStart(2, '0');
    const formattedDay = String(selectedIdea.dia).padStart(2, '0');
    const initialPostDate = `${currentYear}-${formattedMonth}-${formattedDay}`;

    let newPostData = {};

    if (type === 'story') {
      newPostData = {
        title: `Story: ${selectedIdea.titulo || 'Nova Ideia'}`,
        caption: selectedIdea.story || '',
        date: initialPostDate,
        time: '12:00',
        contentType: 'Story',
        platforms: ['Instagram'],
        segment: selectedIdea.objetivo || '',
        productId: '',
        tool: 'Canva',
        status: 'ideia',
        fileUrls: [],
        fileUrl: '',
        hasPaidTraffic: false,
        budget: '',
        profileIds: [],
      };
    } else {
      let contentType = 'Imagem Única';
      if (selectedIdea.tipo === 'carrossel') contentType = 'Carrossel';
      if (selectedIdea.tipo === 'video') contentType = 'Reels';
      if (selectedIdea.tipo === 'reels') contentType = 'Reels';
      if (selectedIdea.tipo === 'story') contentType = 'Story';

      newPostData = {
        title: selectedIdea.titulo || '',
        caption: selectedIdea.copy || '',
        date: initialPostDate,
        time: '12:00',
        contentType: contentType,
        platforms: ['Instagram'],
        segment: selectedIdea.objetivo || '',
        productId: '',
        tool: 'Canva',
        status: 'ideia',
        fileUrls: [],
        fileUrl: '',
        hasPaidTraffic: false,
        budget: '',
        profileIds: [],
      };
    }

    // Attempt to match product
    const matchingProduct = products.find(p => p.name?.toLowerCase() === selectedIdea.produto?.toLowerCase());
    if (matchingProduct) {
      newPostData.productId = matchingProduct.id;
    }

    setPromoPost(newPostData);
    setPostModalOpen(true);
  };

  const handleCopyAiPrompt = () => {
    const promptText = `Aja como um especialista em social media e copywriting. Crie ideias de posts no formato de objeto Javascript para que eu possa copiar e colar direto na ferramenta. Use exatamente esta estrutura de objeto (sem aspas nas chaves e sem campos extras):

{
  dia: 1,
  mes: 7,
  tipo: 'estatico', // pode ser: 'estatico', 'carrossel', 'video', 'reels', 'story'
  produto: 'G3ERP', // Nome do produto/sistema
  especial: 'Tema ou título da campanha',
  titulo: 'Título chamativo para a imagem do post',
  hook: 'Gancho ou frase de impacto curta para a imagem',
  copy: \`Legenda completa para a publicação com emojis e estrutura atraente.\`,
  facilidades: [
    { icone: '📊', texto: 'Destaque ou funcionalidade 1' },
    { icone: '🧾', texto: 'Destaque ou funcionalidade 2' }
  ],
  story: \`Texto ou roteiro para o story de engajamento.\`,
  cta: 'Chamada para ação clara (ex: Comente ERP)',
  objetivo: 'Objetivo estratégico do post',
  tags: ['Tag1', 'Tag2']
}

Crie ideias com base no seguinte briefing ou tema:
[Insira seu briefing, produto e diretrizes aqui]`;

    navigator.clipboard.writeText(promptText);
    toast.success('Prompt estruturado para IA copiado!');
  };

  // Safe JS object parser
  const handleParseText = () => {
    if (!rawText.trim()) {
      toast.error('Por favor, insira o texto do objeto.');
      return;
    }

    try {
      let cleaned = rawText.trim();
      // Ensure it is wrapped in braces
      if (!cleaned.startsWith('{')) {
        cleaned = '{' + cleaned;
      }
      if (!cleaned.endsWith('}')) {
        cleaned = cleaned + '}';
      }

      // Safe evaluation using browser JS engine
      const parsed = new Function(`return (${cleaned})`)();
      
      // Validation & Formatting
      const formattedIdea = {
        id: crypto.randomUUID(),
        dia: parsed.dia || 1,
        mes: parsed.mes || 1,
        tipo: parsed.tipo || 'estatico',
        produto: parsed.produto || 'Geral',
        especial: parsed.especial || '',
        titulo: parsed.titulo || 'Nova Ideia',
        hook: parsed.hook || '',
        copy: parsed.copy || '',
        facilidades: Array.isArray(parsed.facilidades) ? parsed.facilidades : [],
        story: parsed.story || '',
        cta: parsed.cta || '',
        objetivo: parsed.objetivo || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        createdAt: new Date().toISOString()
      };

      const newIdeas = [formattedIdea, ...ideas];
      saveAllIdeas(newIdeas, [formattedIdea]);
      setSelectedIdea(formattedIdea);
      setRawText('');
      setShowImportModal(false);
      toast.success('Ideia importada e salva com sucesso!');
    } catch (e) {
      console.error(e);
      // Let's try matching via Regex as fallback
      try {
        const dia = parseInt(rawText.match(/dia:\s*(\d+)/)?.[1] || '1');
        const mes = parseInt(rawText.match(/mes:\s*(\d+)/)?.[1] || '1');
        const tipo = rawText.match(/tipo:\s*['"`](.*?)['"`]/)?.[1] || 'estatico';
        const produto = rawText.match(/produto:\s*['"`](.*?)['"`]/)?.[1] || 'Geral';
        const especial = rawText.match(/especial:\s*['"`](.*?)['"`]/)?.[1] || '';
        const titulo = rawText.match(/titulo:\s*['"`](.*?)['"`]/)?.[1] || 'Ideia Importada';
        const hook = rawText.match(/hook:\s*['"`](.*?)['"`]/)?.[1] || '';
        const copy = rawText.match(/copy:\s*`([\s\S]*?)`/)?.[1] || rawText.match(/copy:\s*['"]([\s\S]*?)['"]/)?.[1] || '';
        const cta = rawText.match(/cta:\s*['"`](.*?)['"`]/)?.[1] || '';
        const objetivo = rawText.match(/objetivo:\s*['"`](.*?)['"`]/)?.[1] || '';
        const story = rawText.match(/story:\s*`([\s\S]*?)`/)?.[1] || rawText.match(/story:\s*['"]([\s\S]*?)['"]/)?.[1] || '';
        
        let facilidades = [];
        const facMatch = rawText.match(/facilidades:\s*\[([\s\S]*?)\]/);
        if (facMatch) {
          const itemRegex = /\{\s*icone:\s*['"`](.*?)['"`],\s*texto:\s*['"`](.*?)['"`]\s*\}/g;
          let m;
          while ((m = itemRegex.exec(facMatch[1])) !== null) {
            facilidades.push({ icone: m[1], texto: m[2] });
          }
        }

        let tags = [];
        const tagsMatch = rawText.match(/tags:\s*\[([\s\S]*?)\]/);
        if (tagsMatch) {
          tags = tagsMatch[1].split(',').map(t => t.replace(/['"`\s]/g, '')).filter(Boolean);
        }

        const formattedIdea = {
          id: crypto.randomUUID(),
          dia, mes, tipo, produto, especial, titulo, hook, copy, facilidades, story, cta, objetivo, tags,
          createdAt: new Date().toISOString()
        };

        const newIdeas = [formattedIdea, ...ideas];
        saveAllIdeas(newIdeas, [formattedIdea]);
        setSelectedIdea(formattedIdea);
        setRawText('');
        setShowImportModal(false);
        toast.success('Ideia importada com sucesso (via Regex Parser)!');
      } catch (err) {
        toast.error('Falha ao analisar o texto. Certifique-se de seguir o padrão JS Object.');
      }
    }
  };

  // CSV Import Parser
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      try {
        const lines = [];
        let row = [""];
        let inQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
          const c = csvText[i];
          const next = csvText[i+1];
          
          if (c === '"') {
            if (inQuotes && next === '"') {
              row[row.length - 1] += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (c === ',' && !inQuotes) {
            row.push("");
          } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') {
              i++;
            }
            lines.push(row);
            row = [""];
          } else {
            row[row.length - 1] += c;
          }
        }
        if (row.length > 1 || row[0] !== "") {
          lines.push(row);
        }
        
        if (lines.length === 0) {
          toast.error('O arquivo CSV está vazio.');
          return;
        }
        
        const headers = lines[0].map(h => h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i];
          if (values.length < headers.length || !values[0]) continue;
          
          const obj = { id: crypto.randomUUID(), createdAt: new Date().toISOString() };
          headers.forEach((header, index) => {
            let val = values[index]?.trim() || '';
            
            if (header === 'facilidades') {
              try {
                // If it's JSON format
                obj.facilidades = JSON.parse(val);
              } catch (e) {
                // If it's text representation: "📊 Texto 1 | 🧾 Texto 2"
                obj.facilidades = val.split('|').map(item => {
                  const cleaned = item.trim();
                  const firstEmoji = cleaned.match(/[\p{Emoji}\u2700-\u27BF]/u)?.[0] || '✨';
                  const text = cleaned.replace(firstEmoji, '').trim();
                  return { icone: firstEmoji, texto: text };
                }).filter(item => item.texto);
              }
            } else if (header === 'tags') {
              obj.tags = val.replace(/[\[\]'"`]/g, '').split(',').map(t => t.trim()).filter(Boolean);
            } else if (header === 'dia' || header === 'mes') {
              obj[header] = parseInt(val) || 1;
            } else {
              obj[header] = val;
            }
          });
          
          // Fill fallback values
          if (!obj.titulo) obj.titulo = 'Ideia Importada';
          if (!obj.facilidades) obj.facilidades = [];
          if (!obj.tags) obj.tags = [];
          
          data.push(obj);
        }

        if (data.length === 0) {
          toast.error('Nenhuma linha válida encontrada no CSV.');
          return;
        }

        const newIdeas = [...data, ...ideas];
        saveAllIdeas(newIdeas, data);
        setSelectedIdea(data[0]);
        setShowImportModal(false);
        toast.success(`${data.length} ideias importadas do CSV!`);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao ler arquivo CSV. Verifique a formatação.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDeleteIdea = (id, e) => {
    e.stopPropagation();
    const updated = ideas.filter(i => i.id !== id);
    saveAllIdeas(updated, [], id);
    if (selectedIdea?.id === id) {
      setSelectedIdea(updated.length > 0 ? updated[0] : null);
    }
    toast.success('Ideia removida.');
  };

  const handleDownloadImage = () => {
    if (!imagePreviewRef.current) return;
    
    const toastId = toast.loading('Gerando imagem de alta qualidade...');
    toPng(imagePreviewRef.current, { quality: 0.95, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Ideia_Post_${selectedIdea?.titulo.substring(0, 20).replace(/\s+/g, '_') || 'G3'}.png`;
        link.href = dataUrl;
        link.click();
        toast.success('Imagem salva no seu dispositivo!', { id: toastId });
      })
      .catch((err) => {
        console.error(err);
        toast.error('Erro ao gerar imagem.', { id: toastId });
      });
  };

  const handleCopyToClipboard = (text, type = 'legenda') => {
    navigator.clipboard.writeText(text);
    toast.success(`Cópia da ${type} salva na área de transferência!`);
  };

  // Filter ideas
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = !search || 
      idea.titulo.toLowerCase().includes(search.toLowerCase()) || 
      idea.produto.toLowerCase().includes(search.toLowerCase());
    const matchesProduct = !filterProduct || idea.produto === filterProduct;
    const matchesMonth = !filterMonth || String(idea.mes) === String(filterMonth);
    return matchesSearch && matchesProduct && matchesMonth;
  });

  const getProductColor = (prod) => {
    const p = String(prod).toUpperCase();
    if (p.includes('ERP')) return 'from-blue-600 to-indigo-600 shadow-blue-500/20';
    if (p.includes('PDV')) return 'from-orange-500 to-amber-500 shadow-orange-500/20';
    if (p.includes('MEI')) return 'from-emerald-500 to-teal-500 shadow-emerald-500/20';
    return 'from-purple-600 to-pink-600 shadow-purple-500/20';
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      
      {/* LEFT SIDEBAR: List and Actions */}
      <div className="w-full xl:w-96 flex flex-col gap-4">
        
        {/* Controls Card */}
        <div className="p-4 bg-dark-800/80 backdrop-blur-md border border-dark-600/50 rounded-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <HiOutlineEye className="w-5 h-5 text-brand-400" />
              Banco de Ideias
            </h3>
            <div className="flex gap-1.5">
              <button
                onClick={handleCopyAiPrompt}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-dark-600 bg-dark-700/50 hover:bg-dark-700 text-slate-350 rounded-xl text-xs font-semibold transition-all"
                title="Copiar prompt para gerar ideias com a IA"
              >
                <HiOutlineSparkles className="w-3.5 h-3.5 text-brand-400" />
                Prompt
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 gradient-brand rounded-xl text-white text-xs font-semibold hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all"
              >
                <HiOutlinePlus className="w-4 h-4" />
                Nova
              </button>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título ou produto..."
            className="w-full px-3 py-2 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500/50 transition-all"
          />

          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterProduct}
              onChange={e => setFilterProduct(e.target.value)}
              className="px-2 py-1.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="" className="bg-dark-800">Todos Produtos</option>
              {Array.from(new Set(ideas.map(i => i.produto))).filter(Boolean).map(p => (
                <option key={p} value={p} className="bg-dark-800">{p}</option>
              ))}
            </select>
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="px-2 py-1.5 bg-dark-700/30 border border-dark-600/50 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="" className="bg-dark-800">Todos os Meses</option>
              {Array.from(new Set(ideas.map(i => i.mes))).filter(Boolean).sort((a,b) => a-b).map(m => (
                <option key={m} value={m} className="bg-dark-800">Mês {m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ideas List Container */}
        <div className="flex-1 overflow-y-auto max-h-[500px] xl:max-h-[calc(100vh-22rem)] space-y-2 pr-1">
          {filteredIdeas.length > 0 ? (
            filteredIdeas.map(idea => (
              <div
                key={idea.id}
                onClick={() => setSelectedIdea(idea)}
                className={`p-4 border rounded-2xl cursor-pointer transition-all duration-300 relative group flex flex-col gap-2 ${
                  selectedIdea?.id === idea.id
                    ? 'bg-brand-500/10 border-brand-500/50 shadow-lg shadow-brand-500/5'
                    : 'bg-dark-800/40 border-dark-600/40 hover:border-dark-500/60 hover:bg-dark-700/30'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold text-white uppercase bg-gradient-to-r ${getProductColor(idea.produto)} shadow-sm`}>
                    {idea.produto}
                  </span>
                  
                  <button
                    onClick={(e) => handleDeleteIdea(idea.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-dark-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="font-bold text-white text-sm line-clamp-2 leading-snug">{idea.titulo}</h4>

                <div className="flex items-center justify-between mt-1 text-[11px] text-dark-400 font-medium">
                  <span>Dia {idea.dia} / Mês {idea.mes}</span>
                  <span className="capitalize">{idea.tipo}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 bg-dark-800/20 border border-dashed border-dark-600/30 rounded-2xl">
              <HiOutlineDocumentText className="w-8 h-8 text-dark-500 mx-auto mb-2" />
              <p className="text-xs text-dark-400 font-semibold">Nenhuma ideia encontrada.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PREVIEW CANVAS */}
      <div className="flex-1 flex flex-col bg-dark-800/40 backdrop-blur-md border border-dark-600/50 rounded-3xl overflow-hidden shadow-2xl relative">
        {selectedIdea ? (
          <>
            {/* Header Tabs */}
            <div className="flex flex-wrap items-center justify-between border-b border-dark-600/50 px-6 py-4 gap-4 bg-dark-850/80">
              <div className="flex gap-2 p-1 bg-dark-900/60 border border-dark-600/30 rounded-xl">
                <button
                  onClick={() => setActivePreviewTab('image')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activePreviewTab === 'image'
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-dark-350 hover:text-white'
                  }`}
                >
                  Imagem Montada (1:1)
                </button>
                <button
                  onClick={() => setActivePreviewTab('instagram')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activePreviewTab === 'instagram'
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-dark-350 hover:text-white'
                  }`}
                >
                  Visualização Feed
                </button>
                <button
                  onClick={() => setActivePreviewTab('story')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activePreviewTab === 'story'
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-dark-350 hover:text-white'
                  }`}
                >
                  Stories (9:16)
                </button>
                <button
                  onClick={() => setActivePreviewTab('details')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activePreviewTab === 'details'
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-dark-350 hover:text-white'
                  }`}
                >
                  Detalhes e Copy
                </button>
              </div>

              {/* Action utilities */}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1.5 px-4 py-2 border border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all"
                    >
                      Salvar Alterações
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1.5 px-4 py-2 border border-dark-600 bg-dark-700 hover:bg-dark-600 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handlePromoteToPost('feed')}
                      className="flex items-center gap-1.5 px-4 py-2 gradient-brand hover:scale-[1.02] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/10"
                    >
                      <HiOutlineUpload className="w-4 h-4 rotate-180" />
                      Subir Feed
                    </button>
                    {selectedIdea.story && (
                      <button
                        onClick={() => handlePromoteToPost('story')}
                        className="flex items-center gap-1.5 px-4 py-2 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl text-xs font-bold transition-all shadow-md"
                      >
                        <HiOutlineUpload className="w-4 h-4 rotate-180 text-purple-450" />
                        Subir Story
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditForm({ ...selectedIdea });
                        setIsEditing(true);
                        setActivePreviewTab('details');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 border border-dark-600 bg-dark-700/50 hover:bg-dark-700 hover:border-brand-500/50 rounded-xl text-white text-xs font-bold transition-all"
                    >
                      Editar Detalhes
                    </button>
                    {activePreviewTab === 'image' && (
                      <button
                        onClick={handleDownloadImage}
                        className="flex items-center gap-1.5 px-4 py-2 border border-dark-600 bg-dark-700/50 hover:bg-dark-700 hover:border-brand-500/50 rounded-xl text-white text-xs font-bold transition-all"
                      >
                        <HiOutlineDownload className="w-4 h-4 text-brand-400" />
                        Baixar JPG/PNG
                      </button>
                    )}
                    <button
                      onClick={() => handleCopyToClipboard(selectedIdea.copy, 'legenda')}
                      className="flex items-center gap-1.5 px-4 py-2 border border-dark-600 bg-dark-700/50 hover:bg-dark-700 hover:border-brand-500/50 rounded-xl text-white text-xs font-bold transition-all"
                    >
                      <HiOutlineClipboardCopy className="w-4 h-4 text-brand-400" />
                      Copiar Legenda
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* TAB CONTENT AREAS */}
            <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center min-h-[480px]">
              
              {/* TAB 1: PREMIUM SQUARE POST DESIGN */}
              {activePreviewTab === 'image' && (
                <div className="w-full max-w-[460px] aspect-square relative shadow-2xl rounded-2xl overflow-hidden border border-white/5 bg-slate-950" ref={imagePreviewRef}>
                  {/* Premium Brand Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950" />
                  <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
                  
                  {/* Frame Border Details */}
                  <div className="absolute inset-4 border border-white/5 rounded-xl pointer-events-none" />
                  
                  {/* Layout Grid */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-between z-10 text-left">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-lg shadow-brand-500/20">
                          <span className="text-white font-black text-sm">G3</span>
                        </div>
                        <span className="text-white/80 font-bold text-xs uppercase tracking-wider">Softwares</span>
                      </div>
                      
                      {/* Product Tag */}
                      <span className="px-3 py-1 bg-white/5 backdrop-blur border border-white/10 rounded-full text-white/90 font-black text-[10px] tracking-widest uppercase">
                        {selectedIdea.produto}
                      </span>
                    </div>

                    {/* Content Body */}
                    <div className="flex flex-col gap-4 my-auto">
                      {/* Sub-header themed indicator */}
                      {selectedIdea.especial && (
                        <span className="text-brand-400 font-extrabold text-[11px] uppercase tracking-wider">
                          ✦ {selectedIdea.especial}
                        </span>
                      )}
                      
                      {/* Main Title */}
                      <h2 className="text-white font-black text-2xl leading-tight tracking-tight drop-shadow-md">
                        {selectedIdea.titulo}
                      </h2>

                      {/* Hook statement */}
                      {selectedIdea.hook && (
                        <p className="text-slate-300 text-[11px] leading-relaxed border-l-2 border-brand-500 pl-3 py-1 font-medium bg-white/[0.02] rounded-r-lg">
                          {selectedIdea.hook}
                        </p>
                      )}

                      {/* Facilidades (Highlights) rendered in sleek glass cards */}
                      {selectedIdea.facilidades && selectedIdea.facilidades.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {selectedIdea.facilidades.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all">
                              <span className="text-lg flex-shrink-0">{item.icone}</span>
                              <span className="text-white/90 text-xs leading-normal font-semibold">
                                {item.texto}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer / CTA banner */}
                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                      <div className="text-[10px] text-white/50 font-bold tracking-wide">
                        {selectedIdea.tipo.toUpperCase()} POST
                      </div>
                      <div className="px-3 py-1.5 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-lg text-white font-extrabold text-[10px] tracking-wide shadow-md shadow-brand-500/20">
                        {selectedIdea.cta ? selectedIdea.cta.split('—')[0].trim() : 'Saiba Mais'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INSTAGRAM FEED POST PREVIEW */}
              {activePreviewTab === 'instagram' && (
                <div className="w-full max-w-[460px] bg-dark-900 border border-dark-600/50 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-3 border-b border-dark-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center font-bold text-xs text-white">
                        G3
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white">g3softecnologia</span>
                          <HiOutlineCheckCircle className="w-3.5 h-3.5 text-blue-500 fill-current" />
                        </div>
                        <span className="text-[10px] text-dark-400">Patrocinado / Campanha</span>
                      </div>
                    </div>
                    <button className="text-white font-bold text-lg leading-none">•••</button>
                  </div>

                  {/* Render the actual 1:1 image mock in the center */}
                  <div className="w-full aspect-square relative bg-slate-950">
                    {/* Rendered identically to tab 1 without ref */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
                    <div className="absolute inset-0 p-8 flex flex-col justify-between z-10 text-left">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center font-black text-xs text-white">G3</div>
                          <span className="text-white/80 font-bold text-[10px] uppercase tracking-wider">Softwares</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-white/95 font-black text-[9px] uppercase tracking-widest">
                          {selectedIdea.produto}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3 my-auto">
                        {selectedIdea.especial && (
                          <span className="text-brand-400 font-extrabold text-[10px] uppercase tracking-wider">✦ {selectedIdea.especial}</span>
                        )}
                        <h2 className="text-white font-black text-xl leading-tight">{selectedIdea.titulo}</h2>
                        {selectedIdea.hook && (
                          <p className="text-slate-300 text-[10px] leading-relaxed border-l-2 border-brand-500 pl-2.5 font-medium">{selectedIdea.hook}</p>
                        )}
                        {selectedIdea.facilidades && selectedIdea.facilidades.length > 0 && (
                          <div className="space-y-1.5 mt-1">
                            {selectedIdea.facilidades.map((item, index) => (
                              <div key={index} className="flex items-center gap-2.5 p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                                <span className="text-sm">{item.icone}</span>
                                <span className="text-white/90 text-[10px] leading-normal font-semibold">{item.texto}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <div className="text-[9px] text-white/40 font-bold uppercase">{selectedIdea.tipo} post</div>
                        <div className="px-2.5 py-1 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-md text-white font-extrabold text-[9px]">
                          {selectedIdea.cta ? selectedIdea.cta.split('—')[0].trim() : 'Saiba Mais'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-between items-center p-3 text-white">
                    <div className="flex gap-4">
                      <HiOutlineHeart className="w-6 h-6 hover:text-red-500 cursor-pointer transition-colors" />
                      <HiOutlineChat className="w-6 h-6 cursor-pointer" />
                      <HiOutlinePaperAirplane className="w-6 h-6 rotate-45 cursor-pointer" />
                    </div>
                    <HiOutlineBookmark className="w-6 h-6 cursor-pointer" />
                  </div>

                  {/* Likes and Caption */}
                  <div className="px-4 pb-4 flex flex-col gap-1 text-left">
                    <span className="text-xs font-bold text-white">Curtido por milhares de empresas</span>
                    <div className="text-xs text-slate-300 leading-relaxed font-normal">
                      <span className="font-bold text-white mr-1.5">g3softecnologia</span>
                      <span className="whitespace-pre-line">{selectedIdea.copy}</span>
                    </div>
                    {selectedIdea.tags && selectedIdea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedIdea.tags.map(tag => (
                          <span key={tag} className="text-xs font-semibold text-brand-400 cursor-pointer hover:underline">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: STORY GRAPHIC PREVIEW */}
              {activePreviewTab === 'story' && (
                <div className="w-full max-w-[310px] aspect-[9/16] bg-dark-900 border border-dark-600/50 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col justify-between p-4">
                  {/* Story Background */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-purple-950 to-indigo-950 z-0" />
                  <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl z-0" />
                  
                  {/* Header */}
                  <div className="flex items-center gap-2 z-10">
                    <div className="w-6 h-6 rounded-full border border-brand-500 gradient-brand flex items-center justify-center font-bold text-[9px] text-white">G3</div>
                    <span className="text-[10px] font-bold text-white">g3softecnologia</span>
                    <span className="text-[9px] text-slate-400">4h</span>
                  </div>

                  {/* Middle: Sticker content */}
                  <div className="my-auto z-10 flex flex-col items-center justify-center gap-4 text-center px-2">
                    <div className="p-4 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl w-full">
                      <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto mb-3 border border-brand-500/35">
                        <HiOutlineSparkles className="w-4 h-4 text-brand-400" />
                      </div>
                      <h4 className="text-white font-extrabold text-xs mb-2 uppercase tracking-widest text-brand-400">
                        {selectedIdea.produto}
                      </h4>
                      <p className="text-white text-xs font-semibold leading-relaxed whitespace-pre-line text-center">
                        {selectedIdea.story || 'Verifique nossa novidade de Julho!'}
                      </p>
                    </div>

                    {/* Comenta Sticker */}
                    <div className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-purple-600 rounded-xl shadow-lg border border-white/10 animate-pulse cursor-pointer">
                      <span className="text-[10px] text-white font-black tracking-widest uppercase">
                        💬 COMENTE ERP
                      </span>
                    </div>
                  </div>

                  {/* Bottom input */}
                  <div className="flex items-center gap-2 z-10 border-t border-white/5 pt-3">
                    <div className="flex-1 px-3 py-1.5 border border-white/15 bg-white/5 rounded-full text-[10px] text-white/50 text-left font-medium">
                      Enviar mensagem...
                    </div>
                    <HiOutlinePaperAirplane className="w-5 h-5 text-white rotate-45" />
                  </div>
                </div>
              )}

              {/* TAB 4: COMPLETE DETAILS AND COPY */}
              {activePreviewTab === 'details' && (
                isEditing && editForm ? (
                  <div className="w-full text-left bg-dark-900 border border-dark-600/50 rounded-2xl p-6 flex flex-col gap-5 max-w-2xl">
                    <h3 className="font-extrabold text-white text-base border-b border-dark-700 pb-3 flex items-center gap-2">
                      <HiOutlineSparkles className="w-5 h-5 text-brand-400" />
                      Editar Detalhes da Ideia
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Título</label>
                        <input
                          type="text"
                          value={editForm.titulo}
                          onChange={e => setEditForm({ ...editForm, titulo: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Produto</label>
                        <input
                          type="text"
                          value={editForm.produto}
                          onChange={e => setEditForm({ ...editForm, produto: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Dia</label>
                        <input
                          type="number"
                          value={editForm.dia}
                          onChange={e => setEditForm({ ...editForm, dia: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Mês</label>
                        <input
                          type="number"
                          value={editForm.mes}
                          onChange={e => setEditForm({ ...editForm, mes: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Tipo</label>
                        <select
                          value={editForm.tipo}
                          onChange={e => setEditForm({ ...editForm, tipo: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                          <option value="estatico">Estático</option>
                          <option value="carrossel">Carrossel</option>
                          <option value="video">Vídeo</option>
                          <option value="reels">Reels / Story</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Tema Especial</label>
                        <input
                          type="text"
                          value={editForm.especial}
                          onChange={e => setEditForm({ ...editForm, especial: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">CTA</label>
                        <input
                          type="text"
                          value={editForm.cta}
                          onChange={e => setEditForm({ ...editForm, cta: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Objetivo</label>
                      <input
                        type="text"
                        value={editForm.objetivo}
                        onChange={e => setEditForm({ ...editForm, objetivo: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Gancho (Hook)</label>
                      <textarea
                        rows="2"
                        value={editForm.hook}
                        onChange={e => setEditForm({ ...editForm, hook: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 resize-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Legenda (Copy)</label>
                      <textarea
                        rows="5"
                        value={editForm.copy}
                        onChange={e => setEditForm({ ...editForm, copy: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Texto Story</label>
                      <textarea
                        rows="3"
                        value={editForm.story}
                        onChange={e => setEditForm({ ...editForm, story: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-sans"
                      />
                    </div>

                    {/* Facilidades Editor */}
                    <div>
                      <label className="block text-[10px] font-bold text-dark-400 uppercase mb-2">Facilidades (Destaques da Imagem)</label>
                      <div className="flex flex-col gap-2">
                        {[0, 1, 2].map(index => {
                          const fac = editForm.facilidades[index] || { icone: '', texto: '' };
                          return (
                            <div key={index} className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Ícone"
                                value={fac.icone}
                                onChange={e => {
                                  const newFacs = [...editForm.facilidades];
                                  newFacs[index] = { ...fac, icone: e.target.value };
                                  setEditForm({ ...editForm, facilidades: newFacs });
                                }}
                                className="w-14 text-center px-2 py-1.5 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                              />
                              <input
                                type="text"
                                placeholder={`Texto da facilidade ${index + 1}`}
                                value={fac.texto}
                                onChange={e => {
                                  const newFacs = [...editForm.facilidades];
                                  newFacs[index] = { ...fac, texto: e.target.value };
                                  setEditForm({ ...editForm, facilidades: newFacs });
                                }}
                                className="flex-1 px-3 py-1.5 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Tags (separadas por vírgula)</label>
                      <input
                        type="text"
                        value={editForm.tags ? editForm.tags.join(', ') : ''}
                        onChange={e => setEditForm({
                          ...editForm,
                          tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                        })}
                        className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full text-left bg-dark-900 border border-dark-600/50 rounded-2xl p-6 flex flex-col gap-6 max-w-2xl">
                    <div>
                      <h3 className="font-extrabold text-white text-lg mb-2">{selectedIdea.titulo}</h3>
                      <p className="text-xs text-brand-400 font-bold uppercase tracking-wider">
                        {selectedIdea.produto} — {selectedIdea.tipo} ({selectedIdea.especial})
                      </p>
                    </div>

                    {/* Objective & Meta details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-dark-800/40 border border-dark-600/40 rounded-xl text-left">
                        <span className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Objetivo da Ideia</span>
                        <p className="text-xs text-white font-medium leading-relaxed">{selectedIdea.objetivo || 'Não especificado.'}</p>
                      </div>
                      <div className="p-4 bg-dark-800/40 border border-dark-600/40 rounded-xl text-left">
                        <span className="block text-[10px] font-bold text-dark-400 uppercase mb-1">Calendário</span>
                        <p className="text-xs text-white font-medium">Dia {selectedIdea.dia} / Mês {selectedIdea.mes}</p>
                      </div>
                    </div>

                    {/* Legend / Copy block */}
                    <div className="relative group text-left">
                      <span className="block text-[10px] font-bold text-dark-400 uppercase mb-2">Legenda do Feed (Copy)</span>
                      <pre className="w-full p-4 bg-dark-950 border border-dark-600/50 rounded-xl text-xs text-slate-350 leading-relaxed font-sans whitespace-pre-wrap">
                        {selectedIdea.copy}
                      </pre>
                      <button
                        onClick={() => handleCopyToClipboard(selectedIdea.copy, 'legenda')}
                        className="absolute top-2 right-2 p-1.5 bg-dark-700/80 hover:bg-dark-600 text-white rounded-lg border border-dark-600 transition-colors"
                        title="Copiar Legenda"
                      >
                        <HiOutlineClipboardCopy className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Story copy */}
                    {selectedIdea.story && (
                      <div className="relative group text-left">
                        <span className="block text-[10px] font-bold text-dark-400 uppercase mb-2">Texto do Story</span>
                        <pre className="w-full p-4 bg-dark-950 border border-dark-600/50 rounded-xl text-xs text-slate-350 leading-relaxed font-sans whitespace-pre-wrap">
                          {selectedIdea.story}
                        </pre>
                        <button
                          onClick={() => handleCopyToClipboard(selectedIdea.story, 'story')}
                          className="absolute top-2 right-2 p-1.5 bg-dark-700/80 hover:bg-dark-600 text-white rounded-lg border border-dark-600 transition-colors"
                          title="Copiar Story"
                        >
                          <HiOutlineClipboardCopy className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Tags */}
                    {selectedIdea.tags && selectedIdea.tags.length > 0 && (
                      <div className="text-left">
                        <span className="block text-[10px] font-bold text-dark-400 uppercase mb-2">Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedIdea.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-dark-800 border border-dark-600/60 rounded-lg text-xs font-semibold text-brand-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            <HiOutlineDocumentText className="w-16 h-16 text-dark-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">Nenhuma Ideia Selecionada</h3>
            <p className="text-sm text-dark-400 text-center max-w-sm mb-6">
              Selecione uma ideia existente no painel esquerdo ou clique em "Nova" para importar um novo objeto ou arquivo CSV.
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-5 py-2.5 gradient-brand rounded-xl text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
            >
              Criar Nova Ideia
            </button>
          </div>
        )}
      </div>

      {/* IMPORT DIALOG MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-dark-800 border border-dark-600/50 rounded-3xl overflow-hidden shadow-2xl relative animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-500" />
            
            <div className="p-6 border-b border-dark-600/50 flex justify-between items-center text-left">
              <div>
                <h3 className="font-extrabold text-white text-lg">Nova Ideia de Post</h3>
                <p className="text-xs text-dark-400">Adicione ideias colando o código em padrão JS ou enviando uma planilha CSV.</p>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-1 text-dark-400 hover:text-white rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6 text-left">
              
              {/* CSV Upload Area */}
              <div>
                <span className="block text-xs font-bold text-dark-300 uppercase tracking-wider mb-2">Importar por CSV</span>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-dark-600 hover:border-brand-500/50 rounded-2xl p-6 cursor-pointer bg-dark-700/20 hover:bg-dark-700/30 transition-all group">
                  <HiOutlineUpload className="w-8 h-8 text-dark-400 group-hover:text-brand-400 transition-colors mb-2" />
                  <span className="text-xs font-bold text-white mb-1">Selecione ou arraste seu arquivo CSV</span>
                  <span className="text-[10px] text-dark-400 text-center">Cabeçalhos suportados: dia, mes, tipo, produto, especial, titulo, hook, copy, facilidades, story, cta, objetivo, tags</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center my-1">
                <hr className="flex-1 border-dark-600/40" />
                <span className="px-3 text-xs font-bold text-dark-400">OU</span>
                <hr className="flex-1 border-dark-600/40" />
              </div>

              {/* JS Object Text Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-dark-300 uppercase tracking-wider">Colar Objeto Javascript</label>
                <textarea
                  rows="8"
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder={`dia: 1,
mes: 7,
tipo: 'estatico',
produto: 'G3ERP',
especial: 'Abertura de Julho',
titulo: 'G3ERP: o dia a dia...',
hook: 'Toda decisão...',
copy: \`📊 Julho começou...\`,
facilidades: [
  { icone: '📊', texto: 'Dashboard...' }
],
tags: ['G3ERP']`}
                  className="w-full p-4 bg-dark-900 border border-dark-600/50 rounded-2xl text-xs text-slate-300 font-mono focus:outline-none focus:border-brand-500 transition-all resize-none"
                />
              </div>

            </div>

            <div className="p-6 border-t border-dark-600/50 flex justify-end gap-3 bg-dark-850">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-dark-600 text-white rounded-xl text-xs font-bold hover:bg-dark-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleParseText}
                className="px-6 py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all"
              >
                Importar Objeto
              </button>
            </div>

          </div>
        </div>
      )}

      <PostModal
        isOpen={postModalOpen}
        onClose={() => {
          setPostModalOpen(false);
          setPromoPost(null);
        }}
        onSave={async (postData) => {
          await addPost(postData);
          setPostModalOpen(false);
          setPromoPost(null);
          toast.success('Ideia publicada como Post com sucesso!');
        }}
        editingPost={promoPost}
        initialDate={promoPost?.date}
      />
    </div>
  );
}
