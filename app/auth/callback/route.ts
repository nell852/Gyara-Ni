import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { event, session } = await request.json()
    
    let response = NextResponse.json({ success: true })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => 
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      if (session) {
        await supabase.auth.setSession(session)
      }
    } else if (event === "SIGNED_OUT") {
      await supabase.auth.signOut()
    }

    return response
  } catch (error) {
    console.error("[v0] Auth callback error:", error)
    return NextResponse.json({ error: "Auth callback failed" }, { status: 500 })
  }
}