/**
 * Push Notifications & Event Reminders (PWA)
 * - Remind renters 2 days before event
 * - Day-of pickup reminder with pickup code
 * - Return deadline reminder for full deposit recovery
 */

export type ReminderStage = "two_days_before" | "day_of_pickup" | "return_deadline";

export type RentalReminder = {
  id: string;
  stage: ReminderStage;
  scheduledFor: string; // ISO date / time
  title: string;
  body: string;
  icon?: string;
  actionUrl: string;
  isPast: boolean;
  statusText: string;
};

/**
 * Calculate the 3 smart notification milestones for a given booking
 */
export function calculateRentalReminders(booking: {
  id: string;
  event_date: string;
  start_date: string;
  end_date: string;
  pickup_code: string;
  delivery: boolean;
  item_title?: string;
  deposit?: number;
}): RentalReminder[] {
  const now = new Date();

  // Milestone 1: 2 Days before event
  const twoDaysBefore = new Date(booking.event_date);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
  twoDaysBefore.setHours(9, 0, 0, 0);

  // Milestone 2: Day-of pickup / handover (start_date)
  const pickupDay = new Date(booking.start_date);
  pickupDay.setHours(8, 30, 0, 0);

  // Milestone 3: Return deadline day (end_date)
  const returnDay = new Date(booking.end_date);
  returnDay.setHours(11, 0, 0, 0);

  const titlePrefix = booking.item_title ? `${booking.item_title.slice(0, 24)}…` : "Your Owambe Outfit";
  const depositFormatted = booking.deposit ? `₦${booking.deposit.toLocaleString()}` : "100%";

  return [
    {
      id: `${booking.id}-2days`,
      stage: "two_days_before",
      scheduledFor: twoDaysBefore.toISOString(),
      title: "✨ 2 Days to Your Event – Outfit Ready!",
      body: `Your look (${titlePrefix}) has been sanitized, inspected, and prepped at the hub. Get ready for an unforgettable celebration!`,
      actionUrl: "/me?tab=rentals",
      isPast: now >= twoDaysBefore,
      statusText: now >= twoDaysBefore ? "Sent (2 days before)" : "Scheduled: 2 Days Before Event",
    },
    {
      id: `${booking.id}-pickup`,
      stage: "day_of_pickup",
      scheduledFor: pickupDay.toISOString(),
      title: booking.delivery ? "🚚 Delivery Dispatch Alert!" : "🏷️ Today is Pickup Day – Code Ready",
      body: booking.delivery
        ? `Your dispatch rider will arrive today. Present pickup code #${booking.pickup_code} upon handover.`
        : `Present Pickup Code #${booking.pickup_code} at your neighborhood hub desk for instant handover.`,
      actionUrl: "/me?tab=rentals",
      isPast: now >= pickupDay,
      statusText: now >= pickupDay ? "Sent (Pickup Day)" : "Scheduled: Morning of Pickup",
    },
    {
      id: `${booking.id}-return`,
      stage: "return_deadline",
      scheduledFor: returnDay.toISOString(),
      title: "⏰ Return Deadline – Unlock Your Deposit Refund",
      body: `Hope you dazzled at your owambe! Drop off before 5:00 PM today. Your ${depositFormatted} refundable security deposit will be released within 24h.`,
      actionUrl: "/me?tab=rentals",
      isPast: now >= returnDay,
      statusText: now >= returnDay ? "Active / Due" : "Scheduled: Return Deadline",
    },
  ];
}

/**
 * Register Service Worker for PWA Push Notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch (err) {
    console.warn("ServiceWorker registration failed:", err);
    return null;
  }
}

/**
 * Request notification permissions from browser
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  return await Notification.requestPermission();
}

/**
 * Trigger immediate local / test notification
 */
export async function sendLocalNotification(title: string, body: string, url: string = "/me?tab=rentals") {
  if (typeof window === "undefined" || !("Notification" in window)) {
    alert(`${title}\n\n${body}`);
    return;
  }

  if (Notification.permission !== "granted") {
    const perm = await requestNotificationPermission();
    if (perm !== "granted") {
      alert(`${title}\n\n${body}`);
      return;
    }
  }

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: "/logo.png",
          badge: "/logo.png",
          data: { url },
        });
        return;
      }
    }
    // Fallback to standard Notification
    new Notification(title, {
      body,
      icon: "/logo.png",
    });
  } catch (e) {
    console.warn("Notification error:", e);
    alert(`${title}\n\n${body}`);
  }
}
