import { OrdersTable } from "@/components/orders-table";

export default function ScheduledOrdersPage() {
  return (
    <div className="p-2 space-y-4">
      <h1 className="text-2xl font-bold">Scheduled Orders</h1>
      <p className="text-muted-foreground text-sm max-w-2xl">
        These orders are assigned to partners and waiting for them to start heading towards the location.
      </p>
      <OrdersTable statusFilter="ASSIGNED" title="Scheduled Deliveries" />
    </div>
  );
}
