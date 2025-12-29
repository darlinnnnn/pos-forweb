import React from 'react';
import { Product, Table, CategoryGroup, DiscountRule } from './types';
import { LayoutGrid, Coffee, Croissant, Utensils, IceCream, Cookie, Beef, Sandwich, Pizza, Soup, Salad, Cake, Beer, Wine, Apple, Car, Gamepad, Shirt, Watch, Zap } from 'lucide-react';

// Using a function to return icons to ensure they render correctly in the component tree
export const initialCategoryGroups: CategoryGroup[] = [
  {
    id: 'g_quick',
    name: 'Quick Access',
    categories: [
      { id: 'all', name: 'All Items', icon: React.createElement(LayoutGrid, { size: 18 }) },
      { id: 'promo', name: 'Flash Sale', icon: React.createElement(Zap, { size: 18 }) },
    ]
  },
  {
    id: 'g_beverage',
    name: 'Beverages',
    categories: [
      { id: 'coffee', name: 'Coffee', icon: React.createElement(Coffee, { size: 18 }) },
      { id: 'cold drinks', name: 'Cold Drinks', icon: React.createElement(IceCream, { size: 18 }) },
      { id: 'beer', name: 'Beer', icon: React.createElement(Beer, { size: 18 }) },
      { id: 'wine', name: 'Wine', icon: React.createElement(Wine, { size: 18 }) },
    ]
  },
  {
    id: 'g_food',
    name: 'Food & Dining',
    categories: [
      { id: 'food', name: 'General Food', icon: React.createElement(Utensils, { size: 18 }) },
      { id: 'steak', name: 'Steaks', icon: React.createElement(Beef, { size: 18 }) },
      { id: 'pizza', name: 'Pizza', icon: React.createElement(Pizza, { size: 18 }) },
      { id: 'soup', name: 'Soups', icon: React.createElement(Soup, { size: 18 }) },
      { id: 'salad', name: 'Salads', icon: React.createElement(Salad, { size: 18 }) },
    ]
  },
  {
    id: 'g_bakery',
    name: 'Bakery & Snacks',
    categories: [
      { id: 'bakery', name: 'Bakery', icon: React.createElement(Croissant, { size: 18 }) },
      { id: 'sandwich', name: 'Sandwich', icon: React.createElement(Sandwich, { size: 18 }) },
      { id: 'snacks', name: 'Snacks', icon: React.createElement(Cookie, { size: 18 }) },
      { id: 'dessert', name: 'Desserts', icon: React.createElement(Cake, { size: 18 }) },
    ]
  },
  {
    id: 'g_retail',
    name: 'Retail Goods',
    categories: [
      { id: 'apparel', name: 'Apparel', icon: React.createElement(Shirt, { size: 18 }) },
      { id: 'accessories', name: 'Accessories', icon: React.createElement(Watch, { size: 18 }) },
      { id: 'toys', name: 'Toys', icon: React.createElement(Car, { size: 18 }) },
      { id: 'games', name: 'Games', icon: React.createElement(Gamepad, { size: 18 }) },
      { id: 'fruit', name: 'Fresh Fruits', icon: React.createElement(Apple, { size: 18 }) },
    ]
  }
];

export const initialDiscounts: DiscountRule[] = [
  { id: 'd1', name: 'Employee Discount', type: 'percent', value: 20 },
  { id: 'd2', name: 'VIP Member', type: 'percent', value: 10 },
  { id: 'd3', name: 'Opening Promo', type: 'nominal', value: 10000 },
  { id: 'd4', name: 'Manager Meal', type: 'percent', value: 100 },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Matcha Latte',
    sku: 'DRK-001',
    price: 28000,
    discount: 4000,
    collection: 'Summer Sale',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD44XbkBjFV1Nu-YSQ16IUlnAQJMNvkb6_adsJ9S-WAvsJznJNI5MXCc8s1FHfHu2CDWsHF97F09h5gmBIgKQH6BVQHys1Wn9ecbWjfuwt8SKd1f-owPHxEGcDeWGfRFYs9nfUNcPNfZq7UefUIoEb1SaL7OWGpx4D_r-tB5pvVOwoUn1U2wy2NB-H7Fxl7hxOIxmQ8wIRKst9kpUeC-ngvnI_5qusLiYnISpsufsYoXZLyacP5_wpO3KieVrZbvKW7xjnckH_fXXZM',
    category: 'coffee',
    badge: 'Best Seller',
    stock: 20,
    optionGroups: [
      {
        id: 'size',
        name: 'Size',
        min: 1, // Required
        max: 1, // Single Select
        options: [
          { id: 'sz-r', name: 'Regular (12oz)', price: 0 },
          { id: 'sz-l', name: 'Large (16oz)', price: 5000 },
          { id: 'sz-j', name: 'Jumbo (22oz)', price: 8000 }
        ]
      },
      {
        id: 'sugar',
        name: 'Sugar Level',
        min: 1,
        max: 1,
        options: [
          { id: 'sg-100', name: 'Normal (100%)', price: 0 },
          { id: 'sg-50', name: 'Half (50%)', price: 0 },
          { id: 'sg-0', name: 'No Sugar (0%)', price: 0 }
        ]
      },
      {
        id: 'toppings',
        name: 'Toppings',
        min: 0, // Optional
        max: 5, // Multi Select
        options: [
          { id: 'tp-1', name: 'Coffee Jelly', price: 3000 },
          { id: 'tp-2', name: 'Grass Jelly', price: 3000 },
          { id: 'tp-3', name: 'Oat Milk', price: 4000 }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Croissant',
    sku: 'BAK-102',
    price: 18000,
    discount: 3000,
    collection: 'Breakfast Set',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMyZB_L4DpfI8qGnVWnXA4qo4d9A1tCGytQiTJgE5wlP6VKM68rs28r41x9beve0YFVLheV1mWie5xFdqk38gU3Nnp2BSIpXFl9IvHOA4ezgofJBjM0f1kKmjorJGWp9rfBMNxFaQ_LE7q5HE1vcr3XocP_K3HzlvlL-LCQvAIWviWkPRTNvPdl7xFss6kZhOXeoVtfXLPk5P1dkmlKX2K86PFC5iolaR9PdLExN1pJB5GR2XxaP3U51CMordCLWg2GrHoyIASZIDL',
    category: 'bakery',
    stock: 15,
    optionGroups: [
       {
        id: 'heat',
        name: 'Serving Option',
        min: 1,
        max: 1,
        options: [
           { id: 'h-no', name: 'No Heat', price: 0 },
           { id: 'h-yes', name: 'Warm Up', price: 0 }
        ]
       },
       {
        id: 'extra',
        name: 'Add-ons',
        min: 0,
        max: 2,
        options: [
           { id: 'ex-1', name: 'Butter', price: 2000 },
           { id: 'ex-2', name: 'Strawberry Jam', price: 2000 }
        ]
       }
    ]
  },
  {
    id: '3',
    name: 'Avocado Toast',
    sku: 'FD-204',
    price: 45000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAo8f2ftVphgcQrKwpgP9JAyz0mX79zYqkHglQczQtU0v6tMII_K4iq6crYLmmoRfD8B7Z0gTX01Z0MZ4G9LC76se-5BPrcPeOGaAXH9Y73zkQ8L__c6IEcS1sD7M4J8nX3n6MeoxY-fhjAYgn6_lripbQGAPJ-dSS-qTAvn0jhTIgI4tbXkfLWcEz_Vvo6ktTI0HqYzNub8UYrlSzCdUQw2eBri1dzhNAWLBSoY2dXg9snd8nMx54FTjYuIjfi_gad1eR3iS5EYiZ',
    category: 'food',
    badge: 'Low: 5',
    stock: 5,
    optionGroups: [
        {
            id: 'bread',
            name: 'Bread Type',
            min: 1,
            max: 1,
            options: [
                { id: 'br-sour', name: 'Sourdough', price: 0 },
                { id: 'br-wheat', name: 'Whole Wheat', price: 0 },
                { id: 'br-gf', name: 'Gluten Free', price: 5000 }
            ]
        },
        {
            id: 'add',
            name: 'Extra Toppings',
            min: 0,
            max: 5,
            options: [
                { id: 'ad-egg', name: 'Extra Egg', price: 5000 },
                { id: 'ad-sal', name: 'Smoked Salmon', price: 15000 },
                { id: 'ad-feta', name: 'Feta Cheese', price: 4000 }
            ]
        }
    ]
  },
  {
    id: '4',
    name: 'Iced Coffee',
    sku: 'DRK-005',
    price: 22000,
    discount: 2000,
    collection: 'Summer Sale',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAagcWj-ZjijJ2kOa79v6riQrpH7x9zOgLCn-LqsaDsTQ0EbOkWDqUdTrD06u89utIoXe4FDpTfdgtoBQ-ogmccIKh9vzIHexYM052QDuGyGYzFCM_Tcs9OX597iMWhPMnq47ZmJpXz7ZTZvcEGGN-VSmanvppFHR_NNi39Hw4tBVe4tu1a8rwBnDlZsS1HhpP3MhVVdZvaB3-hok0P_jkD87Ys4RFcSVTwPiNOrMzliqyIFT-6WU9KtHUQhGP0BPfhyTiaSyYicSrg',
    category: 'coffee',
    sizes: 2,
    optionGroups: [
        {
            id: 'size', name: 'Size', min: 1, max: 1,
            options: [
                { id: 's1', name: 'Regular', price: 0 },
                { id: 's2', name: 'Large', price: 4000 }
            ]
        },
        {
            id: 'ice', name: 'Ice Level', min: 1, max: 1,
            options: [
                { id: 'i1', name: 'Normal Ice', price: 0 },
                { id: 'i2', name: 'Less Ice', price: 0 },
                { id: 'i3', name: 'No Ice', price: 0 }
            ]
        },
        {
            id: 'topping', name: 'Toppings', min: 0, max: 3,
            options: [
                { id: 't1', name: 'Coffee Jelly', price: 3000 },
                { id: 't2', name: 'Caramel Sauce', price: 2000 }
            ]
        }
    ]
  },
  {
    id: '5',
    name: 'Bagel',
    sku: 'BAK-106',
    price: 15000,
    discount: 2500,
    collection: 'Breakfast Set',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKPok65XV5VUc0jjgwnIKpHcrjgS4BtnrjgdWa51cikn0GYBRjYZdzW6D9DPV5D4-HvjpTqPpiU5kSbYhoqQqy6c6SnyDNaDW-TBowONMBzX53Uf83j2MQB6eLMEZIht3fRahIBHFLZ1dacSaZNC1bm7iemygQTop6g6rprICs9l9Q0-7AWIpKUpYDL9DwQdDqjhnQ0F2vDTPAvVo9KDDhyPXjv4Igba8LCbxWTBjsRwowrvSD61G9b9_ykOfwPmvQj3Z6_KvJaPRt',
    category: 'bakery'
  },
  {
    id: '6',
    name: 'Berry Smoothie',
    sku: 'DRK-022',
    price: 35000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA64ROSwHAnxEZ_qgIsGnKk5SNS7g6s_cP161q3o72A8IUgA3DNmx1GKOMDc0ow3osxQQ1YiQr2j6G3hNYvwWAiYxA3TyJ2N-6jsP9cCfkK6mlJZpIcsntru9STjP0WEv16fyf84JdLutaJbCnlgHVxy_KCwalnkAgT2KbaE2mMqf_mPfY-YAHflzyc-UCYzdAM9N8MbNNTn5oerBgOLGhr5Hg2SXidbW0LGW1zX5V3OFozFdreNS44-i1fI3YsRZhBSUUrBupm82tE',
    category: 'cold drinks',
    optionGroups: [
        {
            id: 'boost', name: 'Boosters', min: 0, max: 2,
            options: [
                { id: 'p1', name: 'Whey Protein', price: 10000 },
                { id: 'p2', name: 'Chia Seeds', price: 2000 }
            ]
        }
    ]
  },
  {
    id: '7',
    name: 'Choco Cookie',
    sku: 'SNK-301',
    price: 12000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChIN7M-M6PVMNDPm7Bh2ps3vLIlaJ4-EFVPK0CHHNpxeZZd70WTmZxOY105nibFUrNunRxo5CoJLcV7hRqZwVv10KfFFRJw-6HN3w6JsMFQye0YJ8gC8FVIWLg2Jqd3V-Xet0AyfirDXshCDbKspqVWd1lxnjOUNoyf3ELYi5zuxrg0xbxvAyU0TgQtvBsgUN7Wh4IzOkbEQtEEWsF0cVoHUz0lw6BIAwXRIHxNAYldQdtxgRHlbFW_rSsaGcOBcw3i3Seh4-57SB3',
    category: 'snacks'
  },
];

export const tables: Table[] = [
  // Main Hall
  { id: 't1', name: 'T-01', status: 'available', seats: 2, section: 'Main Hall' },
  { id: 't2', name: 'T-02', status: 'occupied', seats: 2, section: 'Main Hall' },
  { id: 't3', name: 'T-03', status: 'available', seats: 4, section: 'Main Hall' },
  { id: 't4', name: 'T-04', status: 'reserved', seats: 4, section: 'Main Hall' },
  { id: 't5', name: 'T-05', status: 'available', seats: 6, section: 'Main Hall' },
  { id: 't6', name: 'T-06', status: 'available', seats: 4, section: 'Main Hall' },
  // Terrace
  { id: 't7', name: 'T-07', status: 'available', seats: 2, section: 'Terrace' },
  { id: 't8', name: 'T-08', status: 'occupied', seats: 4, section: 'Terrace' },
  { id: 't9', name: 'T-09', status: 'available', seats: 4, section: 'Terrace' },
  // VIP
  { id: 'v1', name: 'VIP-01', status: 'available', seats: 8, section: 'VIP Lounge' },
  { id: 'v2', name: 'VIP-02', status: 'reserved', seats: 10, section: 'VIP Lounge' },
];