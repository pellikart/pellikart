// Photo picking + upload for the listing flows.
//
// The web app selects files through <input type="file"> and, in live mode,
// uploads them to Supabase Storage via uploadPhotos(); in demo mode it just
// keeps the local object-URLs. This is the native equivalent:
//   • pickImages() → expo-image-picker, returns local file URIs.
//   • uploadListingMedia() → in demo mode returns the URIs unchanged (they
//     render fine locally); in live mode uploads each to the same
//     vendor-photos bucket the web uses and returns the public URLs.
//
// The web's shared uploadPhotos() takes File objects, which don't exist on a
// phone, so the live-mode upload is reimplemented here against the same bucket
// and path convention rather than reused.

import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase.native'

export async function pickImages(remaining: number): Promise<string[]> {
  if (remaining <= 0) return []
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) return []

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.85,
  })
  if (result.canceled) return []
  return result.assets.map((a) => a.uri)
}

/**
 * Turn picked local URIs into the URLs stored on the listing.
 * Demo mode: pass them straight through. Live mode: upload to Storage.
 */
export async function uploadListingMedia(
  vendorDbId: string | null,
  uris: string[],
  liveMode: boolean
): Promise<string[]> {
  if (!liveMode || !vendorDbId || !supabase) return uris

  const out: string[] = []
  for (const uri of uris) {
    try {
      const res = await fetch(uri)
      const bytes = await res.arrayBuffer()
      const ext = (uri.split('.').pop() || 'jpg').split('?')[0].toLowerCase()
      const path = `${vendorDbId}/listing/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error } = await supabase.storage
        .from('vendor-photos')
        .upload(path, bytes, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: false })
      if (error) {
        console.warn('[media] upload failed, keeping local uri:', error.message)
        out.push(uri)
        continue
      }
      const { data } = supabase.storage.from('vendor-photos').getPublicUrl(path)
      out.push(data.publicUrl)
    } catch (e) {
      console.warn('[media] upload threw, keeping local uri:', e)
      out.push(uri)
    }
  }
  return out
}
