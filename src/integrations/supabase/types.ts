export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id: string
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      artist_followers: {
        Row: {
          artist_id: string
          created_at: string | null
          follower_id: string
          id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          follower_id: string
          id?: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_followers_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_ratings: {
        Row: {
          artist_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artist_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artist_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_ratings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          artist_type: Database["public"]["Enums"]["artist_type"]
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          facebook: string | null
          followers_count: number | null
          id: string
          instagram: string | null
          linkedin: string | null
          name: string
          spotify_url: string | null
          total_votes: number | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          artist_type: Database["public"]["Enums"]["artist_type"]
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          facebook?: string | null
          followers_count?: number | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name: string
          spotify_url?: string | null
          total_votes?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          artist_type?: Database["public"]["Enums"]["artist_type"]
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          facebook?: string | null
          followers_count?: number | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name?: string
          spotify_url?: string | null
          total_votes?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      audio_playlist: {
        Row: {
          audio_url: string
          created_at: string | null
          duration: number | null
          id: string
          order_index: number | null
          profile_id: string
          title: string
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          duration?: number | null
          id?: string
          order_index?: number | null
          profile_id: string
          title: string
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          duration?: number | null
          id?: string
          order_index?: number | null
          profile_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_playlist_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_playlist_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          is_moderator_message: boolean | null
          is_pinned: boolean | null
          message: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          is_moderator_message?: boolean | null
          is_pinned?: boolean | null
          message: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          is_moderator_message?: boolean | null
          is_pinned?: boolean | null
          message?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      content_comments: {
        Row: {
          comment: string
          content_id: string
          created_at: string | null
          edited_at: string | null
          id: string
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment: string
          content_id: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string
          content_id?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "content_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_likes: {
        Row: {
          content_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_likes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      content_shares: {
        Row: {
          content_id: string
          created_at: string
          id: string
          ip_address: string | null
          platform: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          platform: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          platform?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_shares_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      content_uploads: {
        Row: {
          audio_duration_seconds: number | null
          audio_url: string | null
          band_name: string | null
          comments_count: number | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          currency: string | null
          description: string | null
          duration: number | null
          file_size: number | null
          id: string
          is_free: boolean
          likes_count: number | null
          photo_url: string | null
          podcast_category:
            | Database["public"]["Enums"]["podcast_category"]
            | null
          price: number | null
          producer_name: string | null
          promoter_name: string | null
          recording_studio: string | null
          shares_count: number | null
          status: string | null
          tags: string[] | null
          thumbnail_large: string | null
          thumbnail_medium: string | null
          thumbnail_small: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          uploader_id: string
          venue_name: string | null
          video_duration_seconds: number | null
          video_height: number | null
          video_url: string | null
          video_width: number | null
          views_count: number | null
        }
        Insert: {
          audio_duration_seconds?: number | null
          audio_url?: string | null
          band_name?: string | null
          comments_count?: number | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration?: number | null
          file_size?: number | null
          id?: string
          is_free?: boolean
          likes_count?: number | null
          photo_url?: string | null
          podcast_category?:
            | Database["public"]["Enums"]["podcast_category"]
            | null
          price?: number | null
          producer_name?: string | null
          promoter_name?: string | null
          recording_studio?: string | null
          shares_count?: number | null
          status?: string | null
          tags?: string[] | null
          thumbnail_large?: string | null
          thumbnail_medium?: string | null
          thumbnail_small?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          uploader_id: string
          venue_name?: string | null
          video_duration_seconds?: number | null
          video_height?: number | null
          video_url?: string | null
          video_width?: number | null
          views_count?: number | null
        }
        Update: {
          audio_duration_seconds?: number | null
          audio_url?: string | null
          band_name?: string | null
          comments_count?: number | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration?: number | null
          file_size?: number | null
          id?: string
          is_free?: boolean
          likes_count?: number | null
          photo_url?: string | null
          podcast_category?:
            | Database["public"]["Enums"]["podcast_category"]
            | null
          price?: number | null
          producer_name?: string | null
          promoter_name?: string | null
          recording_studio?: string | null
          shares_count?: number | null
          status?: string | null
          tags?: string[] | null
          thumbnail_large?: string | null
          thumbnail_medium?: string | null
          thumbnail_small?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          uploader_id?: string
          venue_name?: string | null
          video_duration_seconds?: number | null
          video_height?: number | null
          video_url?: string | null
          video_width?: number | null
          views_count?: number | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          display_name: string | null
          donor_id: string | null
          id: string
          is_anonymous: boolean | null
          message: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          show_on_stream: boolean | null
          shown_at: string | null
          stream_id: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          display_name?: string | null
          donor_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          show_on_stream?: boolean | null
          shown_at?: string | null
          stream_id: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          display_name?: string | null
          donor_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          show_on_stream?: boolean | null
          shown_at?: string | null
          stream_id?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_badges: {
        Row: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          requirement_description: string | null
        }
        Insert: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          requirement_description?: string | null
        }
        Update: {
          badge_type?: Database["public"]["Enums"]["badge_type"]
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          requirement_description?: string | null
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string | null
          descripcion: string | null
          icono: string | null
          id: string
          nombre: string
          orden: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre: string
          orden?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          approved: boolean | null
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_best_answer: boolean | null
          parent_post_id: string | null
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          approved?: boolean | null
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_best_answer?: boolean | null
          parent_post_id?: string | null
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          approved?: boolean | null
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_best_answer?: boolean | null
          parent_post_id?: string | null
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reports: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          reason: string
          reported_content_type: string | null
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"] | null
          thread_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason: string
          reported_content_type?: string | null
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          thread_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          reported_content_type?: string | null
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_reports_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_sanctions: {
        Row: {
          appeal_status: string | null
          appeal_text: string | null
          created_at: string | null
          duration_days: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          reason: string
          sanction_type: Database["public"]["Enums"]["sanction_type"]
          sanctioned_by: string
          start_date: string | null
          user_id: string
        }
        Insert: {
          appeal_status?: string | null
          appeal_text?: string | null
          created_at?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          sanction_type: Database["public"]["Enums"]["sanction_type"]
          sanctioned_by: string
          start_date?: string | null
          user_id: string
        }
        Update: {
          appeal_status?: string | null
          appeal_text?: string | null
          created_at?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          sanction_type?: Database["public"]["Enums"]["sanction_type"]
          sanctioned_by?: string
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_sanctions_sanctioned_by_fkey"
            columns: ["sanctioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_sanctions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_subforos: {
        Row: {
          category_id: string
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          orden: number | null
          requires_approval: boolean | null
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          orden?: number | null
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_subforos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          approved: boolean | null
          approved_by: string | null
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_closed: boolean | null
          is_pinned: boolean | null
          requires_approval: boolean | null
          subforo_id: string
          thread_type: Database["public"]["Enums"]["thread_type"] | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          approved?: boolean | null
          approved_by?: string | null
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_closed?: boolean | null
          is_pinned?: boolean | null
          requires_approval?: boolean | null
          subforo_id: string
          thread_type?: Database["public"]["Enums"]["thread_type"] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          approved?: boolean | null
          approved_by?: string | null
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_closed?: boolean | null
          is_pinned?: boolean | null
          requires_approval?: boolean | null
          subforo_id?: string
          thread_type?: Database["public"]["Enums"]["thread_type"] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_subforo_id_fkey"
            columns: ["subforo_id"]
            isOneToOne: false
            referencedRelation: "forum_subforos"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_votes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          thread_id: string | null
          user_id: string
          vote_value: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          thread_id?: string | null
          user_id: string
          vote_value?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          thread_id?: string | null
          user_id?: string
          vote_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          related_post_id: string | null
          related_thread_id: string | null
          related_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          related_post_id?: string | null
          related_thread_id?: string | null
          related_user_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          related_post_id?: string | null
          related_thread_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_thread_id_fkey"
            columns: ["related_thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      playback_history: {
        Row: {
          completed: boolean
          content_id: string
          created_at: string
          duration: number | null
          id: string
          last_position: number
          last_watched_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          content_id: string
          created_at?: string
          duration?: number | null
          id?: string
          last_position?: number
          last_watched_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          content_id?: string
          created_at?: string
          duration?: number | null
          id?: string
          last_position?: number
          last_watched_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playback_history_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_items: {
        Row: {
          added_at: string
          content_id: string
          id: string
          order_index: number
          playlist_id: string
        }
        Insert: {
          added_at?: string
          content_id: string
          id?: string
          order_index?: number
          playlist_id: string
        }
        Update: {
          added_at?: string
          content_id?: string
          id?: string
          order_index?: number
          playlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      podcast_episodes: {
        Row: {
          apple_podcasts_url: string | null
          audio_file_size: number | null
          audio_file_url: string
          category: string | null
          chapters: Json | null
          created_at: string | null
          creator_id: string
          description: string | null
          download_count: number | null
          duration: unknown
          episode_number: number | null
          explicit_content: boolean | null
          google_podcasts_url: string | null
          guid: string | null
          id: string
          play_count: number | null
          podcast_name: string
          published_at: string | null
          season_number: number | null
          spotify_url: string | null
          tags: string[] | null
          title: string
          transcript_status: string | null
          transcript_text: string | null
          transcript_url: string | null
          updated_at: string | null
        }
        Insert: {
          apple_podcasts_url?: string | null
          audio_file_size?: number | null
          audio_file_url: string
          category?: string | null
          chapters?: Json | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          download_count?: number | null
          duration?: unknown
          episode_number?: number | null
          explicit_content?: boolean | null
          google_podcasts_url?: string | null
          guid?: string | null
          id?: string
          play_count?: number | null
          podcast_name: string
          published_at?: string | null
          season_number?: number | null
          spotify_url?: string | null
          tags?: string[] | null
          title: string
          transcript_status?: string | null
          transcript_text?: string | null
          transcript_url?: string | null
          updated_at?: string | null
        }
        Update: {
          apple_podcasts_url?: string | null
          audio_file_size?: number | null
          audio_file_url?: string
          category?: string | null
          chapters?: Json | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          download_count?: number | null
          duration?: unknown
          episode_number?: number | null
          explicit_content?: boolean | null
          google_podcasts_url?: string | null
          guid?: string | null
          id?: string
          play_count?: number | null
          podcast_name?: string
          published_at?: string | null
          season_number?: number | null
          spotify_url?: string | null
          tags?: string[] | null
          title?: string
          transcript_status?: string | null
          transcript_text?: string | null
          transcript_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_details: {
        Row: {
          avatar_url: string | null
          bio: string | null
          capacity: number | null
          ciudad: string
          created_at: string | null
          display_name: string
          email: string | null
          facebook: string | null
          formation_date: string | null
          genre: Database["public"]["Enums"]["music_genre"] | null
          id: string
          instagram: string | null
          latitude: number | null
          linkedin: string | null
          longitude: number | null
          map_location: string | null
          members: Json | null
          pais: string
          produced_artists: Json | null
          producer_instagram: string | null
          profile_type: Database["public"]["Enums"]["profile_type"]
          provincia: string | null
          recorded_at: string | null
          technical_specs: Json | null
          telefono: string | null
          updated_at: string | null
          user_id: string
          venue_type: Database["public"]["Enums"]["sala_type"] | null
          venues_produced: Json | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          capacity?: number | null
          ciudad: string
          created_at?: string | null
          display_name: string
          email?: string | null
          facebook?: string | null
          formation_date?: string | null
          genre?: Database["public"]["Enums"]["music_genre"] | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          linkedin?: string | null
          longitude?: number | null
          map_location?: string | null
          members?: Json | null
          pais: string
          produced_artists?: Json | null
          producer_instagram?: string | null
          profile_type: Database["public"]["Enums"]["profile_type"]
          provincia?: string | null
          recorded_at?: string | null
          technical_specs?: Json | null
          telefono?: string | null
          updated_at?: string | null
          user_id: string
          venue_type?: Database["public"]["Enums"]["sala_type"] | null
          venues_produced?: Json | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          capacity?: number | null
          ciudad?: string
          created_at?: string | null
          display_name?: string
          email?: string | null
          facebook?: string | null
          formation_date?: string | null
          genre?: Database["public"]["Enums"]["music_genre"] | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          linkedin?: string | null
          longitude?: number | null
          map_location?: string | null
          members?: Json | null
          pais?: string
          produced_artists?: Json | null
          producer_instagram?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"]
          provincia?: string | null
          recorded_at?: string | null
          technical_specs?: Json | null
          telefono?: string | null
          updated_at?: string | null
          user_id?: string
          venue_type?: Database["public"]["Enums"]["sala_type"] | null
          venues_produced?: Json | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      profile_galleries: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          media_type: string
          order_index: number | null
          profile_id: string
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          media_type: string
          order_index?: number | null
          profile_id: string
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          media_type?: string
          order_index?: number | null
          profile_id?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_galleries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_galleries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_interactions: {
        Row: {
          created_at: string
          from_profile_id: string
          id: string
          interaction_type: string
          metadata: Json | null
          to_profile_id: string
        }
        Insert: {
          created_at?: string
          from_profile_id: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          to_profile_id: string
        }
        Update: {
          created_at?: string
          from_profile_id?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
          to_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interactions_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_interactions_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_interactions_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_interactions_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rated_profile_id: string
          rater_profile_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_profile_id: string
          rater_profile_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_profile_id?: string
          rater_profile_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_ratings_rated_profile_id_fkey"
            columns: ["rated_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_ratings_rated_profile_id_fkey"
            columns: ["rated_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_ratings_rater_profile_id_fkey"
            columns: ["rater_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_ratings_rater_profile_id_fkey"
            columns: ["rater_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          reputation_points: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          reputation_points?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          reputation_points?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      program_schedules: {
        Row: {
          created_at: string
          day: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          order_index: number | null
          program_name: string | null
          time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number | null
          program_name?: string | null
          time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number | null
          program_name?: string | null
          time?: string
          updated_at?: string
        }
        Relationships: []
      }
      registration_requests: {
        Row: {
          areas_interes: string[] | null
          ciudad: string
          created_at: string
          email: string
          id: string
          motivacion: string
          nombre: string
          pais: string | null
          perfil: string[] | null
          provincia: string | null
          que_buscas: string[] | null
          status: string
          telefono: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          areas_interes?: string[] | null
          ciudad: string
          created_at?: string
          email: string
          id?: string
          motivacion: string
          nombre: string
          pais?: string | null
          perfil?: string[] | null
          provincia?: string | null
          que_buscas?: string[] | null
          status?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          areas_interes?: string[] | null
          ciudad?: string
          created_at?: string
          email?: string
          id?: string
          motivacion?: string
          nombre?: string
          pais?: string | null
          perfil?: string[] | null
          provincia?: string | null
          que_buscas?: string[] | null
          status?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stream_overlays: {
        Row: {
          config: Json
          created_at: string | null
          css_styles: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          overlay_type: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          css_styles?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          overlay_type: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          css_styles?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          overlay_type?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stream_quality_presets: {
        Row: {
          audio_bitrate: number
          audio_codec: string | null
          audio_sample_rate: number | null
          created_at: string | null
          framerate: number | null
          id: string
          is_default: boolean | null
          keyframe_interval: number | null
          name: string
          owner_id: string
          profile: string | null
          resolution_height: number
          resolution_width: number
          video_bitrate: number
          video_codec: string | null
        }
        Insert: {
          audio_bitrate: number
          audio_codec?: string | null
          audio_sample_rate?: number | null
          created_at?: string | null
          framerate?: number | null
          id?: string
          is_default?: boolean | null
          keyframe_interval?: number | null
          name: string
          owner_id: string
          profile?: string | null
          resolution_height: number
          resolution_width: number
          video_bitrate: number
          video_codec?: string | null
        }
        Update: {
          audio_bitrate?: number
          audio_codec?: string | null
          audio_sample_rate?: number | null
          created_at?: string | null
          framerate?: number | null
          id?: string
          is_default?: boolean | null
          keyframe_interval?: number | null
          name?: string
          owner_id?: string
          profile?: string | null
          resolution_height?: number
          resolution_width?: number
          video_bitrate?: number
          video_codec?: string | null
        }
        Relationships: []
      }
      stream_schedule: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_duration: unknown
          id: string
          is_recurring: boolean | null
          notification_sent: boolean | null
          overlay_config: Json | null
          recurrence_rule: string | null
          scheduled_start: string
          send_notifications: boolean | null
          stream_id: string | null
          streamer_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_duration?: unknown
          id?: string
          is_recurring?: boolean | null
          notification_sent?: boolean | null
          overlay_config?: Json | null
          recurrence_rule?: string | null
          scheduled_start: string
          send_notifications?: boolean | null
          stream_id?: string | null
          streamer_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_duration?: unknown
          id?: string
          is_recurring?: boolean | null
          notification_sent?: boolean | null
          overlay_config?: Json | null
          recurrence_rule?: string | null
          scheduled_start?: string
          send_notifications?: boolean | null
          stream_id?: string | null
          streamer_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_schedule_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      streams: {
        Row: {
          actual_start_time: string | null
          auto_post_to_social: boolean | null
          average_watch_time: unknown
          category: string | null
          created_at: string | null
          description: string | null
          enable_chat: boolean | null
          enable_donations: boolean | null
          enable_recording: boolean | null
          enable_transcoding: boolean | null
          end_time: string | null
          id: string
          ingest_url: string | null
          is_paid_event: boolean | null
          peak_viewers: number | null
          playback_url: string | null
          rtmp_key: string | null
          scheduled_start_time: string | null
          social_platforms: string[] | null
          status: Database["public"]["Enums"]["stream_status"] | null
          stream_key_expires_at: string | null
          streamer_id: string
          tags: string[] | null
          thumbnail_url: string | null
          ticket_price: number | null
          title: string
          total_views: number | null
          updated_at: string | null
        }
        Insert: {
          actual_start_time?: string | null
          auto_post_to_social?: boolean | null
          average_watch_time?: unknown
          category?: string | null
          created_at?: string | null
          description?: string | null
          enable_chat?: boolean | null
          enable_donations?: boolean | null
          enable_recording?: boolean | null
          enable_transcoding?: boolean | null
          end_time?: string | null
          id?: string
          ingest_url?: string | null
          is_paid_event?: boolean | null
          peak_viewers?: number | null
          playback_url?: string | null
          rtmp_key?: string | null
          scheduled_start_time?: string | null
          social_platforms?: string[] | null
          status?: Database["public"]["Enums"]["stream_status"] | null
          stream_key_expires_at?: string | null
          streamer_id: string
          tags?: string[] | null
          thumbnail_url?: string | null
          ticket_price?: number | null
          title: string
          total_views?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_start_time?: string | null
          auto_post_to_social?: boolean | null
          average_watch_time?: unknown
          category?: string | null
          created_at?: string | null
          description?: string | null
          enable_chat?: boolean | null
          enable_donations?: boolean | null
          enable_recording?: boolean | null
          enable_transcoding?: boolean | null
          end_time?: string | null
          id?: string
          ingest_url?: string | null
          is_paid_event?: boolean | null
          peak_viewers?: number | null
          playback_url?: string | null
          rtmp_key?: string | null
          scheduled_start_time?: string | null
          social_platforms?: string[] | null
          status?: Database["public"]["Enums"]["stream_status"] | null
          stream_key_expires_at?: string | null
          streamer_id?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          ticket_price?: number | null
          title?: string
          total_views?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          is_active: boolean | null
          max_concurrent_viewers: number | null
          max_storage_gb: number | null
          max_streaming_hours: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_active?: boolean | null
          max_concurrent_viewers?: number | null
          max_storage_gb?: number | null
          max_streaming_hours?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_active?: boolean | null
          max_concurrent_viewers?: number | null
          max_storage_gb?: number | null
          max_streaming_hours?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "forum_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          content_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_media_library: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_name: string
          file_size: number
          file_url: string
          folder: string | null
          height: number | null
          id: string
          media_type: string
          tags: string[] | null
          thumbnail_large: string | null
          thumbnail_medium: string | null
          thumbnail_small: string | null
          thumbnail_url: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_name: string
          file_size: number
          file_url: string
          folder?: string | null
          height?: number | null
          id?: string
          media_type: string
          tags?: string[] | null
          thumbnail_large?: string | null
          thumbnail_medium?: string | null
          thumbnail_small?: string | null
          thumbnail_url?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_name?: string
          file_size?: number
          file_url?: string
          folder?: string | null
          height?: number | null
          id?: string
          media_type?: string
          tags?: string[] | null
          thumbnail_large?: string | null
          thumbnail_medium?: string | null
          thumbnail_small?: string | null
          thumbnail_url?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_analytics: {
        Row: {
          average_bitrate: number | null
          browser: string | null
          buffer_count: number | null
          city: string | null
          country_code: string | null
          created_at: string | null
          device_type: string | null
          error_count: number | null
          id: string
          joined_at: string | null
          left_at: string | null
          os: string | null
          quality_level: Database["public"]["Enums"]["stream_quality"] | null
          session_id: string
          stream_id: string | null
          viewer_id: string | null
          vod_id: string | null
          watch_duration: unknown
        }
        Insert: {
          average_bitrate?: number | null
          browser?: string | null
          buffer_count?: number | null
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          device_type?: string | null
          error_count?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          os?: string | null
          quality_level?: Database["public"]["Enums"]["stream_quality"] | null
          session_id: string
          stream_id?: string | null
          viewer_id?: string | null
          vod_id?: string | null
          watch_duration?: unknown
        }
        Update: {
          average_bitrate?: number | null
          browser?: string | null
          buffer_count?: number | null
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          device_type?: string | null
          error_count?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          os?: string | null
          quality_level?: Database["public"]["Enums"]["stream_quality"] | null
          session_id?: string
          stream_id?: string | null
          viewer_id?: string | null
          vod_id?: string | null
          watch_duration?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "viewer_analytics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_analytics_vod_id_fkey"
            columns: ["vod_id"]
            isOneToOne: false
            referencedRelation: "vod_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      vod_videos: {
        Row: {
          audio_tracks: Json | null
          average_rating: number | null
          category: string | null
          created_at: string | null
          dash_manifest_url: string | null
          description: string | null
          duration: unknown
          episode_number: number | null
          hls_manifest_url: string | null
          id: string
          is_premium: boolean | null
          language: string | null
          preview_url: string | null
          price: number | null
          release_date: string | null
          season_number: number | null
          seo_description: string | null
          seo_title: string | null
          series_name: string | null
          source_file_size: number | null
          source_file_url: string | null
          status: Database["public"]["Enums"]["vod_status"] | null
          subtitle_tracks: Json | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          total_ratings: number | null
          total_views: number | null
          updated_at: string | null
          uploader_id: string
        }
        Insert: {
          audio_tracks?: Json | null
          average_rating?: number | null
          category?: string | null
          created_at?: string | null
          dash_manifest_url?: string | null
          description?: string | null
          duration?: unknown
          episode_number?: number | null
          hls_manifest_url?: string | null
          id?: string
          is_premium?: boolean | null
          language?: string | null
          preview_url?: string | null
          price?: number | null
          release_date?: string | null
          season_number?: number | null
          seo_description?: string | null
          seo_title?: string | null
          series_name?: string | null
          source_file_size?: number | null
          source_file_url?: string | null
          status?: Database["public"]["Enums"]["vod_status"] | null
          subtitle_tracks?: Json | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_ratings?: number | null
          total_views?: number | null
          updated_at?: string | null
          uploader_id: string
        }
        Update: {
          audio_tracks?: Json | null
          average_rating?: number | null
          category?: string | null
          created_at?: string | null
          dash_manifest_url?: string | null
          description?: string | null
          duration?: unknown
          episode_number?: number | null
          hls_manifest_url?: string | null
          id?: string
          is_premium?: boolean | null
          language?: string | null
          preview_url?: string | null
          price?: number | null
          release_date?: string | null
          season_number?: number | null
          seo_description?: string | null
          seo_title?: string | null
          series_name?: string | null
          source_file_size?: number | null
          source_file_url?: string | null
          status?: Database["public"]["Enums"]["vod_status"] | null
          subtitle_tracks?: Json | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_ratings?: number | null
          total_views?: number | null
          updated_at?: string | null
          uploader_id?: string
        }
        Relationships: []
      }
      youtube_videos: {
        Row: {
          category: string
          created_at: string
          duration: string
          id: string
          is_active: boolean
          order_index: number
          thumbnail: string | null
          title: string
          updated_at: string
          youtube_id: string
        }
        Insert: {
          category: string
          created_at?: string
          duration: string
          id?: string
          is_active?: boolean
          order_index?: number
          thumbnail?: string | null
          title: string
          updated_at?: string
          youtube_id: string
        }
        Update: {
          category?: string
          created_at?: string
          duration?: string
          id?: string
          is_active?: boolean
          order_index?: number
          thumbnail?: string | null
          title?: string
          updated_at?: string
          youtube_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          ciudad: string | null
          created_at: string | null
          display_name: string | null
          facebook: string | null
          id: string | null
          instagram: string | null
          linkedin: string | null
          pais: string | null
          profile_type: Database["public"]["Enums"]["profile_type"] | null
          provincia: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          ciudad?: string | null
          created_at?: string | null
          display_name?: string | null
          facebook?: string | null
          id?: string | null
          instagram?: string | null
          linkedin?: string | null
          pais?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"] | null
          provincia?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          ciudad?: string | null
          created_at?: string | null
          display_name?: string | null
          facebook?: string | null
          id?: string | null
          instagram?: string | null
          linkedin?: string | null
          pais?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"] | null
          provincia?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_badge_if_eligible: {
        Args: { p_badge_name: string; p_user_id: string }
        Returns: undefined
      }
      decrement_likes: { Args: { content_id: string }; Returns: undefined }
      extract_mentions: { Args: { content_text: string }; Returns: string[] }
      generate_rtmp_key: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_likes: { Args: { content_id: string }; Returns: undefined }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "verified"
        | "guest"
        | "producer"
        | "streamer"
      artist_type:
        | "banda_musical"
        | "musico_solista"
        | "podcast"
        | "documental"
        | "cortometraje"
        | "fotografia"
        | "radio_show"
      badge_type: "bronze" | "silver" | "gold" | "special" | "merit"
      content_type:
        | "video_musical_vivo"
        | "video_clip"
        | "podcast"
        | "documental"
        | "corto"
        | "pelicula"
      music_genre:
        | "rock"
        | "pop"
        | "jazz"
        | "blues"
        | "reggae"
        | "hip_hop"
        | "rap"
        | "electronica"
        | "house"
        | "techno"
        | "trance"
        | "country"
        | "folk"
        | "soul"
        | "funk"
        | "rnb"
        | "metal"
        | "punk"
        | "ska"
        | "clasica"
        | "opera"
        | "flamenco"
        | "tango"
        | "salsa"
        | "merengue"
        | "cumbia"
        | "bachata"
        | "kpop"
        | "jpop"
        | "andina"
        | "celta"
        | "gospel"
        | "arabe"
        | "africana"
        | "india"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      podcast_category:
        | "produccion"
        | "marketing_digital"
        | "derecho_autor"
        | "management"
        | "composicion"
      profile_type:
        | "productor_audiovisual"
        | "productor_artistico"
        | "estudio_grabacion"
        | "promotor_artistico"
        | "sala_concierto"
        | "agrupacion_musical"
        | "marketing_digital"
        | "musico"
        | "sello_discografico"
        | "perfil_contenido"
        | "arte_digital"
        | "management"
        | "me_gusta_arte"
        | "representante"
        | "dj"
        | "vj"
      report_status: "pending" | "reviewing" | "resolved" | "dismissed"
      sala_type:
        | "teatro"
        | "auditorio"
        | "discoteque"
        | "club"
        | "bar"
        | "anfiteatro"
      sanction_type: "warning" | "temporary_suspension" | "permanent_ban"
      stream_quality:
        | "source"
        | "1080p"
        | "720p"
        | "480p"
        | "360p"
        | "audio_only"
      stream_status: "scheduled" | "live" | "ended" | "cancelled"
      subscription_tier: "free" | "basic" | "premium" | "enterprise"
      thread_type:
        | "debate_abierto"
        | "pregunta_encuesta"
        | "debate_moderado"
        | "hilo_recursos"
        | "anuncio"
      vod_status: "processing" | "ready" | "failed" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "verified",
        "guest",
        "producer",
        "streamer",
      ],
      artist_type: [
        "banda_musical",
        "musico_solista",
        "podcast",
        "documental",
        "cortometraje",
        "fotografia",
        "radio_show",
      ],
      badge_type: ["bronze", "silver", "gold", "special", "merit"],
      content_type: [
        "video_musical_vivo",
        "video_clip",
        "podcast",
        "documental",
        "corto",
        "pelicula",
      ],
      music_genre: [
        "rock",
        "pop",
        "jazz",
        "blues",
        "reggae",
        "hip_hop",
        "rap",
        "electronica",
        "house",
        "techno",
        "trance",
        "country",
        "folk",
        "soul",
        "funk",
        "rnb",
        "metal",
        "punk",
        "ska",
        "clasica",
        "opera",
        "flamenco",
        "tango",
        "salsa",
        "merengue",
        "cumbia",
        "bachata",
        "kpop",
        "jpop",
        "andina",
        "celta",
        "gospel",
        "arabe",
        "africana",
        "india",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
      podcast_category: [
        "produccion",
        "marketing_digital",
        "derecho_autor",
        "management",
        "composicion",
      ],
      profile_type: [
        "productor_audiovisual",
        "productor_artistico",
        "estudio_grabacion",
        "promotor_artistico",
        "sala_concierto",
        "agrupacion_musical",
        "marketing_digital",
        "musico",
        "sello_discografico",
        "perfil_contenido",
        "arte_digital",
        "management",
        "me_gusta_arte",
        "representante",
        "dj",
        "vj",
      ],
      report_status: ["pending", "reviewing", "resolved", "dismissed"],
      sala_type: [
        "teatro",
        "auditorio",
        "discoteque",
        "club",
        "bar",
        "anfiteatro",
      ],
      sanction_type: ["warning", "temporary_suspension", "permanent_ban"],
      stream_quality: ["source", "1080p", "720p", "480p", "360p", "audio_only"],
      stream_status: ["scheduled", "live", "ended", "cancelled"],
      subscription_tier: ["free", "basic", "premium", "enterprise"],
      thread_type: [
        "debate_abierto",
        "pregunta_encuesta",
        "debate_moderado",
        "hilo_recursos",
        "anuncio",
      ],
      vod_status: ["processing", "ready", "failed", "archived"],
    },
  },
} as const
