import { Scale } from 'lucide-react';

export function SetupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border p-8 space-y-4">
        <div className="flex items-center gap-2 text-navy">
          <Scale className="h-6 w-6 text-[#1e3a5f]" />
          <h1 className="text-xl font-bold font-serif text-[#1e3a5f]">Inheritance Calculator</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="font-medium text-amber-900 mb-1">Setup Required</p>
          <p className="text-sm text-amber-800">Missing Supabase environment variables. Create <code className="bg-amber-100 px-1 rounded">app/.env.local</code> with:</p>
        </div>
        <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-key-here
VITE_APP_URL=http://localhost:3000`}
        </pre>
        <p className="text-sm text-slate-600">Run <code className="bg-slate-100 px-1 rounded">supabase start</code> to get your local keys, then restart the dev server.</p>
      </div>
    </div>
  );
}
