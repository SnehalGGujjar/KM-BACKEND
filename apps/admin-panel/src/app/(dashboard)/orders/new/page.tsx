import { OrdersTable } from "@/components/orders-table";

export default function NewOrdersPage() {
  return (
    <div className="p-2 space-y-4">
      <h1 className="text-2xl font-bold">New Unassigned Orders</h1>
      <p className="text-muted-foreground text-sm max-w-2xl">
        These orders have been created by customers but not yet assigned to a partner.
      </p>
      <OrdersTable statusFilter="NEW" title="New Orders" />
    </div>
  );
}
