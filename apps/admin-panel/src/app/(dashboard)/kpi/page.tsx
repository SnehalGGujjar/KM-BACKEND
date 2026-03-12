export default function KPIPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">KPIs & Reports</h1>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="h-48 border rounded-md flex items-center justify-center flex-col bg-white">
          <span className="text-xl font-bold text-green-600">4.2 hr</span>
          <span className="text-sm text-muted-foreground">Average TAT (Assignment → Completion)</span>
        </div>
        <div className="h-48 border rounded-md flex items-center justify-center flex-col bg-white">
          <span className="text-xl font-bold text-blue-600">89%</span>
          <span className="text-sm text-muted-foreground">Partner Acceptance Rate</span>
        </div>
        <div className="col-span-2 h-64 border rounded-md flex items-center justify-center text-muted-foreground bg-white">
          Detailed Historical Export (CSV / PDF) Ready for Sync
        </div>
      </div>
    </div>
  );
}
