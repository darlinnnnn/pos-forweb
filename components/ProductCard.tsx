import React from 'react';
import { Product } from '../types';
import { Plus, SlidersHorizontal, Layers } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  viewMode?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, viewMode = 'grid' }) => {
  const hasOptions = (product.optionGroups && product.optionGroups.length > 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  // Performance optimized class for GPU transitions
  const gpuClass = "transform-gpu will-change-transform transition-all duration-300";

  if (viewMode === 'list') {
    return (
      <button 
        onClick={() => onAdd(product)}
        className={`${gpuClass} group flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-primary-500 transition-colors text-left relative active:scale-[0.99] shadow-sm p-3 sm:p-4 gap-4`}
      >
        {/* Image Area */}
        <div className="size-16 sm:size-20 bg-slate-100 dark:bg-slate-800 relative rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-transparent">
          <div 
            className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500" 
            style={{ backgroundImage: `url('${product.image}')` }}
          ></div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight text-base sm:text-lg group-hover:text-primary-500 transition-colors truncate">{product.name}</h3>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-slate-400 dark:text-slate-600 font-mono font-bold">{product.sku}</span>
                {hasOptions && (
                    <span className="text-[9px] font-black text-primary-500 flex items-center gap-1 uppercase tracking-tight"><Layers size={10} /> MODS</span>
                )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
               <div className="text-right">
                  <p className="text-primary-600 dark:text-primary-400 font-black text-lg sm:text-xl tracking-tighter leading-none tabular-nums">{formatCurrency(product.price)}</p>
               </div>
               
               <div className={`
                  size-10 sm:size-12 rounded-xl flex items-center justify-center transition-all border
                  ${hasOptions 
                      ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-primary-500 group-hover:text-primary-500' 
                      : 'bg-primary-500 border-primary-400 text-slate-950 shadow-lg shadow-primary-500/20'
                  }
               `}>
                  {hasOptions ? <SlidersHorizontal size={18} /> : <Plus size={22} strokeWidth={3} />}
               </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button 
      onClick={() => onAdd(product)}
      className={`${gpuClass} group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:border-primary-500/40 text-left relative active:scale-[0.97] shadow-sm hover:shadow-md h-full`}
    >
      {/* Badge Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {product.stock && product.stock <= 5 && (
            <div className="px-2 py-0.5 rounded-lg text-[8px] font-black bg-red-500 text-white uppercase tracking-widest shadow-md">
                Low
            </div>
        )}
        {hasOptions && (
            <div className="px-2 py-0.5 rounded-lg text-[8px] font-black bg-slate-900/80 text-primary-400 border border-primary-500/30 uppercase tracking-widest shadow-md flex items-center gap-1">
                <Layers size={10} /> MODS
            </div>
        )}
      </div>

      {/* Image Area */}
      <div className="aspect-[4/5] w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden shrink-0">
        <div 
          className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700 ease-out" 
          style={{ backgroundImage: `url('${product.image}')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 bg-white dark:bg-slate-900 transition-colors">
        <div className="space-y-0.5 flex-1 min-h-[3rem]">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate w-full text-base group-hover:text-primary-500 transition-colors tracking-tight">{product.name}</h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-600 font-mono tracking-wider font-bold uppercase">{product.sku}</p>
        </div>
        
        <div className="mt-3 flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-3 transition-colors shrink-0">
             <div className="flex flex-col">
                <p className="text-primary-500 font-black text-lg leading-none tracking-tighter tabular-nums">{formatCurrency(product.price)}</p>
             </div>
             
             <div className={`
                size-10 rounded-xl flex items-center justify-center transition-all border
                ${hasOptions 
                    ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-primary-500 group-hover:text-primary-500' 
                    : 'bg-primary-500 border-primary-400 text-slate-950 shadow-lg shadow-primary-500/20'
                }
             `}>
                {hasOptions ? <SlidersHorizontal size={18} /> : <Plus size={22} strokeWidth={3} />}
             </div>
        </div>
      </div>
    </button>
  );
};

export default ProductCard;