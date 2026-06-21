import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Shield, LayoutDashboard, Target, Activity, Users, Settings, LogOut, Bell, FolderOpen, ShieldCheck } from 'lucide-react';
import NotificationsMenu from './NotificationsMenu';
import UserMenu from './UserMenu';
import HeaderBreakTimer from './HeaderBreakTimer';

const SubPoliceLayout = () => {
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
    { name: 'Patrol Center', path: '/subpolice', icon: LayoutDashboard },
    { name: 'Verification Center', path: '/subpolice/matches', icon: ShieldCheck },
    { name: 'Case Files', path: '/subpolice/cases', icon: FolderOpen },
  ];

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-[#020617]"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (user.role !== 'SUB_POLICE') {
    return <div className="h-screen flex items-center justify-center bg-black text-cyan-500 font-bold uppercase tracking-widest text-2xl">Access Denied. Patrol Clearance Required.</div>;
  }

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-72 flex flex-col bg-[#0f172a]/90 backdrop-blur-3xl border-r border-blue-500/10 relative z-20">
        <div className="p-6 pb-2">
          <Link to="/subpolice" className="flex items-center group">
            <div className="bg-cyan-600/20 p-2 rounded-lg border border-cyan-500/30 mr-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Shield className="h-6 w-6 text-cyan-500" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-white uppercase">Patrol</h1>
              <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Field Division</p>
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
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
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
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none z-0" />

        {/* Top Toolbar */}
        <header className="h-16 border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 relative z-50 shadow-sm">
          <div className="flex items-center text-xs md:text-sm font-medium text-slate-400">
            <span className="animate-pulse w-2 h-2 rounded-full bg-cyan-500 mr-2" /> <span className="hidden sm:inline">MPIS Patrol Connected</span>
            <HeaderBreakTimer />
          </div>
          <div className="flex items-center space-x-2 md:space-x-6">
            <NotificationsMenu />
            <div className="flex items-center pl-2 md:pl-6 border-l border-white/10 space-x-2 md:space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-white whitespace-nowrap">Officer {user?.last_name}</p>
                <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Patrol Officer</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shadow-inner text-xs md:text-base shrink-0">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <UserMenu basePath="/subpolice" />
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

export default SubPoliceLayout;
