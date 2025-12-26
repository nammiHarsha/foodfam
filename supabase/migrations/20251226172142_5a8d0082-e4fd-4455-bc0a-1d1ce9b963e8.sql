-- Step 1: Add 'guest' to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'guest';