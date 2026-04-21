-- ════════════════════════════════════════════
-- Storage Policies for vendor-photos bucket
--
-- IMPORTANT: First create the bucket manually in Supabase Dashboard:
-- Storage → New Bucket → Name: "vendor-photos" → Public: ON → Create
--
-- Then run this SQL to set up access policies.
-- ════════════════════════════════════════════

-- Allow authenticated users to upload to their own vendor folder
-- Path pattern: vendor-photos/{vendor_id}/{filename}
create policy "Vendors can upload own photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'vendor-photos'
  and (storage.foldername(name))[1] in (
    select id::text from vendors where user_id = auth.uid()
  )
);

-- Allow authenticated users to delete their own photos
create policy "Vendors can delete own photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'vendor-photos'
  and (storage.foldername(name))[1] in (
    select id::text from vendors where user_id = auth.uid()
  )
);

-- Allow anyone to read photos (public bucket)
create policy "Anyone can read vendor photos"
on storage.objects for select
to public
using (bucket_id = 'vendor-photos');
