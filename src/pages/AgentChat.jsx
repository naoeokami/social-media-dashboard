import { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { HiOutlineSparkles, HiOutlinePaperAirplane, HiCube, HiOutlineTag, HiOutlineCalendar, HiOutlineChat, HiOutlinePlus } from 'react-icons/hi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

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
            content: 'Olá! Sou seu Agente IA focado em marketing e social media. Como posso ajudar a planejar seu conteúdo hoje?'
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

  // Save to localStorage whenever chatHistory changes
  useEffect(() => {
    localStorage.setItem('@g3_agent_chats', JSON.stringify(chatHistory));
  }, [chatHistory]);

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
            content: 'Olá! Sou seu Agente IA focado em marketing e social media. Como posso ajudar a planejar seu conteúdo hoje?'
          }
        ]
      },
      ...prev
    ]);
    setActiveChatId(newId);
    setInput('');
  };

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      toast.error('Chave de API do Gemini (VITE_GEMINI_API_KEY) não encontrada no .env.local!');
      return;
    }

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      // Config Google Gen AI (Gemini)
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
      });

      // Injete o contexto como a primeira mensagem do array de histórico real
      const contextMessage = `Você é um especialista em Marketing Digital e Social Media. 
Sua missão é ajudar o usuário com planejamento de conteúdo, campanhas, cronogramas de postagem e criação de ideias criativas para as redes sociais.

Aqui está o contexto atual do negócio do usuário lido do site:
- Segmentos de Mercado Ativos: ${segments.map(s => s.name).join(', ') || 'Nenhum segmento customizado ainda.'}.
- Produtos Cadastrados: ${products.map(p => p.name + ' (Segmento: ' + (p.segment || 'Sem segmento') + ')').join(', ') || 'Nenhum produto cadastrado.'}.
- Total de Posts Planejados/Agendados: ${posts.length}.

Sempre forneça respostas claras, focadas em engajamento, com tone-of-voice persuasivo. Se pedirem ideias, forneça opções criativas e variadas. Responda utilizando Markdown para facilitar a leitura.
`;

      // Preparar as mensagens do histórico no formato exato que a API v1beta espera
      const history = messages.slice(1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      
      const chatSession = model.startChat({
        history: [
          ...history
        ],
        generationConfig: {
          temperature: 0.7,
        }
      });

      // Em vez de injetar o contexto no chatSession onde a API acha que as roles estão erradas, 
      // nós enviamos a instrução com o contexto diretamente para a mensagem atual
      const userMsgWithContext = `${contextMessage}\n\n[Mensagem do Usuário]: ${userMsg}`;
      
      const result = await chatSession.sendMessage(userMsgWithContext);
      const responseText = result.response.text();

      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

    } catch (error) {
      console.error('Erro ao chamar o Gemini:', error);
      const errorMessage = error?.message || 'Verifique as chaves e a rede.';
      toast.error(`Falha na IA: ${errorMessage}`);
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
          <p className="text-dark-300 text-sm mt-1">Conectado com o Google AI Studio.</p>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-dark-300">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/50 border border-dark-600/50">
            <HiOutlineTag className="text-brand-400 w-4 h-4" /> {segments.length} Segmentos
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/50 border border-dark-600/50">
            <HiCube className="text-brand-400 w-4 h-4" /> {products.length} Produtos
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/50 border border-dark-600/50">
            <HiOutlineCalendar className="text-brand-400 w-4 h-4" /> {posts.length} Posts
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
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
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                  activeChatId === chat.id 
                    ? 'bg-dark-700 border border-dark-600/50 text-brand-400 font-medium' 
                    : 'text-dark-400 hover:bg-dark-700/50 hover:text-dark-200'
                }`}
              >
                <HiOutlineChat className={`w-5 h-5 flex-shrink-0 ${activeChatId === chat.id ? 'text-brand-400' : 'text-dark-500'}`} />
                <span className="truncate text-sm">{chat.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Box */}
        <div className="flex-1 bg-dark-800 border border-dark-600/50 rounded-2xl shadow-xl flex flex-col overflow-hidden">
          
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
                Gerando planejamento...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-dark-800 border-t border-dark-600/50 relative z-10">
          <form onSubmit={handleSubmit} className="flex gap-3">
             <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
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
