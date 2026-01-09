import AdminInfoPage from '@/admin/AdminInfoPage';
import FixDatesButton from '@/admin/FixDatesButton';

export default function AdminMaintenancePage() {
  return (
    <AdminInfoPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Database Maintenance</h1>
          <p className="text-dim">
            Tools for maintaining and fixing database issues
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Fix Invalid Dates</h2>
          <p className="text-dim mb-4">
            Some photos may have invalid <code>taken_at_naive</code> dates 
            (e.g., with trailing spaces like "2026-01-06 "). 
            This tool will find and correct them to the proper format.
          </p>
          <FixDatesButton />
        </div>
      </div>
    </AdminInfoPage>
  );
}
