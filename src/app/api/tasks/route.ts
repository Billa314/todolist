import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all tasks
export async function GET() {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks from Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tasks });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/tasks:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
