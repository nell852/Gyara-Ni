"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProfileFormProps {
  profile: {
    id: string
    email: string
    full_name: string
    phone: string | null
    role: string
  }
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const supabase = createClient()
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone: phone || null })
        .eq("id", profile.id)
      if (error) throw error
      setSuccess("Profil mis à jour avec succès")
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour")
    } finally {
      setIsLoading(false)
    }
  }

  const onSignOut = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Informations personnelles</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button type="button" variant="destructive" disabled={isLoggingOut} onClick={onSignOut}>
              {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


