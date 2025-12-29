
import { createClient } from '@supabase/supabase-js';
import process from 'process';

const supabaseUrl = 'https://uxhitcnzzzwihtuyihwn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aGl0Y256enp3aWh0dXlpaHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzODE0NjcsImV4cCI6MjA4MTk1NzQ2N30.1n6Xumx486BC_CEcGjjR8gDiMFcD4QinwZhJLy9_25Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
    const email = 'user@pos.com';
    const password = 'password123';

    console.log(`Creating user: ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('Error creating user:', error.message);
        return;
    }

    if (data.user) {
        console.log('User created successfully:', data.user.id);
        console.log('NOTICE: You may need to manually confirm this user in the Supabase dashboard or I will update via SQL if possible.');
    } else {
        console.log('Signup call finished but no user returned (check confirmation settings).');
    }
}

createTestUser();
