import React from 'react';
import { Product } from '../types';
import { Plus, SlidersHorizontal } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  // Check for the new optionGroups or fallback to old for safety
  const hasVariants = (product.optionGroups && product.optionGroups.length > 0) || 
                      (product.variants && product.variants.length > 0) || 
                      (product.addons && product.addons.length > 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <button 
      onClick={() => onAdd(product)}
      className="group flex flex-col bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden hover:ring-2 hover:ring-primary-500 hover:border-transparent transition-all duration-300 text-left relative active:scale-[0.98] shadow-lg shadow-black/20 h-full"
    >
      {/* Stock Status only */}
      {product.stock && product.stock <= 5 && (
        <div className="absolute top-2 right-2 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold z-10 border shadow-sm bg-red-500/80 text-white border-red-400/50">
           Low: {product.stock}
        </div>
      )}

      {/* Image - Clean, no badges */}
      <div className="aspect-square w-full bg-slate-700 relative overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500 ease-out" 
          style={{ backgroundImage: `url('${product.image}')` }}
        ></div>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60"></div>
        
        {/* Quick Add Overlay on Hover (Desktop) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
             {/* Icon changes based on whether it's a quick add or needs customization */}
            <div className={`
                text-slate-900 rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center
                ${hasVariants ? 'bg-white p-2.5' : 'bg-primary-500 p-2.5'}
            `}>
                {hasVariants ? <SlidersHorizontal size={20} /> : <Plus size={20} />}
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1 w-full flex-1 justify-between">
        <div>
            <h3 className="font-bold text-slate-100 truncate w-full leading-tight text-sm">{product.name}</h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-wide">{product.sku}</p>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
             <div className="flex flex-col">
                <p className="text-primary-400 font-bold text-base leading-none">{formatCurrency(product.price)}</p>
                {product.discount && (
                     <span className="text-[9px] text-slate-500 line-through decoration-slate-600">
                        {formatCurrency(product.price + product.discount)}
                     </span>
                )}
             </div>
             
             {/* Action Button - Icon Only */}
             <div className={`
                w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                ${hasVariants 
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white shadow-black/20' 
                    : 'bg-primary-500 hover:bg-primary-400 text-slate-900 shadow-primary-500/20'
                }
             `}>
                {hasVariants ? (
                    <SlidersHorizontal size={14} />
                ) : (
                    <Plus size={16} strokeWidth={3} />
                )}
             </div>
        </div>
      </div>
    </button>
  );
};

export default ProductCard;