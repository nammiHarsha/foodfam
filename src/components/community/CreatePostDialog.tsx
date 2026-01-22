import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { PostType, Experience } from "@/types/database";
import { Loader2 } from "lucide-react";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const postTypes: { value: PostType; label: string }[] = [
  { value: "cultural_dish", label: "🍜 Cultural Dish" },
  { value: "recipe", label: "📝 Recipe" },
  { value: "travel_memory", label: "✈️ Travel Memory" },
  { value: "experience_memory", label: "🎉 Experience Memory" },
];

const initialFormState = {
  title: "",
  content: "",
  post_type: "cultural_dish" as PostType,
  region: "",
  cuisine: "",
  image_url: "",
  experience_id: "",
};

const CreatePostDialog = ({ open, onOpenChange, onSuccess }: CreatePostDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [formData, setFormData] = useState(initialFormState);
  
  // Use ref to track if submission is in progress to prevent double-submits
  const isSubmittingRef = useRef(false);
  // Track the last successful submission time for debouncing
  const lastSubmitTimeRef = useRef(0);

  // Reset form completely when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Reset form state when dialog opens
      setFormData(initialFormState);
      setLoading(false);
      isSubmittingRef.current = false;
      
      // Fetch experiences if user is logged in
      if (user) {
        supabase
          .from("experiences")
          .select("*")
          .eq("host_id", user.id)
          .then(({ data }) => setExperiences(data as Experience[] || []));
      }
    } else {
      // Clean up when dialog closes
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [open, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isSubmittingRef.current = false;
      setLoading(false);
    };
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormState);
    setLoading(false);
    isSubmittingRef.current = false;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if not authenticated
    if (!user) {
      toast.error("Please log in to create a post");
      return;
    }

    // Prevent double-submission
    if (isSubmittingRef.current || loading) {
      console.log("Submission already in progress, ignoring");
      return;
    }

    // Debounce: minimum 500ms between submissions
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 500) {
      console.log("Too fast, debouncing submission");
      return;
    }

    // Validate content
    if (!formData.content.trim()) {
      toast.error("Please enter some content for your post");
      return;
    }

    // Mark submission as in progress
    isSubmittingRef.current = true;
    setLoading(true);
    lastSubmitTimeRef.current = now;

    try {
      const { error, data } = await supabase.from("community_posts").insert({
        author_id: user.id,
        title: formData.title.trim() || null,
        content: formData.content.trim(),
        post_type: formData.post_type,
        region: formData.region.trim() || null,
        cuisine: formData.cuisine.trim() || null,
        image_url: formData.image_url.trim() || null,
        experience_id: formData.experience_id || null,
      }).select();

      if (error) {
        // Check for rate limit error
        if (error.message?.includes("Rate limit exceeded")) {
          toast.error("You've reached the post limit. Please wait a while before posting again.", {
            duration: 5000,
          });
        } else {
          toast.error(`Failed to create post: ${error.message}`);
        }
        console.error("Post creation error:", error);
      } else {
        toast.success("Post created successfully! 🎉");
        
        // Reset form state completely
        resetForm();
        
        // Close dialog
        onOpenChange(false);
        
        // Add a small delay before calling onSuccess to ensure state is clean
        setTimeout(() => {
          onSuccess?.();
        }, 100);
      }
    } catch (err) {
      console.error("Unexpected error creating post:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      // Always reset loading state
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm();
      onOpenChange(false);
    }
  }, [loading, resetForm, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Create a Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Post Type</Label>
            <Select
              value={formData.post_type}
              onValueChange={(v) => setFormData({ ...formData, post_type: v as PostType })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Give your post a catchy title"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Share your story, recipe, or memory..."
              className="min-h-[120px]"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuisine">Cuisine</Label>
              <Input
                id="cuisine"
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                placeholder="e.g., Italian, Thai"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g., Tuscany, Bangkok"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
              disabled={loading}
            />
          </div>

          {formData.post_type === "experience_memory" && experiences.length > 0 && (
            <div className="space-y-2">
              <Label>Link to Experience</Label>
              <Select
                value={formData.experience_id}
                onValueChange={(v) => setFormData({ ...formData, experience_id: v })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an experience" />
                </SelectTrigger>
                <SelectContent>
                  {experiences.map((exp) => (
                    <SelectItem key={exp.id} value={exp.id}>
                      {exp.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="hero" 
              disabled={loading || !formData.content.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Share Post"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
