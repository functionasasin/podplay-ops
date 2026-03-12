export function OperationsGuide() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10 print:p-0 print:max-w-none">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">PodPlay Operations Guide</h1>
        <p className="text-muted-foreground text-lg">Complete deployment operations manual</p>
      </div>

      {/* Table of contents */}
      <nav className="rounded-lg border bg-muted/40 p-5 space-y-2" aria-label="Table of contents">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Table of Contents
        </p>
        <ol className="space-y-1 text-sm list-decimal list-inside">
          <li>
            <a href="#overview" className="text-primary hover:underline">
              Overview
            </a>
          </li>
          <li>
            <a href="#customer-onboarding" className="text-primary hover:underline">
              Customer Onboarding
            </a>
          </li>
          <li>
            <a href="#procurement" className="text-primary hover:underline">
              Procurement &amp; Hardware Ordering
            </a>
          </li>
          <li>
            <a href="#deployment" className="text-primary hover:underline">
              Deployment
            </a>
          </li>
          <li>
            <a href="#financial-close" className="text-primary hover:underline">
              Financial Close
            </a>
          </li>
        </ol>
      </nav>

      {/* Section placeholders */}
      <section id="overview" className="space-y-3 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Overview</h2>
        <p className="text-muted-foreground italic">Content coming in stage 040.</p>
      </section>

      <section id="customer-onboarding" className="space-y-3 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Customer Onboarding</h2>
        <p className="text-muted-foreground italic">Content coming in stage 040.</p>
      </section>

      <section id="procurement" className="space-y-3 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Procurement &amp; Hardware Ordering</h2>
        <p className="text-muted-foreground italic">Content coming in stage 041.</p>
      </section>

      <section id="deployment" className="space-y-3 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Deployment</h2>
        <p className="text-muted-foreground italic">Content coming in stage 042.</p>
      </section>

      <section id="financial-close" className="space-y-3 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Financial Close</h2>
        <p className="text-muted-foreground italic">Content coming in stage 043.</p>
      </section>
    </div>
  );
}
