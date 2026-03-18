import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useApp } from '../contexts/AppContext';

export default function MainLayout() {
  const { sidebarOpen } = useApp();

  return (
    <div className="min-h-screen bg-dark-900">
      <Sidebar />
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-20'
        } ml-0`}
      >
        <TopBar />
        <main className="p-6 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
