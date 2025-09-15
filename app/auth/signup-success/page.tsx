import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img
              src="/logo.jpg"
              alt="Gyara Ni Logo"
              className="h-16 w-16 rounded-xl object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Gyara Ni</h1>
          <p className="text-muted-foreground mt-2">Gestion de boutique intelligente</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Mail className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-foreground">Compte créé avec succès !</CardTitle>
            <CardDescription className="text-muted-foreground">
              Vérifiez votre email pour confirmer votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Nous avons envoyé un email de confirmation à votre adresse. Veuillez cliquer sur le lien dans l'email pour
              activer votre compte avant de vous connecter.
            </p>
            <div className="pt-4">
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/auth/login">Retour à la connexion</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
