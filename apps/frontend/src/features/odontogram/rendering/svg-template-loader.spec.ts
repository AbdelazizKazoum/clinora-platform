import {
  ODONTOGRAM_INACTIVE_LAYER_SELECTOR,
  ODONTOGRAM_TEMPLATE_ROOT_ATTRIBUTE,
  OCCLUSAL_TOOTH_SVG_TEMPLATE_IDS,
  SIDE_TOOTH_SVG_TEMPLATE_IDS,
  TOOTH_SVG_TEMPLATE_MANIFEST,
  SvgTemplateLoaderError,
  buildOdontogramPublicAssetUrl,
  clearToothSvgTemplateCaches,
  loadToothSvgTemplate,
  loadToothSvgTemplates,
  normalizeTrustedSvgTemplate,
  type ToothSvgTemplateId,
} from './svg-template-loader';

const VALID_SVG = `<?xml version="1.0" encoding="utf-8"?>
<!-- Created by Zoltan Dul in 2026 - free to use with MIT license. Part of React Odontogram Modul - https://github.com/ZoliQua/React-Odontogram-Modul - SVG Version: 2.5.0 -->
<svg xmlns="http://www.w3.org/2000/svg" id="fixture" viewBox="0 0 10 10">
  <style>
    [data-active="0"] { display: none; }
  </style>
  <defs>
    <linearGradient id="paint"><stop offset="0" stop-color="#fff" /></linearGradient>
  </defs>
  <g id="surfaces">
    <path id="caries-occlusal" style="display: none; fill: url(#paint); stroke: #000;" d="M0 0h1v1H0z" />
    <path id="caries-buccal" style="fill: url(#paint);" d="M1 1h1v1H1z" />
    <path id="already-active" data-active="1" d="M2 2h1v1H2z" />
  </g>
  <g id="restorations">
    <path id="emax-crown" d="M3 3h1v1H3z" />
  </g>
  <path id="tooth-base" d="M4 4h1v1H4z" />
</svg>`;

describe('svg-template-loader', () => {
  beforeEach(() => {
    clearToothSvgTemplateCaches();
  });

  it('keeps the fixed internal manifest frozen and complete', () => {
    expect(Object.isFrozen(TOOTH_SVG_TEMPLATE_MANIFEST)).toBe(true);
    expect(Object.keys(TOOTH_SVG_TEMPLATE_MANIFEST)).toEqual([
      '11',
      '13',
      '14',
      '16',
      '14_occl',
      '16_occl',
    ]);
    expect(SIDE_TOOTH_SVG_TEMPLATE_IDS).toEqual(['11', '13', '14', '16']);
    expect(OCCLUSAL_TOOTH_SVG_TEMPLATE_IDS).toEqual(['14_occl', '16_occl']);
    expect(
      Object.values(TOOTH_SVG_TEMPLATE_MANIFEST).every((entry) =>
        /^[a-f0-9]{64}$/u.test(entry.sha256),
      ),
    ).toBe(true);
  });

  it('builds deployment-safe public asset URLs', () => {
    expect(buildOdontogramPublicAssetUrl('/odontogram/teeth/11.svg')).toBe(
      '/odontogram/teeth/11.svg',
    );
    expect(
      buildOdontogramPublicAssetUrl('/odontogram/teeth/11.svg', {
        basePath: '/clinic',
      }),
    ).toBe('/clinic/odontogram/teeth/11.svg');
    expect(
      buildOdontogramPublicAssetUrl('/odontogram/teeth/11.svg', {
        basePath: 'clinic/',
        assetPrefix: 'https://cdn.example.test/assets/',
      }),
    ).toBe('https://cdn.example.test/assets/clinic/odontogram/teeth/11.svg');
  });

  it('loads, validates, normalizes, and caches a single template', async () => {
    const fetcher = createFetchMock(VALID_SVG);

    const first = await loadToothSvgTemplate('11', { fetcher });
    const second = await loadToothSvgTemplate('11', { fetcher });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(first.id).toBe('11');
    expect(first.svg).not.toBe(second.svg);
    expect(first.svg.querySelector('style')).toBeNull();
    expect(first.svg.hasAttribute(ODONTOGRAM_TEMPLATE_ROOT_ATTRIBUTE)).toBe(
      true,
    );
    expect(
      first.svg.querySelector('#caries-occlusal')?.getAttribute('style'),
    ).toBe('fill: url(#paint); stroke: #000;');
    expect(
      first.svg.querySelector('#caries-occlusal')?.getAttribute('data-active'),
    ).toBe('0');
    expect(
      first.svg.querySelector('#caries-buccal')?.getAttribute('data-active'),
    ).toBe('0');
    expect(
      first.svg.querySelector('#already-active')?.getAttribute('data-active'),
    ).toBe('1');
    expect(
      first.svg.querySelector('#emax-crown')?.getAttribute('data-active'),
    ).toBe('0');
  });

  it('shares in-flight template loads without exposing the same mutable SVG clone', async () => {
    const deferredFetch = createDeferredFetchMock(VALID_SVG);
    const firstPromise = loadToothSvgTemplate('11', {
      fetcher: deferredFetch.fetcher,
    });
    const secondPromise = loadToothSvgTemplate('11', {
      fetcher: deferredFetch.fetcher,
    });

    deferredFetch.resolve();

    const [first, second] = await Promise.all([firstPromise, secondPromise]);

    expect(deferredFetch.fetcher).toHaveBeenCalledTimes(1);
    expect(first.svg).not.toBe(second.svg);
    first.svg.setAttribute('data-test-change', 'first');
    expect(second.svg.getAttribute('data-test-change')).toBeNull();
  });

  it('evicts rejected cache entries so a later retry can succeed', async () => {
    const fetcher = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(createResponse('<svg><path></svg>'))
      .mockResolvedValueOnce(createResponse(VALID_SVG));

    await expect(loadToothSvgTemplate('11', { fetcher })).rejects.toMatchObject(
      {
        code: 'malformed-svg',
      },
    );
    await expect(
      loadToothSvgTemplate('11', { fetcher }),
    ).resolves.toMatchObject({
      id: '11',
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('throws typed errors for missing responses and malformed roots', async () => {
    await expect(
      loadToothSvgTemplate('11', {
        fetcher: createFetchMock('missing', { ok: false }),
      }),
    ).rejects.toMatchObject({
      code: 'fetch-failed',
      templateId: '11',
    });

    await expect(
      loadToothSvgTemplate('11', {
        fetcher: createFetchMock('<html></html>'),
      }),
    ).rejects.toMatchObject({
      code: 'malformed-svg',
      templateId: '11',
    });
  });

  it('loads occlusal templates only when requested', async () => {
    const fetcher = createFetchMock(VALID_SVG);

    await loadToothSvgTemplates({ fetcher });
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(fetcher.mock.calls.map(([url]) => String(url))).toEqual([
      '/odontogram/teeth/11.svg',
      '/odontogram/teeth/13.svg',
      '/odontogram/teeth/14.svg',
      '/odontogram/teeth/16.svg',
    ]);

    clearToothSvgTemplateCaches();
    fetcher.mockClear();

    await loadToothSvgTemplates({ fetcher, includeOcclusal: true });
    expect(fetcher).toHaveBeenCalledTimes(6);
    expect(fetcher.mock.calls.map(([url]) => String(url))).toContain(
      '/odontogram/teeth/14_occl.svg',
    );
    expect(fetcher.mock.calls.map(([url]) => String(url))).toContain(
      '/odontogram/teeth/16_occl.svg',
    );
  });

  it.each([
    [
      'script element',
      '<svg xmlns="http://www.w3.org/2000/svg"><script /></svg>',
    ],
    [
      'foreignObject element',
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject /></svg>',
    ],
    [
      'inline event handler',
      '<svg xmlns="http://www.w3.org/2000/svg"><path onclick="alert(1)" /></svg>',
    ],
    [
      'external href',
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.test/a.png" /></svg>',
    ],
    [
      'remote CSS URL',
      '<svg xmlns="http://www.w3.org/2000/svg"><path style="fill: url(https://example.test/a.svg)" /></svg>',
    ],
    [
      'CSS import',
      '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url("https://example.test/a.css");</style></svg>',
    ],
    [
      'unexpected embedded style',
      '<svg xmlns="http://www.w3.org/2000/svg"><style>.x { fill: red; }</style></svg>',
    ],
  ])('rejects unsafe fixed-template content: %s', async (_label, svgText) => {
    await expect(
      loadToothSvgTemplate('11', { fetcher: createFetchMock(svgText) }),
    ).rejects.toBeInstanceOf(SvgTemplateLoaderError);
    await expect(
      loadToothSvgTemplate('11', { fetcher: createFetchMock(svgText) }),
    ).rejects.toMatchObject({ code: 'unsafe-svg' });
  });

  it('normalizes a trusted parsed template without leaking embedded styles', () => {
    const svg = parseFixtureSvg(VALID_SVG);
    const normalized = normalizeTrustedSvgTemplate(svg);

    expect(normalized.removedStyleElementCount).toBe(1);
    expect(normalized.svg.querySelector('style')).toBeNull();
    expect(
      normalized.svg.hasAttribute(ODONTOGRAM_TEMPLATE_ROOT_ATTRIBUTE),
    ).toBe(true);
    expect(ODONTOGRAM_INACTIVE_LAYER_SELECTOR).toBe(
      '[data-odontogram-template-root] [data-active="0"]',
    );
    expect(normalized.switchableLayerIds).toEqual([
      'already-active',
      'caries-buccal',
      'caries-occlusal',
      'emax-crown',
      'tooth-base',
    ]);
  });
});

function parseFixtureSvg(svgText: string): SVGSVGElement {
  return new DOMParser().parseFromString(svgText, 'image/svg+xml')
    .documentElement as unknown as SVGSVGElement;
}

function createFetchMock(
  svgText: string,
  init: { readonly ok?: boolean } = {},
) {
  return jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(() =>
    Promise.resolve(createResponse(svgText, init)),
  );
}

function createResponse(
  text: string,
  init: { readonly ok?: boolean } = {},
): Response {
  return {
    ok: init.ok ?? true,
    text: () => Promise.resolve(text),
  } as Response;
}

function createDeferredFetchMock(svgText: string) {
  let resolveRequest: (() => void) | undefined;
  const blocker = new Promise<void>((resolve) => {
    resolveRequest = resolve;
  });
  const mock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    async () => {
      await blocker;
      return createResponse(svgText);
    },
  );

  return {
    fetcher: mock,
    resolve: () => {
      resolveRequest?.();
    },
  };
}

function assertTemplateId(value: string): asserts value is ToothSvgTemplateId {
  if (!(value in TOOTH_SVG_TEMPLATE_MANIFEST)) {
    throw new Error(`Unexpected fixture template ${value}`);
  }
}

for (const templateId of Object.keys(TOOTH_SVG_TEMPLATE_MANIFEST)) {
  assertTemplateId(templateId);
}
