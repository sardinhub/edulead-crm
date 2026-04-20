import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, CalendarDays, Settings, Bell, Search, Menu, Shield, ClipboardList, BarChart2, X, UserPlus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, managerOnly: true },
  { name: 'Student Database', path: '/database', icon: Users, managerOnly: true },
  { name: 'Scheduler', path: '/scheduler', icon: CalendarDays, managerOnly: true },
  { name: 'Daftar Karyawan', path: '/users', icon: Shield, managerOnly: true },
  { name: 'Settings', path: '/settings', icon: Settings, managerOnly: true },
];

const marketingNavItems = [
  { name: 'Rekap Leads', path: '/recap', icon: UserPlus },
  { name: 'Input Laporan Harian', path: '/activity', icon: ClipboardList },
  { name: 'List Monitoring', path: '/monitoring', icon: BarChart2 },
];

function Navigation({ user, location, onLinkClick }) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        if (item.managerOnly && user?.role !== 'Manager') return null;
        const isActive = location.pathname.startsWith(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <Icon className={cn('w-5 h-5', isActive ? 'text-indigo-600' : 'text-slate-400')} />
            {item.name}
          </Link>
        );
      })}

      <div className="pt-4 pb-1">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marketing Monitor</p>
      </div>
      {marketingNavItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-violet-50 text-violet-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <Icon className={cn('w-5 h-5', isActive ? 'text-violet-600' : 'text-slate-400')} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSection({ user, logout }) {
  return (
    <div className="p-4 border-t border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex flex-shrink-0 items-center justify-center overflow-hidden">
          <img src={`https://ui-avatars.com/api/?name=${user?.name?.replace(' ', '+') || 'User'}&background=c7d2fe&color=3730a3`} alt="Avatar" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate">{user?.role}</p>
        </div>
      </div>
      <button 
        onClick={() => logout()}
        className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        Log out
      </button>
    </div>
  );
}

export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout, fetchStudents, initRealtime } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  useEffect(() => {
    if (user) {
      fetchStudents();
      const channel = initRealtime();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-inter">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl flex flex-col md:hidden"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">E</span>
                  </div>
                  <span className="text-xl font-bold text-slate-900">EduLead Pro</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <Navigation user={user} location={location} onLinkClick={() => setIsSidebarOpen(false)} />
              </div>
              <UserSection user={user} logout={logout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">EduLead Pro</span>
          </div>
        </div>
        
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <Navigation user={user} location={location} />
        </div>
        
        <UserSection user={user} logout={logout} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input 
                type="text" 
                placeholder="Search leads, phone numbers..." 
                className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 relative text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Main View */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
