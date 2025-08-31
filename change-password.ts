import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Create admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env.local file for:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function changeUserPassword() {
  try {
    // First, let's find the user named Omer
    console.log('Looking for user Omer...')
    
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    if (listError) {
      console.error('Error listing users:', listError)
      return
    }

    // Look for user with name containing "Omer" (case insensitive)
    const omerUser = users.users.find(user => 
      user.user_metadata?.full_name?.toLowerCase().includes('omer') ||
      user.email?.toLowerCase().includes('omer')
    )

    if (!omerUser) {
      console.log('User Omer not found. Available users:')
      users.users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.user_metadata?.full_name || 'No name'}`)
      })
      return
    }

    console.log(`Found user: ${omerUser.email} (${omerUser.user_metadata?.full_name || 'No name'})`)
    
    // Change the password
    const newPassword = 'newpassword123' // You can change this to whatever you want
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      omerUser.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return
    }

    console.log('✅ Password successfully changed!')
    console.log(`New password for ${omerUser.email}: ${newPassword}`)
    console.log('⚠️  Please share this password securely with the user.')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the script
changeUserPassword()