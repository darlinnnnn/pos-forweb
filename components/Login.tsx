import React, { useState } from 'react';
import { Mail, Lock, Store, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import { supaDataService } from '../services/supaDataService';

interface LoginProps {
  onLogin: (email: string, storeName: string, storeId?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      if (authData.user) {
        // Fetch the store associated with this user
        const store = await supaDataService.getStoreForUser(authData.user.id);

        // If store is found, use its name. If not, use the input or default.
        // Note: In a real multi-tenant app, we might strictly enforce store existence.
        // For now, if no store found, we might show error or fallback (depending on desire).
        // Let's assume we want to use the real store name if available.
        const finalStoreName = store ? store.name : (storeName || 'My Store');
        const finalStoreId = store ? store.id : undefined;

        onLogin(email, finalStoreName, finalStoreId);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center size-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl shadow-2xl shadow-primary-500/20 text-slate-950 mb-6 transform rotate-3 transition-transform hover:rotate-0 duration-500">
            <Store size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">ElegantPOS</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Premium Business Management</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative">
          <div className="absolute top-6 right-8 text-primary-500/20">
            <Sparkles size={48} />
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Store Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-500 transition-colors">
                  <Store size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full h-14 bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-medium"
                  placeholder="e.g. Elegant Coffee House"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-medium"
                  placeholder="name@business.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-12 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 group"
            >
              {isLoading ? (
                <div className="size-5 border-4 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
          &copy; 2025 ElegantPOS System
        </p>
      </div>
    </div>
  );
};

export default Login;