import { useState } from 'react';
import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../styles/components/app-layout.css';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => setCollapsed((prev) => !prev);

  return (
    <div className={`app-layout${collapsed ? ' app-layout--collapsed' : ''}`}>
      <Topbar onMenuToggle={toggle} />
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
