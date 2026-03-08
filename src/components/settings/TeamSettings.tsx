import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { VALIDATION } from '@/lib/validation-messages';

const VT = VALIDATION.settings.contact;
const VO = VALIDATION.settings.opex;
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';
import { cn } from '@/lib/utils';
import type { Settings } from '@/services/settingsService';
import { updateSettings } from '@/services/settingsService';
import type { TeamContact } from '@/services/teamContactsService';
import {
  createTeamContact,
  updateTeamContact,
  deactivateTeamContact,
  reactivateTeamContact,
} from '@/services/teamContactsService';

// ─── Department config ────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { value: 'pm',          label: 'PM',          badge: 'bg-blue-100 text-blue-800' },
  { value: 'hardware',    label: 'Hardware',    badge: 'bg-purple-100 text-purple-800' },
  { value: 'operations',  label: 'Operations',  badge: 'bg-gray-100 text-gray-800' },
  { value: 'config',      label: 'Config',      badge: 'bg-orange-100 text-orange-800' },
  { value: 'app',         label: 'App',         badge: 'bg-green-100 text-green-800' },
  { value: 'cs',          label: 'CS',          badge: 'bg-teal-100 text-teal-800' },
  { value: 'engineering', label: 'Engineering', badge: 'bg-red-100 text-red-800' },
] as const;

const deptBadge = (dept: string) =>
  DEPARTMENTS.find((d) => d.value === dept)?.badge ?? 'bg-slate-100 text-slate-800';

const deptLabel = (dept: string) =>
  DEPARTMENTS.find((d) => d.value === dept)?.label ?? dept;

// ─── Support tier pill ────────────────────────────────────────────────────────

function SupportTierPill({ tier }: { tier: number | null | undefined }) {
  if (!tier) return <span className="text-muted-foreground">—</span>;
  const map: Record<number, string> = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-amber-100 text-amber-800',
    3: 'bg-red-100 text-red-800',
  };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', map[tier])}>
      Tier {tier}
    </span>
  );
}

// ─── OpEx form ────────────────────────────────────────────────────────────────

const opexFormSchema = z.object({
  rent_per_year:              z.number().min(0, VO.rent_per_year.min),
  indirect_salaries_per_year: z.number().min(0, VO.indirect_salaries_per_year.min),
});

type OpexFormValues = z.infer<typeof opexFormSchema>;

function OpexSection({ settings }: { settings: Settings }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OpexFormValues>({
    resolver: zodResolver(opexFormSchema),
    defaultValues: {
      rent_per_year:              settings.rent_per_year ?? 27600,
      indirect_salaries_per_year: settings.indirect_salaries_per_year ?? 147000,
    },
  });

  const onSubmit = async (values: OpexFormValues) => {
    try {
      await updateSettings(values);
      toast.success('OpEx settings saved');
    } catch (err: unknown) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="rounded-lg border border-border p-6 space-y-4">
      <h2 className="text-lg font-semibold">HER / OpEx Configuration</h2>
      <p className="text-sm text-muted-foreground">
        These values feed into the Hardware Efficiency Ratio calculation.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Annual Rent */}
          <div>
            <label className="block text-sm font-medium mb-1">Annual Rent</label>
            <input
              {...register('rent_per_year', { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
            {errors.rent_per_year && (
              <p className="text-destructive text-xs mt-1">{errors.rent_per_year.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              NJ lab/office space allocated to hardware OpEx
            </p>
          </div>

          {/* Indirect Salaries */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Indirect Salaries (per year)
            </label>
            <input
              {...register('indirect_salaries_per_year', { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
            {errors.indirect_salaries_per_year && (
              <p className="text-destructive text-xs mt-1">
                {errors.indirect_salaries_per_year.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Annual indirect salary pool allocated to hardware overhead
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground border-l-2 border-border pl-3">
          Individual salary allocations (Niko direct %, Chad indirect %) are entered in the
          Monthly Close workflow on the Financials page, where they are snapshotted per period.
        </p>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save OpEx Settings
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Contact form schema ──────────────────────────────────────────────────────

const contactSchema = z.object({
  name:         z.string().min(1, VT.name.required).max(100, VT.name.max),
  role:         z.string().min(1, VT.role.required).max(200, VT.role.max),
  department:   z.enum(['pm', 'hardware', 'operations', 'config', 'app', 'cs', 'engineering']),
  phone:        z.string().max(30, VT.phone.max).optional().nullable(),
  email:        z.string().email(VT.email.format).optional().nullable().or(z.literal('')),
  contact_via:  z.string().max(100, VT.contact_via.max).optional().nullable(),
  support_tier: z.number().int().min(1, VT.support_tier.range).max(3, VT.support_tier.range).nullable(),
  notes:        z.string().max(1000, VT.notes.max).optional().nullable(),
  slug:         z.string().min(1).max(100),
});

type ContactFormValues = z.infer<typeof contactSchema>;

// ─── Contact sheet ────────────────────────────────────────────────────────────

interface ContactSheetProps {
  contact: TeamContact | null;
  onClose: () => void;
  onSaved: (contact: TeamContact) => void;
}

function ContactSheet({ contact, onClose, onSaved }: ContactSheetProps) {
  const isNew = contact === null;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: isNew
      ? {
          name: '', role: '', department: 'pm', phone: '', email: '',
          contact_via: '', support_tier: null, notes: '', slug: '',
        }
      : {
          name:         contact.name,
          role:         contact.role,
          department:   contact.department as ContactFormValues['department'],
          phone:        contact.phone ?? '',
          email:        contact.email ?? '',
          contact_via:  contact.contact_via ?? '',
          support_tier: contact.support_tier ?? null,
          notes:        contact.notes ?? '',
          slug:         contact.slug,
        },
  });

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const payload = {
        slug:         values.slug,
        name:         values.name,
        role:         values.role,
        department:   values.department,
        phone:        values.phone || null,
        email:        values.email || null,
        contact_via:  values.contact_via || null,
        support_tier: values.support_tier,
        notes:        values.notes || null,
        is_active:    true,
      };
      if (isNew) {
        const created = await createTeamContact(payload);
        toast.success('Contact saved');
        onSaved(created);
      } else {
        const updated = await updateTeamContact(contact.id, payload);
        toast.success('Contact saved');
        onSaved(updated);
      }
      onClose();
    } catch (err: unknown) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex flex-col w-full max-w-[480px] bg-background shadow-xl h-full overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {isNew ? 'Add Team Contact' : 'Edit Team Contact'}
          </h2>
        </div>

        <form
          id="contact-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Slug <span className="text-destructive">*</span>
            </label>
            <input
              {...register('slug')}
              className="w-full border border-border rounded px-3 py-2 text-sm font-mono"
              placeholder="andy"
            />
            {errors.slug && (
              <p className="text-destructive text-xs mt-1">{errors.slug.message}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
            {errors.name && (
              <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Role <span className="text-destructive">*</span>
            </label>
            <input
              {...register('role')}
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
            {errors.role && (
              <p className="text-destructive text-xs mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Department <span className="text-destructive">*</span>
            </label>
            <select
              {...register('department')}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="text-destructive text-xs mt-1">{errors.department.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              {...register('phone')}
              className="w-full border border-border rounded px-3 py-2 text-sm"
              placeholder="917-555-1234"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Contact Via */}
          <div>
            <label className="block text-sm font-medium mb-1">Contact Via</label>
            <input
              {...register('contact_via')}
              className="w-full border border-border rounded px-3 py-2 text-sm"
              placeholder="Via Chad, Slack #installs"
            />
          </div>

          {/* Support Tier */}
          <div>
            <label className="block text-sm font-medium mb-1">Support Tier</label>
            <select
              {...register('support_tier', {
                setValueAs: (v) => (v === '' || v === 'null' ? null : Number(v)),
              })}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
            >
              <option value="null">None</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-border hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="contact-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Contact
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TeamSettingsProps {
  settings: Settings;
  contacts: TeamContact[];
}

export function TeamSettings({ settings, contacts: initialContacts }: TeamSettingsProps) {
  const [contacts, setContacts] = useState<TeamContact[]>(initialContacts);
  const [showInactive, setShowInactive] = useState(false);
  const [sheetContact, setSheetContact] = useState<TeamContact | null | undefined>(undefined);
  const [openKebab, setOpenKebab] = useState<string | null>(null);

  const displayed = showInactive ? contacts : contacts.filter((c) => c.is_active);

  const handleSaved = (saved: TeamContact) => {
    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  };

  const handleDeactivate = async (contact: TeamContact) => {
    try {
      await deactivateTeamContact(contact.id);
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, is_active: false } : c)),
      );
      toast.success('Contact deactivated');
    } catch (err: unknown) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
    setOpenKebab(null);
  };

  const handleReactivate = async (contact: TeamContact) => {
    try {
      await reactivateTeamContact(contact.id);
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, is_active: true } : c)),
      );
      toast.success('Contact reactivated');
    } catch (err: unknown) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
    setOpenKebab(null);
  };

  return (
    <div className="space-y-6">
      {/* OpEx section */}
      <OpexSection settings={settings} />

      {/* Team contacts section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Team Contacts</h2>
          <button
            onClick={() => setSheetContact(null)}
            className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + Add Contact
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>

        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Dept</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Contact Via</th>
                <th className="text-left px-4 py-3 font-medium">Support Tier</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    {(() => {
                      const cfg = EMPTY_STATES.teamContactsEmpty;
                      return (
                        <EmptyState
                          icon={cfg.icon}
                          heading={cfg.heading}
                          description={cfg.description}
                          cta={{ label: cfg.cta.label, onClick: () => setSheetContact(null) }}
                        />
                      );
                    })()}
                  </td>
                </tr>
              ) : (
                displayed.map((contact) => (
                  <tr
                    key={contact.id}
                    className={cn(
                      'border-t border-border hover:bg-muted/50',
                      !contact.is_active && 'opacity-50',
                    )}
                  >
                    {/* Name */}
                    <td className="px-4 py-3 font-medium">
                      {contact.name}
                      {!contact.is_active && (
                        <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-1 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3 text-muted-foreground">
                      <span title={contact.role}>
                        {contact.role.length > 40
                          ? contact.role.slice(0, 40) + '…'
                          : contact.role}
                      </span>
                    </td>

                    {/* Dept */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          deptBadge(contact.department),
                        )}
                      >
                        {deptLabel(contact.department)}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {contact.phone ?? '—'}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {contact.email
                        ? contact.email.length > 25
                          ? contact.email.slice(0, 25) + '…'
                          : contact.email
                        : '—'}
                    </td>

                    {/* Contact Via */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {contact.contact_via ?? '—'}
                    </td>

                    {/* Support Tier */}
                    <td className="px-4 py-3">
                      <SupportTierPill tier={contact.support_tier} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() =>
                          setOpenKebab(openKebab === contact.id ? null : contact.id)
                        }
                        className="p-1 rounded hover:bg-muted"
                        aria-label="Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openKebab === contact.id && (
                        <div className="absolute right-8 top-2 z-10 bg-background border border-border rounded shadow-md min-w-[120px]">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                            onClick={() => {
                              setSheetContact(contact);
                              setOpenKebab(null);
                            }}
                          >
                            Edit
                          </button>
                          {contact.is_active ? (
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted text-destructive"
                              onClick={() => handleDeactivate(contact)}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                              onClick={() => handleReactivate(contact)}
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          {displayed.length} contact{displayed.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Contact sheet */}
      {sheetContact !== undefined && (
        <ContactSheet
          contact={sheetContact}
          onClose={() => setSheetContact(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
