import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Plus, User, Heart, Music, Users } from 'lucide-react';

const RaveBottomTabBar: React.FC = () => {
  const location = useLocation();

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
      gradient: 'from-pink-500 to-purple-500'
    },
    {
      id: 'discover',
      label: 'Discover',
      icon: Search,
      path: '/discover',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'create',
      label: 'Create',
      icon: Plus,
      path: '/create',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-t border-white/20 md:hidden">
      {/* Safe area for mobile devices */}
      <div className="pb-safe">
        <div className="flex justify-around items-center px-6 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className="flex flex-col items-center justify-center text-xs font-medium transition-all duration-300 group relative"
              >
                <div className={`relative p-4 rounded-3xl transition-all duration-300 ${
                  active 
                    ? 'bg-gradient-to-r ' + tab.gradient + ' shadow-2xl scale-110 boltzy-glow-pink' 
                    : 'hover:bg-white/10 hover:scale-105 hover:shadow-lg'
                }`}>
                  <Icon 
                    className={`w-6 h-6 transition-all duration-300 ${
                      active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`} 
                  />
                  {active && (
                    <>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse shadow-lg" />
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 animate-pulse" />
                    </>
                  )}
                </div>
                <span className={`mt-2 transition-all duration-300 ${
                  active ? 'text-white font-bold' : 'text-gray-400 group-hover:text-white'
                }`}>
                  {tab.label}
                </span>
                {active && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-bounce" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RaveBottomTabBar;
