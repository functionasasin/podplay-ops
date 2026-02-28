# Inheritance UI/UX Forward Loop — Frontier

## Statistics
- Total stages: 9
- Completed: 0
- In progress: 0
- Pending: 9
- Convergence: 0%

## Stages

### Stage 1: Design System Setup [pending]
- Install shadcn/ui with New York style
- Configure Navy + Gold CSS custom properties
- Add Inter font via @fontsource-variable/inter
- Install common shadcn components (button, card, input, label, select, badge, table, separator, accordion, tabs, dialog, alert, tooltip)
- Verify existing tests still pass

### Stage 2: Shared Form Components [pending]
- MoneyInput → shadcn Input with ₱ prefix
- DateInput → shadcn Input type="date" with Label
- FractionInput → dual shadcn Inputs with / separator
- PersonPicker → shadcn Select with Badge options
- EnumSelect → shadcn Select with groups

### Stage 3: Wizard Shell & Navigation [pending]
- App.tsx → navy header, gold accent line, centered layout
- WizardContainer → numbered stepper, gold active state, card-wrapped steps
- Navigation buttons → shadcn Button variants

### Stage 4: Estate + Decedent Steps [pending]
- EstateStep → clean card, prominent money input, intestate/testate toggle
- DecedentStep → sectioned form, conditional reveals, articulo mortis alert

### Stage 5: Family Tree Step [pending]
- FamilyTreeStep → styled card stack, empty state
- PersonCard → card with badge header, grid body, collapsible sections
- AdoptionSubForm → nested indented card
- FiliationSection → compact inline section

### Stage 6: Will & Dispositions [pending]
- WillStep → shadcn Tabs
- InstitutionsTab → card repeater, ShareSpec selector
- LegaciesTab → card repeater, LegacySpec variants
- DevisesTab → card repeater
- DisinheritancesTab → compact cards with validity badge
- HeirReferenceForm → inline form group
- ShareSpecForm → variant selector with contextual fields

### Stage 7: Donations + Review [pending]
- DonationsStep → card repeater
- DonationCard → sections with exemption checkbox group
- ReviewStep → summary grid, scenario badge, warning alerts, accordion settings

### Stage 8: Results View [pending]
- ResultsHeader → gold-on-navy scenario badge, serif typography
- DistributionSection → styled Recharts pie + shadcn Table
- NarrativePanel → accordion with serif legal text
- WarningsPanel → severity-based shadcn Alerts
- ComputationLog → collapsed accordion, monospace table
- ActionsBar → action buttons bar

### Stage 9: Responsive + Final Polish [pending]
- Mobile breakpoints (< 640px): single column, compact step indicators
- Tablet (640-1024px): comfortable width
- Desktop (> 1024px): max-width centered
- Spacing/typography/focus state audit
- Final test run
