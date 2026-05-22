import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenAI } from '@google/genai';

export async function GET(request: Request) {
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

    // Optional secret key check to protect this cron endpoint
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all incomplete tasks
    const { data: incompleteTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, urls')
      .eq('is_completed', false);

    if (fetchError) {
      console.error('Error fetching incomplete tasks:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!incompleteTasks || incompleteTasks.length === 0) {
      return NextResponse.json({ message: 'No incomplete tasks found for research' });
    }

    const results = [];

    // 2. Perform search-grounded research for each task
    // Note: We use sequential execution to prevent exceeding free-tier API rate limits
    for (const task of incompleteTasks) {
      try {
        const prompt = `Look at this open developer/study task: "${task.title}".
Search the web for any fresh 2026 tutorials, tools, documentation updates, or breaking news related to this exact topic.
Return a strict JSON response formatting a short 2-sentence summary and a list of verified URLs.

Format standard:
{
  "summary": "A 2-sentence summary detailing the latest findings or updates.",
  "urls": ["https://example1.com", "https://example2.com"]
}`;

        // Call Gemini with Google Search Grounding
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ text: prompt }],
          config: {
            // Enable search grounding
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                summary: { type: 'STRING' },
                urls: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                },
              },
              required: ['summary', 'urls'],
            },
          },
        });

        const researchText = response.text || '{}';
        const researchJSON = JSON.parse(researchText);

        // 3. Save the results straight into Supabase
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            ai_daily_research: researchJSON,
          })
          .eq('id', task.id);

        if (updateError) {
          console.error(`Error updating task research for ID ${task.id}:`, updateError);
          results.push({ id: task.id, status: 'failed_db_update', error: updateError.message });
        } else {
          results.push({ id: task.id, status: 'success', research: researchJSON });
        }

      } catch (taskErr: any) {
        console.error(`Error processing task research for ID ${task.id}:`, taskErr);
        results.push({ id: task.id, status: 'failed_gemini_api', error: taskErr.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed_count: incompleteTasks.length,
      results,
    });

  } catch (err: any) {
    console.error('Unexpected error in daily-research cron:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
