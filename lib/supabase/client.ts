import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
    })
    throw new Error("Configuration Supabase manquante. Vérifiez vos variables d'environnement.")
  }

  console.log("[v0] Creating Supabase client with URL:", supabaseUrl)

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    throw new Error("Impossible de se connecter à Supabase. Vérifiez votre configuration.")
  }
}
