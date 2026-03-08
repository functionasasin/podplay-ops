import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VALIDATION } from '@/lib/validation-messages';

const V = VALIDATION.intake;

const venueConfigSchema = z.object({
  venue_address: z
    .string()
    .min(1, V.venue_address.required)
    .max(200, V.venue_address.max),
  court_count: z
    .number()
    .int(V.court_count.int)
    .min(1, V.court_count.min)
    .max(50, V.court_count.max),
  door_count: z
    .number()
    .int(V.door_count.int)
    .min(0, V.door_count.min),
  camera_count: z
    .number()
    .int(V.camera_count.int)
    .min(0, V.camera_count.min),
  has_front_desk: z.boolean(),
  has_pingpod_wifi: z.boolean(),
});

export type VenueConfigValues = z.infer<typeof venueConfigSchema>;

interface VenueConfigStepProps {
  defaultValues?: Partial<VenueConfigValues>;
  onNext: (data: VenueConfigValues) => void;
}

export function VenueConfigStep({ defaultValues, onNext }: VenueConfigStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VenueConfigValues>({
    resolver: zodResolver(venueConfigSchema),
    defaultValues: {
      venue_address: defaultValues?.venue_address ?? '',
      court_count: defaultValues?.court_count ?? 1,
      door_count: defaultValues?.door_count ?? 0,
      camera_count: defaultValues?.camera_count ?? 0,
      has_front_desk: defaultValues?.has_front_desk ?? false,
      has_pingpod_wifi: defaultValues?.has_pingpod_wifi ?? false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-4 p-4">
      <div className="space-y-1">
        <label htmlFor="venue_address" className="text-sm font-medium">
          Venue Address
        </label>
        <Input
          id="venue_address"
          placeholder="Enter venue address"
          className="h-11"
          {...register('venue_address')}
        />
        {errors.venue_address && (
          <p className="text-sm text-destructive">{errors.venue_address.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="court_count" className="text-sm font-medium">
          Court Count
        </label>
        <Input
          id="court_count"
          type="number"
          min={1}
          max={50}
          className="h-11"
          {...register('court_count', { valueAsNumber: true })}
        />
        {errors.court_count && (
          <p className="text-sm text-destructive">{errors.court_count.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="door_count" className="text-sm font-medium">
          Door Count <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="door_count"
          type="number"
          min={0}
          className="h-11"
          {...register('door_count', { valueAsNumber: true })}
        />
        {errors.door_count && (
          <p className="text-sm text-destructive">{errors.door_count.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="camera_count" className="text-sm font-medium">
          Camera Count <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="camera_count"
          type="number"
          min={0}
          className="h-11"
          {...register('camera_count', { valueAsNumber: true })}
        />
        {errors.camera_count && (
          <p className="text-sm text-destructive">{errors.camera_count.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="has_front_desk"
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          {...register('has_front_desk')}
        />
        <label htmlFor="has_front_desk" className="text-sm font-medium">
          Has Front Desk
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="has_pingpod_wifi"
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          {...register('has_pingpod_wifi')}
        />
        <label htmlFor="has_pingpod_wifi" className="text-sm font-medium">
          Has PingPod WiFi
        </label>
      </div>

      <div className="pt-2">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
