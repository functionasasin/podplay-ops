// SetupPage: Shown when VITE_SUPABASE_URL is missing (spec §9.5).
export function SetupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
      <h1 className="text-2xl font-semibold">Setup Required</h1>
      <p className="text-muted-foreground max-w-md">
        Environment variables are not configured. Create a{' '}
        <code className="text-sm bg-muted px-1 rounded">.env.local</code> file with your Supabase
        credentials. See <code>.env.local.example</code> for the required variables.
      </p>
    </div>
  );
}

export default SetupPage;
