import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Message, Profile } from "@/types/database";

type ConversationWithDetails = {
  id: string;
  created_at: string;
  updated_at: string;
  participants: { user_id: string; profile: Profile | null }[];
  lastMessage?: Message;
};

function toReadableError(err: unknown) {
  const anyErr = err as any;
  return (
    anyErr?.message ||
    anyErr?.error_description ||
    anyErr?.details ||
    "Something went wrong. Please try again."
  );
}

export default function Messages() {
  const { user, session, authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");

  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [activePeerUserId, setActivePeerUserId] = useState<string | null>(targetUserId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [startingConversation, setStartingConversation] = useState(false);
  const [startConversationError, setStartConversationError] = useState<string | null>(null);

  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canUseMessaging = useMemo(() => Boolean(user && session), [user, session]);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return (data as Profile) ?? null;
  }, []);

  const findExistingConversationId = useCallback(
    async (peerUserId: string) => {
      if (!user) return null;

      const { data: myParticipations, error: mineError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (mineError) throw mineError;

      const myConversationIds = Array.from(
        new Set((myParticipations ?? []).map((p) => p.conversation_id).filter(Boolean))
      ) as string[];

      if (myConversationIds.length === 0) return null;

      const { data: shared, error: sharedError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", peerUserId)
        .in("conversation_id", myConversationIds)
        .limit(1)
        .maybeSingle();

      if (sharedError) throw sharedError;
      return (shared?.conversation_id as string | undefined) ?? null;
    },
    [user]
  );

  const ensureConversation = useCallback(
    async (peerUserId: string) => {
      if (!user || !session) {
        throw new Error("Please sign in to start a conversation.");
      }
      if (peerUserId === user.id) {
        throw new Error("You can’t message yourself.");
      }

      setStartingConversation(true);
      setStartConversationError(null);

      try {
        // 1) Prefer selecting an existing conversation (avoid creating duplicates)
        const existingId = await findExistingConversationId(peerUserId);
        const conversationId =
          existingId ??
          (await (async () => {
            // 2) Otherwise create via RPC (ONLY way we create conversations)
            const { data, error } = await supabase.rpc(
              "create_conversation_with_participants",
              {
                participant_ids: [user.id, peerUserId],
              } as any
            );

            if (error || !data) throw error ?? new Error("Failed to start conversation");

            // 3) Validate: conversation row exists + participants exist
            const [{ data: convRow, error: convErr }, { data: parts, error: partsErr }] =
              await Promise.all([
                supabase.from("conversations").select("id").eq("id", data).maybeSingle(),
                supabase
                  .from("conversation_participants")
                  .select("user_id")
                  .eq("conversation_id", data),
              ]);

            if (convErr || !convRow) throw convErr ?? new Error("Conversation was not created.");
            if (partsErr) throw partsErr;
            if ((parts ?? []).length < 2) {
              throw new Error("Conversation participants were not created.");
            }

            return data as string;
          })());

        const peerProfile = await fetchProfile(peerUserId);

        setSelectedConversationId(conversationId);
        setActivePeerUserId(peerUserId);
        setOtherUser(peerProfile);

        // Keep conversation list stable (add if missing)
        setConversations((prev) => {
          if (prev.some((c) => c.id === conversationId)) return prev;
          return [
            {
              id: conversationId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              participants: [{ user_id: peerUserId, profile: peerProfile }],
            },
            ...prev,
          ];
        });

        return conversationId;
      } catch (e) {
        const msg = toReadableError(e);
        setStartConversationError(msg);
        toast.error(msg);
        throw e;
      } finally {
        setStartingConversation(false);
      }
    },
    [fetchProfile, findExistingConversationId, session, user]
  );

  // Keep activePeerUserId in sync with ?user=...
  useEffect(() => {
    setActivePeerUserId(targetUserId);
  }, [targetUserId]);

  // Fetch conversations (UI should always render; this only populates left panel)
  useEffect(() => {
    if (authLoading) return;

    const run = async () => {
      if (!user) {
        setConversations([]);
        setLoadingConversations(false);
        return;
      }

      setLoadingConversations(true);
      try {
        const { data: participations, error: partError } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);

        if (partError) throw partError;

        const conversationIds = Array.from(
          new Set((participations ?? []).map((p) => p.conversation_id).filter(Boolean))
        ) as string[];

        if (conversationIds.length === 0) {
          setConversations([]);
          return;
        }

        const [{ data: conversationsData, error: convError }, { data: allParticipants, error: pErr }] =
          await Promise.all([
            supabase
              .from("conversations")
              .select("*")
              .in("id", conversationIds)
              .order("updated_at", { ascending: false }),
            supabase
              .from("conversation_participants")
              .select("conversation_id, user_id")
              .in("conversation_id", conversationIds),
          ]);

        if (convError) throw convError;
        if (pErr) throw pErr;

        const otherUserIds = Array.from(
          new Set((allParticipants ?? []).filter((p) => p.user_id !== user.id).map((p) => p.user_id))
        ) as string[];

        const { data: profiles, error: profilesError } = otherUserIds.length
          ? await supabase.from("profiles").select("*").in("user_id", otherUserIds)
          : { data: [], error: null };

        if (profilesError) throw profilesError;

        const lastMsgs = await Promise.all(
          (conversationsData ?? []).map(async (conv) => {
            const { data: lastMsg } = await supabase
              .from("messages")
              .select("*")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            return { conversationId: conv.id as string, lastMsg: (lastMsg as Message) ?? null };
          })
        );

        const conversationsWithDetails: ConversationWithDetails[] = (conversationsData ?? []).map(
          (conv: any) => {
            const convParticipants = (allParticipants ?? [])
              .filter((p) => p.conversation_id === conv.id && p.user_id !== user.id)
              .map((p) => ({
                user_id: p.user_id as string,
                profile: ((profiles ?? []).find((prof: any) => prof.user_id === p.user_id) as Profile) ??
                  null,
              }));

            const lm = lastMsgs.find((m) => m.conversationId === conv.id)?.lastMsg ?? null;

            return {
              ...conv,
              participants: convParticipants,
              lastMessage: lm ?? undefined,
            };
          }
        );

        setConversations(conversationsWithDetails);
      } catch (e) {
        console.error("Failed to load conversations", e);
        toast.error("Failed to load conversations");
      } finally {
        setLoadingConversations(false);
      }
    };

    run();
  }, [authLoading, user]);

  // If we have a target user (via URL), ensure the conversation exists via RPC/select, then enable input.
  useEffect(() => {
    if (authLoading) return;
    if (!canUseMessaging) return;
    if (!activePeerUserId) return;

    // If we're already on a conversation with this peer, don't redo work.
    const alreadySelected = conversations.some(
      (c) => c.id === selectedConversationId && c.participants.some((p) => p.user_id === activePeerUserId)
    );
    if (alreadySelected) return;

    // Fire and forget; errors handled inside ensureConversation.
    ensureConversation(activePeerUserId).catch(() => undefined);
  }, [activePeerUserId, authLoading, canUseMessaging, conversations, ensureConversation, selectedConversationId]);

  // Fetch messages + realtime when conversation is selected
  useEffect(() => {
    if (authLoading) return;
    if (!canUseMessaging) return;
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversationId)
        .order("created_at", { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.error("Failed to fetch messages", error);
        toast.error("Failed to load messages");
        setMessages([]);
      } else {
        setMessages(((data as Message[]) ?? []).slice());
      }

      setLoadingMessages(false);

      const conv = conversations.find((c) => c.id === selectedConversationId);
      const peerProfile = (conv?.participants?.[0]?.profile ?? null) as Profile | null;
      if (peerProfile) setOtherUser(peerProfile);
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${selectedConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as any).id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [authLoading, canUseMessaging, conversations, selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const onSelectConversation = useCallback(
    async (conv: ConversationWithDetails) => {
      const peer = conv.participants[0];
      const peerId = peer?.user_id ?? null;

      setSelectedConversationId(conv.id);
      setOtherUser((peer?.profile ?? null) as Profile | null);
      setActivePeerUserId(peerId);

      // Keep URL stable for refreshability, but do not change routes.
      if (peerId) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("user", peerId);
          return next;
        });
      }
    },
    [setSearchParams]
  );

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!newMessage.trim()) return;

      if (!user || !session) {
        toast.error("Please sign in to send messages.");
        return;
      }

      const peerId = activePeerUserId;
      if (!peerId) {
        toast.error("Select a conversation first.");
        return;
      }

      setSending(true);
      const messageContent = newMessage.trim();
      setNewMessage("");

      try {
        const conversationId =
          selectedConversationId ?? (await ensureConversation(peerId).catch(() => null));

        if (!conversationId) {
          // ensureConversation already displayed a toast
          setNewMessage(messageContent);
          return;
        }

        const { error } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: messageContent,
        });

        if (error) throw error;

        // non-blocking metadata update
        supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId)
          .then(() => undefined);
      } catch (err) {
        console.error("Failed to send message", err);
        toast.error(toReadableError(err));
        setNewMessage(messageContent);
      } finally {
        setSending(false);
      }
    },
    [activePeerUserId, ensureConversation, newMessage, selectedConversationId, session, user]
  );

  const inputDisabled =
    authLoading ||
    sending ||
    startingConversation ||
    !canUseMessaging ||
    !activePeerUserId ||
    !selectedConversationId;

  const inputPlaceholder = (() => {
    if (authLoading) return "Loading…";
    if (!canUseMessaging) return "Sign in to send messages";
    if (!activePeerUserId) return "Select a conversation to type";
    if (startingConversation) return "Starting conversation…";
    if (!selectedConversationId) return "Starting conversation…";
    return "Type a message…";
  })();

  return (
    <>
      <SEOHead title="Messages | FoodFam" description="Your conversations" />
      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <header className="mb-6">
              <h1 className="font-serif text-3xl font-semibold">Messages</h1>
            </header>

            <section className="bg-card rounded-xl shadow-warm overflow-hidden h-[600px] flex flex-col md:flex-row">
              {/* Conversations List */}
              <aside
                className={cn(
                  "w-full md:w-80 border-b md:border-b-0 md:border-r border-border flex-shrink-0",
                  selectedConversationId && "hidden md:block"
                )}
                aria-label="Conversation list"
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
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const participant = conv.participants[0];
                      return (
                        <button
                          key={conv.id}
                          onClick={() => onSelectConversation(conv)}
                          className={cn(
                            "w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left",
                            selectedConversationId === conv.id && "bg-secondary"
                          )}
                          type="button"
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
              </aside>

              {/* Chat Area */}
              <section className="flex-1 flex flex-col" aria-label="Chat area">
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedConversationId(null);
                      setMessages([]);
                      setOtherUser(null);
                      setNewMessage("");
                      setStartConversationError(null);
                    }}
                    className={cn(
                      "md:hidden p-2 -ml-2 hover:bg-secondary rounded-lg",
                      !selectedConversationId && "invisible"
                    )}
                    aria-label="Back to conversations"
                    type="button"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  {selectedConversationId && otherUser ? (
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
                    {!canUseMessaging ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Sign in to view and send messages.</p>
                      </div>
                    ) : !selectedConversationId ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Select a conversation to start chatting</p>
                      </div>
                    ) : loadingMessages ? (
                      <div className="space-y-3">
                        <Skeleton className="h-10 w-2/3" />
                        <Skeleton className="h-10 w-1/2 ml-auto" />
                        <Skeleton className="h-10 w-2/3" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No messages yet. Say hello 👋</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
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
                            <span
                              className={cn(
                                "text-xs opacity-70 block mt-1",
                                msg.sender_id === user?.id ? "text-right" : "text-left"
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

                {/* Message Input (ALWAYS visible) */}
                <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2">
                  <div className="flex-1">
                    {startConversationError && (
                      <p className="text-sm text-destructive mb-2">{startConversationError}</p>
                    )}
                    <Input
                      placeholder={inputPlaceholder}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={inputDisabled}
                      className="w-full"
                      aria-label="Message"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={inputDisabled || !newMessage.trim()}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </section>
            </section>
          </div>
        </main>
      </Layout>
    </>
  );
}
