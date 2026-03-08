import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VALIDATION } from '@/lib/validation-messages';

const V = VALIDATION.intake;

interface IspSpeedRequirement {
  courtRange: string;
  fiberMinDown: number;
  fiberMinUp: number;
  cableMinUp: number | null;
  dedicatedMinDown: number;
  dedicatedMinUp: number;
}

const ISP_SPEED_TABLE: IspSpeedRequirement[] = [
  { courtRange: '1–4',   fiberMinDown: 100, fiberMinUp: 50,  cableMinUp: 60,   dedicatedMinDown: 30,  dedicatedMinUp: 30  },
  { courtRange: '5–11',  fiberMinDown: 150, fiberMinUp: 150, cableMinUp: null, dedicatedMinDown: 50,  dedicatedMinUp: 50  },
  { courtRange: '12–19', fiberMinDown: 200, fiberMinUp: 200, cableMinUp: null, dedicatedMinDown: 50,  dedicatedMinUp: 50  },
  { courtRange: '20–24', fiberMinDown: 300, fiberMinUp: 300, cableMinUp: null, dedicatedMinDown: 100, dedicatedMinUp: 100 },
  { courtRange: '25+',   fiberMinDown: 400, fiberMinUp: 400, cableMinUp: null, dedicatedMinDown: 150, dedicatedMinUp: 150 },
];

function getIspSpeedRequirement(courtCount: number): IspSpeedRequirement {
  if (courtCount <= 4)  return ISP_SPEED_TABLE[0];
  if (courtCount <= 11) return ISP_SPEED_TABLE[1];
  if (courtCount <= 19) return ISP_SPEED_TABLE[2];
  if (courtCount <= 24) return ISP_SPEED_TABLE[3];
  return ISP_SPEED_TABLE[4];
}

const ispInfoSchema = z.object({
  isp_provider: z
    .string()
    .min(1, V.isp_provider.required)
    .max(200, V.isp_provider.max),
  has_static_ip: z.boolean(),
  upload_speed_mbps: z.number().min(0, V.internet_upload_mbps.min).nullable(),
  download_speed_mbps: z.number().min(0, V.internet_download_mbps.min).nullable(),
});

export type IspInfoValues = z.infer<typeof ispInfoSchema>;

interface IspInfoStepProps {
  defaultValues?: Partial<IspInfoValues>;
  courtCount: number;
  onNext: (data: IspInfoValues) => void;
}

export function IspInfoStep({ defaultValues, courtCount, onNext }: IspInfoStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IspInfoValues>({
    resolver: zodResolver(ispInfoSchema),
    defaultValues: {
      isp_provider: defaultValues?.isp_provider ?? '',
      has_static_ip: defaultValues?.has_static_ip ?? false,
      upload_speed_mbps: defaultValues?.upload_speed_mbps ?? null,
      download_speed_mbps: defaultValues?.download_speed_mbps ?? null,
    },
  });

  const ispProvider = watch('isp_provider');
  const uploadSpeed = watch('upload_speed_mbps');
  const downloadSpeed = watch('download_speed_mbps');

  const isStarlink = ispProvider.toLowerCase().includes('starlink');

  const req = getIspSpeedRequirement(courtCount);

  const uploadWarning =
    !isStarlink && uploadSpeed !== null && uploadSpeed !== undefined && uploadSpeed < req.fiberMinUp
      ? VALIDATION.intake.isp.upload_fiber(req.fiberMinUp, courtCount)
      : null;

  const downloadWarning =
    !isStarlink &&
    downloadSpeed !== null &&
    downloadSpeed !== undefined &&
    downloadSpeed < req.fiberMinDown
      ? `Download speed ${downloadSpeed} Mbps is below the ${req.fiberMinDown} Mbps minimum for fiber with ${courtCount} courts.`
      : null;

  function onSubmit(data: IspInfoValues) {
    if (isStarlink) return;
    onNext(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {isStarlink && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {VALIDATION.intake.isp.starlink_block}
          </p>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="isp_provider" className="text-sm font-medium">
          ISP Provider
        </label>
        <Input
          id="isp_provider"
          placeholder="e.g. Verizon Fios, Spectrum, AT&T Fiber"
          {...register('isp_provider')}
        />
        {errors.isp_provider && (
          <p className="text-sm text-destructive">{errors.isp_provider.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="has_static_ip"
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          {...register('has_static_ip')}
        />
        <label htmlFor="has_static_ip" className="text-sm font-medium">
          Has Static IP
        </label>
      </div>

      <div className="space-y-1">
        <label htmlFor="upload_speed_mbps" className="text-sm font-medium">
          Upload Speed (Mbps){' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="upload_speed_mbps"
          type="number"
          min={0}
          placeholder="e.g. 100"
          {...register('upload_speed_mbps', {
            setValueAs: (v: string) => (v === '' ? null : parseFloat(v)),
          })}
        />
        {errors.upload_speed_mbps && (
          <p className="text-sm text-destructive">{errors.upload_speed_mbps.message}</p>
        )}
        {uploadWarning && <p className="text-sm text-yellow-600">{uploadWarning}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="download_speed_mbps" className="text-sm font-medium">
          Download Speed (Mbps){' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="download_speed_mbps"
          type="number"
          min={0}
          placeholder="e.g. 200"
          {...register('download_speed_mbps', {
            setValueAs: (v: string) => (v === '' ? null : parseFloat(v)),
          })}
        />
        {errors.download_speed_mbps && (
          <p className="text-sm text-destructive">{errors.download_speed_mbps.message}</p>
        )}
        {downloadWarning && <p className="text-sm text-yellow-600">{downloadWarning}</p>}
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isStarlink}>
          Continue
        </Button>
      </div>
    </form>
  );
}
