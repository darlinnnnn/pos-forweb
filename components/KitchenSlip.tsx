import React from 'react';
import { CartItem, Table } from '../types';
import { Clock } from 'lucide-react';

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
  const containerWidth = is58mm ? 'max-w-[210px]' : 'max-w-[280px]';
  const headerFontSize = is58mm ? 'text-lg' : 'text-xl';
  const tableFontSize = is58mm ? 'text-xl' : 'text-2xl';
  const itemFontSize = is58mm ? 'text-[12px]' : 'text-sm';
  const qtyFontSize = is58mm ? 'text-base' : 'text-lg';

  return (
    <div className={`w-full ${containerWidth} bg-white text-slate-900 ${is58mm ? 'p-2' : 'p-4'} font-mono text-xs shadow-2xl leading-tight rounded-sm relative border border-slate-200`}>
      {/* Header */}
      <div className="text-center mb-3 border-b border-black border-dashed pb-2">
        <h2 className={`${headerFontSize} font-black uppercase tracking-tight`}>KITCHEN ORDER</h2>
        <div className="flex items-center justify-center gap-1 text-[9px] font-bold mt-1">
            <Clock size={9} />
            <span>{formatDate()} {formatTime()}</span>
        </div>
      </div>

      {/* Table & Order Info */}
      <div className={`flex justify-between items-start mb-2 ${is58mm ? 'py-1' : 'py-2'} px-1 bg-slate-50 rounded`}>
        <div>
            <p className="text-[9px] font-bold uppercase text-slate-500">Table</p>
            <p className={`${tableFontSize} font-black leading-none`}>{table?.name || 'TAKEAWAY'}</p>
        </div>
        <div className="text-right">
            <p className="text-[9px] font-bold uppercase text-slate-500">Order ID</p>
            <p className={`${is58mm ? 'text-xs' : 'text-sm'} font-black`}>#{orderId}</p>
        </div>
      </div>

      <div className={`mb-3 text-[9px] font-bold py-1 border-b border-slate-200 flex flex-wrap gap-x-2`}>
         <span>Svr: {cashierName}</span>
         {table?.section && <span>Sec: {table.section}</span>}
      </div>

      {/* Items List */}
      <div className="space-y-3 mb-4">
        {items.map((item, idx) => (
          <div key={idx} className="border-b border-slate-100 pb-2 last:border-0">
            <div className="flex gap-2 items-start">
                {/* Quantity */}
                <div className={`${qtyFontSize} font-black min-w-[20px]`}>
                    {item.quantity}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`${itemFontSize} font-black uppercase tracking-tight leading-snug break-words`}>{item.name}</p>
                    
                    {/* Modifiers */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                            {item.selectedOptions.map((opt, i) => (
                                <p key={i} className={`${is58mm ? 'text-[10px]' : 'text-[11px]'} font-bold text-slate-700 flex items-center gap-1`}>
                                    <span className="text-slate-400 shrink-0">→</span> {opt.name}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Kitchen Notes */}
                    {item.notes && (
                        <div className="mt-1 px-1 border-l-2 border-black bg-slate-50 italic">
                            <p className="text-[9px] font-black uppercase leading-none">Note:</p>
                            <p className={`${is58mm ? 'text-[10px]' : 'text-[11px]'} font-bold`}>{item.notes}</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-2 border-t border-dashed border-slate-300">
        <p className="text-[9px] font-bold text-slate-400 italic">Paper: {paperWidth}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">*** END OF KITCHEN SLIP ***</p>
      </div>

      {/* Jagged Edge Detail */}
      <div className="absolute -bottom-2 left-0 w-full h-4 bg-slate-900" style={{clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div>
    </div>
  );
};

export default KitchenSlip;