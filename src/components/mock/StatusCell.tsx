// StatusCell.tsx
import React from "react";

interface StatusCellProps {
  value: string;
}

const statusColors: Record<string, string> = {
  SCHEDULED: "#3498db",    // Blue
  IN_PROGRESS: "#f1c40f",  // Yellow
  COMPLETED: "#2ecc71",    // Green
  CANCELLED: "#e74c3c",      // Red
  EXPIRED: "#95a5a6",      // Gray
};

export default function StatusCell({ value }: StatusCellProps) {
  const color = statusColors[value] || "#bdc3c7"; // fallback gray

  return (
    <span
      style={{
        backgroundColor: color,
        color: "white",
        padding: "4px 8px",
        borderRadius: "12px",
        fontWeight: "bold",
        fontSize: "12px",
      }}
    >
      {value}
    </span>
  );
}
