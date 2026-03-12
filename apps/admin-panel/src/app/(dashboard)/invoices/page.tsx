"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCity } from "@/lib/city-context";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function InvoicesPage() {
  const { selectedCityId } = useCity();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const params = selectedCityId ? { city_id: selectedCityId } : {};
      const res = await api.get("/admin/invoices/", { params });
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedCityId]);

  const handleApprove = async (id: number) => {
    try {
      const res = await api.post(`/admin/invoices/${id}/approve/`);
      if (res.data.success) {
        toast.success("Invoice approved & commission deducted");
        fetchInvoices();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Approval failed");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Invoices & Commission</h1>
      <p className="text-muted-foreground text-sm max-w-2xl text-balance">
        Review split totals and approve invoices. Approving automatically deducts the commission amount from the partner's wallet.
      </p>

      <div className="rounded-md border bg-white mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer Pays</TableHead>
              <TableHead>Partner Pays</TableHead>
              <TableHead>Platform Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24">Loading invoices...</TableCell></TableRow>
            ) : invoices.length === 0 ? (
               <TableRow><TableCell colSpan={7} className="text-center h-24">No pending invoices.</TableCell></TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.order_id}</TableCell>
                  <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>₹{inv.customer_total}</TableCell>
                  <TableCell>₹{inv.partner_total}</TableCell>
                  <TableCell className="font-semibold text-green-600">₹{inv.commission}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === "APPROVED" ? "success" : "secondary" as any}>
                      {inv.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {inv.status === "PENDING_APPROVAL" && (
                      <Button size="sm" onClick={() => handleApprove(inv.id)}>
                        Approve
                      </Button>
                    )}
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
