# Run Supabase Migration Manually

Since Supabase CLI requires browser-based authentication, use this method instead:

## Option 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Log in and select your project `epttffnwaddywnvvinlj`
3. Navigate to **SQL Editor** → **New Query**
4. Copy the SQL from `schema.sql` or `supabase/migrations/0001_init.sql`
5. Paste it into the SQL editor
6. Click **Run**

Your `tasks` table will be created with RLS policies.

## Option 2: Using Your Existing Credentials

Your `.env.local` already has valid Supabase credentials that work with your app. The CLI just needs authentication differently.

If you want to try CLI again:
- Go to [Supabase Settings → Access Tokens](https://app.supabase.com/account/tokens)
- Create a new personal access token
- Run: `npx supabase login --token YOUR_TOKEN`
- Then: `npx supabase link --project-ref epttffnwaddywnvvinlj`
- Finally: `npx supabase db push`

## Verify the Table Exists

Once created, check in Supabase Dashboard:
1. Go to **Table Editor**
2. You should see a `tasks` table listed
3. It should have columns: `id`, `title`, `raw_input`, `energy_mode`, `urls`, `is_completed`, `priority`, `due_date`, `progress`, `emoji`, `images`, `ai_daily_research`, `created_at`

## Next Steps

After the table is created:
```bash
npm run dev
```

Your app should now connect to the database successfully.
