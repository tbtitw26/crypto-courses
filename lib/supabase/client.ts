// lib/supabase/client.ts - Server-side Supabase client factory

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseServerClient: SupabaseClient | null = null

function ensureEnv(name: string, value?: string) {
  if (!value) {
    throw new Error(`Missing required Supabase environment variable: ${name}`)
  }
  return value
}

export function getSupabaseServerClient(): SupabaseClient {
  if (supabaseServerClient) {
    return supabaseServerClient
  }

  const supabaseUrl = ensureEnv('SUPABASE_URL', process.env.SUPABASE_URL)
  const serviceRoleKey = ensureEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)

  supabaseServerClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })

  return supabaseServerClient
}

