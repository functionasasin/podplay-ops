# Current Stage: 7 (Wizard Step 3 (Family Tree))

## Spec Sections
- Wizard steps: synthesis/wizard-steps.md §3
- Family Tree — most complex step (11 relationship types)

## Test Results (updated by loop — iteration 1)
```

 RUN  v4.0.18 /home/clsandoval/cs/monorepo/loops/inheritance-frontend-forward/app

 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > rendering > renders the filiation section container 178ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > rendering > renders "Filiation Proved" toggle 50ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rendering > renders the adoption sub-form container 185ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rendering > renders decree date input 62ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > rendering > defaults filiation_proved to true 46ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > filiation_proved = true > shows proof type dropdown when filiation_proved is true 44ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > filiation_proved = true > proof type dropdown has 6 FiliationProof options 46ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rendering > renders adoption law select (regime) 40ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rendering > renders stepparent adoption toggle 27ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rendering > renders adoption rescinded toggle 37ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > always-visible fields > renders name input (Full Name) 243ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > always-visible fields > renders relationship dropdown 71ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rendering > regime select has Ra8552 and Ra11642 options 53ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rendering > defaults regime to Ra8552 24ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > stepparent adoption cascade > does NOT show biological parent spouse picker when stepparent=false 32ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > always-visible fields > renders "Alive at Succession" toggle 61ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > always-visible fields > renders degree input 62ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > rendering > renders the family tree step container 153ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > rendering > renders an "Add Person" button 683ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > rendering > renders empty state message when no persons 23ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > filiation_proved = true > does NOT show exclusion warning when filiation is proved 29ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > filiation_proved = false > does NOT show proof type dropdown when filiation_proved is false 19ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > filiation_proved = false > shows exclusion warning when filiation_proved is false 12ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > stepparent adoption cascade > shows biological parent spouse picker when stepparent=true 58ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > always-visible fields > renders "Has Renounced" toggle 46ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > always-visible fields > renders "Declared Unworthy" toggle 49ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > toggling filiation_proved > toggling filiation_proved off hides proof type and shows warning 724ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > add/remove persons > clicking "Add Person" adds a new person card 344ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > always-visible fields > renders remove button 718ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — LegitimateParent > shows "Line of Descent" when relationship is LegitimateParent 33ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — LegitimateParent > does NOT show "Line of Descent" when relationship is LegitimateChild 36ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > stepparent adoption cascade > toggling stepparent on reveals biological parent picker 746ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > toggling filiation_proved > toggling filiation_proved on shows proof type and hides warning 210ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — LegitimateAscendant > shows "Line of Descent" when relationship is LegitimateAscendant 63ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — IllegitimateChild > shows filiation section when relationship is IllegitimateChild 43ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — IllegitimateChild > does NOT show filiation section for LegitimateChild 21ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > serialization > filiation_proved=true serializes with proof type 137ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — AdoptedChild > shows adoption sub-form when relationship is AdoptedChild 47ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — AdoptedChild > does NOT show adoption sub-form for LegitimateChild 32ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — Sibling > shows "Blood Type" when relationship is Sibling 34ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > stepparent adoption cascade > toggling stepparent off hides biological parent picker 228ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rescission cascade > does NOT show rescission date when is_rescinded=false 27ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rescission cascade > shows rescission date when is_rescinded=true 21ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > serialization > filiation_proved=false serializes with null proof type 103ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — Sibling > does NOT show "Blood Type" for LegitimateChild 31ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — Sibling > offers "Full" and "Half" options for Blood Type 46ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — SurvivingSpouse + legal separation > shows "Guilty Party" toggle when SS + has_legal_separation 34ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > add/remove persons > clicking "Add Person" twice adds two person cards 436ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — SurvivingSpouse + legal separation > does NOT show "Guilty Party" when SS but no legal separation 24ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — SurvivingSpouse + legal separation > does NOT show "Guilty Party" for non-spouse even with legal separation 33ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — unworthiness condoned > shows "Unworthiness Condoned" toggle when is_unworthy is true 37ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — unworthiness condoned > does NOT show "Unworthiness Condoned" when is_unworthy is false 24ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rescission cascade > toggling rescission on reveals rescission date 204ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rescission cascade > shows rescission warning banner when is_rescinded=true 20ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > rescission cascade > does NOT show rescission warning when is_rescinded=false 30ms
 ✓ src/components/wizard/__tests__/FiliationSection.test.tsx > wizard-step3 > FiliationSection > serialization > selecting a proof type serializes correctly 337ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > serialization > adoption record serializes with all 8 fields 156ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > serialization > adopter is auto-set to decedent id 104ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — deceased person children > shows children picker when person is dead and relationship is children-relevant 42ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — deceased person children > does NOT show children picker when person is alive 24ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields — deceased person children > does NOT show children picker for Stranger even if dead 35ms
 ✓ src/components/wizard/__tests__/AdoptionSubForm.test.tsx > wizard-step3 > AdoptionSubForm > serialization > adoptee is auto-set to person id 118ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > add/remove persons > removing a person card reduces the count 468ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > relationship change reset > switching relationship resets conditional fields 464ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > auto-generated person IDs > first LegitimateChild gets id "lc1" 418ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > relationship change reset > switching from AdoptedChild resets adoption to null 291ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > relationship change reset > switching from IllegitimateChild resets filiation fields 256ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > degree behavior per relationship > degree is non-editable (disabled) for AdoptedChild (fixed at 1) 41ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > degree behavior per relationship > degree is editable for LegitimateChild (range [1,5]) 24ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > degree behavior per relationship > degree is non-editable for SurvivingSpouse (fixed at 1) 23ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > degree behavior per relationship > degree is editable for OtherCollateral (range [3,5]) 18ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateChild > does NOT show filiation-section 20ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateChild > does NOT show adoption-sub-form 25ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateChild > does NOT show line of descent 37ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateChild > does NOT show blood type 28ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimatedChild > does NOT show filiation-section 20ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimatedChild > does NOT show adoption-sub-form 18ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimatedChild > does NOT show line of descent 22ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > auto-generated person IDs > second LegitimateChild gets id "lc2" 721ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimatedChild > does NOT show blood type 47ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > AdoptedChild > shows adoption-sub-form 25ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > AdoptedChild > does NOT show filiation-section 22ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > AdoptedChild > does NOT show line of descent 34ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > AdoptedChild > does NOT show blood type 47ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > IllegitimateChild > shows filiation-section 27ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > IllegitimateChild > does NOT show adoption-sub-form 23ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > IllegitimateChild > does NOT show line of descent 33ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > IllegitimateChild > does NOT show blood type 58ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > SurvivingSpouse > does NOT show filiation-section 15ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > SurvivingSpouse > does NOT show adoption-sub-form 17ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > SurvivingSpouse > does NOT show line of descent 22ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > SurvivingSpouse > does NOT show blood type 33ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateParent > shows line of descent 24ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateParent > does NOT show filiation-section 19ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateParent > does NOT show adoption-sub-form 19ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateParent > does NOT show blood type 22ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateAscendant > shows line of descent 23ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > auto-generated person IDs > SurvivingSpouse gets id "sp" 446ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateAscendant > does NOT show filiation-section 31ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateAscendant > does NOT show adoption-sub-form 39ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > LegitimateAscendant > does NOT show blood type 21ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > Sibling > shows blood type 23ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > Sibling > does NOT show filiation-section 18ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > Sibling > does NOT show adoption-sub-form 19ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > Sibling > does NOT show line of descent 25ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > NephewNiece > does NOT show filiation-section 18ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > NephewNiece > does NOT show adoption-sub-form 14ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > NephewNiece > does NOT show line of descent 21ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > NephewNiece > does NOT show blood type 38ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > OtherCollateral > does NOT show filiation-section 23ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > OtherCollateral > does NOT show adoption-sub-form 30ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > OtherCollateral > does NOT show line of descent 25ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > OtherCollateral > does NOT show blood type 37ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > Stranger > does NOT show filiation-section 16ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > Stranger > does NOT show adoption-sub-form 16ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > Stranger > does NOT show line of descent 17ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > conditional fields per relationship type (all 11) > Stranger > does NOT show blood type 17ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > info badges > shows "Art. 1032: Excluded" badge for unworthy person without condoning 20ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > info badges > does NOT show exclusion badge for unworthy person with condoning 17ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > info badges > shows "Art. 1002: Excluded" badge for guilty spouse in legal separation 15ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > PersonCard > remove button > calls onRemove with correct index when clicked 128ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > resetPersonForRelationship > resets degree to default for LegitimateChild 1ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > resetPersonForRelationship > resets degree to default for LegitimateAscendant 1ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > resetPersonForRelationship > resets line to null 1ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > resetPersonForRelationship > resets filiation_proved to true 1ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > resetPersonForRelationship > resets filiation_proof_type to null 1ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > resetPersonForRelationship > resets adoption to null 0ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > resetPersonForRelationship > resets blood_type to null 0ms
 ✓ src/components/wizard/__tests__/PersonCard.test.tsx > wizard-step3 > resetPersonForRelationship > resets is_guilty_party_in_legal_separation to false 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > auto-generated person IDs > different relationship types get different prefixes 1070ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > max 1 SurvivingSpouse validation > shows error when two SurvivingSpouse persons exist 573ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > serialization > family_tree serializes as an array of Person objects 749ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > serialization > empty family tree serializes as empty array 78ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep > pre-populated family tree > renders existing persons from default values 34ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > PERSON_ID_PREFIXES > has a prefix for every relationship type 2ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > PERSON_ID_PREFIXES > maps LegitimateChild to "lc" 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > PERSON_ID_PREFIXES > maps AdoptedChild to "ac" 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > PERSON_ID_PREFIXES > maps SurvivingSpouse to "sp" 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > PERSON_ID_PREFIXES > maps Sibling to "sib" 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > DEFAULT_DEGREE > LegitimateChild defaults to degree 1 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > DEFAULT_DEGREE > LegitimateAscendant defaults to degree 2 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > DEFAULT_DEGREE > NephewNiece defaults to degree 3 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > DEFAULT_DEGREE > OtherCollateral defaults to degree 4 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > DEFAULT_DEGREE > Stranger defaults to degree 0 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > DEGREE_RANGE > LegitimateChild has range [1, 5] 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > DEGREE_RANGE > AdoptedChild has null range (fixed) 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > DEGREE_RANGE > SurvivingSpouse has null range (fixed) 1ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > DEGREE_RANGE > LegitimateAscendant has range [2, 5] 1ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > DEGREE_RANGE > OtherCollateral has range [3, 5] 1ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > RELATIONSHIP_OPTIONS > has exactly 11 options 1ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > RELATIONSHIP_OPTIONS > has 3 groups: Compulsory Heirs, Collateral Relatives, Other 1ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > RELATIONSHIP_OPTIONS > Compulsory Heirs group has 7 options 1ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > RELATIONSHIP_OPTIONS > Collateral Relatives group has 3 options 1ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > FILIATION_PROOF_OPTIONS > has exactly 6 options 1ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > FILIATION_PROOF_OPTIONS > first option is BirthCertificate 1ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > FILIATION_PROOF_OPTIONS > all options have Art. references in labels 1ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > CHILDREN_RELEVANT > includes LegitimateChild and Sibling 1ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > CHILDREN_RELEVANT > does not include SurvivingSpouse 0ms
 ✓ src/components/wizard/__tests__/FamilyTreeStep.test.tsx > wizard-step3 > FamilyTreeStep constants > CHILDREN_RELEVANT > does not include Stranger 0ms

 Test Files  4 passed (4)
      Tests  159 passed (159)
   Start at  09:06:05
   Duration  10.65s (transform 1.66s, setup 1.19s, import 4.47s, tests 14.70s, environment 9.56s)
```

## Work Log
(no iterations yet)
