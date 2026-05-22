import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action. Must be accept or reject.' }, { status: 400 });
    }

    // 1. Fetch current task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: fetchError?.message || 'Task not found' }, { status: 404 });
    }

    // 2. Perform actions based on accept/reject
    let updateData: any = {
      ai_daily_research: null, // Clear research
    };

    if (action === 'accept' && task.ai_daily_research) {
      const research = task.ai_daily_research;
      const researchSummary = research.summary || '';
      const researchUrls = research.urls || [];

      // Append summary to raw_input (description)
      const currentRawInput = task.raw_input || '';
      const newRawInput = currentRawInput
        ? `${currentRawInput}\n\n[AI Update]: ${researchSummary}`
        : `[AI Update]: ${researchSummary}`;

      updateData.raw_input = newRawInput;

      // Merge URLs, filtering out duplicates
      const currentUrls = task.urls || [];
      const mergedUrls = Array.from(new Set([...currentUrls, ...researchUrls]));
      updateData.urls = mergedUrls;
    }

    // 3. Update Supabase
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error(`Error updating task ${id} for research:`, updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/tasks/[id]/research:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
