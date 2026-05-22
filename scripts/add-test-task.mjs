#!/usr/bin/env node

/**
 * Manually insert a task into Supabase
 * Bypasses Gemini API - tests database connection directly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestTask() {
  try {
    console.log('📝 Adding test task to Supabase...');

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: 'Learn Next.js and Supabase Integration',
        raw_input: 'Study how to build full-stack apps with Next.js and Supabase',
        energy_mode: 'high_brain',
        urls: ['https://nextjs.org/docs', 'https://supabase.com/docs'],
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        progress: 0,
        emoji: '📚',
        is_completed: false,
        images: [],
      })
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error inserting task:', error.message);
      process.exit(1);
    }

    console.log('✅ Task added successfully!');
    console.log('📋 Task details:');
    console.log(JSON.stringify(task, null, 2));

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

addTestTask();
