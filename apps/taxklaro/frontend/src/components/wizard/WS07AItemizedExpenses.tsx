import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PesoInput } from '@/components/shared/PesoInput';
import type { WizardFormData } from '@/types/wizard';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function parseAmt(v: string | undefined): number {
  if (!v) return 0;
  return parseFloat(v.replace(/,/g, '')) || 0;
}

function fmt(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ZERO = '0.00';

export function WS07AItemizedExpenses({ data, onChange, onNext, onBack }: Props) {
  const ie = data.itemizedExpenses ?? {};
  const [salariesAndWages, setSalariesAndWages] = useState(ie.salariesAndWages ?? ZERO);
  const [sssPhilhealthPagibigEmployerShare, setSss] = useState(ie.sssPhilhealthPagibigEmployerShare ?? ZERO);
  const [rent, setRent] = useState(ie.rent ?? ZERO);
  const [utilities, setUtilities] = useState(ie.utilities ?? ZERO);
  const [communication, setCommunication] = useState(ie.communication ?? ZERO);
  const [officeSupplies, setOfficeSupplies] = useState(ie.officeSupplies ?? ZERO);
  const [professionalFeesPaid, setProfessionalFeesPaid] = useState(ie.professionalFeesPaid ?? ZERO);
  const [travelTransportation, setTravelTransportation] = useState(ie.travelTransportation ?? ZERO);
  const [insurancePremiums, setInsurancePremiums] = useState(ie.insurancePremiums ?? ZERO);
  const [taxesAndLicenses, setTaxesAndLicenses] = useState(ie.taxesAndLicenses ?? ZERO);
  const [entertainmentRepresentation, setEntertainment] = useState(ie.entertainmentRepresentation ?? ZERO);
  const [homeOfficeExpense, setHomeOfficeExpense] = useState(ie.homeOfficeExpense ?? ZERO);
  const [homeOfficeExclusiveUse, setHomeOfficeExclusiveUse] = useState(ie.homeOfficeExclusiveUse ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const grossAmt = parseAmt(data.grossReceipts);
  const returnsAmt = parseAmt(data.salesReturnsAllowances);
  const entertainmentAmt = parseAmt(entertainmentRepresentation);
  const homeOfficeAmt = parseAmt(homeOfficeExpense);
  const entertainmentCap = (grossAmt - returnsAmt) * 0.01;

  const fields: Array<{ key: string; label: string; help: string; val: string; set: (v: string) => void }> = [
    { key: 'salariesAndWages', label: 'Salaries and wages paid to employees', help: 'Total gross salaries and wages you paid to your employees or helpers during the year. Do NOT include your own compensation.', val: salariesAndWages, set: setSalariesAndWages },
    { key: 'sss', label: "Employer's share of SSS, PhilHealth, and Pag-IBIG contributions", help: "Only the mandatory employer's share paid for your employees is deductible. The employee's share is not your expense. Your own voluntary contributions as a self-employed individual are NOT deductible under this line.", val: sssPhilhealthPagibigEmployerShare, set: setSss },
    { key: 'rent', label: 'Office or workspace rent', help: 'Rent paid for your dedicated office space, co-working desk, or business premises. For home offices, use the \'Home office\' field instead.', val: rent, set: setRent },
    { key: 'utilities', label: 'Utilities (electricity, water — business portion)', help: 'Electricity and water bills attributable to your business operations. If you work from home, enter only the business-use portion.', val: utilities, set: setUtilities },
    { key: 'communication', label: 'Communication and internet costs (business portion)', help: 'Phone, mobile load, and internet subscription costs for business use. If your internet is used for both personal and business purposes, enter only the business portion.', val: communication, set: setCommunication },
    { key: 'officeSupplies', label: 'Office supplies and materials', help: 'Stationery, printer ink and paper, small tools, and other consumable supplies used in your business. Do NOT include computers or equipment lasting more than one year — those are depreciated.', val: officeSupplies, set: setOfficeSupplies },
    { key: 'professionalFeesPaid', label: 'Professional fees paid to others', help: 'Fees paid to accountants, lawyers, consultants, subcontractors, or other professionals who helped your business. Do NOT include your own professional income here.', val: professionalFeesPaid, set: setProfessionalFeesPaid },
    { key: 'travelTransportation', label: 'Business travel and transportation', help: 'Transportation costs for business-related travel: fuel, parking, Grab/taxi rides to client sites, airfare and hotel for business trips within the Philippines. Personal travel is NOT deductible.', val: travelTransportation, set: setTravelTransportation },
    { key: 'insurancePremiums', label: 'Business insurance premiums', help: 'Premiums for business insurance policies: general liability, professional indemnity, property insurance on business assets. Life insurance is deductible ONLY if the death benefit goes to the business, not to your family.', val: insurancePremiums, set: setInsurancePremiums },
    { key: 'taxesAndLicenses', label: 'Business taxes and licenses (excluding income tax)', help: 'Business registration fees (barangay, municipal, city), professional tax receipts (PTR), documentary stamp taxes paid, and other taxes that are NOT income tax. Do NOT include your income tax or percentage tax here.', val: taxesAndLicenses, set: setTaxesAndLicenses },
  ];

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      if (parseAmt(f.val) < 0) errs[f.key] = 'Amount cannot be negative.';
    }
    if (entertainmentAmt < 0) errs.entertainment = 'Amount cannot be negative.';
    if (homeOfficeAmt < 0) errs.homeOffice = 'Amount cannot be negative.';
    if (homeOfficeAmt > 0 && !homeOfficeExclusiveUse) {
      // advisory only — not a hard error per spec
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    onChange({
      itemizedExpenses: {
        ...ie,
        salariesAndWages,
        sssPhilhealthPagibigEmployerShare,
        rent,
        utilities,
        communication,
        officeSupplies,
        professionalFeesPaid,
        travelTransportation,
        insurancePremiums,
        taxesAndLicenses,
        entertainmentRepresentation,
        homeOfficeExpense,
        homeOfficeExclusiveUse,
      },
    });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">Your business expenses — General costs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the amounts you spent on your business this year. Enter ₱0 for any category that
          doesn't apply to you. All deductions are subject to BIR rules — the engine applies the
          correct caps and rules automatically.
        </p>
      </div>

      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <Label>{f.label}</Label>
          <PesoInput value={f.val} onChange={(v) => { f.set(v); setErrors((e) => ({ ...e, [f.key]: '' })); }} placeholder="0.00" />
          <p className="text-xs text-muted-foreground">{f.help}</p>
          {errors[f.key] && <p className="text-sm text-destructive">{errors[f.key]}</p>}
        </div>
      ))}

      <div className="space-y-1">
        <Label>Entertainment, meals, and representation expenses</Label>
        <PesoInput
          value={entertainmentRepresentation}
          onChange={(v) => { setEntertainment(v); setErrors((e) => ({ ...e, entertainment: '' })); }}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground">
          Client meals, entertainment costs, and gifts spent for business development. Important: the
          BIR limits this deduction to 1% of your net revenue (for service businesses) or 0.5% of
          net sales (for traders). The engine automatically computes the cap. Enter your actual
          spending — the engine applies the cap.
        </p>
        {errors.entertainment && <p className="text-sm text-destructive">{errors.entertainment}</p>}
        {entertainmentAmt > 0 && (
          <Alert className="border-blue-400 bg-blue-50 text-blue-900">
            <AlertDescription>
              The BIR caps entertainment deductions at 1% of net revenue for service providers. Your
              estimated cap is ₱{fmt(entertainmentCap)}. If you entered more than this, the engine
              will automatically reduce your deductible amount to the cap.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-1">
        <Label>Home office expense (monthly rent or mortgage interest)</Label>
        <PesoInput
          value={homeOfficeExpense}
          onChange={(v) => { setHomeOfficeExpense(v); setErrors((e) => ({ ...e, homeOffice: '' })); }}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground">
          If you work from home and have a space used exclusively for business (a dedicated room, not
          a shared living area), enter the business-use portion of your monthly home rent or mortgage
          interest × 12. Example: if your rent is ₱15,000/month and your home office is 15% of your
          home's total floor area, enter ₱15,000 × 12 × 0.15 = ₱27,000.
        </p>
        {errors.homeOffice && <p className="text-sm text-destructive">{errors.homeOffice}</p>}
      </div>

      {homeOfficeAmt > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Switch
              id="home-office-exclusive"
              checked={homeOfficeExclusiveUse}
              onCheckedChange={setHomeOfficeExclusiveUse}
            />
            <Label htmlFor="home-office-exclusive">
              Is this space used exclusively and regularly for business?
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            BIR requires the space to be used EXCLUSIVELY for business — meaning you do no personal
            activities there. A dedicated home office room qualifies. A dining table, bedroom, or
            shared living space does NOT qualify even if you work there regularly.
          </p>
          {!homeOfficeExclusiveUse && (
            <Alert className="border-amber-400 bg-amber-50 text-amber-900">
              <AlertDescription>
                Since the space is not exclusively used for business, the BIR home office deduction
                does NOT apply. Your home office expense of ₱{fmt(homeOfficeAmt)} will NOT be
                deducted.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="h-11 px-5">Back</Button>
        <Button onClick={handleNext} className="h-11 px-6">Continue</Button>
      </div>
    </div>
  );
}

export default WS07AItemizedExpenses;
