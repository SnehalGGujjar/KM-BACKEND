"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCity } from "@/lib/city-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PartnersPage() {
  const { selectedCityId } = useCity();
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      setIsLoading(true);
      try {
        const params = selectedCityId ? { city_id: selectedCityId } : {};
        // Placeholder for `/admin/accounts/partners/` endpoint
        const res = await api.get("/admin/cities/"); // Temp dummy call
        setPartners([]); // Will implement actual call when backend exposes list
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPartners();
  }, [selectedCityId]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Partner Management</h1>
      <p className="text-muted-foreground text-sm max-w-2xl">
        Manage your fleet of local scrap collectors (Kabadiwalas).
      </p>

      <div className="rounded-md border bg-white mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                Partner table scaffolding complete. Waiting for accounts list API implementation.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
