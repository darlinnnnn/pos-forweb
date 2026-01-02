import React from 'react';

export type BusinessType = 'fnb' | 'retail';

export interface Outlet {
  id: string;
  name: string;
  address: string;
  isOpen: boolean;
  type: string;
  storeId?: string; // Optional reference
  receiptSettings?: any;
}

export interface ProductOption {
  id: string;
  name: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  name: string; // e.g., "Size", "Toppings", "Sugar Level"
  min: number; // 0 = Optional, 1 = Required
  max: number; // 1 = Single Select, >1 = Multi Select
  options: ProductOption[];
}

export interface SelectedOption extends ProductOption {
  groupId: string;
  groupName: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  image: string;
  category: string;
  optionGroups?: OptionGroup[]; // New Flexible System
  badge?: string;
  stock?: number;
  discount?: number;
  collection?: string;

  // Deprecated fields kept for type safety if needed, but we will rely on optionGroups
  sizes?: number;
  variants?: any[];
  addons?: any[];
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  selectedOptions: SelectedOption[]; // Stores all choices (Size, Toppings, etc.)
  notes?: string;
  isUnsent?: boolean; // Track if item needs to be sent to kitchen
}

export interface Category {
  id: string;
  name: string;
  icon?: React.ReactNode; // Optional because we might create new ones without icons easily
}

export interface CategoryGroup {
  id: string;
  name: string;
  categories: Category[];
}

export interface Table {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'reserved';
  seats: number;
  section: string;
  activeOrder?: CartItem[];
}

export interface Customer {
  id: string;
  name: string;
  type: 'walk-in' | 'member' | 'vip';
  phone?: string;
  email?: string;
}

export interface PaymentSummary {
  method: string;
  count: number;
  total: number;
}

export interface ShiftData {
  isOpen: boolean;
  shiftId?: string;
  cashierName: string;
  cashierId?: string;
  registerName?: string;
  startTime?: Date;
  startCash: number;
  expectedCash: number;
  paymentMethods?: PaymentSummary[];
  cashExpenses?: number;
}

export interface DiscountRule {
  id: string;
  name: string;
  type: 'nominal' | 'percent';
  value: number;
}

export interface DiscountState {
  type: 'nominal' | 'percent';
  value: number;
  name?: string; // Optional name for the applied discount
}

export interface PrinterDevice {
  id: string;
  name: string;
  ip?: string;             // Optional for BLE printers
  port?: number;           // WebSocket port (default: 81)
  status: 'online' | 'offline';
  type: 'esp32' | 'network' | 'ble';  // Added BLE type
  bleDeviceId?: string;    // Web Bluetooth device ID
  bleDeviceName?: string;  // Web Bluetooth device name
  copies?: number;
  printTypes?: ('receipt' | 'kitchen' | 'order')[];
  isActive?: boolean;
  paperWidth?: '58mm' | '80mm';
}