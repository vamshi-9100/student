"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { getTextSize } from "@/lib/text-sizes";
import { useLanguage } from "@/contexts/language-context";
import {
  LayoutDashboard,
  Shield,
  Lock,
  Activity,
  BarChart3,
  Map,
  Settings,
  FileText,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface DashboardSidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DashboardSidebar({
  className,
  isMobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { t, isRTL } = useLanguage();

  const navigation: {
    name: string;
    href: string;
    icon: any;
    badge?: string;
    submenu?: { name: string; href: string; icon: any }[];
  }[] = [
    { name: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("activities"), href: "/dashboard/activities", icon: Zap },
    { name: t("attendence"), href: "/dashboard/attendence", icon: Activity },
    {
      name: t("biometing"),
      href: "/dashboard/biometing",
      icon: BarChart3,
    },
    {
      name: t("bustracking"),
      href: "/dashboard/bustracking",
      icon: Map,
    },
    { name: t("settings"), href: "/dashboard/settings", icon: Settings },
    {
      name: t("studentprofiles"),
      href: "/dashboard/studentprofiles",
      icon: FileText,
    },
    {
      name: t("usermanagement"),
      href: "/dashboard/usermanagement",
      icon: FileText,
      submenu: [
        {
          name: t("roles"),
          href: "/dashboard/usermanagement/roles",
          icon: Shield,
        },
        {
          name: t("permissions"),
          href: "/dashboard/usermanagement/permissions",
          icon: Lock,
        },
        {
          name: t("Role-Permissions"),
          href: "/dashboard/usermanagement/rolepermissions",
          icon: Lock,
        },
      ],
    },
    {
      name: t("whatsupfeeds"),
      href: "/dashboard/whatsupfeeds",
      icon: FileText,
    },
    {
      name: t("academicReports"),
      href: "/dashboard/academicreport",
      icon: FileText,
    },
    {
      name: t("sectionManagement"),
      href: "/dashboard/sectionManagement",
      icon: FileText,
    },
  ];

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-white dark:bg-gray-900 dark:border-gray-800 transition-all duration-300",
        !isMobile && (collapsed ? "w-16" : "w-64"),
        isMobile && "w-full",
        isRTL && "border-l border-r-0"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 border-b dark:border-gray-800">
        {(!collapsed || isMobile) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex items-center ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <span
              className={`font-semibold text-gray-900 dark:text-white truncate ${getTextSize(
                "navItem"
              )}`}
            >
              {"Stud System"}
            </span>
          </motion.div>
        )}
        <div
          className={`flex items-center gap-1 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMobileClose?.()}
              className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {collapsed ? (
                isRTL ? (
                  <ChevronLeft />
                ) : (
                  <ChevronRight />
                )
              ) : isRTL ? (
                <ChevronRight />
              ) : (
                <ChevronLeft />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 sm:px-3 py-3 sm:py-4">
        <nav className="space-y-1 sm:space-y-2">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const isExpanded = expandedItems.includes(item.name);
            const hasSubmenu = item.submenu && item.submenu.length > 0;

            return (
              <div key={item.name}>
                <div className="relative">
                  {hasSubmenu ? (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 sm:h-10",
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                        !isMobile && collapsed && "justify-center px-2",
                        getTextSize("navItem"),
                        isRTL && "text-right justify-end"
                      )}
                      onClick={() =>
                        (!collapsed || isMobile) && toggleExpanded(item.name)
                      }
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4",
                          !collapsed || isMobile
                            ? isRTL
                              ? "ml-2 sm:ml-3"
                              : "mr-2 sm:mr-3"
                            : ""
                        )}
                      />
                      {(!collapsed || isMobile) && (
                        <>
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className={getTextSize("badge")}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => isMobile && onMobileClose?.()}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 sm:h-10",
                          isActive
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                          !isMobile && collapsed && "justify-center px-2",
                          getTextSize("navItem"),
                          isRTL && "text-right justify-end"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4",
                            !collapsed || isMobile
                              ? isRTL
                                ? "ml-2 sm:ml-3"
                                : "mr-2 sm:mr-3"
                              : ""
                          )}
                        />
                        {(!collapsed || isMobile) && (
                          <>
                            <span className="flex-1">{item.name}</span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className={getTextSize("badge")}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Submenu */}
                {hasSubmenu && (!collapsed || isMobile) && isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700",
                      isRTL
                        ? "mr-3 sm:mr-4 border-r border-l-0 pr-3 sm:pr-4"
                        : "ml-3 sm:ml-4 pl-3 sm:pl-4"
                    )}
                  >
                    {item.submenu?.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={() => isMobile && onMobileClose?.()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start text-left font-normal h-8 sm:h-9",
                              isSubActive
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
                              getTextSize("navLabel"),
                              isRTL && "text-right justify-end"
                            )}
                          >
                            <subItem.icon
                              className={cn("h-3 w-3", isRTL ? "ml-2" : "mr-2")}
                            />
                            <span>{subItem.name}</span>
                          </Button>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-3 sm:p-4 dark:border-gray-800">
        {(!collapsed || isMobile) && (
          <div
            className={`text-gray-500 dark:text-gray-400 ${getTextSize(
              "caption"
            )} ${isRTL ? "text-right" : "text-left"}`}
          >
            <p>©2025 IOTforAI.com</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex", className)}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={!!isMobileOpen} onOpenChange={() => onMobileClose?.()}>
        <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-80">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>
    </>
  );
}
