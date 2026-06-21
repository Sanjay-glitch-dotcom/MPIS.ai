import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Shield, LayoutDashboard, Target, Activity, Users, Settings, LogOut, Bell, FolderOpen, ShieldCheck } from 'lucide-react';
import NotificationsMenu from './NotificationsMenu';
import UserMenu from './UserMenu';
import HeaderBreakTimer from './HeaderBreakTimer';

const PoliceLayout = () => {
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
    { name: 'Command Center', path: '/police', icon: LayoutDashboard },
    { name: 'Verification Center', path: '/police/matches', icon: ShieldCheck },
    { name: 'Case Files', path: '/police/cases', icon: FolderOpen },
    { name: 'Team Management', path: '/police/team', icon: Users },
  ];

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-[#020617]"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (user.role !== 'POLICE') {
    return <div className="h-screen flex items-center justify-center bg-black text-blue-500 font-bold uppercase tracking-widest text-2xl">Access Denied. Law Enforcement Clearance Required.</div>;
  }

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-72 flex flex-col bg-[#0f172a]/90 backdrop-blur-3xl border-r border-blue-500/10 relative z-20">
        <div className="p-6 pb-2">
          <Link to="/police" className="flex items-center group">
            <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30 mr-3 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-white uppercase">Police</h1>
              <p className="text-[10px] text-blue-400 font-mono tracking-widest uppercase">Command Center</p>
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
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
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
        {/* Background Flares */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none z-0" />

        {/* Top Toolbar */}
        <header className="h-16 border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 relative z-50 shadow-sm">
          <div className="flex items-center text-xs md:text-sm font-medium text-slate-400">
            <span className="animate-pulse w-2 h-2 rounded-full bg-blue-500 mr-2" /> <span className="hidden sm:inline">MPIS Network Connected</span>
            <HeaderBreakTimer />
          </div>
          <div className="flex items-center space-x-2 md:space-x-6">
            <NotificationsMenu />
            <div className="flex items-center pl-2 md:pl-6 border-l border-white/10 space-x-2 md:space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-white whitespace-nowrap">Officer {user?.last_name}</p>
                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Investigator</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shadow-inner text-xs md:text-base shrink-0">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <UserMenu basePath="/police" />
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

export default PoliceLayout;
