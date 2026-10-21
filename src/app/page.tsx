import { AppHeader } from "@/components/app-header";
import { Dashboard } from "@/components/dashboard/dashboard";
import { WorkspaceGate } from "@/components/workspace-gate";
import { WorkspaceSkeleton } from "@/components/skeletons";

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <WorkspaceGate fallback={<WorkspaceSkeleton />}>
        <Dashboard />
      </WorkspaceGate>
    </>
  );
}
