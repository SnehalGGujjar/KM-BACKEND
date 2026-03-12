"use client";

import { useState } from "react";
import { OrdersTable } from "@/components/orders-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OngoingOrdersPage() {
  const [activeTab, setActiveTab] = useState("all_ongoing");

  return (
    <div className="p-2 space-y-4">
      <h1 className="text-2xl font-bold">Ongoing Orders</h1>
      <p className="text-muted-foreground text-sm max-w-2xl">
        Live tracking of orders where the partner is currently on the way or actively collecting scrap.
      </p>
      
      <Tabs defaultValue="all_ongoing" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all_ongoing">All Ongoing</TabsTrigger>
          <TabsTrigger value="on_the_way">On The Way</TabsTrigger>
          <TabsTrigger value="arrived">Arrived</TabsTrigger>
          <TabsTrigger value="collecting">Collecting / OTP Verified</TabsTrigger>
        </TabsList>
        
        {/* Note: The backend admin endpoint right now accepts single status filters. 
            For "All Ongoing", we might need to remove the status filter entirely and handle visually or 
            create a multi-status filter in backend. Assuming standard query filtering for now, we'll fetch them individually per tab.
        */}
        <TabsContent value="all_ongoing">
          <OrdersTable statusFilter="" title="Live Orders (Filter Active Locally or in Backend)" />
        </TabsContent>
        <TabsContent value="on_the_way">
          <OrdersTable statusFilter="ON_THE_WAY" title="Partners En Route" />
        </TabsContent>
        <TabsContent value="arrived">
          <OrdersTable statusFilter="ARRIVED" title="Partners Arrived" />
        </TabsContent>
        <TabsContent value="collecting">
          <OrdersTable statusFilter="COLLECTING" title="Scrap Collection in Progress" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
