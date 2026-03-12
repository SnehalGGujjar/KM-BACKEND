"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useCity } from "@/lib/city-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OrderTableProps {
  statusFilter?: string; // Optional filter string
  title: string;
}

export function OrdersTable({ statusFilter, title }: OrderTableProps) {
  const { selectedCityId } = useCity();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const params: any = {};
        if (selectedCityId) params.city_id = selectedCityId;
        if (statusFilter) params.status = statusFilter;

        const res = await api.get("/admin/orders/", { params });
        if (res.data.success) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [selectedCityId, statusFilter]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "NEW": return "default";
      case "ASSIGNED": return "secondary";
      case "ON_THE_WAY": return "secondary";
      case "ARRIVED": return "secondary";
      case "COLLECTING": return "secondary";
      case "AWAITING_INVOICE": return "outline";
      case "PAYMENT_PENDING": return "outline";
      case "COMPLETED": return "success";
      case "CANCELLED": return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date & Slot</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_id}</TableCell>
                  <TableCell>
                    {order.pickup_date} <br />
                    <span className="text-xs text-muted-foreground">{order.pickup_slot}</span>
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>
                    {order.partner_name || <span className="text-muted-foreground italic">Unassigned</span>}
                  </TableCell>
                  <TableCell>
                    {/* Note: In a real project we would define a custom badge for green/success */}
                    <Badge variant={getStatusBadgeVariant(order.status) as any}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
