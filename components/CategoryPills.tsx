import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, LayoutGrid } from 'lucide-react';
import { CategoryGroup, Category } from '../types';

interface CategoryPillsProps {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  categoryGroups: CategoryGroup[];
}

const CategoryPills: React.FC<CategoryPillsProps> = ({ activeCategory, onSelectCategory, categoryGroups }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Flatten categories to find the active one for display purposes
  const allCategories = categoryGroups.flatMap(g => g.categories);
  const selectedCategory = allCategories.find(c => c.id === activeCategory) || allCategories[0];
  const totalItems = allCategories.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full z-20" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 md:h-14 bg-slate-900 border rounded-xl md:rounded-2xl px-4 flex items-center justify-between text-white transition-all shadow-inner ${isOpen ? 'border-primary-500 ring-1 ring-primary-500' : 'border-slate-800 hover:bg-slate-800'}`}
      >
        <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium text-sm uppercase tracking-wide mr-2 hidden sm:inline-block">Collection:</span>
            <div className="p-1.5 bg-slate-800 rounded-lg text-primary-500 border border-slate-700">
                {selectedCategory?.icon || <LayoutGrid size={18} />}
            </div>
            <span className="font-bold text-lg">{selectedCategory?.name}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">{totalItems} categories</span>
            <ChevronDown size={20} className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[60vh] overflow-y-auto ring-1 ring-black/50">
             <div className="p-4 space-y-6">
                 {categoryGroups.map((group) => (
                     <div key={group.id}>
                         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1 sticky top-0 bg-slate-900 z-10 py-1">
                             {group.name}
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                             {group.categories.map((cat) => (
                                 <button
                                    key={cat.id}
                                    onClick={() => {
                                        onSelectCategory(cat.id);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center justify-between px-3 py-3 rounded-lg transition-all group ${activeCategory === cat.id ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-slate-800/30 hover:bg-slate-800 border border-transparent'}`}
                                 >
                                     <div className="flex items-center gap-3">
                                         <div className={`p-1.5 rounded-lg transition-colors ${activeCategory === cat.id ? 'bg-primary-500 text-slate-900' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                                            {cat.icon || <LayoutGrid size={16} />}
                                         </div>
                                         <span className={`font-semibold text-sm ${activeCategory === cat.id ? 'text-primary-500' : 'text-slate-300 group-hover:text-white'}`}>{cat.name}</span>
                                     </div>
                                     {activeCategory === cat.id && <Check size={16} className="text-primary-500" />}
                                 </button>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPills;