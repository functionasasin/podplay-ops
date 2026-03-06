# PodPlay Ops Wizard — Stage 1: Intake Wizard

**Aspect**: design-wizard-intake
**Wave**: 4 — Full-Stack Product Design
**Date**: 2026-03-06
**Route**: `/projects/$projectId/intake`
**Route file**: `src/routes/_auth/projects/$projectId/intake/index.tsx`
**Component file**: `src/components/wizard/intake/IntakeWizard.tsx`
**Schema reference**: `final-mega-spec/data-model/schema.md` — `projects`, `replay_signs`, `cc_terminals`, `project_bom_items`, `deployment_checklist_items`
**Logic reference**: `final-mega-spec/business-logic/customer-onboarding.md`, `bom-generation.md`, `cost-analysis.md`, `isp-validation.md`

---

## Overview

The Intake Wizard is Stage 1 of the project lifecycle. It collects all project parameters needed to generate the BOM, seed the deployment checklist, calculate pricing, and produce a Statement of Work. It is a 6-step multi-step form rendered within the Project Shell layout.

**Two modes**:
1. **Create mode** — The wizard starts at Step 1 for a newly-created project (project row exists from `/projects/new` with empty fields, `project_status = 'intake'`). Submitting Step 6 writes all fields and triggers BOM/checklist generation.
2. **View/Edit mode** — Returning to the intake route for an existing project shows a read-only summary of filled data with an "Edit" button that re-opens the form in edit mode.

---

## Route Configuration

**File**: `src/routes/_auth/projects/$projectId/intake/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { getProject } from '@/services/projects'
import { getInstallers } from '@/services/installers'
import { getSettings } from '@/services/settings'
import { getBomItems } from '@/services/bom'
import { IntakeWizard } from '@/components/wizard/intake/IntakeWizard'

export const Route = createFileRoute('/_auth/projects/$projectId/intake/')({
  loader: async ({ params }) => {
    const [project, installers, settings, bomItems] = await Promise.all([
      getProject(params.projectId),
      getInstallers(),
      getSettings(),
      getBomItems(params.projectId),
    ])
    return { project, installers, settings, bomItems }
  },
  component: IntakeWizard,
  pendingComponent: IntakeSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
      <p className="text-destructive font-medium">Failed to load intake</p>
      <p className="text-muted-foreground text-sm mt-1">{error.message}</p>
      <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>
  ),
})
```

---

## Service Layer

**File**: `src/services/projects.ts`

### Types

```typescript
// Full project row (all columns)
export interface Project {
  id: string
  created_at: string
  updated_at: string
  // Customer & venue
  customer_name: string
  venue_name: string
  venue_address_line1: string | null
  venue_address_line2: string | null
  venue_city: string
  venue_state: string
  venue_country: string
  venue_zip: string | null
  contact_name: string
  contact_email: string
  contact_phone: string | null
  // Configuration
  tier: 'pro' | 'autonomous' | 'autonomous_plus' | 'pbk'
  court_count: number
  door_count: number
  security_camera_count: number
  replay_sign_count: number    // GENERATED: court_count * 2
  has_nvr: boolean
  has_pingpod_wifi: boolean
  has_front_desk: boolean
  // ISP & networking
  isp_provider: string | null
  isp_type: 'fiber' | 'cable' | 'dedicated' | 'other' | null
  has_static_ip: boolean
  has_backup_isp: boolean
  internet_download_mbps: number | null
  internet_upload_mbps: number | null
  starlink_warning_acknowledged: boolean
  rack_size_u: number | null
  // Deployment infrastructure
  ddns_subdomain: string | null
  unifi_site_name: string | null
  mac_mini_username: string | null
  mac_mini_password: string | null
  location_id: string | null
  replay_api_url: string | null
  replay_local_url: string
  replay_service_version: 'v1' | 'v2'
  // Lifecycle
  project_status: 'intake' | 'procurement' | 'deployment' | 'financial_close' | 'completed' | 'cancelled'
  deployment_status: 'not_started' | 'config' | 'ready_to_ship' | 'shipped' | 'installing' | 'qc' | 'completed'
  revenue_stage: 'proposal' | 'signed' | 'deposit_invoiced' | 'deposit_paid' | 'final_invoiced' | 'final_paid'
  installer_id: string | null
  installer_type: 'podplay_vetted' | 'client_own' | null
  kickoff_call_date: string | null     // ISO date
  signed_date: string | null
  installation_start_date: string | null
  installation_end_date: string | null
  go_live_date: string | null
  notes: string | null
  internal_notes: string | null
}

// Intake form values — all 5 data steps combined
export interface IntakeFormValues {
  // Step 1: Customer & venue
  customer_name: string
  venue_name: string
  venue_address_line1: string
  venue_address_line2: string
  venue_city: string
  venue_state: string
  venue_zip: string
  venue_country: 'US' | 'PH'
  contact_name: string
  contact_email: string
  contact_phone: string
  // Step 2: Service configuration
  tier: 'pro' | 'autonomous' | 'autonomous_plus' | 'pbk'
  court_count: number
  door_count: number
  security_camera_count: number
  has_pingpod_wifi: boolean
  has_front_desk: boolean
  replay_service_version: 'v1' | 'v2'
  // Step 3: ISP & networking
  isp_provider: string
  isp_type: 'fiber' | 'cable' | 'dedicated' | 'other' | ''
  has_static_ip: boolean
  has_backup_isp: boolean
  internet_download_mbps: number | ''
  internet_upload_mbps: number | ''
  starlink_warning_acknowledged: boolean
  rack_size_u: number | ''
  // Step 4: Installation details
  installer_id: string
  installer_type: 'podplay_vetted' | 'client_own' | ''
  kickoff_call_date: string
  signed_date: string
  installation_start_date: string
  installation_end_date: string
  notes: string
  internal_notes: string
  // Step 5: Credentials
  ddns_subdomain: string
  unifi_site_name: string
  mac_mini_username: string
  mac_mini_password: string
  location_id: string
}
```

### Service Functions

**File**: `src/services/projects.ts`

```typescript
// Load single project (used in route loader + intake wizard)
export async function getProject(projectId: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  if (error) throw error
  return data
}

// Submit intake form — update project + trigger BOM/checklist generation
export async function submitIntakeForm(
  projectId: string,
  values: IntakeFormValues
): Promise<void> {
  // 1. Update projects row with all intake values
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      customer_name: values.customer_name.trim(),
      venue_name: values.venue_name.trim(),
      venue_address_line1: values.venue_address_line1 || null,
      venue_address_line2: values.venue_address_line2 || null,
      venue_city: values.venue_city.trim(),
      venue_state: values.venue_state.trim(),
      venue_zip: values.venue_zip || null,
      venue_country: values.venue_country,
      contact_name: values.contact_name.trim(),
      contact_email: values.contact_email.trim().toLowerCase(),
      contact_phone: values.contact_phone || null,
      tier: values.tier,
      court_count: values.court_count,
      door_count: values.door_count,
      security_camera_count: values.security_camera_count,
      has_nvr: values.tier === 'autonomous_plus',
      has_pingpod_wifi: values.has_pingpod_wifi,
      has_front_desk: values.has_front_desk,
      replay_service_version: values.replay_service_version,
      isp_provider: values.isp_provider || null,
      isp_type: values.isp_type || null,
      has_static_ip: values.has_static_ip,
      has_backup_isp: values.has_backup_isp,
      internet_download_mbps: values.internet_download_mbps || null,
      internet_upload_mbps: values.internet_upload_mbps || null,
      starlink_warning_acknowledged: values.starlink_warning_acknowledged,
      rack_size_u: values.rack_size_u || null,
      installer_id: values.installer_id || null,
      installer_type: values.installer_type || null,
      kickoff_call_date: values.kickoff_call_date || null,
      signed_date: values.signed_date || null,
      installation_start_date: values.installation_start_date || null,
      installation_end_date: values.installation_end_date || null,
      notes: values.notes || null,
      internal_notes: values.internal_notes || null,
      ddns_subdomain: values.ddns_subdomain || null,
      unifi_site_name: values.unifi_site_name || null,
      mac_mini_username: values.mac_mini_username || null,
      mac_mini_password: values.mac_mini_password || null,
      location_id: values.location_id || null,
      replay_api_url: values.ddns_subdomain
        ? `http://${values.ddns_subdomain}.podplaydns.com:4000`
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
  if (updateError) throw updateError

  // 2. Generate BOM (from src/services/bom.ts)
  await generateBom(projectId, {
    tier: values.tier,
    court_count: values.court_count,
    door_count: values.door_count,
    security_camera_count: values.security_camera_count,
    has_front_desk: values.has_front_desk,
    has_pingpod_wifi: values.has_pingpod_wifi,
  })

  // 3. Seed deployment checklist (from src/services/deployment.ts)
  await seedDeploymentChecklist(projectId, {
    tier: values.tier,
    replay_service_version: values.replay_service_version,
    customer_name: values.customer_name,
    court_count: values.court_count,
    ddns_subdomain: values.ddns_subdomain || null,
    unifi_site_name: values.unifi_site_name || null,
    mac_mini_username: values.mac_mini_username || null,
    location_id: values.location_id || null,
  })

  // 4. Ensure replay_signs record exists
  await ensureReplaySignRecord(projectId, values.court_count)

  // 5. Ensure CC terminal record if has_front_desk
  if (values.has_front_desk) {
    await ensureFrontDeskRecords(projectId)
  }
}

// Update project fields without regenerating BOM/checklist (edit mode for non-config fields)
export async function updateProjectBasicInfo(
  projectId: string,
  fields: Partial<Project>
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', projectId)
  if (error) throw error
}

// Advance project to next stage
export async function advanceProjectStatus(
  projectId: string,
  newStatus: 'procurement' | 'deployment' | 'financial_close' | 'completed' | 'cancelled'
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ project_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', projectId)
  if (error) throw error
}

// Check uniqueness of customer_name + venue_name combination (for Step 1 warning)
export async function findDuplicateProject(
  customer_name: string,
  venue_name: string,
  excludeProjectId: string
): Promise<{ id: string; customer_name: string; venue_name: string } | null> {
  const { data } = await supabase
    .from('projects')
    .select('id, customer_name, venue_name')
    .ilike('customer_name', customer_name.trim())
    .ilike('venue_name', venue_name.trim())
    .neq('id', excludeProjectId)
    .limit(1)
    .single()
  return data ?? null
}

// Check uniqueness of ddns_subdomain (for Step 5 validation)
export async function checkDdnsSubdomainAvailable(
  subdomain: string,
  excludeProjectId: string
): Promise<{ available: boolean; conflictingProject?: string }> {
  const { data } = await supabase
    .from('projects')
    .select('id, venue_name')
    .eq('ddns_subdomain', subdomain.toLowerCase())
    .neq('id', excludeProjectId)
    .limit(1)
    .single()
  if (data) {
    return { available: false, conflictingProject: data.venue_name }
  }
  return { available: true }
}
```

**File**: `src/services/installers.ts`

```typescript
export interface Installer {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  regions: string[]           // e.g., ['NY', 'NJ', 'CT']
  installer_type: 'podplay_vetted' | 'client_own'
  is_active: boolean
  notes: string | null
}

// Load all active installers
export async function getInstallers(): Promise<Installer[]> {
  const { data, error } = await supabase
    .from('installers')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}

// Filter installers for a venue state (client-side — list is small)
export function filterInstallersByState(
  installers: Installer[],
  venue_state: string
): Installer[] {
  const matching = installers.filter(i => i.regions.includes(venue_state))
  return matching.length > 0 ? matching : installers
}
```

---

## Zod Validation Schemas

**File**: `src/lib/schemas/intake.ts`

```typescript
import { z } from 'zod'

export const step1Schema = z.object({
  customer_name: z.string().min(1, 'Customer name is required').max(200).trim(),
  venue_name: z.string().min(1, 'Venue name is required').max(200).trim(),
  venue_address_line1: z.string().max(200).optional().default(''),
  venue_address_line2: z.string().max(200).optional().default(''),
  venue_city: z.string().min(1, 'City is required').max(100).trim(),
  venue_state: z.string().min(1, 'State is required').max(50).trim(),
  venue_zip: z.string().max(20).optional().default(''),
  venue_country: z.enum(['US', 'PH']).default('US'),
  contact_name: z.string().min(1, 'Contact name is required').max(200).trim(),
  contact_email: z.string().email('Enter a valid email address'),
  contact_phone: z.string().max(50).optional().default(''),
})

export const step2Schema = z.object({
  tier: z.enum(['pro', 'autonomous', 'autonomous_plus', 'pbk']),
  court_count: z.number().int().min(1, 'At least 1 court required').max(50, 'Maximum 50 courts'),
  door_count: z.number().int().min(0),
  security_camera_count: z.number().int().min(0),
  has_pingpod_wifi: z.boolean().default(false),
  has_front_desk: z.boolean().default(false),
  replay_service_version: z.enum(['v1', 'v2']).default('v1'),
}).superRefine((data, ctx) => {
  // Autonomous/Autonomous+ require at least 1 door
  if ((data.tier === 'autonomous' || data.tier === 'autonomous_plus') && data.door_count < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['door_count'],
      message: 'Autonomous tier requires at least 1 access-controlled door',
    })
  }
  // Autonomous+ requires at least 1 security camera
  if (data.tier === 'autonomous_plus' && data.security_camera_count < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['security_camera_count'],
      message: 'Autonomous+ tier requires at least 1 security camera',
    })
  }
})

export const step3Schema = z.object({
  isp_provider: z.string().max(200).optional().default(''),
  isp_type: z.enum(['fiber', 'cable', 'dedicated', 'other', '']).optional().default(''),
  has_static_ip: z.boolean().default(false),
  has_backup_isp: z.boolean().default(false),
  internet_download_mbps: z.union([z.number().int().min(0), z.literal('')]).optional().default(''),
  internet_upload_mbps: z.union([z.number().int().min(0), z.literal('')]).optional().default(''),
  starlink_warning_acknowledged: z.boolean().default(false),
  rack_size_u: z.union([z.number().int().min(7).max(42), z.literal('')]).optional().default(''),
})
// Philippines static IP hard block — applied in component, not schema (needs cross-field access to venue_country from step1)

export const step4Schema = z.object({
  installer_id: z.string().uuid().optional().default(''),
  installer_type: z.enum(['podplay_vetted', 'client_own', '']).optional().default(''),
  kickoff_call_date: z.string().optional().default(''),    // ISO date string or ''
  signed_date: z.string().optional().default(''),
  installation_start_date: z.string().optional().default(''),
  installation_end_date: z.string().optional().default(''),
  notes: z.string().max(2000).optional().default(''),
  internal_notes: z.string().max(2000).optional().default(''),
}).superRefine((data, ctx) => {
  if (data.installation_start_date && data.installation_end_date) {
    if (data.installation_end_date < data.installation_start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['installation_end_date'],
        message: 'End date must be on or after start date',
      })
    }
  }
})

export const step5Schema = z.object({
  ddns_subdomain: z.string()
    .max(63)
    .regex(/^[a-z0-9-]*$/, 'Only lowercase letters, numbers, and hyphens allowed')
    .optional()
    .default(''),
  unifi_site_name: z.string()
    .max(50)
    .regex(/^(PL-[A-Z0-9-]*)?$/, 'Must start with PL- (e.g., PL-TELEPARK)')
    .optional()
    .default(''),
  mac_mini_username: z.string().max(100).optional().default(''),
  mac_mini_password: z.string().max(200).optional().default(''),
  location_id: z.string().max(200).optional().default(''),
})

// Combined schema for full-form validation on Step 6 review
export const intakeFormSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)

export type IntakeFormValues = z.infer<typeof intakeFormSchema>
```

---

## Component Structure

```
src/components/wizard/intake/
├── IntakeWizard.tsx                # Root wizard component — mode detection, form state
├── IntakeSummaryView.tsx           # Read-only project summary (view mode)
├── IntakeEditForm.tsx              # Multi-step form wrapper with step nav + state
├── steps/
│   ├── Step1CustomerVenue.tsx      # Customer & venue info
│   ├── Step2Configuration.tsx      # Tier, courts, doors, cameras, options
│   ├── Step3Isp.tsx                # ISP provider, speeds, networking
│   ├── Step4Installation.tsx       # Installer, dates, notes
│   ├── Step5Credentials.tsx        # DDNS, UniFi, Mac Mini, location ID
│   └── Step6Review.tsx             # Summary + cost preview + submit
├── components/
│   ├── StepIndicator.tsx           # Progress dots / step numbers
│   ├── CostPreview.tsx             # Hardware cost + service fee breakdown
│   ├── SowPreview.tsx              # Statement of work text block
│   ├── IspWarningBanner.tsx        # Inline ISP validation messages
│   └── InstallerSelect.tsx         # Searchable installer dropdown
└── hooks/
    ├── useIntakeForm.ts            # Form state, step navigation, submit handler
    ├── useIspValidation.ts         # Real-time ISP warning computation
    └── useDdnsCheck.ts             # Debounced DDNS subdomain uniqueness check
```

---

## IntakeWizard Component

**File**: `src/components/wizard/intake/IntakeWizard.tsx`

**Mode detection**: Project is in "create mode" if `customer_name === ''` (blank project just created). Otherwise show view mode summary.

```tsx
export function IntakeWizard() {
  const { project, installers, settings, bomItems } = Route.useLoaderData()
  const [mode, setMode] = useState<'view' | 'edit'>(
    project.customer_name === '' ? 'edit' : 'view'
  )

  if (mode === 'view') {
    return (
      <IntakeSummaryView
        project={project}
        settings={settings}
        bomItems={bomItems}
        onEdit={() => setMode('edit')}
      />
    )
  }

  return (
    <IntakeEditForm
      project={project}
      installers={installers}
      settings={settings}
      onSuccess={() => setMode('view')}
    />
  )
}
```

---

## IntakeEditForm Component

**File**: `src/components/wizard/intake/IntakeEditForm.tsx`

Manages step navigation and React Hook Form state across all 6 steps.

```tsx
export function IntakeEditForm({ project, installers, settings, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1)  // 1–6
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: projectToFormValues(project),  // map project fields to form defaults
    mode: 'onBlur',
  })

  // Per-step validation before advancing
  const validateStep = async (step: number): Promise<boolean> => {
    const stepFields = stepFieldMap[step]
    const result = await form.trigger(stepFields)
    return result
  }

  const goNext = async () => {
    const valid = await validateStep(currentStep)
    if (!valid) return
    // Special cross-field validations per step
    if (currentStep === 3) {
      const ispErrors = runIspCrossValidation(form.getValues(), currentStep)
      if (ispErrors.hasHardError) return  // blocks advance
    }
    setCurrentStep(s => Math.min(s + 1, 6))
  }

  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 1))

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      await submitIntakeForm(project.id, values)
      toast.success('Project created successfully')
      onSuccess()
    } catch (err) {
      toast.error(`Failed to save project: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <FormProvider {...form}>
      <div className="flex gap-8 p-6">
        {/* Left: step indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={6} />

        {/* Right: step content */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && <Step1CustomerVenue projectId={project.id} />}
            {currentStep === 2 && <Step2Configuration />}
            {currentStep === 3 && <Step3Isp />}
            {currentStep === 4 && <Step4Installation installers={installers} />}
            {currentStep === 5 && <Step5Credentials projectId={project.id} />}
            {currentStep === 6 && <Step6Review settings={settings} projectId={project.id} />}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={goPrev}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              {currentStep < 6 ? (
                <Button type="button" onClick={goNext}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating Project...</>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </FormProvider>
  )
}
```

**`stepFieldMap`** — maps step number to the field names validated by that step:

```typescript
const stepFieldMap: Record<number, (keyof IntakeFormValues)[]> = {
  1: ['customer_name', 'venue_name', 'venue_address_line1', 'venue_address_line2',
      'venue_city', 'venue_state', 'venue_zip', 'venue_country',
      'contact_name', 'contact_email', 'contact_phone'],
  2: ['tier', 'court_count', 'door_count', 'security_camera_count',
      'has_pingpod_wifi', 'has_front_desk', 'replay_service_version'],
  3: ['isp_provider', 'isp_type', 'has_static_ip', 'has_backup_isp',
      'internet_download_mbps', 'internet_upload_mbps',
      'starlink_warning_acknowledged', 'rack_size_u'],
  4: ['installer_id', 'installer_type', 'kickoff_call_date', 'signed_date',
      'installation_start_date', 'installation_end_date', 'notes', 'internal_notes'],
  5: ['ddns_subdomain', 'unifi_site_name', 'mac_mini_username',
      'mac_mini_password', 'location_id'],
  6: [],  // Step 6 is review only — validates all fields before submit
}
```

**`projectToFormValues`** — maps an existing Project row to form defaults:

```typescript
function projectToFormValues(project: Project): IntakeFormValues {
  return {
    customer_name: project.customer_name ?? '',
    venue_name: project.venue_name ?? '',
    venue_address_line1: project.venue_address_line1 ?? '',
    venue_address_line2: project.venue_address_line2 ?? '',
    venue_city: project.venue_city ?? '',
    venue_state: project.venue_state ?? '',
    venue_zip: project.venue_zip ?? '',
    venue_country: (project.venue_country as 'US' | 'PH') ?? 'US',
    contact_name: project.contact_name ?? '',
    contact_email: project.contact_email ?? '',
    contact_phone: project.contact_phone ?? '',
    tier: project.tier ?? 'pro',
    court_count: project.court_count ?? 1,
    door_count: project.door_count ?? 0,
    security_camera_count: project.security_camera_count ?? 0,
    has_pingpod_wifi: project.has_pingpod_wifi ?? false,
    has_front_desk: project.has_front_desk ?? false,
    replay_service_version: project.replay_service_version ?? 'v1',
    isp_provider: project.isp_provider ?? '',
    isp_type: project.isp_type ?? '',
    has_static_ip: project.has_static_ip ?? false,
    has_backup_isp: project.has_backup_isp ?? false,
    internet_download_mbps: project.internet_download_mbps ?? '',
    internet_upload_mbps: project.internet_upload_mbps ?? '',
    starlink_warning_acknowledged: project.starlink_warning_acknowledged ?? false,
    rack_size_u: project.rack_size_u ?? '',
    installer_id: project.installer_id ?? '',
    installer_type: project.installer_type ?? '',
    kickoff_call_date: project.kickoff_call_date ?? '',
    signed_date: project.signed_date ?? '',
    installation_start_date: project.installation_start_date ?? '',
    installation_end_date: project.installation_end_date ?? '',
    notes: project.notes ?? '',
    internal_notes: project.internal_notes ?? '',
    ddns_subdomain: project.ddns_subdomain ?? '',
    unifi_site_name: project.unifi_site_name ?? '',
    mac_mini_username: project.mac_mini_username ?? '',
    mac_mini_password: project.mac_mini_password ?? '',
    location_id: project.location_id ?? '',
  }
}
```

---

## StepIndicator Component

**File**: `src/components/wizard/intake/components/StepIndicator.tsx`

Vertical progress list on the left side (240px wide, sticky top).

```
┌─────────────────────────────────┐
│  Step 1   Customer & Venue   ✓  │  ← completed: green check, text-foreground
│  Step 2   Configuration      →  │  ← current: blue arrow, font-medium
│  Step 3   ISP & Networking      │  ← pending: gray circle with step number
│  Step 4   Installation          │
│  Step 5   Credentials           │
│  Step 6   Review & Submit       │
└─────────────────────────────────┘
```

**Step labels**:
| Step | Label |
|------|-------|
| 1 | Customer & Venue |
| 2 | Configuration |
| 3 | ISP & Networking |
| 4 | Installation |
| 5 | Credentials |
| 6 | Review & Submit |

**Styling per state**:
- Completed (step < currentStep): `text-green-600`, icon `CheckCircle2` filled green
- Current (step === currentStep): `font-medium text-foreground`, icon `ArrowRight` blue
- Pending (step > currentStep): `text-muted-foreground`, icon: circle with step number gray

**Clicking a step**: Only allowed to jump to a completed step (step < currentStep). Clicking a pending step does nothing (not an error — just ignored). The `Back` button is the primary way to return.

---

## Step 1: Customer & Venue

**File**: `src/components/wizard/intake/steps/Step1CustomerVenue.tsx`

**Heading**: "Customer & Venue Information"
**Subheading**: "Basic information about the customer and installation location."

### Fields

```
┌─────────────────────────────────────────────────────────────────┐
│  Customer Name *                                                 │
│  [                                                          ]   │
│  Business or club name (e.g., "Telepark Pickleball Club")       │
│                                                                 │
│  Venue Name *                                                   │
│  [                                                          ]   │
│  Location name, same as customer for single-venue clients       │
│  (e.g., "Telepark - Jersey City")                               │
│                                                                 │
│  ── Address ──                                                  │
│  Address Line 1                                                 │
│  [                                                          ]   │
│  Address Line 2                                                 │
│  [                                                          ]   │
│  [City *               ] [State *  ] [ZIP       ] [Country * ] │
│                                                                 │
│  ── Primary Contact ──                                          │
│  Contact Name *                                                 │
│  [                                                          ]   │
│  Owner or operations manager                                    │
│  Contact Email *                                                │
│  [                                                          ]   │
│  Contact Phone                                                  │
│  [                                                          ]   │
└─────────────────────────────────────────────────────────────────┘
```

### Field Specs

| Field | Input Type | Placeholder | Width | Required |
|-------|-----------|-------------|-------|----------|
| `customer_name` | text | "Telepark Pickleball Club" | full | Yes |
| `venue_name` | text | "Telepark - Jersey City" | full | Yes |
| `venue_address_line1` | text | "123 Main Street" | full | No |
| `venue_address_line2` | text | "Suite 200" | full | No |
| `venue_city` | text | "Jersey City" | 1/2 | Yes |
| `venue_state` | text | "NJ" | 1/4 | Yes |
| `venue_zip` | text | "07302" | 1/4 | No |
| `venue_country` | Select | — | 1/4 | Yes |
| `contact_name` | text | "Jane Smith" | full | Yes |
| `contact_email` | email | "jane@venue.com" | full | Yes |
| `contact_phone` | tel | "+1 (555) 123-4567" | full | No |

**`venue_country` Select options**:
- "US — United States" (value: `US`, default)
- "PH — Philippines" (value: `PH`)

### Behavior Rules

**venue_name auto-sync**: While `customer_name` changes, if `venue_name` has not been manually edited, auto-update `venue_name` to match. Stop syncing once user manually edits `venue_name`.

```typescript
// In Step1CustomerVenue: track whether venue_name was manually modified
const [venueNameManuallyEdited, setVenueNameManuallyEdited] = useState(false)

// On customer_name change:
if (!venueNameManuallyEdited) {
  form.setValue('venue_name', newCustomerName, { shouldDirty: false })
}

// On venue_name manual change:
setVenueNameManuallyEdited(true)
```

**Duplicate project warning** (non-blocking, shown as amber banner):
- Triggered on blur of `venue_name` field
- Calls `findDuplicateProject(customer_name, venue_name, projectId)`
- If duplicate found: Show amber `Alert`:
  ```
  ⚠ A project already exists for this customer/venue:
  "{existing.venue_name}" — [View Project]
  You can still continue if creating a second venue for the same customer.
  ```
- "View Project" is a link to `/projects/{existing.id}` (opens in same tab)

**Philippines banner** (blue info, shown when `venue_country = 'PH'`):
```
ℹ Philippines deployment — additional ISP requirements apply in Step 3.
  A business plan with static IP is mandatory.
```

---

## Step 2: Configuration

**File**: `src/components/wizard/intake/steps/Step2Configuration.tsx`

**Heading**: "Service Configuration"
**Subheading**: "Select the tier and count of courts, doors, and cameras."

### Fields

```
┌─────────────────────────────────────────────────────────────────┐
│  Service Tier *                                                  │
│  ○ Pro           Display + kiosk + replay camera + network rack │
│  ○ Autonomous    Pro + access control (Kisi) + security cameras  │
│  ● Autonomous+   Autonomous + NVR with hard drives              │
│  ○ PBK           Pickleball Kingdom (Pro hardware, custom price) │
│                                                                 │
│  Number of Courts *                                             │
│  [  6  ] [−] [+]      max 50                                    │
│                                                                 │
│  ── Autonomous / Autonomous+ Only ──    [shown for those tiers] │
│  Number of Access-Controlled Doors *                            │
│  [  3  ] [−] [+]                                               │
│                                                                 │
│  ── Autonomous+ Only ──                 [shown for A+ only]    │
│  Number of Security Cameras *                                   │
│  [  8  ] [−] [+]                                               │
│                                                                 │
│  ── Add-ons ──                                                  │
│  [✓] Front Desk Equipment                                       │
│       Includes CC terminal (BBPOS WisePOS E), QR scanner,      │
│       webcam                                                    │
│  [ ] PingPod WiFi                                               │
│       Adds UniFi U6-Plus WiFi access point                      │
│                                                                 │
│  ── Advanced ──                                                 │
│  Replay Service Version                                         │
│  ○ V1 (Current)    ● V2 (April 2026)                           │
│                                                                 │
│  ── Summary Preview ──                                          │
│  Tier: Autonomous+                                              │
│  Courts: 6 | Doors: 3 | Security Cameras: 8                    │
│  Replay Signs: 12 (auto-calculated, 2 per court)                │
│  Front Desk: Yes | PingPod WiFi: No                            │
└─────────────────────────────────────────────────────────────────┘
```

### Field Specs

| Field | Input Type | Default | Visible When |
|-------|-----------|---------|-------------|
| `tier` | RadioGroup | `pro` | Always |
| `court_count` | NumberInput (spinner) | 1 | Always |
| `door_count` | NumberInput (spinner) | 0 | `tier` in ['autonomous', 'autonomous_plus'] |
| `security_camera_count` | NumberInput (spinner) | 0 | `tier === 'autonomous_plus'` |
| `has_front_desk` | Checkbox | false | Always |
| `has_pingpod_wifi` | Checkbox | false | Always |
| `replay_service_version` | RadioGroup | `v1` | Always (in "Advanced" collapsible) |

### Tier Radio Card Layout

Each tier renders as a selectable card (not just a radio button):

```tsx
// TierCard component
<label className={cn(
  'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
  selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
)}>
  <RadioGroupItem value={tier} className="mt-0.5" />
  <div>
    <div className="font-medium">{tierLabel}</div>
    <div className="text-sm text-muted-foreground">{tierDescription}</div>
  </div>
</label>
```

**Tier display values**:
| value | Label | Description |
|-------|-------|-------------|
| `pro` | Pro | Display + kiosk + replay camera per court + network rack |
| `autonomous` | Autonomous | Pro + access control (Kisi) + security cameras |
| `autonomous_plus` | Autonomous+ | Autonomous + NVR with hard drives |
| `pbk` | PBK | Pickleball Kingdom — Pro hardware with custom pricing |

### NumberInput Spinner

```tsx
// Used for court_count, door_count, security_camera_count
// Renders as: [−] [number input] [+]
// − button disabled at min value; + button disabled at max value
// court_count: min=1, max=50
// door_count: min=0, max=99
// security_camera_count: min=0, max=99
```

### Conditional Logic

```typescript
// When tier changes:
// 1. If new tier is 'pro' or 'pbk': force door_count = 0, security_camera_count = 0
// 2. If new tier is 'autonomous' and door_count === 0: set door_count = 1 (auto-suggest)
// 3. If new tier is 'autonomous_plus' and security_camera_count === 0: set security_camera_count = 1

// Warning for large venues (court_count > 24):
// Show info banner: "Large venue: 48-port switch and 7-bay NVR (if Autonomous+)
//                   will be selected automatically."

// Warning for door_count > 0 with pro/pbk tier:
// (handled by schema validation — door_count is forced to 0 before submission)
```

### Summary Preview

Always-visible at the bottom of Step 2. Updates live as fields change.

```tsx
<div className="mt-6 p-4 rounded-lg bg-muted text-sm">
  <div className="grid grid-cols-2 gap-2">
    <span className="text-muted-foreground">Tier</span>
    <span className="font-medium">{tierLabel(tier)}</span>

    <span className="text-muted-foreground">Courts</span>
    <span className="font-medium">{court_count}</span>

    {(tier === 'autonomous' || tier === 'autonomous_plus') && <>
      <span className="text-muted-foreground">Doors</span>
      <span className="font-medium">{door_count}</span>
    </>}

    {tier === 'autonomous_plus' && <>
      <span className="text-muted-foreground">Security Cameras</span>
      <span className="font-medium">{security_camera_count}</span>
    </>}

    <span className="text-muted-foreground">Replay Signs</span>
    <span className="font-medium">{court_count * 2} (auto — 2 per court)</span>

    <span className="text-muted-foreground">Front Desk Equipment</span>
    <span className="font-medium">{has_front_desk ? 'Yes' : 'No'}</span>

    <span className="text-muted-foreground">PingPod WiFi</span>
    <span className="font-medium">{has_pingpod_wifi ? 'Yes' : 'No'}</span>

    <span className="text-muted-foreground">Replay Service</span>
    <span className="font-medium">{replay_service_version === 'v1' ? 'V1 (Current)' : 'V2 (April 2026)'}</span>
  </div>
</div>
```

---

## Step 3: ISP & Networking

**File**: `src/components/wizard/intake/steps/Step3Isp.tsx`

**Heading**: "ISP & Networking"
**Subheading**: "Internet requirements for the replay service. Upload speed is the key constraint."

### Fields

```
┌─────────────────────────────────────────────────────────────────┐
│  ISP Provider                                                   │
│  [Verizon Business                                          ]   │
│  e.g., "Verizon", "Comcast", "PLDT", "Globe"                   │
│                                                                 │
│  [!] STARLINK WARNING BANNER (shown if "starlink" detected)    │
│                                                                 │
│  Connection Type                                                │
│  [Select type          ▼]                                       │
│  ○ Fiber   ○ Cable   ○ Dedicated   ○ Other                     │
│                                                                 │
│  Internet Speed (Mbps)                                          │
│  Download: [        ] Mbps    Upload: [        ] Mbps          │
│  Note: Upload speed is the critical constraint for replay       │
│                                                                 │
│  [!] SPEED WARNING BANNER (shown when upload below threshold)  │
│                                                                 │
│  [ ] Static IP address provided by ISP                         │
│       Static IP preferred. If not available, use DMZ mode      │
│       or port forwarding (port 4000 TCP+UDP).                  │
│  [ ] Backup ISP (second connection)                            │
│       Required for 24/7 Autonomous venues.                      │
│                                                                 │
│  Rack Size (U)                                                  │
│  [  ] U   (7–42U; typically 7–12U based on court count)        │
│                                                                 │
│  ── Philippines ISP Notice ──       [shown if venue_country=PH]│
│  [!] Business plan with static IP mandatory.                   │
│      Supported ISPs: PLDT, Globe GFiber Business, Converge     │
└─────────────────────────────────────────────────────────────────┘
```

### ISP Provider Autocomplete Suggestions

When `isp_provider` input is focused and empty, show a pre-populated datalist of common US ISPs:
- "Verizon Business"
- "Comcast Business"
- "Optimum Business"
- "Spectrum Business"
- "AT&T Business"
- "Google Fiber"
- "Cox Business"

Philippines ISPs (shown when `venue_country = 'PH'`):
- "PLDT Beyond Fiber"
- "Globe GFiber Business"
- "Converge FlexiBIZ"

Implemented as `<datalist>` with `<input list="isp-suggestions">`.

### Starlink Warning Banner

Triggered when `isp_provider` value contains "starlink" (case-insensitive).

```tsx
{isStarlink && (
  <Alert variant="destructive" className="mt-2">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Starlink — NOT Compatible</AlertTitle>
    <AlertDescription>
      Starlink uses CGNAT which blocks inbound connections on port 4000.
      The replay service will NOT function with Starlink as the primary ISP.
      The venue must use a different ISP.
      <div className="mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={starlink_warning_acknowledged}
            onCheckedChange={(v) => form.setValue('starlink_warning_acknowledged', !!v)}
          />
          <span className="text-sm">
            I understand replay will not function. Customer accepts this limitation.
          </span>
        </label>
      </div>
    </AlertDescription>
  </Alert>
)}
```

**Advance guard**: If `isStarlink && !starlink_warning_acknowledged`, the "Continue" button on Step 3 is disabled and shows tooltip: "Acknowledge the Starlink limitation to continue."

### Speed Warning Banner

Computed from `court_count` (Step 2) + `isp_type` + `internet_upload_mbps`. Uses the `useIspValidation` hook.

```typescript
// Speed thresholds (from isp-validation.md)
const speedThresholds = [
  { min: 1,  max: 4,  fiber: 50,  cable: 60,  dedicated: 30  },
  { min: 5,  max: 11, fiber: 150, cable: null, dedicated: 50  },
  { min: 12, max: 19, fiber: 200, cable: null, dedicated: 50  },
  { min: 20, max: 24, fiber: 300, cable: null, dedicated: 100 },
  { min: 25, max: 50, fiber: 400, cable: null, dedicated: 150 },
]
```

Banner shows as amber `Alert` when upload speed is below recommended. NOT blocking — operator can still advance.

### Philippines ISP Notice

Shown when `venue_country === 'PH'` (read from Step 1 form value via `form.watch`).

```tsx
{isPhilippines && (
  <Alert className="mt-4 border-amber-500">
    <Info className="h-4 w-4" />
    <AlertTitle>Philippines ISP Requirements</AlertTitle>
    <AlertDescription>
      <ul className="list-disc ml-4 space-y-1 mt-1 text-sm">
        <li>Business plan required — residential plans use CGNAT</li>
        <li>Static IP mandatory — required for port 4000 access</li>
        <li>Supported ISPs: PLDT Beyond Fiber, Globe GFiber Business, Converge FlexiBIZ</li>
        <li>Do NOT use PLDT + Globe together (shared backbone). Use PLDT + Converge for backup.</li>
      </ul>
    </AlertDescription>
  </Alert>
)}
```

**Philippines hard block**: If `venue_country === 'PH' && !has_static_ip` on Step 3, the "Continue" button is disabled with error: "Static IP is mandatory for Philippines deployments. Enable 'Static IP' above."

### Backup ISP Warning (non-blocking)

When `tier` is 'autonomous' or 'autonomous_plus' AND `has_backup_isp === false`:
```tsx
<p className="text-sm text-amber-600 mt-1">
  Recommended: 24/7 autonomous venues should have a backup ISP for failover.
</p>
```

---

## Step 4: Installation Details

**File**: `src/components/wizard/intake/steps/Step4Installation.tsx`

**Heading**: "Installation Details"
**Subheading**: "Installer, timeline, and project notes."

### Fields

```
┌─────────────────────────────────────────────────────────────────┐
│  Installer                                                      │
│  [Select installer...                                       ▼]  │
│  Filtered by venue state: showing 3 vetted installers for NJ    │
│                                                                 │
│  Installer Type                                                 │
│  ● PodPlay Vetted   ○ Client's Own                             │
│                                                                 │
│  [!] Client's own — plan for remote troubleshooting             │
│                                                                 │
│  ── Timeline ──                                                 │
│  Kickoff Call Date                                              │
│  [          📅]                                                 │
│  Signed Date                                                    │
│  [          📅]                                                 │
│  Installation Start Date              End Date                  │
│  [          📅]                       [          📅]            │
│                                                                 │
│  ── Notes ──                                                    │
│  Customer-Facing Notes (for SOW)                                │
│  [                                                          ]   │
│  [                                                          ]   │
│  max 2000 characters                                            │
│                                                                 │
│  Internal Notes (not visible to customer)                       │
│  [                                                          ]   │
│  [                                                          ]   │
└─────────────────────────────────────────────────────────────────┘
```

### InstallerSelect Component

**File**: `src/components/wizard/intake/components/InstallerSelect.tsx`

- Renders as a `Popover` + `Command` (shadcn combobox pattern)
- Options grouped by: "Suggested for {venue_state}" (filtered) and "All Installers" (if state doesn't match)
- Each option shows: installer name, company (if any), regions covered
- Example: "Joe Martinez — Tri-State Electric (NY, NJ, CT)"
- Clearing selection sets `installer_id = ''`
- On selection: auto-derive `installer_type` from the selected installer's `installer_type` field

### Installer Type RadioGroup

Shown after installer selection. If no installer selected, still show (defaults to empty).

Options:
- `podplay_vetted` — "PodPlay Vetted" (green badge: "Vetted")
- `client_own` — "Client's Own Installer"

When `client_own` is selected, show info banner:
```tsx
<Alert className="mt-2">
  <Info className="h-4 w-4" />
  <AlertDescription>
    Client's own installer — ensure detailed labeling instructions and cable diagrams
    are sent. PodPlay ops will need to troubleshoot remotely if issues arise.
  </AlertDescription>
</Alert>
```

### Date Fields

All date fields use `<input type="date">` wrapped in a FormField. No date picker library — native HTML date input.

Validation (on Step 4 submission attempt):
- `installation_end_date >= installation_start_date` — else error on `installation_end_date`
- All dates are optional

Auto-info when `signed_date` set but `installation_start_date` empty:
```tsx
{signed_date && !installation_start_date && (
  <p className="text-sm text-muted-foreground mt-1">
    Consider setting installation dates now that the contract is signed.
  </p>
)}
```

### Notes TextAreas

Both `notes` and `internal_notes` use `<Textarea>` (shadcn) with `rows={4}`. Character count shown below: `{count}/2000`.

---

## Step 5: Credentials & Infrastructure

**File**: `src/components/wizard/intake/steps/Step5Credentials.tsx`

**Heading**: "Credentials & Infrastructure"
**Subheading**: "Technical credentials used during deployment. All fields optional at intake — can be filled in Stage 3."

### Fields

```
┌─────────────────────────────────────────────────────────────────┐
│  ℹ Credentials can be added later during deployment             │
│    configuration in Stage 3.                                    │
│                                                                 │
│  ── FreeDNS / DDNS ──                                          │
│  DDNS Subdomain                                                 │
│  [apex-chicago                                              ]   │
│  .podplaydns.com                                                │
│  Lowercase letters, numbers, hyphens only. Max 63 chars.        │
│                                                                 │
│  Preview:                                                       │
│    External URL: http://apex-chicago.podplaydns.com:4000        │
│    Local URL:    http://192.168.32.100:4000                      │
│                                                                 │
│  ── UniFi Network ──                                           │
│  UniFi Site Name                                                │
│  [PL-APEX-CHICAGO                                           ]   │
│  Format: PL-{CUSTOMERNAME} — e.g., PL-TELEPARK                 │
│                                                                 │
│  ── Mac Mini (Replay Server) ──                                 │
│  macOS Username                                                 │
│  [apexadmin                                                 ]   │
│  macOS Password                                                 │
│  [••••••••••                                                ]   │
│  [Show]                                                         │
│                                                                 │
│  ── PodPlay Backend ──                                          │
│  Location ID                                                    │
│  [                                                          ]   │
│  Provided by Agustin. Used in MDM P-List config.               │
│  If not yet assigned, leave blank — checklist will show         │
│  [GET FROM AGUSTIN] placeholder.                                │
│                                                                 │
│  ── Rack ──                                                     │
│  Rack Size (U)                                                  │
│  [  ] U   (7–42U; typically 7–12U)                              │
└─────────────────────────────────────────────────────────────────┘
```

### DDNS Subdomain Auto-Suggest

On Step 5 mount, if `ddns_subdomain` is empty, auto-suggest from `customer_name`:

```typescript
function suggestDdnsSubdomain(customer_name: string): string {
  return customer_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 63)
}
// "Apex Pickleball Club" → "apex-pickleball-club" (ops will shorten to "apex")
```

Show as a helper suggestion: "Suggested: apex-pickleball-club" with a "[Use this]" button that populates the field.

### DDNS Uniqueness Check

```typescript
// useDdnsCheck hook — debounced 500ms on input change
// Calls: checkDdnsSubdomainAvailable(subdomain, projectId)
// If taken: show error below field:
//   "Subdomain 'apex' is in use by project 'Apex Chicago'. Choose a different subdomain."
// If available (and non-empty): show success: "✓ Subdomain available"
// If empty: no status shown
```

### UniFi Site Name Auto-Suggest

On Step 5 mount, if `unifi_site_name` is empty, auto-suggest from `customer_name`:

```typescript
function suggestUnifiSiteName(customer_name: string): string {
  const slug = customer_name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 46)
  return `PL-${slug}`
}
// "Apex Pickleball" → "PL-APEX-PICKLEBALL"
```

Show as suggestion: "Suggested: PL-APEX-PICKLEBALL" with "[Use this]" button.

Auto-prefix: If user types without "PL-" prefix, auto-add on blur:
```typescript
const onUnifiBlur = () => {
  const val = form.getValues('unifi_site_name')
  if (val && !val.startsWith('PL-')) {
    form.setValue('unifi_site_name', `PL-${val.toUpperCase()}`)
  }
}
```

### Mac Mini Password Field

Toggle show/hide via eye icon button:
```tsx
const [showPassword, setShowPassword] = useState(false)
<Input
  type={showPassword ? 'text' : 'password'}
  {...field}
/>
<Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
</Button>
```

### URL Preview

Shown inline below DDNS subdomain field, updates live:
```tsx
{ddns_subdomain ? (
  <div className="mt-2 p-3 rounded-md bg-muted text-sm font-mono space-y-1">
    <div><span className="text-muted-foreground">External:</span> http://{ddns_subdomain}.podplaydns.com:4000</div>
    <div><span className="text-muted-foreground">Local:</span>    http://192.168.32.100:4000</div>
    <div><span className="text-muted-foreground">Health:</span>   http://{ddns_subdomain}.podplaydns.com:4000/health</div>
  </div>
) : (
  <p className="text-sm text-muted-foreground mt-1">Enter a subdomain to see the URL preview.</p>
)}
```

---

## Step 6: Review & Submit

**File**: `src/components/wizard/intake/steps/Step6Review.tsx`

**Heading**: "Review & Create Project"
**Subheading**: "Confirm all details before creating the project."

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [!] Validation errors (if any) — list of blocking issues      │
│                                                                 │
│  ── Customer & Venue ──                              [Edit ↑]  │
│  Customer:  Apex Pickleball                                     │
│  Venue:     Apex - Chicago North                                │
│  Address:   123 Main St, Chicago, IL 60601                      │
│  Contact:   Maria Rodriguez — maria@apexpickleball.com          │
│                                                                 │
│  ── Configuration ──                                 [Edit ↑]  │
│  Tier:         Autonomous+                                      │
│  Courts:       6                                                │
│  Doors:        3                                                │
│  Security Cameras: 8                                            │
│  Front Desk:   Yes                                              │
│  Replay Signs: 12 (auto)                                        │
│  Service Version: V1                                            │
│                                                                 │
│  ── ISP & Networking ──                              [Edit ↑]  │
│  ISP:          Comcast Business (Cable)                         │
│  Speed:        500 ↓ / 35 ↑ Mbps                               │
│  Static IP:    Yes   Backup ISP: No                             │
│  [!] Upload speed may be marginal for 6 courts on cable.        │
│                                                                 │
│  ── Installation ──                                  [Edit ↑]  │
│  Installer:    Joe Martinez (Vetted)                            │
│  Kickoff:      Mar 10, 2026                                     │
│  Install:      Apr 14 – Apr 16, 2026                            │
│                                                                 │
│  ── Credentials ──                                   [Edit ↑]  │
│  DDNS:         apex-chicago.podplaydns.com:4000                 │
│  UniFi:        PL-APEX-CHICAGO                                  │
│  Mac Mini:     apexadmin / ••••••••••                           │
│  Location ID:  (not set — checklist will use placeholder)       │
│                                                                 │
│  ══════════════════════════════════════════════════════════     │
│  ── Cost Analysis Preview ──                                    │
│  Hardware subtotal:    $41,850                                  │
│  Shipping (10%):       $4,185                                   │
│  Landed cost:          $46,035                                  │
│  Hardware revenue:     $51,150                                  │
│  Service fee:          $22,500 ($7,500 + $2,500×6)             │
│  Contract value:       $73,650                                  │
│  Sales tax (10.25%):   $7,549                                   │
│  Invoice total:        $81,199                                  │
│  ───────────────────────────────────────                        │
│  Deposit (50%):        $40,599                                  │
│  Final payment:        $40,600                                  │
│  ══════════════════════════════════════════════════════════     │
│                                                                 │
│  What happens when you click "Create Project":                  │
│  • Project record created in database                           │
│  • Bill of Materials auto-generated (~{bomCount} items)         │
│  • Deployment checklist seeded (~{checklistCount} steps)        │
│  • Replay signs order queued (12 signs)                         │
│  {if has_front_desk: • CC terminal record created (1 unit)}     │
└─────────────────────────────────────────────────────────────────┘
```

### "Edit ↑" Buttons

Each section header has an "Edit" button that navigates back to that step:
- `[Edit ↑]` → `setCurrentStep(1)` for Customer & Venue
- `[Edit ↑]` → `setCurrentStep(2)` for Configuration
- `[Edit ↑]` → `setCurrentStep(3)` for Network & Credentials
- `[Edit ↑]` → `setCurrentStep(4)` for Installer & Timeline
- `[Edit ↑]` → `setCurrentStep(5)` for Location & IDs

### Blocking Validation on Step 6

Before the "Create Project" button becomes enabled, run a final validation check:

```typescript
interface ValidationCheck {
  label: string
  passed: boolean
  message: string   // shown if !passed
  stepToFix: number // which step to jump to
}

const validationChecks: ValidationCheck[] = [
  {
    label: 'Customer name',
    passed: !!customer_name,
    message: 'Customer name is required',
    stepToFix: 1,
  },
  {
    label: 'Venue name',
    passed: !!venue_name,
    message: 'Venue name is required',
    stepToFix: 1,
  },
  {
    label: 'Contact email',
    passed: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email),
    message: 'Valid contact email is required',
    stepToFix: 1,
  },
  {
    label: 'Tier',
    passed: !!tier,
    message: 'Service tier must be selected',
    stepToFix: 2,
  },
  {
    label: 'Court count',
    passed: court_count >= 1,
    message: 'At least 1 court required',
    stepToFix: 2,
  },
  {
    label: 'Door count (Autonomous)',
    passed: !(['autonomous', 'autonomous_plus'].includes(tier)) || door_count >= 1,
    message: 'Autonomous tier requires at least 1 door',
    stepToFix: 2,
  },
  {
    label: 'Camera count (Autonomous+)',
    passed: tier !== 'autonomous_plus' || security_camera_count >= 1,
    message: 'Autonomous+ requires at least 1 security camera',
    stepToFix: 2,
  },
  {
    label: 'Starlink acknowledgement',
    passed: !isStarlink || starlink_warning_acknowledged,
    message: 'Must acknowledge Starlink limitation before proceeding',
    stepToFix: 3,
  },
  {
    label: 'Philippines static IP',
    passed: venue_country !== 'PH' || has_static_ip,
    message: 'Static IP is mandatory for Philippines deployments',
    stepToFix: 3,
  },
  {
    label: 'Install dates',
    passed: !installation_start_date || !installation_end_date || installation_end_date >= installation_start_date,
    message: 'Installation end date must be on or after start date',
    stepToFix: 4,
  },
  {
    label: 'DDNS subdomain format',
    passed: !ddns_subdomain || /^[a-z0-9-]+$/.test(ddns_subdomain),
    message: 'DDNS subdomain: only lowercase letters, numbers, hyphens',
    stepToFix: 5,
  },
  {
    label: 'DDNS subdomain uniqueness',
    passed: ddnsAvailable,   // from useDdnsCheck hook result
    message: `Subdomain '${ddns_subdomain}' is already in use`,
    stepToFix: 5,
  },
]
```

If any check fails, show above the review content:
```tsx
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Fix the following issues before creating the project:</AlertTitle>
  <AlertDescription>
    <ul className="list-disc ml-4 mt-1 space-y-1">
      {failedChecks.map(check => (
        <li key={check.label}>
          {check.message} —{' '}
          <button
            type="button"
            className="underline"
            onClick={() => setCurrentStep(check.stepToFix)}
          >
            Go to Step {check.stepToFix}
          </button>
        </li>
      ))}
    </ul>
  </AlertDescription>
</Alert>
```

### Cost Analysis Preview Component

**File**: `src/components/wizard/intake/components/CostPreview.tsx`

Computes and displays the cost breakdown live from form values + settings. No DB call needed — computed client-side.

```typescript
interface CostPreview {
  hardware_subtotal: number
  shipping_cost: number
  landed_cost: number
  hardware_revenue: number
  venue_service_fee: number
  court_service_fee: number
  service_fee: number
  total_contract_value: number
  sales_tax: number
  invoice_total: number
  deposit_amount: number
  final_amount: number
}

// Compute from BOM templates × quantities (using settings for rates)
// Same algorithm as logic-cost-analysis.md
function computeCostPreview(
  tier: string,
  court_count: number,
  door_count: number,
  security_camera_count: number,
  has_front_desk: boolean,
  has_pingpod_wifi: boolean,
  settings: Settings,
  bomTemplates: BomTemplate[]  // from settings preloaded in route loader
): CostPreview {
  // 1. Compute hardware subtotal from BOM templates
  let hardware_subtotal = 0
  for (const tmpl of bomTemplates) {
    if (!tmpl.applicable_tiers.includes(tier)) continue
    const qty = tmpl.qty_per_venue
      + tmpl.qty_per_court * court_count
      + tmpl.qty_per_door * door_count
      + tmpl.qty_per_camera * security_camera_count
    if (qty <= 0) continue
    hardware_subtotal += qty * (tmpl.unit_cost ?? 0)
  }

  // 2. Shipping
  const shipping_rate = settings.shipping_rate ?? 0.10
  const shipping_cost = hardware_subtotal * shipping_rate
  const landed_cost = hardware_subtotal + shipping_cost

  // 3. Margin
  const target_margin = settings.target_margin ?? 0.10
  const hardware_revenue = landed_cost / (1 - target_margin)

  // 4. Service fee
  const tierFees = {
    pro:             { venue: settings.pro_venue_fee,             court: settings.pro_court_fee },
    autonomous:      { venue: settings.autonomous_venue_fee,      court: settings.autonomous_court_fee },
    autonomous_plus: { venue: settings.autonomous_plus_venue_fee, court: settings.autonomous_plus_court_fee },
    pbk:             { venue: settings.pbk_venue_fee,             court: settings.pbk_court_fee },
  }
  const fees = tierFees[tier as keyof typeof tierFees]
  const venue_service_fee = fees?.venue ?? 0
  const court_service_fee = (fees?.court ?? 0) * court_count
  const service_fee = venue_service_fee + court_service_fee

  // 5. Tax & total
  const total_contract_value = hardware_revenue + service_fee
  const tax_rate = settings.tax_rate ?? 0.1025
  const sales_tax = total_contract_value * tax_rate
  const invoice_total = total_contract_value + sales_tax

  // 6. Installments
  const deposit_pct = settings.deposit_percentage / 100 ?? 0.50
  const deposit_amount = invoice_total * deposit_pct
  const final_amount = invoice_total - deposit_amount

  return {
    hardware_subtotal, shipping_cost, landed_cost, hardware_revenue,
    venue_service_fee, court_service_fee, service_fee,
    total_contract_value, sales_tax, invoice_total,
    deposit_amount, final_amount,
  }
}
```

Rendered as a two-column table of label + formatted dollar amount.

### Expected BOM/Checklist Count Hint

Shown below cost preview on Step 6:

```typescript
// Per logic-bom-generation.md:
const estimatedBomCount = {
  pro: 22, autonomous: 26, autonomous_plus: 29, pbk: 22,
}[tier] + (has_front_desk ? 3 : 0) + (has_pingpod_wifi ? 1 : 0)

// Per logic-deployment-tracking.md:
const estimatedChecklistCount = {
  pro: 116, autonomous: 119, autonomous_plus: 121, pbk: 116,
}[tier]
```

---

## IntakeSummaryView (View Mode)

**File**: `src/components/wizard/intake/IntakeSummaryView.tsx`

Shown after the project has been created. Displays a read-only view of all project data + cost analysis + SOW + advancement controls.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Edit Project Details]                        [⚠ Cancel Project]│
│                                                                 │
│  [!] STARLINK PERMANENT BANNER (if applicable)                  │
│                                                                 │
│  ── Project Status ──                                           │
│  Status:     Intake (Proposal)                                  │
│  Created:    March 6, 2026                                      │
│  Signed:     (not set)                                          │
│                                                                 │
│  ── Customer & Venue ──                                         │
│  {full venue details in read-only grid}                         │
│                                                                 │
│  ── Configuration ──                                            │
│  {tier, courts, doors, cameras, options}                        │
│                                                                 │
│  ── ISP & Networking ──                                         │
│  {isp details, speed, static IP, backup ISP}                    │
│  {any ISP warnings shown inline}                                │
│                                                                 │
│  ── Installation ──                                             │
│  {installer, dates}                                             │
│                                                                 │
│  ── Credentials ──                                              │
│  {DDNS, UniFi, Mac Mini, location_id with placeholders}         │
│                                                                 │
│  ── Cost Analysis ──                                            │
│  {CostPreview component — same as Step 6}                       │
│                                                                 │
│  ── Statement of Work ──                                        │
│  [Copy SOW Text]                                                │
│  {SowPreview component — formatted SOW text in code block}      │
│                                                                 │
│  ══════════════════════════════════════════════════════════     │
│  [Advance to Procurement →]                                     │
│  project_status must be 'intake' to show this button           │
└─────────────────────────────────────────────────────────────────┘
```

### Revenue Stage Badge

Shown in the status section:

| `revenue_stage` | Badge label | Badge color |
|----------------|------------|-------------|
| `proposal` | Proposal | gray |
| `signed` | Signed | blue |
| `deposit_invoiced` | Deposit Invoiced | amber |
| `deposit_paid` | Deposit Paid | green |
| `final_invoiced` | Final Invoiced | amber |
| `final_paid` | Paid in Full | green |

### Starlink Permanent Warning Banner

If `project.isp_provider` contains "starlink" AND `project.starlink_warning_acknowledged === true`, show a permanent red banner at top of project view (not just in intake):
```tsx
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>ISP: Starlink — Replay Service Incompatible</AlertTitle>
  <AlertDescription>
    Starlink's CGNAT blocks port 4000. The replay service will not function.
    A different ISP is required for replay to work.
  </AlertDescription>
</Alert>
```

### SOW Preview Component

**File**: `src/components/wizard/intake/components/SowPreview.tsx`

Generates the text block for the Statement of Work. Rendered in a `<pre>` block with monospace font. "Copy SOW Text" button copies to clipboard via `navigator.clipboard.writeText`.

```typescript
function generateSow(project: Project, cost: CostPreview, settings: Settings): string {
  const tierNames = {
    pro: 'Pro', autonomous: 'Autonomous',
    autonomous_plus: 'Autonomous+', pbk: 'PBK',
  }
  return `STATEMENT OF WORK

Customer: ${project.customer_name}
Venue: ${project.venue_name}
Address: ${[project.venue_address_line1, project.venue_city, project.venue_state, project.venue_zip].filter(Boolean).join(', ')}
Date: ${project.kickoff_call_date || new Date().toISOString().split('T')[0]}

SERVICE TIER: ${tierNames[project.tier]}
Courts: ${project.court_count}${project.door_count > 0 ? '\nDoors: ' + project.door_count : ''}${project.security_camera_count > 0 ? '\nSecurity Cameras: ' + project.security_camera_count : ''}${project.has_front_desk ? '\nFront Desk Equipment: Included' : ''}

PRICING SUMMARY:
  Service Fee:              $${cost.service_fee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
    Venue Fee:              $${cost.venue_service_fee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
    Per-Court Fee:          $${(settings.pro_court_fee ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} × ${project.court_count} courts
  Hardware (estimated):     $${cost.hardware_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
  ─────────────────────────────────────────
  Subtotal:                 $${cost.total_contract_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
  Sales Tax (${((settings.tax_rate ?? 0.1025) * 100).toFixed(2)}%):         $${cost.sales_tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
  Total:                    $${cost.invoice_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}

PAYMENT TERMS:
  Deposit (50%):            $${cost.deposit_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} — due upon signing
  Final Payment (50%):      $${cost.final_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} — due upon go-live

INSTALLATION:
  Installer: ${project.installer_id ? '(assigned — see project)' : '(not yet assigned)'}
  Timeline: ${project.installation_start_date || '(not scheduled)'} – ${project.installation_end_date || '(not scheduled)'}

${project.notes ? 'NOTES:\n  ' + project.notes : ''}`
}
```

### Advance to Procurement Button

```tsx
{project.project_status === 'intake' && (
  <div className="flex justify-end mt-8 pt-6 border-t">
    <Button
      onClick={() => handleAdvanceToProcurement()}
      size="lg"
    >
      Advance to Procurement
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </div>
)}
```

**`handleAdvanceToProcurement`**:
1. Calls `advanceProjectStatus(project.id, 'procurement')`
2. On success: navigate to `/projects/${project.id}/procurement`
3. On error: show toast "Failed to advance stage"
4. No confirmation dialog — operator intentional click is sufficient

### Cancel Project Button

```tsx
{(project.project_status === 'intake' || project.project_status === 'procurement') && (
  <Button
    variant="ghost"
    className="text-destructive hover:text-destructive hover:bg-destructive/10"
    onClick={() => setCancelDialogOpen(true)}
  >
    Cancel Project
  </Button>
)}
```

**Cancel confirmation dialog** (AlertDialog):
- Title: "Cancel this project?"
- Description: "This will mark the project as cancelled. No data will be deleted — you can view it in the project list filtered by 'Cancelled'."
- Actions: "Keep Project" (cancel) | "Yes, Cancel Project" (destructive)
- On confirm: `advanceProjectStatus(project.id, 'cancelled')` → navigate to `/projects`

---

## Edit Mode (Post-Creation)

When the user clicks "Edit Project Details" in view mode, `mode` switches back to `'edit'`. The form pre-populates from the existing project data.

### BOM Regeneration Warning

When editing Step 2 fields (`tier`, `court_count`, `door_count`, `security_camera_count`) on an existing project that already has BOM items, show a persistent warning at top of Step 2:

```tsx
{bomItems.length > 0 && (
  <Alert className="mb-4 border-amber-500">
    <AlertTriangle className="h-4 w-4 text-amber-500" />
    <AlertTitle className="text-amber-700">BOM will be regenerated</AlertTitle>
    <AlertDescription>
      Changing tier, court count, doors, or cameras will delete the current
      {bomItems.length} BOM items and regenerate from scratch.
      Manually added BOM items are preserved.
    </AlertDescription>
  </Alert>
)}
```

**On submit in edit mode**: Call `submitIntakeForm` which handles BOM regeneration internally (deletes auto-generated items, regenerates, preserves `is_manual = true` items).

---

## Loading State: IntakeSkeleton

**File**: `src/components/wizard/intake/IntakeSkeleton.tsx`

Shown during route loader. Uses shadcn `Skeleton` component:

```tsx
export function IntakeSkeleton() {
  return (
    <div className="flex gap-8 p-6 animate-pulse">
      <div className="w-48 space-y-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-3 mt-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    </div>
  )
}
```

---

## Complete File Creation List

```
src/
├── routes/
│   └── _auth/
│       └── projects/
│           └── $projectId/
│               └── intake/
│                   └── index.tsx                     # Route definition
├── components/
│   └── wizard/
│       └── intake/
│           ├── IntakeWizard.tsx                      # Root component (mode detection)
│           ├── IntakeSummaryView.tsx                 # View mode read-only summary
│           ├── IntakeEditForm.tsx                    # Edit mode multi-step form
│           ├── IntakeSkeleton.tsx                    # Loading skeleton
│           ├── steps/
│           │   ├── Step1CustomerVenue.tsx
│           │   ├── Step2Configuration.tsx
│           │   ├── Step3Isp.tsx
│           │   ├── Step4Installation.tsx
│           │   ├── Step5Credentials.tsx
│           │   └── Step6Review.tsx
│           ├── components/
│           │   ├── StepIndicator.tsx
│           │   ├── CostPreview.tsx
│           │   ├── SowPreview.tsx
│           │   ├── IspWarningBanner.tsx
│           │   └── InstallerSelect.tsx
│           └── hooks/
│               ├── useIntakeForm.ts
│               ├── useIspValidation.ts
│               └── useDdnsCheck.ts
├── services/
│   ├── projects.ts      # getProject, submitIntakeForm, advanceProjectStatus,
│   │                    # findDuplicateProject, checkDdnsSubdomainAvailable
│   └── installers.ts    # getInstallers, filterInstallersByState
└── lib/
    └── schemas/
        └── intake.ts    # step1Schema–step5Schema, intakeFormSchema, IntakeFormValues
```

---

## Package Dependencies (No New Additions)

All dependencies are available from the base project setup:
- `react-hook-form` — form state and validation
- `zod` — schema validation (via `@hookform/resolvers/zod`)
- `@supabase/supabase-js` — database queries
- `@tanstack/react-router` — routing, loaders
- `lucide-react` — icons (CheckCircle2, ArrowRight, AlertTriangle, Eye, EyeOff, Info, Loader2)
- shadcn/radix components: Input, Textarea, Button, Checkbox, RadioGroup, Select, Alert, AlertDialog, Skeleton, Popover, Command (for InstallerSelect combobox)

---

## Edge Cases

| Case | Behavior |
|------|----------|
| `court_count = 1` | BOM generates minimums. Replay signs = 2. Step 2 summary shows all fields correctly. |
| `tier = 'pbk'`, `court_count = 10` | PBK fees used for service_fee calculation. If `pbk_venue_fee = 0` in settings, CostPreview shows $0 service fee + amber warning "PBK pricing not configured — update in Settings > Pricing." |
| Large venue (`court_count > 24`) | Info banner on Step 2: "Large venue — 48-port switch and 7-bay NVR (if Autonomous+) will be selected automatically." |
| `isp_type = 'cable'`, 5–11 courts | No cable upload threshold (any upload acceptable) — no speed warning shown. |
| `location_id` empty at intake | Step 5 shows info: "Leave blank if not yet assigned — checklist will use [GET FROM AGUSTIN] placeholder." SOW shows "(pending — contact Agustin)" |
| Philippines + no static IP | Hard block: "Continue" button disabled on Step 3. Error under `has_static_ip` field. |
| Starlink acknowledged | Project creates with Starlink warning. Red banner shown permanently on IntakeSummaryView and ProjectShell header. |
| Duplicate customer+venue | Amber non-blocking warning on Step 1, but form can still be submitted. |
| DDNS subdomain taken | Error shown below field on Step 5. Step 6 validation shows it as blocking. "Create Project" button disabled. |
| DDNS subdomain empty | Checklist tokens for `{{DDNS_SUBDOMAIN}}` resolve to `[SET IN STEP 5]`. Info shown on Step 5 and Step 6 review. |
| `has_front_desk` toggled on after creation | Edit submit creates CC terminal record. BOM front_desk items already in auto-BOM (qty was 0 before — regeneration sets to correct qty). |
| `has_front_desk` toggled off in edit | Warning: "CC terminal record exists. Delete manually in Stage 2 if not needed." Front desk BOM items set to qty=0 via regeneration. |
| Installer search with no matches for state | Shows all installers with note: "No vetted installers found for {state} — showing all." |
| Submitting with `installation_end_date < installation_start_date` | Error shown on `installation_end_date` field in Step 4. Step 6 validation blocks. |
| Blank project (just created, no fields) | IntakeWizard detects `customer_name === ''` and starts in edit mode at Step 1. |
| Returning to intake after procurement has started | IntakeSummaryView shows. "Advance to Procurement" button hidden (status !== 'intake'). "Edit" still allowed. BOM regeneration warning appears in edit mode. |
