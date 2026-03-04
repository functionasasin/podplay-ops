/**
 * Representation Display helpers (§4.14)
 *
 * getRepresentedName — returns "representing {parent name}" label
 * for heirs inheriting by representation, or null for own-right heirs.
 */
import type { InheritanceShare, Person } from '../../types';

export function getRepresentedName(
  share: InheritanceShare,
  persons: Person[],
): string | null {
  if (share.inherits_by !== 'Representation') return null;
  if (share.represents === null) return 'representing deceased heir';
  const parent = persons.find((p) => p.id === share.represents);
  return parent ? `representing ${parent.name}` : 'representing deceased heir';
}
