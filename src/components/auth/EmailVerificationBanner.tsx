import { useState } from "react";
import { AlertTriangle, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailVerificationBannerProps {
  email: string;
}

const EmailVerificationBanner = ({ email }: EmailVerificationBannerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast.error("Failed to resend verification email");
    } else {
      toast.success("Verification email sent! Check your inbox.");
    }
    setResending(false);
  };

  if (dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Verify your email to unlock all features.</span>{" "}
              <span className="text-muted-foreground hidden sm:inline">
                Check your inbox for a verification link.
              </span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={resending}
              className="text-amber-700 hover:text-amber-800 hover:bg-amber-500/10"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${resending ? "animate-spin" : ""}`} />
              Resend
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed(true)}
              className="h-8 w-8 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
