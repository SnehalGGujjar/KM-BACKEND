import { OrdersTable } from "@/components/orders-table";

export default function CompletedOrdersPage() {
  return (
    <div className="p-2 space-y-4">
      <h1 className="text-2xl font-bold">Completed Orders</h1>
      <p className="text-muted-foreground text-sm max-w-2xl">
        Historical view of all successfully completed orders (scrap collected, invoice approved, payment complete).
      </p>
      <OrdersTable statusFilter="COMPLETED" title="Completed Deliveries" />
    </div>
  );
}
