/**
 * Tab 5 — Other Assets (§4.23)
 */

import type { OtherAssets } from '@/types/estate-tax';

export interface OtherAssetsTabProps {
  data: OtherAssets;
  onChange: (data: OtherAssets) => void;
}

export function OtherAssetsTab({ data, onChange }: OtherAssetsTabProps) {
  return (
    <div data-testid="other-assets-tab">
      <h2>Other Assets</h2>

      <section>
        <h3>Taxable Transfers</h3>
        <p data-testid="taxable-transfer-count">
          {data.taxableTransfers.length} transfer(s)
        </p>
      </section>

      <section>
        <h3>Business Interests</h3>
        <p data-testid="business-interest-count">
          {data.businessInterests.length} interest(s)
        </p>
      </section>

      <section>
        <h3>Exempt Assets (Sec. 87)</h3>
        <p data-testid="exempt-asset-count">
          {data.exemptAssets.length} asset(s)
        </p>
      </section>
    </div>
  );
}
