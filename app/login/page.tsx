import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <SignIn 
        signUpUrl="/signup" 
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
            card: "bg-card border border-border shadow-xl",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton: "bg-secondary border border-border text-foreground hover:bg-secondary/80",
            formFieldLabel: "text-foreground",
            formFieldInput: "bg-background border-border text-foreground",
            footerActionLink: "text-primary hover:text-primary/80",
          }
        }}
      />
    </div>
  )
}
