"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  CalendarDays,
  Truck,
  CheckCircle2,
  XCircle,
  ListOrdered,
  FileText,
  Users,
  UserCircle,
  IndianRupee,
  BarChart3,
  Bell,
  Settings,
  Info,
  LogOut,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navGroups = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Orders",
    items: [
      { title: "New Orders", href: "/orders/new", icon: ShoppingCart },
      { title: "Scheduled", href: "/orders/scheduled", icon: CalendarDays },
      { title: "Ongoing", href: "/orders/ongoing", icon: Truck },
      { title: "Completed", href: "/orders/completed", icon: CheckCircle2 },
      { title: "Cancelled", href: "/orders/cancelled", icon: XCircle },
      { title: "All Orders", href: "/orders/all", icon: ListOrdered },
    ],
  },
  {
    title: "Finance & Users",
    items: [
      { title: "Invoices", href: "/invoices", icon: FileText },
      { title: "Partners", href: "/partners", icon: Users },
      { title: "Customers", href: "/customers", icon: UserCircle },
      { title: "Pricing", href: "/pricing", icon: IndianRupee },
    ],
  },
  {
    title: "System",
    items: [
      { title: "KPIs & Reports", href: "/kpi", icon: BarChart3 },
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Settings", href: "/settings", icon: Settings },
      { title: "App Info", href: "/info", icon: Info },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    router.push("/login");
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-gray-100">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-wider text-green-400">KABADI MAN</h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Admin Panel</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group, i) => (
          <div key={i} className="mb-6 px-4">
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {group.title}
            </h2>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                      ? "bg-green-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
