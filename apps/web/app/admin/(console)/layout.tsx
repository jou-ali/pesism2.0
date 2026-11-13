import { AdminShell } from '@/components/admin-shell';
import { LiveCompetitionRefresh } from '@/components/live-competition-refresh';
import { logoutAction } from '../login/actions';

export default function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell logoutAction={logoutAction}>
      {children}
      <LiveCompetitionRefresh />
    </AdminShell>
  );
}
