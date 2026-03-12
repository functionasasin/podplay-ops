import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export function OperationsGuide() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10 print:p-0 print:max-w-none">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">PodPlay Operations Guide</h1>
          <p className="text-muted-foreground text-lg">Complete deployment operations manual</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="guide-print-button shrink-0 gap-2"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          Print Guide
        </Button>
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
          <li>
            <a href="#inventory" className="text-primary hover:underline">
              Inventory Management
            </a>
          </li>
          <li>
            <a href="#settings" className="text-primary hover:underline">
              Settings
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

      {/* Section: Procurement & Hardware Ordering */}
      <section id="procurement" className="space-y-4 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Procurement &amp; Hardware Ordering</h2>
        <p>
          Once intake is submitted, the project enters <strong>Procurement</strong>. This phase
          covers everything from reviewing the auto-generated Bill of Materials to receiving hardware
          into inventory and advancing the project to deployment.
        </p>

        <h3 className="text-lg font-semibold mt-4">Procurement Overview</h3>
        <p className="text-sm text-muted-foreground">
          Procurement is driven by the project's service tier and venue configuration. The system
          auto-generates a Bill of Materials (BOM) when intake completes. Your job is to verify the
          BOM, raise purchase orders against it, receive the goods, and confirm stock levels before
          the project can advance to deployment.
        </p>

        <h3 className="text-lg font-semibold mt-6">BOM Review</h3>
        <p className="text-sm text-muted-foreground">
          Open the project and navigate to <strong>Procurement → BOM</strong>. The BOM lists every
          hardware SKU required for the deployment, the quantity needed, and the current inventory
          allocation.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            <strong>Swap SKUs</strong> — click the SKU name to open the item picker. Choose a
            substitute from the hardware catalog. The unit cost updates automatically.
          </li>
          <li>
            <strong>Adjust quantities</strong> — edit the quantity field directly. Changes are
            saved immediately and reflected in the cost summary at the bottom of the BOM.
          </li>
          <li>
            <strong>Cost summary</strong> — total hardware cost is computed from BOM quantities ×
            unit costs and feeds into the Financial Close invoices.
          </li>
        </ul>
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-4 mt-3">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Tip</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Use <strong>Export PDF</strong> on the BOM tab to generate a vendor-ready hardware list.
            Send the PDF directly to your supplier to get a quote before raising a formal PO.
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">Creating Purchase Orders</h3>
        <p className="text-sm text-muted-foreground">
          Navigate to <strong>Procurement → Purchase Orders</strong> and click{' '}
          <strong>New PO</strong>. A PO is linked to a vendor and contains one or more line items
          drawn from the BOM.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>Select the vendor from the dropdown (add vendors in Settings → Vendors).</li>
          <li>Add line items: SKU, description, quantity, and unit cost.</li>
          <li>
            The PO total is calculated automatically. Review before saving — the PO is sent to the
            vendor in PDF format.
          </li>
          <li>
            After saving, the system increments <em>qty_on_order</em> in inventory for each SKU on
            the PO and sets the order status to <em>Ordered</em>.
          </li>
        </ul>
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-4 mt-3">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Tip</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Click <strong>Export PDF</strong> on any saved PO to download a formatted purchase order
            document. Share this PDF with the vendor to confirm the order.
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">Receiving Inventory</h3>
        <p className="text-sm text-muted-foreground">
          When goods arrive, go to <strong>Procurement → Purchase Orders</strong>, open the
          relevant PO, and click <strong>Receive</strong>.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            Enter the quantity received for each line item. You can receive a partial shipment —
            leave the remaining quantity for a future receiving event.
          </li>
          <li>
            <strong>Full receive</strong> — all quantities match the PO; order status moves to{' '}
            <em>Received</em>.
          </li>
          <li>
            <strong>Partial receive</strong> — some items still outstanding; order status moves to{' '}
            <em>Partial</em>. Receive the remainder when the follow-up shipment arrives.
          </li>
          <li>
            Received quantities are added to <em>qty_on_hand</em> in Inventory and deducted from{' '}
            <em>qty_on_order</em> automatically.
          </li>
        </ul>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Never skip the receiving step. Inventory counts are used to
            validate stock before deployment advances, and inaccurate on-hand quantities will block
            the advance gate.
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">Packing List</h3>
        <p className="text-sm text-muted-foreground">
          Navigate to <strong>Procurement → Packing List</strong>. The packing list shows every
          item that will ship to the project site, derived from the BOM.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            Review the list to confirm quantities and SKUs match what is physically on hand before
            staging the shipment.
          </li>
          <li>
            Click <strong>Export PDF</strong> to generate a printable packing slip to include in the
            shipment box for the on-site installer.
          </li>
        </ul>
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-4 mt-3">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Tip</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Print the packing list PDF and tape a copy to the outside of the shipping carton. This
            lets the installer verify contents without opening every box.
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">Inventory Check</h3>
        <p className="text-sm text-muted-foreground">
          Before advancing to deployment, confirm that all required SKUs are in stock. Navigate to{' '}
          <strong>Inventory</strong> from the main navigation.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            The <strong>Available</strong> column shows projected stock: on-hand − allocated +
            on-order.
          </li>
          <li>
            The <strong>Status</strong> badge (Not Ordered / Ordered / Partial / Received) reflects
            the current order state for each SKU.
          </li>
          <li>
            If a SKU shows insufficient available quantity, raise a new PO or use{' '}
            <strong>Set On-Order</strong> to manually record an expected incoming shipment.
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">Advancing to Deployment</h3>
        <p className="text-sm text-muted-foreground">
          When all BOM items are accounted for and inventory is confirmed, navigate to{' '}
          <strong>Procurement → BOM</strong> (or the last procurement tab) and click{' '}
          <strong>Advance to Deployment</strong>.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>A confirmation dialog shows the project name and service tier — verify before confirming.</li>
          <li>
            After advancing, the project status moves to <em>deployment</em> and the Deployment
            wizard unlocks.
          </li>
          <li>Procurement becomes read-only once the project has been advanced.</li>
        </ul>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Advancing to deployment is a one-way action. Ensure all POs are
            received and inventory is correct before clicking Advance.
          </p>
        </div>
      </section>

      {/* Section: Deployment */}
      <section id="deployment" className="space-y-4 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Deployment</h2>
        <p>
          Once procurement is advanced, the project enters <strong>Deployment</strong>. This is the
          most hands-on phase — technicians work through a 16-phase checklist that covers
          office pre-configuration, hardware setup, on-site physical installation, and
          final verification before advancing to financial close.
        </p>

        <h3 className="text-lg font-semibold mt-4">Deployment Overview</h3>
        <p className="text-sm text-muted-foreground">
          The deployment checklist is auto-generated for each project based on service tier and
          venue configuration. Every phase contains numbered steps; each step must be checked off
          before the overall progress bar advances. The <strong>Advance to Financial Close</strong>{' '}
          button is locked until all checklist items across all phases are complete.
        </p>
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-4 mt-2">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Tip</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Use the phase navigator at the top of the Deployment page to jump between phases. The
            overall progress bar at the top shows completed steps across all phases.
          </p>
        </div>

        {/* Group 1 */}
        <h3 className="text-lg font-semibold mt-6">Phases 1–3: Infrastructure Preparation</h3>
        <p className="text-sm text-muted-foreground">
          These phases happen at the office before anything ships to the customer site.
        </p>

        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 1 — Pre-Purchase &amp; Planning</p>
            <p className="text-sm text-muted-foreground">
              Confirm the project scope: verify court count, ISP, and tier match the signed
              agreement. Cross-check the BOM against what is physically staged in the warehouse.
              Identify any substitute SKUs required and update the BOM before proceeding.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Verify BOM quantities against purchase order receipts</li>
              <li>Confirm installer assignment and on-site availability</li>
              <li>Record DDNS subdomain, UniFi site name, and Mac Mini username</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 2 — Pre-Configuration (Office)</p>
            <p className="text-sm text-muted-foreground">
              All devices are configured at the office before shipping. This reduces on-site work
              and troubleshooting time.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Flash firmware on switches and access points to required versions</li>
              <li>Stage UniFi controller with the correct site name</li>
              <li>Pre-load Replay software on the Mac Mini</li>
              <li>Configure ISP router with agreed method (Static IP / DMZ / Port Forward)</li>
            </ul>
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-2">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> The ISP configuration method (Static IP, DMZ, or Port
                Forward) must be set in the deployment wizard before Phase 6 steps are visible. Set
                it during Phase 2 planning so checklist steps populate correctly.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 3 — Unboxing &amp; Labeling</p>
            <p className="text-sm text-muted-foreground">
              All hardware is unboxed, inspected, and labeled before it is packed for shipping.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Verify serial numbers against the BOM</li>
              <li>Label every device with project name and court number</li>
              <li>Document any damaged or missing items — raise a new PO if needed</li>
            </ul>
          </div>
        </div>

        {/* Group 2 */}
        <h3 className="text-lg font-semibold mt-6">Phases 4–6: Network &amp; Hardware Installation</h3>
        <p className="text-sm text-muted-foreground">
          Core networking infrastructure is assembled and connected. These phases are done in the
          office rack before the equipment ships.
        </p>

        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 4 — Network Rack Assembly</p>
            <p className="text-sm text-muted-foreground">
              Mount all rack-mounted equipment: switch, patch panel, UPS, and cable management.
              Label every port. Run and dress all copper patch cables.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Follow rack elevation diagram for unit placement</li>
              <li>Test continuity on every run before closing the rack</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 5 — Networking Setup (UniFi)</p>
            <p className="text-sm text-muted-foreground">
              Adopt all UniFi devices into the site. Configure VLANs per the architecture diagram
              shown in the wizard (visible in Phase 5 on the Deployment page). The VLAN reference
              panel adjusts per tier (Pro vs Autonomous).
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>VLAN 10: Management</li>
              <li>VLAN 20: PodPlay services (Mac Mini, iPads, Apple TVs)</li>
              <li>VLAN 30: Guest / customer Wi-Fi</li>
              <li>VLAN 40: Cameras (isolated)</li>
              <li>Verify inter-VLAN routing rules match tier spec</li>
            </ul>
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-3 mt-2">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> The VLAN reference panel in the wizard is read-only. Use it as
                a quick reference while configuring the UniFi controller — no need to switch tabs.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 6 — ISP Router Configuration</p>
            <p className="text-sm text-muted-foreground">
              Configure the ISP-provided router using the method selected during planning. The
              deployment wizard shows only the steps relevant to the chosen method.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>
                <strong>Static IP</strong> — assign a fixed public IP to the WAN port of the UniFi
                gateway
              </li>
              <li>
                <strong>DMZ</strong> — place the UniFi gateway IP in the router's DMZ zone
              </li>
              <li>
                <strong>Port Forward</strong> — forward required ports (443, 8080, RTMP) to the
                gateway
              </li>
            </ul>
          </div>
        </div>

        {/* Group 3 */}
        <h3 className="text-lg font-semibold mt-6">Phases 7–9: Software Configuration &amp; Testing</h3>
        <p className="text-sm text-muted-foreground">
          Software-layer setup: cameras, dynamic DNS, and the core Mac Mini server.
        </p>

        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 7 — Camera Configuration</p>
            <p className="text-sm text-muted-foreground">
              Adopt cameras into UniFi Protect or the standalone NVR. Assign each camera to its
              court and label it in the system.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Place cameras on VLAN 40 (isolated camera network)</li>
              <li>Verify recording is active and streams are accessible</li>
              <li>Test motion detection settings per court</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 8 — DDNS Setup (FreeDNS)</p>
            <p className="text-sm text-muted-foreground">
              Register the project's DDNS subdomain on FreeDNS and configure the UniFi gateway to
              auto-update the record. The subdomain is set during intake and is shown in the
              checklist steps.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Verify the subdomain resolves to the current public IP</li>
              <li>Confirm the dynamic update client is running and persists through reboots</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 9 — Mac Mini Setup</p>
            <p className="text-sm text-muted-foreground">
              The Mac Mini runs the Replay service. Configure macOS, network settings, and the
              Replay daemon.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Set static IP on VLAN 20</li>
              <li>Enable SSH and configure the Mac Mini username recorded during intake</li>
              <li>Install and activate the Replay service (version selected in Phase 10)</li>
              <li>Verify Replay can reach camera streams via the NVR</li>
            </ul>
          </div>
        </div>

        {/* Group 4 */}
        <h3 className="text-lg font-semibold mt-6">Phases 10–12: Quality Assurance &amp; Training</h3>
        <p className="text-sm text-muted-foreground">
          End-user devices are configured and tested. Replay service is validated end-to-end.
        </p>

        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 10 — Replay Service Deployment</p>
            <p className="text-sm text-muted-foreground">
              Select the Replay service version (V1 or V2) in the deployment wizard — the checklist
              steps update to match. Deploy the selected version to the Mac Mini and run the
              built-in self-test.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Confirm clip generation is working for each court</li>
              <li>Verify clips are accessible from the customer-facing URL</li>
            </ul>
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-3 mt-2">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> Set the Replay service version before starting Phase 10
                checklist items. Switching versions after items are checked will not reset
                completed steps.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 11 — iPad Setup</p>
            <p className="text-sm text-muted-foreground">
              Set up iPads with the PodPlay booking app. One iPad per court is standard.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Connect each iPad to VLAN 20</li>
              <li>Install and configure the PodPlay booking app</li>
              <li>Test court booking and clip playback end-to-end</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 12 — Apple TV Setup</p>
            <p className="text-sm text-muted-foreground">
              Mount Apple TVs at each court and configure them for replay display.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Connect each Apple TV to VLAN 20</li>
              <li>Install and pair the PodPlay display app</li>
              <li>Test clip playback from court iPad to Apple TV display</li>
            </ul>
          </div>
        </div>

        {/* Group 5 */}
        <h3 className="text-lg font-semibold mt-6">Phases 13–16: Packaging, Installation &amp; Sign-off</h3>
        <p className="text-sm text-muted-foreground">
          Equipment is packed for shipping, installed on site, and the customer accepts the system.
        </p>

        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 13 — Packaging &amp; Shipping</p>
            <p className="text-sm text-muted-foreground">
              Pack all hardware using the packing list generated in Procurement. Label cartons and
              arrange logistics with the installer.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Cross-check physical items against the Packing List PDF</li>
              <li>Include printed packing list inside and taped to the outside of each carton</li>
              <li>Confirm delivery date with the installer and customer</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 14 — Physical Installation (On-site)</p>
            <p className="text-sm text-muted-foreground">
              On-site installation of all hardware by the assigned installer team.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Mount and cable rack, cameras, access points, and displays per site plan</li>
              <li>Power up all devices and verify adoption in UniFi and Replay</li>
              <li>
                <strong>App Lock:</strong> A warning banner appears in Phase 14 — the Flic button
                pairing step requires temporarily disabling Guided Access on iPads. Re-enable after
                pairing.
              </li>
            </ul>
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-2">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Re-enable Guided Access (App Lock) on all iPads after the
                Flic button is paired. This is a common step that gets missed during physical
                installation.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 15 — Testing &amp; Verification (On-site)</p>
            <p className="text-sm text-muted-foreground">
              Full end-to-end system test with the customer present.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Book a test session on each court using the iPad</li>
              <li>Verify clip appears on the Apple TV within the expected time</li>
              <li>Test door locks, access control, and camera recording for every court</li>
              <li>Walk the customer through the booking flow</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-sm">Phase 16 — Health Monitoring Setup</p>
            <p className="text-sm text-muted-foreground">
              Configure remote monitoring so the operations team can detect issues proactively.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-1">
              <li>Enable UniFi remote monitoring and confirm the site appears in the controller</li>
              <li>Set up uptime alerts for the Mac Mini and camera NVR</li>
              <li>Verify DDNS auto-update is still resolving correctly after on-site config</li>
            </ul>
          </div>
        </div>

        {/* Troubleshooting */}
        <h3 className="text-lg font-semibold mt-6">Troubleshooting Common Deployment Issues</h3>
        <div className="space-y-3 mt-2">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-sm font-semibold">Checklist steps not populating</p>
            <p className="text-sm text-muted-foreground">
              Deployment checklist items are seeded when the project advances from procurement. If
              a phase shows an empty checklist, the database seed may have failed during the status
              transition. Contact the technical team to re-trigger the seed migration for the
              project.
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-sm font-semibold">ISP configuration method not set — Phase 6 steps missing</p>
            <p className="text-sm text-muted-foreground">
              Navigate to Phase 6 in the deployment wizard and select the ISP configuration method
              (Static IP, DMZ, or Port Forward) using the method picker panel. The relevant
              checklist steps will appear immediately after selection.
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-sm font-semibold">Advance to Financial Close button is disabled</p>
            <p className="text-sm text-muted-foreground">
              The button remains disabled until every checklist item across all deployment phases
              is checked. Review each phase for unchecked items using the phase navigator. The
              progress bar shows the overall completion percentage.
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-sm font-semibold">DDNS subdomain not resolving</p>
            <p className="text-sm text-muted-foreground">
              Confirm the dynamic update client is running on the UniFi gateway. DNS propagation
              can take up to 5 minutes after the public IP changes. If the subdomain still does not
              resolve, log in to FreeDNS and manually verify the A record matches the current
              public IP.
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-sm font-semibold">Replay clips not appearing on Apple TV</p>
            <p className="text-sm text-muted-foreground">
              Verify the Mac Mini and Apple TV are on the same VLAN (VLAN 20). Confirm the Replay
              service is running on the Mac Mini using SSH. Check that the court number assigned in
              the Replay config matches the iPad configuration for that court.
            </p>
          </div>
        </div>

        {/* Advancing to Financial Close */}
        <h3 className="text-lg font-semibold mt-6">Advancing to Financial Close</h3>
        <p className="text-sm text-muted-foreground">
          When all 16 deployment phases are complete and every checklist item is checked, navigate
          to the last phase and click <strong>Advance to Financial Close</strong>.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            A confirmation dialog shows the project name — verify you are advancing the correct
            project before confirming.
          </li>
          <li>
            After advancing, the project status changes to <em>Financial Close</em> and you are
            redirected to the Financials page.
          </li>
          <li>The Deployment wizard becomes read-only after advancement.</li>
        </ul>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Advancing to Financial Close is irreversible. Ensure on-site
            testing is complete and the customer has accepted the system before clicking Advance.
          </p>
        </div>
      </section>

      {/* Section: Financial Close */}
      <section id="financial-close" className="space-y-4 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Financial Close</h2>
        <p>
          After all deployment phases are complete, the project enters <strong>Financial Close</strong>.
          This phase covers deposit invoicing, expense reconciliation, final invoicing, and formally
          closing the project's books.
        </p>

        <h3 className="text-lg font-semibold mt-4">Financial Close Overview</h3>
        <p className="text-sm text-muted-foreground">
          The Financials wizard has four tabs: <strong>Deposit</strong>, <strong>Expenses</strong>,{' '}
          <strong>Invoice</strong>, and <strong>Summary</strong>. Work through them in order —
          the deposit must be recorded before expenses are entered, and the final invoice is
          generated from the combined totals.
        </p>

        <h3 className="text-lg font-semibold mt-6">Deposit Invoice</h3>
        <p className="text-sm text-muted-foreground">
          Navigate to <strong>Financials → Deposit</strong>. The deposit amount and payment terms
          were set during intake. Review them and issue the deposit invoice.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            The deposit amount must meet or exceed the minimum deposit configured in Settings
            (default ₱500). If the entered amount is below the minimum, the form will display a
            validation error: <em>"Minimum deposit is ₱[amount]"</em>.
          </li>
          <li>
            Click <strong>Issue Deposit Invoice</strong> to record the deposit. The invoice date,
            amount, and customer details are captured at this point.
          </li>
          <li>
            Click <strong>Export PDF</strong> to download the formatted deposit invoice to send
            to the customer.
          </li>
        </ul>
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-4 mt-3">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Tip</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Issue the deposit invoice as early as possible in the financial close phase. Customers
            often need the PDF invoice to initiate payment from their accounts department.
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">Expense Tracking</h3>
        <p className="text-sm text-muted-foreground">
          Navigate to <strong>Financials → Expenses</strong>. Record all project costs beyond the
          hardware BOM — labour, travel, consumables, and any additional charges.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>Click <strong>Add Expense</strong> to open the expense form.</li>
          <li>
            Enter the expense category, description, amount, and date. Common categories include
            Installer Labour, Transport, Consumables, and Miscellaneous.
          </li>
          <li>
            The running total updates immediately. All expenses feed into the P&amp;L summary on the
            Summary tab.
          </li>
          <li>
            To edit or delete an expense, click the row to open the edit form or use the delete
            (trash) icon.
          </li>
        </ul>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Hardware costs are pulled automatically from the BOM — do not
            re-enter them as manual expenses. Only add expenses that are not already captured in
            procurement.
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">Final Invoicing</h3>
        <p className="text-sm text-muted-foreground">
          Navigate to <strong>Financials → Invoice</strong>. The final invoice is calculated from
          the total hardware cost (BOM) plus any additional expenses, minus the deposit already paid.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            Review the invoice line items: hardware total, additional expenses, deposit credit, and
            balance due.
          </li>
          <li>
            Adjust the payment due date if needed (defaults to the payment terms set during intake).
          </li>
          <li>
            Click <strong>Issue Final Invoice</strong> to lock the invoice and record it.
          </li>
          <li>
            Click <strong>Export PDF</strong> to download the formatted final invoice.
          </li>
        </ul>
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-4 mt-3">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Tip</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Double-check the deposit credit line before issuing the final invoice. The system
            carries forward the deposit amount automatically, but verify it matches the deposit
            invoice that was sent earlier.
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">P&amp;L Summary</h3>
        <p className="text-sm text-muted-foreground">
          Navigate to <strong>Financials → Summary</strong>. The summary view shows a complete
          profit and loss breakdown for the project.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            <strong>Revenue</strong> — the final invoice amount (hardware + expenses charged to
            customer).
          </li>
          <li>
            <strong>Cost of Goods</strong> — hardware BOM total at unit cost.
          </li>
          <li>
            <strong>Operating Expenses</strong> — labour, transport, and other costs entered in the
            Expenses tab.
          </li>
          <li>
            <strong>Gross Margin</strong> — revenue minus cost of goods.
          </li>
          <li>
            <strong>Net Profit</strong> — gross margin minus operating expenses.
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">Recurring Fees</h3>
        <p className="text-sm text-muted-foreground">
          After financial close, the project may generate recurring monthly fees (e.g., SaaS
          subscription, support plan). These are tracked separately from the one-time project P&amp;L.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>Recurring fee amounts are tied to the service tier selected during intake.</li>
          <li>
            The Summary tab displays the monthly recurring amount for reference when communicating
            with the customer about ongoing charges.
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">Project Close</h3>
        <p className="text-sm text-muted-foreground">
          Once the final invoice is issued and the P&amp;L is reviewed, mark the project as closed
          by clicking <strong>Close Project</strong> at the bottom of the Summary tab.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>A confirmation dialog shows the project name and final totals — verify before confirming.</li>
          <li>
            Closed projects move to <em>Completed</em> status on the dashboard and are no longer
            editable.
          </li>
          <li>All invoices, expenses, and the P&amp;L summary remain accessible in read-only mode.</li>
        </ul>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Closing a project is irreversible. Confirm all invoices have been
            sent and all expenses have been recorded before closing.
          </p>
        </div>
      </section>

      {/* Section: Inventory Management */}
      <section id="inventory" className="space-y-4 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Inventory Management</h2>
        <p>
          The <strong>Inventory</strong> page (accessible from the main navigation) gives a
          real-time view of all hardware stock — how much is on hand, how much is on order, and
          how much is available to allocate to new projects.
        </p>

        <h3 className="text-lg font-semibold mt-4">Stock Tracking</h3>
        <p className="text-sm text-muted-foreground">
          The inventory table shows one row per hardware SKU. Key columns:
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            <strong>SKU / Name</strong> — the hardware catalog item name and identifier.
          </li>
          <li>
            <strong>On Hand</strong> — physical quantity currently in the warehouse, updated
            automatically when POs are received.
          </li>
          <li>
            <strong>Allocated</strong> — quantity reserved for active projects in procurement or
            deployment phases.
          </li>
          <li>
            <strong>On Order</strong> — quantity ordered from vendors but not yet received.
          </li>
          <li>
            <strong>Available</strong> — projected available stock: <em>on_hand − allocated + on_order</em>.
            This is the number you can count on having for a new project.
          </li>
          <li>
            <strong>Status</strong> — badge showing the current order state: Not Ordered, Ordered,
            Partial (partially received), or Received.
          </li>
        </ul>
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-4 mt-3">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Tip</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Check the <strong>Available</strong> column (not just On Hand) before committing to a
            new project. Available accounts for stock already reserved by other active projects and
            incoming orders.
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">On-Order Quantities</h3>
        <p className="text-sm text-muted-foreground">
          On-order tracking is automatic when purchase orders are raised and received through the
          Procurement workflow:
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            When a PO is created, <em>qty_on_order</em> increments for each SKU on the PO and the
            order status moves to <em>Ordered</em>.
          </li>
          <li>
            When items are fully received, <em>qty_on_order</em> decrements to zero and status moves
            to <em>Received</em>.
          </li>
          <li>
            When items are partially received, <em>qty_on_order</em> decrements by the received
            quantity and status moves to <em>Partial</em>.
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">Manual On-Order Adjustments</h3>
        <p className="text-sm text-muted-foreground">
          For orders placed outside the app (e.g., a direct phone order to a vendor), you can
          manually set the on-order quantity using the <strong>Set On-Order</strong> button on each
          inventory row.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            Click <strong>Set On-Order</strong> on the row for the relevant SKU. A modal opens
            showing the current on-order quantity.
          </li>
          <li>
            Enter the new quantity and an optional note (e.g., "Verbal order to Vendor X, 2026-03-12").
          </li>
          <li>
            Setting the quantity to 0 resets the order status to <em>Not Ordered</em>. Any value
            above 0 sets status to <em>Ordered</em>.
          </li>
        </ul>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Manual on-order entries do not create a purchase order record.
            When the goods arrive, receive them through a PO in Procurement so that{' '}
            <em>qty_on_hand</em> is updated correctly. Alternatively, use Set On-Order to set the
            quantity back to 0 after receiving.
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">Movement History</h3>
        <p className="text-sm text-muted-foreground">
          Every change to inventory quantities is recorded as a movement event. To view the history
          for a SKU, click the SKU name to open the detail panel.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            Movement events include: PO received (quantity in), project allocated (quantity
            reserved), manual adjustment, and order placed.
          </li>
          <li>
            Each event shows the date, quantity delta, resulting balance, and the user who made the
            change.
          </li>
          <li>
            Use the movement history to investigate discrepancies between the system quantity and
            a physical count.
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">Common Inventory Workflows</h3>
        <div className="space-y-3 mt-2">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-sm font-semibold">Checking stock before accepting a new project</p>
            <p className="text-sm text-muted-foreground">
              Open Inventory and filter by the hardware SKUs in the expected BOM for the tier. Check
              the <strong>Available</strong> column. If any SKU shows 0 or negative, raise a PO
              before committing to a project start date.
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-sm font-semibold">Correcting a stock discrepancy after a physical count</p>
            <p className="text-sm text-muted-foreground">
              Use <strong>Set On-Order</strong> to zero out phantom on-order quantities, then contact
              the technical team to adjust the on-hand balance via a corrective migration if the
              physical count differs from <em>qty_on_hand</em> in the system.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Settings */}
      <section id="settings" className="space-y-4 scroll-mt-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Settings</h2>
        <p>
          Settings (accessible from the main navigation) is where you configure the master data
          that drives all project workflows: team contacts, installers, vendors, pricing, and the
          hardware catalog.
        </p>

        <h3 className="text-lg font-semibold mt-4">Team Contacts</h3>
        <p className="text-sm text-muted-foreground">
          Navigate to <strong>Settings → Team</strong>. Team contacts are internal staff members
          whose details appear in generated documents (invoices, packing lists).
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>Click <strong>Add Contact</strong> to create a new team member record.</li>
          <li>
            Fields: full name, role, email address, and phone number.
          </li>
          <li>
            The primary contact appears in the <em>From</em> field on all outgoing PDF documents.
          </li>
          <li>
            To edit or remove a contact, use the edit (pencil) or delete (trash) icons on the row.
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">Installers</h3>
        <p className="text-sm text-muted-foreground">
          Navigate to <strong>Settings → Installers</strong>. Installers are the technicians
          available for assignment during the Intake Wizard.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>Click <strong>Add Installer</strong> to create a new installer record.</li>
          <li>Fields: full name, contact number, and region/area of operation.</li>
          <li>
            Installers added here appear in the multi-select dropdown on the Installer Assignment
            step of the Intake Wizard.
          </li>
          <li>
            Deactivating an installer (rather than deleting) preserves their name on historical
            project records.
          </li>
        </ul>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> At least one active installer must exist before an intake can be
            submitted. Add installers here before starting new projects.
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">Vendors</h3>
        <p className="text-sm text-muted-foreground">
          Navigate to <strong>Settings → Vendors</strong>. Vendors are the suppliers from whom
          hardware is purchased. They appear in the vendor dropdown when creating a Purchase Order.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>Click <strong>Add Vendor</strong> to create a new vendor record.</li>
          <li>
            Fields: vendor name, contact person, email, phone, and address (used on PDF purchase
            orders).
          </li>
          <li>
            To edit vendor details, click the row or the edit icon. Changes are reflected
            immediately on new POs — existing POs retain the vendor details captured at the time
            of creation.
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-6">Pricing Tiers &amp; Minimum Deposit</h3>
        <p className="text-sm text-muted-foreground">
          Navigate to <strong>Settings → Pricing</strong>. Pricing settings control the service
          tier rates and the deposit floor enforced in the Financials wizard.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            <strong>Tier Rates</strong> — configure the monthly recurring fee for each service tier
            (Pro, Autonomous, Autonomous+). These rates feed into the Financials Summary tab.
          </li>
          <li>
            <strong>Minimum Deposit</strong> — the floor amount for the deposit invoice. If an
            operator enters a deposit amount below this value in the Financials wizard, the form
            will reject it with a validation error. Default is ₱500.
          </li>
          <li>
            <strong>Cost Chain Rates</strong> — additional multipliers that affect the overall
            project pricing calculation (e.g., margin, labour rate).
          </li>
        </ul>
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-4 mt-3">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Tip</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Update the <strong>Minimum Deposit</strong> here before starting new projects if the
            company's deposit policy changes. The new minimum takes effect immediately on all
            projects that have not yet issued a deposit invoice.
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">Hardware Catalog</h3>
        <p className="text-sm text-muted-foreground">
          Navigate to <strong>Settings → Catalog</strong>. The hardware catalog is the master list
          of all hardware SKUs available for BOM generation and purchase orders.
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
          <li>
            Click <strong>Add Item</strong> to add a new hardware SKU. Fields: SKU code, name,
            category, unit cost, and whether the item is active.
          </li>
          <li>
            To update a unit cost (e.g., price increase from supplier), click the edit icon on the
            row and update the <em>Unit Cost</em> field. New BOM calculations will use the updated
            price. Existing saved BOMs are not retroactively changed.
          </li>
          <li>
            Deactivating a catalog item prevents it from appearing in new BOM generations while
            preserving historical records.
          </li>
          <li>
            The catalog item name and unit cost are used in the BOM tab, purchase orders, packing
            lists, and financial summaries.
          </li>
        </ul>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Do not delete catalog items that are referenced by existing
            projects — deactivate them instead. Deletion will cause missing SKU references in
            historical BOMs and purchase orders.
          </p>
        </div>
      </section>
    </div>
  );
}
