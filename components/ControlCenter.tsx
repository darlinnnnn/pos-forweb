import React from 'react';
import { X, User, ChevronRight, LogOut, Settings, History, Wallet, XCircle, CheckCircle, LayoutDashboard } from 'lucide-react';
import { ShiftData } from '../types';

interface ControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: ShiftData;
  onOpenShiftModal: () => void;
  onOpenSettings: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout: () => void;
}

const ControlCenter: React.FC<ControlCenterProps> = ({
  isOpen,
  onClose,
  shiftData,
  onOpenShiftModal,
  onOpenSettings,
  onLogout
}) => {
  if (!isOpen) return null;

  const isShiftOpen = shiftData.isOpen;

  const menuItems = [
    {
      id: 'shift',
      title: isShiftOpen ? 'Close Shift' : 'Open Shift',
      subtitle: isShiftOpen ? 'End day & print report' : 'Start new sales session',
      icon: isShiftOpen ? <XCircle size={22} /> : <CheckCircle size={22} />,
      color: isShiftOpen ? 'text-red-500' : 'text-emerald-500',
      bgColor: isShiftOpen ? 'bg-red-500/10' : 'bg-emerald-500/10',
      action: onOpenShiftModal
    },
    {
      id: 'cash',
      title: 'Cash Drawer',
      subtitle: 'Pay in / Pay out',
      icon: <Wallet size={22} />,
      color: 'text-primary-500',
      bgColor: 'bg-primary-500/10',
      action: () => { }
    },
    {
      id: 'history',
      title: 'Shift History',
      subtitle: 'View past summaries',
      icon: <History size={22} />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      action: () => { }
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Hardware & Preferences',
      icon: <Settings size={22} />,
      color: 'text-slate-600 dark:text-slate-300',
      bgColor: 'bg-slate-100 dark:bg-slate-800',
      action: onOpenSettings
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative w-full sm:w-96 bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out border-l border-slate-200 dark:border-slate-800 transition-colors">

        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-primary-500 border border-slate-200 dark:border-slate-700 shadow-inner transition-colors">
                <LayoutDashboard size={24} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Control Center</h2>
                <div className="inline-flex px-2 py-0.5 bg-primary-400 rounded text-[10px] font-black text-slate-950 uppercase tracking-widest w-fit">
                  {shiftData.registerName || 'Unknown Register'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-11 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm dark:shadow-none"
            >
              <X size={24} />
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 transition-colors">
            <div className="size-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-primary-500 relative transition-colors">
              <User size={24} />
              <div className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-slate-50 dark:border-slate-900 ${isShiftOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{isShiftOpen ? shiftData.cashierName : 'No Active Shift'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {isShiftOpen ? 'Shift Started 08:00 AM' : 'Sign in to start'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Role</p>
              <p className="text-[10px] font-bold text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded-lg mt-0.5">Manager</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          <h3 className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Quick Actions</h3>

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.action();
                if (item.id !== 'shift' && item.id !== 'settings') onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group active:scale-[0.98] text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className={`size-12 flex items-center justify-center rounded-xl ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.subtitle}</p>
              </div>
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-slate-400 transition-colors" />
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <button
            onClick={onLogout}
            className="w-full h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all active:scale-95 group shadow-sm dark:shadow-none"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Logout & Sign Out</span>
          </button>

          <div className="flex justify-center items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            <span>v2.4.1 (Elegant)</span>
            <span className="size-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
            <span>Cloud Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlCenter;