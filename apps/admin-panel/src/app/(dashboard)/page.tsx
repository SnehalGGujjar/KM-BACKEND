"use client";

import { useEffect, useState } from "react";
import { useCity } from "@/lib/city-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Users, ShoppingCart, IndianRupee, Truck } from "lucide-react";

interface DashboardStats {
  new_orders_today: number;
  scheduled_today: number;
  ongoing_now: number;
  completed_today: number;
  cancelled_today: number;
  pending_invoices: number;
  active_partners: number;
  todays_revenue: number;
  new_orders_trend: number;
  completed_trend: number;
  cancelled_trend: number;
}

export default function DashboardPage() {
  const { selectedCityId } = useCity();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We would fetch actual KPI stats from the backend here.
    // The backend provides AdminDashboardStatsView at `/admin/orders/dashboard/`
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const params = selectedCityId ? { city_id: selectedCityId } : {};
        // Use a dummy call or the real API if it's ready. Assuming Phase 4 built it:
        const res = await api.get("/admin/dashboard/", { params });
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        // Show empty stats when backend isn't running
        setStats({
          new_orders_today: 0,
          scheduled_today: 0,
          ongoing_now: 0,
          completed_today: 0,
          cancelled_today: 0,
          pending_invoices: 0,
          active_partners: 0,
          todays_revenue: 0,
          new_orders_trend: 0,
          completed_trend: 0,
          cancelled_trend: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    // Refresh every 30s
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [selectedCityId]);

  if (isLoading && !stats) {
    return <div className="animate-pulse space-y-4">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Here's what's happening today in {selectedCityId ? "the selected city" : "all cities"}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Orders Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.new_orders_today || 0}</div>
            <p className={`flex items-center text-xs mt-1 ${(stats?.new_orders_trend || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(stats?.new_orders_trend || 0) >= 0 ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
              {stats?.new_orders_trend || 0}% from yesterday
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Partners */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_partners || 0}</div>
            <p className="flex items-center text-xs text-muted-foreground mt-1">
              Online & approved
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.todays_revenue || 0}</div>
            <p className="flex items-center text-xs text-muted-foreground mt-1">
              Commission earned today
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Completed Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed_today || 0}</div>
            <p className={`flex items-center text-xs mt-1 ${(stats?.completed_trend || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(stats?.completed_trend || 0) >= 0 ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
              {stats?.completed_trend || 0}% from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholders */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 h-[300px] flex items-center justify-center bg-gray-50/50 rounded-md border border-dashed m-4">
            <p className="text-sm text-muted-foreground">Chart: Revenue over last 7 days</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Scrap Categories</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-gray-50/50 rounded-md border border-dashed m-4">
            <p className="text-sm text-muted-foreground">Chart: Weight received by category</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
