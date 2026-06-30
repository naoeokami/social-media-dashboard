import { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  HiOutlineSparkles, 
  HiOutlinePaperAirplane, 
  HiOutlineChat, 
  HiOutlineX,
  HiCheck,
  HiOutlineClipboard
} from 'react-icons/hi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabase';

export default function DashboardQuickChat() {
  const { 
    products, segments, posts, todos, addPost, addTodo, 
    addSwipeItem, addProduct, addSegment, addNote, addEvent, user 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! Sou seu assistente IA integrado. Posso te ajudar a consultar posts, criar tarefas, cadastrar produtos, registrar anotações ou agendar posts. O que quer fazer hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedActions, setResolvedActions] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const extractDraftAction = (text) => {
    if (!text) return { action: null, cleanContent: '' };
    const match = text.match(/\[\[ACTION_DRAFT:\s*(\{[\s\S]*?\})\s*\]\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        const cleanContent = text.replace(/\[\[ACTION_DRAFT:[\s\S]*?\]\]/g, '').trim();
        return { action: parsed, cleanContent };
      } catch (e) {
        console.error("Erro ao analisar JSON no Quick Chat:", e);
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
      toast.success('Ação executada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao executar ação.');
    }
  };

  const handleRejectAction = (msgIdx) => {
    setResolvedActions(prev => ({ ...prev, [msgIdx]: 'rejected' }));
    toast.error('Ação cancelada.');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const provider = localStorage.getItem('@g3_agent_provider') || 'gemini';
    const geminiModel = localStorage.getItem('@g3_agent_gemini_model') || 'gemini-2.5-flash';
    const openRouterModel = localStorage.getItem('@g3_agent_openrouter_model') || 'google/gemini-2.5-flash';
    const customGeminiKey = localStorage.getItem('@g3_agent_custom_gemini_key') || '';
    const customOpenRouterKey = localStorage.getItem('@g3_agent_custom_openrouter_key') || '';

    try {
      const contextMessage = `Você é o MKTDASH Assistente IA. Você ajuda a gerenciar posts, comandas, tarefas e produtos.
Além de conversar, você tem o poder de executar ações no aplicativo enviando comandos em blocos JSON no final da sua resposta.

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

Sempre forneça as respostas utilizando formatação Markdown para facilitar a leitura.`;

      if (provider === 'gemini') {
        const apiKey = customGeminiKey || import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('Chave de API do Gemini não configurada!');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: geminiModel });

        const history = messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        const chatSession = model.startChat({
          history: [...history],
          generationConfig: { temperature: 0.7 }
        });

        const userMsgWithContext = `${contextMessage}\n\n[Mensagem do Usuário]: ${userMsg}`;
        const result = await chatSession.sendMessage(userMsgWithContext);
        const responseText = result.response.text();

        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      } else {
        const apiKey = customOpenRouterKey || import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!apiKey) throw new Error('Chave de API do OpenRouter não configurada!');

        const openRouterMessages = [
          { role: 'system', content: contextMessage },
          ...messages.map(msg => ({
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
            "X-Title": "MKTDASH Social Media Quick Chat"
          },
          body: JSON.stringify({
            model: openRouterModel,
            messages: openRouterMessages,
            temperature: 0.7
          })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content;
        if (!responseText) throw new Error('Resposta vazia');

        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Erro no assistente: ${err.message || 'Verifique as chaves e rede.'}`);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua solicitação.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-80 h-96 sm:w-96 sm:h-[450px] bg-dark-800 border border-dark-600/80 rounded-2xl flex flex-col shadow-2xl overflow-hidden mb-4 animate-scale-up">
          {/* Header */}
          <div className="p-3 bg-dark-850 border-b border-dark-600/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Assistente IA</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-dark-700 rounded-lg text-dark-350 hover:text-white transition-colors"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-transparent">
            {messages.map((msg, idx) => {
              const { action, cleanContent } = extractDraftAction(msg.content);
              const status = resolvedActions[idx];

              return (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed text-left ${
                    msg.role === 'user'
                      ? 'bg-brand-500/15 text-white border border-brand-500/20'
                      : 'bg-dark-750 text-dark-100 border border-dark-650'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({node, ...props}) => (
                              <div className="overflow-x-auto my-2 w-full max-w-full scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-transparent">
                                <table className="min-w-full divide-y divide-dark-600/30 border border-dark-600/30 rounded-lg overflow-hidden" {...props} />
                              </div>
                            ),
                            thead: ({node, ...props}) => <thead className="bg-dark-800/40" {...props} />,
                            th: ({node, ...props}) => <th className="px-2 py-1 text-left text-[10px] font-bold text-brand-300 uppercase tracking-wider border-b border-dark-600/30 whitespace-nowrap" {...props} />,
                            td: ({node, ...props}) => <td className="px-2 py-1.5 text-[10px] text-dark-200 border-b border-dark-700/30 whitespace-normal break-words" {...props} />,
                            tr: ({node, ...props}) => <tr className="hover:bg-dark-700/20 transition-colors" {...props} />,
                          }}
                          className="prose prose-invert prose-xs max-w-none text-left prose-p:leading-relaxed"
                        >
                          {cleanContent}
                        </ReactMarkdown>

                        {action && (
                          status === 'approved' ? (
                            <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-400 font-semibold">
                              ✓ Ação executada!
                            </div>
                          ) : status === 'rejected' ? (
                            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 font-semibold">
                              ✕ Rejeitado.
                            </div>
                          ) : (
                            <div className="mt-2 p-3 bg-dark-900 border border-brand-500/30 rounded-lg flex flex-col gap-2 text-left">
                              <span className="text-[9px] font-bold text-brand-400 uppercase tracking-wider block">
                                Confirmar: {
                                  action.type === 'add_post' ? 'Agendar Post' :
                                  action.type === 'add_todo' ? 'Registrar Tarefa' :
                                  action.type === 'add_product' ? 'Registrar Produto' :
                                  action.type === 'add_segment' ? 'Registrar Segmento' :
                                  action.type === 'add_swipe' ? 'Adicionar Swipe' :
                                  action.type === 'add_idea' ? 'Criar Ideia' :
                                  action.type === 'add_event' ? 'Agendar Evento' :
                                  action.type === 'add_note' ? 'Criar Anotação' : 'Ação'
                                }
                              </span>
                              <div className="text-[10px] text-slate-355 space-y-0.5">
                                {action.type === 'add_post' && <p><strong>Título:</strong> {action.data.title}<br/><strong>Data:</strong> {action.data.date}</p>}
                                {action.type === 'add_todo' && <p><strong>Tarefa:</strong> {action.data.text}<br/><strong>Urgência:</strong> {action.data.urgency}</p>}
                                {action.type === 'add_product' && <p><strong>Produto:</strong> {action.data.name}</p>}
                                {action.type === 'add_segment' && <p><strong>Segmento:</strong> {action.data.name}</p>}
                                {action.type === 'add_swipe' && <p><strong>Swipe:</strong> {action.data.title}</p>}
                                {action.type === 'add_idea' && <p><strong>Ideia:</strong> {action.data.titulo}</p>}
                                {action.type === 'add_event' && <p><strong>Evento:</strong> {action.data.title}</p>}
                                {action.type === 'add_note' && <p><strong>Nota:</strong> {action.data.title}</p>}
                              </div>
                              <div className="flex gap-2 justify-end mt-1 border-t border-dark-750 pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleRejectAction(idx)}
                                  className="px-2 py-1 border border-dark-600 bg-dark-800 text-[9px] text-white font-bold rounded"
                                >
                                  Recusar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApproveAction(action, idx)}
                                  className="px-2 py-1 gradient-brand text-[9px] text-white font-bold rounded"
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
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-dark-750 text-dark-400 border border-dark-650 p-3 rounded-xl text-xs flex items-center gap-1.5 animate-pulse">
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </span>
                  Digitando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-dark-850 border-t border-dark-650 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Fale com o assistente..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-dark-900 border border-dark-600/50 rounded-xl text-xs text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 gradient-brand rounded-xl text-white hover:scale-105 transition-all disabled:opacity-50"
            >
              <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
            </button>
          </form>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full gradient-brand text-white flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-brand-500/25 transition-all"
        title="Chat rápido com Assistente IA"
      >
        {isOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineSparkles className="w-6 h-6" />}
      </button>
    </div>
  );
}
