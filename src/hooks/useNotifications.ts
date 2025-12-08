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

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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

      setIsLoading(false);
    };

    loadNotifications();

    // Setup realtime
    let channel: RealtimeChannel;
    
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
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Calculate unread count
  useEffect(() => {
    const unreadNotifs = notifications.filter(n => !n.read).length;
    const unreadAnnouncements = announcements.filter(a => !readAnnouncementIds.includes(a.id)).length;
    setUnreadCount(unreadNotifs + unreadAnnouncements);
  }, [notifications, announcements, readAnnouncementIds]);

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
    unreadCount,
    isLoading,
    markAsRead,
    markAnnouncementAsRead,
    markAllAsRead,
    isAnnouncementRead: (id: string) => readAnnouncementIds.includes(id),
  };
};
