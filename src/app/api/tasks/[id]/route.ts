import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PATCH update task
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Whitelist allowable fields for update
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.raw_input !== undefined) updateData.raw_input = body.raw_input;
    if (body.energy_mode !== undefined) updateData.energy_mode = body.energy_mode;
    if (body.is_completed !== undefined) updateData.is_completed = body.is_completed;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, parseInt(body.progress, 10) || 0));
    }
    if (body.emoji !== undefined) updateData.emoji = body.emoji;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.urls !== undefined) updateData.urls = body.urls;

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(`Error updating task ${id} in Supabase:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (err: any) {
    console.error('Unexpected error in PATCH /api/tasks/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting task ${id} in Supabase:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Task ${id} deleted successfully` });
  } catch (err: any) {
    console.error('Unexpected error in DELETE /api/tasks/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
