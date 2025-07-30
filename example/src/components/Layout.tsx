import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navigation />
      <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
