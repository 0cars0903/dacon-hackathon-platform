// ============================================================
// Notification Service — Business logic for notifications and activity
// ============================================================
import * as data from "@/lib/supabase/data";
import { ValidationError } from "@/lib/errors/api-error";
import type { ActivityFeedItem, Notification } from "@/types";
import type { NotificationPrefs } from "@/lib/supabase/data";

export interface ActivityLogInput {
  userId: string;
  userName: string;
  action: string;
  relatedId?: string;
  relatedType?: string;
  description?: string;
}

export interface AddNotificationInput {
  userId: string;
  type?: string;
  title?: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
}

export interface ActivityFeedFilter {
  userId?: string;
  action?: string;
  relatedType?: string;
  limit?: number;
}

export class NotificationService {
  /**
   * Log user activity
   */
  static async logActivity(input: ActivityLogInput): Promise<void> {
    if (!input.action) {
      throw new ValidationError("Action is required");
    }
    const item: Omit<ActivityFeedItem, "id"> = {
      type: (input.action as ActivityFeedItem["type"]) || "user_signup",
      message: input.description || input.action,
      timestamp: new Date().toISOString(),
      hackathonSlug: input.relatedId,
      metadata: {
        userId: input.userId,
        userName: input.userName,
        relatedType: input.relatedType,
      },
    };
    return data.logActivity(item);
  }

  /**
   * Get activity feed
   */
  static async getActivityFeed(): Promise<ActivityFeedItem[]> {
    return data.getActivityFeed();
  }

  /**
   * Get filtered activity feed
   */
  static async getFilteredActivityFeed(
    filter: ActivityFeedFilter
  ): Promise<ActivityFeedItem[]> {
    return data.getFilteredActivityFeed(filter.userId ?? "", filter.action ?? "", []);
  }

  /**
   * Add notification for user
   */
  static async addNotification(input: AddNotificationInput): Promise<void> {
    if (!input.userId || !input.message) {
      throw new ValidationError(
        "User ID and message are required"
      );
    }
    return data.addNotification(input.userId, {
      message: input.message,
      type: (input.type as "info" | "success" | "warning") || "info",
      link: undefined,
    });
  }

  /**
   * Get notifications for user
   */
  static async getNotifications(userId: string): Promise<Notification[]> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.getNotifications(userId);
  }

  /**
   * Mark single notification as read
   */
  static async markNotificationRead(notificationId: string): Promise<void> {
    if (!notificationId || notificationId.trim() === "") {
      throw new ValidationError("Notification ID cannot be empty");
    }
    return data.markNotificationRead(notificationId);
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllNotificationsRead(userId: string): Promise<void> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.markAllNotificationsRead(userId);
  }

  /**
   * Get notification preferences for user
   */
  static async getPreferences(userId: string): Promise<NotificationPrefs> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.getNotificationPrefs(userId);
  }

  /**
   * Save notification preferences for user
   */
  static async savePreferences(
    userId: string,
    prefs: NotificationPrefs
  ): Promise<boolean> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("User ID cannot be empty");
    }
    return data.saveNotificationPrefs(userId, prefs);
  }
}
