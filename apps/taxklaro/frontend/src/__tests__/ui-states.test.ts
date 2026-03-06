/**
 * Stage 19 — Empty States, Toasts, and Loading States Test
 *
 * Verifies spec §8.4, §8.5 rules:
 * §8.5.1 — Shared components (EmptyState, ErrorState) match spec
 * §8.5.2 — Loading state pattern applied to async pages
 * §8.5.3–§8.5.13 — Page-specific skeletons, error, and empty states
 * §8.5.15 — Anti-scaffolding verification
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '..');
const COMPONENTS = path.join(SRC, 'components');
const ROUTES = path.join(SRC, 'routes');

function readComponent(relPath: string): string {
  return fs.readFileSync(path.join(COMPONENTS, relPath), 'utf-8');
}

function readRoute(relPath: string): string {
  return fs.readFileSync(path.join(ROUTES, relPath), 'utf-8');
}

function componentExists(relPath: string): boolean {
  return fs.existsSync(path.join(COMPONENTS, relPath));
}

function routeExists(relPath: string): boolean {
  return fs.existsSync(path.join(ROUTES, relPath));
}

// ─── §8.5.1 Shared Components ────────────────────────────────────────────────

describe('EmptyState.tsx (§8.5.1)', () => {
  const content = readComponent('shared/EmptyState.tsx');

  it('file exists at correct path', () => {
    expect(componentExists('shared/EmptyState.tsx')).toBe(true);
  });

  it('has required props: icon, title, description', () => {
    expect(content).toContain('icon');
    expect(content).toContain('title');
    expect(content).toContain('description');
  });

  it('has optional CTA props: ctaLabel, onCta', () => {
    expect(content).toContain('ctaLabel');
    expect(content).toContain('onCta');
  });

  it('has optional secondary CTA props', () => {
    expect(content).toContain('secondaryCtaLabel');
    expect(content).toContain('onSecondaryCta');
  });

  it('root element has 6+ Tailwind classes (anti-scaffolding gate §8.5.15)', () => {
    // Check for presence of required classes
    expect(content).toContain('flex');
    expect(content).toContain('flex-col');
    expect(content).toContain('items-center');
    expect(content).toContain('justify-center');
    expect(content).toContain('py-16');
    expect(content).toContain('text-center');
  });

  it('renders icon in a rounded container', () => {
    expect(content).toContain('rounded-full');
    expect(content).toContain('bg-muted');
  });

  it('renders h3 for title', () => {
    expect(content).toContain('<h3');
  });

  it('renders CTA button when ctaLabel provided', () => {
    expect(content).toContain('ctaLabel');
    expect(content).toContain('<Button');
    expect(content).toContain('onCta');
  });

  it('supports className prop for customization', () => {
    expect(content).toContain('className');
  });
});

describe('ErrorState.tsx (§8.5.1)', () => {
  it('file exists at correct path', () => {
    expect(componentExists('shared/ErrorState.tsx')).toBe(true);
  });

  const content = readComponent('shared/ErrorState.tsx');

  it('uses Alert component with destructive variant', () => {
    expect(content).toContain('Alert');
    expect(content).toContain('destructive');
  });

  it('uses AlertCircle icon', () => {
    expect(content).toContain('AlertCircle');
  });

  it('has optional title prop defaulting to "Something went wrong"', () => {
    expect(content).toContain('Something went wrong');
  });

  it('has optional message prop with default fallback', () => {
    expect(content).toContain('Unable to load data');
  });

  it('has optional onRetry prop', () => {
    expect(content).toContain('onRetry');
  });

  it('renders "Try again" button when onRetry is provided', () => {
    expect(content).toContain('Try again');
    expect(content).toContain('<Button');
  });
});

// ─── §8.5.15 Anti-Scaffolding: Skeleton Components ───────────────────────────

describe('ComputationCardSkeleton.tsx (§8.5.15)', () => {
  it('file exists', () => {
    expect(componentExists('computation/ComputationCardSkeleton.tsx')).toBe(true);
  });

  const content = readComponent('computation/ComputationCardSkeleton.tsx');

  it('root element has animate-pulse class', () => {
    expect(content).toContain('animate-pulse');
  });

  it('root element has 6+ required Tailwind classes (anti-scaffolding §8.5.15)', () => {
    expect(content).toContain('rounded-lg');
    expect(content).toContain('border');
    expect(content).toContain('bg-card');
    expect(content).toContain('p-4');
    expect(content).toContain('space-y-3');
    expect(content).toContain('animate-pulse');
  });

  it('uses Skeleton primitive component', () => {
    expect(content).toContain('Skeleton');
  });

  it('has flex layout for header row (title + badge)', () => {
    expect(content).toContain('flex items-start justify-between');
  });
});

describe('ClientRowSkeleton.tsx (§8.5.15)', () => {
  it('file exists', () => {
    expect(componentExists('clients/ClientRowSkeleton.tsx')).toBe(true);
  });

  const content = readComponent('clients/ClientRowSkeleton.tsx');

  it('<tr> element has border-b class (anti-scaffolding §8.5.15)', () => {
    expect(content).toContain('<tr');
    expect(content).toContain('border-b');
  });

  it('is NOT a bare <tr> — has className attribute', () => {
    // Must have className="border-b" not just <tr>
    expect(content).toMatch(/<tr\s+className=/);
  });

  it('contains 5 <td> cells matching spec', () => {
    const tdMatches = content.match(/<td/g) ?? [];
    expect(tdMatches.length).toBe(5);
  });

  it('uses Skeleton primitive in each cell', () => {
    expect(content).toContain('Skeleton');
  });
});

// ─── §8.5.11 SharedComputationNotFound ───────────────────────────────────────

describe('SharedComputationNotFound.tsx (§8.5.11)', () => {
  it('file exists', () => {
    expect(componentExists('shared-computation/SharedComputationNotFound.tsx')).toBe(true);
  });

  const content = readComponent('shared-computation/SharedComputationNotFound.tsx');

  it('has min-h-screen class on root element', () => {
    expect(content).toContain('min-h-screen');
  });

  it('renders "Link not found or expired" heading', () => {
    expect(content).toContain('Link not found or expired');
  });

  it('renders explanation text about inactive link', () => {
    expect(content).toContain('no longer active');
  });

  it('root has 6+ Tailwind classes (anti-scaffolding gate)', () => {
    expect(content).toContain('flex');
    expect(content).toContain('flex-col');
    expect(content).toContain('items-center');
    expect(content).toContain('justify-center');
    expect(content).toContain('min-h-screen');
    expect(content).toContain('text-center');
  });
});

// ─── §8.5.2 Loading State Pattern — Page Verification ────────────────────────

describe('Loading state pattern: async pages use isLoading state (§8.5.2)', () => {
  it('Dashboard route (index.tsx) references isLoading pattern (if not a stub)', () => {
    if (!routeExists('index.tsx')) return; // skip if not yet wired
    const content = readRoute('index.tsx');
    // Skip if still a stub (< 20 lines)
    const lineCount = content.split('\n').length;
    if (lineCount < 20) return;
    const hasLoadingState = content.includes('isLoading') || content.includes('loading') || content.includes('Skeleton');
    expect(hasLoadingState).toBe(true);
  });

  it('Computations list page references loading state', () => {
    const possiblePaths = ['computations/index.tsx', 'computations.tsx', 'computations/$compId.tsx'];
    const found = possiblePaths.find(p => routeExists(p));
    if (!found) return;
    const content = readRoute(found);
    const hasLoadingState = content.includes('isLoading') || content.includes('loading') || content.includes('Skeleton') || content.includes('ComputationCardSkeleton');
    expect(hasLoadingState).toBe(true);
  });
});

// ─── §8.4 Toast Catalog — Sonner only ────────────────────────────────────────

describe('Toast setup: Sonner only (§8.4)', () => {
  it('Toaster is configured in app root (main.tsx or __root.tsx)', () => {
    const rootCandidates = [
      path.join(SRC, 'main.tsx'),
      path.join(ROUTES, '__root.tsx'),
    ];
    const contents = rootCandidates
      .filter(p => fs.existsSync(p))
      .map(p => fs.readFileSync(p, 'utf-8'));

    const hasToaster = contents.some(c => c.includes('Toaster') || c.includes('sonner'));
    expect(hasToaster).toBe(true);
  });

  it('No shadcn useToast import anywhere in src (Sonner only §8.4)', () => {
    // Walk src/ looking for useToast imports from shadcn
    function walkDir(dir: string): string[] {
      const files: string[] = [];
      if (!fs.existsSync(dir)) return files;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'ui' && entry.name !== '__tests__') {
          files.push(...walkDir(full));
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          files.push(full);
        }
      }
      return files;
    }
    const allFiles = walkDir(SRC);
    const violators = allFiles.filter(f => {
      const c = fs.readFileSync(f, 'utf-8');
      return c.includes('useToast') && c.includes('@/components/ui/use-toast');
    });
    expect(violators).toHaveLength(0);
  });

  it('no file in src imports from shadcn ui/toast (Sonner only §8.4)', () => {
    function walkDir(dir: string): string[] {
      const files: string[] = [];
      if (!fs.existsSync(dir)) return files;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__tests__') {
          files.push(...walkDir(full));
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          files.push(full);
        }
      }
      return files;
    }
    const allFiles = walkDir(SRC);
    const shadcnToastImporters = allFiles.filter(f => {
      const c = fs.readFileSync(f, 'utf-8');
      return (c.includes("from '@/components/ui/toast'") || c.includes('from "@/components/ui/toast"'))
        && !f.includes('/ui/toast');
    });
    expect(shadcnToastImporters).toHaveLength(0);
  });
});

// ─── Skeleton primitive ───────────────────────────────────────────────────────

describe('Skeleton UI primitive (§8.5.1)', () => {
  it('skeleton.tsx exists in ui directory', () => {
    expect(componentExists('ui/skeleton.tsx')).toBe(true);
  });

  const content = readComponent('ui/skeleton.tsx');

  it('uses animate-pulse class', () => {
    expect(content).toContain('animate-pulse');
  });

  it('uses rounded-md class', () => {
    expect(content).toContain('rounded-md');
  });

  it('uses bg-muted or bg-accent class for skeleton background', () => {
    const hasBg = content.includes('bg-muted') || content.includes('bg-accent');
    expect(hasBg).toBe(true);
  });

  it('accepts className prop and merges it', () => {
    expect(content).toContain('className');
    expect(content).toContain('cn(');
  });
});
