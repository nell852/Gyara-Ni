import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to login - middleware will handle the rest
  redirect("/auth/login")
}
