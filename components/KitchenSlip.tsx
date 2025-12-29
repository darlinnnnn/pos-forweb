import React from 'react';
import { CartItem, Table } from '../types';
import { Clock, Hash } from 'lucide-react';

interface KitchenSlipProps {
  items: CartItem[];
  table: Table | null;
  orderId: string;
  cashierName: string;
  paperWidth?: '58mm' | '80mm';
}

const KitchenSlip: React.FC<KitchenSlipProps> = ({ 
  items, 
  table, 
  orderId, 
  cashierName, 
  paperWidth = '80mm' 
}) => {
  const formatTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  // Sizing based on paper width
  const is58mm = paperWidth === '58mm';
  const containerWidth = is58mm ? 'max-w-[210px]' : 'max-w-[300px]';
  const headerFontSize = is58mm ? 'text-xl' : 'text-2xl';
  const tableFontSize = is58mm ? 'text-2xl' : 'text-4xl';
  const itemFontSize = is58mm ? 'text-[13px]' : 'text-[16px]';
  const qtyFontSize = is58mm ? 'text-xl' : 'text-3xl';
  const notesFontSize = is58mm ? 'text-[11px]' : 'text-[12px]';

  return (
    <div className={`w-full ${containerWidth} bg-white text-slate-950 ${is58mm ? 'p-3' : 'p-6'} font-mono text-xs shadow-2xl leading-tight rounded-sm relative border border-slate-200 overflow-hidden`}>
      {/* Header Section */}
      <div className="text-center mb-4 border-b-2 border-black border-dashed pb-3">
        <h2 className={`${headerFontSize} font-black uppercase tracking-tighter leading-none`}>KITCHEN ORDER</h2>
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-black mt-2 bg-slate-100 py-1 rounded">
            <Clock size={10} strokeWidth={3} />
            <span className="tabular-nums">{formatDate()} {formatTime()}</span>
        </div>
      </div>

      {/* Table & Identification - High Visibility */}
      <div className={`mb-4 ${is58mm ? 'py-2' : 'py-3'} px-2 bg-slate-900 text-white rounded-lg shadow-inner text-center`}>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Table / Zone</p>
        <p className={`${tableFontSize} font-black leading-none mb-2 tracking-tighter`}>
          {table?.name || 'TAKEAWAY'}
        </p>
        <div className="flex items-center justify-center gap-2 border-t border-white/20 pt-1.5">
           <Hash size={12} className="opacity-50" />
           <span className={`${is58mm ? 'text-sm' : 'text-base'} font-black tabular-nums tracking-widest`}>{orderId}</span>
        </div>
      </div>

      <div className="mb-4 text-[10px] font-black py-1.5 border-b border-slate-300 flex justify-between uppercase tracking-widest">
         <span>SVR: {cashierName}</span>
         {table?.section && <span>{table.section}</span>}
      </div>

      {/* Items List - Optimized for High Volume & Clarity */}
      <div className="space-y-5 mb-6">
        {items.map((item, idx) => (
          <div key={idx} className="relative border-b border-slate-200 pb-4 last:border-0 last:pb-0">
            <div className="flex gap-4 items-start">
                {/* Quantity - High Contrast */}
                <div className="flex flex-col items-center shrink-0">
                    <div className={`${qtyFontSize} font-black leading-none text-slate-950`}>
                        {item.quantity}
                    </div>
                    <div className="text-[8px] font-black text-slate-400 uppercase mt-0.5 tracking-tighter">QTY</div>
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                    <p className={`${itemFontSize} font-black uppercase tracking-tight leading-[1.15] break-words text-slate-950 mb-1`}>
                      {item.name}
                    </p>
                    
                    {/* Modifiers - Indented & Clear */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="mt-1.5 space-y-1 pl-1">
                            {item.selectedOptions.map((opt, i) => (
                                <p key={i} className={`${is58mm ? 'text-[11px]' : 'text-[12px]'} font-black text-slate-700 flex items-start gap-1.5 leading-tight`}>
                                    <span className="text-slate-400 shrink-0 text-[14px] mt-[-2px] leading-none">●</span>
                                    {opt.name}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Kitchen Notes - Highlighted for Urgent Changes */}
                    {item.notes && (
                        <div className="mt-2 p-2 border-l-4 border-black bg-slate-100 rounded-r shadow-sm">
                            <p className="text-[9px] font-black uppercase leading-none mb-1 text-slate-500 tracking-widest">Instruction:</p>
                            <p className={`${notesFontSize} font-black uppercase text-red-600 leading-snug`}>
                              {item.notes}
                            </p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center pt-4 border-t-2 border-dashed border-slate-300">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items: {items.length}</p>
        <p className="text-[9px] font-black text-slate-300 uppercase italic">*** END OF KITCHEN SLIP ***</p>
      </div>

      {/* Paper Jagged Edge Detail */}
      <div className="absolute -bottom-2 left-0 w-full h-4 bg-slate-950" style={{clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div>
    </div>
  );
};

export default KitchenSlip;