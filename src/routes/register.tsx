import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — NeonTop" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { display_name: displayName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your email to confirm, then sign in.");
    router.navigate({ to: "/login" });
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="glass-strong rounded-3xl p-8 neon-ring">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1">Join NeonTop and start topping up in seconds.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label>Display name</Label>
            <Input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-[var(--gradient-primary)] text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Already have an account? <Link to="/login" className="text-foreground underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
