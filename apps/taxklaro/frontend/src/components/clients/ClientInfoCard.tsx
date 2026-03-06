interface ClientInfoCardProps {
  id: string;
  name: string;
  email?: string | null;
  tin?: string | null;
  address?: string | null;
}

export function ClientInfoCard({ name, email, tin, address }: ClientInfoCardProps) {
  return (
    <div className="rounded-xl bg-card shadow-sm p-6 space-y-4">
      <h2 className="font-display text-2xl font-normal">{name}</h2>
      <div className="divide-y">
        {email && (
          <div className="py-3 flex gap-4">
            <span className="text-[0.8125rem] font-medium text-muted-foreground w-24 shrink-0">Email</span>
            <span className="text-[0.9375rem]">{email}</span>
          </div>
        )}
        {tin && (
          <div className="py-3 flex gap-4">
            <span className="text-[0.8125rem] font-medium text-muted-foreground w-24 shrink-0">TIN</span>
            <span className="text-[0.9375rem] tabular-nums">{tin}</span>
          </div>
        )}
        {address && (
          <div className="py-3 flex gap-4">
            <span className="text-[0.8125rem] font-medium text-muted-foreground w-24 shrink-0">Address</span>
            <span className="text-[0.9375rem]">{address}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientInfoCard;
