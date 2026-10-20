import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { validateOdontogramData } from '@/features/odontogram';
import {
  ODONTOGRAM_ACT_REFERENCE_CASES,
  createOdontogramActReference,
} from '../mock/odontogram-reference.mock';
import { mapTreatmentVisitToOdontogram } from '../model/treatment-odontogram.mapper';
import { TREATMENT_ACT_STATUSES } from '../model/treatment';
import { OdontogramReferencePage } from './odontogram-reference-page';

describe('synthetic treatment reference cases', () => {
  it.each(ODONTOGRAM_ACT_REFERENCE_CASES)(
    'produces valid clinical projections for every $code lifecycle state',
    ({ code }) => {
      for (const status of TREATMENT_ACT_STATUSES) {
        const projection = mapTreatmentVisitToOdontogram(
          createOdontogramActReference(code, status),
        );
        expect(projection.issues).toEqual([]);
        expect(validateOdontogramData(projection.data)).toMatchObject({
          valid: true,
        });
      }
    },
  );

  it('shows actual artwork for all 25 acts through the public chart renderer', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(
      async (input: RequestInfo | URL) =>
        ({
          ok: true,
          status: 200,
          text: async () =>
            readFileSync(
              join(process.cwd(), 'public', String(input).replace(/^\//, '')),
              'utf8',
            ),
        }) as Response,
    );
    try {
      const { container } = render(<OdontogramReferencePage />);
      await waitFor(
        () =>
          expect(
            container.querySelectorAll('[data-odontogram-tooth-position] svg'),
          ).toHaveLength(52),
        { timeout: 15000 },
      );
      for (const { code, expectedLayers } of ODONTOGRAM_ACT_REFERENCE_CASES) {
        fireEvent.change(screen.getByLabelText('Treatment act'), {
          target: { value: code },
        });
        for (const layer of expectedLayers) {
          await waitFor(() => {
            const element = container.querySelector(`[data-odontogram-position="16"] [data-odontogram-layer="${layer}"][data-active="1"]`);
            expect(element).not.toBeNull();
            expect(element?.closest('[data-active="0"]')).toBeNull();
          });
        }
      }
      fireEvent.change(screen.getByLabelText('Lifecycle state'), {
        target: { value: 'CANCELLED' },
      });
      expect(
        container.querySelector('[data-odontogram-appearance="planned"]'),
      ).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  }, 30000);
});
