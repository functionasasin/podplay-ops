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

      {/* Section: Overview */}
      <section id="overview" className="space-y-4 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Overview</h2>
        <p>
          PodPlay Ops is the end-to-end operations platform for deploying PodPlay badminton court
          systems across the Philippines. It manages the full lifecycle of every deployment project —
          from initial customer onboarding through hardware procurement, on-site installation, and
          final financial close.
        </p>

        <h3 className="text-lg font-semibold mt-4">Project Lifecycle</h3>
        <p className="text-muted-foreground text-sm">
          Every project moves through four sequential phases. Each phase must be completed before the
          next can begin.
        </p>
        <ol className="space-y-3 mt-2">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              1
            </span>
            <div>
              <p className="font-medium">Intake</p>
              <p className="text-sm text-muted-foreground">
                Capture customer details, venue configuration, ISP, service tier, installer
                assignment, and deposit terms. Submitting intake locks the project and hands it off
                to procurement.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              2
            </span>
            <div>
              <p className="font-medium">Procurement</p>
              <p className="text-sm text-muted-foreground">
                Generate and manage the Bill of Materials, issue purchase orders to vendors, receive
                hardware into inventory, and advance the project to deployment once all hardware is
                on hand.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              3
            </span>
            <div>
              <p className="font-medium">Deployment</p>
              <p className="text-sm text-muted-foreground">
                Track on-site installation phases: pre-install checks, physical install, network
                configuration, system testing, and customer sign-off. Advance to financial close
                when all phases are complete.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              4
            </span>
            <div>
              <p className="font-medium">Financial Close</p>
              <p className="text-sm text-muted-foreground">
                Issue deposit and final invoices, reconcile costs against the hardware BOM, and mark
                the project as financially closed.
              </p>
            </div>
          </li>
        </ol>

        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-4 mt-4">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Tip</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Use the left-hand navigation to jump directly to any project phase. The phase becomes
            active only after the preceding phase has been advanced.
          </p>
        </div>
      </section>

      {/* Section: Customer Onboarding */}
      <section id="customer-onboarding" className="space-y-4 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Customer Onboarding</h2>
        <p>
          Customer onboarding is handled through the <strong>Intake Wizard</strong>. Complete all
          eight steps in order — each step must be saved before the next unlocks.
        </p>

        <ol className="space-y-6 mt-2">
          {/* Step 1 */}
          <li className="space-y-1">
            <p className="font-semibold">Step 1 — Create a New Project</p>
            <p className="text-sm text-muted-foreground">
              From the Dashboard, click <strong>New Project</strong>. A blank project is created and
              you are taken directly to the Intake Wizard.
            </p>
          </li>

          {/* Step 2 */}
          <li className="space-y-1">
            <p className="font-semibold">Step 2 — Customer Information</p>
            <p className="text-sm text-muted-foreground">
              Enter the customer's legal business name, primary contact name, contact email, and
              contact phone number. These fields are pre-filled on return visits if the project was
              previously saved.
            </p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-2">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> The project name is derived from the customer's business name
                and is displayed in all subsequent phase headers.
              </p>
            </div>
          </li>

          {/* Step 3 */}
          <li className="space-y-1">
            <p className="font-semibold">Step 3 — Venue Configuration</p>
            <p className="text-sm text-muted-foreground">
              Enter the physical layout of the venue:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-1">
              <li>
                <strong>Court Count</strong> — number of badminton courts in the facility
              </li>
              <li>
                <strong>Front Desk</strong> — toggle whether the venue has a staffed front desk. If
                disabled, door count and camera count become required.
              </li>
              <li>
                <strong>Door Count</strong> — number of access-controlled doors (required when no
                front desk)
              </li>
              <li>
                <strong>Camera Count</strong> — number of security cameras (required when no front
                desk)
              </li>
            </ul>
          </li>

          {/* Step 4 */}
          <li className="space-y-1">
            <p className="font-semibold">Step 4 — ISP Selection</p>
            <p className="text-sm text-muted-foreground">
              Choose the internet service provider available at the venue. Options are drawn from
              Philippine ISP providers configured in Settings. The selected ISP determines which
              network hardware SKUs appear in the Bill of Materials.
            </p>
          </li>

          {/* Step 5 */}
          <li className="space-y-1">
            <p className="font-semibold">Step 5 — Tier Selection</p>
            <p className="text-sm text-muted-foreground">
              Select the PodPlay service tier:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-1">
              <li>
                <strong>Pro</strong> — standard hardware bundle, staff-assisted operations
              </li>
              <li>
                <strong>Autonomous</strong> — full self-service kiosk hardware
              </li>
              <li>
                <strong>Autonomous+</strong> — Autonomous tier with premium add-ons
              </li>
            </ul>
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-3 mt-2">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> Tier selection drives the hardware BOM generated in
                Procurement. Changing the tier after procurement has started requires re-generating
                the BOM.
              </p>
            </div>
          </li>

          {/* Step 6 */}
          <li className="space-y-1">
            <p className="font-semibold">Step 6 — Installer Assignment</p>
            <p className="text-sm text-muted-foreground">
              Assign one or more installers from the team roster. Use the multi-select to add all
              technicians who will be on site. Selected installers appear as chips — click the ×
              on a chip to remove them. At least one installer must be selected to continue.
            </p>
          </li>

          {/* Step 7 */}
          <li className="space-y-1">
            <p className="font-semibold">Step 7 — Financial Setup</p>
            <p className="text-sm text-muted-foreground">
              Configure the deposit and payment terms:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-1">
              <li>
                <strong>Deposit Amount</strong> — must meet or exceed the minimum deposit configured
                in Settings (default ₱500)
              </li>
              <li>
                <strong>Payment Terms</strong> — net days until the final invoice is due
              </li>
            </ul>
          </li>

          {/* Step 8 */}
          <li className="space-y-1">
            <p className="font-semibold">Step 8 — Review &amp; Submit</p>
            <p className="text-sm text-muted-foreground">
              A read-only summary of all entered data is displayed. Review every field before
              submitting. Once submitted, the project moves to <strong>Procurement</strong> and the
              Intake Wizard becomes read-only.
            </p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-2">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Submitting intake is irreversible. Double-check the tier,
                installer list, and venue config before clicking <em>Submit</em>.
              </p>
            </div>
          </li>
        </ol>
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
