interface ClientInfoCardProps {
  id: string;
  name: string;
  email?: string | null;
  tin?: string | null;
  address?: string | null;
}

export function ClientInfoCard({ name, email, tin, address }: ClientInfoCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-semibold">{name}</h2>
      {email && <p className="text-sm text-muted-foreground">{email}</p>}
      {tin && <p className="text-sm"><span className="font-medium">TIN:</span> {tin}</p>}
      {address && <p className="text-sm text-muted-foreground">{address}</p>}
    </div>
  );
}

export default ClientInfoCard;
