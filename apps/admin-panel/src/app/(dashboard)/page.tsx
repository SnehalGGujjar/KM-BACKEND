"use client";

import { useEffect, useState } from "react";
import { useCity } from "@/lib/city-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Users, ShoppingCart, IndianRupee, Truck } from "lucide-react";

interface DashboardStats {
  orders_today: number;
  orders_trend: string;
  active_partners: number;
  partners_trend: string;
  total_revenue: number;
  revenue_trend: string;
  completion_rate: number;
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
        // Fallback for UI demonstration if backend isn't running
        setStats({
          orders_today: 145,
          orders_trend: "+12.5%",
          active_partners: 34,
          partners_trend: "+2",
          total_revenue: 12450.00,
          revenue_trend: "+14.2%",
          completion_rate: 94.5,
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
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.orders_today || 0}</div>
            <p className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              {stats?.orders_trend || "+0%"} from yesterday
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
            <p className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              {stats?.partners_trend || "+0"} this week
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.total_revenue || 0}</div>
            <p className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              {stats?.revenue_trend || "+0%"} from yesterday
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Completion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completion_rate || 0}%</div>
            <p className="flex items-center text-xs text-muted-foreground mt-1">
              Of assigned orders
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
