# Feature Spec: Firm Branding

**Aspect:** spec-firm-branding
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** legal-doc-formatting, spec-pdf-export, spec-auth-persistence
**Depends on:** spec-pdf-export (must be written first), spec-auth-persistence (must be written first)
**Depended on by:** spec-bir-1801-integration, spec-case-export-zip, architecture-overview

---

## 1. Overview

Firm branding lets a logged-in Philippine estate lawyer enter their law firm's details once — and have those details automatically populate every PDF report they generate. Without this feature, all PDFs are anonymous computation aids. With it, every PDF becomes a professional deliverable on the firm's letterhead.

**Why a PH estate lawyer needs this:**
- Professional credibility: a PDF bearing the firm's name, address, and counsel credentials signals competence and justifies fees
- Philippine bar requirement: all legal documents must include IBP Roll No., PTR No., and MCLE Compliance No. on the signature block (see `legal-doc-formatting §4.3`)
- Time savings: set once, auto-applies to every PDF; no need to manually add letterhead to each report
- Client trust: clients receiving a branded PDF from "Santos & Reyes Law Offices" have more confidence than receiving an unmarked computation

**Key user story:** A lawyer signs in for the first time, goes to Firm Settings (via user menu), fills in their firm name, address, phone, email, counsel name, IBP Roll No., PTR No., MCLE Compliance No., and optionally uploads a firm logo. They click Save. From that point on, every PDF they export shows their firm's letterhead on page one and their credentials in the attestation block — automatically.

---

## 2. Data Model

### 2.1 Gap: Missing Attorney Credential Fields

The `user_profiles` table defined in `spec-auth-persistence §2.1` is missing three fields required by Philippine law for legal documents:
- `ibp_roll_no` — Integrated Bar of the Philippines Roll Number
- `ptr_no` — Professional Tax Receipt number (includes issuing city and date)
- `mcle_compliance_no` — Mandatory Continuing Legal Education compliance number

**Migration to add these columns:**

```sql
-- Migration: 002_firm_branding_fields.sql
-- Extends user_profiles with attorney credential fields required for PH legal documents

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS ibp_roll_no       TEXT,   -- e.g., "123456"
  ADD COLUMN IF NOT EXISTS ptr_no            TEXT,   -- e.g., "7654321, Jan 5, 2026, Makati City"
  ADD COLUMN IF NOT EXISTS mcle_compliance_no TEXT;  -- e.g., "VII-0012345"
```

**No RLS changes needed** — existing policies on `user_profiles` already gate all reads/writes to the owning user (`auth.uid() = id`).

### 2.2 Logo Storage (Supabase Storage)

Logo files are stored in Supabase Storage, not in the database. The `logo_url` column on `user_profiles` (already defined in spec-auth-persistence) stores the public URL after upload.

**Bucket configuration:**

```sql
-- Run in Supabase Dashboard → Storage → New Bucket
-- Bucket: firm-logos
-- Public: YES (logos need to be accessible by @react-pdf/renderer when generating PDF)
-- File size limit: 2097152 (2 MB)
-- Allowed MIME types: image/png, image/jpeg, image/svg+xml
```

**Storage path convention:**
```
firm-logos/{user_id}/logo.{ext}
```

Example URL:
```
https://[project-ref].supabase.co/storage/v1/object/public/firm-logos/a1b2c3d4/logo.png
```

**Storage RLS policies:**

```sql
-- Allow authenticated user to upload/replace their own logo
CREATE POLICY "logo_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'firm-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "logo_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'firm-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "logo_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'firm-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read (bucket is public, but explicit policy for clarity)
CREATE POLICY "logo_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'firm-logos');
```

### 2.3 Complete `FirmProfile` TypeScript Interface

This is the canonical interface used by spec-pdf-export and all downstream consumers:

```typescript
// src/types/firm.ts

export interface FirmProfile {
  firm_name: string;            // "Santos & Reyes Law Offices"
  firm_address: string;         // "4F Salcedo Tower, Legaspi Village, Makati City 1229"
  firm_phone: string;           // "+63-2-8888-9999"
  firm_email: string;           // "info@santosreyes.law"
  counsel_name: string;         // "Atty. Maria G. Santos"
  ibp_roll_no: string;          // "123456"
  ptr_no: string;               // "7654321, Jan 5, 2026, Makati City"
  mcle_compliance_no: string;   // "VII-0012345"
  logo_url: string | null;      // Supabase Storage URL or null
}

// Partial version for the settings form (all fields optional until saved)
export type FirmProfileDraft = Partial<FirmProfile>

// Derived from user_profiles row — maps DB columns to FirmProfile shape
export function toFirmProfile(profile: UserProfile): FirmProfile | null {
  if (!profile.firm_name) return null  // No firm configured yet
  return {
    firm_name: profile.firm_name,
    firm_address: profile.address ?? '',
    firm_phone: profile.phone ?? '',
    firm_email: profile.email ?? '',
    counsel_name: profile.counsel_name ?? '',
    ibp_roll_no: profile.ibp_roll_no ?? '',
    ptr_no: profile.ptr_no ?? '',
    mcle_compliance_no: profile.mcle_compliance_no ?? '',
    logo_url: profile.logo_url ?? null,
  }
}
```

---

## 3. UI Design

### 3.1 Entry Points

There are two entry points to Firm Settings:

1. **User menu → "Firm Settings"** (primary — see spec-auth-persistence §3.1)
2. **PDF preview prompt** — if user exports PDF and no firm profile is configured, a non-blocking banner appears:

```
┌─────────────────────────────────────────────────────────────────┐
│ ℹ  No firm profile configured. PDF will not include letterhead. │
│    [Set Up Firm Profile]  [Export Anyway]                       │
└─────────────────────────────────────────────────────────────────┘
```

Clicking "Set Up Firm Profile" navigates to `/settings/firm` (opens in same tab; browser back returns to results).

### 3.2 Firm Settings Page

Route: `/settings/firm`

Full page layout:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard              Firm Settings                      │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│  ┌──────────────────────────────────────┐  ┌──────────────────────┐ │
│  │  FIRM DETAILS                        │  │  PDF PREVIEW         │ │
│  │                                      │  │  ──────────────────  │ │
│  │  Firm Name *                         │  │  SANTOS & REYES      │ │
│  │  [Santos & Reyes Law Offices      ]  │  │  LAW OFFICES         │ │
│  │                                      │  │  Attorneys and       │ │
│  │  Address *                           │  │  Counselors at Law   │ │
│  │  [4F Salcedo Tower, Legaspi       ]  │  │  4F Salcedo Tower,   │ │
│  │  [Village, Makati City 1229       ]  │  │  Legaspi Village,    │ │
│  │                                      │  │  Makati City 1229    │ │
│  │  Phone                               │  │  +63-2-8888-9999     │ │
│  │  [+63-2-8888-9999                 ]  │  │  info@santosreyes.ph │ │
│  │                                      │  │                      │ │
│  │  Email                               │  │  Prepared by:        │ │
│  │  [info@santosreyes.law            ]  │  │  Atty. Maria G.      │ │
│  │                                      │  │  Santos              │ │
│  │  COUNSEL CREDENTIALS                 │  │  IBP Roll No. 123456 │ │
│  │                                      │  │  PTR No. 7654321,    │ │
│  │  Counsel Name *                      │  │  Jan 5, 2026,        │ │
│  │  [Atty. Maria G. Santos           ]  │  │  Makati City         │ │
│  │                                      │  │  MCLE No.            │ │
│  │  IBP Roll No. *                      │  │  VII-0012345         │ │
│  │  [123456                          ]  │  │  Date: Mar 1, 2026   │ │
│  │                                      │  │  ──────────────────  │ │
│  │  PTR No. *                           │  │  [logo thumbnail if  │ │
│  │  [7654321, Jan 5, 2026, Makati    ]  │  │   uploaded]          │ │
│  │                                      │  │                      │ │
│  │  MCLE Compliance No. *              │  │  This is how your    │ │
│  │  [VII-0012345                     ]  │  │  firm header will    │ │
│  │                                      │  │  appear on PDFs.     │ │
│  │  FIRM LOGO                           │  └──────────────────────┘ │
│  │                                      │                            │
│  │  ┌──────────────────────────────┐    │                            │
│  │  │  [Current logo or]           │    │                            │
│  │  │  [upload placeholder]        │    │                            │
│  │  │                              │    │                            │
│  │  │  [📁 Upload Logo]            │    │                            │
│  │  │  PNG, JPG, or SVG · Max 2MB  │    │                            │
│  │  └──────────────────────────────┘    │                            │
│  │                                      │                            │
│  │  [Remove Logo]   (only if logo set)  │                            │
│  │                                      │                            │
│  │  ┌──────────────────────────────┐    │                            │
│  │  │         [Save Settings]      │    │                            │
│  │  └──────────────────────────────┘    │                            │
│  │                                      │                            │
│  │  * Required for PDF letterhead       │                            │
│  └──────────────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
```

**Layout notes:**
- Two-column layout on desktop (form left, live preview right)
- Single-column on mobile (preview collapses below form)
- Preview updates on `onChange` with 300ms debounce (no save needed to see preview)
- "Save Settings" button is at the bottom of the form; sticky on mobile

### 3.3 Logo Upload Component

The logo upload widget is a custom component wrapping Supabase Storage upload:

```
┌──────────────────────────────────────┐
│                                      │
│    [Current logo image]              │
│    128×128px display                 │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  📁 Choose file…             │    │
│  └──────────────────────────────┘    │
│  PNG, JPG, or SVG · Max 2MB         │
│                                      │
│  ● Uploading...    [████████░░] 80%  │  ← during upload
│                                      │
│  ✓ Logo uploaded                     │  ← after success
│                                      │
│  [Remove Logo]  ← only if logo set   │
└──────────────────────────────────────┘
```

**Upload behavior:**
1. User selects file via `<input type="file" accept="image/png,image/jpeg,image/svg+xml">`
2. Client validates: size ≤ 2MB, MIME type is allowed
3. Upload to Supabase Storage at path `firm-logos/{user_id}/logo.{ext}`
4. On success: `user_profiles.logo_url` updated with the public URL
5. Preview panel refreshes to show logo in header

**"Remove Logo" behavior:**
1. DELETE from Supabase Storage: `firm-logos/{user_id}/logo.*`
2. Update `user_profiles.logo_url = NULL`
3. Preview refreshes to show header without logo

### 3.4 Save States

```
[Save Settings]  — default (blue primary button)
[Saving…]        — spinner + "Saving…" text, button disabled (during Supabase update)
[✓ Saved]        — green, fades back to default after 2s
[✗ Save Failed · Retry]  — red, re-enables button
```

### 3.5 First-Time Setup Banner (Dashboard)

When a user has saved at least one case but has not configured firm settings, show a dismissible banner on the Dashboard:

```
┌─────────────────────────────────────────────────────────────────┐
│  💼  Add your firm profile to brand your PDF exports.           │
│      [Set Up Firm Profile]                  [Dismiss for now ×] │
└─────────────────────────────────────────────────────────────────┘
```

Dismissed state stored in `localStorage` key `inh-firm-banner-dismissed`. Reappears if user later deletes their profile.

---

## 4. API / Data Layer

### 4.1 Load Firm Profile

Called on app start (after auth) and on Settings page mount:

```typescript
// lib/firmProfile.ts
import { supabase } from './supabase'
import type { UserProfile } from '@/types/db'
import type { FirmProfile } from '@/types/firm'
import { toFirmProfile } from '@/types/firm'

export async function loadFirmProfile(userId: string): Promise<FirmProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return toFirmProfile(data as UserProfile)
}
```

### 4.2 Save Firm Profile

```typescript
// lib/firmProfile.ts (continued)

export interface FirmProfileInput {
  firm_name: string
  address: string
  phone: string
  email: string
  counsel_name: string
  ibp_roll_no: string
  ptr_no: string
  mcle_compliance_no: string
  // logo_url is handled separately by uploadLogo()
}

export async function saveFirmProfile(
  userId: string,
  input: FirmProfileInput
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      firm_name: input.firm_name.trim(),
      address: input.address.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      counsel_name: input.counsel_name.trim(),
      ibp_roll_no: input.ibp_roll_no.trim(),
      ptr_no: input.ptr_no.trim(),
      mcle_compliance_no: input.mcle_compliance_no.trim(),
    }, { onConflict: 'id' })

  if (error) throw error
}
```

### 4.3 Logo Upload

```typescript
// lib/firmProfile.ts (continued)

const LOGO_BUCKET = 'firm-logos'

export async function uploadLogo(
  userId: string,
  file: File
): Promise<string> {
  // Validate on client before sending
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Logo must be under 2MB')
  }
  const allowed = ['image/png', 'image/jpeg', 'image/svg+xml']
  if (!allowed.includes(file.type)) {
    throw new Error('Logo must be PNG, JPG, or SVG')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `${userId}/logo.${ext}`

  // upsert: replace existing file at same path
  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) throw uploadError

  // Get public URL (bucket is public)
  const { data } = supabase.storage
    .from(LOGO_BUCKET)
    .getPublicUrl(path)

  const publicUrl = data.publicUrl

  // Persist URL to user_profiles
  const { error: dbError } = await supabase
    .from('user_profiles')
    .update({ logo_url: publicUrl })
    .eq('id', userId)

  if (dbError) throw dbError

  return publicUrl
}

export async function removeLogo(userId: string): Promise<void> {
  // List files to find any extension variant (png/jpg/svg)
  const { data: files } = await supabase.storage
    .from(LOGO_BUCKET)
    .list(userId)

  if (files && files.length > 0) {
    const paths = files.map(f => `${userId}/${f.name}`)
    await supabase.storage.from(LOGO_BUCKET).remove(paths)
  }

  // Clear URL in DB
  await supabase
    .from('user_profiles')
    .update({ logo_url: null })
    .eq('id', userId)
}
```

### 4.4 Firm Profile Context (Global Access)

The firm profile is needed anywhere a PDF is generated, so it should be in React context:

```typescript
// context/FirmProfileContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { loadFirmProfile } from '@/lib/firmProfile'
import { useAuth } from '@/hooks/useAuth'
import type { FirmProfile } from '@/types/firm'

interface FirmProfileContextValue {
  firmProfile: FirmProfile | null
  loading: boolean
  refresh: () => Promise<void>
}

const FirmProfileContext = createContext<FirmProfileContextValue>({
  firmProfile: null,
  loading: false,
  refresh: async () => {},
})

export function FirmProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [firmProfile, setFirmProfile] = useState<FirmProfile | null>(null)
  const [loading, setLoading] = useState(false)

  async function refresh() {
    if (!user) { setFirmProfile(null); return }
    setLoading(true)
    try {
      const profile = await loadFirmProfile(user.id)
      setFirmProfile(profile)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [user?.id])

  return (
    <FirmProfileContext.Provider value={{ firmProfile, loading, refresh }}>
      {children}
    </FirmProfileContext.Provider>
  )
}

export function useFirmProfile() {
  return useContext(FirmProfileContext)
}
```

**Usage in ActionsBar (PDF export):**

```typescript
// components/ActionsBar.tsx (modified)
import { useFirmProfile } from '@/context/FirmProfileContext'
import { downloadInheritancePDF } from '@/lib/pdf'

function ActionsBar({ input, output }) {
  const { firmProfile } = useFirmProfile()

  async function handleExportPDF() {
    await downloadInheritancePDF(input, output, firmProfile ?? undefined)
  }
  // ...
}
```

### 4.5 Firm Settings Form Hook

```typescript
// hooks/useFirmSettings.ts
import { useState, useCallback } from 'react'
import { saveFirmProfile, uploadLogo, removeLogo } from '@/lib/firmProfile'
import { useFirmProfile } from '@/context/FirmProfileContext'
import { useAuth } from '@/hooks/useAuth'
import type { FirmProfileInput } from '@/lib/firmProfile'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'
export type UploadState = 'idle' | 'uploading' | 'uploaded' | 'error'

export function useFirmSettings() {
  const { user } = useAuth()
  const { firmProfile, refresh } = useFirmProfile()
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)

  const save = useCallback(async (input: FirmProfileInput) => {
    if (!user) return
    setSaveState('saving')
    try {
      await saveFirmProfile(user.id, input)
      await refresh()
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
    }
  }, [user, refresh])

  const upload = useCallback(async (file: File) => {
    if (!user) return
    setUploadState('uploading')
    setUploadProgress(0)
    try {
      // Supabase storage doesn't emit progress events natively;
      // simulate with a deterministic step for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 20, 80))
      }, 200)
      await uploadLogo(user.id, file)
      clearInterval(progressInterval)
      setUploadProgress(100)
      await refresh()
      setUploadState('uploaded')
    } catch {
      setUploadState('error')
    }
  }, [user, refresh])

  const remove = useCallback(async () => {
    if (!user) return
    await removeLogo(user.id)
    await refresh()
  }, [user, refresh])

  return { firmProfile, save, saveState, upload, uploadState, uploadProgress, remove }
}
```

---

## 5. Integration Points

### 5.1 PDF Export (spec-pdf-export)

The `FirmProfile` type defined in §2.3 above is the contract between this feature and spec-pdf-export. The PDF's `generatePdf(input, output, firmProfile?)` function:

- If `firmProfile` is non-null and `firm_name` is non-empty: renders full firm letterhead on page 1 and attorney credentials in attestation block
- If `firmProfile` is null or `firm_name` is empty: omits letterhead; attestation block shows "—" for firm fields

**Firm header section in PDF (from spec-pdf-export §3.3):**

```
SANTOS & REYES LAW OFFICES
Attorneys and Counselors at Law
4F Salcedo Tower, Legaspi Village, Makati City 1229
+63-2-8888-9999 | info@santosreyes.law
Prepared by: Atty. Maria G. Santos
IBP Roll No. 123456 | PTR No. 7654321, Jan 5, 2026, Makati City
MCLE Compliance No. VII-0012345
Date: March 1, 2026

[Logo if logo_url is non-null — rendered as Image at 120×60pt max dimensions]
```

**Logo rendering in @react-pdf/renderer:**

```tsx
// components/pdf/FirmHeader.tsx
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  logo: { width: 120, height: 60, objectFit: 'contain', marginRight: 12 },
  textBlock: { flex: 1 },
  firmName: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  tagline: { fontSize: 11, fontStyle: 'italic', marginBottom: 4 },
  contactLine: { fontSize: 10, marginBottom: 2 },
  credentialLine: { fontSize: 10 },
})

export function FirmHeader({ firm }: { firm: FirmProfile }) {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        {firm.logo_url && (
          <Image style={styles.logo} src={firm.logo_url} />
        )}
        <View style={styles.textBlock}>
          <Text style={styles.firmName}>{firm.firm_name}</Text>
          <Text style={styles.tagline}>Attorneys and Counselors at Law</Text>
          {firm.firm_address && (
            <Text style={styles.contactLine}>{firm.firm_address}</Text>
          )}
          {(firm.firm_phone || firm.firm_email) && (
            <Text style={styles.contactLine}>
              {[firm.firm_phone, firm.firm_email].filter(Boolean).join(' | ')}
            </Text>
          )}
          {firm.counsel_name && (
            <Text style={styles.credentialLine}>Prepared by: {firm.counsel_name}</Text>
          )}
          {(firm.ibp_roll_no || firm.ptr_no) && (
            <Text style={styles.credentialLine}>
              {[
                firm.ibp_roll_no ? `IBP Roll No. ${firm.ibp_roll_no}` : '',
                firm.ptr_no ? `PTR No. ${firm.ptr_no}` : '',
              ].filter(Boolean).join(' | ')}
            </Text>
          )}
          {firm.mcle_compliance_no && (
            <Text style={styles.credentialLine}>
              MCLE Compliance No. {firm.mcle_compliance_no}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}
```

### 5.2 Auth & Persistence (spec-auth-persistence)

- `user_profiles` table is created by spec-auth-persistence; this feature adds columns via Migration 002
- `FirmProfileProvider` wraps the app at the same level as auth context; requires user to be signed in before loading
- `logo_url` is already a column on `user_profiles` (defined in spec-auth-persistence)

### 5.3 Multi-Seat / Firm Accounts (spec-multi-seat)

In the current spec, firm branding is **per-user** (each attorney has their own profile). When spec-multi-seat is implemented, firm branding will migrate to **per-organization**:

- Organization table will have: `org_name`, `org_address`, `org_phone`, `org_email`, `org_logo_url`
- Attorney credentials (IBP Roll No., PTR No., MCLE No.) remain **per-user** (they are individual credentials)
- `FirmProfile` will be composed: org fields from `organizations`, credential fields from `user_profiles`
- Migration path: existing `user_profiles.firm_name` / `firm_address` becomes source of truth for the org record on first org creation

This is a forward-compatible design: no breaking changes to `FirmProfile` shape — only the source of firm fields changes.

### 5.4 Case Export ZIP (spec-case-export-zip)

The ZIP export will include a PDF generated with the firm's branding. The `loadFirmProfile(userId)` call is made before PDF generation and the result is passed to `downloadInheritancePDF()`.

---

## 6. Edge Cases

### 6.1 Missing / Partial Firm Profile

| Scenario | Behavior |
|----------|----------|
| No firm profile at all (new user) | PDF exports without letterhead; "Set Up Firm Profile" prompt appears |
| Firm name set but counsel credentials empty | PDF shows firm name/address in header but omits IBP/PTR/MCLE lines |
| Logo URL set but URL is broken (deleted from storage) | `@react-pdf/renderer` gracefully skips broken images; firm name and address still render |
| All fields empty | `toFirmProfile()` returns `null`; PDF gets no header |

### 6.2 Logo Upload Failures

| Scenario | Behavior |
|----------|----------|
| File exceeds 2MB | Client-side validation rejects before upload; error: "Logo must be under 2MB" |
| Unsupported file type (e.g., PDF, HEIC) | Client-side validation rejects; error: "Logo must be PNG, JPG, or SVG" |
| Network failure during upload | `uploadState = 'error'`; button re-enables with "Upload failed · Retry" |
| Storage bucket not configured | Same network error UX; backend logs show bucket-not-found; admin must create bucket |
| Logo uploaded but DB update fails | Storage file exists but `logo_url` is not persisted; next upload at same path overwrites (upsert=true); no orphan files accumulate |

### 6.3 Concurrent Edits

| Scenario | Behavior |
|----------|----------|
| Two browser tabs both open firm settings | Last-write-wins (Supabase `updated_at`); no conflict detection needed for settings |
| Firm settings saved while PDF is generating | PDF uses snapshot of `firmProfile` passed at generation time; race condition harmless |

### 6.4 Validation Rules

| Field | Rule |
|-------|------|
| `firm_name` | Max 255 chars; trimmed; required for PDF header to appear |
| `firm_address` | Max 500 chars; trimmed; optional (PDF omits address line if empty) |
| `firm_phone` | Max 50 chars; trimmed; no format validation (international numbers vary) |
| `firm_email` | Max 255 chars; standard email regex validation; optional |
| `counsel_name` | Max 255 chars; trimmed; conventionally prefixed "Atty." but not enforced |
| `ibp_roll_no` | Max 20 chars; trimmed; digits only recommended but not enforced (format may change) |
| `ptr_no` | Max 100 chars; trimmed; free-form (includes city and date: "7654321, Jan 5, 2026, Makati City") |
| `mcle_compliance_no` | Max 50 chars; trimmed; format "VII-NNNNNNN" recommended but not enforced |
| Logo file | Max 2MB; MIME: image/png, image/jpeg, image/svg+xml |

### 6.5 Permissions

| Action | Permission |
|--------|------------|
| View firm settings | Requires auth |
| Save firm profile | Requires auth; user can only save their own profile (RLS on `user_profiles`) |
| Upload logo | Requires auth; Storage RLS restricts to user's own folder |
| View logo in PDF | Public (bucket is public; no auth required for read) |
| Delete firm profile / logo | Requires auth + own record (no cross-user access) |

---

## 7. Dependencies

**Must be built before this feature:**
1. `spec-auth-persistence` — user_profiles table, auth flow, and user_id in scope
2. `spec-pdf-export` — FirmProfile is consumed by the PDF renderer; must define how it's used

**Must install before implementing (in addition to Supabase already installed):**
```bash
# No new npm dependencies required
# @react-pdf/renderer already specified in spec-pdf-export
# @supabase/supabase-js already specified in spec-auth-persistence
```

**Supabase setup steps specific to this feature:**
1. Run `002_firm_branding_fields.sql` migration (adds `ibp_roll_no`, `ptr_no`, `mcle_compliance_no` to user_profiles)
2. Create `firm-logos` storage bucket (public, 2MB limit, PNG/JPG/SVG only)
3. Apply storage RLS policies from §2.2

---

## 8. Acceptance Criteria

### Settings Page
- [ ] Route `/settings/firm` is accessible from the user menu → "Firm Settings"
- [ ] Settings page loads existing firm profile data if previously saved
- [ ] All 8 text fields (firm_name, address, phone, email, counsel_name, ibp_roll_no, ptr_no, mcle_compliance_no) render pre-filled with saved values
- [ ] Preview panel updates live (≤300ms delay) as user types in any field
- [ ] Preview panel shows a realistic representation of the PDF firm header
- [ ] "Save Settings" button shows: idle → saving → saved/error states
- [ ] Saved settings persist across page refreshes and browser sessions
- [ ] Unsaved changes prompt a confirmation dialog if user navigates away (via `beforeunload` or React Router `useBlocker`)

### Logo Upload
- [ ] File picker accepts only PNG, JPG, SVG
- [ ] Files over 2MB are rejected before upload with a user-readable error message
- [ ] Upload progress indicator shows during upload (visual feedback)
- [ ] After successful upload, logo thumbnail displays immediately in settings page
- [ ] After successful upload, logo appears in live PDF preview panel
- [ ] "Remove Logo" button deletes logo from Storage and clears `logo_url` in DB
- [ ] After removal, preview panel shows header without logo

### PDF Integration
- [ ] PDF exported with firm profile shows full firm letterhead on page 1
- [ ] PDF exported without firm profile (null) shows no letterhead; no errors thrown
- [ ] Firm logo renders correctly in PDF (if logo_url is set and URL is reachable)
- [ ] IBP Roll No., PTR No., MCLE Compliance No. appear in attestation block of PDF
- [ ] If `ibp_roll_no` is empty, the IBP line is omitted from PDF (no blank label)
- [ ] If `ptr_no` is empty, the PTR line is omitted from PDF (no blank label)
- [ ] PDF exported from anonymous session (no auth) never shows firm header

### First-Time Setup Prompt
- [ ] Dashboard shows "Add your firm profile" banner when user has ≥1 case but no firm_name set
- [ ] "Set Up Firm Profile" link in banner navigates to `/settings/firm`
- [ ] "Dismiss for now" hides banner for the session (localStorage flag)
- [ ] Banner does NOT appear if firm_name is already configured

### Security
- [ ] User cannot read or write another user's firm profile (RLS on user_profiles)
- [ ] User cannot upload to another user's logo folder (Storage RLS restricts to own folder)
- [ ] Logo files are publicly readable (no auth required to load in PDF)
- [ ] Service role key is never exposed in client code

---

## 9. File Changes Required

| File | Change |
|------|--------|
| `supabase/migrations/002_firm_branding_fields.sql` | NEW — ALTER TABLE user_profiles to add ibp_roll_no, ptr_no, mcle_compliance_no |
| `src/types/firm.ts` | NEW — FirmProfile, FirmProfileDraft interfaces and toFirmProfile() converter |
| `src/lib/firmProfile.ts` | NEW — loadFirmProfile, saveFirmProfile, uploadLogo, removeLogo functions |
| `src/hooks/useFirmSettings.ts` | NEW — Form state, save, upload, remove actions |
| `src/context/FirmProfileContext.tsx` | NEW — FirmProfile context provider and useFirmProfile() hook |
| `src/components/pdf/FirmHeader.tsx` | NEW — @react-pdf/renderer firm header component |
| `src/pages/FirmSettings.tsx` | NEW — Full settings page with form, preview, and logo upload |
| `src/components/LogoUploader.tsx` | NEW — File input + progress + remove UI component |
| `src/App.tsx` | MODIFY — Wrap app in FirmProfileProvider; add `/settings/firm` route |
| `src/components/ActionsBar.tsx` | MODIFY — Pass firmProfile from context to downloadInheritancePDF() |
| `src/pages/Dashboard.tsx` | MODIFY — Add first-time firm profile setup banner |
| `src/components/pdf/InheritanceReportDocument.tsx` | MODIFY — Add FirmHeader component to page 1 of PDF |
