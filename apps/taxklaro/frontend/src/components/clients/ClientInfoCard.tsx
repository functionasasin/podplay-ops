interface ClientInfoCardProps {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  tin?: string | null;
  notes?: string | null;
}

export function ClientInfoCard({ email, phone, tin, notes }: ClientInfoCardProps) {
  return (
    <div className="rounded-xl bg-card shadow-sm p-6 space-y-4">
      <h2 className="font-display text-lg font-normal text-muted-foreground">Client Information</h2>
      <div className="divide-y">
        {email && (
          <div className="py-3 flex gap-4">
            <span className="text-[0.8125rem] font-medium text-muted-foreground w-24 shrink-0">Email</span>
            <span className="text-[0.9375rem]">{email}</span>
          </div>
        )}
        {phone && (
          <div className="py-3 flex gap-4">
            <span className="text-[0.8125rem] font-medium text-muted-foreground w-24 shrink-0">Phone</span>
            <span className="text-[0.9375rem]">{phone}</span>
          </div>
        )}
        {tin && (
          <div className="py-3 flex gap-4">
            <span className="text-[0.8125rem] font-medium text-muted-foreground w-24 shrink-0">TIN</span>
            <span className="text-[0.9375rem] tabular-nums">{tin}</span>
          </div>
        )}
        {notes && (
          <div className="py-3 flex gap-4">
            <span className="text-[0.8125rem] font-medium text-muted-foreground w-24 shrink-0">Notes</span>
            <span className="text-[0.9375rem]">{notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientInfoCard;
