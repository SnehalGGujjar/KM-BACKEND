"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/admin/orders/${params.id}/`);
        if (res.data.success) {
          setOrder(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch order details", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchOrder();
  }, [params.id]);

  if (isLoading) return <div className="p-4">Loading order details...</div>;
  if (!order) return <div className="p-4 text-destructive">Order not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order {order.order_id}</h1>
          <p className="text-muted-foreground text-sm">Created on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg py-1 px-3">
            {order.status.replace(/_/g, " ")}
          </Badge>
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><span className="font-medium">Name:</span> {order.customer?.name}</div>
            <div><span className="font-medium">Phone:</span> {order.customer?.phone}</div>
            <div><span className="font-medium">Address:</span> {order.customer?.address}</div>
          </CardContent>
        </Card>

        {/* Partner Info */}
        <Card>
          <CardHeader>
            <CardTitle>Partner Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.partner ? (
              <>
                <div><span className="font-medium">Name:</span> {order.partner.name}</div>
                <div><span className="font-medium">Phone:</span> {order.partner.phone}</div>
                <div><span className="font-medium">Rating:</span> {order.partner.rating} / 5.0</div>
              </>
            ) : (
              <div className="text-muted-foreground italic">No partner assigned yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Pickup Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pickup Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><span className="font-medium">Scheduled Date:</span> {order.pickup_date} ({order.pickup_slot})</div>
            {order.scrap_description && (
              <div><span className="font-medium">Description:</span> {order.scrap_description}</div>
            )}
            
            {order.scrap_items && order.scrap_items.length > 0 && (
              <div className="mt-4 border rounded-md p-4">
                <h3 className="font-medium mb-2">Collected Scrap Items</h3>
                <ul className="space-y-2">
                  {order.scrap_items.map((item: any) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span>{item.category_name} ({item.weight_kg} kg)</span>
                      <span>Customer: ₹{item.customer_amount} | Partner: ₹{item.partner_amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
