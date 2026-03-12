import { OrdersTable } from "@/components/orders-table";

export default function CancelledOrdersPage() {
  return (
    <div className="p-2 space-y-4">
      <h1 className="text-2xl font-bold text-red-600">Cancelled Orders</h1>
      <p className="text-muted-foreground text-sm max-w-2xl">
        Orders that were cancelled by the customer or admin.
      </p>
      <OrdersTable statusFilter="CANCELLED" title="Cancelled Orders History" />
    </div>
  );
}
