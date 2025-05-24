# Database Fix - Resolving RLS Policy Issues

This directory contains SQL fixes for issues in the Supabase database setup, particularly related to Row Level Security (RLS) policies.

## What's the Issue?

The error `infinite recursion detected in policy for relation "profiles"` occurs because:

1. There's a recursive dependency in a Row Level Security (RLS) policy for the `profiles` table
2. The policy is trying to query the same table it's protecting within its own condition, causing an infinite loop
3. This issue affects both login and signup operations, as both involve checking user profiles

## How to Fix It

You need to run the SQL script `fix-rls-policies.sql` in your Supabase SQL Editor:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Open the file `src/db/fix-rls-policies.sql` in your local project
4. Copy the entire content
5. Paste it into the SQL Editor in Supabase
6. Run the SQL script
7. Restart your application

## What the Fix Does

The fix makes these key changes:

1. Drops ALL existing policies for the profiles table to ensure a clean slate
2. Creates simplified policies that avoid recursive queries
3. Uses `current_setting('request.jwt.claims', true)::json` instead of `auth.jwt()` where needed to prevent recursion
4. Adds proper permissions grants to the authenticated role
5. Creates a service role bypass policy to ensure admin operations work correctly

## Code Changes

In addition to the database fixes, we've also updated the following code to be more resilient:

1. `authService.ts`: Modified to use the admin client to bypass RLS when getting user profiles
2. `profileService.ts`: Updated to use admin client for profile retrieval
3. `UserProvider.tsx`: Enhanced with retry logic for profile fetching

## Testing the Fix

After applying the SQL fixes, test your application by:

1. Logging in with an existing user
2. Creating a new user account (signup)
3. Verifying that profile data loads correctly
4. Confirming that recruiters can view candidate profiles
5. Ensuring candidates can only see their own profiles

## Common Issues

If you still encounter problems after running the fix:

1. Make sure you've restarted your application after applying the SQL changes
2. Check if any custom policies were added that aren't covered by the fix script
3. Verify that your JWT contains the correct role information in Supabase
4. Try using the admin client for any operations that still cause recursion issues

## Additional Resources

For more information on Supabase RLS policies:

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Troubleshooting RLS](https://supabase.com/docs/guides/auth/row-level-security/policies)
