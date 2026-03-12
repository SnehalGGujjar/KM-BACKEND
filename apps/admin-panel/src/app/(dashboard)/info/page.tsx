export default function InfoPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">App Info</h1>
      
      <div className="prose prose-sm prose-green mt-6 bg-white p-8 rounded-md border">
        <h2>Kabadi Man Admin Control Center</h2>
        <p>Version 1.0.0</p>
        <p>This control panel manages the 3-sided marketplace operations across all registered Indian cities. The system utilizes real-time tracking, atomic financial transactions, and dual-layer architecture.</p>
        <ul>
          <li><strong>Orders:</strong> Driven by a strictly validated finite state machine (10 statuses).</li>
          <li><strong>Finance:</strong> Atomic deductions from virtual partner wallets ensuring no race conditions.</li>
          <li><strong>Notifications:</strong> Fully asynchronous Celery + Expo Push delivery integration.</li>
        </ul>
      </div>
    </div>
  );
}
