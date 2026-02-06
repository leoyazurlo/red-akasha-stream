import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UnreadConversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  unreadCount: number;
  lastMessageDate: string;
}

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState<UnreadConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setUnreadConversations([]);
      setLoading(false);
      return;
    }

    fetchUnreadData();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread_messages_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchUnreadData = async () => {
    if (!user) return;

    try {
      // Get all unread messages
      const { data: unreadMessages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const messages = unreadMessages || [];
      setUnreadCount(messages.length);

      // Group by sender
      const senderMap = new Map<string, { count: number; lastDate: string }>();
      for (const msg of messages) {
        const existing = senderMap.get(msg.sender_id);
        if (!existing) {
          senderMap.set(msg.sender_id, { count: 1, lastDate: msg.created_at });
        } else {
          existing.count++;
        }
      }

      // Fetch sender profiles
      const senderIds = Array.from(senderMap.keys());
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, full_name')
          .in('id', senderIds);

        const conversations: UnreadConversation[] = [];
        for (const [senderId, data] of senderMap) {
          const profile = profiles?.find(p => p.id === senderId);
          conversations.push({
            partnerId: senderId,
            partnerName: profile?.full_name || profile?.username || 'Usuario',
            partnerAvatar: profile?.avatar_url || null,
            unreadCount: data.count,
            lastMessageDate: data.lastDate,
          });
        }

        // Sort by most recent
        conversations.sort((a, b) => 
          new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
        );

        setUnreadConversations(conversations);
      } else {
        setUnreadConversations([]);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return { unreadCount, unreadConversations, loading, refetch: fetchUnreadData };
};
