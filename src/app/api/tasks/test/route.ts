import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Create task without Gemini (for testing)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title = 'Test Task',
      raw_input = 'This is a test task',
      energy_mode = 'routine',
      urls = [],
      priority = 'medium',
      due_date = null,
      emoji = '✅',
      progress = 0,
    } = body;

    // Insert task directly into Supabase without Gemini processing
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        raw_input,
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
  } catch (err) {
    console.error('Error in POST /api/tasks/test:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
