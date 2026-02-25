# Current Stage: 4 (WASM Bridge Mock)

## Spec Sections
- engine-output.md (EngineOutput, InheritanceShare, HeirNarrative, ComputationLog, ManualFlag)
- scenario-field-mapping.md (scenario prediction logic, 30 scenario codes)

## Test Results (updated by loop — iteration 6)
```

[1m[46m RUN [49m[22m [36mv4.0.18 [39m[90m/home/clsandoval/cs/monorepo/loops/inheritance-frontend-forward/app[39m

 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mRelationship enum[2m > [22mhas exactly 11 variants[32m 2[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mRelationship enum[2m > [22mcontains all expected PascalCase variants[32m 2[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mFiliationProof enum[2m > [22mhas exactly 6 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mFiliationProof enum[2m > [22mcontains all expected variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mAdoptionRegime enum[2m > [22mhas exactly 2 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mAdoptionRegime enum[2m > [22mcontains Ra8552 and Ra11642[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mLineOfDescent enum[2m > [22mhas exactly 2 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mLineOfDescent enum[2m > [22mcontains Paternal and Maternal[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEffectiveCategory enum[2m > [22mhas exactly 5 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEffectiveCategory enum[2m > [22mcontains all group variants[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mInheritanceMode enum[2m > [22mhas exactly 2 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mInheritanceMode enum[2m > [22mcontains OwnRight and Representation[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mBloodType enum[2m > [22mhas exactly 2 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mBloodType enum[2m > [22mcontains Full and Half[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSuccessionType enum[2m > [22mhas exactly 4 variants[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSuccessionType enum[2m > [22mcontains all succession types[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mScenarioCode enum[2m > [22mhas exactly 31 variants (16 testate + 15 intestate)[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mScenarioCode enum[2m > [22mcontains all T-codes[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mScenarioCode enum[2m > [22mcontains all I-codes[32m 1[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mScenarioCode enum[2m > [22mT5a and T5b have lowercase suffixes[32m 0[2mms[22m[39m
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
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDisinheritanceCause enum[2m > [22mhas 8 Child causes (Art. 919)[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDisinheritanceCause enum[2m > [22mhas 8 Parent causes (Art. 920)[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDisinheritanceCause enum[2m > [22mhas 6 Spouse causes (Art. 921)[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mDisinheritanceCause enum[2m > [22mall variants use PascalCase[32m 0[2mms[22m[39m
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
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mformatPeso[2m > [22mformats 500000000 centavos as ₱5,000,000[32m 14[2mms[22m[39m
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
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mstringToFrac[2m > [22mparses '1/2' to {numer: 1, denom: 2}[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mstringToFrac[2m > [22mparses '1/4' to {numer: 1, denom: 4}[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mstringToFrac[2m > [22mparses '3/8' to {numer: 3, denom: 8}[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mstringToFrac[2m > [22mroundtrips with fracToString[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mEFFECTIVE_CATEGORY_LABELS[2m > [22mhas a label for every EffectiveCategory[32m 0[2mms[22m[39m
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
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSerialization formats[2m > [22mLegacySpec GenericClass serializes as 2-tuple[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSerialization formats[2m > [22mDeviseSpec FractionalInterest serializes as 2-tuple[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSerialization formats[2m > [22mwill field is null for intestate[32m 0[2mms[22m[39m
 [32m✓[39m src/types/__tests__/types.test.ts[2m > [22mtypes[2m > [22mSerialization formats[2m > [22menums serialize as PascalCase strings[32m 0[2mms[22m[39m
 [32m✓[39m src/__tests__/smoke.test.tsx[2m > [22msmoke[2m > [22mrenders the app without crashing[32m 21[2mms[22m[39m
 [32m✓[39m src/__tests__/smoke.test.tsx[2m > [22msmoke[2m > [22mReact is importable and functional[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22maccepts valid ISO-8601 date 2026-01-15[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22maccepts valid date 2000-12-31[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects date with slash format 2026/01/15[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects date with dot format 2026.01.15[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects empty string[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects non-string input[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects invalid calendar date 2026-02-30[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDateSchema[2m > [22mrejects date without leading zeros 2026-1-5[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22maccepts valid fraction "1/2"[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22maccepts "3/8"[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22maccepts "0/1" (zero numerator)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22mrejects "1:2" (wrong separator)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22mrejects "1/0" (zero denominator)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22mrejects non-string input[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22mrejects empty string[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFracSchema[2m > [22mrejects negative numerator "-1/2"[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFractionalInterestFracSchema[2m > [22maccepts "1/2" (fraction <= 1)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFractionalInterestFracSchema[2m > [22maccepts "1/1" (exactly 100%)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFractionalInterestFracSchema[2m > [22mrejects "3/2" (fraction > 1, exceeds 100%)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22maccepts positive integer[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22maccepts zero[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22maccepts string representation of large number[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22mrejects negative integer[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22mrejects floating point number[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22mrejects string with non-digit characters[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCentavosValueSchema[2m > [22mrejects negative string[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mMoneySchema[2m > [22maccepts valid money with number centavos[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mMoneySchema[2m > [22maccepts valid money with string centavos[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mMoneySchema[2m > [22mrejects money with negative centavos[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mMoneySchema[2m > [22mrejects missing centavos field[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mMoneySchema[2m > [22mrejects money as bare number (must be object)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mRelationshipSchema[2m > [22maccepts all 11 relationship variants[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mRelationshipSchema[2m > [22mrejects snake_case variant[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mRelationshipSchema[2m > [22mrejects unknown relationship[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mFiliationProofSchema[2m > [22maccepts all 6 proof variants[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionRegimeSchema[2m > [22maccepts Ra8552 and Ra11642[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionRegimeSchema[2m > [22mrejects uppercase RA8552[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLineOfDescentSchema[2m > [22maccepts Paternal and Maternal[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mBloodTypeSchema[2m > [22maccepts Full and Half[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDisinheritanceCauseSchema[2m > [22maccepts all 22 causes (8 Child + 8 Parent + 6 Spouse)[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mScenarioCodeSchema[2m > [22maccepts T-codes and I-codes from import[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts unit variant "EntireFreePort" as bare string[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts unit variant "EqualWithOthers" as bare string[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts unit variant "EntireEstate"[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts unit variant "Unspecified"[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts unit variant "Residuary"[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22maccepts Fraction tagged object {"Fraction": "1/2"}[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22mrejects Fraction with object value instead of string[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mShareSpecSchema[2m > [22mrejects tagged object {"EntireFreePort": null}[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22maccepts FixedAmount with valid money[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22maccepts SpecificAsset with string ID[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22maccepts GenericClass as 2-tuple [description, money][32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22mrejects GenericClass as object instead of tuple[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22mrejects FixedAmount with zero centavos[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mLegacySpecSchema[2m > [22mrejects SpecificAsset with empty string[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDeviseSpecSchema[2m > [22maccepts SpecificProperty with string ID[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDeviseSpecSchema[2m > [22maccepts FractionalInterest as 2-tuple [assetId, frac][32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDeviseSpecSchema[2m > [22mrejects FractionalInterest with fraction > 1[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDeviseSpecSchema[2m > [22mrejects FractionalInterest as object instead of tuple[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mHeirReferenceSchema[2m > [22maccepts valid individual heir reference[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mHeirReferenceSchema[2m > [22maccepts null person_id for stranger[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mHeirReferenceSchema[2m > [22mrejects collective institution without class_designation[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mHeirReferenceSchema[2m > [22mrejects collective institution with person_id set[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mHeirReferenceSchema[2m > [22mrejects empty name[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionSchema[2m > [22maccepts valid adoption record[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionSchema[2m > [22mrejects stepparent adoption without biological_parent_spouse[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionSchema[2m > [22mrejects rescinded adoption without rescission_date[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionSchema[2m > [22mrejects rescission_date before decree_date[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mAdoptionSchema[2m > [22maccepts stepparent adoption with biological_parent_spouse[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22maccepts valid LegitimateChild person[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects AdoptedChild without adoption record[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22maccepts AdoptedChild with valid adoption record[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects IllegitimateChild with filiation_proved=false (warning issue)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22maccepts IllegitimateChild with filiation_proved=true and proof type[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects IllegitimateChild with filiation_proved=true but no proof type[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects Sibling without blood_type[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22maccepts Sibling with blood_type Full[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects LegitimateParent without line[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22maccepts LegitimateParent with Paternal line[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects LegitimateAscendant without line[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects non-spouse person with is_guilty_party_in_legal_separation=true[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects person who is not unworthy but has unworthiness_condoned=true[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects SurvivingSpouse with degree != 1[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects LegitimateParent with degree != 1[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects degree > 5 (Art. 1010)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects person ID with spaces[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPersonSchema[2m > [22mrejects empty person name[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDecedentSchema[2m > [22maccepts valid decedent[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDecedentSchema[2m > [22mrejects married decedent without date_of_marriage[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDecedentSchema[2m > [22maccepts unmarried decedent with null date_of_marriage[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDecedentSchema[2m > [22mrejects negative years_of_cohabitation[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDecedentSchema[2m > [22mrejects invalid date_of_death format[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22maccepts valid donation[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects donation with multiple exemption flags active[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects stranger donation with recipient_heir_id set[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects non-stranger donation without recipient_heir_id[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22maccepts stranger donation with null recipient_heir_id[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects professional_expense_parent_required when is_professional_expense=false[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects imputed_savings when is_professional_expense=false[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects imputed_savings when parent_required=false[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22maccepts professional expense with full cascade[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDonationSchema[2m > [22mrejects donation with zero value[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDisinheritanceSchema[2m > [22maccepts valid disinheritance[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mDisinheritanceSchema[2m > [22mrejects disinheritance with null person_id in heir_reference[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineConfigSchema[2m > [22maccepts valid config with defaults[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineConfigSchema[2m > [22mrejects max_pipeline_restarts = 0[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineConfigSchema[2m > [22mrejects max_pipeline_restarts > 100[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22maccepts valid intestate EngineInput[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22maccepts valid testate EngineInput[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects will date_executed after date_of_death[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects duplicate person IDs in family_tree[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects multiple SurvivingSpouse in family_tree[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22maccepts empty family_tree (escheat scenario)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects donation date after decedent death date[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects donation referencing non-existent heir[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects institution referencing non-existent person[32m 1[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects multiple residuary institutions[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22mrejects disinheritance referencing non-existent person[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mEngineInputSchema[2m > [22maccepts single SurvivingSpouse[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCHILD_CAUSES[2m > [22mhas exactly 8 child causes[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCHILD_CAUSES[2m > [22mall start with 'Child' prefix[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPARENT_CAUSES[2m > [22mhas exactly 8 parent causes[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mPARENT_CAUSES[2m > [22mall start with 'Parent' prefix[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mSPOUSE_CAUSES[2m > [22mhas exactly 6 spouse causes[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mSPOUSE_CAUSES[2m > [22mall start with 'Spouse' prefix[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mmaps LegitimateChild to CHILD_CAUSES[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mmaps AdoptedChild to CHILD_CAUSES[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mmaps SurvivingSpouse to SPOUSE_CAUSES[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mmaps LegitimateParent to PARENT_CAUSES[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mdoes not map Sibling (not disinheritable)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mCAUSE_BY_RELATIONSHIP[2m > [22mdoes not map Stranger (not disinheritable)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps preterition to error[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps inofficiousness to warning[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps unknown_donee to info[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps max_restarts to error[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps disinheritance to warning[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22mWARNING_SEVERITY[2m > [22mmaps vacancy_unresolved to warning[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mSurvivingSpouse with is_guilty_party should issue error on person[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22munworthy heir not condoned should issue warning on person[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mperson children referencing non-existent IDs should be caught at input level[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mwill with all empty arrays should parse (empty will is valid but warned)[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mConditionSchema accepts valid condition[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mConditionSchema rejects empty description[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mInstitutionOfHeirSchema accepts valid institution[32m 0[2mms[22m[39m
 [32m✓[39m src/schemas/__tests__/schemas.test.ts[2m > [22mschemas[2m > [22minvalid-combinations edge cases[2m > [22mInstitutionOfHeirSchema rejects empty ID[32m 0[2mms[22m[39m

[2m Test Files [22m [1m[32m3 passed[39m[22m[90m (3)[39m
[2m      Tests [22m [1m[32m245 passed[39m[22m[90m (245)[39m
[2m   Start at [22m 19:57:47
[2m   Duration [22m 964ms[2m (transform 279ms, setup 222ms, import 445ms, tests 91ms, environment 1.60s)[22m
```

## Work Log
(no iterations yet)
