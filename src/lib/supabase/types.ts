// ============================================================
// Supabase Database Types (generated from schema)
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          nickname: string;
          nickname_changed_at: string | null;
          email: string;
          role: "user" | "admin";
          avatar_url: string | null;
          bio: string | null;
          skills: string[];
          joined_at: string;
          hackathons_joined: number;
          teams_created: number;
          submissions_count: number;
          total_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      badges: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          emoji: string;
          description: string;
          earned_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["badges"]["Row"], "id" | "earned_at"> & {
          id?: string;
          earned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["badges"]["Insert"]>;
      };
      hackathons: {
        Row: {
          slug: string;
          title: string;
          status: "ongoing" | "ended" | "upcoming";
          tags: string[];
          thumbnail_url: string | null;
          timezone: string;
          submission_deadline_at: string | null;
          end_at: string | null;
          detail_link: string | null;
          rules_link: string | null;
          faq_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["hackathons"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["hackathons"]["Insert"]>;
      };
      hackathon_details: {
        Row: {
          slug: string;
          sections: Record<string, unknown>;
        };
        Insert: Database["public"]["Tables"]["hackathon_details"]["Row"];
        Update: Partial<Database["public"]["Tables"]["hackathon_details"]["Insert"]>;
      };
      hackathon_participants: {
        Row: {
          id: string;
          hackathon_slug: string;
          user_id: string;
          joined_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["hackathon_participants"]["Row"], "id" | "joined_at"> & {
          id?: string;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["hackathon_participants"]["Insert"]>;
      };
      teams: {
        Row: {
          team_code: string;
          hackathon_slug: string;
          name: string;
          is_open: boolean;
          join_policy: "auto" | "approval";
          looking_for: string[];
          intro: string | null;
          contact_type: string | null;
          contact_url: string | null;
          creator_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["teams"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
      };
      team_members: {
        Row: {
          id: string;
          team_code: string;
          user_id: string;
          name: string;
          role: string;
          joined_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["team_members"]["Row"], "id" | "joined_at"> & {
          id?: string;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
      };
      team_join_requests: {
        Row: {
          id: string;
          team_code: string;
          user_id: string;
          user_name: string;
          message: string | null;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["team_join_requests"]["Row"], "id" | "created_at" | "status"> & {
          id?: string;
          created_at?: string;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_join_requests"]["Insert"]>;
      };
      team_invitations: {
        Row: {
          id: string;
          team_code: string;
          team_name: string;
          hackathon_slug: string;
          invite_code: string;
          inviter_id: string;
          inviter_name: string;
          invitee_id: string | null;
          invitee_name: string | null;
          status: "pending" | "accepted" | "rejected" | "expired";
          created_at: string;
          expires_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["team_invitations"]["Row"], "id" | "created_at" | "expires_at" | "status"> & {
          id?: string;
          created_at?: string;
          expires_at?: string;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_invitations"]["Insert"]>;
      };
      team_chat_messages: {
        Row: {
          id: string;
          team_code: string;
          sender_id: string;
          sender_name: string;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["team_chat_messages"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_chat_messages"]["Insert"]>;
      };
      direct_messages: {
        Row: {
          id: string;
          sender_id: string;
          sender_name: string;
          receiver_id: string;
          receiver_name: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["direct_messages"]["Row"], "id" | "created_at" | "read"> & {
          id?: string;
          created_at?: string;
          read?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["direct_messages"]["Insert"]>;
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["follows"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["follows"]["Insert"]>;
      };
      activity_feed: {
        Row: {
          id: string;
          type: string;
          message: string;
          hackathon_slug: string | null;
          actor_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["activity_feed"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_feed"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          read: boolean;
          link: string | null;
          type: "info" | "success" | "warning";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at" | "read"> & {
          id?: string;
          created_at?: string;
          read?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      forum_posts: {
        Row: {
          id: string;
          hackathon_slug: string;
          author_id: string;
          author_name: string;
          author_nickname: string | null;
          title: string;
          content: string;
          category: "question" | "discussion" | "announcement" | "bug";
          likes: string[];
          created_at: string;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["forum_posts"]["Row"], "id" | "created_at" | "likes"> & {
          id?: string;
          created_at?: string;
          likes?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["forum_posts"]["Insert"]>;
      };
      forum_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          author_name: string;
          author_nickname: string | null;
          content: string;
          likes: string[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["forum_comments"]["Row"], "id" | "created_at" | "likes"> & {
          id?: string;
          created_at?: string;
          likes?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["forum_comments"]["Insert"]>;
      };
      leaderboards: {
        Row: {
          hackathon_slug: string;
          eval_type: "metric" | "judge" | "multi-round" | "vote";
          metric_name: string | null;
          metric_formula: string | null;
          metric_columns: unknown[];
          rounds: unknown[];
          entries: unknown[];
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["leaderboards"]["Row"], "updated_at"> & {
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leaderboards"]["Insert"]>;
      };
      submissions: {
        Row: {
          id: string;
          hackathon_slug: string;
          user_id: string;
          items: unknown[];
          status: "draft" | "submitted";
          saved_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["submissions"]["Row"], "id" | "saved_at" | "status"> & {
          id?: string;
          saved_at?: string;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Insert"]>;
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: "light" | "dark";
          color_theme: "blue" | "purple" | "green";
          interest_tags: string[];
        };
        Insert: Omit<Database["public"]["Tables"]["user_preferences"]["Row"], "theme" | "color_theme" | "interest_tags"> & {
          theme?: string;
          color_theme?: string;
          interest_tags?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["user_preferences"]["Insert"]>;
      };
    };
  };
}
