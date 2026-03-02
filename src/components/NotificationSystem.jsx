// NotificationSystem.jsx
import React from "react";

export default function NotificationSystem({ notifications }) {
  return (
    <div className="fixed top-4 right-4 space-y-2">
      {notifications.map((n, i) => (
        <div key={i} className={`p-2 rounded ${n.type === "success" ? "bg-green-500" : "bg-gray-500"}`}>
          {n.message}
        </div>
      ))}
    </div>
  );
}