import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmUsers() {
  console.log('Fetching users...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  let confirmedCount = 0;
  for (const user of users) {
    if (!user.email_confirmed_at) {
      console.log(`Confirming email for user: ${user.email}`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
      });
      if (updateError) {
        console.error(`Error confirming ${user.email}:`, updateError);
      } else {
        confirmedCount++;
      }
    }
  }
  console.log(`Successfully confirmed ${confirmedCount} users.`);
}

confirmUsers();
