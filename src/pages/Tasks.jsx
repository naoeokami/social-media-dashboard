import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { HiOutlinePlus, HiOutlineTrash, HiCheck, HiOutlineClipboardList } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

export default function Tasks() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useApp();
  const [newTask, setNewTask] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTodo(newTask.trim());
    setNewTask('');
    toast.success('Tarefa adicionada!');
  };

  const pendingCount = todos.filter(t => !t.done).length;
  const completedCount = todos.length - pendingCount;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <HiOutlineClipboardList className="w-8 h-8 text-brand-500" />
            Guia de Tarefas
          </h1>
          <p className="text-dark-300 mt-2">
            Organize suas atividades diárias e acompanhe o progresso.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-dark-800 border border-dark-600/50 rounded-xl px-4 py-2 flex flex-col items-center">
            <span className="text-2xl font-bold text-white">{pendingCount}</span>
            <span className="text-xs text-dark-300 uppercase tracking-widest">Pendentes</span>
          </div>
          <div className="bg-dark-800 border border-dark-600/50 rounded-xl px-4 py-2 flex flex-col items-center">
            <span className="text-2xl font-bold text-brand-400">{completedCount}</span>
            <span className="text-xs text-dark-300 uppercase tracking-widest">Concluídas</span>
          </div>
        </div>
      </div>

      <div className="bg-dark-800 border border-dark-600/50 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleAddTask} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="Nova tarefa... (ex: Publicar reels do restaurante)"
            className="flex-1 px-5 py-3.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all shadow-inner"
          />
          <button
            type="submit"
            className="px-6 py-3.5 gradient-brand rounded-xl text-white font-medium hover:shadow-lg hover:shadow-brand-500/25 transition-all flex items-center gap-2"
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Adicionar</span>
          </button>
        </form>

        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center py-12 text-dark-400">
              <HiOutlineClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nenhuma tarefa no momento. Adicione uma acima!</p>
            </div>
          ) : (
            todos.map(todo => (
              <div
                key={todo.id}
                className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  todo.done 
                    ? 'bg-dark-700/30 border-dark-600/30 opacity-60' 
                    : 'bg-dark-700/50 border-dark-600/50 hover:border-dark-500 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      todo.done 
                        ? 'bg-brand-500 border-brand-500' 
                        : 'border-dark-400 hover:border-brand-400'
                    }`}
                  >
                    {todo.done && <HiCheck className="w-4 h-4 text-white" />}
                  </button>
                  <span className={`text-base font-medium transition-all ${todo.done ? 'line-through text-dark-400' : 'text-white'}`}>
                    {todo.text}
                  </span>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-600/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Excluir tarefa"
                >
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
