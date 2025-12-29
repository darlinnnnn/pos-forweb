import React, { useState } from 'react';
import { X, Utensils, ShoppingBag, Check, Printer, Wifi, RefreshCw, Smartphone, Laptop, Menu, Edit2, Save, Tag, Trash2, Plus } from 'lucide-react';
import { BusinessType, PrinterDevice, CategoryGroup, DiscountRule } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessType: BusinessType;
  onChangeBusinessType: (type: BusinessType) => void;
  categoryGroups?: CategoryGroup[];
  onUpdateCategoryGroups?: (groups: CategoryGroup[]) => void;
  discounts?: DiscountRule[];
  onUpdateDiscounts?: (discounts: DiscountRule[]) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  businessType, 
  onChangeBusinessType,
  categoryGroups = [],
  onUpdateCategoryGroups,
  discounts = [],
  onUpdateDiscounts
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'hardware' | 'menu' | 'promotions'>('general');
  const [isScanning, setIsScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState<PrinterDevice[]>([]);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);

  // Menu Management State
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Discount Management State
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [newDiscount, setNewDiscount] = useState<Partial<DiscountRule>>({ name: '', type: 'percent', value: 0 });

  if (!isOpen) return null;

  const handleScan = () => {
    setIsScanning(true);
    setFoundDevices([]); // Clear previous
    
    // Simulate Network Scan
    setTimeout(() => {
        setFoundDevices([
            { id: 'esp-001', name: 'ESP32-Thermal-A', ip: '192.168.1.105', status: 'online', type: 'esp32' },
            { id: 'net-002', name: 'Kitchen-Printer-01', ip: '192.168.1.200', status: 'online', type: 'network' }
        ]);
        setIsScanning(false);
    }, 2000);
  };

  const handleConnect = (id: string) => {
      setConnectedDeviceId(id);
  };

  // Menu Logic
  const handleStartEditGroup = (id: string, currentName: string) => {
      setEditingGroupId(id);
      setEditingCatId(null);
      setTempName(currentName);
  };

  const handleSaveGroup = (id: string) => {
      if (onUpdateCategoryGroups) {
          const newGroups = categoryGroups.map(g => 
              g.id === id ? { ...g, name: tempName } : g
          );
          onUpdateCategoryGroups(newGroups);
      }
      setEditingGroupId(null);
  };

  const handleStartEditCat = (id: string, currentName: string) => {
      setEditingCatId(id);
      setEditingGroupId(null);
      setTempName(currentName);
  };

  const handleSaveCat = (groupId: string, catId: string) => {
      if (onUpdateCategoryGroups) {
          const newGroups = categoryGroups.map(g => {
              if (g.id === groupId) {
                  return {
                      ...g,
                      categories: g.categories.map(c => c.id === catId ? { ...c, name: tempName } : c)
                  };
              }
              return g;
          });
          onUpdateCategoryGroups(newGroups);
      }
      setEditingCatId(null);
  };

  // Discount Logic
  const handleAddDiscount = () => {
      if (!newDiscount.name || !newDiscount.value || !onUpdateDiscounts) return;
      const newRule: DiscountRule = {
          id: `disc-${Date.now()}`,
          name: newDiscount.name,
          type: newDiscount.type || 'percent',
          value: Number(newDiscount.value)
      };
      onUpdateDiscounts([...discounts, newRule]);
      setIsAddingDiscount(false);
      setNewDiscount({ name: '', type: 'percent', value: 0 });
  };

  const handleDeleteDiscount = (id: string) => {
      if (onUpdateDiscounts) {
          onUpdateDiscounts(discounts.filter(d => d.id !== id));
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div>
            <h3 className="text-xl font-bold text-white">Settings</h3>
            <p className="text-sm text-slate-400">Manage application preferences</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-6 overflow-x-auto">
            {['general', 'menu', 'promotions', 'hardware'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap capitalize ${activeTab === tab ? 'text-primary-500 border-primary-500' : 'text-slate-400 border-transparent hover:text-white'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="animate-in slide-in-from-right-4 duration-300">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Application Type</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* FnB Option */}
                    <button
                    onClick={() => onChangeBusinessType('fnb')}
                    className={`
                        relative p-5 rounded-2xl border-2 text-left transition-all duration-300 group
                        ${businessType === 'fnb' 
                        ? 'bg-slate-800 border-primary-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                        : 'bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-slate-600'}
                    `}
                    >
                    <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                        ${businessType === 'fnb' ? 'bg-primary-500 text-slate-900' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}
                    `}>
                        <Utensils size={24} />
                    </div>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <h5 className={`text-lg font-bold mb-1 ${businessType === 'fnb' ? 'text-white' : 'text-slate-300'}`}>
                                Food & Beverage
                            </h5>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Complete features for restaurants and cafes. Includes <strong>Table Management</strong>, <strong>Dine-in</strong>, <strong>Take-away</strong>, and <strong>Delivery</strong> options.
                            </p>
                        </div>
                        {businessType === 'fnb' && (
                            <div className="absolute top-4 right-4 text-primary-500">
                                <Check size={20} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    </button>

                    {/* Retail Option */}
                    <button
                    onClick={() => onChangeBusinessType('retail')}
                    className={`
                        relative p-5 rounded-2xl border-2 text-left transition-all duration-300 group
                        ${businessType === 'retail' 
                        ? 'bg-slate-800 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                        : 'bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-slate-600'}
                    `}
                    >
                    <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                        ${businessType === 'retail' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}
                    `}>
                        <ShoppingBag size={24} />
                    </div>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <h5 className={`text-lg font-bold mb-1 ${businessType === 'retail' ? 'text-white' : 'text-slate-300'}`}>
                                Retail Shop
                            </h5>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Streamlined for retail stores. Optimized for quick sales with <strong>No Tables</strong> and simplified checkout process.
                            </p>
                        </div>
                        {businessType === 'retail' && (
                            <div className="absolute top-4 right-4 text-emerald-500">
                                <Check size={20} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    </button>
                </div>
            </div>
          )}

          {/* MENU MANAGEMENT TAB */}
          {activeTab === 'menu' && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Collection Structure</h4>
                      <button className="text-xs text-primary-500 font-bold hover:text-primary-400">+ Add Group</button>
                  </div>

                  <div className="space-y-6">
                      {categoryGroups.map((group) => (
                          <div key={group.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                              {/* Group Header */}
                              <div className="p-3 bg-slate-800/50 flex items-center justify-between group">
                                  {editingGroupId === group.id ? (
                                      <div className="flex-1 flex gap-2">
                                          <input 
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            className="bg-slate-900 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-primary-500"
                                            autoFocus
                                          />
                                          <button onClick={() => handleSaveGroup(group.id)} className="p-1 bg-primary-500 text-slate-900 rounded hover:bg-primary-400">
                                              <Save size={16} />
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-2">
                                          <Menu size={16} className="text-slate-500" />
                                          <h5 className="font-bold text-white text-sm">{group.name}</h5>
                                          <button 
                                            onClick={() => handleStartEditGroup(group.id, group.name)}
                                            className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                              <Edit2 size={12} />
                                          </button>
                                      </div>
                                  )}
                              </div>
                              
                              {/* Categories List */}
                              <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {group.categories.map((cat) => (
                                      <div key={cat.id} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 group">
                                          {editingCatId === cat.id ? (
                                              <div className="flex-1 flex gap-2">
                                                  <input 
                                                    value={tempName}
                                                    onChange={(e) => setTempName(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 text-xs text-white focus:outline-none focus:border-primary-500"
                                                    autoFocus
                                                  />
                                                  <button onClick={() => handleSaveCat(group.id, cat.id)} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-400">
                                                      <Save size={14} />
                                                  </button>
                                              </div>
                                          ) : (
                                              <>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-slate-500">{cat.icon}</div>
                                                    <span className="text-sm text-slate-300">{cat.name}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleStartEditCat(cat.id, cat.name)}
                                                    className="p-1 text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                              </>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* PROMOTIONS TAB */}
          {activeTab === 'promotions' && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Named Discounts</h4>
                      <button 
                        onClick={() => setIsAddingDiscount(true)}
                        className="text-xs text-primary-500 font-bold hover:text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-lg border border-primary-500/20 flex items-center gap-2"
                      >
                          <Plus size={14} /> Add Promotion
                      </button>
                  </div>

                  {isAddingDiscount && (
                      <div className="mb-6 bg-slate-800/50 border border-primary-500/50 rounded-xl p-4 space-y-3">
                           <h5 className="text-sm font-bold text-white">New Promotion Rule</h5>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                               <input 
                                  placeholder="Promotion Name (e.g. Summer Sale)"
                                  value={newDiscount.name}
                                  onChange={e => setNewDiscount({...newDiscount, name: e.target.value})}
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                               />
                               <select
                                  value={newDiscount.type}
                                  onChange={e => setNewDiscount({...newDiscount, type: e.target.value as 'percent' | 'nominal'})}
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                               >
                                   <option value="percent">Percentage (%)</option>
                                   <option value="nominal">Nominal (Rp)</option>
                               </select>
                               <input 
                                  type="number"
                                  placeholder="Value"
                                  value={newDiscount.value}
                                  onChange={e => setNewDiscount({...newDiscount, value: Number(e.target.value)})}
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                               />
                           </div>
                           <div className="flex justify-end gap-2 mt-2">
                               <button onClick={() => setIsAddingDiscount(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
                               <button onClick={handleAddDiscount} className="px-3 py-1.5 bg-primary-500 text-slate-900 text-xs font-bold rounded-lg hover:bg-primary-400">Save Rule</button>
                           </div>
                      </div>
                  )}

                  <div className="space-y-3">
                      {discounts.length === 0 ? (
                          <div className="text-center py-8 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                              <Tag size={32} className="mx-auto text-slate-600 mb-2" />
                              <p className="text-slate-500">No discount rules found.</p>
                          </div>
                      ) : (
                          discounts.map(discount => (
                              <div key={discount.id} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-slate-800 rounded-lg text-emerald-500">
                                          <Tag size={18} />
                                      </div>
                                      <div>
                                          <h5 className="font-bold text-white text-sm">{discount.name}</h5>
                                          <p className="text-xs text-slate-500">
                                              {discount.type === 'percent' ? `${discount.value}% Off` : `Rp ${discount.value.toLocaleString()} Off`}
                                          </p>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteDiscount(discount.id)}
                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          )}

          {/* HARDWARE TAB */}
          {activeTab === 'hardware' && (
             <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                 
                 <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-6">
                         <div>
                             <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                <Printer size={20} className="text-primary-500" />
                                Printer Configuration
                             </h4>
                             <p className="text-sm text-slate-400 mt-1">Connect ESP32 or Network Printers via LAN</p>
                         </div>
                         <button 
                            onClick={handleScan}
                            disabled={isScanning}
                            className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-slate-900 font-bold rounded-lg shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                         >
                             <RefreshCw size={18} className={isScanning ? 'animate-spin' : ''} />
                             {isScanning ? 'Scanning...' : 'Scan Devices'}
                         </button>
                    </div>

                    {/* Scan Results */}
                    <div className="space-y-3">
                        {isScanning && foundDevices.length === 0 && (
                            <div className="text-center py-8">
                                <div className="inline-block animate-pulse text-primary-500 mb-2">
                                    <Wifi size={32} />
                                </div>
                                <p className="text-slate-400 font-medium">Searching for ESP32 devices on local network...</p>
                            </div>
                        )}

                        {!isScanning && foundDevices.length === 0 && (
                            <div className="text-center py-8 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                                <p className="text-slate-500">No devices found. Ensure your ESP32 is powered on and connected to WiFi.</p>
                            </div>
                        )}

                        {foundDevices.map(device => (
                            <div key={device.id} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
                                        {device.type === 'esp32' ? <Printer size={20} /> : <Laptop size={20} />}
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-white text-sm">{device.name}</h5>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">{device.ip}</span>
                                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide">Online</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {connectedDeviceId === device.id ? (
                                    <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-sm font-bold flex items-center gap-2 cursor-default">
                                        <Check size={14} /> Connected
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleConnect(device.id)}
                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold border border-slate-600 transition-colors"
                                    >
                                        Connect
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                 </div>

             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;