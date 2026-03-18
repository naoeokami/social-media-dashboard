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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState({});
  const [apiKeys, setApiKeys] = useState({});

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
        return;
      }

      try {
        const [postsRes, todosRes, swipeRes, shortcutsRes, productsRes, segmentsRes] = await Promise.all([
          supabase.from('posts').select('*').order('created_at', { ascending: false }),
          supabase.from('todos').select('*').order('created_at', { ascending: true }),
          supabase.from('swipe_items').select('*').order('created_at', { ascending: false }),
          supabase.from('shortcuts').select('*').order('created_at', { ascending: true }),
          supabase.from('products').select('*').order('created_at', { ascending: true }),
          supabase.from('segments').select('*').order('created_at', { ascending: true }),
        ]);

        if (postsRes.data) setPosts(postsRes.data);
        if (todosRes.data) setTodos(todosRes.data);
        if (swipeRes.data) setSwipeItems(swipeRes.data);
        if (shortcutsRes.data) setShortcuts(shortcutsRes.data);
        if (productsRes.data) setProducts(productsRes.data);
        if (segmentsRes.data) setSegments(segmentsRes.data);
      } catch (error) {
        console.error("Erro ao carregar do Supabase:", error);
      }
    }

    loadData();
  }, []);

  // Posts CRUD
  const addPost = async (post) => {
    const newPost = { ...post, id: crypto.randomUUID() };
    setPosts(prev => [newPost, ...prev]);

    if (hasSupabaseConfig) {
      const dbPost = { ...newPost };
      if (dbPost.budget === '') dbPost.budget = null;
      if (dbPost.date === '') dbPost.date = null;
      if (dbPost.time === '') dbPost.time = null;

      const { error } = await supabase.from('posts').insert(dbPost);
      if (error) toast.error("Erro ao salvar post no banco.");
    }
    return newPost;
  };

  const updatePost = async (id, data) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    if (hasSupabaseConfig) {
      const dbPost = { ...data };
      if (dbPost.budget === '') dbPost.budget = null;
      if (dbPost.date === '') dbPost.date = null;
      if (dbPost.time === '') dbPost.time = null;

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
    const newTodo = { id: crypto.randomUUID(), text, done: false };
    setTodos(prev => [...prev, newTodo]);
    
    if (hasSupabaseConfig) {
      await supabase.from('todos').insert(newTodo);
    }
  };

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    
    if (hasSupabaseConfig) {
      await supabase.from('todos').update({ done: !todo.done }).eq('id', id);
    }
  };

  const deleteTodo = async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    if (hasSupabaseConfig) {
      await supabase.from('todos').delete().eq('id', id);
    }
  };

  // Swipe File CRUD
  const addSwipeItem = async (item) => {
    const newItem = { ...item, id: crypto.randomUUID() };
    setSwipeItems(prev => [newItem, ...prev]);
    
    if (hasSupabaseConfig) {
      await supabase.from('swipe_items').insert(newItem);
    }
    return newItem;
  };

  const deleteSwipeItem = async (id) => {
    setSwipeItems(prev => prev.filter(s => s.id !== id));
    if (hasSupabaseConfig) {
      await supabase.from('swipe_items').delete().eq('id', id);
    }
  };

  // Shortcuts CRUD
  const addShortcut = async (shortcut) => {
    const newShortcut = { ...shortcut, id: crypto.randomUUID() };
    setShortcuts(prev => [...prev, newShortcut]);
    if (hasSupabaseConfig) {
      await supabase.from('shortcuts').insert(newShortcut);
    }
  };
  
  const updateShortcut = async (id, data) => {
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    if (hasSupabaseConfig) {
      await supabase.from('shortcuts').update(data).eq('id', id);
    }
  };
  
  const deleteShortcut = async (id) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
    if (hasSupabaseConfig) {
      await supabase.from('shortcuts').delete().eq('id', id);
    }
  };

  // Products CRUD
  const addProduct = async (product) => {
    const newProduct = { ...product, id: crypto.randomUUID() };
    setProducts(prev => {
      const updated = [...prev, newProduct];
      if (!hasSupabaseConfig) localStorage.setItem('socialhub_products', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) await supabase.from('products').insert(newProduct);
  };

  const updateProduct = async (id, data) => {
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...data } : p);
      if (!hasSupabaseConfig) localStorage.setItem('socialhub_products', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) await supabase.from('products').update(data).eq('id', id);
  };

  const deleteProduct = async (id) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (!hasSupabaseConfig) localStorage.setItem('socialhub_products', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) await supabase.from('products').delete().eq('id', id);
  };

  // Segments CRUD
  const addSegment = async (name) => {
    const newSegment = { id: crypto.randomUUID(), name };
    setSegments(prev => {
      const updated = [...prev, newSegment];
      if (!hasSupabaseConfig) localStorage.setItem('socialhub_segments', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) await supabase.from('segments').insert(newSegment);
  };

  const deleteSegment = async (id) => {
    setSegments(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (!hasSupabaseConfig) localStorage.setItem('socialhub_segments', JSON.stringify(updated));
      return updated;
    });
    if (hasSupabaseConfig) await supabase.from('segments').delete().eq('id', id);
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
    posts, addPost, updatePost, deletePost,
    todos, addTodo, toggleTodo, deleteTodo,
    swipeItems, addSwipeItem, deleteSwipeItem,
    shortcuts, addShortcut, updateShortcut, deleteShortcut,
    products, addProduct, updateProduct, deleteProduct,
    segments, addSegment, deleteSegment,
    sidebarOpen, setSidebarOpen,
    profile, updateProfile,
    apiKeys, updateApiKeys
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
