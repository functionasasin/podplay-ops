// Tests: Checklist Token Substitution — renderStepDescription

import { renderStepDescription } from '../../../components/wizard/deployment/SmartChecklist';

const BASE_PROJECT = {
  customer_name: 'ACME Sports',
  court_count: 6,
  ddns_subdomain: 'acme',
  unifi_site_name: 'acme-site',
  mac_mini_username: 'admin',
  location_id: 'loc-001',
};

describe('renderStepDescription — token substitution', () => {
  it('replaces {{CUSTOMER_NAME}} with project customer_name', () => {
    const { rendered } = renderStepDescription('Welcome, {{CUSTOMER_NAME}}!', BASE_PROJECT);
    expect(rendered).toBe('Welcome, ACME Sports!');
    expect(rendered).not.toContain('{{CUSTOMER_NAME}}');
  });

  it('replaces {{COURT_COUNT}} with string of court_count', () => {
    const { rendered } = renderStepDescription('Courts: {{COURT_COUNT}}', BASE_PROJECT);
    expect(rendered).toBe('Courts: 6');
    expect(rendered).not.toContain('{{COURT_COUNT}}');
  });

  it('replaces {{DDNS_SUBDOMAIN}} with value when set', () => {
    const { rendered, hasUnsetTokens } = renderStepDescription(
      'Connect to {{DDNS_SUBDOMAIN}}.example.com',
      BASE_PROJECT,
    );
    expect(rendered).toBe('Connect to acme.example.com');
    expect(hasUnsetTokens).toBe(false);
    expect(rendered).not.toContain('{{');
  });

  it('replaces {{UNIFI_SITE_NAME}} with value when set', () => {
    const { rendered } = renderStepDescription('Site: {{UNIFI_SITE_NAME}}', BASE_PROJECT);
    expect(rendered).toBe('Site: acme-site');
    expect(rendered).not.toContain('{{');
  });

  it('replaces {{MAC_MINI_USERNAME}} with value when set', () => {
    const { rendered } = renderStepDescription('User: {{MAC_MINI_USERNAME}}', BASE_PROJECT);
    expect(rendered).toBe('User: admin');
    expect(rendered).not.toContain('{{');
  });

  it('replaces {{LOCATION_ID}} with value when set', () => {
    const { rendered } = renderStepDescription('Location: {{LOCATION_ID}}', BASE_PROJECT);
    expect(rendered).toBe('Location: loc-001');
    expect(rendered).not.toContain('{{');
  });

  it('replaces multiple tokens in a single description', () => {
    const { rendered } = renderStepDescription(
      '{{CUSTOMER_NAME}} has {{COURT_COUNT}} courts at {{DDNS_SUBDOMAIN}}.example.com',
      BASE_PROJECT,
    );
    expect(rendered).toBe('ACME Sports has 6 courts at acme.example.com');
    expect(rendered).not.toContain('{{');
  });

  it('returns hasUnsetTokens=false when all tokens are set', () => {
    const { hasUnsetTokens } = renderStepDescription(
      '{{CUSTOMER_NAME}} - {{DDNS_SUBDOMAIN}} - {{UNIFI_SITE_NAME}}',
      BASE_PROJECT,
    );
    expect(hasUnsetTokens).toBe(false);
  });

  it('replaces null DDNS_SUBDOMAIN with "(not yet set)" and flags hasUnsetTokens', () => {
    const project = { ...BASE_PROJECT, ddns_subdomain: null };
    const { rendered, hasUnsetTokens, unsetTokenKeys } = renderStepDescription(
      'Connect to {{DDNS_SUBDOMAIN}}.example.com',
      project,
    );
    expect(rendered).toContain('(not yet set)');
    expect(rendered).not.toContain('{{DDNS_SUBDOMAIN}}');
    expect(hasUnsetTokens).toBe(true);
    expect(unsetTokenKeys).toContain('DDNS_SUBDOMAIN');
  });

  it('replaces null UNIFI_SITE_NAME with "(not yet set)"', () => {
    const project = { ...BASE_PROJECT, unifi_site_name: null };
    const { rendered, hasUnsetTokens } = renderStepDescription('Site: {{UNIFI_SITE_NAME}}', project);
    expect(rendered).toBe('Site: (not yet set)');
    expect(hasUnsetTokens).toBe(true);
  });

  it('replaces null MAC_MINI_USERNAME with "(not yet set)"', () => {
    const project = { ...BASE_PROJECT, mac_mini_username: null };
    const { rendered, hasUnsetTokens } = renderStepDescription('User: {{MAC_MINI_USERNAME}}', project);
    expect(rendered).toBe('User: (not yet set)');
    expect(hasUnsetTokens).toBe(true);
  });

  it('replaces null LOCATION_ID with "(not yet set)"', () => {
    const project = { ...BASE_PROJECT, location_id: null };
    const { rendered, hasUnsetTokens } = renderStepDescription('Loc: {{LOCATION_ID}}', project);
    expect(rendered).toBe('Loc: (not yet set)');
    expect(hasUnsetTokens).toBe(true);
  });

  it('collects multiple unset token keys without duplicates', () => {
    const project = { ...BASE_PROJECT, ddns_subdomain: null, unifi_site_name: null };
    const { unsetTokenKeys } = renderStepDescription(
      '{{DDNS_SUBDOMAIN}} and {{UNIFI_SITE_NAME}} and {{DDNS_SUBDOMAIN}} again',
      project,
    );
    expect(unsetTokenKeys).toContain('DDNS_SUBDOMAIN');
    expect(unsetTokenKeys).toContain('UNIFI_SITE_NAME');
    // No duplicates
    expect(unsetTokenKeys.filter((k) => k === 'DDNS_SUBDOMAIN').length).toBe(1);
  });

  it('leaves description unchanged when no tokens present', () => {
    const { rendered, hasUnsetTokens } = renderStepDescription('No tokens here.', BASE_PROJECT);
    expect(rendered).toBe('No tokens here.');
    expect(hasUnsetTokens).toBe(false);
  });

  it('no raw {{TOKEN}} remains in output for fully-set project', () => {
    const desc =
      '{{CUSTOMER_NAME}} {{COURT_COUNT}} {{DDNS_SUBDOMAIN}} {{UNIFI_SITE_NAME}} {{MAC_MINI_USERNAME}} {{LOCATION_ID}}';
    const { rendered } = renderStepDescription(desc, BASE_PROJECT);
    expect(rendered).not.toMatch(/\{\{[A-Z_]+\}\}/);
  });
});
