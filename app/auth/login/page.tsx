"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  const [isPageReady, setIsPageReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsPageReady(true)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      setSupabaseError("Configuration Supabase manquante. Vérifiez les variables d'environnement.")
      return
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (supabaseError) {
      setError(supabaseError)
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw new Error(sessionError.message)

      if (session) {
        const response = await fetch("/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "SIGNED_IN", session }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Auth callback failed: ${response.status} ${errorText}`)
        }

        window.location.assign("/dashboard")
      } else {
        throw new Error("No session after login")
      }
    } catch (error: unknown) {
      if (error instanceof Error) setError(error.message)
      else setError("Une erreur s'est produite lors de la connexion")
      setIsLoading(false)
    }
  }

  if (!isPageReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo.jpg" alt="Gyara Ni Logo" className="h-16 w-16 rounded-xl object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Gyara Ni</h1>
          <p className="text-muted-foreground mt-2">Gestion de boutique intelligente</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">Connexion</CardTitle>
            <CardDescription className="text-muted-foreground">
              Connectez-vous à votre compte pour accéder au tableau de bord
            </CardDescription>
          </CardHeader>
          <CardContent>
            {supabaseError && (
              <div className="mb-4 p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                <strong>Erreur de configuration:</strong> {supabaseError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-border bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border bg-background"
                />
              </div>
              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading || !!supabaseError}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link href="/auth/signup" className="text-primary hover:text-primary/80 underline underline-offset-4">
                Créer un compte
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
