// Storage Service - Abstracted CRUD layer (localStorage now, Supabase later)

const getItems = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setItems = (key, items) => {
  localStorage.setItem(key, JSON.stringify(items));
};

const saveItem = (key, item) => {
  const items = getItems(key);
  const newItem = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  items.push(newItem);
  setItems(key, items);
  return newItem;
};

const updateItem = (key, id, data) => {
  const items = getItems(key);
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
    setItems(key, items);
    return items[index];
  }
  return null;
};

const deleteItem = (key, id) => {
  const items = getItems(key);
  const filtered = items.filter(item => item.id !== id);
  setItems(key, filtered);
  return filtered;
};

const getItemById = (key, id) => {
  const items = getItems(key);
  return items.find(item => item.id === id) || null;
};

export { getItems, setItems, saveItem, updateItem, deleteItem, getItemById };
