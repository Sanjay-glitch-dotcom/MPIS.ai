import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { ShieldAlert, LayoutDashboard, Target, Database, Users, Settings, LogOut, Bell, ShieldCheck, FileText } from 'lucide-react';
import NotificationsMenu from './NotificationsMenu';
import UserMenu from './UserMenu';
import HeaderBreakTimer from './HeaderBreakTimer';

const AdminLayout = () => {
  const { user, logout, fetchUser, isLoading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Verification Center', path: '/admin/matches', icon: ShieldCheck },
    { name: 'Case Management', path: '/admin/cases', icon: FileText },
    { name: 'Team Management', path: '/admin/team', icon: Users },
  ];

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-[#050505]"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (user.role !== 'ADMIN') {
    return <div className="h-screen flex items-center justify-center bg-black text-red-500 font-bold uppercase tracking-widest text-2xl">Access Denied. Command Level Clearance Required.</div>;
  }

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-72 flex flex-col bg-black/80 backdrop-blur-3xl border-r border-white/5 relative z-20">
        <div className="p-6 pb-2">
          <Link to="/admin" className="flex items-center group">
            <div className="bg-primary/20 p-2 rounded-lg border border-primary/30 mr-3 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-white uppercase">Command</h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Operations Center</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(220,38,38,0.1)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5 space-y-2">
          {/* Settings and Logout moved to UserMenu */}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Background Flares for Admin Layout */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none z-0" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[150px] pointer-events-none z-0" />

        {/* Top Toolbar */}
        <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 relative z-50 shadow-sm">
          <div className="flex items-center text-xs md:text-sm font-medium text-slate-400">
            <span className="animate-pulse w-2 h-2 rounded-full bg-green-500 mr-2" /> <span className="hidden sm:inline">System Online</span>
            <HeaderBreakTimer />
          </div>
          <div className="flex items-center space-x-2 md:space-x-6">
            <NotificationsMenu />
            <div className="flex items-center pl-2 md:pl-6 border-l border-white/10 space-x-2 md:space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-white whitespace-nowrap">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Chief Admin</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold shadow-inner text-xs md:text-base shrink-0">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <UserMenu basePath="/admin" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 relative z-20">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;
