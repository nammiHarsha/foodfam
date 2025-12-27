import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Message, Profile } from "@/types/database";
import { toast } from "sonner";

type ConversationWithDetails = {
  id: string;
  created_at: string;
  updated_at: string;
  participants: { user_id: string; profile: Profile | null }[];
  lastMessage?: Message;
};

const Messages = () => {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");

  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to auth if not logged in (after loading is complete)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Create or select conversation with another user
  const createOrSelectConversation = useCallback(
    async (otherUserId: string) => {
      if (!user) return null;

      const { data: newConvId, error: convError } = await supabase.rpc(
        "create_conversation_with_participants",
        {
          participant_ids: [user.id, otherUserId],
        }
      );

      if (convError || !newConvId) {
        console.error("Failed to create conversation", convError);
        toast.error("Failed to start conversation");
        return null;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", otherUserId)
        .maybeSingle();

      const newConversation: ConversationWithDetails = {
        id: newConvId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        participants: [{ user_id: otherUserId, profile: (profile as Profile) ?? null }],
      };

      setConversations((prev) => {
        if (prev.some((c) => c.id === newConvId)) return prev;
        return [newConversation, ...prev];
      });

      setSelectedConversation(newConvId);
      setOtherUser(((profile as Profile) ?? null) as Profile | null);
      return newConvId;
    },
    [user]
  );

  // Fetch conversations once auth is ready
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchConversations = async () => {
      setLoadingConversations(true);

      try {
        const { data: participations, error: partError } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);

        if (partError) {
          console.error("Failed to fetch participations", partError);
          toast.error("Failed to load conversations");
          return;
        }

        if (!participations || participations.length === 0) {
          if (targetUserId && targetUserId !== user.id) {
            await createOrSelectConversation(targetUserId);
          }
          return;
        }

        const conversationIds = [...new Set(participations.map((p) => p.conversation_id))];

        const { data: conversationsData, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .in("id", conversationIds)
          .order("updated_at", { ascending: false });

        if (convError || !conversationsData) {
          console.error("Failed to fetch conversations", convError);
          toast.error("Failed to load conversations");
          return;
        }

        const { data: allParticipants, error: participantsError } = await supabase
          .from("conversation_participants")
          .select("conversation_id, user_id")
          .in("conversation_id", conversationIds);

        if (participantsError) {
          console.error("Failed to fetch participants", participantsError);
          toast.error("Failed to load conversations");
          return;
        }

        const otherUserIds = [
          ...new Set(allParticipants?.filter((p) => p.user_id !== user.id).map((p) => p.user_id) || []),
        ];

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", otherUserIds);

        if (profilesError) {
          console.error("Failed to fetch profiles", profilesError);
          toast.error("Failed to load conversations");
          return;
        }

        const conversationsWithDetails: ConversationWithDetails[] = await Promise.all(
          conversationsData.map(async (conv) => {
            const { data: lastMsg } = await supabase
              .from("messages")
              .select("*")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            const convParticipants =
              allParticipants
                ?.filter((p) => p.conversation_id === conv.id && p.user_id !== user.id)
                .map((p) => ({
                  user_id: p.user_id,
                  profile: (profiles?.find((prof) => prof.user_id === p.user_id) as Profile) ?? null,
                })) || [];

            return {
              ...(conv as any),
              participants: convParticipants,
              lastMessage: (lastMsg as Message) ?? undefined,
            };
          })
        );

        setConversations(conversationsWithDetails);

        if (targetUserId && targetUserId !== user.id) {
          const existingConv = conversationsWithDetails.find((c) =>
            c.participants.some((p) => p.user_id === targetUserId)
          );
          if (existingConv) {
            setSelectedConversation(existingConv.id);
            setOtherUser((existingConv.participants[0]?.profile ?? null) as Profile | null);
          } else {
            await createOrSelectConversation(targetUserId);
          }
        }
      } catch (error) {
        console.error("Error fetching conversations", error);
        toast.error("Failed to load conversations");
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [authLoading, user, targetUserId, createOrSelectConversation]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (authLoading || !user || !selectedConversation) return;

    const fetchMessages = async () => {
      setMessages([]);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch messages", error);
        toast.error("Failed to load messages");
        return;
      }

      setMessages((data as Message[]) || []);

      const conv = conversations.find((c) => c.id === selectedConversation);
      if (conv?.participants?.[0]?.profile) {
        setOtherUser(conv.participants[0].profile);
      }
    };

    fetchMessages();

    // Realtime subscription should not block UI
    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, user, selectedConversation, conversations]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedConversation) return;
    if (!newMessage.trim()) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConversation,
      sender_id: user.id,
      content: messageContent,
    });

    if (error) {
      console.error("Failed to send message", error);
      toast.error("Failed to send message");
      setNewMessage(messageContent);
    } else {
      // update conversation updated_at (non-blocking)
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConversation);
    }

    setSending(false);
  };

  // While auth is loading, show a simple loading state
  if (authLoading) {
    return (
      <Layout>
        <SEOHead title="Messages | FoodFam" description="Your conversations" />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  // If unauthenticated, keep UI stable (redirect is handled by effect)
  if (!user) {
    return (
      <Layout>
        <SEOHead title="Messages | FoodFam" description="Your conversations" />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <SEOHead title="Messages | FoodFam" description="Your conversations" />
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-3xl font-semibold mb-6">Messages</h1>

            <div className="bg-card rounded-xl shadow-warm overflow-hidden h-[600px] flex flex-col md:flex-row">
              {/* Conversations List */}
              <div
                className={cn(
                  "w-full md:w-80 border-b md:border-b-0 md:border-r border-border flex-shrink-0",
                  selectedConversation && "hidden md:block"
                )}
              >
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold">Conversations</h2>
                </div>

                <ScrollArea className="h-[240px] md:h-[calc(600px-57px)]">
                  {loadingConversations ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm mt-1">Start a conversation by messaging a host!</p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const participant = conv.participants[0];
                      return (
                        <button
                          key={conv.id}
                          onClick={() => {
                            setSelectedConversation(conv.id);
                            setMessages([]);
                            setOtherUser((participant?.profile ?? null) as Profile | null);
                          }}
                          className={cn(
                            "w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left",
                            selectedConversation === conv.id && "bg-secondary"
                          )}
                        >
                          <img
                            src={
                              participant?.profile?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant?.user_id}`
                            }
                            alt={participant?.profile?.full_name || "Conversation participant"}
                            className="w-12 h-12 rounded-full"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {participant?.profile?.full_name || "User"}
                            </p>
                            {conv.lastMessage && (
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.lastMessage.content}
                              </p>
                            )}
                          </div>
                          {conv.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conv.lastMessage.created_at), {
                                addSuffix: false,
                              })}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedConversation(null);
                      setMessages([]);
                      setOtherUser(null);
                      setNewMessage("");
                    }}
                    className={cn(
                      "md:hidden p-2 -ml-2 hover:bg-secondary rounded-lg",
                      !selectedConversation && "invisible"
                    )}
                    aria-label="Back to conversations"
                    type="button"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  {selectedConversation && otherUser ? (
                    <>
                      <img
                        src={
                          otherUser.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.user_id}`
                        }
                        alt={otherUser.full_name || "Chat participant"}
                        className="w-10 h-10 rounded-full"
                        loading="lazy"
                      />
                      <div>
                        <p className="font-semibold">{otherUser.full_name || "User"}</p>
                      </div>
                    </>
                  ) : (
                    <p className="font-semibold text-muted-foreground">Select a conversation</p>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {!selectedConversation ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Select a conversation to start chatting</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No messages yet</p>
                        <p className="text-sm mt-1">Send a message to start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            msg.sender_id === user.id ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2",
                              msg.sender_id === user.id
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-secondary rounded-bl-sm"
                            )}
                          >
                            <p>{msg.content}</p>
                            <span
                              className={cn(
                                "text-xs opacity-70 block mt-1",
                                msg.sender_id === user.id ? "text-right" : "text-left"
                              )}
                            >
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input (always visible when authenticated) */}
                <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2">
                  <Input
                    placeholder={
                      selectedConversation ? "Type a message..." : "Select a conversation to type"
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending || !selectedConversation}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !selectedConversation || !newMessage.trim()}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Messages;
