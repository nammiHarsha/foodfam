import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceId: string;
  hostId: string;
  experienceTitle: string;
  onReviewSubmitted: () => void;
}

const ReviewDialog = ({
  open,
  onOpenChange,
  experienceId,
  hostId,
  experienceTitle,
  onReviewSubmitted,
}: ReviewDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      reviewer_id: user.id,
      reviewed_user_id: hostId,
      experience_id: experienceId,
      rating,
      content: content.trim() || null,
    });

    if (error) {
      toast.error("Failed to submit review");
      console.error(error);
    } else {
      toast.success("Thank you for your review!");
      onReviewSubmitted();
      onOpenChange(false);
      setRating(5);
      setContent("");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Leave a Review</DialogTitle>
          <DialogDescription>
            Share your experience at "{experienceTitle}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-2 justify-center py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-honey text-honey"
                        : "text-muted stroke-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-muted-foreground text-sm">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="content">Your Review (optional)</Label>
            <Textarea
              id="content"
              placeholder="Tell others about your experience..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
