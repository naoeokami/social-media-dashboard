import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Schedule from './pages/Schedule';
import Approval from './pages/Approval';
import PublicApproval from './pages/PublicApproval';
import SwipeFile from './pages/SwipeFile';
import Reports from './pages/Reports';
import Tasks from './pages/Tasks';
import Products from './pages/Products';
import AgentChat from './pages/AgentChat';
import Login from './pages/Login';
import Comandas from './pages/Comandas';
import { useApp } from './contexts/AppContext';
import PostStatusModal from './components/PostStatusModal';

export default function App() {
  const { user, loadingUser, statusNotification, setStatusNotification } = useApp();

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'bg-dark-800 text-white border border-dark-600/50' }} />
      <Routes>
        <Route path="/p/:id" element={<PublicApproval />} />
        <Route path="/gerador-de-comandas" element={
          <div className="min-h-screen bg-dark-900 p-4 sm:p-6">
            <Comandas minimal={true} />
          </div>
        } />
        
        {!user ? (
          <Route path="*" element={<Login />} />
        ) : (
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/cronograma" element={<Schedule />} />
            <Route path="/aprovacao" element={<Approval />} />
            <Route path="/swipe-file" element={<SwipeFile />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/tarefas" element={<Tasks />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/comandas" element={<Comandas />} />
            <Route path="/agente" element={<AgentChat />} />
          </Route>
        )}
      </Routes>
      
      <PostStatusModal 
        isOpen={!!statusNotification} 
        onClose={() => setStatusNotification(null)}
        postTitle={statusNotification?.post?.title || ''}
        type={statusNotification?.type}
      />
    </>
  );
}
