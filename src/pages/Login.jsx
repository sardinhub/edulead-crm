import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useStore((state) => state.login);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Harap isi email dan kata sandi Anda.');
      return;
    }
    setIsLoading(true);
    setError('');

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-inter">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 md:p-10 z-10 mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-full max-w-[280px] h-24 mb-6 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Triesakti Institute of Airlines" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "https://api.dicebear.com/7.x/initials/svg?seed=TIA&backgroundColor=4f46e5";
              }}
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 text-center tracking-tight mb-2">Welcome Back!</h1>
          <p className="text-slate-500 text-center text-sm md:text-base">Masuk ke EduLead CRM untuk melanjutkan pekerjaan Anda.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 block">Email Address</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input 
                id="email"
                name="email"
                type="email" 
                placeholder="email@triesakti.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-sm font-medium text-slate-700 block">Password</label>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input 
                id="password"
                name="password"
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="current-password"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-indigo-600/20 transition-all group flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-50">
          <p className="text-center text-[11px] text-slate-400 font-medium tracking-wide flex flex-col gap-1">
            <span>Copyright &copy; 2026</span>
            <span className="text-slate-500">Triesakti Institute of Airlines</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
