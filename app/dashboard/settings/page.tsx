"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")

  // Pré-remplir les informations de l'utilisateur
  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = await supabase.auth.getUser()
      if (!user.data.user) return
      const { data } = await supabase
        .from("profiles")
        .select("full_name,email")
        .eq("id", user.data.user.id)
        .single()
      if (data) {
        setFullName(data.full_name || "")
        setEmail(data.email || "")
      }
    }
    fetchUserProfile()
  }, [supabase])

  const handleSave = async () => {
    setLoading(true)
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) return
      await supabase.from("profiles").update({
        full_name: fullName,
        email: email
      }).eq("id", user.data.user.id)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-3xl font-bold text-foreground">Paramètres du profil</h2>
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Modifiez vos informations et sauvegardez-les</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="fullName" className="font-medium">Nom complet</label>
            <Input
              id="fullName"
              placeholder="Nom complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-medium">Email</label>
            <Input
              id="email"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={loading} className="mt-4">
            {loading ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
