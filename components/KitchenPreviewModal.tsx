import React from 'react';
import { X, Printer, CheckCircle2, ChefHat, Ruler } from 'lucide-react';
import { CartItem, Table } from '../types';
import KitchenSlip from './KitchenSlip';

interface KitchenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  table: Table | null;
  orderId: string;
  cashierName: string;
  printers: {name: string, width?: '58mm' | '80mm'}[]; // Enhanced printer list with width
}

const KitchenPreviewModal: React.FC<KitchenPreviewModalProps> = ({ 
    isOpen, 
    onClose, 
    items, 
    table, 
    orderId, 
    cashierName,
    printers 
}) => {
  if (!isOpen) return null;

  // Use the width of the first printer for the preview
  const previewWidth = printers[0]?.width || '80mm';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center justify-center py-8">
        
        {/* Left: Message and Printers Info */}
        <div className="flex-1 text-center md:text-left space-y-6 max-w-md">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 mb-2">
                <ChefHat size={18} />
                <span className="text-sm font-black uppercase tracking-widest">Order Sent to Kitchen</span>
            </div>
            
            <h2 className="text-4xl font-bold text-white tracking-tight">Printing Kitchen Slips...</h2>
            
            <p className="text-slate-400 text-lg">
                The order for <span className="text-white font-bold">{table?.name || 'Takeaway'}</span> has been processed. 
                Below is the preview for the <span className="text-emerald-400 font-bold underline decoration-emerald-500/30">{previewWidth}</span> printer.
            </p>

            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
                    <Printer size={12}/> Target Printers
                </h4>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {printers.length > 0 ? printers.map(p => (
                        <div key={p.name} className="flex flex-col gap-1 p-2 bg-slate-800 rounded-xl border border-slate-700 min-w-[120px]">
                            <div className="flex items-center gap-2 text-white text-xs font-bold">
                                <Printer size={12} className="text-primary-500" />
                                {p.name}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Ruler size={10} />
                                {p.width || '80mm'} Paper
                            </div>
                        </div>
                    )) : (
                        <p className="text-amber-400 text-sm font-bold italic">No active kitchen printers found!</p>
                    )}
                </div>
            </div>

            <button 
                onClick={onClose}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
                <CheckCircle2 size={24} />
                Continue to Register
            </button>
        </div>

        {/* Right: Thermal Slip Preview */}
        <div className="shrink-0 scale-90 sm:scale-100 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 duration-500 delay-150">
            <KitchenSlip 
              items={items} 
              table={table} 
              orderId={orderId} 
              cashierName={cashierName} 
              paperWidth={previewWidth}
            />
        </div>
      </div>
      
      <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-slate-800 text-slate-400 rounded-full hover:text-white lg:hidden">
          <X size={24} />
      </button>
    </div>
  );
};

export default KitchenPreviewModal;