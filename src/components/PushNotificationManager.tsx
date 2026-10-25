"use client";
import React, { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  registerServiceWorker,
  requestNotificationPermission,
  sendLocalNotification,
  calculateRentalReminders,
  type RentalReminder,
} from "@/lib/notifications";

export function PushNotificationManager({
  booking,
  compact = false,
}: {
  booking?: {
    id: string;
    event_date: string;
    start_date: string;
    end_date: string;
    pickup_code: string;
    delivery: boolean;
    item_title?: string;
    deposit?: number;
  } | null;
  compact?: boolean;
}) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  async function handleEnableNotifications() {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === "granted") {
      await sendLocalNotification(
        "🎉 Owambe Closet Alerts Activated!",
        "You’re all set to receive reminders 2 days before your event, day-of pickup, and return deadline.",
        "/me?tab=rentals"
      );
      setTestSent(true);
    }
  }

  async function handleTestNotification() {
    await sendLocalNotification(
      "👗 Reminder: 2 Days to Your Event",
      "Your Aso-ebi & Gele have been sanitized and inspected at the hub. Ready for pickup tomorrow!",
      "/me?tab=rentals"
    );
    setTestSent(true);
  }

  const reminders: RentalReminder[] = booking ? calculateRentalReminders(booking) : [];

  return (
    <div
      className="rental-notification-card box"
      style={{
        background: "linear-gradient(135deg, rgba(22, 83, 55, 0.08) 0%, rgba(30, 58, 138, 0.06) 100%)",
        borderColor: "rgba(22, 83, 55, 0.25)",
        marginTop: 12,
        padding: "16px 18px",
      }}
    >
      <div className="row between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="row g8" style={{ alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: "1.2rem" }}>🔔</span>
            <strong style={{ fontSize: "1rem", color: "var(--ink)" }}>
              Rental Milestones &amp; Push Notifications
            </strong>
            {permission === "granted" ? (
              <span className="pill ok" style={{ fontSize: "0.72rem" }}>Active</span>
            ) : (
              <span className="pill warn" style={{ fontSize: "0.72rem" }}>Setup Available</span>
            )}
          </div>
          <p className="tiny muted" style={{ margin: 0, maxWidth: 540 }}>
            Automated alerts sent directly to your phone / browser: <strong>2 days before event</strong> (ready at hub), <strong>day-of pickup</strong> (pickup code), and <strong>return deadline</strong> (to recover 100% of your deposit).
          </p>
        </div>

        <div className="row g8" style={{ alignItems: "center" }}>
          {permission !== "granted" ? (
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="btn small"
              style={{ background: "var(--grade-a)", color: "#fff", borderColor: "var(--grade-a)" }}
            >
              Turn On Reminders
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTestNotification}
              className="btn small ghost"
              style={{ fontSize: "0.8rem" }}
            >
              {testSent ? "Test Alert Sent ✔" : "Send Test Alert"}
            </button>
          )}
        </div>
      </div>

      {/* Reminder Milestones Timeline */}
      {booking && reminders.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <span className="tiny-label" style={{ display: "block", marginBottom: 8 }}>
            Scheduled Reminder Timeline for #{booking.pickup_code}
          </span>
          <div className="stack g8">
            {reminders.map((r, i) => (
              <div
                key={r.id}
                className="row between"
                style={{
                  alignItems: "center",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: r.isPast ? "rgba(22, 83, 55, 0.12)" : "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  fontSize: "0.82rem",
                }}
              >
                <div className="row g8" style={{ alignItems: "center" }}>
                  <span style={{ color: r.isPast ? "var(--grade-a)" : "var(--ink-muted)", fontWeight: 700 }}>
                    {r.isPast ? "✔" : `${i + 1}.`}
                  </span>
                  <div>
                    <strong style={{ display: "block", color: "var(--ink)" }}>{r.title}</strong>
                    <span className="tiny muted">{r.body}</span>
                  </div>
                </div>
                <span className="tiny muted" style={{ whiteSpace: "nowrap", marginLeft: 8 }}>
                  {r.statusText}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
