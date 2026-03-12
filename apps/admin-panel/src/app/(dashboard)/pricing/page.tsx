"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCity } from "@/lib/city-context";

export default function PricingPage() {
  const { selectedCityId } = useCity();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pricing Configuration</h1>
      <p className="text-muted-foreground text-sm max-w-2xl">
        Manage customer rates, partner default rates, and approve individual partner rate requests.
      </p>

      <Tabs defaultValue="customer_rates" className="w-full mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="customer_rates">Customer Rates</TabsTrigger>
          <TabsTrigger value="partner_default">Partner Default</TabsTrigger>
          <TabsTrigger value="rate_requests">Rate Change Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="customer_rates">
          <div className="rounded-md border bg-white p-4 text-center text-muted-foreground h-32 flex items-center justify-center">
            Platform-to-Customer rates for City {selectedCityId || "All"}. Ready for API sync.
          </div>
        </TabsContent>
        <TabsContent value="partner_default">
          <div className="rounded-md border bg-white p-4 text-center text-muted-foreground h-32 flex items-center justify-center">
            Partner-to-Platform default rates.
          </div>
        </TabsContent>
        <TabsContent value="rate_requests">
          <div className="rounded-md border bg-white p-4 text-center text-muted-foreground h-32 flex items-center justify-center">
            Pending rate bump requests.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
