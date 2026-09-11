import { describe, it, expect, vi, beforeEach } from "vitest";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

function createNotificationStore(): NotificationStore {
  let notifications: Notification[] = [];

  return {
    get notifications() { return notifications; },
    get unreadCount() { return notifications.filter((n) => !n.read).length; },

    addNotification: (data) => {
      const notification: Notification = {
        ...data,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        read: false,
        createdAt: new Date(),
      };
      notifications = [notification, ...notifications];
    },

    markAsRead: (id: string) => {
      notifications = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
    },

    markAllAsRead: () => {
      notifications = notifications.map((n) => ({ ...n, read: true }));
    },

    removeNotification: (id: string) => {
      notifications = notifications.filter((n) => n.id !== id);
    },

    clearAll: () => {
      notifications = [];
    },

    getUnreadCount: () => notifications.filter((n) => !n.read).length,
  };
}

describe("useNotificationStore", () => {
  let store: NotificationStore;

  beforeEach(() => {
    store = createNotificationStore();
  });

  it("starts with empty notifications", () => {
    expect(store.notifications).toEqual([]);
    expect(store.unreadCount).toBe(0);
  });

  it("adds a notification", () => {
    store.addNotification({
      title: "New Application",
      message: "John Doe applied for Senior Engineer",
      type: "info",
    });

    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0].title).toBe("New Application");
    expect(store.notifications[0].read).toBe(false);
  });

  it("generates unique IDs", () => {
    store.addNotification({ title: "Test 1", message: "msg", type: "info" });
    store.addNotification({ title: "Test 2", message: "msg", type: "info" });

    expect(store.notifications[0].id).not.toBe(store.notifications[1].id);
  });

  it("adds new notifications at the beginning", () => {
    store.addNotification({ title: "First", message: "msg", type: "info" });
    store.addNotification({ title: "Second", message: "msg", type: "info" });

    expect(store.notifications[0].title).toBe("Second");
    expect(store.notifications[1].title).toBe("First");
  });

  it("marks a notification as read", () => {
    store.addNotification({ title: "Test", message: "msg", type: "info" });
    const id = store.notifications[0].id;

    store.markAsRead(id);
    expect(store.notifications[0].read).toBe(true);
  });

  it("marks all notifications as read", () => {
    store.addNotification({ title: "Test 1", message: "msg", type: "info" });
    store.addNotification({ title: "Test 2", message: "msg", type: "info" });

    store.markAllAsRead();
    expect(store.notifications.every((n) => n.read)).toBe(true);
  });

  it("calculates unread count correctly", () => {
    store.addNotification({ title: "Test 1", message: "msg", type: "info" });
    store.addNotification({ title: "Test 2", message: "msg", type: "info" });

    expect(store.unreadCount).toBe(2);

    store.markAsRead(store.notifications[0].id);
    expect(store.unreadCount).toBe(1);
  });

  it("removes a notification", () => {
    store.addNotification({ title: "Test", message: "msg", type: "info" });
    const id = store.notifications[0].id;

    store.removeNotification(id);
    expect(store.notifications).toHaveLength(0);
  });

  it("clears all notifications", () => {
    store.addNotification({ title: "Test 1", message: "msg", type: "info" });
    store.addNotification({ title: "Test 2", message: "msg", type: "info" });

    store.clearAll();
    expect(store.notifications).toHaveLength(0);
    expect(store.unreadCount).toBe(0);
  });

  it("handles different notification types", () => {
    const types: Notification["type"][] = ["info", "success", "warning", "error"];

    types.forEach((type) => {
      store.addNotification({ title: `Test ${type}`, message: "msg", type });
    });

    expect(store.notifications).toHaveLength(4);
    expect(store.notifications.map((n) => n.type)).toEqual(types);
  });

  it("preserves notification order by creation time", () => {
    store.addNotification({ title: "First", message: "msg", type: "info" });
    store.addNotification({ title: "Second", message: "msg", type: "info" });
    store.addNotification({ title: "Third", message: "msg", type: "info" });

    expect(store.notifications.map((n) => n.title)).toEqual([
      "Third",
      "Second",
      "First",
    ]);
  });
});

describe("Notification formatting", () => {
  it("formats notification time", () => {
    const formatTime = (date: Date): string => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    };

    expect(formatTime(new Date())).toBe("Just now");
    expect(formatTime(new Date(Date.now() - 300000))).toBe("5m ago");
    expect(formatTime(new Date(Date.now() - 7200000))).toBe("2h ago");
  });

  it("truncates long messages", () => {
    const truncate = (text: string, maxLength: number): string => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + "...";
    };

    expect(truncate("Short", 100)).toBe("Short");
    expect(truncate("This is a very long notification message", 20)).toBe("This is a very long...");
  });
});
