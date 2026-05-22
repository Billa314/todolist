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

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks });
  } catch (err: unknown) {
    console.error('Unexpected error in GET /api/tasks:', err);

    const message =
      err instanceof Error ? err.message : 'Internal Server Error';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}