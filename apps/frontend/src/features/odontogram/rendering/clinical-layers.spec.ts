import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OdontogramTooth } from '../model/odontogram';
import { applyToothVisuals } from './apply-tooth-visuals';
import { namespaceSvgIds } from './svg-id-namespace';
import { normalizeTrustedSvgTemplate } from './svg-template-loader';

function template(id = '11') {
  const source = new DOMParser().parseFromString(
    readFileSync(
      join(process.cwd(), 'public/odontogram/teeth', `${id}.svg`),
      'utf8',
    ),
    'image/svg+xml',
  ).documentElement as unknown as SVGSVGElement;
  return namespaceSvgIds(normalizeTrustedSvgTemplate(source).svg, {
    namespacePrefix: 'clinical-regression',
    toothPosition: 11,
    view: 'side',
  });
}

const tooth = (
  conditions: OdontogramTooth['conditions'],
  dentition: OdontogramTooth['dentition'] = 'permanent',
): OdontogramTooth => ({
  base: 'natural',
  position: 11,
  dentition,
  conditions,
});

describe('clinical artwork through the actual normalized SVG pipeline', () => {
  it.each(['11', '13', '14', '16'])(
    'renders and clears periapical lesions in %s',
    (id) => {
      const fixture = template(id);
      for (const [subtype, layer] of [
        ['GRANULOMA', 'granuloma'],
        ['CYST', 'cysta'],
        ['ABSCESS', 'abscess'],
      ]) {
        const result = applyToothVisuals({
          ...fixture,
          view: 'side',
          tooth: tooth([
            {
              kind: 'clinical',
              concept: 'periapical-lesion',
              subtype,
              appearance: 'existing',
            },
          ]),
        });
        expect(result.unsupportedVisuals).toEqual([]);
        for (const target of ['inflammation', layer]) {
          expect(
            fixture.svg
              .querySelector(`[data-odontogram-layer="${target}"]`)
              ?.getAttribute('data-active'),
          ).toBe('1');
        }
      }
      applyToothVisuals({ ...fixture, view: 'side', tooth: tooth([]) });
      for (const target of ['inflammation', 'granuloma', 'cysta', 'abscess']) {
        expect(
          fixture.svg
            .querySelector(`[data-odontogram-layer="${target}"]`)
            ?.getAttribute('data-active'),
        ).toBe('0');
      }
    },
  );

  it('draws distal drift and mobility using their own artwork', () => {
    const fixture = template();
    const result = applyToothVisuals({
      ...fixture,
      view: 'side',
      tooth: tooth([
        {
          kind: 'clinical',
          concept: 'ortho-drift',
          subtype: 'DISTAL_DRIFT',
          appearance: 'existing',
        },
        {
          kind: 'clinical',
          concept: 'mobility',
          subtype: '2',
          appearance: 'existing',
        },
      ]),
    });
    expect(result.activeLayerIds).toEqual(
      expect.arrayContaining(['arrow-distal', 'mobility']),
    );
    expect(result.activeLayerIds).not.toContain('arrow-mesial');
  });

  it.each(['permanent', 'primary'] as const)(
    'renders mild/full pulp disease and suppresses pulp after endodontics for %s teeth',
    (dentition) => {
      const fixture = template();
      const pulp = dentition === 'primary' ? 'milktooth' : 'tooth';
      const flame =
        dentition === 'primary' ? 'pulp-inflam-path-11' : 'pulp-inflam-path-1';
      for (const [subtype, active] of [
        ['REVERSIBLE_PULPITIS', '0'],
        ['IRREVERSIBLE_PULPITIS', '1'],
      ]) {
        const result = applyToothVisuals({
          ...fixture,
          view: 'side',
          tooth: tooth(
            [
              {
                kind: 'clinical',
                concept: 'pulp-diagnosis',
                subtype,
                appearance: 'existing',
              },
            ],
            dentition,
          ),
        });
        expect(result.activeLayerIds).toContain(`${pulp}-inflam-pulp`);
        expect(result.activeLayerIds).not.toContain(`${pulp}-healthy-pulp`);
        expect(
          fixture.svg
            .querySelector(`[data-odontogram-layer="${flame}"]`)
            ?.getAttribute('data-active'),
        ).toBe(active);
      }
      const result = applyToothVisuals({
        ...fixture,
        view: 'side',
        tooth: tooth(
          [
            {
              kind: 'clinical',
              concept: 'pulp-diagnosis',
              subtype: 'NECROSIS',
              appearance: 'existing',
            },
            { kind: 'endodontic', state: 'medication', appearance: 'existing' },
          ],
          dentition,
        ),
      });
      expect(result.activeLayerIds).not.toContain(`${pulp}-healthy-pulp`);
      expect(result.activeLayerIds).not.toContain(`${pulp}-inflam-pulp`);
    },
  );

  it('reports unavailable clinical artwork instead of claiming it is active', () => {
    const fixture = template('14_occl');
    const result = applyToothVisuals({
      ...fixture,
      view: 'occlusal',
      tooth: tooth([
        {
          kind: 'clinical',
          concept: 'root-caries',
          subtype: 'ACTIVE',
          appearance: 'existing',
        },
      ]),
    });
    expect(result.activeLayerIds).not.toContain('caries-root');
    expect(result.unsupportedVisuals).toContainEqual({
      condition: 'caries-root',
      layerId: 'caries-root',
      reason: 'missing-template-layer',
    });
  });
});
