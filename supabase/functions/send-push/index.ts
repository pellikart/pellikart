// Supabase Edge Function: send-push
//
// Fans a newly-inserted `notifications` row out to the target user's registered
// devices via the Expo push service. Wire it as a Database Webhook so every
// notification the app writes (booking, visit, milestone, …) becomes a push
// with no extra app code:
//
//   Supabase Dashboard → Database → Webhooks → Create
//     Table:  notifications
//     Events: INSERT
//     Type:   Supabase Edge Function → send-push
//
// The webhook delivers `{ type: 'INSERT', record: <new row> }`. We look up the
// row's user_id in push_tokens and post to Expo. Because the function reads
// another user's tokens, it uses the service-role key (bypasses RLS) — that key
// stays server-side here and is never shipped in the app.
//
// Deploy:
//   supabase functions deploy send-push
//   supabase secrets set SB_URL=<project-url> SB_SERVICE_ROLE_KEY=<service-role-key>
//   (SUPABASE_* names are reserved, hence the SB_ prefix.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationRow {
  id: string
  user_id: string
  title: string
  body: string
  type: string
  deep_link?: string | null
}

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send'

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json()
    const record: NotificationRow | undefined = payload?.record
    if (!record?.user_id) {
      return new Response('no record', { status: 200 })
    }

    const supabase = createClient(
      Deno.env.get('SB_URL')!,
      Deno.env.get('SB_SERVICE_ROLE_KEY')!
    )

    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', record.user_id)
    if (error) throw error
    if (!tokens || tokens.length === 0) {
      return new Response('no devices', { status: 200 })
    }

    // One Expo message per device token. Expo accepts an array in a single POST.
    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: record.title,
      body: record.body,
      sound: 'default',
      data: { type: record.type, deepLink: record.deep_link ?? null, notificationId: record.id },
    }))

    const res = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    })
    const result = await res.json()

    return new Response(JSON.stringify({ sent: messages.length, expo: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[send-push] error:', e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
