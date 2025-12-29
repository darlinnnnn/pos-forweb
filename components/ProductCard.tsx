import React from 'react';
import { Product } from '../types';
import { Plus, SlidersHorizontal, Sparkles, Layers } from 'lucide-react';

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

  if (viewMode === 'list') {
    return (
      <button 
        onClick={() => onAdd(product)}
        className="group flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 text-left relative active:scale-[0.99] shadow-sm dark:shadow-lg hover:shadow-primary-500/10 p-4 gap-5"
      >
        {/* Image Area */}
        <div className="size-20 bg-slate-100 dark:bg-slate-800 relative rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-transparent transition-colors">
          <div 
            className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700" 
            style={{ backgroundImage: `url('${product.image}')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 dark:from-slate-950/60 to-transparent"></div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-black text-slate-900 dark:text-slate-100 leading-tight text-lg group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">{product.name}</h3>
              {product.stock && product.stock <= 5 && (
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-red-500 text-white uppercase tracking-widest shadow-md">Low</span>
              )}
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono tracking-[0.2em] uppercase font-bold">{product.sku}</span>
                {hasOptions && (
                    <span className="text-[10px] font-black text-primary-600 dark:text-primary-500 flex items-center gap-1.5 uppercase tracking-wider"><Layers size={12} /> Customizable</span>
                )}
            </div>
          </div>
          
          <div className="flex items-center gap-6 md:gap-12 pr-2">
               <div className="text-right">
                  {hasOptions && <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5 italic">Starts from</span>}
                  <p className="text-primary-600 dark:text-primary-400 font-black text-2xl tracking-tighter leading-none">{formatCurrency(product.price)}</p>
               </div>
               
               {/* INCREASED TAP TARGET - 48px */}
               <div className={`
                  size-12 rounded-2xl flex items-center justify-center transition-all duration-300 border shadow-lg
                  ${hasOptions 
                      ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-primary-500 group-hover:text-primary-500' 
                      : 'bg-primary-500 border-primary-400 text-slate-950 shadow-primary-500/20'
                  }
               `}>
                  {hasOptions ? <SlidersHorizontal size={20} /> : <Plus size={24} strokeWidth={3} />}
               </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button 
      onClick={() => onAdd(product)}
      className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-primary-500/50 transition-all duration-500 text-left relative active:scale-[0.97] shadow-xl hover:shadow-primary-500/10 h-full"
    >
      {/* Badge Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {product.stock && product.stock <= 5 && (
            <div className="backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black border bg-red-500/90 text-white border-red-400/50 uppercase tracking-[0.2em] shadow-lg">
                Low Stock
            </div>
        )}
        {hasOptions && (
            <div className="backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black border bg-slate-50/80 dark:bg-slate-950/80 text-primary-600 dark:text-primary-400 border-slate-200 dark:border-primary-500/30 uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                <Layers size={12} />
                Configurable
            </div>
        )}
      </div>

      {/* Image Area */}
      <div className="aspect-[4/5] w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden shrink-0">
        <div 
          className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-1000 ease-out" 
          style={{ backgroundImage: `url('${product.image}')` }}
        ></div>
        
        {/* Elegant Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 dark:opacity-90"></div>
        
        {/* Interaction Indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white text-slate-950 px-8 py-3 rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center gap-3 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                {hasOptions ? <><SlidersHorizontal size={18} /> Configure</> : <><Plus size={20} /> Quick Add</>}
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex flex-col justify-between flex-1 bg-white dark:bg-slate-900 transition-colors">
        <div className="space-y-1.5">
            <h3 className="font-black text-slate-900 dark:text-slate-100 truncate w-full leading-tight text-lg group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tracking-tight">{product.name}</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-600 font-mono tracking-[0.25em] uppercase font-bold">{product.sku}</p>
        </div>
        
        <div className="mt-5 flex items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-4 transition-colors">
             <div className="flex flex-col">
                {hasOptions && <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 italic">Starts from</span>}
                <div className="flex items-baseline gap-2">
                    <p className="text-primary-600 dark:text-primary-400 font-black text-2xl leading-none tracking-tighter">{formatCurrency(product.price)}</p>
                </div>
             </div>
             
             {/* INCREASED TAP TARGET - 48px */}
             <div className={`
                size-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-300 border shadow-md
                ${hasOptions 
                    ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-primary-500 group-hover:text-primary-500' 
                    : 'bg-primary-500 border-primary-400 text-slate-950 shadow-primary-500/30'
                }
             `}>
                {hasOptions ? <SlidersHorizontal size={22} /> : <Plus size={26} strokeWidth={3} />}
             </div>
        </div>
      </div>
    </button>
  );
};

export default ProductCard;