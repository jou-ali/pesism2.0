import { notFound } from 'next/navigation';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminGrievancePanel } from '@/components/admin-grievance-panel';
import { AdminPageHead } from '@/components/admin-page-head';
import { getAdminGrievance } from '@/lib/tournax-api';

export const dynamic = 'force-dynamic';

export default async function AdminGrievanceDetailPage({
  params,
}: {
  params: Promise<{ grievanceId: string }>;
}) {
  const { grievanceId } = await params;
  let grievance;
  let error: string | null = null;
  try {
    grievance = await getAdminGrievance(grievanceId);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Could not load grievance';
  }

  if (error?.toLowerCase().includes('not found')) {
    notFound();
  }

  return (
    <>
      <AdminPageHead eyebrow="Grievances / Review" title={grievance?.subject ?? 'Grievance'} />

      {error || !grievance ? (
        <AdminApiStatus error={error ?? 'Grievance not found'} />
      ) : (
        <AdminGrievancePanel grievance={grievance} />
      )}
    </>
  );
}
