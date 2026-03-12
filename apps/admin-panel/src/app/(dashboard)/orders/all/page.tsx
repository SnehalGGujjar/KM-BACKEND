import { OrdersTable } from "@/components/orders-table";

export default function AllOrdersPage() {
  return (
    <div className="p-2 space-y-4">
      <h1 className="text-2xl font-bold">All Orders Database</h1>
      <p className="text-muted-foreground text-sm max-w-2xl">
        Unfiltered historical database of every single order across all statuses.
      </p>
      <OrdersTable title="Global Order Directory" />
    </div>
  );
}
