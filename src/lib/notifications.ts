import { toast } from "sonner";
import React from "react";

/**
 * Centralized notification system for Red Akasha.
 * Wraps sonner with typed helpers, icons, and consistent styling.
 */

// ── Icon components (inline to avoid heavy imports in every consumer) ──

const SuccessIcon = () =>
  React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: 18, height: 18, viewBox: "0 0 24 24",
    fill: "none", stroke: "hsl(142 71% 45%)", strokeWidth: 2,
    strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
    React.createElement("polyline", { points: "22 4 12 14.01 9 11.01" })
  );

const ErrorIcon = () =>
  React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: 18, height: 18, viewBox: "0 0 24 24",
    fill: "none", stroke: "hsl(0 84% 60%)", strokeWidth: 2,
    strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("circle", { cx: 12, cy: 12, r: 10 }),
    React.createElement("line", { x1: 15, y1: 9, x2: 9, y2: 15 }),
    React.createElement("line", { x1: 9, y1: 9, x2: 15, y2: 15 })
  );

const WarningIcon = () =>
  React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: 18, height: 18, viewBox: "0 0 24 24",
    fill: "none", stroke: "hsl(48 96% 53%)", strokeWidth: 2,
    strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }),
    React.createElement("line", { x1: 12, y1: 9, x2: 12, y2: 13 }),
    React.createElement("line", { x1: 12, y1: 17, x2: "12.01", y2: 17 })
  );

const InfoIcon = () =>
  React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: 18, height: 18, viewBox: "0 0 24 24",
    fill: "none", stroke: "hsl(199 89% 48%)", strokeWidth: 2,
    strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("circle", { cx: 12, cy: 12, r: 10 }),
    React.createElement("line", { x1: 12, y1: 16, x2: 12, y2: 12 }),
    React.createElement("line", { x1: 12, y1: 8, x2: "12.01", y2: 8 })
  );

const LoadingIcon = () =>
  React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: 18, height: 18, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 2,
    strokeLinecap: "round", strokeLinejoin: "round",
    className: "animate-spin",
  },
    React.createElement("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" })
  );

// ── Public API ──

export function notifySuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    icon: React.createElement(SuccessIcon),
    duration: 4000,
  });
}

export function notifyError(
  message: string,
  error?: Error | unknown,
  action?: { label: string; onClick: () => void }
) {
  const err = error instanceof Error ? error : error ? new Error(String(error)) : null;

  const techDetail = err?.message || "";
  const desc = import.meta.env.DEV && techDetail
    ? techDetail
    : undefined;

  if (import.meta.env.DEV && err) {
    console.error("🔴 [notifyError]:", err);
  }

  toast.error(message, {
    description: desc,
    icon: React.createElement(ErrorIcon),
    duration: 8000,
    action: action || (err
      ? {
          label: "Copiar detalles",
          onClick: () => {
            const details = `Error: ${message}\n${err.message}\n${err.stack || ""}`;
            navigator.clipboard.writeText(details).catch(() => {});
          },
        }
      : undefined),
  });
}

export function notifyWarning(message: string, description?: string) {
  toast.warning(message, {
    description,
    icon: React.createElement(WarningIcon),
    duration: 5000,
  });
}

export function notifyInfo(message: string, description?: string) {
  toast.info(message, {
    description,
    icon: React.createElement(InfoIcon),
    duration: 4000,
  });
}

export function notifyLoading(message: string): string | number {
  return toast.loading(message, {
    icon: React.createElement(LoadingIcon),
  });
}

export function dismissNotification(id: string | number) {
  toast.dismiss(id);
}
