"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Loader2,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  Activity,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useAuth } from "@/contexts/auth-context";

const loadingMessages = [
  {
    icon: Zap,
    title: "Powering Up",
    description: "Initializing your IoT dashboard with real-time data",
  },
  {
    icon: Shield,
    title: "Securing Connection",
    description: "Establishing secure connection to your devices",
  },
  {
    icon: Globe,
    title: "Connecting Devices",
    description: "Syncing with your global IoT network",
  },
  {
    icon: TrendingUp,
    title: "Analyzing Data",
    description: "Preparing insights and analytics for you",
  },
  {
    icon: Activity,
    title: "Almost Ready",
    description: "Finalizing your personalized dashboard experience",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const { isLoading, user } = useAuth();
  const [isOnLoginPage, setIsOnLoginPage] = useState(false);

  const handleMobileMenuClick = () => {
    setIsMobileSidebarOpen(true);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  // Check if we're on the login page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      setIsOnLoginPage(pathname === "/login" || pathname.startsWith("/login/"));
    }
  }, []);

  // Rotate through loading messages - start with random index on page refresh
  /*useEffect(() => {
    if (isLoading || !user) {
      // Start with a random message index for variety
      setCurrentMessageIndex(
        Math.floor(Math.random() * loadingMessages.length)
      );
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    } else if (user) {
      // Reset message index when loading completes
      setCurrentMessageIndex(0);
    }
  }, [isLoading, user]);

  // Show loading screen while fetching user details after login
  if (isLoading || !user) {
    // Only show logout message if we're actually on the login page (redirected after logout)
    // If we're on dashboard and loading, show loading messages
    if (!isLoading && !user && isOnLoginPage) {
      return (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="flex flex-col items-center gap-6 px-4 max-w-md text-center">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                Signing Out
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Redirecting to login page...
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Show loading messages only when actually loading (random start)
    const currentMessage = loadingMessages[currentMessageIndex];
    const Icon = currentMessage.icon;

    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center gap-6 px-4 max-w-md text-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              {currentMessage.title}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {currentMessage.description}
            </p>
          </div>
          <div className="flex gap-1 mt-4">
            {loadingMessages.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  index === currentMessageIndex
                    ? "bg-blue-600 dark:bg-blue-400 w-6"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }*/

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <DashboardSidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader onMenuClick={handleMobileMenuClick} />

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
