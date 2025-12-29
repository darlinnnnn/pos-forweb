import React, { useState } from 'react';
import { Table } from '../types';
import { Users, Armchair, Settings, Plus, X, Check, ReceiptText } from 'lucide-react';

interface TableSelectorProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
  onAddTable: (table: Table) => void;
  onDeleteTable: (id: string) => void;
}

const TableSelector: React.FC<TableSelectorProps> = ({ tables, onSelectTable, onAddTable, onDeleteTable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [newTableName, setNewTableName] = useState('');
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [newTableSection, setNewTableSection] = useState('Main Hall');

  // Group tables by section
  const sections = tables.reduce((acc, table) => {
    if (!acc[table.section]) {
      acc[table.section] = [];
    }
    acc[table.section].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

  // Get unique sections for dropdown
  const uniqueSections = Array.from(new Set(tables.map(t => t.section)));
  if (!uniqueSections.includes('Main Hall')) uniqueSections.push('Main Hall');
  if (!uniqueSections.includes('Terrace')) uniqueSections.push('Terrace');

  const handleSaveNewTable = () => {
    if (!newTableName.trim()) return;
    
    const newTable: Table = {
      id: `tbl-${Date.now()}`,
      name: newTableName,
      seats: newTableSeats,
      section: newTableSection,
      status: 'available'
    };
    
    onAddTable(newTable);
    setShowAddModal(false);
    setNewTableName('');
    setNewTableSeats(4);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 relative">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Table Management</h2>
              <p className="text-slate-400 mt-1">Select an active table or start a new order.</p>
            </div>
            
            <div className="flex items-center gap-3">
               {isEditing && (
                 <button 
                   onClick={() => setShowAddModal(true)}
                   className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                 >
                   <Plus size={16} />
                   Add Table
                 </button>
               )}
               
               <button 
                 onClick={() => setIsEditing(!isEditing)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                   isEditing 
                     ? 'bg-slate-800 text-white border-slate-600' 
                     : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
                 }`}
               >
                 {isEditing ? <Check size={16} /> : <Settings size={16} />}
                 {isEditing ? 'Manage Layout' : 'Table Settings'}
               </button>
            </div>
        </div>

        <div className="flex flex-col gap-10">
          {Object.entries(sections).map(([sectionName, sectionTables]) => (
            <div key={sectionName}>
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-4">
                {sectionName}
                <div className="h-px flex-1 bg-slate-800"></div>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(sectionTables as Table[]).map((table) => {
                  const isAvailable = table.status === 'available';
                  const isOccupied = table.status === 'occupied';
                  const isReserved = table.status === 'reserved';

                  return (
                    <div key={table.id} className="relative group">
                      <button
                        disabled={isReserved && !isEditing}
                        onClick={() => !isEditing && onSelectTable(table)}
                        className={`
                          w-full relative h-32 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300
                          ${isEditing ? 'cursor-default border-dashed' : 'cursor-pointer'}
                          ${!isEditing && isAvailable 
                            ? 'bg-slate-900 border-slate-800 hover:border-primary-500 hover:bg-slate-800 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:-translate-y-1' 
                            : ''}
                          ${!isEditing && isOccupied 
                            ? 'bg-primary-500/5 border-primary-500 shadow-lg shadow-primary-500/5 hover:-translate-y-1' 
                            : ''}
                          ${!isEditing && isReserved 
                            ? 'bg-slate-900 border-amber-900/50 opacity-50 cursor-not-allowed' 
                            : ''}
                          ${isEditing ? 'bg-slate-900 border-slate-700' : ''}
                        `}
                      >
                        {/* Status Indicator */}
                        {!isEditing && (
                          <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                            isAvailable ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                            isOccupied ? 'bg-primary-500 animate-pulse' : 'bg-amber-500'
                          }`}></div>
                        )}

                        <div className={`
                          p-3 rounded-2xl mb-1 transition-colors
                          ${!isEditing && isAvailable ? 'bg-slate-800 text-slate-400 group-hover:bg-primary-500 group-hover:text-slate-950' : ''}
                          ${!isEditing && isOccupied ? 'bg-primary-500 text-slate-950' : ''}
                          ${isEditing ? 'bg-slate-800 text-slate-400' : ''}
                          ${!isEditing && isReserved ? 'bg-slate-800/50 text-slate-600' : ''}
                        `}>
                          {isOccupied ? <ReceiptText size={24} /> : <Armchair size={24} />}
                        </div>

                        <div className="text-center">
                          <span className={`block text-lg font-bold leading-none ${isOccupied ? 'text-primary-400' : 'text-white'}`}>
                            {table.name}
                          </span>
                          <div className="flex items-center justify-center gap-1 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                             <Users size={10} />
                             <span>{table.seats} Pax</span>
                          </div>
                        </div>

                        {isOccupied && !isEditing && (
                          <div className="absolute -bottom-2 bg-primary-500 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-md">
                              Active Order
                          </div>
                        )}
                      </button>

                      {/* Delete Button (Only in Edit Mode) */}
                      {isEditing && (
                        <button 
                          onClick={() => onDeleteTable(table.id)}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition-transform hover:scale-110 z-10"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Table Modal (unchanged) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                 <h3 className="text-xl font-bold text-white">Add New Table</h3>
                 <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                    <X size={24} />
                 </button>
              </div>
              
              <div className="p-6 space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Table Name</label>
                    <input 
                       type="text" 
                       value={newTableName}
                       onChange={(e) => setNewTableName(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg h-10 px-3 text-white focus:outline-none focus:border-primary-500"
                       placeholder="e.g. T-12 or VIP-03"
                       autoFocus
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Section</label>
                        <select 
                           value={newTableSection}
                           onChange={(e) => setNewTableSection(e.target.value)}
                           className="w-full bg-slate-950 border border-slate-700 rounded-lg h-10 px-3 text-white focus:outline-none focus:border-primary-500"
                        >
                            {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
                            <option value="Outdoor">Outdoor</option>
                            <option value="Bar Area">Bar Area</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Seats</label>
                        <div className="flex items-center h-10 bg-slate-950 border border-slate-700 rounded-lg overflow-hidden">
                           <button onClick={() => setNewTableSeats(Math.max(1, newTableSeats - 1))} className="w-10 h-full flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                              <span className="text-lg font-bold">-</span>
                           </button>
                           <span className="flex-1 text-center font-bold text-white">{newTableSeats}</span>
                           <button onClick={() => setNewTableSeats(newTableSeats + 1)} className="w-10 h-full flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                              <span className="text-lg font-bold">+</span>
                           </button>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="p-6 pt-2 pb-6 flex gap-3">
                 <button 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={handleSaveNewTable}
                    disabled={!newTableName.trim()}
                    className="flex-1 h-11 rounded-xl bg-primary-500 text-slate-950 font-bold hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    Save Table
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TableSelector;