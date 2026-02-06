import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  related_user_id: string | null;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  link: string | null;
  created_at: string;
}

export interface UnreadMessage {
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  unreadCount: number;
  lastMessageDate: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load read announcements from localStorage
    const storedReadIds = localStorage.getItem('read_announcements');
    if (storedReadIds) {
      setReadAnnouncementIds(JSON.parse(storedReadIds));
    }
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user notifications
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!notifError && notifData) {
        setNotifications(notifData);
      }

      // Load platform announcements
      const { data: announcementData, error: announcementError } = await supabase
        .from('platform_announcements')
        .select('id, title, message, link, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!announcementError && announcementData) {
        setAnnouncements(announcementData);
      }

      // Load unread messages
      await loadUnreadMessages(user.id);

      setIsLoading(false);
    };

    const loadUnreadMessages = async (userId: string) => {
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('receiver_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading unread messages:', error);
        return;
      }

      const msgList = messages || [];
      setUnreadMessagesCount(msgList.length);

      // Group by sender
      const senderMap = new Map<string, { count: number; lastDate: string }>();
      for (const msg of msgList) {
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

        const unreadMsgs: UnreadMessage[] = [];
        for (const [senderId, data] of senderMap) {
          const profile = profiles?.find(p => p.id === senderId);
          unreadMsgs.push({
            senderId,
            senderName: profile?.full_name || profile?.username || 'Usuario',
            senderAvatar: profile?.avatar_url || null,
            unreadCount: data.count,
            lastMessageDate: data.lastDate,
          });
        }

        unreadMsgs.sort((a, b) => 
          new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
        );

        setUnreadMessages(unreadMsgs);
      } else {
        setUnreadMessages([]);
      }
    };

    loadNotifications();

    // Setup realtime
    let channel: RealtimeChannel;
    let messagesChannel: RealtimeChannel;
    
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updated = payload.new as Notification;
            setNotifications(prev =>
              prev.map(n => (n.id === updated.id ? updated : n))
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'platform_announcements',
          },
          (payload) => {
            const newAnnouncement = payload.new as PlatformAnnouncement;
            setAnnouncements(prev => [newAnnouncement, ...prev]);
          }
        )
        .subscribe();

      // Subscribe to direct messages
      messagesChannel = supabase
        .channel('direct_messages_notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'direct_messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            loadUnreadMessages(user.id);
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel);
      }
    };
  }, []);

  // Calculate unread count (including messages)
  useEffect(() => {
    const unreadNotifs = notifications.filter(n => !n.read).length;
    const unreadAnnouncements = announcements.filter(a => !readAnnouncementIds.includes(a.id)).length;
    setUnreadCount(unreadNotifs + unreadAnnouncements + unreadMessagesCount);
  }, [notifications, announcements, readAnnouncementIds, unreadMessagesCount]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    }
  };

  const markAnnouncementAsRead = (announcementId: string) => {
    const newReadIds = [...readAnnouncementIds, announcementId];
    setReadAnnouncementIds(newReadIds);
    localStorage.setItem('read_announcements', JSON.stringify(newReadIds));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }

    // Mark all announcements as read
    const allAnnouncementIds = announcements.map(a => a.id);
    setReadAnnouncementIds(allAnnouncementIds);
    localStorage.setItem('read_announcements', JSON.stringify(allAnnouncementIds));
  };

  return {
    notifications,
    announcements,
    unreadMessages,
    unreadCount,
    unreadMessagesCount,
    isLoading,
    markAsRead,
    markAnnouncementAsRead,
    markAllAsRead,
    isAnnouncementRead: (id: string) => readAnnouncementIds.includes(id),
  };
};
