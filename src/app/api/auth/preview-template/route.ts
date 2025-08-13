import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get('template') || 'email_verification';
    const language = searchParams.get('lang') || 'az';
    const sampleUrl = searchParams.get('url') || 'https://suni-intellekt.az/verify?token=sample-token';

    // Call the preview function
    const { data, error } = await supabase.rpc('preview_email_template', {
      p_template_type: templateType,
      p_language_code: language,
      p_sample_url: sampleUrl
    });

    if (error) {
      console.error('Error previewing email template:', error);
      return NextResponse.json(
        { error: 'Failed to preview email template' },
        { status: 500 }
      );
    }

    if (!data || !data.success) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Return HTML preview
    const returnType = searchParams.get('format') || 'json';
    
    if (returnType === 'html') {
      return new NextResponse(data.html_content, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    return NextResponse.json({
      success: true,
      template_type: templateType,
      language: language,
      subject: data.subject,
      html_content: data.html_content,
      text_content: data.text_content,
      preview_url: data.preview_url
    });

  } catch (error) {
    console.error('Error in preview-template API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
