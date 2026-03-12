export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">System Settings</h1>
      <p className="text-muted-foreground text-sm max-w-2xl">
        Configure operational cities, global parameters, scrap categories, and security.
      </p>
      
      <div className="grid md:grid-cols-2 gap-4 mt-6">
         <div className="p-6 border rounded-md bg-white">
           <h3 className="font-semibold text-lg mb-2">City Configuration</h3>
           <p className="text-sm text-muted-foreground">Add or disable operational zones.</p>
         </div>
         <div className="p-6 border rounded-md bg-white">
           <h3 className="font-semibold text-lg mb-2">Scrap Categories</h3>
           <p className="text-sm text-muted-foreground">Manage types of waste collected.</p>
         </div>
         <div className="p-6 border rounded-md bg-white">
           <h3 className="font-semibold text-lg mb-2">Time Slots</h3>
           <p className="text-sm text-muted-foreground">Configure customer visible booking windows.</p>
         </div>
      </div>
    </div>
  );
}
