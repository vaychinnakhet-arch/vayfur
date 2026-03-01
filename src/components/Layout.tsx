import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, FileBarChart2, Menu, X, Globe, RefreshCw } from 'lucide-react';
import { useAppContext } from '../store';

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { language, setLanguage, t, gasUrl, isSyncing, syncData, error } = useAppContext();

  const navItems = [
    { name: t('dashboard'), path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: t('floors'), path: '/floors', icon: <Building2 className="w-5 h-5" /> },
    { name: t('reports'), path: '/reports', icon: <FileBarChart2 className="w-5 h-5" /> },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-[#cd3731] sticky top-0 z-20 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <img src="https://i.postimg.cc/MHKmJ50Y/Gemini-Generated-Image-cp5b3gcp5b3gcp5b.png" alt="Vay Chinnakhet Logo" className="h-10 w-auto object-contain" />
                <span className="ml-4 text-sm font-semibold tracking-wide text-white hidden sm:block">Vay Chinnakhet Furniture Check</span>
              </div>
              <nav className="hidden sm:ml-12 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`inline-flex items-center px-1 pt-1 border-b-4 text-[15px] font-medium transition-colors ${
                        isActive
                          ? 'border-white text-white'
                          : 'border-transparent text-white/80 hover:border-white/50 hover:text-white'
                      }`}
                    >
                      {item.icon}
                      <span className="ml-2">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {gasUrl && (
                <button
                  onClick={syncData}
                  disabled={isSyncing}
                  className={`inline-flex items-center justify-center p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 transition-colors ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Sync Data"
                >
                  <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center justify-center p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                title={t('language')}
              >
                <Globe className="h-5 w-5 mr-2" />
                <span className="text-sm font-semibold uppercase">{language}</span>
              </button>
              
              <div className="flex items-center sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden bg-[#b8312c]`}>
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 text-base font-medium ${
                    isActive
                      ? 'bg-black/10 border-l-4 border-white text-white'
                      : 'border-l-4 border-transparent text-white/80 hover:bg-black/5 hover:border-white/50 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500 text-white px-4 py-3 text-center">
          <p className="text-sm font-medium">
            {t('error')}: {error}
            <button 
              onClick={syncData} 
              className="ml-4 underline hover:text-white/80"
            >
              {t('retry')}
            </button>
            <button 
              onClick={() => {
                if (confirm('This will clear local data and reload. Are you sure?')) {
                  localStorage.removeItem('vay-chinnakhet-data');
                  window.location.reload();
                }
              }}
              className="ml-4 underline hover:text-white/80"
            >
              Force Reload
            </button>
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Outlet />
      </main>
    </div>
  );
};
