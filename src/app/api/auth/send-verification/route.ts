import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if required environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { email, confirmationUrl, userId } = await request.json();

    if (!email || !confirmationUrl) {
      return NextResponse.json(
        { error: 'Email and confirmation URL are required' },
        { status: 400 }
      );
    }

    // Call the custom email verification function
    const { data, error } = await supabase.rpc('send_custom_email_verification', {
      user_email: email,
      confirmation_url: confirmationUrl,
      user_id_param: userId || null
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    // In a real implementation, you would send the actual email here
    // using a service like SendGrid, AWS SES, or similar
    console.log('Email content prepared:', {
      to: data.email_to,
      subject: data.subject,
      logId: data.log_id
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      logId: data.log_id
    });

  } catch (error) {
    console.error('Error in send-verification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
