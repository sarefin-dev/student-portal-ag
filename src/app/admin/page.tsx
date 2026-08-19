export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="font-medium text-muted-foreground">Total Students</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="font-medium text-muted-foreground">Active Courses</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="font-medium text-muted-foreground">Pending Verifications</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  )
}
