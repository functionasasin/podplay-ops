# Current Stage: 1 (Project Scaffold)

## Spec Sections
- No spec needed — scaffold from tech stack requirements
- Tech: Vite + React 18 + TypeScript + Tailwind CSS 4 + React Hook Form + Zod + Recharts + Vitest

## Test Results (updated by loop — iteration 13)
```

[1m[46m RUN [49m[22m [36mv4.0.18 [39m[90m/home/clsandoval/cs/monorepo/loops/inheritance-frontend-forward/app[39m

 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mRelationship enum[2m > [22mhas exactly 11 variants[32m 4[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mRelationship enum[2m > [22mcontains all expected PascalCase variants[32m 2[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mFiliationProof enum[2m > [22mhas exactly 6 variants[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mFiliationProof enum[2m > [22mcontains all expected variants[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mAdoptionRegime enum[2m > [22mhas exactly 2 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mAdoptionRegime enum[2m > [22mcontains Ra8552 and Ra11642[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mLineOfDescent enum[2m > [22mhas exactly 2 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mLineOfDescent enum[2m > [22mcontains Paternal and Maternal[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEffectiveCategory enum[2m > [22mhas exactly 5 variants[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEffectiveCategory enum[2m > [22mcontains all group variants[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mInheritanceMode enum[2m > [22mhas exactly 2 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mInheritanceMode enum[2m > [22mcontains OwnRight and Representation[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mBloodType enum[2m > [22mhas exactly 2 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mBloodType enum[2m > [22mcontains Full and Half[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSuccessionType enum[2m > [22mhas exactly 4 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSuccessionType enum[2m > [22mcontains all succession types[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mScenarioCode enum[2m > [22mhas exactly 31 variants (16 testate + 15 intestate)[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mScenarioCode enum[2m > [22mcontains all T-codes[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mScenarioCode enum[2m > [22mcontains all I-codes[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mScenarioCode enum[2m > [22mT5a and T5b have lowercase suffixes[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mConditionType enum[2m > [22mhas exactly 3 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mConditionType enum[2m > [22mcontains Suspensive, Resolutory, Modal[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mConditionStatus enum[2m > [22mhas exactly 4 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mConditionStatus enum[2m > [22mcontains all statuses[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSubstitutionType enum[2m > [22mhas exactly 3 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSubstitutionType enum[2m > [22mcontains Simple, Reciprocal, Fideicommissary[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSubstitutionTrigger enum[2m > [22mhas exactly 3 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSubstitutionTrigger enum[2m > [22mcontains Predecease, Renunciation, Incapacity[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mFideicommissaryValidationResult enum[2m > [22mhas exactly 3 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mFideicommissaryValidationResult enum[2m > [22mcontains Valid, Invalid, PartialValid[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDisinheritanceCause enum[2m > [22mhas exactly 22 variants (8 Child + 8 Parent + 6 Spouse)[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDisinheritanceCause enum[2m > [22mhas 8 Child causes (Art. 919)[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDisinheritanceCause enum[2m > [22mhas 8 Parent causes (Art. 920)[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDisinheritanceCause enum[2m > [22mhas 6 Spouse causes (Art. 921)[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDisinheritanceCause enum[2m > [22mall variants use PascalCase[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mpesosToCentavos[2m > [22mconverts 500 pesos to 50000 centavos[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mpesosToCentavos[2m > [22mconverts 0 pesos to 0 centavos[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mpesosToCentavos[2m > [22mconverts 1 peso to 100 centavos[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mpesosToCentavos[2m > [22mhandles decimal pesos (500.25 -> 50025)[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mpesosToCentavos[2m > [22mrounds to nearest centavo for floating-point imprecision[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mpesosToCentavos[2m > [22mhandles large amounts[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mcentavosToPesos[2m > [22mconverts 50025 centavos to 500.25 pesos[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mcentavosToPesos[2m > [22mconverts 0 centavos to 0 pesos[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mcentavosToPesos[2m > [22mconverts 100 centavos to 1 peso[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mcentavosToPesos[2m > [22maccepts string centavos[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mcentavosToPesos[2m > [22mconverts 100000000 centavos to 1000000 pesos[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mformatPeso[2m > [22mformats 500000000 centavos as ₱5,000,000[32m 25[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mformatPeso[2m > [22mformats 50025 centavos as ₱500.25[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mformatPeso[2m > [22mformats 0 centavos as ₱0[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mformatPeso[2m > [22mformats 100 centavos as ₱1[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mformatPeso[2m > [22momits centavos when they are zero[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mformatPeso[2m > [22malways shows 2 digits for non-zero centavos[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mformatPeso[2m > [22muses comma-separated thousands[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mformatPeso[2m > [22mincludes ₱ prefix[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mformatPeso[2m > [22maccepts string centavos for large values[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mformatPeso[2m > [22mhandles BigInt-safe boundary correctly[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mserializeCentavos[2m > [22mreturns number for safe integers[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mserializeCentavos[2m > [22mreturns number for zero[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mserializeCentavos[2m > [22mreturns string for BigInt exceeding MAX_SAFE_INTEGER[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mserializeCentavos[2m > [22mreturns number for BigInt within safe range[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mfracToString[2m > [22mconverts 1/2 to '1/2'[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mfracToString[2m > [22mconverts 1/4 to '1/4'[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mfracToString[2m > [22mconverts 3/8 to '3/8'[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mfracToString[2m > [22mhandles 0 numerator[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mstringToFrac[2m > [22mparses '1/2' to {numer: 1, denom: 2}[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mstringToFrac[2m > [22mparses '1/4' to {numer: 1, denom: 4}[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mstringToFrac[2m > [22mparses '3/8' to {numer: 3, denom: 8}[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mstringToFrac[2m > [22mroundtrips with fracToString[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEFFECTIVE_CATEGORY_LABELS[2m > [22mhas a label for every EffectiveCategory[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEFFECTIVE_CATEGORY_LABELS[2m > [22mmaps LegitimateChildGroup to 'Legitimate Child'[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEFFECTIVE_CATEGORY_LABELS[2m > [22mmaps SurvivingSpouseGroup to 'Surviving Spouse'[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSUCCESSION_TYPE_LABELS[2m > [22mhas a label for every SuccessionType[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSUCCESSION_TYPE_LABELS[2m > [22mmaps Intestate to 'Intestate Succession'[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mWARNING_SEVERITY[2m > [22mmaps preterition to error[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mWARNING_SEVERITY[2m > [22mmaps inofficiousness to warning[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mWARNING_SEVERITY[2m > [22mmaps unknown_donee to info[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mWARNING_SEVERITY[2m > [22mmaps max_restarts to error[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEngineInput structure[2m > [22mrequires all 6 top-level fields[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEngineInput structure[2m > [22maccepts will: null for intestate succession[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEngineInput structure[2m > [22maccepts a Will object for testate succession[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mPerson structure[2m > [22mrequires id, name, and relationship_to_decedent[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mPerson structure[2m > [22mhas 15 fields[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mPerson structure[2m > [22maccepts adoption record for AdoptedChild[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDecedent structure[2m > [22mhas 11 fields[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDecedent structure[2m > [22maccepts null date_of_marriage when not married[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mMoney structure[2m > [22maccepts number centavos[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mMoney structure[2m > [22maccepts string centavos for large values[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDonation structure[2m > [22mhas 11 exemption flags[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEngineOutput structure[2m > [22mhas all required fields[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mInheritanceShare structure[2m > [22mhas all money fields as Money type[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mHeirNarrative structure[2m > [22mhas required fields[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSerialization formats[2m > [22mMoney uses centavos field[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSerialization formats[2m > [22mShareSpec unit variant serializes as bare string[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSerialization formats[2m > [22mShareSpec Fraction serializes as tagged object with string frac[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSerialization formats[2m > [22mLegacySpec GenericClass serializes as 2-tuple[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSerialization formats[2m > [22mDeviseSpec FractionalInterest serializes as 2-tuple[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSerialization formats[2m > [22mwill field is null for intestate[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSerialization formats[2m > [22menums serialize as PascalCase strings[32m 0[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mcompute() return type[2m > [22mreturns an EngineOutput that passes Zod validation[32m 41[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mcompute() return type[2m > [22mreturns an object with all required EngineOutput fields[32m 2[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mcompute() return type[2m > [22mreturns arrays for per_heir_shares, narratives, warnings[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I-prefix scenario for intestate input (will=null)[32m 2[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I1 for single LC intestate[32m 4[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I2 for LC + spouse intestate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I3 for LC + IC intestate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I4 for LC + IC + spouse intestate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I5 for ascendants only intestate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I6 for ascendants + spouse intestate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I7 for IC only intestate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I8 for IC + spouse intestate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I11 for spouse only intestate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I13 for siblings only intestate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mintestate scenarios[2m > [22mreturns I15 for empty family tree (escheat)[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mtestate scenarios[2m > [22mreturns T-prefix scenario for testate input[32m 2[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mtestate scenarios[2m > [22mreturns T1 for LC only testate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mtestate scenarios[2m > [22mreturns T2 for 1 LC + spouse testate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mtestate scenarios[2m > [22mreturns T3 for 2+ LC + spouse testate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mtestate scenarios[2m > [22mreturns T13 for no compulsory heirs testate[32m 0[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mtestate scenarios[2m > [22mreturns T6 for ascendants only testate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22minvalid input[2m > [22mthrows for input that fails EngineInputSchema[32m 6[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22minvalid input[2m > [22mthrows for duplicate person IDs[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22minvalid input[2m > [22mthrows for multiple SurvivingSpouse[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22minvalid input[2m > [22mthrows for will date after death date[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mshares per heir[2m > [22mreturns one share entry per heir in family_tree[32m 2[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mshares per heir[2m > [22meach share has the correct heir_id from family_tree[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mshares per heir[2m > [22meach share has required Money fields[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mshares per heir[2m > [22meach share has heir_category as valid EffectiveCategory[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mshares per heir[2m > [22mmaps LegitimateChild to LegitimateChildGroup category[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mshares per heir[2m > [22mmaps AdoptedChild to LegitimateChildGroup category[32m 2[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mshares per heir[2m > [22mmaps IllegitimateChild to IllegitimateChildGroup category[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mshares per heir[2m > [22mmaps SurvivingSpouse to SurvivingSpouseGroup category[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mshares per heir[2m > [22mreturns empty shares for escheat scenario (I15)[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mshares per heir[2m > [22mshares have inherits_by defaulting to OwnRight[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mnarratives per heir[2m > [22mreturns one narrative entry per heir in family_tree[32m 2[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mnarratives per heir[2m > [22meach narrative has matching heir_id from shares[32m 2[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mnarratives per heir[2m > [22mnarrative text contains Markdown bold markers[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mnarratives per heir[2m > [22mnarrative has non-empty heir_category_label[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mnarratives per heir[2m > [22mnarrative heir_name matches the input person name[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mnarratives per heir[2m > [22mreturns empty narratives for escheat scenario[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mcomputation log[2m > [22mhas at least one step entry[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mcomputation log[2m > [22mfinal_scenario matches scenario_code[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mcomputation log[2m > [22mtotal_restarts is a non-negative integer[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mcomputation log[2m > [22mstep entry has step_number, step_name, description[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mwarnings[2m > [22mreturns warnings as an array (may be empty)[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mformatPeso on output amounts[2m > [22mcorrectly formats output centavo amounts from shares[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mformatPeso on output amounts[2m > [22mformatPeso formats 500000000 centavos as ₱5,000,000[32m 0[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mformatPeso on output amounts[2m > [22mformatPeso formats 50025 centavos as ₱500.25[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22maccepts valid ISO-8601 date 2026-01-15[32m 3[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22maccepts valid date 2000-12-31[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects date with slash format 2026/01/15[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects date with dot format 2026.01.15[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects empty string[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects non-string input[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects invalid calendar date 2026-02-30[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects date without leading zeros 2026-1-5[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22maccepts valid fraction "1/2"[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22maccepts "3/8"[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22maccepts "0/1" (zero numerator)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22mrejects "1:2" (wrong separator)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22mrejects "1/0" (zero denominator)[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22mrejects non-string input[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22mrejects empty string[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22mrejects negative numerator "-1/2"[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFractionalInterestFracSchema[2m > [22maccepts "1/2" (fraction <= 1)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFractionalInterestFracSchema[2m > [22maccepts "1/1" (exactly 100%)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFractionalInterestFracSchema[2m > [22mrejects "3/2" (fraction > 1, exceeds 100%)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22maccepts positive integer[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22maccepts zero[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22maccepts string representation of large number[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22mrejects negative integer[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22mrejects floating point number[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22mrejects string with non-digit characters[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22mrejects negative string[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mMoneySchema[2m > [22maccepts valid money with number centavos[32m 2[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mMoneySchema[2m > [22maccepts valid money with string centavos[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mMoneySchema[2m > [22mrejects money with negative centavos[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mMoneySchema[2m > [22mrejects missing centavos field[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mMoneySchema[2m > [22mrejects money as bare number (must be object)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mRelationshipSchema[2m > [22maccepts all 11 relationship variants[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mRelationshipSchema[2m > [22mrejects snake_case variant[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mRelationshipSchema[2m > [22mrejects unknown relationship[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFiliationProofSchema[2m > [22maccepts all 6 proof variants[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionRegimeSchema[2m > [22maccepts Ra8552 and Ra11642[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionRegimeSchema[2m > [22mrejects uppercase RA8552[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLineOfDescentSchema[2m > [22maccepts Paternal and Maternal[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mBloodTypeSchema[2m > [22maccepts Full and Half[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDisinheritanceCauseSchema[2m > [22maccepts all 22 causes (8 Child + 8 Parent + 6 Spouse)[32m 3[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mScenarioCodeSchema[2m > [22maccepts T-codes and I-codes from import[32m 10[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts unit variant "EntireFreePort" as bare string[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts unit variant "EqualWithOthers" as bare string[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts unit variant "EntireEstate"[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts unit variant "Unspecified"[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts unit variant "Residuary"[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts Fraction tagged object {"Fraction": "1/2"}[32m 3[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22mrejects Fraction with object value instead of string[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22mrejects tagged object {"EntireFreePort": null}[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22maccepts FixedAmount with valid money[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22maccepts SpecificAsset with string ID[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22maccepts GenericClass as 2-tuple [description, money][32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22mrejects GenericClass as object instead of tuple[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22mrejects FixedAmount with zero centavos[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22mrejects SpecificAsset with empty string[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDeviseSpecSchema[2m > [22maccepts SpecificProperty with string ID[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDeviseSpecSchema[2m > [22maccepts FractionalInterest as 2-tuple [assetId, frac][32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDeviseSpecSchema[2m > [22mrejects FractionalInterest with fraction > 1[32m 2[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDeviseSpecSchema[2m > [22mrejects FractionalInterest as object instead of tuple[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mHeirReferenceSchema[2m > [22maccepts valid individual heir reference[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mHeirReferenceSchema[2m > [22maccepts null person_id for stranger[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mHeirReferenceSchema[2m > [22mrejects collective institution without class_designation[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mHeirReferenceSchema[2m > [22mrejects collective institution with person_id set[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mHeirReferenceSchema[2m > [22mrejects empty name[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionSchema[2m > [22maccepts valid adoption record[32m 2[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionSchema[2m > [22mrejects stepparent adoption without biological_parent_spouse[32m 3[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionSchema[2m > [22mrejects rescinded adoption without rescission_date[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionSchema[2m > [22mrejects rescission_date before decree_date[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionSchema[2m > [22maccepts stepparent adoption with biological_parent_spouse[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22maccepts valid LegitimateChild person[32m 2[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects AdoptedChild without adoption record[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22maccepts AdoptedChild with valid adoption record[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects IllegitimateChild with filiation_proved=false (warning issue)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22maccepts IllegitimateChild with filiation_proved=true and proof type[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects IllegitimateChild with filiation_proved=true but no proof type[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects Sibling without blood_type[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22maccepts Sibling with blood_type Full[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects LegitimateParent without line[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22maccepts LegitimateParent with Paternal line[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects LegitimateAscendant without line[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects non-spouse person with is_guilty_party_in_legal_separation=true[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects person who is not unworthy but has unworthiness_condoned=true[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects SurvivingSpouse with degree != 1[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects LegitimateParent with degree != 1[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects degree > 5 (Art. 1010)[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects person ID with spaces[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects empty person name[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDecedentSchema[2m > [22maccepts valid decedent[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDecedentSchema[2m > [22mrejects married decedent without date_of_marriage[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDecedentSchema[2m > [22maccepts unmarried decedent with null date_of_marriage[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDecedentSchema[2m > [22mrejects negative years_of_cohabitation[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDecedentSchema[2m > [22mrejects invalid date_of_death format[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22maccepts valid donation[32m 2[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects donation with multiple exemption flags active[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects stranger donation with recipient_heir_id set[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects non-stranger donation without recipient_heir_id[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22maccepts stranger donation with null recipient_heir_id[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects professional_expense_parent_required when is_professional_expense=false[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects imputed_savings when is_professional_expense=false[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects imputed_savings when parent_required=false[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22maccepts professional expense with full cascade[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects donation with zero value[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDisinheritanceSchema[2m > [22maccepts valid disinheritance[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDisinheritanceSchema[2m > [22mrejects disinheritance with null person_id in heir_reference[32m 0[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mformatPeso on output amounts[2m > [22mformatPeso formats 0 centavos as ₱0[32m 0[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mmock distribution[2m > [22mdistributes estate equally among LC heirs in intestate[32m 1[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mmock distribution[2m > [22msingle heir gets the full estate[32m 3[2mms[22m[39m
 [32m✓[39m src/wasm/__tests__/bridge.test.ts[2m > [22mwasm bridge[2m > [22mshares and narratives consistency[2m > [22mevery share heir_id has a matching narrative[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineConfigSchema[2m > [22maccepts valid config with defaults[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineConfigSchema[2m > [22mrejects max_pipeline_restarts = 0[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineConfigSchema[2m > [22mrejects max_pipeline_restarts > 100[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22maccepts valid intestate EngineInput[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22maccepts valid testate EngineInput[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects will date_executed after date_of_death[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects duplicate person IDs in family_tree[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects multiple SurvivingSpouse in family_tree[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22maccepts empty family_tree (escheat scenario)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects donation date after decedent death date[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects donation referencing non-existent heir[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects institution referencing non-existent person[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects multiple residuary institutions[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects disinheritance referencing non-existent person[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22maccepts single SurvivingSpouse[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCHILD_CAUSES[2m > [22mhas exactly 8 child causes[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCHILD_CAUSES[2m > [22mall start with 'Child' prefix[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPARENT_CAUSES[2m > [22mhas exactly 8 parent causes[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPARENT_CAUSES[2m > [22mall start with 'Parent' prefix[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mSPOUSE_CAUSES[2m > [22mhas exactly 6 spouse causes[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mSPOUSE_CAUSES[2m > [22mall start with 'Spouse' prefix[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mmaps LegitimateChild to CHILD_CAUSES[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mmaps AdoptedChild to CHILD_CAUSES[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mmaps SurvivingSpouse to SPOUSE_CAUSES[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mmaps LegitimateParent to PARENT_CAUSES[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mdoes not map Sibling (not disinheritable)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mdoes not map Stranger (not disinheritable)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps preterition to error[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps inofficiousness to warning[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps unknown_donee to info[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps max_restarts to error[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps disinheritance to warning[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps vacancy_unresolved to warning[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mSurvivingSpouse with is_guilty_party should issue error on person[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22munworthy heir not condoned should issue warning on person[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mperson children referencing non-existent IDs should be caught at input level[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mwill with all empty arrays should parse (empty will is valid but warned)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mConditionSchema accepts valid condition[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mConditionSchema rejects empty description[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mInstitutionOfHeirSchema accepts valid institution[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mInstitutionOfHeirSchema rejects empty ID[32m 1[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mrendering[2m > [22mrenders the estate step container[32m 76[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders name input (Full Name)[32m 79[2mms[22m[39m
[31m   → Unable to find a label with the text of: /full name/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders relationship dropdown[32m 14[2mms[22m[39m
[31m   → Unable to find a label with the text of: /relationship to decedent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mrenders the adoption sub-form container[32m 57[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mrenders decree date input[32m 23[2mms[22m[39m
[31m   → Unable to find a label with the text of: /adoption decree date/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mrenders adoption law select (regime)[32m 10[2mms[22m[39m
[31m   → Unable to find a label with the text of: /adoption law/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mstep definitions[2m > [22mhas exactly 6 wizard steps[32m 3[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mstep definitions[2m > [22mhas correct step keys in order[32m 1[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mstep definitions[2m > [22mhas correct step labels[32m 1[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mstep definitions[2m > [22mmarks only the Will step as conditional[32m 1[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mrendering[2m > [22mrenders without crashing[32m 86[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mrendering[2m > [22mrenders with the correct label[32m 62[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mrendering[2m > [22mrenders a date input element[32m 19[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mrendering[2m > [22mdisplays error message when provided[32m 15[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mrendering[2m > [22mrenders the filiation section container[32m 50[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mrendering[2m > [22mrenders "Filiation Proved" toggle[32m 25[2mms[22m[39m
[31m   → Unable to find a label with the text of: /filiation proved/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mrendering[2m > [22mdefaults filiation_proved to true[32m 11[2mms[22m[39m
[31m   → Unable to find a label with the text of: /filiation proved/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mfiliation_proved = true[2m > [22mshows proof type dropdown when filiation_proved is true[32m 11[2mms[22m[39m
[31m   → Unable to find a label with the text of: /proof of filiation/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mrendering — always visible fields[2m > [22mrenders the decedent step container[32m 84[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mrendering[2m > [22mrenders a MoneyInput for net distributable estate[32m 24[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mrendering[2m > [22mrenders peso prefix symbol[32m 22[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mrendering[2m > [22mrenders succession type toggle/radio with Intestate and Testate options[32m 23[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mrendering[2m > [22mrenders estate hint text[32m 14[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mhasWill toggle[2m > [22mdefaults to intestate (hasWill = false)[32m 21[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mrenders stepparent adoption toggle[32m 10[2mms[22m[39m
[31m   → Unable to find a label with the text of: /stepparent adoption/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mrenders adoption rescinded toggle[32m 12[2mms[22m[39m
[31m   → Unable to find a label with the text of: /adoption rescinded/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mregime select has Ra8552 and Ra11642 options[32m 17[2mms[22m[39m
[31m   → Unable to find an element with the text: /Ra8552/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mdefaults regime to Ra8552[32m 11[2mms[22m[39m
[31m   → Unable to find a label with the text of: /adoption law/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mstepparent adoption cascade[2m > [22mdoes NOT show biological parent spouse picker when stepparent=false[32m 7[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mstepparent adoption cascade[2m > [22mshows biological parent spouse picker when stepparent=true[32m 13[2mms[22m[39m
[31m   → Unable to find a label with the text of: /biological parent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mstepparent adoption cascade[2m > [22mtoggling stepparent on reveals biological parent picker[32m 14[2mms[22m[39m
[31m   → Unable to find a label with the text of: /stepparent adoption/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mstepparent adoption cascade[2m > [22mtoggling stepparent off hides biological parent picker[32m 10[2mms[22m[39m
[31m   → Unable to find a label with the text of: /biological parent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrescission cascade[2m > [22mdoes NOT show rescission date when is_rescinded=false[32m 7[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mrendering[2m > [22mrenders with the correct label[32m 75[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mrendering[2m > [22mrenders with a peso prefix symbol[32m 13[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mrendering[2m > [22mrenders the family tree step container[32m 60[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mrendering[2m > [22mrenders with the correct label[32m 81[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mrendering[2m > [22mrenders with the correct label[32m 70[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mrendering[2m > [22mdisplays hint text when provided[32m 16[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mrendering[2m > [22mrenders with the correct label[32m 85[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders "Alive at Succession" toggle[32m 13[2mms[22m[39m
[31m   → Unable to find a label with the text of: /alive at.*succession/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders degree input[32m 14[2mms[22m[39m
[31m   → Unable to find a label with the text of: /degree/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders "Has Renounced" toggle[32m 14[2mms[22m[39m
[31m   → Unable to find a label with the text of: /has renounced/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders "Declared Unworthy" toggle[32m 9[2mms[22m[39m
[31m   → Unable to find a label with the text of: /declared unworthy/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mrendering[2m > [22mrenders a step indicator showing current step[32m 18[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mrendering[2m > [22mrenders an input element[33m 349[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mrendering[2m > [22mshows placeholder text when empty[32m 13[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mrendering[2m > [22mdisplays error message when provided[32m 12[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mfiliation_proved = true[2m > [22mproof type dropdown has 6 FiliationProof options[32m 13[2mms[22m[39m
[31m   → Unable to find an element with the text: /Birth Certificate/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mfiliation_proved = true[2m > [22mdoes NOT show exclusion warning when filiation is proved[32m 8[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mfiliation_proved = false[2m > [22mdoes NOT show proof type dropdown when filiation_proved is false[32m 9[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mfiliation_proved = false[2m > [22mshows exclusion warning when filiation_proved is false[32m 10[2mms[22m[39m
[31m   → Unable to find an element with the text: /Art\. 887.*excluded/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mtoggling filiation_proved[2m > [22mtoggling filiation_proved off hides proof type and shows warning[32m 18[2mms[22m[39m
[31m   → Unable to find a label with the text of: /proof of filiation/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mtoggling filiation_proved[2m > [22mtoggling filiation_proved on shows proof type and hides warning[32m 17[2mms[22m[39m
[31m   → Unable to find an element with the text: /Art\. 887.*excluded/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mrendering[2m > [22mrenders an "Add Person" button[33m 430[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mrendering[2m > [22mrenders empty state message when no persons[32m 25[2mms[22m[39m
[31m   → Unable to find an element with the text: /no family members added/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mrendering[2m > [22mrenders a select/combobox element[33m 389[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mvalid date handling[2m > [22maccepts valid YYYY-MM-DD date "2026-01-15"[33m 428[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders remove button[33m 436[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/remove/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — LegitimateParent[2m > [22mshows "Line of Descent" when relationship is LegitimateParent[32m 12[2mms[22m[39m
[31m   → Unable to find a label with the text of: /line of descent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — LegitimateParent[2m > [22mdoes NOT show "Line of Descent" when relationship is LegitimateChild[32m 11[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — LegitimateAscendant[2m > [22mshows "Line of Descent" when relationship is LegitimateAscendant[32m 16[2mms[22m[39m
[31m   → Unable to find a label with the text of: /line of descent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — IllegitimateChild[2m > [22mshows filiation section when relationship is IllegitimateChild[32m 18[2mms[22m[39m
[31m   → Unable to find an element by: [data-testid="filiation-section"]

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — IllegitimateChild[2m > [22mdoes NOT show filiation section for LegitimateChild[32m 7[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — AdoptedChild[2m > [22mshows adoption sub-form when relationship is AdoptedChild[32m 10[2mms[22m[39m
[31m   → Unable to find an element by: [data-testid="adoption-sub-form"]

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — AdoptedChild[2m > [22mdoes NOT show adoption sub-form for LegitimateChild[32m 5[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — Sibling[2m > [22mshows "Blood Type" when relationship is Sibling[32m 9[2mms[22m[39m
[31m   → Unable to find a label with the text of: /blood type/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — Sibling[2m > [22mdoes NOT show "Blood Type" for LegitimateChild[32m 5[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrescission cascade[2m > [22mshows rescission date when is_rescinded=true[32m 14[2mms[22m[39m
[31m   → Unable to find a label with the text of: /rescission date/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrescission cascade[2m > [22mtoggling rescission on reveals rescission date[32m 10[2mms[22m[39m
[31m   → Unable to find a label with the text of: /adoption rescinded/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrescission cascade[2m > [22mshows rescission warning banner when is_rescinded=true[32m 19[2mms[22m[39m
[31m   → Unable to find an element with the text: /rescinded adoption.*RA 8552.*excluded/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrescission cascade[2m > [22mdoes NOT show rescission warning when is_rescinded=false[32m 9[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mrendering[2m > [22mrenders navigation buttons (Next/Back)[33m 438[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mrendering — always visible fields[2m > [22mrenders Full Name text input[32m 27[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mrendering — always visible fields[2m > [22mrenders Date of Death date input[32m 21[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mrendering — always visible fields[2m > [22mrenders "Decedent is Illegitimate" toggle[32m 23[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mrendering — always visible fields[2m > [22mrenders "Was Married at Time of Death" toggle[32m 18[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mrendering[2m > [22mrenders numerator and denominator input fields[33m 420[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mrendering[2m > [22mrenders a "/" divider between numerator and denominator[32m 21[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mrendering[2m > [22mdisplays error message when provided[32m 24[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22madd/remove persons[2m > [22mclicking "Add Person" adds a new person card[32m 133[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mserialization[2m > [22mfiliation_proved=true serializes with proof type[33m 430[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mrendering[2m > [22mrenders all person options[32m 130[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mrendering[2m > [22mdisplays error message when provided[32m 16[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mserialization[2m > [22mfiliation_proved=false serializes with null proof type[32m 103[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mserialization[2m > [22mselecting a proof type serializes correctly[32m 11[2mms[22m[39m
[31m   → Unable to find a label with the text of: /proof of filiation/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — Sibling[2m > [22moffers "Full" and "Half" options for Blood Type[32m 10[2mms[22m[39m
[31m   → Unable to find a label with the text of: /blood type/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — SurvivingSpouse + legal separation[2m > [22mshows "Guilty Party" toggle when SS + has_legal_separation[32m 6[2mms[22m[39m
[31m   → Unable to find a label with the text of: /guilty party/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — SurvivingSpouse + legal separation[2m > [22mdoes NOT show "Guilty Party" when SS but no legal separation[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — SurvivingSpouse + legal separation[2m > [22mdoes NOT show "Guilty Party" for non-spouse even with legal separation[32m 5[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — unworthiness condoned[2m > [22mshows "Unworthiness Condoned" toggle when is_unworthy is true[32m 5[2mms[22m[39m
[31m   → Unable to find a label with the text of: /unworthiness condoned/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — unworthiness condoned[2m > [22mdoes NOT show "Unworthiness Condoned" when is_unworthy is false[32m 4[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — deceased person children[2m > [22mshows children picker when person is dead and relationship is children-relevant[32m 8[2mms[22m[39m
[31m   → Unable to find an element with the text: /children.*representation/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — deceased person children[2m > [22mdoes NOT show children picker when person is alive[32m 7[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — deceased person children[2m > [22mdoes NOT show children picker for Stranger even if dead[32m 5[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mrelationship change reset[2m > [22mswitching relationship resets conditional fields[32m 13[2mms[22m[39m
[31m   → Unable to find a label with the text of: /relationship to decedent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mrelationship change reset[2m > [22mswitching from AdoptedChild resets adoption to null[32m 6[2mms[22m[39m
[31m   → Unable to find a label with the text of: /relationship to decedent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mrelationship change reset[2m > [22mswitching from IllegitimateChild resets filiation fields[32m 7[2mms[22m[39m
[31m   → Unable to find a label with the text of: /relationship to decedent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mdegree behavior per relationship[2m > [22mdegree is non-editable (disabled) for AdoptedChild (fixed at 1)[32m 13[2mms[22m[39m
[31m   → Unable to find a label with the text of: /degree/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mdegree behavior per relationship[2m > [22mdegree is editable for LegitimateChild (range [1,5])[32m 9[2mms[22m[39m
[31m   → Unable to find a label with the text of: /degree/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mrendering[2m > [22mdoes not show Back button on first step[32m 116[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mserialization[2m > [22madoption record serializes with all 8 fields[33m 447[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mvalid date handling[2m > [22mstores date as ISO 8601 string[32m 112[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mvalid date handling[2m > [22mrenders with pre-populated date value[32m 13[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mmax date constraint[2m > [22mrenders with maxDate attribute when provided[32m 8[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mmax date constraint[2m > [22mrenders with minDate attribute when provided[32m 17[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mlabel variants[2m > [22mrenders "Date of Marriage" label[32m 16[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mlabel variants[2m > [22mrenders "Will Execution Date" label[32m 11[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22mlabel variants[2m > [22mrenders "Adoption Decree Date" label[32m 9[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mhasWill toggle[2m > [22mtoggling to Testate calls onHasWillChange with true[33m 533[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mrendering[2m > [22mrenders a select element[33m 422[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mdegree behavior per relationship[2m > [22mdegree is non-editable for SurvivingSpouse (fixed at 1)[32m 6[2mms[22m[39m
[31m   → Unable to find a label with the text of: /degree/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mdegree behavior per relationship[2m > [22mdegree is editable for OtherCollateral (range [3,5])[32m 10[2mms[22m[39m
[31m   → Unable to find a label with the text of: /degree/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateChild[2m > [22mdoes NOT show filiation-section[32m 6[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateChild[2m > [22mdoes NOT show adoption-sub-form[32m 14[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateChild[2m > [22mdoes NOT show line of descent[32m 3[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateChild[2m > [22mdoes NOT show blood type[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimatedChild[2m > [22mdoes NOT show filiation-section[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimatedChild[2m > [22mdoes NOT show adoption-sub-form[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimatedChild[2m > [22mdoes NOT show line of descent[32m 9[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimatedChild[2m > [22mdoes NOT show blood type[32m 5[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mAdoptedChild[2m > [22mshows adoption-sub-form[32m 7[2mms[22m[39m
[31m   → Unable to find an element by: [data-testid="adoption-sub-form"]

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mAdoptedChild[2m > [22mdoes NOT show filiation-section[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mAdoptedChild[2m > [22mdoes NOT show line of descent[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mAdoptedChild[2m > [22mdoes NOT show blood type[32m 4[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mIllegitimateChild[2m > [22mshows filiation-section[32m 5[2mms[22m[39m
[31m   → Unable to find an element by: [data-testid="filiation-section"]

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mIllegitimateChild[2m > [22mdoes NOT show adoption-sub-form[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mIllegitimateChild[2m > [22mdoes NOT show line of descent[32m 4[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22madd/remove persons[2m > [22mclicking "Add Person" twice adds two person cards[32m 119[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22madd/remove persons[2m > [22mremoving a person card reduces the count[32m 69[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mserialization[2m > [22madopter is auto-set to decedent id[32m 94[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mserialization[2m > [22madoptee is auto-set to person id[32m 82[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22medge cases[2m > [22mhandles empty/cleared input[32m 88[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/DateInput.test.tsx[2m > [22mshared > DateInput[2m > [22medge cases[2m > [22mupdates form state on change[32m 76[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mIllegitimateChild[2m > [22mdoes NOT show blood type[32m 6[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mSurvivingSpouse[2m > [22mdoes NOT show filiation-section[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mSurvivingSpouse[2m > [22mdoes NOT show adoption-sub-form[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mSurvivingSpouse[2m > [22mdoes NOT show line of descent[32m 6[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mSurvivingSpouse[2m > [22mdoes NOT show blood type[32m 6[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateParent[2m > [22mshows line of descent[32m 8[2mms[22m[39m
[31m   → Unable to find a label with the text of: /line of descent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateParent[2m > [22mdoes NOT show filiation-section[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateParent[2m > [22mdoes NOT show adoption-sub-form[32m 3[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateParent[2m > [22mdoes NOT show blood type[32m 4[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateAscendant[2m > [22mshows line of descent[32m 5[2mms[22m[39m
[31m   → Unable to find a label with the text of: /line of descent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateAscendant[2m > [22mdoes NOT show filiation-section[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateAscendant[2m > [22mdoes NOT show adoption-sub-form[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateAscendant[2m > [22mdoes NOT show blood type[32m 4[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mSibling[2m > [22mshows blood type[32m 5[2mms[22m[39m
[31m   → Unable to find a label with the text of: /blood type/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mSibling[2m > [22mdoes NOT show filiation-section[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mSibling[2m > [22mdoes NOT show adoption-sub-form[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mSibling[2m > [22mdoes NOT show line of descent[32m 7[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mNephewNiece[2m > [22mdoes NOT show filiation-section[32m 6[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mNephewNiece[2m > [22mdoes NOT show adoption-sub-form[32m 9[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mstep navigation[2m > [22madvances to next step when Next is clicked[32m 133[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mrendering[2m > [22mrenders all 11 relationship options[33m 318[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mrendering[2m > [22mdisplays error message when provided[32m 20[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mrendering[2m > [22mdisplays placeholder when provided[32m 20[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mpeso-to-centavo conversion[2m > [22mentering "500" sets form value to 50000 centavos[33m 422[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mauto-generated person IDs[2m > [22mfirst LegitimateChild gets id "lc1"[32m 83[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mauto-generated person IDs[2m > [22msecond LegitimateChild gets id "lc2"[32m 66[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mselection[2m > [22mselects a person and updates form value to their ID[32m 255[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mselection[2m > [22mshows person name + relationship badge in options[32m 65[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mhasWill toggle[2m > [22mtoggling to Intestate calls onHasWillChange with false[32m 195[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mhasWill toggle[2m > [22mhasWill=true selects the Testate radio[32m 13[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mfraction serialization[2m > [22mentering numerator 1 and denominator 2 produces form value "1/2"[33m 426[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mNephewNiece[2m > [22mdoes NOT show line of descent[32m 6[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mNephewNiece[2m > [22mdoes NOT show blood type[32m 10[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mOtherCollateral[2m > [22mdoes NOT show filiation-section[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mOtherCollateral[2m > [22mdoes NOT show adoption-sub-form[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mOtherCollateral[2m > [22mdoes NOT show line of descent[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mOtherCollateral[2m > [22mdoes NOT show blood type[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mStranger[2m > [22mdoes NOT show filiation-section[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mStranger[2m > [22mdoes NOT show adoption-sub-form[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mStranger[2m > [22mdoes NOT show line of descent[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mStranger[2m > [22mdoes NOT show blood type[32m 4[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22minfo badges[2m > [22mshows "Art. 1032: Excluded" badge for unworthy person without condoning[32m 5[2mms[22m[39m
[31m   → Unable to find an element with the text: /Art\. 1032.*Excluded/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22minfo badges[2m > [22mdoes NOT show exclusion badge for unworthy person with condoning[32m 4[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22minfo badges[2m > [22mshows "Art. 1002: Excluded" badge for guilty spouse in legal separation[32m 9[2mms[22m[39m
[31m   → Unable to find an element with the text: /Art\. 1002.*Excluded/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mremove button[2m > [22mcalls onRemove with correct index when clicked[32m 66[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/remove/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > resetPersonForRelationship[2m > [22mresets degree to default for LegitimateChild[32m 1[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > resetPersonForRelationship[2m > [22mresets degree to default for LegitimateAscendant[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > resetPersonForRelationship[2m > [22mresets line to null[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > resetPersonForRelationship[2m > [22mresets filiation_proved to true[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > resetPersonForRelationship[2m > [22mresets filiation_proof_type to null[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > resetPersonForRelationship[2m > [22mresets adoption to null[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > resetPersonForRelationship[2m > [22mresets blood_type to null[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > resetPersonForRelationship[2m > [22mresets is_guilty_party_in_legal_separation to false[32m 1[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mauto-generated person IDs[2m > [22mSurvivingSpouse gets id "sp"[32m 64[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mauto-generated person IDs[2m > [22mdifferent relationship types get different prefixes[32m 57[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mstep navigation[2m > [22mshows Back button on step 2[32m 160[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mselection[2m > [22mpre-selects person from default value[32m 73[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mstranger option[2m > [22mshows "Other (not in family tree)" option when allowStranger=true[32m 50[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mrendering — always visible fields[2m > [22mauto-sets decedent.id to "d"[33m 805[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mmarriage fields hidden when is_married=false[2m > [22mdoes not show Date of Marriage when unmarried[32m 15[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mmarriage fields hidden when is_married=false[2m > [22mdoes not show Years of Cohabitation when unmarried[32m 15[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mmarriage fields hidden when is_married=false[2m > [22mdoes not show Legal Separation toggle when unmarried[32m 18[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mmarriage fields hidden when is_married=false[2m > [22mdoes not show Articulo Mortis toggle when unmarried[32m 18[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mmarriage fields shown when is_married=true[2m > [22mshows Date of Marriage when married[32m 27[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mpeso-to-centavo conversion[2m > [22mentering "500.25" sets form value to 50025 centavos[32m 246[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mselection[2m > [22mfires onChange and updates form value on selection[32m 186[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mmax 1 SurvivingSpouse validation[2m > [22mshows error when two SurvivingSpouse persons exist[32m 52[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mserialization[2m > [22mfamily_tree serializes as an array of Person objects[32m 45[2mms[22m[39m
[31m   → Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mmarriage fields shown when is_married=true[2m > [22mshows Years of Cohabitation when married[32m 21[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mmarriage fields shown when is_married=true[2m > [22mshows Legal Separation toggle when married[32m 14[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mmarriage fields shown when is_married=true[2m > [22mshows Articulo Mortis toggle when married[32m 15[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mserialization[2m > [22mempty family tree serializes as empty array[32m 75[2mms[22m[39m
 [31m×[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mpre-populated family tree[2m > [22mrenders existing persons from default values[32m 7[2mms[22m[39m
[31m   → Unable to find an element by: [data-testid="person-card"]

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mPERSON_ID_PREFIXES[2m > [22mhas a prefix for every relationship type[32m 2[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mPERSON_ID_PREFIXES[2m > [22mmaps LegitimateChild to "lc"[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mPERSON_ID_PREFIXES[2m > [22mmaps AdoptedChild to "ac"[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mPERSON_ID_PREFIXES[2m > [22mmaps SurvivingSpouse to "sp"[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mPERSON_ID_PREFIXES[2m > [22mmaps Sibling to "sib"[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mDEFAULT_DEGREE[2m > [22mLegitimateChild defaults to degree 1[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mDEFAULT_DEGREE[2m > [22mLegitimateAscendant defaults to degree 2[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mDEFAULT_DEGREE[2m > [22mNephewNiece defaults to degree 3[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mDEFAULT_DEGREE[2m > [22mOtherCollateral defaults to degree 4[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mDEFAULT_DEGREE[2m > [22mStranger defaults to degree 0[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mDEGREE_RANGE[2m > [22mLegitimateChild has range [1, 5][32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mDEGREE_RANGE[2m > [22mAdoptedChild has null range (fixed)[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mDEGREE_RANGE[2m > [22mSurvivingSpouse has null range (fixed)[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mDEGREE_RANGE[2m > [22mLegitimateAscendant has range [2, 5][32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mDEGREE_RANGE[2m > [22mOtherCollateral has range [3, 5][32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mRELATIONSHIP_OPTIONS[2m > [22mhas exactly 11 options[32m 1[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mRELATIONSHIP_OPTIONS[2m > [22mhas 3 groups: Compulsory Heirs, Collateral Relatives, Other[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mRELATIONSHIP_OPTIONS[2m > [22mCompulsory Heirs group has 7 options[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mRELATIONSHIP_OPTIONS[2m > [22mCollateral Relatives group has 3 options[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mFILIATION_PROOF_OPTIONS[2m > [22mhas exactly 6 options[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mFILIATION_PROOF_OPTIONS[2m > [22mfirst option is BirthCertificate[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mFILIATION_PROOF_OPTIONS[2m > [22mall options have Art. references in labels[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mCHILDREN_RELEVANT[2m > [22mincludes LegitimateChild and Sibling[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mCHILDREN_RELEVANT[2m > [22mdoes not include SurvivingSpouse[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep constants[2m > [22mCHILDREN_RELEVANT[2m > [22mdoes not include Stranger[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mstep navigation[2m > [22mgoes back to previous step when Back is clicked[32m 172[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mstranger option[2m > [22mselecting stranger sets person_id to null[32m 114[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mstranger option[2m > [22mdoes not show stranger option when allowStranger=false[32m 36[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mselection[2m > [22muses PascalCase enum values (not snake_case)[32m 132[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mselection[2m > [22mpre-selects from default value[32m 40[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mBloodType options[2m > [22mrenders exactly 2 blood type options[32m 43[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mtoggling is_married on/off[2m > [22mchecking is_married reveals marriage fields[32m 85[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mtoggling is_married on/off[2m > [22munchecking is_married hides marriage fields[32m 86[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mpeso-to-centavo conversion[2m > [22mentering "0" sets form value to 0 centavos[32m 171[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mfraction serialization[2m > [22mentering numerator 2 and denominator 3 produces form value "2/3"[32m 218[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mfraction serialization[2m > [22mpre-populates from "3/4" default value[32m 50[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mfiltering[2m > [22mapplies filter to restrict available options[32m 65[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mfiltering[2m > [22mapplies excludeIds to hide specific persons[32m 60[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mempty state[2m > [22mrenders empty select when no persons provided[32m 31[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mlabel variants[2m > [22mrenders "Recipient" label for donation context[32m 9[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/PersonPicker.test.tsx[2m > [22mshared > PersonPicker[2m > [22mlabel variants[2m > [22mrenders "Children" label for children context[32m 15[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mstep navigation[2m > [22mskips Will step when hasWill is false (intestate)[32m 168[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mstep navigation[2m > [22mrenders step indicator with correct number of visible steps[32m 15[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mBloodType options[2m > [22mselecting "Full" updates form value[32m 101[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mpreset buttons[2m > [22mrenders preset buttons by default[32m 117[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mhasWill toggle[2m > [22mtoggling hasWill to true sets will field to non-null empty Will object[33m 448[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mpeso-to-centavo conversion[2m > [22mentering "1" sets form value to 100 centavos[32m 173[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mpreset buttons[2m > [22mclicking "1/2" preset sets value to "1/2"[32m 111[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mFiliationProof options[2m > [22mrenders all 6 filiation proof options[32m 65[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mgrouped options[2m > [22mrenders option groups when options have group property[32m 61[2mms[22m[39m
 [32m✓[39m src/__tests__/smoke.test.tsx[2m > [22msmoke[2m > [22mrenders the app without crashing[32m 31[2mms[22m[39m
 [32m✓[39m src/__tests__/smoke.test.tsx[2m > [22msmoke[2m > [22mReact is importable and functional[32m 1[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mhasWill toggle[2m > [22mtoggling hasWill to false sets will field to null[32m 186[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mdisplay formatting on blur[2m > [22mdisplays "₱500.00" on blur after entering "500"[32m 102[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mform state management[2m > [22mmaintains form state across step navigation[33m 315[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mdefault constants[2m > [22mMARRIAGE_DEFAULTS has all 6 marriage-gated fields[32m 1[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mdefault constants[2m > [22mARTICULO_MORTIS_DEFAULTS resets illness fields[32m 1[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/WizardContainer.test.tsx[2m > [22mwizard-step1 > WizardContainer[2m > [22mdefault constants[2m > [22mILLNESS_DEFAULTS resets illness_caused_death[32m 0[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mpreset buttons[2m > [22mclicking "2/3" preset sets value to "2/3"[32m 111[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mpreset buttons[2m > [22mhides preset buttons when showPresets=false[32m 23[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mread-only mode[2m > [22mrenders as read-only when readOnly prop is true[32m 29[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mFRACTION_PRESETS constant[2m > [22mhas exactly 5 presets[32m 1[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mFRACTION_PRESETS constant[2m > [22mcontains 1/2, 1/3, 1/4, 2/3, 3/4[32m 0[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mFRACTION_PRESETS constant[2m > [22meach preset has numer and denom matching label[32m 0[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mutility function integration[2m > [22mfracToString(1, 2) === "1/2"[32m 0[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mutility function integration[2m > [22mstringToFrac("1/2") === {numer: 1, denom: 2}[32m 0[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mutility function integration[2m > [22mfracToString(3, 4) === "3/4"[32m 0[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/FractionInput.test.tsx[2m > [22mshared > FractionInput[2m > [22mutility function integration[2m > [22mstringToFrac("2/3") === {numer: 2, denom: 3}[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mtoggling is_married on/off[2m > [22munchecking is_married resets all 6 marriage-gated fields to defaults[32m 216[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis cascade (3-deep conditional visibility)[2m > [22mwas_ill_at_marriage hidden when articulo mortis is false[32m 17[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis cascade (3-deep conditional visibility)[2m > [22mwas_ill_at_marriage shown when articulo mortis is true[32m 14[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis cascade (3-deep conditional visibility)[2m > [22millness_caused_death hidden when was_ill_at_marriage is false[32m 10[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis cascade (3-deep conditional visibility)[2m > [22millness_caused_death shown when was_ill_at_marriage is true[32m 10[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mgrouped options[2m > [22mrenders "Compulsory Heirs" group[32m 61[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mgrouped options[2m > [22mrenders "Collateral Heirs" group[32m 47[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22mfiltering[2m > [22mapplies filter to restrict available options[32m 25[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22menum value arrays[2m > [22mRELATIONSHIPS has 11 entries[32m 1[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22menum value arrays[2m > [22mFILIATION_PROOFS has 6 entries[32m 0[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22menum value arrays[2m > [22mBLOOD_TYPES has 2 entries[32m 0[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/EnumSelect.test.tsx[2m > [22mshared > EnumSelect[2m > [22menum value arrays[2m > [22mDISINHERITANCE_CAUSES has 22 entries[32m 0[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mdisplay formatting on blur[2m > [22mdisplays "₱1,000.00" on blur after entering "1000"[32m 130[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mdisplay formatting on blur[2m > [22mclears formatting on focus to allow editing[32m 29[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mread-only mode[2m > [22mrenders as read-only when readOnly prop is true[32m 22[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mestate value input[2m > [22mentering a peso amount stores centavos in form[32m 160[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis cascade (3-deep conditional visibility)[2m > [22mtoggling articulo mortis on reveals was_ill_at_marriage[32m 52[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mread-only mode[2m > [22mdisplays formatted value in read-only mode[32m 25[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mwarnOnZero[2m > [22mshows a warning when value is 0 and warnOnZero is true[32m 8[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mwarnOnZero[2m > [22mdoes not show a warning when value is non-zero[32m 3[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22medge cases[2m > [22mhandles empty input gracefully (null value)[32m 44[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mestate value input[2m > [22mdisplays formatted peso value on blur[32m 73[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mvalidation[2m > [22mshows error when estate is zero[32m 44[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis cascade (3-deep conditional visibility)[2m > [22mtoggling articulo mortis off hides was_ill and resets child fields[32m 138[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22medge cases[2m > [22mrejects non-numeric input[32m 58[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22medge cases[2m > [22mhandles large amounts (5,000,000 pesos = 500,000,000 centavos)[32m 88[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mutility function integration[2m > [22mpesosToCentavos(500) === 50000[32m 0[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mutility function integration[2m > [22mcentavosToPesos(50025) === 500.25[32m 0[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mutility function integration[2m > [22mformatPeso(500000000) === "₱5,000,000"[32m 13[2mms[22m[39m
 [32m✓[39m src/components/shared/__tests__/MoneyInput.test.tsx[2m > [22mshared > MoneyInput[2m > [22mutility function integration[2m > [22mformatPeso(50025) === "₱500.25"[32m 0[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mserialization[2m > [22mestate value serializes as { centavos: number }[32m 82[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/EstateStep.test.tsx[2m > [22mwizard-step1 > EstateStep[2m > [22mserialization[2m > [22mwill is null when intestate (hasWill=false)[32m 80[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis cascade (3-deep conditional visibility)[2m > [22mtoggling was_ill_at_marriage off hides illness_caused_death and resets it[32m 121[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis warning banner[2m > [22mshows articulo mortis warning when all 4 conditions met and cohabitation < 5[32m 7[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis warning banner[2m > [22mdoes NOT show warning when cohabitation >= 5[32m 6[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis warning banner[2m > [22mdoes NOT show warning when illness_caused_death is false[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis warning banner[2m > [22mdoes NOT show warning when was_ill_at_marriage is false[32m 6[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis warning banner[2m > [22mdoes NOT show warning when articulo mortis toggle is false[32m 6[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis warning banner[2m > [22mshows warning with cohabitation = 0 (minimum case)[32m 6[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22marticulo mortis warning banner[2m > [22mshows warning with cohabitation = 4 (boundary case)[32m 6[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mfield interactions[2m > [22mentering a name updates decedent.name[32m 82[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mfield interactions[2m > [22mchanging date_of_death updates form state[32m 64[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mfield interactions[2m > [22mtoggling is_illegitimate updates form state[32m 88[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mfield interactions[2m > [22myears_of_cohabitation accepts non-negative integers[32m 6[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mfield interactions[2m > [22myears_of_cohabitation defaults to 0[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mis_illegitimate note[2m > [22mshows info note about is_illegitimate affecting scenarios[32m 3[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mdefaults[2m > [22mis_married defaults to false[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mdefaults[2m > [22mis_illegitimate defaults to false[32m 4[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mdefaults[2m > [22mhas_legal_separation defaults to false when married[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mdefaults[2m > [22mmarriage_solemnized_in_articulo_mortis defaults to false when married[32m 5[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mserialization[2m > [22mmarried decedent serializes all marriage fields[32m 62[2mms[22m[39m
 [32m✓[39m src/components/wizard/__tests__/DecedentStep.test.tsx[2m > [22mwizard-step2 > DecedentStep[2m > [22mserialization[2m > [22munmarried decedent has null date_of_marriage[32m 60[2mms[22m[39m

[31m⎯⎯⎯⎯⎯⎯[39m[1m[41m Failed Tests 63 [49m[22m[31m⎯⎯⎯⎯⎯⎯⎯[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mrenders decree date input
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /adoption decree date/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m140:21[22m[39m
    [90m138| [39m    [34mit[39m([32m'renders decree date input'[39m[33m,[39m () [33m=>[39m {
    [90m139| [39m      [34mrender[39m([33m<[39m[33mAdoptionSubFormWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m140| [39m      expect(screen.getByLabelText(/adoption decree date/i)).toBeInThe…
    [90m   | [39m                    [31m^[39m
    [90m141| [39m    })[33m;[39m
    [90m142| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mrenders adoption law select (regime)
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /adoption law/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m145:21[22m[39m
    [90m143| [39m    [34mit[39m([32m'renders adoption law select (regime)'[39m[33m,[39m () [33m=>[39m {
    [90m144| [39m      [34mrender[39m([33m<[39m[33mAdoptionSubFormWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m145| [39m      expect(screen.getByLabelText(/adoption law/i)).toBeInTheDocument…
    [90m   | [39m                    [31m^[39m
    [90m146| [39m    })[33m;[39m
    [90m147| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mrenders stepparent adoption toggle
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /stepparent adoption/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m150:21[22m[39m
    [90m148| [39m    [34mit[39m([32m'renders stepparent adoption toggle'[39m[33m,[39m () [33m=>[39m {
    [90m149| [39m      [34mrender[39m([33m<[39m[33mAdoptionSubFormWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m150| [39m      expect(screen.getByLabelText(/stepparent adoption/i)).toBeInTheD…
    [90m   | [39m                    [31m^[39m
    [90m151| [39m    })[33m;[39m
    [90m152| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mrenders adoption rescinded toggle
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /adoption rescinded/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m155:21[22m[39m
    [90m153| [39m    [34mit[39m([32m'renders adoption rescinded toggle'[39m[33m,[39m () [33m=>[39m {
    [90m154| [39m      [34mrender[39m([33m<[39m[33mAdoptionSubFormWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m155| [39m      expect(screen.getByLabelText(/adoption rescinded/i)).toBeInTheDo…
    [90m   | [39m                    [31m^[39m
    [90m156| [39m    })[33m;[39m
    [90m157| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mregime select has Ra8552 and Ra11642 options
[31m[1mTestingLibraryElementError[22m: Unable to find an element with the text: /Ra8552/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m160:21[22m[39m
    [90m158| [39m    [34mit[39m([32m'regime select has Ra8552 and Ra11642 options'[39m[33m,[39m () [33m=>[39m {
    [90m159| [39m      [34mrender[39m([33m<[39m[33mAdoptionSubFormWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m160| [39m      [34mexpect[39m(screen[33m.[39m[34mgetByText[39m([36m/Ra8552/[39m))[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m   | [39m                    [31m^[39m
    [90m161| [39m      [34mexpect[39m(screen[33m.[39m[34mgetByText[39m([36m/Ra11642/[39m))[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m162| [39m    })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrendering[2m > [22mdefaults regime to Ra8552
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /adoption law/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m166:29[22m[39m
    [90m164| [39m    [34mit[39m([32m'defaults regime to Ra8552'[39m[33m,[39m () [33m=>[39m {
    [90m165| [39m      [34mrender[39m([33m<[39m[33mAdoptionSubFormWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m166| [39m      [35mconst[39m select [33m=[39m screen[33m.[39m[34mgetByLabelText[39m([36m/adoption law/i[39m)[33m;[39m
    [90m   | [39m                            [31m^[39m
    [90m167| [39m      [34mexpect[39m(select)[33m.[39m[34mtoHaveValue[39m([32m'Ra8552'[39m)[33m;[39m
    [90m168| [39m    })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mstepparent adoption cascade[2m > [22mshows biological parent spouse picker when stepparent=true
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /biological parent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m185:21[22m[39m
    [90m183| [39m        [33m/[39m[33m>[39m
    [90m184| [39m      )[33m;[39m
    [90m185| [39m      expect(screen.getByLabelText(/biological parent/i)).toBeInTheDoc…
    [90m   | [39m                    [31m^[39m
    [90m186| [39m    })[33m;[39m
    [90m187| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mstepparent adoption cascade[2m > [22mtoggling stepparent on reveals biological parent picker
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /stepparent adoption/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m192:39[22m[39m
    [90m190| [39m      [34mrender[39m([33m<[39m[33mAdoptionSubFormWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m191| [39m
    [90m192| [39m      const stepparentToggle = screen.getByLabelText(/stepparent adopt…
    [90m   | [39m                                      [31m^[39m
    [90m193| [39m      [35mawait[39m user[33m.[39m[34mclick[39m(stepparentToggle)[33m;[39m
    [90m194| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mstepparent adoption cascade[2m > [22mtoggling stepparent off hides biological parent picker
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /biological parent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m213:21[22m[39m
    [90m211| [39m      )[33m;[39m
    [90m212| [39m
    [90m213| [39m      expect(screen.getByLabelText(/biological parent/i)).toBeInTheDoc…
    [90m   | [39m                    [31m^[39m
    [90m214| [39m
    [90m215| [39m      const stepparentToggle = screen.getByLabelText(/stepparent adopt…

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrescission cascade[2m > [22mshows rescission date when is_rescinded=true
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /rescission date/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m241:21[22m[39m
    [90m239| [39m        [33m/[39m[33m>[39m
    [90m240| [39m      )[33m;[39m
    [90m241| [39m      expect(screen.getByLabelText(/rescission date/i)).toBeInTheDocum…
    [90m   | [39m                    [31m^[39m
    [90m242| [39m    })[33m;[39m
    [90m243| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrescission cascade[2m > [22mtoggling rescission on reveals rescission date
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /adoption rescinded/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m248:38[22m[39m
    [90m246| [39m      [34mrender[39m([33m<[39m[33mAdoptionSubFormWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m247| [39m
    [90m248| [39m      const rescindedToggle = screen.getByLabelText(/adoption rescinde…
    [90m   | [39m                                     [31m^[39m
    [90m249| [39m      [35mawait[39m user[33m.[39m[34mclick[39m(rescindedToggle)[33m;[39m
    [90m250| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/AdoptionSubForm.test.tsx[2m > [22mwizard-step3 > AdoptionSubForm[2m > [22mrescission cascade[2m > [22mshows rescission warning banner when is_rescinded=true
[31m[1mTestingLibraryElementError[22m: Unable to find an element with the text: /rescinded adoption.*RA 8552.*excluded/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"adoption-sub-form"[31m
      [36m>[31m
        [0mAdoption Sub-Form (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/AdoptionSubForm.test.tsx:[2m265:16[22m[39m
    [90m263| [39m      )[33m;[39m
    [90m264| [39m      [34mexpect[39m(
    [90m265| [39m        screen[33m.[39m[34mgetByText[39m([36m/rescinded adoption.*RA 8552.*excluded/i[39m)
    [90m   | [39m               [31m^[39m
    [90m266| [39m      )[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m267| [39m    })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mrendering[2m > [22mrenders an "Add Person" button
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m85:21[22m[39m
    [90m 83| [39m    [34mit[39m([32m'renders an "Add Person" button'[39m[33m,[39m () [33m=>[39m {
    [90m 84| [39m      [34mrender[39m([33m<[39m[33mFamilyTreeStepWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m 85| [39m      expect(screen.getByRole('button', { name: /add person/i })).toBe…
    [90m   | [39m                    [31m^[39m
    [90m 86| [39m    })[33m;[39m
    [90m 87| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mrendering[2m > [22mrenders empty state message when no persons
[31m[1mTestingLibraryElementError[22m: Unable to find an element with the text: /no family members added/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m90:21[22m[39m
    [90m 88| [39m    [34mit[39m([32m'renders empty state message when no persons'[39m[33m,[39m () [33m=>[39m {
    [90m 89| [39m      [34mrender[39m([33m<[39m[33mFamilyTreeStepWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m 90| [39m      expect(screen.getByText(/no family members added/i)).toBeInTheDo…
    [90m   | [39m                    [31m^[39m
    [90m 91| [39m    })[33m;[39m
    [90m 92| [39m  })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22madd/remove persons[2m > [22mclicking "Add Person" adds a new person card
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m99:31[22m[39m
    [90m 97| [39m      [34mrender[39m([33m<[39m[33mFamilyTreeStepWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m 98| [39m
    [90m 99| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m   | [39m                              [31m^[39m
    [90m100| [39m
    [90m101| [39m      [34mexpect[39m(screen[33m.[39m[34mgetByTestId[39m([32m'person-card'[39m))[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22madd/remove persons[2m > [22mclicking "Add Person" twice adds two person cards
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m108:31[22m[39m
    [90m106| [39m      [34mrender[39m([33m<[39m[33mFamilyTreeStepWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m107| [39m
    [90m108| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m   | [39m                              [31m^[39m
    [90m109| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m110| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22madd/remove persons[2m > [22mremoving a person card reduces the count
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m119:31[22m[39m
    [90m117| [39m
    [90m118| [39m      [90m// Add two persons[39m
    [90m119| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m   | [39m                              [31m^[39m
    [90m120| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m121| [39m      [34mexpect[39m(screen[33m.[39m[34mgetAllByTestId[39m([32m'person-card'[39m))[33m.[39m[34mtoHaveLength[39m([34m2[39m)[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[17/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mauto-generated person IDs[2m > [22mfirst LegitimateChild gets id "lc1"
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m137:31[22m[39m
    [90m135| [39m      [34mrender[39m([33m<[39m[33mFamilyTreeStepWrapper[39m [33monValues[39m[33m=[39m[33m{[39monValues[33m}[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m136| [39m
    [90m137| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m   | [39m                              [31m^[39m
    [90m138| [39m
    [90m139| [39m      [90m// Select relationship[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[18/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mauto-generated person IDs[2m > [22msecond LegitimateChild gets id "lc2"
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m158:31[22m[39m
    [90m156| [39m
    [90m157| [39m      [90m// Add two persons with same relationship[39m
    [90m158| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m   | [39m                              [31m^[39m
    [90m159| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m160| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[19/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mauto-generated person IDs[2m > [22mSurvivingSpouse gets id "sp"
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m180:31[22m[39m
    [90m178| [39m      [34mrender[39m([33m<[39m[33mFamilyTreeStepWrapper[39m [33monValues[39m[33m=[39m[33m{[39monValues[33m}[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m179| [39m
    [90m180| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m   | [39m                              [31m^[39m
    [90m181| [39m      const relationshipSelect = screen.getByLabelText(/relationship t…
    [90m182| [39m      [35mawait[39m user[33m.[39m[34mselectOptions[39m(relationshipSelect[33m,[39m [32m'SurvivingSpouse'[39m)[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[20/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mauto-generated person IDs[2m > [22mdifferent relationship types get different prefixes
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m200:31[22m[39m
    [90m198| [39m
    [90m199| [39m      [90m// Add 3 persons with different relationships[39m
    [90m200| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m   | [39m                              [31m^[39m
    [90m201| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m202| [39m      await user.click(screen.getByRole('button', { name: /add person/…

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[21/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mmax 1 SurvivingSpouse validation[2m > [22mshows error when two SurvivingSpouse persons exist
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m227:31[22m[39m
    [90m225| [39m
    [90m226| [39m      [90m// Add two persons both as SurvivingSpouse[39m
    [90m227| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m   | [39m                              [31m^[39m
    [90m228| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m229| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[22/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mserialization[2m > [22mfamily_tree serializes as an array of Person objects
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/add person/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m246:31[22m[39m
    [90m244| [39m      [34mrender[39m([33m<[39m[33mFamilyTreeStepWrapper[39m [33monValues[39m[33m=[39m[33m{[39monValues[33m}[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m245| [39m
    [90m246| [39m      await user.click(screen.getByRole('button', { name: /add person/…
    [90m   | [39m                              [31m^[39m
    [90m247| [39m
    [90m248| [39m      [35mconst[39m nameInput [33m=[39m screen[33m.[39m[34mgetByLabelText[39m([36m/full name/i[39m)[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[23/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FamilyTreeStep.test.tsx[2m > [22mwizard-step3 > FamilyTreeStep[2m > [22mpre-populated family tree[2m > [22mrenders existing persons from default values
[31m[1mTestingLibraryElementError[22m: Unable to find an element by: [data-testid="person-card"]

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"family-tree-step"[31m
      [36m>[31m
        [0mFamily Tree Step (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m109:15[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FamilyTreeStep.test.tsx:[2m324:21[22m[39m
    [90m322| [39m      )[33m;[39m
    [90m323| [39m
    [90m324| [39m      [34mexpect[39m(screen[33m.[39m[34mgetAllByTestId[39m([32m'person-card'[39m))[33m.[39m[34mtoHaveLength[39m([34m2[39m)[33m;[39m
    [90m   | [39m                    [31m^[39m
    [90m325| [39m    })[33m;[39m
    [90m326| [39m  })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[24/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mrendering[2m > [22mrenders "Filiation Proved" toggle
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /filiation proved/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FiliationSection.test.tsx:[2m102:21[22m[39m
    [90m100| [39m    [34mit[39m([32m'renders "Filiation Proved" toggle'[39m[33m,[39m () [33m=>[39m {
    [90m101| [39m      [34mrender[39m([33m<[39m[33mFiliationSectionWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m102| [39m      expect(screen.getByLabelText(/filiation proved/i)).toBeInTheDocu…
    [90m   | [39m                    [31m^[39m
    [90m103| [39m    })[33m;[39m
    [90m104| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[25/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mrendering[2m > [22mdefaults filiation_proved to true
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /filiation proved/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FiliationSection.test.tsx:[2m107:29[22m[39m
    [90m105| [39m    [34mit[39m([32m'defaults filiation_proved to true'[39m[33m,[39m () [33m=>[39m {
    [90m106| [39m      [34mrender[39m([33m<[39m[33mFiliationSectionWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m107| [39m      [35mconst[39m toggle [33m=[39m screen[33m.[39m[34mgetByLabelText[39m([36m/filiation proved/i[39m)[33m;[39m
    [90m   | [39m                            [31m^[39m
    [90m108| [39m      [34mexpect[39m(toggle)[33m.[39m[34mtoBeChecked[39m()[33m;[39m
    [90m109| [39m    })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[26/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mfiliation_proved = true[2m > [22mshows proof type dropdown when filiation_proved is true
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /proof of filiation/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FiliationSection.test.tsx:[2m115:21[22m[39m
    [90m113| [39m    it('shows proof type dropdown when filiation_proved is true', () =…
    [90m114| [39m      render(<FiliationSectionWrapper person={{ filiation_proved: true…
    [90m115| [39m      expect(screen.getByLabelText(/proof of filiation/i)).toBeInTheDo…
    [90m   | [39m                    [31m^[39m
    [90m116| [39m    })[33m;[39m
    [90m117| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[27/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mfiliation_proved = true[2m > [22mproof type dropdown has 6 FiliationProof options
[31m[1mTestingLibraryElementError[22m: Unable to find an element with the text: /Birth Certificate/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FiliationSection.test.tsx:[2m120:21[22m[39m
    [90m118| [39m    [34mit[39m([32m'proof type dropdown has 6 FiliationProof options'[39m[33m,[39m () [33m=>[39m {
    [90m119| [39m      render(<FiliationSectionWrapper person={{ filiation_proved: true…
    [90m120| [39m      expect(screen.getByText(/Birth Certificate/i)).toBeInTheDocument…
    [90m   | [39m                    [31m^[39m
    [90m121| [39m      [34mexpect[39m(screen[33m.[39m[34mgetByText[39m([36m/Final Judgment/i[39m))[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m122| [39m      expect(screen.getByText(/Public Document Admission/i)).toBeInThe…

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[28/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mfiliation_proved = false[2m > [22mshows exclusion warning when filiation_proved is false
[31m[1mTestingLibraryElementError[22m: Unable to find an element with the text: /Art\. 887.*excluded/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FiliationSection.test.tsx:[2m145:16[22m[39m
    [90m143| [39m      render(<FiliationSectionWrapper person={{ filiation_proved: fals…
    [90m144| [39m      [34mexpect[39m(
    [90m145| [39m        screen[33m.[39m[34mgetByText[39m([36m/Art\. 887.*excluded/i[39m)
    [90m   | [39m               [31m^[39m
    [90m146| [39m      )[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m147| [39m    })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[29/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mtoggling filiation_proved[2m > [22mtoggling filiation_proved off hides proof type and shows warning
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /proof of filiation/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FiliationSection.test.tsx:[2m156:21[22m[39m
    [90m154| [39m
    [90m155| [39m      [90m// Initially proof type is shown[39m
    [90m156| [39m      expect(screen.getByLabelText(/proof of filiation/i)).toBeInTheDo…
    [90m   | [39m                    [31m^[39m
    [90m157| [39m
    [90m158| [39m      [90m// Toggle off[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[30/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mtoggling filiation_proved[2m > [22mtoggling filiation_proved on shows proof type and hides warning
[31m[1mTestingLibraryElementError[22m: Unable to find an element with the text: /Art\. 887.*excluded/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FiliationSection.test.tsx:[2m173:21[22m[39m
    [90m171| [39m
    [90m172| [39m      [90m// Initially warning is shown[39m
    [90m173| [39m      expect(screen.getByText(/Art\. 887.*excluded/i)).toBeInTheDocume…
    [90m   | [39m                    [31m^[39m
    [90m174| [39m
    [90m175| [39m      [90m// Toggle on[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[31/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/FiliationSection.test.tsx[2m > [22mwizard-step3 > FiliationSection[2m > [22mserialization[2m > [22mselecting a proof type serializes correctly
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /proof of filiation/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"filiation-section"[31m
      [36m>[31m
        [0mFiliation Section (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/FiliationSection.test.tsx:[2m240:34[22m[39m
    [90m238| [39m      )[33m;[39m
    [90m239| [39m
    [90m240| [39m      [35mconst[39m proofSelect [33m=[39m screen[33m.[39m[34mgetByLabelText[39m([36m/proof of filiation/i[39m)[33m;[39m
    [90m   | [39m                                 [31m^[39m
    [90m241| [39m      [35mawait[39m user[33m.[39m[34mselectOptions[39m(proofSelect[33m,[39m [32m'FinalJudgment'[39m)[33m;[39m
    [90m242| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[32/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders name input (Full Name)
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /full name/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m108:21[22m[39m
    [90m106| [39m    [34mit[39m([32m'renders name input (Full Name)'[39m[33m,[39m () [33m=>[39m {
    [90m107| [39m      [34mrender[39m([33m<[39m[33mPersonCardWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m108| [39m      [34mexpect[39m(screen[33m.[39m[34mgetByLabelText[39m([36m/full name/i[39m))[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m   | [39m                    [31m^[39m
    [90m109| [39m    })[33m;[39m
    [90m110| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[33/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders relationship dropdown
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /relationship to decedent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m113:21[22m[39m
    [90m111| [39m    [34mit[39m([32m'renders relationship dropdown'[39m[33m,[39m () [33m=>[39m {
    [90m112| [39m      [34mrender[39m([33m<[39m[33mPersonCardWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m113| [39m      expect(screen.getByLabelText(/relationship to decedent/i)).toBeI…
    [90m   | [39m                    [31m^[39m
    [90m114| [39m    })[33m;[39m
    [90m115| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[34/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders "Alive at Succession" toggle
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /alive at.*succession/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m118:21[22m[39m
    [90m116| [39m    [34mit[39m([32m'renders "Alive at Succession" toggle'[39m[33m,[39m () [33m=>[39m {
    [90m117| [39m      [34mrender[39m([33m<[39m[33mPersonCardWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m118| [39m      expect(screen.getByLabelText(/alive at.*succession/i)).toBeInThe…
    [90m   | [39m                    [31m^[39m
    [90m119| [39m    })[33m;[39m
    [90m120| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[35/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders degree input
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /degree/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m123:21[22m[39m
    [90m121| [39m    [34mit[39m([32m'renders degree input'[39m[33m,[39m () [33m=>[39m {
    [90m122| [39m      [34mrender[39m([33m<[39m[33mPersonCardWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m123| [39m      [34mexpect[39m(screen[33m.[39m[34mgetByLabelText[39m([36m/degree/i[39m))[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m   | [39m                    [31m^[39m
    [90m124| [39m    })[33m;[39m
    [90m125| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[36/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders "Has Renounced" toggle
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /has renounced/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m128:21[22m[39m
    [90m126| [39m    [34mit[39m([32m'renders "Has Renounced" toggle'[39m[33m,[39m () [33m=>[39m {
    [90m127| [39m      [34mrender[39m([33m<[39m[33mPersonCardWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m128| [39m      expect(screen.getByLabelText(/has renounced/i)).toBeInTheDocumen…
    [90m   | [39m                    [31m^[39m
    [90m129| [39m    })[33m;[39m
    [90m130| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[37/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders "Declared Unworthy" toggle
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /declared unworthy/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m133:21[22m[39m
    [90m131| [39m    [34mit[39m([32m'renders "Declared Unworthy" toggle'[39m[33m,[39m () [33m=>[39m {
    [90m132| [39m      [34mrender[39m([33m<[39m[33mPersonCardWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m133| [39m      expect(screen.getByLabelText(/declared unworthy/i)).toBeInTheDoc…
    [90m   | [39m                    [31m^[39m
    [90m134| [39m    })[33m;[39m
    [90m135| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[38/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22malways-visible fields[2m > [22mrenders remove button
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/remove/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m138:21[22m[39m
    [90m136| [39m    [34mit[39m([32m'renders remove button'[39m[33m,[39m () [33m=>[39m {
    [90m137| [39m      [34mrender[39m([33m<[39m[33mPersonCardWrapper[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m138| [39m      expect(screen.getByRole('button', { name: /remove/i })).toBeInTh…
    [90m   | [39m                    [31m^[39m
    [90m139| [39m    })[33m;[39m
    [90m140| [39m  })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[39/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — LegitimateParent[2m > [22mshows "Line of Descent" when relationship is LegitimateParent
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /line of descent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m149:21[22m[39m
    [90m147| [39m        [33m/[39m[33m>[39m
    [90m148| [39m      )[33m;[39m
    [90m149| [39m      expect(screen.getByLabelText(/line of descent/i)).toBeInTheDocum…
    [90m   | [39m                    [31m^[39m
    [90m150| [39m    })[33m;[39m
    [90m151| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[40/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — LegitimateAscendant[2m > [22mshows "Line of Descent" when relationship is LegitimateAscendant
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /line of descent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m165:21[22m[39m
    [90m163| [39m        [33m/[39m[33m>[39m
    [90m164| [39m      )[33m;[39m
    [90m165| [39m      expect(screen.getByLabelText(/line of descent/i)).toBeInTheDocum…
    [90m   | [39m                    [31m^[39m
    [90m166| [39m    })[33m;[39m
    [90m167| [39m  })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[41/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — IllegitimateChild[2m > [22mshows filiation section when relationship is IllegitimateChild
[31m[1mTestingLibraryElementError[22m: Unable to find an element by: [data-testid="filiation-section"]

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m176:21[22m[39m
    [90m174| [39m        [33m/[39m[33m>[39m
    [90m175| [39m      )[33m;[39m
    [90m176| [39m      expect(screen.getByTestId('filiation-section')).toBeInTheDocumen…
    [90m   | [39m                    [31m^[39m
    [90m177| [39m    })[33m;[39m
    [90m178| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[42/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — AdoptedChild[2m > [22mshows adoption sub-form when relationship is AdoptedChild
[31m[1mTestingLibraryElementError[22m: Unable to find an element by: [data-testid="adoption-sub-form"]

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m192:21[22m[39m
    [90m190| [39m        [33m/[39m[33m>[39m
    [90m191| [39m      )[33m;[39m
    [90m192| [39m      expect(screen.getByTestId('adoption-sub-form')).toBeInTheDocumen…
    [90m   | [39m                    [31m^[39m
    [90m193| [39m    })[33m;[39m
    [90m194| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[43/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — Sibling[2m > [22mshows "Blood Type" when relationship is Sibling
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /blood type/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m208:21[22m[39m
    [90m206| [39m        [33m/[39m[33m>[39m
    [90m207| [39m      )[33m;[39m
    [90m208| [39m      [34mexpect[39m(screen[33m.[39m[34mgetByLabelText[39m([36m/blood type/i[39m))[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m   | [39m                    [31m^[39m
    [90m209| [39m    })[33m;[39m
    [90m210| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[44/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — Sibling[2m > [22moffers "Full" and "Half" options for Blood Type
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /blood type/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m222:38[22m[39m
    [90m220| [39m        [33m/[39m[33m>[39m
    [90m221| [39m      )[33m;[39m
    [90m222| [39m      [35mconst[39m bloodTypeSelect [33m=[39m screen[33m.[39m[34mgetByLabelText[39m([36m/blood type/i[39m)[33m;[39m
    [90m   | [39m                                     [31m^[39m
    [90m223| [39m      [34mexpect[39m(bloodTypeSelect)[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m224| [39m      [90m// The select should have Full and Half options[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[45/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — SurvivingSpouse + legal separation[2m > [22mshows "Guilty Party" toggle when SS + has_legal_separation
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /guilty party/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m238:21[22m[39m
    [90m236| [39m        [33m/[39m[33m>[39m
    [90m237| [39m      )[33m;[39m
    [90m238| [39m      expect(screen.getByLabelText(/guilty party/i)).toBeInTheDocument…
    [90m   | [39m                    [31m^[39m
    [90m239| [39m    })[33m;[39m
    [90m240| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[46/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — unworthiness condoned[2m > [22mshows "Unworthiness Condoned" toggle when is_unworthy is true
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /unworthiness condoned/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m269:21[22m[39m
    [90m267| [39m        [33m/[39m[33m>[39m
    [90m268| [39m      )[33m;[39m
    [90m269| [39m      expect(screen.getByLabelText(/unworthiness condoned/i)).toBeInTh…
    [90m   | [39m                    [31m^[39m
    [90m270| [39m    })[33m;[39m
    [90m271| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[47/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields — deceased person children[2m > [22mshows children picker when person is dead and relationship is children-relevant
[31m[1mTestingLibraryElementError[22m: Unable to find an element with the text: /children.*representation/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m292:21[22m[39m
    [90m290| [39m        [33m/[39m[33m>[39m
    [90m291| [39m      )[33m;[39m
    [90m292| [39m      expect(screen.getByText(/children.*representation/i)).toBeInTheD…
    [90m   | [39m                    [31m^[39m
    [90m293| [39m    })[33m;[39m
    [90m294| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[48/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mrelationship change reset[2m > [22mswitching relationship resets conditional fields
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /relationship to decedent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m337:41[22m[39m
    [90m335| [39m
    [90m336| [39m      [90m// Switch to LegitimateChild[39m
    [90m337| [39m      const relationshipSelect = screen.getByLabelText(/relationship t…
    [90m   | [39m                                        [31m^[39m
    [90m338| [39m      [35mawait[39m user[33m.[39m[34mselectOptions[39m(relationshipSelect[33m,[39m [32m'LegitimateChild'[39m)[33m;[39m
    [90m339| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[49/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mrelationship change reset[2m > [22mswitching from AdoptedChild resets adoption to null
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /relationship to decedent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m372:41[22m[39m
    [90m370| [39m      )[33m;[39m
    [90m371| [39m
    [90m372| [39m      const relationshipSelect = screen.getByLabelText(/relationship t…
    [90m   | [39m                                        [31m^[39m
    [90m373| [39m      [35mawait[39m user[33m.[39m[34mselectOptions[39m(relationshipSelect[33m,[39m [32m'LegitimateChild'[39m)[33m;[39m
    [90m374| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[50/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mrelationship change reset[2m > [22mswitching from IllegitimateChild resets filiation fields
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /relationship to decedent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m398:41[22m[39m
    [90m396| [39m      )[33m;[39m
    [90m397| [39m
    [90m398| [39m      const relationshipSelect = screen.getByLabelText(/relationship t…
    [90m   | [39m                                        [31m^[39m
    [90m399| [39m      [35mawait[39m user[33m.[39m[34mselectOptions[39m(relationshipSelect[33m,[39m [32m'LegitimateChild'[39m)[33m;[39m
    [90m400| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[51/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mdegree behavior per relationship[2m > [22mdegree is non-editable (disabled) for AdoptedChild (fixed at 1)
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /degree/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m419:34[22m[39m
    [90m417| [39m        [33m/[39m[33m>[39m
    [90m418| [39m      )[33m;[39m
    [90m419| [39m      [35mconst[39m degreeInput [33m=[39m screen[33m.[39m[34mgetByLabelText[39m([36m/degree/i[39m)[33m;[39m
    [90m   | [39m                                 [31m^[39m
    [90m420| [39m      [34mexpect[39m(degreeInput)[33m.[39m[34mtoBeDisabled[39m()[33m;[39m
    [90m421| [39m    })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[52/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mdegree behavior per relationship[2m > [22mdegree is editable for LegitimateChild (range [1,5])
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /degree/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m425:34[22m[39m
    [90m423| [39m    [34mit[39m([32m'degree is editable for LegitimateChild (range [1,5])'[39m[33m,[39m () [33m=>[39m {
    [90m424| [39m      render(<PersonCardWrapper person={{ relationship_to_decedent: 'L…
    [90m425| [39m      [35mconst[39m degreeInput [33m=[39m screen[33m.[39m[34mgetByLabelText[39m([36m/degree/i[39m)[33m;[39m
    [90m   | [39m                                 [31m^[39m
    [90m426| [39m      [34mexpect[39m(degreeInput)[33m.[39mnot[33m.[39m[34mtoBeDisabled[39m()[33m;[39m
    [90m427| [39m    })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[53/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mdegree behavior per relationship[2m > [22mdegree is non-editable for SurvivingSpouse (fixed at 1)
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /degree/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m435:34[22m[39m
    [90m433| [39m        [33m/[39m[33m>[39m
    [90m434| [39m      )[33m;[39m
    [90m435| [39m      [35mconst[39m degreeInput [33m=[39m screen[33m.[39m[34mgetByLabelText[39m([36m/degree/i[39m)[33m;[39m
    [90m   | [39m                                 [31m^[39m
    [90m436| [39m      [34mexpect[39m(degreeInput)[33m.[39m[34mtoBeDisabled[39m()[33m;[39m
    [90m437| [39m    })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[54/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mdegree behavior per relationship[2m > [22mdegree is editable for OtherCollateral (range [3,5])
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /degree/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m445:34[22m[39m
    [90m443| [39m        [33m/[39m[33m>[39m
    [90m444| [39m      )[33m;[39m
    [90m445| [39m      [35mconst[39m degreeInput [33m=[39m screen[33m.[39m[34mgetByLabelText[39m([36m/degree/i[39m)[33m;[39m
    [90m   | [39m                                 [31m^[39m
    [90m446| [39m      [34mexpect[39m(degreeInput)[33m.[39mnot[33m.[39m[34mtoBeDisabled[39m()[33m;[39m
    [90m447| [39m    })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[55/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mAdoptedChild[2m > [22mshows adoption-sub-form
[31m[1mTestingLibraryElementError[22m: Unable to find an element by: [data-testid="adoption-sub-form"]

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m526:29[22m[39m
    [90m524| [39m            )[33m;[39m
    [90m525| [39m            [35mif[39m ([35mtypeof[39m section [33m===[39m [32m'string'[39m) {
    [90m526| [39m              [34mexpect[39m(screen[33m.[39m[34mgetByTestId[39m(section))[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m   | [39m                            [31m^[39m
    [90m527| [39m            } [35melse[39m {
    [90m528| [39m              expect(screen.getByLabelText(section)).toBeInTheDocument…

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[56/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mIllegitimateChild[2m > [22mshows filiation-section
[31m[1mTestingLibraryElementError[22m: Unable to find an element by: [data-testid="filiation-section"]

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m526:29[22m[39m
    [90m524| [39m            )[33m;[39m
    [90m525| [39m            [35mif[39m ([35mtypeof[39m section [33m===[39m [32m'string'[39m) {
    [90m526| [39m              [34mexpect[39m(screen[33m.[39m[34mgetByTestId[39m(section))[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m   | [39m                            [31m^[39m
    [90m527| [39m            } [35melse[39m {
    [90m528| [39m              expect(screen.getByLabelText(section)).toBeInTheDocument…

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[57/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateParent[2m > [22mshows line of descent
[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mLegitimateAscendant[2m > [22mshows line of descent
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /line of descent/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m528:29[22m[39m
    [90m526| [39m              [34mexpect[39m(screen[33m.[39m[34mgetByTestId[39m(section))[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m527| [39m            } [35melse[39m {
    [90m528| [39m              expect(screen.getByLabelText(section)).toBeInTheDocument…
    [90m   | [39m                            [31m^[39m
    [90m529| [39m            }
    [90m530| [39m          })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[58/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mconditional fields per relationship type (all 11)[2m > [22mSibling[2m > [22mshows blood type
[31m[1mTestingLibraryElementError[22m: Unable to find a label with the text of: /blood type/i

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m getAllByLabelText node_modules/@testing-library/dom/dist/queries/label-text.js:[2m111:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m528:29[22m[39m
    [90m526| [39m              [34mexpect[39m(screen[33m.[39m[34mgetByTestId[39m(section))[33m.[39m[34mtoBeInTheDocument[39m()[33m;[39m
    [90m527| [39m            } [35melse[39m {
    [90m528| [39m              expect(screen.getByLabelText(section)).toBeInTheDocument…
    [90m   | [39m                            [31m^[39m
    [90m529| [39m            }
    [90m530| [39m          })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[59/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22minfo badges[2m > [22mshows "Art. 1032: Excluded" badge for unworthy person without condoning
[31m[1mTestingLibraryElementError[22m: Unable to find an element with the text: /Art\. 1032.*Excluded/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m561:21[22m[39m
    [90m559| [39m        [33m/[39m[33m>[39m
    [90m560| [39m      )[33m;[39m
    [90m561| [39m      expect(screen.getByText(/Art\. 1032.*Excluded/i)).toBeInTheDocum…
    [90m   | [39m                    [31m^[39m
    [90m562| [39m    })[33m;[39m
    [90m563| [39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[60/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22minfo badges[2m > [22mshows "Art. 1002: Excluded" badge for guilty spouse in legal separation
[31m[1mTestingLibraryElementError[22m: Unable to find an element with the text: /Art\. 1002.*Excluded/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m583:21[22m[39m
    [90m581| [39m        [33m/[39m[33m>[39m
    [90m582| [39m      )[33m;[39m
    [90m583| [39m      expect(screen.getByText(/Art\. 1002.*Excluded/i)).toBeInTheDocum…
    [90m   | [39m                    [31m^[39m
    [90m584| [39m    })[33m;[39m
    [90m585| [39m  })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[61/63]⎯[22m[39m

[41m[1m FAIL [22m[49m src/components/wizard/__tests__/PersonCard.test.tsx[2m > [22mwizard-step3 > PersonCard[2m > [22mremove button[2m > [22mcalls onRemove with correct index when clicked
[31m[1mTestingLibraryElementError[22m: Unable to find an accessible element with the role "button" and name `/remove/i`

Here are the accessible roles:

  button:

  Name "Submit":
  [36m<button[31m
    [33mtype[31m=[32m"submit"[31m
  [36m/>[31m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[31m
  [36m<div>[31m
    [36m<form>[31m
      [36m<div[31m
        [33mdata-testid[31m=[32m"person-card"[31m
      [36m>[31m
        [0mPerson Card (stub)[0m
      [36m</div>[31m
      [36m<button[31m
        [33mtype[31m=[32m"submit"[31m
      [36m>[31m
        [0mSubmit[0m
      [36m</button>[31m
    [36m</form>[31m
  [36m</div>[31m
[36m</body>[31m[39m
[90m [2m❯[22m Object.getElementError node_modules/@testing-library/dom/dist/config.js:[2m37:19[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m76:38[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m52:17[22m[39m
[90m [2m❯[22m node_modules/@testing-library/dom/dist/query-helpers.js:[2m95:19[22m[39m
[36m [2m❯[22m src/components/wizard/__tests__/PersonCard.test.tsx:[2m593:31[22m[39m
    [90m591| [39m      [34mrender[39m([33m<[39m[33mPersonCardWrapper[39m [33monRemove[39m[33m=[39m[33m{[39monRemove[33m}[39m [33m/[39m[33m>[39m)[33m;[39m
    [90m592| [39m
    [90m593| [39m      await user.click(screen.getByRole('button', { name: /remove/i })…
    [90m   | [39m                              [31m^[39m
    [90m594| [39m      [34mexpect[39m(onRemove)[33m.[39m[34mtoHaveBeenCalledWith[39m([34m0[39m)[33m;[39m
    [90m595| [39m    })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[62/63]⎯[22m[39m


[2m Test Files [22m [1m[31m4 failed[39m[22m[2m | [22m[1m[32m12 passed[39m[22m[90m (16)[39m
[2m      Tests [22m [1m[31m63 failed[39m[22m[2m | [22m[1m[32m560 passed[39m[22m[90m (623)[39m
[2m   Start at [22m 20:55:42
[2m   Duration [22m 4.56s[2m (transform 3.24s, setup 2.15s, import 7.92s, tests 17.85s, environment 20.01s)[22m
```

## Work Log
(no iterations yet)
