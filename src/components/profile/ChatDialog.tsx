import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Send, 
  X,
  Loader2,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string | null;
  initialMessage?: string;
}

export const ChatDialog = ({ 
  open, 
  onOpenChange, 
  partnerId, 
  partnerName, 
  partnerAvatar,
  initialMessage 
}: ChatDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState(initialMessage || "");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open && user && partnerId) {
      fetchMessages();
      
      // Subscribe to new messages in this conversation
      const channel = supabase
        .channel(`chat_${user.id}_${partnerId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
          },
          (payload) => {
            const newMsg = payload.new as Message;
            // Only add if it's part of this conversation
            if (
              (newMsg.sender_id === user.id && newMsg.receiver_id === partnerId) ||
              (newMsg.sender_id === partnerId && newMsg.receiver_id === user.id)
            ) {
              setMessages(prev => [...prev, newMsg]);
              // Mark as read if we're the receiver
              if (newMsg.receiver_id === user.id) {
                markAsRead(newMsg.id);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, user, partnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!user) return;
    
    setLoading(true);
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
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('direct_messages')
      .update({ read: true })
      .eq('id', messageId);
  };

  const handleSendMessage = async () => {
    if (!user || !partnerId || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: partnerId,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[600px] flex flex-col p-0 gap-0 bg-card border-primary/20">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/30">
              <AvatarImage src={partnerAvatar || ''} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {partnerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <DialogTitle className="font-medium">{partnerName}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Inicia la conversación con {partnerName}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
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
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              className="resize-none min-h-[60px] max-h-[120px] bg-background/50"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="self-end"
              size="icon"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
