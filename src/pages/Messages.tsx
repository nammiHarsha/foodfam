import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
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

type ConversationWithDetails = {
  id: string;
  created_at: string;
  updated_at: string;
  participants: { user_id: string; profile: Profile }[];
  lastMessage?: Message;
};

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");

  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchConversations = async () => {
      // Get all conversations where user is a participant
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (!participations || participations.length === 0) {
        // If targeting a user, create new conversation
        if (targetUserId && targetUserId !== user.id) {
          await createOrSelectConversation(targetUserId);
        }
        setLoading(false);
        return;
      }

      const conversationIds = participations.map((p) => p.conversation_id);

      // Get conversation details with participants
      const { data: conversationsData } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (!conversationsData) {
        setLoading(false);
        return;
      }

      // Get all participants for these conversations
      const { data: allParticipants } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", conversationIds);

      // Get profiles for other participants
      const otherUserIds = [...new Set(
        allParticipants?.filter((p) => p.user_id !== user.id).map((p) => p.user_id) || []
      )];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", otherUserIds);

      // Get last message for each conversation
      const conversationsWithDetails: ConversationWithDetails[] = await Promise.all(
        conversationsData.map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const convParticipants = allParticipants
            ?.filter((p) => p.conversation_id === conv.id && p.user_id !== user.id)
            .map((p) => ({
              user_id: p.user_id,
              profile: profiles?.find((prof) => prof.user_id === p.user_id) as Profile,
            })) || [];

          return {
            ...conv,
            participants: convParticipants,
            lastMessage: lastMsg as Message | undefined,
          };
        })
      );

      setConversations(conversationsWithDetails);

      // If targeting a user, find or create conversation
      if (targetUserId && targetUserId !== user.id) {
        const existingConv = conversationsWithDetails.find((c) =>
          c.participants.some((p) => p.user_id === targetUserId)
        );
        if (existingConv) {
          setSelectedConversation(existingConv.id);
        } else {
          await createOrSelectConversation(targetUserId);
        }
      }

      setLoading(false);
    };

    fetchConversations();
  }, [user, navigate, targetUserId]);

  const createOrSelectConversation = async (otherUserId: string) => {
    if (!user) return;

    // Use secure RPC function to create conversation with participants
    const { data: newConvId, error: convError } = await supabase
      .rpc('create_conversation_with_participants', {
        participant_ids: [user.id, otherUserId]
      });

    if (convError || !newConvId) {
      console.error("Failed to create conversation", convError);
      return;
    }

    // Get other user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", otherUserId)
      .maybeSingle();

    const newConversation: ConversationWithDetails = {
      id: newConvId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      participants: [{ user_id: otherUserId, profile: profile as Profile }],
    };

    setConversations((prev) => [newConversation, ...prev]);
    setSelectedConversation(newConvId);
  };

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation)
        .order("created_at", { ascending: true });

      setMessages((data as Message[]) || []);

      // Get other user info
      const conv = conversations.find((c) => c.id === selectedConversation);
      if (conv && conv.participants[0]) {
        setOtherUser(conv.participants[0].profile);
      }
    };

    fetchMessages();

    // Subscribe to new messages
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
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, conversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConversation,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConversation);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <HelmetProvider>
      <SEOHead title="Messages | FoodFam" description="Your conversations" />
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-3xl font-semibold mb-6">Messages</h1>

            <div className="bg-card rounded-xl shadow-warm overflow-hidden h-[600px] flex">
              {/* Conversations List */}
              <div className={cn(
                "w-full md:w-80 border-r border-border flex-shrink-0",
                selectedConversation && "hidden md:block"
              )}>
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold">Conversations</h2>
                </div>
                <ScrollArea className="h-[calc(600px-57px)]">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No conversations yet</p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const participant = conv.participants[0];
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv.id)}
                          className={cn(
                            "w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left",
                            selectedConversation === conv.id && "bg-secondary"
                          )}
                        >
                          <img
                            src={participant?.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant?.user_id}`}
                            alt={participant?.profile?.full_name || "User"}
                            className="w-12 h-12 rounded-full"
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
                              {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: false })}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className={cn(
                "flex-1 flex flex-col",
                !selectedConversation && "hidden md:flex"
              )}>
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-border flex items-center gap-3">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-2 -ml-2 hover:bg-secondary rounded-lg"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      {otherUser && (
                        <>
                          <img
                            src={otherUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.user_id}`}
                            alt={otherUser.full_name || "User"}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-semibold">{otherUser.full_name || "User"}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              msg.sender_id === user?.id ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-2",
                                msg.sender_id === user?.id
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-secondary rounded-bl-sm"
                              )}
                            >
                              <p>{msg.content}</p>
                              <span className={cn(
                                "text-xs opacity-70 block mt-1",
                                msg.sender_id === user?.id ? "text-right" : "text-left"
                              )}>
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                        className="flex-1"
                      />
                      <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </HelmetProvider>
  );
};

export default Messages;
