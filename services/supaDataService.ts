import { supabase } from '../supabase';
import { Product, CategoryGroup, Category, OptionGroup, ProductOption, Outlet } from '../types';

export const supaDataService = {
    // Fetch Store for a given user (by Owner ID)
    async getStoreForUser(userId: string) {
        const { data, error } = await supabase
            .from('stores')
            .select('id, name')
            .eq('owner_id', userId)
            .single();

        if (error) {
            console.error('Error fetching store for user:', error);
            return null;
        }
        return data;
    },

    // Fetch Outlets for a Store
    async getOutlets(storeId: string): Promise<Outlet[]> {
        const { data, error } = await supabase
            .from('outlets')
            .select('*')
            .eq('store_id', storeId)
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching outlets:', error);
            return [];
        }

        if (!data) return [];

        return data.map((o: any) => ({
            id: o.id,
            name: o.name,
            address: o.address || '',
            isOpen: o.is_open || false,
            type: 'Store',
            storeId: o.store_id
        }));
    },

    // Fetch Users/Cashiers for an Outlet
    async getOutletUsers(outletId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('outlet_users')
            .select('*')
            .eq('outlet_id', outletId);

        if (error) {
            console.error('Error fetching outlet users:', error);
            return [];
        }

        return data || [];
    },

    // Fetch and transform categories
    async getCategories(): Promise<CategoryGroup[]> {
        const { data: categoriesData, error } = await supabase
            .from('categories')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching categories:', error);
            return [];
        }

        if (!categoriesData) return [];

        // Since our local app uses "CategoryGroup" (e.g. Beverages, Food), but DB is flat,
        // we'll group them. For now, we can create a "General" group or try to group by some logic.
        // Ideally, we'd have a 'group_name' in the DB. Let's assume we put everything in appropriate groups 
        // or just one "Menu" group if no grouping exists.

        // Check if we can infer groups? No column for it.
        // Let's create a single group for now to ensure they appear.
        const allCategories: Category[] = categoriesData.map((c: any) => ({
            id: c.id, // Keep UUID or name? Frontend uses string IDs like 'coffee'. 
            // Using name.toLowerCase() might be safer for mapping if UUIDs aren't used in filters.
            // Let's use the DB ID for correctness, but ensure frontend uses it.
            name: c.name,
            // Icon mapping would go here if we had it in DB.
        }));

        return [
            {
                id: 'g_all',
                name: 'Menu',
                categories: allCategories
            }
        ];
    },

    // Fetch and transform products with options
    async getProducts(): Promise<Product[]> {
        const { data: productsData, error } = await supabase
            .from('products')
            .select(`
        *,
        category:categories(id, name),
        product_addon_groups (
          addon_group:addon_groups (
            id,
            name,
            is_required,
            max_selections,
            addon_items (
              id,
              name,
              price
            )
          )
        )
      `)
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }

        if (!productsData) return [];

        return productsData.map((p: any) => {
            // Transform option groups
            const optionGroups: OptionGroup[] = p.product_addon_groups?.map((pag: any) => {
                const group = pag.addon_group;
                return {
                    id: group.id,
                    name: group.name,
                    min: group.is_required ? 1 : 0,
                    max: group.max_selections || 0,
                    options: group.addon_items?.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        price: Number(item.price)
                    })) || []
                };
            }) || [];

            return {
                id: p.id,
                name: p.name,
                sku: p.sku || '',
                price: Number(p.price),
                image: p.image_url || 'https://via.placeholder.com/150', // Fallback image
                category: p.category?.id || 'uncategorized', // Use category ID to match
                stock: p.stock_quantity || 0,
                optionGroups: optionGroups.length > 0 ? optionGroups : undefined,
                // Optional fields
                // description: p.description
            };
        });
    },

    // Device / Register Management
    async getOrCreateRegister(storeId: string, outletId: string) {
        // 1. Check LocalStorage
        let deviceId = localStorage.getItem('pos_device_id');
        if (!deviceId) {
            deviceId = crypto.randomUUID();
            localStorage.setItem('pos_device_id', deviceId);
        }

        // 2. Query DB
        const { data: existingRegister, error: fetchError } = await supabase
            .from('registers')
            .select('*')
            .eq('device_id', deviceId)
            .single();

        if (existingRegister) {
            // Backfill number if missing (for registers created before this update)
            if (!existingRegister.number) {
                const { count } = await supabase
                    .from('registers')
                    .select('*', { count: 'exact', head: true })
                    .eq('outlet_id', outletId);

                const nextNumber = (count || 0) + 1;
                const newName = `Register #${nextNumber}`;

                const { data: updated } = await supabase
                    .from('registers')
                    .update({ number: nextNumber, name: newName })
                    .eq('id', existingRegister.id)
                    .select()
                    .single();

                return updated || existingRegister;
            }
            return existingRegister;
        }

        // 3. Create if missing
        // Count existing registers for this outlet to determine the number
        const { count, error: countError } = await supabase
            .from('registers')
            .select('*', { count: 'exact', head: true })
            .eq('outlet_id', outletId);

        const nextNumber = (count || 0) + 1;
        const registerName = `Register #${nextNumber}`;

        const { data: newRegister, error: createError } = await supabase
            .from('registers')
            .insert({
                store_id: storeId,
                outlet_id: outletId,
                device_id: deviceId,
                number: nextNumber,
                name: registerName,
                business_type: 'fnb' // Default
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating register:', createError);
            return null;
        }

        return newRegister;
    },

    async updateRegisterSettings(registerId: string, settings: { businessType: string }) {
        // We now store businessType in its own column for simplicity
        const { data, error } = await supabase
            .from('registers')
            .update({ business_type: settings.businessType })
            .eq('id', registerId)
            .select()
            .single();

        if (error) {
            console.error('Error updating register settings:', error);
            return null;
        }
        return data;
    },

    // Shift Management
    async startShift(shiftData: { storeId: string; outletId: string; cashierId: string; registerId: string; startCash: number }) {
        const { data, error } = await supabase
            .from('shifts')
            .insert({
                store_id: shiftData.storeId,
                outlet_id: shiftData.outletId,
                cashier_id: shiftData.cashierId,
                register_id: shiftData.registerId,
                opening_cash: shiftData.startCash,
                open_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error starting shift:', error);
            return null;
        }
        return data;
    },

    async closeShift(shiftId: string, closingCash: number) {
        const { data, error } = await supabase
            .from('shifts')
            .update({
                close_at: new Date().toISOString(),
                closing_cash: closingCash
            })
            .eq('id', shiftId)
            .select()
            .single();

        if (error) {
            console.error('Error closing shift:', error);
            return null;
        }
        return data;
    },

    async getShift(shiftId: string) {
        const { data, error } = await supabase.from('shifts').select('*').eq('id', shiftId).single();
        if (error) return null;
        return data;
    },

    // Order Management
    async createOrder(orderData: {
        storeId: string;
        outletId: string;
        registerId: string;
        cashierId?: string;
        shiftId?: string;
        paymentMethod: string;
        subtotal: number;
        tax: number;
        discount: number;
        total: number;
    }, items: any[]) {
        // 1. Generate Order Number
        // Get register number first
        const { data: register } = await supabase.from('registers').select('number').eq('id', orderData.registerId).single();
        const registerNum = register?.number || '0';

        // Count orders for this register
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('register_id', orderData.registerId);

        const nextOrderSeq = (count || 0) + 1;
        // Format: RegNum-Sequence (e.g., 2-1001)
        // Let's start sequence at 1000 for aesthetics if user prefers, or just 1. 
        // User example "2-8113" implies a running number. Let's just use 8000 + count for now to match their example style or just count.
        // User asked "ORD-8113 to 2-8113". Let's assume 8113 was the existing numbering. 
        // We'll use a simple auto-increment logic: RegisterNum - (1000 + count)
        const orderNumber = `${registerNum}-${1000 + nextOrderSeq}`;

        // 2. Insert Order
        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert({
                store_id: orderData.storeId,
                outlet_id: orderData.outletId,
                register_id: orderData.registerId,
                cashier_id: orderData.cashierId,
                shift_id: orderData.shiftId,
                order_number: orderNumber,
                payment_method: orderData.paymentMethod,
                subtotal: orderData.subtotal,
                tax: orderData.tax,
                discount: orderData.discount,
                total: orderData.total,
                status: 'completed'
            })
            .select()
            .single();

        if (orderError || !newOrder) {
            console.error('Error creating order:', orderError);
            return null;
        }

        // 3. Insert Items
        const orderItems = items.map(item => ({
            order_id: newOrder.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            options: item.selectedOptions // JSONB
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
            // Should probably rollback or flag order as error, but for now just log
        }

        return newOrder;
    }
};
