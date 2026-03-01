import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Speech-to-text endpoint using z-ai-web-dev-sdk
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    // Convert file to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    // Initialize ZAI
    const zai = await ZAI.create();
    
    // Use ASR (speech-to-text) capability
    // The z-ai-web-dev-sdk provides ASR functionality
    const result = await zai.asr.transcribe({
      audio: base64Audio,
      format: audioFile.type.split('/')[1] || 'webm',
    });
    
    return NextResponse.json({ 
      text: result.text || result,
      success: true 
    });
    
  } catch (error) {
    console.error('Speech-to-text error:', error);
    
    // Fallback: Return placeholder for demo purposes
    // In production, ensure proper ASR integration
    return NextResponse.json({ 
      text: '',
      error: error instanceof Error ? error.message : 'Speech recognition failed',
      success: false 
    });
  }
}
