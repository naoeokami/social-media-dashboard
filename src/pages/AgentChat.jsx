import { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  HiOutlineSparkles, 
  HiOutlinePaperAirplane, 
  HiCube, 
  HiOutlineTag, 
  HiOutlineCalendar, 
  HiOutlineChat, 
  HiOutlinePlus, 
  HiOutlineCog, 
  HiOutlineEye, 
  HiOutlineEyeOff,
  HiOutlineTrash,
  HiOutlineClipboard,
  HiCheck
} from 'react-icons/hi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabase';

const fallbackGeminiModels = [];
const fallbackOpenRouterModels = [];

export default function AgentChat() {
  const { 
    products, segments, posts, skills, addSkill, deleteSkill,
    addPost, todos, addTodo, addSwipeItem, addProduct, addSegment,
    addNote, addEvent, user
  } = useApp();
  
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('@g3_agent_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 1,
        title: 'Nova Conversa',
        messages: [
          {
            role: 'assistant',
            content: 'Olá! Sou seu Agente IA Versátil. Posso te ajudar atuando como Especialista em Marketing e Social Media (inclusive criando descrições atrativas para seus produtos), ou me adaptar a qualquer outro assunto em que você precise de ajuda. Como posso ser útil hoje?'
          }
        ]
      }
    ];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = localStorage.getItem('@g3_agent_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0].id;
      } catch (e) {}
    }
    return 1;
  });

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState(() => localStorage.getItem('@g3_agent_provider') || 'gemini');
  const [geminiModel, setGeminiModel] = useState(() => localStorage.getItem('@g3_agent_gemini_model') || 'gemini-2.5-flash');
  const [openRouterModel, setOpenRouterModel] = useState(() => localStorage.getItem('@g3_agent_openrouter_model') || 'google/gemini-2.5-flash');
  const [customGeminiKey, setCustomGeminiKey] = useState(() => localStorage.getItem('@g3_agent_custom_gemini_key') || '');
  const [customOpenRouterKey, setCustomOpenRouterKey] = useState(() => localStorage.getItem('@g3_agent_custom_openrouter_key') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [settingsTab, setSettingsTab] = useState('provider'); // 'provider' | 'models' | 'skills'

  // DB Models State
  const [dbModels, setDbModels] = useState([]);
  const [newModelName, setNewModelName] = useState('');
  const [newModelValue, setNewModelValue] = useState('');
  const [newModelProvider, setNewModelProvider] = useState('openrouter');

  // Skill Form State
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillPrompt, setNewSkillPrompt] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const [resolvedActions, setResolvedActions] = useState({});

  const extractDraftAction = (text) => {
    if (!text) return { action: null, cleanContent: '' };
    const match = text.match(/\[\[ACTION_DRAFT:\s*(\{[\s\S]*?\})\s*\]\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        const cleanContent = text.replace(/\[\[ACTION_DRAFT:[\s\S]*?\]\]/g, '').trim();
        return { action: parsed, cleanContent };
      } catch (e) {
        console.error("Erro ao analisar JSON da ação:", e);
      }
    }
    return { action: null, cleanContent: text };
  };

  const handleApproveAction = async (action, msgIdx) => {
    const data = action.data;
    try {
      if (action.type === 'add_post') {
        await addPost(data);
      } else if (action.type === 'add_todo') {
        await addTodo(data.text, data.urgency);
      } else if (action.type === 'add_product') {
        await addProduct({ name: data.name, segment: data.segment || '', description: data.description || '' });
      } else if (action.type === 'add_segment') {
        await addSegment(data.name);
      } else if (action.type === 'add_swipe') {
        await addSwipeItem({ title: data.title, url: data.url || '', category: data.category || 'Trend', notes: data.notes || '' });
      } else if (action.type === 'add_idea') {
        const savedIdeas = localStorage.getItem('socialhub_ideas');
        const currentIdeas = savedIdeas ? JSON.parse(savedIdeas) : [];
        const newIdea = {
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('socialhub_ideas', JSON.stringify([newIdea, ...currentIdeas]));
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const hasSupabaseConfig = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('cole_sua');
        if (hasSupabaseConfig && user) {
          await supabase.from('post_ideas').insert({
            id: newIdea.id,
            user_id: user.id,
            ...data
          });
        }
      } else if (action.type === 'add_event') {
        await addEvent({
          title: data.title,
          startTime: data.start_time || data.startTime,
          endTime: data.end_time || data.endTime || data.start_time || data.startTime
        });
      } else if (action.type === 'add_note') {
        await addNote({
          title: data.title,
          content: data.content || '',
          date: data.date,
          color: data.color || '#6366f1'
        });
      }
      setResolvedActions(prev => ({ ...prev, [msgIdx]: 'approved' }));
      toast.success('Ação registrada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao executar ação.');
    }
  };

  const handleRejectAction = (msgIdx) => {
    setResolvedActions(prev => ({ ...prev, [msgIdx]: 'rejected' }));
    toast.error('Ação cancelada.');
  };

  // Load Models from Supabase
  useEffect(() => {
    async function loadDbModels() {
      try {
        const { data, error } = await supabase
          .from('ai_models')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        if (data) setDbModels(data);
      } catch (err) {
        console.warn('Tabela ai_models não encontrada ou offline, usando local fallbacks.', err);
      }
    }
    loadDbModels();
  }, []);

  // Compute available models
  const currentProviderModels = dbModels.length > 0
    ? dbModels.filter(m => m.provider === provider)
    : (provider === 'gemini' ? fallbackGeminiModels : fallbackOpenRouterModels);

  // Add Model Handler
  const handleAddModel = async (e) => {
    e.preventDefault();
    if (!newModelName.trim() || !newModelValue.trim()) {
      toast.error('Preencha o nome e o identificador do modelo.');
      return;
    }

    const newModel = {
      provider: newModelProvider,
      name: newModelName.trim(),
      value: newModelValue.trim(),
      is_active: true
    };

    try {
      const { data, error } = await supabase.from('ai_models').insert(newModel).select();
      if (error) throw error;

      const inserted = data?.[0] || { ...newModel, id: crypto.randomUUID() };
      setDbModels(prev => [...prev, inserted]);
      
      if (newModelProvider === 'gemini') {
        setGeminiModel(newModel.value);
      } else {
        setOpenRouterModel(newModel.value);
      }

      setNewModelName('');
      setNewModelValue('');
      toast.success('Modelo adicionado ao Supabase!');
    } catch (err) {
      console.warn('Erro ao inserir no Supabase, adicionando localmente:', err);
      const localInsert = { ...newModel, id: `local-${Date.now()}` };
      setDbModels(prev => [...prev, localInsert]);
      
      if (newModelProvider === 'gemini') {
        setGeminiModel(newModel.value);
      } else {
        setOpenRouterModel(newModel.value);
      }

      setNewModelName('');
      setNewModelValue('');
      toast.success('Modelo adicionado temporariamente na sessão local.');
    }
  };

  // Delete Model Handler
  const handleDeleteModel = async (id) => {
    try {
      if (id && !id.toString().startsWith('local-')) {
        const { error } = await supabase.from('ai_models').delete().eq('id', id);
        if (error) throw error;
      }
      setDbModels(prev => prev.filter(m => m.id !== id));
      toast.success('Modelo removido com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Falha ao remover o modelo.');
    }
  };

  // Add Skill Handler
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim() || !newSkillPrompt.trim()) {
      toast.error('Preencha o nome e a instrução/prompt da Skill.');
      return;
    }

    // Format skill name: remove spaces with underscores and remove special chars
    const formattedName = newSkillName.trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w\d]/g, '');

    if (!formattedName) {
      toast.error('Nome de skill inválido.');
      return;
    }

    const newSkill = {
      name: formattedName,
      description: newSkillDesc.trim(),
      prompt: newSkillPrompt.trim()
    };

    try {
      await addSkill(newSkill);
      setNewSkillName('');
      setNewSkillDesc('');
      setNewSkillPrompt('');
      toast.success(`Skill *${formattedName} adicionada!`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar a Skill.');
    }
  };

  // Delete Skill Handler
  const handleDeleteSkillLocal = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta Skill?')) return;
    try {
      await deleteSkill(id);
      toast.success('Skill excluída com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir a Skill.');
    }
  };

  // Copy to Clipboard Handler
  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Resposta copiada!');
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Cancel Response Generation Handler
  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      toast.success('Geração cancelada!');
    }
  };

  // Save chatHistory to localStorage
  useEffect(() => {
    localStorage.setItem('@g3_agent_chats', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('@g3_agent_provider', provider);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem('@g3_agent_gemini_model', geminiModel);
  }, [geminiModel]);

  useEffect(() => {
    localStorage.setItem('@g3_agent_openrouter_model', openRouterModel);
  }, [openRouterModel]);

  useEffect(() => {
    localStorage.setItem('@g3_agent_custom_gemini_key', customGeminiKey);
  }, [customGeminiKey]);

  useEffect(() => {
    localStorage.setItem('@g3_agent_custom_openrouter_key', customOpenRouterKey);
  }, [customOpenRouterKey]);

  const activeChat = chatHistory.find(c => c.id === activeChatId) || chatHistory[0];
  const messages = activeChat?.messages || [];

  const setMessages = (setter) => {
    setChatHistory(prevHistory => prevHistory.map(chat => {
      if (chat.id === activeChatId) {
        const newMessages = typeof setter === 'function' ? setter(chat.messages) : setter;
        let newTitle = chat.title;
        if (newMessages.length === 2 && chat.title === 'Nova Conversa') {
           newTitle = newMessages[1].content.slice(0, 25) + '...';
        }
        return { ...chat, messages: newMessages, title: newTitle };
      }
      return chat;
    }));
  };

  const handleNewChat = () => {
    const newId = Date.now();
    setChatHistory(prev => [
      {
        id: newId,
        title: 'Nova Conversa',
        messages: [
          {
            role: 'assistant',
            content: 'Olá! Sou seu Agente IA Versátil. Posso te ajudar atuando como Especialista em Marketing e Social Media (inclusive criando descrições atrativas para seus produtos), ou me adaptar a qualquer outro assunto em que você precise de ajuda. Como posso ser útil hoje?'
          }
        ]
      },
      ...prev
    ]);
    setActiveChatId(newId);
    setInput('');
  };

  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir esta conversa?')) {
      return;
    }
    const updatedHistory = chatHistory.filter(c => c.id !== chatId);
    if (updatedHistory.length === 0) {
      const newId = Date.now();
      const defaultChat = {
        id: newId,
        title: 'Nova Conversa',
        messages: [
          {
            role: 'assistant',
            content: 'Olá! Sou seu Agente IA Versátil. Posso te ajudar atuando como Especialista em Marketing e Social Media (inclusive criando descrições atrativas para seus produtos), ou me adaptar a qualquer outro assunto em que você precise de ajuda. Como posso ser útil hoje?'
          }
        ]
      };
      setChatHistory([defaultChat]);
      setActiveChatId(newId);
    } else {
      setChatHistory(updatedHistory);
      if (activeChatId === chatId) {
        setActiveChatId(updatedHistory[0].id);
      }
    }
    toast.success('Conversa excluída com sucesso!');
  };

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Mention / Autocomplete State
  const [mentionType, setMentionType] = useState(null); // '@' or '#' or '*' or null
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionTriggerPos, setMentionTriggerPos] = useState(null);
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/([@#\*])([^\s]*)$/);

    if (match) {
      setMentionType(match[1]); // '@' or '#' or '*'
      setMentionQuery(match[2]); // search query
      setMentionTriggerPos(cursor - match[0].length);
      setMentionIndex(0);
    } else {
      setMentionType(null);
      setMentionQuery('');
      setMentionTriggerPos(null);
    }
  };

  const suggestions = mentionType === '@'
    ? products.filter(p => p.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : mentionType === '#'
      ? segments.filter(s => s.name.toLowerCase().includes(mentionQuery.toLowerCase()))
      : mentionType === '*'
        ? (skills || []).filter(s => s.name.toLowerCase().includes(mentionQuery.toLowerCase()))
        : [];

  const selectSuggestion = (suggestion) => {
    if (!mentionType || mentionTriggerPos === null) return;
    
    const text = input;
    const before = text.slice(0, mentionTriggerPos);
    const after = text.slice(inputRef.current?.selectionStart || text.length);
    
    const replacement = `${mentionType}${suggestion.name} `;
    const newInputValue = before + replacement + after;
    
    setInput(newInputValue);
    setMentionType(null);
    setMentionQuery('');
    setMentionTriggerPos(null);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = mentionTriggerPos + replacement.length;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleKeyDown = (e) => {
    if (mentionType && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectSuggestion(suggestions[mentionIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setMentionType(null);
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setMentionType(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Extract any skill mentions like *Copywriting_AIDA
    const skillMentions = [...userMsg.matchAll(/\*([\w\d_]+)/g)].map(m => m[1]);
    let activeSkillsPrompts = '';
    
    if (skillMentions.length > 0 && skills && skills.length > 0) {
      skillMentions.forEach(mention => {
        const foundSkill = skills.find(s => s.name.toLowerCase() === mention.toLowerCase());
        if (foundSkill) {
          activeSkillsPrompts += `\n- Habilidade [${foundSkill.name}]: ${foundSkill.prompt}\n`;
        }
      });
    }

    let skillsContext = '';
    if (activeSkillsPrompts) {
      skillsContext = `\n\nDiretrizes de Habilidades Ativas para esta Resposta (Você deve incorporar e aplicar os prompts abaixo):\n${activeSkillsPrompts}`;
    }

    try {
      const contextMessage = `Você é um Agente IA de Marketing e Assistente de Gestão. Além de conversar, você tem o poder de executar ações no aplicativo enviando comandos em blocos JSON no final da sua resposta.

IMPORTANTE: Antes de registrar qualquer informação (agendar post, criar tarefa, etc), você DEVE primeiro verificar as informações com o usuário. Para isso, crie um "Rascunho de Ação" enviando o bloco [[ACTION_DRAFT: ...]] no final de sua mensagem. O usuário verá uma caixa de diálogo para Aprovar ou Rejeitar a ação. Somente se o usuário aprovar, a ação será realizada.

Exemplos de blocos que você pode anexar no final de sua resposta:
- Agendar um Post:
[[ACTION_DRAFT: {"type": "add_post", "data": {"title": "Título", "caption": "Legenda completa", "date": "2026-07-15", "time": "12:00", "contentType": "Reels", "platforms": ["Instagram"]}}]]
- Registrar uma Tarefa (Todo):
[[ACTION_DRAFT: {"type": "add_todo", "data": {"text": "Fazer tal coisa", "urgency": "alta"}}]]
- Registrar um Produto:
[[ACTION_DRAFT: {"type": "add_product", "data": {"name": "Nome", "segment": "Segmento", "description": "desc"}}]]
- Registrar um Segmento:
[[ACTION_DRAFT: {"type": "add_segment", "data": {"name": "Nome do Segmento"}}]]
- Registrar um Swipe File (Referência):
[[ACTION_DRAFT: {"type": "add_swipe", "data": {"title": "Título", "url": "https://...", "category": "Trend", "notes": "Notas"}}]]
- Registrar uma Ideia de Post:
[[ACTION_DRAFT: {"type": "add_idea", "data": {"dia": 1, "mes": 7, "tipo": "estatico", "produto": "G3ERP", "titulo": "Título", "hook": "Gancho", "copy": "Legenda", "facilidades": [{"icone": "📊", "texto": "texto"}], "story": "Story", "cta": "cta", "objetivo": "objetivo", "tags": ["G3ERP"]}}]]
- Agendar Evento:
[[ACTION_DRAFT: {"type": "add_event", "data": {"title": "Reunião", "start_time": "2026-07-01T10:00", "end_time": "2026-07-01T11:00"}}]]
- Registrar Anotação (Note):
[[ACTION_DRAFT: {"type": "add_note", "data": {"title": "Lembrete", "content": "Conteúdo da nota", "date": "2026-07-01", "color": "#6366f1"}}]]

Quando o usuário perguntar quantos posts tem em determinado mês/período, você pode analisar e contar com base nos posts atuais listados abaixo:
${JSON.stringify(posts.map(p => ({ title: p.title, date: p.date, status: p.status, type: p.contentType, platforms: p.platforms })))}

Aqui está o contexto atual do meu negócio (lido diretamente do aplicativo):
- Segmentos de Mercado Ativos: ${segments.map(s => s.name).join(', ') || 'Nenhum segmento customizado ainda.'}.
- Produtos Cadastrados: ${products.map(p => p.name + ' (Segmento: ' + (p.segment || 'Sem segmento') + ')').join(', ') || 'Nenhum produto cadastrado.'}.
- Tarefas Pendentes (Todos): ${todos.filter(t=>!t.done).map(t=>t.text).join(', ') || 'Nenhuma tarefa pendente.'}.

Sempre forneça as respostas utilizando formatação Markdown para facilitar a leitura.${skillsContext}`;

      if (provider === 'gemini') {
        const apiKey = customGeminiKey || import.meta.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
          throw new Error('Chave de API do Gemini não encontrada! Por favor, insira nas Configurações da IA (ícone de engrenagem) ou defina VITE_GEMINI_API_KEY no arquivo .env.local.');
        }

        // Config Google Gen AI (Gemini)
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: geminiModel,
        });

        // Preparar as mensagens do histórico no formato exato que a API v1beta espera
        const history = messages.slice(1).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));
        
        const chatSession = model.startChat({
          history: [...history],
          generationConfig: {
            temperature: 0.7,
          }
        });

        const userMsgWithContext = `${contextMessage}\n\n[Mensagem do Usuário]: ${userMsg}`;
        
        let resultPromise = chatSession.sendMessage(userMsgWithContext);

        // Wrap the SDK promise to support AbortController
        const responseText = await Promise.race([
          resultPromise.then(res => res.response.text()),
          new Promise((_, reject) => {
            const abort = () => reject(new DOMException('Aborted', 'AbortError'));
            if (controller.signal.aborted) abort();
            controller.signal.addEventListener('abort', abort);
          })
        ]);

        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

      } else {
        // OpenRouter Integration
        const apiKey = customOpenRouterKey || import.meta.env.VITE_OPENROUTER_API_KEY;

        if (!apiKey) {
          throw new Error('Chave de API do OpenRouter não encontrada! Por favor, insira nas Configurações da IA (ícone de engrenagem) ou defina VITE_OPENROUTER_API_KEY no arquivo .env.local.');
        }

        // Build messages in OpenAI compatible style
        const openRouterMessages = [
          { role: 'system', content: contextMessage },
          ...messages.slice(1).map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: 'user', content: userMsg }
        ];

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          signal: controller.signal,
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "MKTDASH Social Media"
          },
          body: JSON.stringify({
            model: openRouterModel,
            messages: openRouterMessages,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Erro HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('OpenRouter API Response:', data);

        if (data?.error) {
          throw new Error(data.error.message || `Erro do OpenRouter: ${JSON.stringify(data.error)}`);
        }

        const responseText = data.choices?.[0]?.message?.content;
        
        if (!responseText) {
          throw new Error(`Resposta vazia recebida do OpenRouter. Resposta bruta: ${JSON.stringify(data)}`);
        }

        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      }

    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('aborted') || controller.signal.aborted) {
        console.log('Geração de texto cancelada pelo usuário.');
        return;
      }
      console.error('Erro ao chamar o modelo:', error);
      const errorMessage = error?.message || 'Verifique as chaves e a rede.';
      toast.error(`Falha na IA: ${errorMessage}`);
      setMessages(prev => prev.slice(0, -1));
      setInput(userMsg);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] md:h-[100vh] flex flex-col animate-fade-in relative z-10">
      
      {/* Header Info Banner */}
      <div className="flex-shrink-0 flex items-center justify-between bg-dark-800 border border-brand-500/30 rounded-2xl p-4 shadow-xl mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <HiOutlineSparkles className="w-7 h-7 text-brand-500" />
            Agente IA de Marketing
          </h1>
          <p className="text-dark-300 text-sm mt-1">
            Conectado via {provider === 'gemini' ? 'Google Gemini' : 'OpenRouter'} ({provider === 'gemini' ? geminiModel : openRouterModel})
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs font-medium text-dark-300">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/50 border border-dark-600/50">
              <HiOutlineTag className="text-brand-400 w-4 h-4" /> {segments.length} Segmentos
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/50 border border-dark-600/50">
              <HiCube className="text-brand-400 w-4 h-4" /> {products.length} Produtos
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-xl border transition-all ${
              showSettings 
                ? 'bg-brand-500/10 text-brand-400 border-brand-500/30' 
                : 'bg-dark-750 text-dark-300 border-dark-600/50 hover:text-white hover:bg-dark-700'
            }`}
            title="Configurações da IA"
          >
            <HiOutlineCog className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden relative">
        {/* Sidebar History */}
        <div className="hidden md:flex w-64 flex-shrink-0 flex-col bg-dark-800 border border-dark-600/50 rounded-2xl shadow-xl p-4 gap-4 overflow-hidden">
          <button 
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-xl transition-all"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Novo Chat
          </button>
          
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-dark-600/50 scrollbar-track-transparent pr-1">
            {chatHistory.map(chat => (
              <div
                key={chat.id}
                className={`group w-full flex items-center justify-between rounded-xl transition-all ${
                  activeChatId === chat.id 
                    ? 'bg-dark-700 border border-dark-600/50 text-brand-400 font-medium' 
                    : 'text-dark-400 hover:bg-dark-700/50 hover:text-dark-200'
                }`}
              >
                <button
                  onClick={() => setActiveChatId(chat.id)}
                  className="flex-1 text-left px-4 py-3 flex items-center gap-3 min-w-0"
                >
                  <HiOutlineChat className={`w-5 h-5 flex-shrink-0 ${activeChatId === chat.id ? 'text-brand-400' : 'text-dark-500'}`} />
                  <span className="truncate text-sm">{chat.title}</span>
                </button>
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="p-2 mr-2 text-dark-500 hover:text-red-400 rounded-lg hover:bg-dark-600/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Excluir Conversa"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Box / Main Panel */}
        <div className="flex-1 bg-dark-800 border border-dark-600/50 rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
          
          {/* Settings Overlay Panel */}
          {showSettings && (
            <div className="absolute inset-0 bg-dark-900/98 backdrop-blur-md z-30 p-6 flex flex-col animate-fade-in overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between pb-4 border-b border-dark-600/50 mb-6 flex-shrink-0">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <HiOutlineCog className="w-5 h-5 text-brand-400" />
                  Configurações do Provedor de IA
                </h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  Confirmar e Fechar
                </button>
              </div>

              {/* Tab Selector Navigation */}
              <div className="flex border-b border-dark-700 mb-6 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSettingsTab('provider')}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                    settingsTab === 'provider'
                      ? 'border-brand-500 text-brand-400 font-bold bg-brand-500/5'
                      : 'border-transparent text-dark-300 hover:text-white hover:bg-dark-800/30'
                  }`}
                >
                  <HiOutlineCog className="w-4 h-4" />
                  Provedores & Chaves
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('models')}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                    settingsTab === 'models'
                      ? 'border-brand-500 text-brand-400 font-bold bg-brand-500/5'
                      : 'border-transparent text-dark-300 hover:text-white hover:bg-dark-800/30'
                  }`}
                >
                  <HiCube className="w-4 h-4" />
                  Modelos de IA
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('skills')}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                    settingsTab === 'skills'
                      ? 'border-brand-500 text-brand-400 font-bold bg-brand-500/5'
                      : 'border-transparent text-dark-300 hover:text-white hover:bg-dark-800/30'
                  }`}
                >
                  <HiOutlineSparkles className="w-4 h-4" />
                  Skills & Habilidades
                </button>
              </div>

              <div className="flex-1 overflow-y-auto w-full py-2">
                {/* 1. Provider & Keys Tab */}
                {settingsTab === 'provider' && (
                  <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                    {/* Provider Selector */}
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-2">Provedor de Inteligência Artificial</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setProvider('gemini')}
                          className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                            provider === 'gemini'
                              ? 'bg-brand-500/10 text-brand-400 border-brand-500/40'
                              : 'bg-dark-750 text-dark-400 border-dark-600/50 hover:bg-dark-700 hover:text-dark-200'
                          }`}
                        >
                          Google Gemini
                        </button>
                        <button
                          type="button"
                          onClick={() => setProvider('openrouter')}
                          className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                            provider === 'openrouter'
                              ? 'bg-brand-500/10 text-brand-400 border-brand-500/40'
                              : 'bg-dark-750 text-dark-400 border-dark-600/50 hover:bg-dark-700 hover:text-dark-200'
                          }`}
                        >
                          OpenRouter
                        </button>
                      </div>
                    </div>

                    {/* Provider Settings Details */}
                    {provider === 'gemini' ? (
                      <div className="space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-2">Modelo Gemini Selecionado</label>
                          <select
                            value={geminiModel}
                            onChange={(e) => setGeminiModel(e.target.value)}
                            className="w-full px-4 py-3 bg-dark-900 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all"
                          >
                            {currentProviderModels.map(m => (
                              <option key={m.value} value={m.value}>{m.name || m.value}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-dark-200">
                              Chave de API Customizada (Opcional)
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="text-dark-400 hover:text-white transition-all"
                            >
                              {showApiKey ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                            </button>
                          </div>
                          <input
                            type={showApiKey ? "text" : "password"}
                            value={customGeminiKey}
                            onChange={(e) => setCustomGeminiKey(e.target.value)}
                            placeholder="Deixe vazio para usar do arquivo .env.local"
                            className="w-full px-4 py-3 bg-dark-900 border border-dark-600/50 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all shadow-inner"
                          />
                          <p className="text-xs text-dark-400 mt-1.5">
                            Se não configurada aqui, utilizará a variável <code className="text-brand-400">VITE_GEMINI_API_KEY</code> do seu arquivo local.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-2">Modelo OpenRouter Selecionado</label>
                          <select
                            value={openRouterModel}
                            onChange={(e) => setOpenRouterModel(e.target.value)}
                            className="w-full px-4 py-3 bg-dark-900 border border-dark-600/50 rounded-xl text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all"
                          >
                            {currentProviderModels.map(m => (
                              <option key={m.value} value={m.value}>{m.name || m.value}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-dark-200">
                              Chave de API OpenRouter (Opcional)
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="text-dark-400 hover:text-white transition-all"
                            >
                              {showApiKey ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                            </button>
                          </div>
                          <input
                            type={showApiKey ? "text" : "password"}
                            value={customOpenRouterKey}
                            onChange={(e) => setCustomOpenRouterKey(e.target.value)}
                            placeholder="sk-or-v1-..."
                            className="w-full px-4 py-3 bg-dark-900 border border-dark-600/50 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all shadow-inner"
                          />
                          <p className="text-xs text-dark-400 mt-1.5">
                            Se não configurada aqui, utilizará a variável <code className="text-brand-400">VITE_OPENROUTER_API_KEY</code> do seu arquivo local.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Custom Models Tab */}
                {settingsTab === 'models' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto animate-fade-in items-start">
                    {/* Models List */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">Modelos Registrados (Supabase)</h4>
                      {dbModels.length === 0 ? (
                        <p className="text-xs text-dark-400 italic bg-dark-900/50 p-4 rounded-xl border border-dark-700/50">
                          Nenhum modelo customizado adicionado ao banco ainda. Usando modelos padrões.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                          {dbModels.map(model => (
                            <div 
                              key={model.id}
                              className="flex items-center justify-between p-3 bg-dark-750/30 border border-dark-700/50 rounded-xl text-xs"
                            >
                              <div className="truncate pr-2">
                                <div className="font-semibold text-white truncate">{model.name}</div>
                                <div className="text-dark-400 font-mono truncate">{model.value}</div>
                                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  model.provider === 'gemini' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                                }`}>
                                  {model.provider.toUpperCase()}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteModel(model.id)}
                                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all flex-shrink-0"
                                title="Remover Modelo"
                              >
                                <HiOutlineTrash className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Model Form */}
                    <form onSubmit={handleAddModel} className="bg-dark-750/30 p-5 border border-dark-600/30 rounded-xl space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Adicionar Novo Modelo</h4>
                      
                      <div>
                        <label className="block text-xs text-dark-350 mb-1">Provedor</label>
                        <select
                          value={newModelProvider}
                          onChange={(e) => setNewModelProvider(e.target.value)}
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-600/50 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                          <option value="openrouter">OpenRouter</option>
                          <option value="gemini">Google Gemini</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-dark-350 mb-1">Nome de Exibição</label>
                        <input
                          type="text"
                          value={newModelName}
                          onChange={(e) => setNewModelName(e.target.value)}
                          placeholder="Ex: DeepSeek R1"
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-600/50 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500 placeholder-dark-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-dark-350 mb-1">ID / Valor do Modelo</label>
                        <input
                          type="text"
                          value={newModelValue}
                          onChange={(e) => setNewModelValue(e.target.value)}
                          placeholder="Ex: deepseek/deepseek-reasoner"
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-600/50 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500 placeholder-dark-500 font-mono"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-brand-500/10"
                      >
                        Salvar Modelo
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. AI Skills Tab */}
                {settingsTab === 'skills' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto animate-fade-in items-start">
                    {/* Left Column: Skills List & Tips */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Habilidades Cadastradas (Skills)</h4>
                        {(skills || []).length === 0 ? (
                          <p className="text-xs text-dark-400 italic bg-dark-900/50 p-4 rounded-xl border border-dark-700/50">
                            Nenhuma skill cadastrada ainda.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
                            {(skills || []).map(skill => (
                              <div 
                                key={skill.id}
                                className="flex items-center justify-between p-3 bg-dark-750/30 border border-dark-700/50 rounded-xl text-xs"
                              >
                                <div className="truncate pr-2">
                                  <div className="font-semibold text-white truncate flex items-center gap-1">
                                    <span className="text-brand-400 font-mono font-bold">*</span>
                                    {skill.name}
                                  </div>
                                  <div className="text-dark-400 truncate text-[11px] mt-0.5">{skill.description}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSkillLocal(skill.id)}
                                  className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all flex-shrink-0"
                                  title="Remover Skill"
                                >
                                  <HiOutlineTrash className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Inspiration sites */}
                      <div className="bg-brand-500/5 border border-brand-500/10 p-4 rounded-xl">
                        <h5 className="text-xs font-bold text-brand-300 mb-1">💡 Obter Prompts & Inspirações</h5>
                        <p className="text-[11px] text-dark-450 mb-3 leading-relaxed">
                          Você pode buscar prompts profissionais prontos para copiar e usar nestes sites:
                        </p>
                        <div className="space-y-2 text-xs">
                          <a href="https://prompts.chat" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-brand-400 hover:underline">
                            <span>Awesome ChatGPT Prompts</span>
                            <span className="text-[10px] bg-brand-500/15 px-2 py-0.5 rounded font-mono text-brand-300">prompts.chat</span>
                          </a>
                          <a href="https://prompthero.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-brand-400 hover:underline">
                            <span>PromptHero (Biblioteca)</span>
                            <span className="text-[10px] bg-brand-500/15 px-2 py-0.5 rounded font-mono text-brand-300">prompthero.com</span>
                          </a>
                          <a href="https://flowgpt.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-brand-400 hover:underline">
                            <span>FlowGPT (Galeria de Prompts)</span>
                            <span className="text-[10px] bg-brand-500/15 px-2 py-0.5 rounded font-mono text-brand-300">flowgpt.com</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Add Skill Form */}
                    <form onSubmit={handleAddSkill} className="bg-dark-750/30 p-5 border border-dark-600/30 rounded-xl space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Nova Habilidade da IA</h4>
                      
                      <div>
                        <label className="block text-xs text-dark-350 mb-1">Nome da Skill (sem espaços)</label>
                        <input
                          type="text"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="Ex: Copywriting_Vendas"
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-600/50 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500 placeholder-dark-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-dark-350 mb-1">Descrição Curta</label>
                        <input
                          type="text"
                          value={newSkillDesc}
                          onChange={(e) => setNewSkillDesc(e.target.value)}
                          placeholder="Ex: Habilidade focada na estrutura AIDA"
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-600/50 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500 placeholder-dark-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-dark-350 mb-1">Prompt / Instruções da Habilidade</label>
                        <textarea
                          value={newSkillPrompt}
                          onChange={(e) => setNewSkillPrompt(e.target.value)}
                          placeholder="Ex: Escreva usando ganchos fortes, tom ativo..."
                          rows={4}
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-600/50 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500 placeholder-dark-500 resize-none font-sans"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-brand-500/10"
                      >
                        Salvar Habilidade
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-dark-600/50 scrollbar-track-transparent">
            {messages.map((msg, idx) => {
              const { action, cleanContent } = extractDraftAction(msg.content);
              const status = resolvedActions[idx];
              
              return (
                <div
                  key={idx}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full gradient-brand shadow-lg shadow-brand-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <HiOutlineSparkles className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div 
                    className={`max-w-[85%] md:max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-md relative group/msg ${
                      msg.role === 'user' 
                        ? 'bg-brand-500/10 text-white border border-brand-500/20 rounded-tr-sm' 
                        : 'bg-dark-700/50 text-dark-100 border border-dark-600/50 rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleCopyText(msg.content, idx)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-dark-800/80 hover:bg-dark-900 text-dark-300 hover:text-white border border-dark-600/30 opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-opacity z-20"
                        title="Copiar resposta por completo"
                      >
                        {copiedId === idx ? (
                          <HiCheck className="w-4 h-4 text-green-400" />
                        ) : (
                          <HiOutlineClipboard className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {msg.role === 'assistant' ? (
                      <>
                        <ReactMarkdown 
                           remarkPlugins={[remarkGfm]}
                           components={{
                             table: ({node, ...props}) => (
                               <div className="overflow-x-auto my-4 scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-transparent">
                                 <table className="min-w-full divide-y divide-dark-600/30 border border-dark-600/30 rounded-xl overflow-hidden" {...props} />
                               </div>
                             ),
                             thead: ({node, ...props}) => <thead className="bg-dark-800/40" {...props} />,
                             th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-semibold text-brand-300 uppercase tracking-wider border-b border-dark-600/30" {...props} />,
                             td: ({node, ...props}) => <td className="px-3 py-2 text-xs text-dark-200 border-b border-dark-700/30 whitespace-nowrap" {...props} />,
                             tr: ({node, ...props}) => <tr className="hover:bg-dark-700/20 transition-colors" {...props} />,
                           }}
                           className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-a:text-brand-400 marker:text-brand-500 prose-headings:text-brand-300"
                        >
                          {cleanContent}
                        </ReactMarkdown>

                        {action && (
                          status === 'approved' ? (
                            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2 font-semibold">
                              ✓ Ação aprovada e executada com sucesso!
                            </div>
                          ) : status === 'rejected' ? (
                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2 font-semibold">
                              ✕ Ação rejeitada pelo usuário.
                            </div>
                          ) : (
                            <div className="mt-3 p-4 bg-dark-900 border border-brand-500/30 rounded-xl flex flex-col gap-3 text-left">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                                  Confirmar Ação: {
                                    action.type === 'add_post' ? 'Agendar Post' :
                                    action.type === 'add_todo' ? 'Registrar Tarefa' :
                                    action.type === 'add_product' ? 'Registrar Produto' :
                                    action.type === 'add_segment' ? 'Registrar Segmento' :
                                    action.type === 'add_swipe' ? 'Adicionar ao Swipe File' :
                                    action.type === 'add_idea' ? 'Criar Ideia de Post' :
                                    action.type === 'add_event' ? 'Agendar Evento' :
                                    action.type === 'add_note' ? 'Criar Anotação' : 'Executar Ação'
                                  }
                                </span>
                              </div>
                              <div className="text-xs text-slate-300 space-y-1">
                                {action.type === 'add_post' && <p><strong>Título:</strong> {action.data.title}<br/><strong>Data:</strong> {action.data.date} às {action.data.time}</p>}
                                {action.type === 'add_todo' && <p><strong>Tarefa:</strong> {action.data.text}<br/><strong>Urgência:</strong> {action.data.urgency}</p>}
                                {action.type === 'add_product' && <p><strong>Produto:</strong> {action.data.name}<br/><strong>Segmento:</strong> {action.data.segment}</p>}
                                {action.type === 'add_segment' && <p><strong>Segmento:</strong> {action.data.name}</p>}
                                {action.type === 'add_swipe' && <p><strong>Título:</strong> {action.data.title}<br/><strong>Categoria:</strong> {action.data.category}</p>}
                                {action.type === 'add_idea' && <p><strong>Ideia:</strong> {action.data.titulo}<br/><strong>Produto:</strong> {action.data.produto}</p>}
                                {action.type === 'add_event' && <p><strong>Evento:</strong> {action.data.title}<br/><strong>Início:</strong> {action.data.start_time || action.data.startTime}</p>}
                                {action.type === 'add_note' && <p><strong>Título:</strong> {action.data.title}<br/><strong>Conteúdo:</strong> {action.data.content}</p>}
                              </div>
                              <div className="flex gap-2 justify-end mt-1 border-t border-dark-750 pt-3">
                                <button
                                  onClick={() => handleRejectAction(idx)}
                                  className="px-3 py-1.5 border border-dark-600 bg-dark-800 hover:bg-dark-750 text-white rounded-lg text-[10px] font-bold transition-all"
                                >
                                  Rejeitar
                                </button>
                                <button
                                  onClick={() => handleApproveAction(action, idx)}
                                  className="px-3 py-1.5 gradient-brand text-white rounded-lg text-[10px] font-bold hover:shadow-md transition-all"
                                >
                                  Aprovar
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  
                  {msg.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-dark-700 border border-dark-600 shadow-md flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-dark-300 font-bold text-sm">EU</span>
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-4 justify-start animate-pulse">
                <div className="w-10 h-10 rounded-full gradient-brand/50 flex items-center justify-center flex-shrink-0 mt-1">
                  <HiOutlineSparkles className="w-5 h-5 text-white/50" />
                </div>
                <div className="bg-dark-700/30 text-dark-300 border border-dark-600/30 p-4 rounded-2xl rounded-tl-sm text-sm flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </span>
                  Gerando resposta...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-dark-800 border-t border-dark-600/50 relative z-10">
            {/* Mention Suggestions Dropdown */}
            {mentionType && suggestions.length > 0 && (
              <div className="absolute bottom-full left-4 mb-2 bg-dark-900 border border-dark-600/60 rounded-xl shadow-2xl w-64 max-h-48 overflow-y-auto z-40 p-1 divide-y divide-dark-700/50">
                <div className="px-3 py-1.5 text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                  {mentionType === '@' ? 'Marcar Produto' : mentionType === '#' ? 'Marcar Segmento' : 'Ativar Skill da IA'}
                </div>
                {suggestions.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(item);
                    }}
                    onMouseEnter={() => setMentionIndex(index)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 transition-all ${
                      index === mentionIndex
                        ? 'bg-brand-500/25 text-white font-medium shadow-md shadow-brand-500/5'
                        : 'text-dark-300 hover:text-dark-100'
                    }`}
                  >
                    <span className="text-brand-400 font-bold">{mentionType}</span>
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            )}

             <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                <div className="flex-1 relative">
                   <textarea
                     ref={inputRef}
                     rows={1}
                     value={input}
                     onChange={handleInputChange}
                     onKeyDown={handleKeyDown}
                     placeholder="Ex: Crie ideias de reels para o Produto X... (Shift + Enter para pular linha)"
                     className="w-full pl-5 pr-12 py-3.5 bg-dark-900 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all shadow-inner resize-none min-h-[48px] max-h-[140px] scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-transparent"
                     disabled={isLoading}
                   />
                </div>
               {isLoading ? (
                 <button
                   type="button"
                   onClick={handleCancelGeneration}
                   className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all flex items-center justify-center min-w-[64px] h-[48px]"
                   title="Cancelar geração de texto"
                 >
                   <div className="w-3.5 h-3.5 bg-white rounded-sm"></div>
                 </button>
               ) : (
                 <button
                   type="submit"
                   disabled={!input.trim()}
                   className="px-6 py-3.5 gradient-brand rounded-xl text-white font-medium hover:shadow-lg hover:shadow-brand-500/25 transition-all disabled:opacity-50 flex items-center justify-center min-w-[64px] h-[48px]"
                 >
                   <HiOutlinePaperAirplane className="w-6 h-6 rotate-90" />
                 </button>
               )}
             </form>
            <div className="mt-3 text-center text-xs text-dark-400">
               O Agente possui conhecimento das configurações do seu negócio gravadas no site.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
