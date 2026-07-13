import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useApp } from '../contexts/AppContext';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col pb-28">
      <TopBar />
      <main className="p-4 sm:p-6 flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      <Sidebar />
    </div>
  );
}
