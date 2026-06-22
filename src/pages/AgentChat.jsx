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
  HiOutlineTrash
} from 'react-icons/hi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';

const fallbackGeminiModels = [];
const fallbackOpenRouterModels = [];

export default function AgentChat() {
  const { products, segments, posts } = useApp();
  
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

  // DB Models State
  const [dbModels, setDbModels] = useState([]);
  const [newModelName, setNewModelName] = useState('');
  const [newModelValue, setNewModelValue] = useState('');
  const [newModelProvider, setNewModelProvider] = useState('openrouter');

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

  // Mention / Autocomplete State
  const [mentionType, setMentionType] = useState(null); // '@' or '#' or null
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionTriggerPos, setMentionTriggerPos] = useState(null);
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/([@#])([^\s]*)$/);

    if (match) {
      setMentionType(match[1]); // '@' or '#'
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

    try {
      const contextMessage = `Você é um Agente IA versátil e proativo. Siga rigorosamente estas diretrizes:

1. ADAPTAÇÃO DE CONTEXTO E IDENTIDADE: Analise a minha pergunta e responda de acordo com o contexto dela.
   - Se for relacionado a marketing, vendas ou redes sociais: atue como um Especialista em Marketing Digital de alto nível. Use tom persuasivo, focado em conversão, engajamento e métricas.
   - Se for sobre qualquer outro assunto: adapte sua persona e conhecimento para ser um especialista naquele assunto específico, respondendo da forma mais útil e adequada ao contexto.
2. AUXÍLIO COM PRODUTOS: Quando eu for registrar ou criar novos produtos, seja proativo e me ajude a criar descrições altamente atrativas, chamativas e otimizadas para venda.
3. MISSÃO DE MARKETING (Sempre que aplicável): Ajude a planejar conteúdo, campanhas, cronogramas de postagem e forneça opções criativas variadas para redes sociais.

Aqui está o contexto atual do meu negócio (lido diretamente do aplicativo):
- Segmentos de Mercado Ativos: ${segments.map(s => s.name).join(', ') || 'Nenhum segmento customizado ainda.'}.
- Produtos Cadastrados: ${products.map(p => p.name + ' (Segmento: ' + (p.segment || 'Sem segmento') + ')').join(', ') || 'Nenhum produto cadastrado.'}.

Sempre forneça as respostas utilizando formatação Markdown para facilitar a leitura.`;

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
        
        const result = await chatSession.sendMessage(userMsgWithContext);
        const responseText = result.response.text();

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
      console.error('Erro ao chamar o modelo:', error);
      const errorMessage = error?.message || 'Verifique as chaves e a rede.';
      toast.error(`Falha na IA: ${errorMessage}`);
      setMessages(prev => prev.slice(0, -1));
      setInput(userMsg);
    } finally {
      setIsLoading(false);
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

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Config Panel */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Provider Selector */}
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">Provedor</label>
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

                  {/* Provider Settings */}
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

                {/* Right DB Models Management */}
                <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-dark-600/50 pt-6 lg:pt-0 lg:pl-8 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Modelos no Banco (Supabase)</h4>
                    
                    {dbModels.length === 0 ? (
                      <p className="text-xs text-dark-400 italic bg-dark-900/50 p-3 rounded-xl border border-dark-700/50">
                        Nenhum modelo customizado adicionado ao banco ainda. Usando modelos padrões.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {dbModels.map(model => (
                          <div 
                            key={model.id}
                            className="flex items-center justify-between p-2.5 bg-dark-900/50 border border-dark-700/50 rounded-xl text-xs"
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
                              onClick={() => handleDeleteModel(model.id)}
                              className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all flex-shrink-0"
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
                  <form onSubmit={handleAddModel} className="bg-dark-750/30 p-4 border border-dark-600/30 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">Adicionar Novo Modelo</h5>
                    
                    <div>
                      <label className="block text-[11px] text-dark-300 mb-1">Provedor</label>
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
                      <label className="block text-[11px] text-dark-300 mb-1">Nome de Exibição</label>
                      <input
                        type="text"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="Ex: DeepSeek R1"
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-600/50 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500 placeholder-dark-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-dark-300 mb-1">ID/Valor do Modelo</label>
                      <input
                        type="text"
                        value={newModelValue}
                        onChange={(e) => setNewModelValue(e.target.value)}
                        placeholder="Ex: deepseek/deepseek-reasoner"
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-600/50 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500 placeholder-dark-500 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-brand-500/10"
                    >
                      Salvar Modelo
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-dark-600/50 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
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
                  className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-brand-500/10 text-white border border-brand-500/20 rounded-tr-sm' 
                      : 'bg-dark-700/50 text-dark-100 border border-dark-600/50 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                     <ReactMarkdown 
                        className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-a:text-brand-400 marker:text-brand-500 prose-headings:text-brand-300"
                     >
                       {msg.content}
                     </ReactMarkdown>
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
            ))}

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
                  {mentionType === '@' ? 'Marcar Produto' : 'Marcar Segmento'}
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

            <form onSubmit={handleSubmit} className="flex gap-3">
               <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: Crie ideias de reels para o Produto X..."
                    className="w-full pl-5 pr-12 py-4 bg-dark-900 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all shadow-inner"
                    disabled={isLoading}
                  />
               </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-4 gradient-brand rounded-xl text-white font-medium hover:shadow-lg hover:shadow-brand-500/25 transition-all disabled:opacity-50 flex items-center justify-center min-w-[64px]"
              >
                <HiOutlinePaperAirplane className="w-6 h-6 rotate-90" />
              </button>
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
