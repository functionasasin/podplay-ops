import { createFileRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router';

const SETTINGS_TABS = [
  { label: 'Pricing', to: '/settings/pricing' },
  { label: 'Catalog', to: '/settings/catalog' },
  { label: 'Team', to: '/settings/team' },
  { label: 'Installers', to: '/settings/installers' },
  { label: 'Travel', to: '/settings/travel' },
] as const;

function SettingsLayout() {
  const matchRoute = useMatchRoute();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      {/* Tab subnav */}
      <div className="border-b flex gap-1">
        {SETTINGS_TABS.map((tab) => {
          const isActive = !!matchRoute({ to: tab.to });
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={[
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              ].join(' ')}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab content */}
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute('/_auth/settings')({
  component: SettingsLayout,
});
