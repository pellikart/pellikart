-- Add portfolio_photos column to vendors table
alter table vendors add column if not exists portfolio_photos jsonb default '[]'::jsonb;
