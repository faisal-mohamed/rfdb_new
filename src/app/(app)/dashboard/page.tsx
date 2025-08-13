import Topbar from "@/components/Topbar";
import SectionCard from "@/components/SectionCard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Topbar title="Dashboard" />

      <SectionCard title="Welcome back" description="Your dashboard is ready.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-slate-700">Getting started</div>
            <p className="mt-1 text-sm text-slate-600">This is a placeholder card. Build your widgets here.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-slate-700">Next steps</div>
            <p className="mt-1 text-sm text-slate-600">Add charts, metrics, and recent activity.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}


