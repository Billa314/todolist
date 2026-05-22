import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in .env.local' },
        { status: 500 }
      );
    }

    // Instantiate Gemini Client inside request handler to prevent build-time static evaluation crashes
    const ai = new GoogleGenAI({ apiKey });

    let rawInputText = '';
    let audioPart: any = null;

    // Optional metadata fields that could be passed in
    let priority = 'medium';
    let due_date: string | null = null;
    let emoji = '🧠';
    let progress = 0;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File | null;
      const textParam = formData.get('text') as string | null;
      
      // Extract optional fields from form data
      priority = (formData.get('priority') as string) || 'medium';
      due_date = formData.get('due_date') as string | null;
      emoji = (formData.get('emoji') as string) || '🧠';
      
      const progressParam = formData.get('progress') as string | null;
      if (progressParam) {
        progress = parseInt(progressParam, 10) || 0;
      }

      if (audioFile) {
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        audioPart = {
          inlineData: {
            data: base64Audio,
            mimeType: audioFile.type || 'audio/webm',
          },
        };
        rawInputText = '[Voice input processed directly via Gemini Multi-Modal]';
      } else if (textParam) {
        rawInputText = textParam;
      } else {
        return NextResponse.json(
          { error: 'Neither audio nor text was provided in the form data' },
          { status: 400 }
        );
      }
    } else {
      // Treat as JSON
      const body = await request.json();
      rawInputText = body.text || '';
      priority = body.priority || 'medium';
      due_date = body.due_date || null;
      emoji = body.emoji || '🧠';
      progress = body.progress || 0;

      if (!rawInputText) {
        return NextResponse.json(
          { error: 'No text provided in the JSON body' },
          { status: 400 }
        );
      }
    }

    // Prepare contents array for Gemini
    const contents: any[] = [];
    if (audioPart) {
      contents.push(audioPart);
    }

    const systemPrompt = `You are a cognitive task parsing assistant. 
Analyze the input (audio or text description) and extract:
1. title: A short, professional task name summarizing the core action (e.g. "Prepare UI mockup" or "Wash laundry").
2. energy_mode: Deduce which cognitive energy mode matches this task:
   - 'high_brain': High focus, deep thinking, or complex learning (e.g., coding, complex writing, study, research).
   - 'routine': Standard day-to-day administrative tasks, chores, emails, updates.
   - 'fried': Low focus, mechanical, easy or relaxing tasks (e.g., watering plants, washing dishes, stretching).
3. extracted_urls: List any full web links/URLs found or mentioned in the task description. If none, return an empty array.

Always respond in a strict JSON format matching the schema requested.`;

    contents.push({
      text: `${systemPrompt}\n\nUser Input/Transcription:\n"${rawInputText}"`,
    });

    // Call Gemini API using gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            energy_mode: { 
              type: 'STRING', 
              enum: ['high_brain', 'routine', 'fried'] 
            },
            extracted_urls: { 
              type: 'ARRAY', 
              items: { type: 'STRING' } 
            },
          },
          required: ['title', 'energy_mode', 'extracted_urls'],
        },
      },
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    const title = parsedData.title || 'Untitled Voice Task';
    const energy_mode = parsedData.energy_mode || 'routine';
    const urls = parsedData.extracted_urls || [];

    // Insert task into Supabase database
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        raw_input: rawInputText,
        energy_mode,
        urls,
        priority,
        due_date,
        progress,
        emoji,
        is_completed: false,
        images: [],
      })
      .select('*')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    console.error('Error in POST /api/tasks/create:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
