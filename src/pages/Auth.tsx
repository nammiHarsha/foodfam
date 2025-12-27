import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEOHead from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
});

type AppRole = "host" | "guest";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect to home if already authenticated - uses centralized auth state
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      authSchema.parse({ email, password, fullName: isSignUp ? fullName : undefined });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Require role selection for signup
        if (selectedRoles.length === 0) {
          setErrors({ roles: "Please select a role to continue" });
          setLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: fullName },
          },
        });

        if (error) throw error;

        // Insert roles immediately after signup, before auth state change triggers redirect
        if (data.user) {
          const roleInserts = selectedRoles.map(role => 
            supabase.from("user_roles").insert({
              user_id: data.user!.id,
              role: role,
            })
          );
          
          const roleResults = await Promise.all(roleInserts);
          const roleErrors = roleResults.filter(r => r.error);
          
          if (roleErrors.length > 0) {
            console.error("Failed to assign roles:", roleErrors);
            toast.error("Account created but failed to assign role. Please contact support.");
            return;
          }
        }

        toast.success("Welcome to FoodFam! You're now signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={isSignUp ? "Join FoodFam" : "Sign In"}
        description="Join the global community of food lovers and start your culinary journey."
      />
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <span className="text-2xl">🍲</span>
              <span className="font-serif text-xl font-semibold">FoodFam</span>
            </Link>

            <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
              {isSignUp ? "Join the Family" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isSignUp
                ? "Create your account and start connecting through food"
                : "Sign in to continue your culinary journey"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="h-12"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {isSignUp && (
                <div className="space-y-3">
                  <Label>I want to join as <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-2 gap-4">
                    {(["host", "guest"] as AppRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSelectedRoles([role]);
                          setErrors(prev => ({ ...prev, roles: undefined }));
                        }}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          selectedRoles.includes(role)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        } ${errors.roles ? "border-destructive" : ""}`}
                      >
                        <span className="text-2xl mb-2 block">
                          {role === "host" ? "👨‍🍳" : "🍽️"}
                        </span>
                        <span className="text-sm font-medium capitalize">{role}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {role === "host" 
                            ? "Share your culinary experiences" 
                            : "Discover & book experiences"}
                        </p>
                      </button>
                    ))}
                  </div>
                  {errors.roles && (
                    <p className="text-sm text-destructive">{errors.roles}</p>
                  )}
                </div>
              )}

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-muted-foreground mt-6">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-medium hover:underline"
              >
                {isSignUp ? "Sign In" : "Join FoodFam"}
              </button>
            </p>
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden lg:block lg:w-1/2 bg-secondary relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&auto=format&fit=crop&q=80"
            alt="Cooking together"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12 text-primary-foreground">
            <p className="font-serif text-3xl mb-2">"Food is our common ground, a universal experience."</p>
            <p className="text-primary-foreground/80">— James Beard</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;