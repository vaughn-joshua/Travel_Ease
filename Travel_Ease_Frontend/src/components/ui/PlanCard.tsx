/**
 * PlanCard - Reusable card component for travel plans
 * 
 * Provides consistent styling for plan cards across the dashboard
 * with status badges, meta info, and interactive states.
 */

import React from "react";
import { formatPlanDateRange } from "../../utils/date";

// Status badge colors
export const STATUS_STYLES = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Draft: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-gray-100 text-gray-600 border-gray-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
  Upcoming: "bg-indigo-50 text-indigo-700 border-indigo-200",
} as const;

// Role badge colors
export const ROLE_STYLES = {
  Owner: "bg-purple-50 text-purple-700 border-purple-200",
  Admin: "bg-red-50 text-red-700 border-red-200",
  Editor: "bg-blue-50 text-blue-700 border-blue-200",
  Viewer: "bg-gray-100 text-gray-600 border-gray-200",
  Member: "bg-green-50 text-green-700 border-green-200",
} as const;

interface StatusBadgeProps {
  status: keyof typeof STATUS_STYLES;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${STATUS_STYLES[status] || STATUS_STYLES.Draft}`}>
      {status}
    </span>
  );
}

interface RoleBadgeProps {
  role: string | null | undefined;
  showIcon?: boolean;
  size?: "sm" | "md";
}

export function RoleBadge({ role, showIcon = true, size = "sm" }: RoleBadgeProps) {
  const roleKey = role as keyof typeof ROLE_STYLES;
  const styles = ROLE_STYLES[roleKey] || ROLE_STYLES.Member;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-2.5 py-1 text-xs gap-1.5";
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${styles}`}>
      {showIcon && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {role || "Member"}
    </span>
  );
}

interface MetaRowProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function MetaRow({ icon, children, className = "" }: MetaRowProps) {
  return (
    <div className={`flex items-center gap-1.5 text-sm text-gray-500 ${className}`}>
      <span className="text-gray-400 shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

interface SlotsPillProps {
  current: number;
  max: number | null;
  className?: string;
}

export function SlotsPill({ current, max, className = "" }: SlotsPillProps) {
  if (!max) return null;
  const isFull = current >= max;
  const isNearFull = current >= max * 0.8;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
      isFull 
        ? "bg-red-50 text-red-600 border border-red-200" 
        : isNearFull 
          ? "bg-amber-50 text-amber-600 border border-amber-200"
          : "bg-gray-100 text-gray-600 border border-gray-200"
    } ${className}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {current}/{max}
      {isFull && <span className="text-[10px]">FULL</span>}
    </span>
  );
}

interface DatePillProps {
  startDate?: string | null;
  endDate?: string | null;
  className?: string;
}

export function DatePill({ startDate, endDate, className = "" }: DatePillProps) {
  const dateStr = formatPlanDateRange(startDate, endDate);
  if (!dateStr || dateStr === "No dates set") return null;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {dateStr}
    </span>
  );
}

// Skeleton loader for cards
export function PlanCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </div>
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
      <div className="flex gap-2">
        <div className="h-6 w-24 bg-gray-200 rounded-lg" />
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "warning";
}

export function EmptyState({ icon, title, description, action, variant = "default" }: EmptyStateProps) {
  const bgColor = variant === "warning" ? "bg-amber-50" : "bg-gray-50";
  const iconBg = variant === "warning" ? "bg-amber-100" : "bg-gray-100";
  const iconColor = variant === "warning" ? "text-amber-500" : "text-gray-400";
  
  return (
    <div className={`${bgColor} rounded-xl border border-gray-100 p-8 text-center`}>
      <div className={`w-14 h-14 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium text-primary-red hover:text-primary-red-dark transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Error state component
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-50 rounded-xl border border-red-100 p-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-red-700 font-medium mb-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors mt-2"
        >
          Try again →
        </button>
      )}
    </div>
  );
}

// DB Unavailable banner
interface DbUnavailableBannerProps {
  onRetry?: () => void;
  compact?: boolean;
}

export function DbUnavailableBanner({ onRetry, compact = false }: DbUnavailableBannerProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Showing cached data while reconnecting</span>
        {onRetry && (
          <button onClick={onRetry} className="font-medium hover:underline ml-auto">
            Retry
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 mb-4">
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="flex-1">
        <p className="font-medium">Connection issue</p>
        <p className="text-amber-600 text-xs">Some data may be outdated. Showing cached information.</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg font-medium transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
