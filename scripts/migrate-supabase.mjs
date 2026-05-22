#!/usr/bin/env node

/**
 * Direct Supabase Migration Script
 * Uses supabase-js client to run migrations from .env.local credentials
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Use service role key for admin access to run migrations
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  try {
    console.log('🚀 Running Supabase migration...');
    
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '0001_init.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing SQL from 0001_init.sql...');
    
    // Execute migration using rpc or direct admin call
    const { error } = await supabase.rpc('exec', {
      sql: migrationSql
    }).single();

    if (error) {
      // If rpc doesn't exist, try direct approach with individual statements
      console.log('⚠️  RPC exec not available, attempting direct execution...');
      
      // Split SQL statements and execute separately
      const statements = migrationSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: execError } = await supabase.query(statement);
        if (execError) {
          console.error('❌ SQL Error:', execError.message);
          throw execError;
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('📋 Tasks table has been created with RLS policies.');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
