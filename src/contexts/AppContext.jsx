import { createContext, useContext, useState, useEffect } from 'react';
import { initialTodos } from '../data/mockData';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [todos, setTodos] = useState([]);
  const [swipeItems, setSwipeItems] = useState([]);
  const [shortcuts, setShortcuts] = useState([]);
  const [products, setProducts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState({});
  const [apiKeys, setApiKeys] = useState({});
  const [statusNotification, setStatusNotification] = useState(null);
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Initialize Auth
  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoadingUser(false);
      return;
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load Data
  useEffect(() => {
    // Load local profile settings
    const savedProfile = localStorage.getItem('socialhub_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    const savedKeys = localStorage.getItem('socialhub_api_keys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }

    if (hasSupabaseConfig && loadingUser) return;
    if (hasSupabaseConfig && !user) {
      setPosts([]); setTodos([]); setSwipeItems([]); setShortcuts([]); setProducts([]); setSegments([]); setSchedules([]); setNotes([]); setEvents([]);
      return;
    }

    async function loadData() {
      if (!hasSupabaseConfig) {
        import('../data/mockData').then(({ initialTodos, quickShortcuts, funnelSegments }) => {
          setTodos(initialTodos);
          setShortcuts(quickShortcuts);
          setSegments(funnelSegments.map(s => ({ id: crypto.randomUUID(), name: s })));
        });
        const localProducts = localStorage.getItem('socialhub_products');
        if (localProducts) setProducts(JSON.parse(localProducts));
        const localSegments = localStorage.getItem('socialhub_segments');
        if (localSegments) setSegments(JSON.parse(localSegments));
        const localSchedules = localStorage.getItem('socialhub_schedules');
        if (localSchedules) setSchedules(JSON.parse(localSchedules));
        const localSwipe = localStorage.getItem('socialhub_swipe');
        if (localSwipe) setSwipeItems(JSON.parse(localSwipe));
        const localNotes = localStorage.getItem('socialhub_notes');
        if (localNotes) setNotes(JSON.parse(localNotes));
        const localEvents = localStorage.getItem('socialhub_events');
        if (localEvents) setEvents(JSON.parse(localEvents));
        return;
      }

      try {
        const [postsRes, todosRes, swipeRes, shortcutsRes, productsRes, segmentsRes] = await Promise.all([
          supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('todos').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
          supabase.from('swipe_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('shortcuts').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
          supabase.from('products').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
          supabase.from('segments').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        ]);

        if (postsRes.data) {
           const parsedPosts = postsRes.data.map(p => {
             if (p.fileUrl && p.fileUrl.startsWith('[')) {
                try { p.fileUrls = JSON.parse(p.fileUrl); } catch(e) { p.fileUrls = [p.fileUrl]; }
             } else if (p.fileUrl) {
                p.fileUrls = [p.fileUrl];
             }
             return p;
           });
           setPosts(parsedPosts);
        }
        if (todosRes.data && todosRes.data.length > 0) {
          const mappedTodos = todosRes.data.map(item => ({
            ...item,
            createdAt: item.created_at || item.createdAt
          }));
          
          const localTodosStr = localStorage.getItem('socialhub_todos');
          const localTodos = localTodosStr ? JSON.parse(localTodosStr) : [];
          
          const map = new Map();
          localTodos.forEach(i => map.set(i.id, i));
          mappedTodos.forEach(i => map.set(i.id, i));
          
          const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          
          setTodos(merged);
          localStorage.setItem('socialhub_todos', JSON.stringify(merged));
        } else {
          const localTodos = localStorage.getItem('socialhub_todos');
          if (localTodos) setTodos(JSON.parse(localTodos));
        }
        if (swipeRes.data) {
          const mappedSwipe = swipeRes.data.map(item => ({
            ...item,
            createdAt: item.created_at || item.createdAt
          }));
          
          const localSwipeStr = localStorage.getItem('socialhub_swipe');
          const localSwipe = localSwipeStr ? JSON.parse(localSwipeStr) : [];
          
          // Merge para não perder itens locais caso o banco falhe
          const map = new Map();
          localSwipe.forEach(i => map.set(i.id, i));
          mappedSwipe.forEach(i => map.set(i.id, i));
          
          const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          setSwipeItems(merged);
          localStorage.setItem('socialhub_swipe', JSON.stringify(merged));
        } else {
          const localSwipe = localStorage.getItem('socialhub_swipe');
          if (localSwipe) setSwipeItems(JSON.parse(localSwipe));
        }
        
        if (shortcutsRes.data) {
           const mappedShortcuts = shortcutsRes.data.map(item => ({
             ...item,
             createdAt: item.created_at || item.createdAt
           }));
           
           const localStr = localStorage.getItem('socialhub_shortcuts');
           const localData = localStr ? JSON.parse(localStr) : [];
           
           const map = new Map();
           localData.forEach(i => map.set(i.id, i));
           mappedShortcuts.forEach(i => map.set(i.id, i));
           
           const merged = Array.from(map.values());
           
           setShortcuts(merged);
           localStorage.setItem('socialhub_shortcuts', JSON.stringify(merged));
        } else {
           const local = localStorage.getItem('socialhub_shortcuts');
           if (local) setShortcuts(JSON.parse(local));
        }
        if (productsRes.data) setProducts(productsRes.data);
        if (segmentsRes.data) setSegments(segmentsRes.data);

        // Load schedules separately to avoid Promise.all failure if table doesn't exist
        try {
          const schedulesRes = await supabase.from('schedules').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
          if (schedulesRes.error) {
            const localSchedules = localStorage.getItem('socialhub_schedules');
            if (localSchedules) setSchedules(JSON.parse(localSchedules));
          } else {
            setSchedules(schedulesRes.data || []);
          }
        } catch (e) {
          const localSchedules = localStorage.getItem('socialhub_schedules');
          if (localSchedules) setSchedules(JSON.parse(localSchedules));
        }

        // Load notes and events from Supabase or localStorage
        try {
          const notesRes = await supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
          if (notesRes.data) {
            setNotes(notesRes.data.map(n => ({ ...n, createdAt: n.created_at })));
          } else {
            const localNotes = localStorage.getItem('socialhub_notes');
            if (localNotes) setNotes(JSON.parse(localNotes));
          }

          const eventsRes = await supabase.from('events').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
          if (eventsRes.data) {
            setEvents(eventsRes.data.map(e => ({ 
              ...e, 
              startTime: e.start_time, 
              endTime: e.end_time, 
              createdAt: e.created_at 
            })));
          } else {
            const localEvents = localStorage.getItem('socialhub_events');
            if (localEvents) setEvents(JSON.parse(localEvents));
          }
        } catch (e) {
          const localNotes = localStorage.getItem('socialhub_notes');
          if (localNotes) setNotes(JSON.parse(localNotes));
          const localEvents = localStorage.getItem('socialhub_events');
          if (localEvents) setEvents(JSON.parse(localEvents));
        }

      } catch (error) {
        console.error("Erro ao carregar do Supabase:", error);
      }
    }

    loadData();

    // Subscribe to realtime updates
    let postsChannel;
    if (hasSupabaseConfig && user) {
      postsChannel = supabase.channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
           console.log('Realtime change:', payload);
           
           if (payload.eventType === 'UPDATE') {
             const newPost = payload.new;
             
             // Handle unmigrated JSON array logic
             if (newPost.fileUrl && newPost.fileUrl.startsWith('[')) {
                try { newPost.fileUrls = JSON.parse(newPost.fileUrl); } catch(e) { newPost.fileUrls = [newPost.fileUrl]; }
             } else if (newPost.fileUrl) {
                newPost.fileUrls = [newPost.fileUrl];
             }

             setPosts(prev => {
                const oldPost = prev.find(p => p.id === newPost.id);
                
                // Detect Status Changes for Global Notifications
                const wasAprovacao = oldPost?.status === 'aprovacao';
                
                if (wasAprovacao) {
                   if (newPost.status === 'agendado') {
                      setStatusNotification({ post: newPost, type: 'approval' });
                   } else if (newPost.status === 'producao') {
                      setStatusNotification({ post: newPost, type: 'adjustment' });
                   }
                }

                if (!oldPost) return [newPost, ...prev];
                return prev.map(p => p.id === newPost.id ? newPost : p);
             });
           }
           
           if (payload.eventType === 'INSERT') {
              const newPost = payload.new;
              if (newPost.fileUrl && newPost.fileUrl.startsWith('[')) {
                 try { newPost.fileUrls = JSON.parse(newPost.fileUrl); } catch(e) { newPost.fileUrls = [newPost.fileUrl]; }
              } else if (newPost.fileUrl) {
                 newPost.fileUrls = [newPost.fileUrl];
              }
              setPosts(prev => {
                if (prev.some(p => p.id === newPost.id)) return prev;
                return [newPost, ...prev];
              });
           }
           
           if (payload.eventType === 'DELETE') {
              setPosts(prev => prev.filter(p => p.id !== payload.old.id));
           }
        })
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });
    }

    return () => {
      if (postsChannel) supabase.removeChannel(postsChannel);
    };
  }, [user, loadingUser]);

  // Posts CRUD
  const addPost = async (post) => {
    const newPost = { ...post, id: crypto.randomUUID() };
    setPosts(prev => [newPost, ...prev]);

    if (hasSupabaseConfig) {
      const dbPost = { ...newPost, user_id: user?.id };
      if (dbPost.budget === '') dbPost.budget = null;
      if (dbPost.date === '') dbPost.date = null;
      if (dbPost.time === '') dbPost.time = null;

      // Handle unmigrated database: serialize fileUrls into existing fileUrl column
      if (dbPost.fileUrls !== undefined) {
         if (dbPost.fileUrls.length > 0) {
            dbPost.fileUrl = JSON.stringify(dbPost.fileUrls);
         } else {
            dbPost.fileUrl = '';
         }
         delete dbPost.fileUrls;
      }

      const { error } = await supabase.from('posts').insert(dbPost);
      if (error) {
        console.error('Supabase AddPost Error:', error);
        toast.error(`Erro no Supabase: ${error.message}`);
      }
    }
    return newPost;
  };

  const updatePost = async (id, data) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    if (hasSupabaseConfig) {
      const dbPost = { ...data };
      delete dbPost.calendarType;
      delete dbPost.id;
      delete dbPost.user_id;
      delete dbPost.created_at;
      if (dbPost.budget === '') dbPost.budget = null;
      if (dbPost.date === '') dbPost.date = null;
      if (dbPost.time === '') dbPost.time = null;

      // Handle unmigrated database: serialize fileUrls into existing fileUrl column
      if (dbPost.fileUrls !== undefined) {
         if (dbPost.fileUrls.length > 0) {
            dbPost.fileUrl = JSON.stringify(dbPost.fileUrls);
         } else {
            dbPost.fileUrl = '';
         }
         delete dbPost.fileUrls;
      }

      const { error } = await supabase.from('posts').update(dbPost).eq('id', id);
      if (error) toast.error("Erro ao atualizar post.");
    }
  };

  const deletePost = async (id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) toast.error("Erro ao deletar post.");
    }
  };

  // Todos CRUD
  const addTodo = async (text) => {
    const newTodo = { id: crypto.randomUUID(), text, done: false, createdAt: new Date().toISOString() };
    setTodos(prev => {
      const updated = [...prev, newTodo];
      localStorage.setItem('socialhub_todos', JSON.stringify(updated));
      return updated;
    });
    
    if (hasSupabaseConfig) {
      const dbTodo = { ...newTodo, user_id: user?.id, created_at: newTodo.createdAt };
      delete dbTodo.createdAt; // Remove camelCase
      
      const { error } = await supabase.from('todos').insert(dbTodo);
      if (error) {
        console.error("Supabase addTodo Error:", error);
        toast.error(`Falha ao salvar tarefa no banco: ${error.message}`);
      }
    }
  };

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    setTodos(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, done: !t.done } : t);
      localStorage.setItem('socialhub_todos', JSON.stringify(updated));
      return updated;
    });
    
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('todos').update({ done: !todo.done }).eq('id', id);
      if (error) {
        console.error("Supabase toggle error:", error);
        toast.error("Tarefa salva localmente (sem conexão c/ banco).");
      }
    }
  };

  const deleteTodo = async (id) => {
    setTodos(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem('socialhub_todos', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      await supabase.from('todos').delete().eq('id', id);
    }
  };

  // Swipe File CRUD
  const addSwipeItem = async (item) => {
    const newItem = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setSwipeItems(prev => {
      const updated = [newItem, ...prev];
      localStorage.setItem('socialhub_swipe', JSON.stringify(updated));
      return updated;
    });
    
    if (hasSupabaseConfig) {
      const dbItem = { 
        ...newItem, 
        user_id: user?.id,
        created_at: newItem.createdAt 
      };
      // Remove o campo camelCase antes de enviar para evitar erro de coluna inexistente
      delete dbItem.createdAt;

      const { error } = await supabase.from('swipe_items').insert(dbItem);
      if (error) {
        console.error('Erro ao salvar Swipe:', error);
        toast.error(`Erro no banco: ${error.message}`);
      } else {
        toast.success("Referência salva no banco!");
      }
    }
    return newItem;
  };

  const deleteSwipeItem = async (id) => {
    setSwipeItems(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('socialhub_swipe', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      await supabase.from('swipe_items').delete().eq('id', id);
    }
  };

  // Shortcuts CRUD
  const addShortcut = async (shortcut) => {
    const newShortcut = { ...shortcut, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setShortcuts(prev => {
       const updated = [...prev, newShortcut];
       localStorage.setItem('socialhub_shortcuts', JSON.stringify(updated));
       return updated;
    });
    if (hasSupabaseConfig) {
      const dbItem = { ...newShortcut, user_id: user?.id, created_at: newShortcut.createdAt };
      delete dbItem.createdAt;
      
      const { error } = await supabase.from('shortcuts').insert(dbItem);
      if (error) {
        console.error('Supabase AddShortcut Error:', error);
        toast.error(`Erro ao salvar atalho: ${error.message}`);
      } else {
        toast.success("Atalho salvo no banco!");
      }
    }
  };
  
  const updateShortcut = async (id, data) => {
    setShortcuts(prev => {
       const updated = prev.map(s => s.id === id ? { ...s, ...data } : s);
       localStorage.setItem('socialhub_shortcuts', JSON.stringify(updated));
       return updated;
    });
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('shortcuts').update(data).eq('id', id);
      if (error && error.code !== '42P01') console.error('Supabase UpdateShortcut Error:', error);
    }
  };
  
  const deleteShortcut = async (id) => {
    setShortcuts(prev => {
       const updated = prev.filter(s => s.id !== id);
       localStorage.setItem('socialhub_shortcuts', JSON.stringify(updated));
       return updated;
    });
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('shortcuts').delete().eq('id', id);
      if (error && error.code !== '42P01') console.error('Supabase DeleteShortcut Error:', error);
    }
  };

  const addProduct = async (product) => {
    const newProduct = { ...product, id: crypto.randomUUID() };
    setProducts(prev => {
      const updated = [...prev, newProduct];
      if (!hasSupabaseConfig) localStorage.setItem('socialhub_products', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('products').insert({ ...newProduct, user_id: user?.id });
      if (error) {
        console.error('Supabase AddProduct Error:', error);
        toast.error("Erro ao salvar produto no banco.");
      }
    }
  };

  const updateProduct = async (id, data) => {
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...data } : p);
      if (!hasSupabaseConfig) localStorage.setItem('socialhub_products', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('products').update(data).eq('id', id);
      if (error) toast.error("Erro ao atualizar produto no banco.");
    }
  };

  const deleteProduct = async (id) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (!hasSupabaseConfig) localStorage.setItem('socialhub_products', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) await supabase.from('products').delete().eq('id', id);
  };

  const addSegment = async (name) => {
    const newSegment = { id: crypto.randomUUID(), name };
    setSegments(prev => {
      const updated = [...prev, newSegment];
      if (!hasSupabaseConfig) localStorage.setItem('socialhub_segments', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('segments').insert({ ...newSegment, user_id: user?.id });
      if (error) {
        console.error('Supabase AddSegment Error:', error);
        toast.error("Erro ao salvar segmento no banco.");
      }
    }
  };

  const deleteSegment = async (id) => {
    setSegments(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (!hasSupabaseConfig) localStorage.setItem('socialhub_segments', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('segments').delete().eq('id', id);
      if (error) toast.error("Erro ao remover segmento do banco.");
    }
  };

  // Schedules CRUD
  const addSchedule = async (schedule) => {
    const newSchedule = { ...schedule, id: crypto.randomUUID() };
    setSchedules(prev => {
      const updated = [...prev, newSchedule];
      localStorage.setItem('socialhub_schedules', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('schedules').insert({ ...newSchedule, user_id: user?.id });
      if (error) {
        console.error("Erro no Supabase Schedules:", error);
        if (error.code !== '42P01') toast.error("Falha ao salvar no banco. A tarefa ficou salva apenas localmente.");
      }
    }
  };

  const updateSchedule = async (id, data) => {
    setSchedules(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...data } : s);
      localStorage.setItem('socialhub_schedules', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('schedules').update(data).eq('id', id);
      if (error && error.code !== '42P01') console.error("Erro no Supabase update:", error);
    }
  };

  const deleteSchedule = async (id) => {
    setSchedules(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('socialhub_schedules', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error && error.code !== '42P01') console.error("Erro no Supabase delete:", error);
    }
  };

  // Notes CRUD
  const addNote = async (note) => {
    const newNote = { ...note, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setNotes(prev => {
      const updated = [newNote, ...prev];
      localStorage.setItem('socialhub_notes', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const dbNote = { 
        id: newNote.id,
        user_id: user?.id,
        title: newNote.title,
        content: newNote.content,
        date: newNote.date,
        color: newNote.color,
        created_at: newNote.createdAt 
      };
      const { error } = await supabase.from('notes').insert(dbNote);
      if (error && error.code !== '42P01') console.error("Erro no Supabase notes:", error);
    }
    return newNote;
  };

  const updateNote = async (id, data) => {
    setNotes(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, ...data } : n);
      localStorage.setItem('socialhub_notes', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const dbNote = { ...data };
      delete dbNote.createdAt;
      delete dbNote.id;
      delete dbNote.user_id;
      delete dbNote.calendarType;

      const { error } = await supabase.from('notes').update(dbNote).eq('id', id);
      if (error && error.code !== '42P01') console.error("Erro no Supabase update note:", error);
    }
  };

  const deleteNote = async (id) => {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('socialhub_notes', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error && error.code !== '42P01') console.error("Erro no Supabase delete note:", error);
    }
  };

  // Events CRUD
  const addEvent = async (event) => {
    const newEvent = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setEvents(prev => {
      const updated = [newEvent, ...prev];
      localStorage.setItem('socialhub_events', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const dbEvent = {
        id: newEvent.id,
        user_id: user?.id,
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        start_time: newEvent.startTime,
        end_time: newEvent.endTime,
        type: newEvent.type,
        created_at: newEvent.createdAt
      };
      const { error } = await supabase.from('events').insert(dbEvent);
      if (error && error.code !== '42P01') console.error("Erro no Supabase events:", error);
    }
    return newEvent;
  };

  const updateEvent = async (id, data) => {
    setEvents(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...data } : e);
      localStorage.setItem('socialhub_events', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const dbEvent = { ...data };
      if (dbEvent.startTime) {
        dbEvent.start_time = dbEvent.startTime;
        delete dbEvent.startTime;
      }
      if (dbEvent.endTime) {
        dbEvent.end_time = dbEvent.endTime;
        delete dbEvent.endTime;
      }
      delete dbEvent.createdAt;
      delete dbEvent.id;
      delete dbEvent.user_id;
      delete dbEvent.calendarType;

      const { error } = await supabase.from('events').update(dbEvent).eq('id', id);
      if (error && error.code !== '42P01') console.error("Erro no Supabase update event:", error);
    }
  };

  const deleteEvent = async (id) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem('socialhub_events', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error && error.code !== '42P01') console.error("Erro no Supabase delete event:", error);
    }
  };

  const updateProfile = (data) => {
    setProfile(data);
    localStorage.setItem('socialhub_profile', JSON.stringify(data));
  };

  const updateApiKeys = (data) => {
    setApiKeys(data);
    localStorage.setItem('socialhub_api_keys', JSON.stringify(data));
  };

  const value = {
    user, loadingUser,
    posts, addPost, updatePost, deletePost,
    todos, addTodo, toggleTodo, deleteTodo,
    swipeItems, addSwipeItem, deleteSwipeItem,
    shortcuts, addShortcut, updateShortcut, deleteShortcut,
    products, addProduct, updateProduct, deleteProduct,
    segments, addSegment, deleteSegment,
    schedules, addSchedule, updateSchedule, deleteSchedule,
    notes, addNote, updateNote, deleteNote,
    events, addEvent, updateEvent, deleteEvent,
    sidebarOpen, setSidebarOpen,
    profile, updateProfile,
    apiKeys, updateApiKeys,
    statusNotification, setStatusNotification
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
