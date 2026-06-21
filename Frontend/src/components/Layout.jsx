import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Search, MapPin, User, LogOut, ShieldAlert, Database, Settings, Menu, X } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Layout = () => {
  const { user, isAuthenticated, logout, fetchUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans flex flex-col relative overflow-hidden">
      {/* Global Background Flares */}
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <nav className="bg-black/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5 shadow-lg shadow-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight">MPIS<span className="text-primary">.ai</span></span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/database" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1">
                <Database className="h-4 w-4 text-blue-400" />
                <span>Missing People</span>
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/heatmap" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span>Live Heatmap</span>
                  </Link>
                  {!['ADMIN', 'SUPERADMIN', 'POLICE'].includes(user?.role) && (
                    <>
                      <Link to="/report-missing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>Report Missing</span>
                      </Link>
                      <Link to="/submit-sighting" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>Submit Sighting</span>
                      </Link>
                    </>
                  )}

                  <div className="flex items-center space-x-6 ml-4 border-l border-slate-700 pl-6">
                    <Link 
                      to={
                        user?.role === 'ADMIN' ? '/admin' : 
                        user?.role === 'SUPERADMIN' ? '/superadmin' : 
                        user?.role === 'POLICE' ? '/police' : 
                        '/dashboard'
                      } 
                      className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1"
                    >
                      {['ADMIN', 'SUPERADMIN', 'POLICE'].includes(user?.role) ? <ShieldAlert className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
                      <span>{['ADMIN', 'SUPERADMIN', 'POLICE'].includes(user?.role) ? 'Command Center' : 'Dashboard'}</span>
                    </Link>
                    <Link to="/settings" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center space-x-1 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4 ml-4 border-l border-slate-700 pl-6">
                  <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</Link>
                  <Link to="/register" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-medium transition-all hover:shadow-lg hover:shadow-primary/20">Sign up</Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-300 hover:text-white p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-3xl border-t border-white/10 p-4 absolute w-full left-0 shadow-2xl">
            <div className="flex flex-col space-y-4">
              <Link to="/database" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5">
                <Database className="h-4 w-4 text-blue-400" />
                <span>Missing People</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link to="/heatmap" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span>Live Heatmap</span>
                  </Link>
                  {!['ADMIN', 'SUPERADMIN', 'POLICE'].includes(user?.role) && (
                    <>
                      <Link to="/report-missing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5">
                        <User className="h-4 w-4" />
                        <span>Report Missing</span>
                      </Link>
                      <Link to="/submit-sighting" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5">
                        <MapPin className="h-4 w-4" />
                        <span>Submit Sighting</span>
                      </Link>
                    </>
                  )}

                  <div className="h-px bg-white/10 my-2"></div>

                  <Link 
                    to={
                      user?.role === 'ADMIN' ? '/admin' : 
                      user?.role === 'SUPERADMIN' ? '/superadmin' : 
                      user?.role === 'POLICE' ? '/police' : 
                      '/dashboard'
                    } 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5"
                  >
                    {['ADMIN', 'SUPERADMIN', 'POLICE'].includes(user?.role) ? <ShieldAlert className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
                    <span>{['ADMIN', 'SUPERADMIN', 'POLICE'].includes(user?.role) ? 'Command Center' : 'Dashboard'}</span>
                  </Link>
                  <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                  <button 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="flex items-center space-x-2 p-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="h-px bg-white/10 my-2"></div>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors p-2 text-center border border-white/10 rounded-lg">Log in</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg text-sm font-medium transition-all text-center">Sign up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
        <Outlet />
      </main>

      <footer className="bg-black/40 backdrop-blur-xl py-8 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Missing Person Identification System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
