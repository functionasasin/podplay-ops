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
  // Stub — to be implemented in the next iteration
  return null;
}
