import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Remove.bg API key not configured' },
        { status: 500 }
      );
    }

    // Convert file to buffer once
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Helper function to call remove.bg API with specified size
    const callRemoveBg = async (size: 'full' | 'regular' | 'medium') => {
      const removeBgFormData = new FormData();
      const blob = new Blob([buffer], { type: imageFile.type });
      removeBgFormData.append('image_file', blob, imageFile.name);
      removeBgFormData.append('size', size);
      removeBgFormData.append('format', 'png');
      removeBgFormData.append('type', 'product');
      
      // Add quality parameters for better results
      if (size === 'full') {
        removeBgFormData.append('crop', 'false'); // Don't crop for full quality
        removeBgFormData.append('add_shadow', 'false'); // We'll add our own shadow
      }

      return fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
        },
        body: removeBgFormData,
      });
    };

    // Step 1: Try premium settings (full resolution)
    let response = await callRemoveBg('full');

    // Step 2: If premium fails, try medium quality before regular
    if (!response.ok) {
      const errorData = await response.json();
      console.log('Premium failed, trying medium quality...', errorData);
      
      response = await callRemoveBg('medium');
      
      // Step 3: If medium fails, fallback to regular (free tier)
      if (!response.ok) {
        console.log('Medium failed, falling back to regular quality...');
        response = await callRemoveBg('regular');
        
        // If all tiers fail, return error
        if (!response.ok) {
          const finalError = await response.json();
          console.error('Remove.bg API error:', finalError);
          return NextResponse.json(
            { error: 'Background removal failed', details: finalError },
            { status: response.status }
          );
        }
      }
    }

    // Return the processed image
    const processedImageBuffer = await response.arrayBuffer();

    return new NextResponse(processedImageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Background removal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}