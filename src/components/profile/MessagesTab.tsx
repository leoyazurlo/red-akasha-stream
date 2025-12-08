import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Inbox, 
  Mail,
  MailOpen,
  Loader2,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender_profile?: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  };
  receiver_profile?: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  };
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

export const MessagesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
      
      // Subscribe to new messages
      const channel = supabase
        .channel('direct_messages_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            fetchConversations();
            if (selectedConversation) {
              fetchMessages(selectedConversation);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      // Get all messages where user is sender or receiver
      const { data: allMessages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, {
        messages: Message[];
        partnerId: string;
      }>();

      for (const msg of allMessages || []) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            messages: [],
            partnerId,
          });
        }
        conversationMap.get(partnerId)!.messages.push(msg);
      }

      // Fetch partner profiles
      const partnerIds = Array.from(conversationMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name')
        .in('id', partnerIds);

      // Build conversation list
      const convList: Conversation[] = [];
      
      for (const [partnerId, data] of conversationMap) {
        const profile = profiles?.find(p => p.id === partnerId);
        const lastMsg = data.messages[0];
        const unreadCount = data.messages.filter(
          m => m.receiver_id === user.id && !m.read
        ).length;

        convList.push({
          partnerId,
          partnerName: profile?.full_name || profile?.username || 'Usuario',
          partnerAvatar: profile?.avatar_url || null,
          lastMessage: lastMsg.message,
          lastMessageDate: lastMsg.created_at,
          unreadCount,
        });
      }

      // Sort by last message date
      convList.sort((a, b) => 
        new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
      );

      setConversations(convList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;
    
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark unread messages as read
      const unreadIds = (data || [])
        .filter(m => m.receiver_id === user.id && !m.read)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ read: true })
          .in('id', unreadIds);
        
        // Refresh conversations to update unread count
        fetchConversations();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (partnerId: string) => {
    setSelectedConversation(partnerId);
    fetchMessages(partnerId);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
      await fetchMessages(selectedConversation);
      await fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const selectedPartner = conversations.find(c => c.partnerId === selectedConversation);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Mensajes Directos
              {totalUnread > 0 && (
                <Badge className="bg-red-500 text-white ml-2">
                  {totalUnread} nuevo{totalUnread > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Gestiona tus conversaciones con otros socios
            </CardDescription>
          </div>
          {selectedConversation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConversation(null)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!selectedConversation ? (
          // Conversation List
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tienes mensajes aún</p>
                <p className="text-sm mt-2">
                  Los mensajes que recibas de otros socios aparecerán aquí
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.partnerId}
                  onClick={() => handleSelectConversation(conv.partnerId)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-lg transition-all",
                    "hover:bg-primary/10 border border-transparent hover:border-primary/20",
                    conv.unreadCount > 0 && "bg-primary/5 border-primary/20"
                  )}
                >
                  <Avatar className="w-12 h-12 border-2 border-primary/30">
                    <AvatarImage src={conv.partnerAvatar || ''} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {conv.partnerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "font-medium",
                        conv.unreadCount > 0 && "text-primary"
                      )}>
                        {conv.partnerName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.lastMessageDate), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 ? (
                    <Badge className="bg-red-500 text-white shrink-0">
                      {conv.unreadCount}
                    </Badge>
                  ) : (
                    <MailOpen className="w-4 h-4 text-muted-foreground/50" />
                  )}
                </button>
              ))
            )}
          </div>
        ) : (
          // Message Thread
          <div className="space-y-4">
            {/* Partner Header */}
            {selectedPartner && (
              <div className="flex items-center gap-3 pb-4 border-b border-primary/20">
                <Avatar className="w-10 h-10 border-2 border-primary/30">
                  <AvatarImage src={selectedPartner.partnerAvatar || ''} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {selectedPartner.partnerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedPartner.partnerName}</p>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="h-[400px] overflow-y-auto space-y-3 pr-2">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Inicia la conversación</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        isMine ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2",
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {formatDistanceToNow(new Date(msg.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-2 pt-4 border-t border-primary/20">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="resize-none min-h-[80px] bg-background/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                className="self-end"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
