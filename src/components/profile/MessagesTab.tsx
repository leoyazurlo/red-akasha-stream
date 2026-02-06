import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
  MessageSquare, 
  Inbox, 
  MailOpen,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatDialog } from "./ChatDialog";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
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
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

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

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setChatOpen(true);
  };

  const handleChatClose = (open: boolean) => {
    setChatOpen(open);
    if (!open) {
      // Refresh conversations when chat closes to update read status
      fetchConversations();
    }
  };

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
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Mensajes Directos
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalUnread} nuevo{totalUnread > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Tus conversaciones con otros socios. Haz clic para abrir el chat.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  onClick={() => handleSelectConversation(conv)}
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
                    <Badge variant="destructive" className="shrink-0">
                      {conv.unreadCount}
                    </Badge>
                  ) : (
                    <MailOpen className="w-4 h-4 text-muted-foreground/50" />
                  )}
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Dialog */}
      {selectedConversation && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={handleChatClose}
          partnerId={selectedConversation.partnerId}
          partnerName={selectedConversation.partnerName}
          partnerAvatar={selectedConversation.partnerAvatar}
        />
      )}
    </>
  );
};
