import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { normalizeTrustedSvgTemplate } from './svg-template-loader';
import { buildSvgNamespacePrefix, namespaceSvgIds } from './svg-id-namespace';

const SVG_FIXTURE = `<svg xmlns="http://www.w3.org/2000/svg" id="root" viewBox="0 0 10 10" aria-labelledby="title desc">
  <title id="title">Fixture</title>
  <desc id="desc">Description</desc>
  <defs>
    <linearGradient id="paint"><stop offset="0" /></linearGradient>
    <clipPath id="clip"><path id="clip-path-shape" d="M0 0h1v1H0z" /></clipPath>
  </defs>
  <path id="surface" fill="url(#paint)" clip-path="url('#clip')" style="stroke: url(&quot;#paint&quot;);" href="#paint" d="M0 0h1v1H0z" />
</svg>`;

describe('svg-id-namespace', () => {
  it('builds stable sanitized namespace prefixes', () => {
    expect(
      buildSvgNamespacePrefix({
        namespacePrefix: ':chart 1:',
        toothPosition: 11,
        view: 'side',
      }),
    ).toBe('-chart-1-__tooth-11__side');
  });

  it('rewrites root IDs, fragment references, ARIA references, and inline style URLs', () => {
    const svg = parseSvg(SVG_FIXTURE);
    const namespaced = namespaceSvgIds(svg, {
      namespacePrefix: 'chart-a',
      toothPosition: 11,
      view: 'side',
    });
    const rootId = namespaced.layerIdByOriginalId.get('root');
    const paintId = namespaced.layerIdByOriginalId.get('paint');
    const clipId = namespaced.layerIdByOriginalId.get('clip');
    const titleId = namespaced.layerIdByOriginalId.get('title');
    const descId = namespaced.layerIdByOriginalId.get('desc');

    expect(rootId).toBe('chart-a__tooth-11__side__root');
    expect(namespaced.svg.id).toBe(rootId);
    expect(namespaced.svg.getAttribute('aria-labelledby')).toBe(
      `${titleId} ${descId}`,
    );

    const surface = namespaced.svg.querySelector(
      '[data-odontogram-layer="surface"]',
    );
    expect(surface?.getAttribute('fill')).toBe(`url(#${paintId})`);
    expect(surface?.getAttribute('clip-path')).toBe(`url('#${clipId}')`);
    expect(surface?.getAttribute('style')).toBe(`stroke: url("#${paintId}");`);
    expect(surface?.getAttribute('href')).toBe(`#${paintId}`);
  });

  it('preserves a private original layer lookup after IDs are rewritten', () => {
    const namespaced = namespaceSvgIds(parseSvg(SVG_FIXTURE), {
      namespacePrefix: 'chart-a',
      toothPosition: 14,
      view: 'occlusal',
    });
    const namespacedSurfaceId = namespaced.layerIdByOriginalId.get('surface');

    expect(namespacedSurfaceId).toBe('chart-a__tooth-14__occlusal__surface');
    expect(
      namespaced.svg.querySelector(`#${namespacedSurfaceId}`),
    ).not.toBeNull();
    expect(namespaced.svg.querySelector('#surface')).toBeNull();
  });

  it('gives two teeth and two chart prefixes disjoint IDs and local references', () => {
    const first = namespaceSvgIds(parseSvg(SVG_FIXTURE), {
      namespacePrefix: 'chart-a',
      toothPosition: 11,
      view: 'side',
    }).svg;
    const second = namespaceSvgIds(parseSvg(SVG_FIXTURE), {
      namespacePrefix: 'chart-b',
      toothPosition: 11,
      view: 'side',
    }).svg;
    const third = namespaceSvgIds(parseSvg(SVG_FIXTURE), {
      namespacePrefix: 'chart-a',
      toothPosition: 12,
      view: 'side',
    }).svg;
    const host = document.createElement('div');
    host.append(first, second, third);

    const ids = Array.from(host.querySelectorAll('[id]')).map(
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(getUnresolvedFragmentReferences(host)).toEqual([]);
  });

  it('rewrites IDs and inline style fragment references from a real copied tooth template', () => {
    const sourceSvg = parseSvg(readCopiedTemplate('11.svg'));
    const normalized = normalizeTrustedSvgTemplate(sourceSvg);
    const presentationReferenceProbe =
      normalized.svg.querySelector('#caries-occlusal');
    presentationReferenceProbe?.setAttribute(
      'fill',
      'url(#linear-gradient-11-0)',
    );
    const namespaced = namespaceSvgIds(normalized.svg, {
      namespacePrefix: 'real-chart',
      toothPosition: 11,
      view: 'side',
    });
    const ids = collectIds(namespaced.svg);

    expect(namespaced.svg.id).toBe(
      namespaced.layerIdByOriginalId.get('incisor_x5F_tooth'),
    );
    expect(namespaced.svg.querySelector('style')).toBeNull();
    expect(namespaced.layerIdByOriginalId.get('caries-occlusal')).toBe(
      'real-chart__tooth-11__side__caries-occlusal',
    );
    expect(
      namespaced.svg
        .querySelector('[data-odontogram-layer="caries-occlusal"]')
        ?.getAttribute('fill'),
    ).toBe('url(#real-chart__tooth-11__side__linear-gradient-11-0)');
    expect(getUnresolvedFragmentReferences(namespaced.svg)).toEqual([]);
    expect([...ids].some((id) => id.startsWith('linear-gradient-11-'))).toBe(
      false,
    );
  });

  it('fails fast when a template has duplicate source IDs', () => {
    expect(() =>
      namespaceSvgIds(
        parseSvg(
          '<svg xmlns="http://www.w3.org/2000/svg" id="a"><g id="a" /></svg>',
        ),
        {
          namespacePrefix: 'chart-a',
          toothPosition: 11,
          view: 'side',
        },
      ),
    ).toThrow('Duplicate SVG id');
  });
});

function parseSvg(svgText: string): SVGSVGElement {
  return new DOMParser().parseFromString(svgText, 'image/svg+xml')
    .documentElement as unknown as SVGSVGElement;
}

function readCopiedTemplate(fileName: string): string {
  return readFileSync(
    join(process.cwd(), 'public', 'odontogram', 'teeth', fileName),
    'utf8',
  );
}

function collectIds(root: ParentNode): ReadonlySet<string> {
  return new Set(
    Array.from(root.querySelectorAll('[id]')).map((element) => element.id),
  );
}

function getUnresolvedFragmentReferences(root: ParentNode): readonly string[] {
  const ids = collectIds(root);
  const unresolvedReferences: string[] = [];

  for (const element of Array.from(root.querySelectorAll('*'))) {
    for (const attribute of Array.from(element.attributes)) {
      const referencedIds = collectReferencedIds(
        attribute.name,
        attribute.value,
      );
      for (const referencedId of referencedIds) {
        if (!ids.has(referencedId)) {
          unresolvedReferences.push(`${attribute.name}:${referencedId}`);
        }
      }
    }
  }

  return unresolvedReferences;
}

function collectReferencedIds(
  attributeName: string,
  value: string,
): readonly string[] {
  const referencedIds: string[] = [];
  for (const match of value.matchAll(/url\(\s*['"]?#([^)'" ]+)['"]?\s*\)/gu)) {
    if (match[1] !== undefined) {
      referencedIds.push(match[1]);
    }
  }

  if (
    ['href', 'xlink:href'].includes(attributeName.toLowerCase()) &&
    value.startsWith('#')
  ) {
    referencedIds.push(value.slice(1));
  }

  return referencedIds;
}
