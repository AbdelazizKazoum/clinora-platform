import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';

import type { OdontogramTooth as OdontogramToothModel } from '../model/odontogram';
import {
  TOOTH_SVG_TEMPLATE_MANIFEST,
  loadToothSvgTemplate,
  type LoadedToothSvgTemplate,
  type ToothSvgTemplateId,
} from '../rendering/svg-template-loader';
import { OdontogramTooth, resolveToothTemplateId } from './odontogram-tooth';

jest.mock('../rendering/svg-template-loader', () => {
  const actual = jest.requireActual('../rendering/svg-template-loader');

  return {
    ...actual,
    loadToothSvgTemplate: jest.fn(),
  };
});

const mockedLoadToothSvgTemplate = jest.mocked(loadToothSvgTemplate);

describe('OdontogramTooth', () => {
  beforeEach(() => {
    mockedLoadToothSvgTemplate.mockReset();
    mockedLoadToothSvgTemplate.mockImplementation(async (templateId) =>
      createLoadedTemplate(templateId),
    );
  });

  it.each([
    [11, 'side', '11', []],
    [23, 'side', '13', ['scale(-1 1) translate(-39.7 0)']],
    [14, 'side', '14', []],
    [
      48,
      'side',
      '16',
      ['scale(-1 1) translate(-39.7 0)', 'rotate(180 19.85 35.4)'],
    ],
    [14, 'occlusal', '14_occl', []],
    [36, 'occlusal', '16_occl', ['rotate(180 24.65 20.45)']],
  ] as const)(
    'renders FDI %i %s with template %s and the expected transform',
    async (position, view, expectedTemplateId, expectedTransforms) => {
      const { container } = render(
        <OdontogramTooth
          chartInstanceId="chart-a"
          position={position}
          view={view}
        />,
      );

      const svg = await findRenderedSvg(container);

      expect(mockedLoadToothSvgTemplate).toHaveBeenCalledWith(
        expectedTemplateId,
        expect.objectContaining({
          assetPrefix: undefined,
          basePath: undefined,
          fetcher: undefined,
        }),
      );
      expect(svg.id).toBe(
        `chart-a__tooth-${position}__${view}__template-${expectedTemplateId}`,
      );
      expect(
        Array.from(svg.querySelectorAll('[data-odontogram-transform]')).map(
          (element) => element.getAttribute('transform'),
        ),
      ).toEqual(expectedTransforms);
      expect(svg.querySelector('style')).toBeNull();
    },
  );

  it('keeps two chart instance prefixes isolated with no duplicate IDs', async () => {
    const { container } = render(
      <div>
        <OdontogramTooth chartInstanceId="chart-a" position={11} />
        <OdontogramTooth chartInstanceId="chart-b" position={11} />
      </div>,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('svg')).toHaveLength(2);
    });

    const ids = Array.from(container.querySelectorAll('[id]')).map(
      (element) => element.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('chart-a__tooth-11__side__paint-11');
    expect(ids).toContain('chart-b__tooth-11__side__paint-11');
    expect(everyFragmentReferenceResolves(container)).toBe(true);
  });

  it('shows an accessible loading state while the template request is pending', () => {
    mockedLoadToothSvgTemplate.mockReturnValueOnce(
      new Promise(() => undefined),
    );

    render(<OdontogramTooth chartInstanceId="chart-a" position={11} />);

    expect(screen.getByRole('status').textContent).toBe('Loading tooth 11');
  });

  it('shows an accessible error state when the template cannot load', async () => {
    mockedLoadToothSvgTemplate.mockRejectedValueOnce(
      new Error('Template unavailable'),
    );

    render(<OdontogramTooth chartInstanceId="chart-a" position={11} />);

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Template unavailable',
    );
  });

  it('shows an accessible unavailable state for anterior occlusal requests', () => {
    render(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={11}
        view="occlusal"
      />,
    );

    expect(screen.getByRole('status').textContent).toBe('No occlusal view');
    expect(mockedLoadToothSvgTemplate).not.toHaveBeenCalled();
  });

  it('replaces the rendered template when position and view props change', async () => {
    const { container, rerender } = render(
      <OdontogramTooth chartInstanceId="chart-a" position={11} />,
    );

    expect((await findRenderedSvg(container)).id).toBe(
      'chart-a__tooth-11__side__template-11',
    );

    rerender(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={14}
        view="occlusal"
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('svg')?.id).toBe(
        'chart-a__tooth-14__occlusal__template-14_occl',
      );
    });
    expect(
      container.querySelector('#chart-a__tooth-11__side__template-11'),
    ).toBeNull();
  });

  it('cleans up safely when Strict Mode remounts and an old request settles late', async () => {
    const deferred = createDeferredTemplateLoad('11');
    mockedLoadToothSvgTemplate.mockReturnValueOnce(deferred.promise);

    const { container, unmount } = render(
      <StrictMode>
        <OdontogramTooth chartInstanceId="chart-a" position={11} />
      </StrictMode>,
    );

    unmount();
    deferred.resolve();
    await deferred.promise;

    expect(container.querySelector('svg')).toBeNull();
  });

  it('applies caries and filling visual layers to its own scoped SVG root', async () => {
    const { container } = render(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={16}
        tooth={tooth(16, [
          {
            appearance: 'existing',
            kind: 'filling',
            material: 'composite',
            surface: 'mesial',
          },
          {
            appearance: 'planned',
            kind: 'caries',
            severity: 6,
            surface: 'mesial',
          },
        ])}
      />,
    );

    await waitFor(() => {
      expect(
        getLayer(container, 'filling-composite-mesial')?.getAttribute(
          'data-active',
        ),
      ).toBe('1');
      expect(
        getLayer(container, 'subcaries-mesial')?.getAttribute('data-active'),
      ).toBe('1');
    });

    expect(
      getLayer(container, 'caries-mesial')?.getAttribute('data-active'),
    ).toBe('0');
    expect(
      getLayer(container, 'subcaries-mesial')?.getAttribute(
        'data-odontogram-appearance',
      ),
    ).toBe('planned');
  });

  it('renders existing missing base without natural or implant anatomy', async () => {
    const { container } = render(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={16}
        tooth={tooth(16, [], 'missing')}
      />,
    );

    await waitFor(() => {
      expect(getLayer(container, 'base')?.getAttribute('data-active')).toBe(
        '1',
      );
      expect(
        getLayer(container, 'tooth-base')?.getAttribute('data-active'),
      ).toBe('0');
      expect(getLayer(container, 'implant')?.getAttribute('data-active')).toBe(
        '0',
      );
    });
  });

  it('renders existing implant base without marking it as planned', async () => {
    const { container } = render(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={16}
        tooth={tooth(16, [], 'implant')}
      />,
    );

    await waitFor(() => {
      expect(getLayer(container, 'implant')?.getAttribute('data-active')).toBe(
        '1',
      );
      expect(
        getLayer(container, 'implant-base')?.getAttribute('data-active'),
      ).toBe('1');
    });

    expect(
      getLayer(container, 'implant')?.getAttribute(
        'data-odontogram-appearance',
      ),
    ).toBeNull();
    expect(getLayer(container, 'tooth-base')?.getAttribute('data-active')).toBe(
      '0',
    );
  });

  it('renders planned extraction and root-canal on side roots', async () => {
    const { container } = render(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={16}
        tooth={tooth(16, [
          { appearance: 'planned', kind: 'extraction' },
          {
            appearance: 'existing',
            kind: 'endodontic',
            state: 'root-canal',
          },
        ])}
      />,
    );

    await waitFor(() => {
      expect(
        getLayer(container, 'extraction-plan')?.getAttribute('data-active'),
      ).toBe('1');
      expect(
        getLayer(container, 'endo-filling')?.getAttribute('data-active'),
      ).toBe('1');
    });

    expect(
      getLayer(container, 'extraction-plan')?.getAttribute(
        'data-odontogram-appearance',
      ),
    ).toBe('planned');
    expect(
      getLayer(container, 'endo-filling')?.getAttribute(
        'data-odontogram-appearance',
      ),
    ).toBe('existing');
  });

  it('reports root-canal as unavailable in occlusal-only tooth rendering', async () => {
    render(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={16}
        tooth={tooth(16, [
          {
            appearance: 'existing',
            kind: 'endodontic',
            state: 'root-canal',
          },
        ])}
        view="occlusal"
      />,
    );

    expect(
      await screen.findByText('Tooth 16 root-canal is not shown in this view'),
    ).toBeTruthy();
  });

  it('removes stale caries and filling layers when tooth conditions change', async () => {
    const { container, rerender } = render(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={16}
        tooth={tooth(16, [
          {
            appearance: 'existing',
            kind: 'filling',
            material: 'amalgam',
            surface: 'distal',
          },
        ])}
      />,
    );

    await waitFor(() => {
      expect(
        getLayer(container, 'filling-amalgam-distal')?.getAttribute(
          'data-active',
        ),
      ).toBe('1');
    });

    rerender(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={16}
        tooth={tooth(16, [])}
      />,
    );

    await waitFor(() => {
      expect(
        getLayer(container, 'filling-amalgam-distal')?.getAttribute(
          'data-active',
        ),
      ).toBe('0');
    });
  });

  it('removes stale whole-tooth layers when base and conditions change', async () => {
    const { container, rerender } = render(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={16}
        tooth={tooth(
          16,
          [
            { appearance: 'planned', kind: 'extraction' },
            {
              appearance: 'existing',
              kind: 'endodontic',
              state: 'root-canal',
            },
          ],
          'implant',
        )}
      />,
    );

    await waitFor(() => {
      expect(getLayer(container, 'implant')?.getAttribute('data-active')).toBe(
        '1',
      );
      expect(
        getLayer(container, 'extraction-plan')?.getAttribute('data-active'),
      ).toBe('1');
      expect(
        getLayer(container, 'endo-filling')?.getAttribute('data-active'),
      ).toBe('1');
    });

    rerender(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={16}
        tooth={tooth(16, [])}
      />,
    );

    await waitFor(() => {
      expect(getLayer(container, 'implant')?.getAttribute('data-active')).toBe(
        '0',
      );
      expect(
        getLayer(container, 'extraction-plan')?.getAttribute('data-active'),
      ).toBe('0');
      expect(
        getLayer(container, 'endo-filling')?.getAttribute('data-active'),
      ).toBe('0');
      expect(
        getLayer(container, 'tooth-base')?.getAttribute('data-active'),
      ).toBe('1');
    });
  });

  it('renders posterior lingual conditions on the occlusal root', async () => {
    const { container } = render(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={16}
        tooth={tooth(16, [
          {
            appearance: 'existing',
            kind: 'caries',
            surface: 'lingual',
          },
        ])}
        view="occlusal"
      />,
    );

    await waitFor(() => {
      expect(
        getLayer(container, 'caries-lingual')?.getAttribute('data-active'),
      ).toBe('1');
    });
  });

  it('renders an accessible fallback when anterior lingual data has no visible layer', async () => {
    render(
      <OdontogramTooth
        chartInstanceId="chart-a"
        position={11}
        tooth={tooth(11, [
          {
            appearance: 'existing',
            kind: 'caries',
            surface: 'lingual',
          },
        ])}
      />,
    );

    expect(
      await screen.findByText(
        'Tooth 11 lingual surface is not shown in this view',
      ),
    ).toBeTruthy();
  });

  it('keeps unrelated tooth roots active when one tooth changes', async () => {
    const { container, rerender } = render(
      <div>
        <OdontogramTooth
          chartInstanceId="chart-a"
          position={16}
          tooth={tooth(16, [
            {
              appearance: 'existing',
              kind: 'caries',
              surface: 'occlusal',
            },
          ])}
        />
        <OdontogramTooth
          chartInstanceId="chart-a"
          position={26}
          tooth={tooth(26, [
            {
              appearance: 'existing',
              kind: 'filling',
              material: 'temporary',
              surface: 'occlusal',
            },
          ])}
        />
      </div>,
    );

    await waitFor(() => {
      expect(
        getLayer(container, 'filling-temporary-occlusal', 1)?.getAttribute(
          'data-active',
        ),
      ).toBe('1');
    });

    rerender(
      <div>
        <OdontogramTooth
          chartInstanceId="chart-a"
          position={16}
          tooth={tooth(16, [])}
        />
        <OdontogramTooth
          chartInstanceId="chart-a"
          position={26}
          tooth={tooth(26, [
            {
              appearance: 'existing',
              kind: 'filling',
              material: 'temporary',
              surface: 'occlusal',
            },
          ])}
        />
      </div>,
    );

    await waitFor(() => {
      expect(
        getLayer(container, 'filling-temporary-occlusal', 1)?.getAttribute(
          'data-active',
        ),
      ).toBe('1');
    });
  });
});

describe('resolveToothTemplateId', () => {
  it('resolves side and occlusal template IDs from layout metadata', () => {
    expect(resolveToothTemplateId(11, 'side')).toBe('11');
    expect(resolveToothTemplateId(23, 'side')).toBe('13');
    expect(resolveToothTemplateId(14, 'side')).toBe('14');
    expect(resolveToothTemplateId(48, 'side')).toBe('16');
    expect(resolveToothTemplateId(14, 'occlusal')).toBe('14_occl');
    expect(resolveToothTemplateId(36, 'occlusal')).toBe('16_occl');
    expect(resolveToothTemplateId(11, 'occlusal')).toBeNull();
  });
});

async function findRenderedSvg(container: HTMLElement): Promise<SVGSVGElement> {
  await waitFor(() => {
    expect(container.querySelector('svg')).not.toBeNull();
  });

  return container.querySelector('svg') as unknown as SVGSVGElement;
}

function createLoadedTemplate(
  templateId: ToothSvgTemplateId,
): LoadedToothSvgTemplate {
  const svg = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" id="template-${templateId}" viewBox="0 0 39.7 70.8">
      <defs>
        <linearGradient id="paint-${templateId}"><stop offset="0" stop-color="#fff" /></linearGradient>
      </defs>
      <g id="base" data-active="1" />
      <path id="tooth-base" data-active="1" style="fill: url(#paint-${templateId});" d="M0 0h1v1H0z" />
      <path id="tooth-base-beauty" data-active="1" d="M0 0h1v1H0z" />
      <path id="tooth-healthy-pulp" data-active="1" d="M0 0h1v1H0z" />
      <path id="tooth-inflam-pulp" data-active="0" d="M0 0h1v1H0z" />
      <g id="implant" data-active="0" />
      <path id="implant-base" data-active="0" d="M0 0h1v1H0z" />
      <path id="extraction-plan" data-active="0" d="M0 0h1v1H0z" />
      <path id="endo-filling" data-active="0" d="M0 0h1v1H0z" />
      <path id="caries-occlusal" data-active="0" d="M1 1h1v1H1z" />
      <path id="caries-mesial" data-active="0" d="M1 1h1v1H1z" />
      <path id="caries-lingual" data-active="0" d="M1 1h1v1H1z" />
      <path id="subcaries-mesial" data-active="0" d="M1 1h1v1H1z" />
      <path id="filling-amalgam-distal" data-active="0" d="M1 1h1v1H1z" />
      <path id="filling-composite-mesial" data-active="0" d="M1 1h1v1H1z" />
      <path id="filling-temporary-occlusal" data-active="0" d="M1 1h1v1H1z" />
    </svg>`,
    'image/svg+xml',
  ).documentElement as unknown as SVGSVGElement;

  if (templateId === '14_occl' || templateId === '16_occl') {
    svg.setAttribute('viewBox', '0 0 49.3 40.9');
  }

  return {
    id: templateId,
    manifest: TOOTH_SVG_TEMPLATE_MANIFEST[templateId],
    svg,
  };
}

function getLayer(
  container: HTMLElement,
  originalLayerId: string,
  index = 0,
): SVGElement | null {
  return (
    (container.querySelectorAll(`[data-odontogram-layer="${originalLayerId}"]`)[
      index
    ] as SVGElement | undefined) ?? null
  );
}

function tooth(
  position: OdontogramToothModel['position'],
  conditions: OdontogramToothModel['conditions'],
  base: OdontogramToothModel['base'] = 'natural',
): OdontogramToothModel {
  return {
    base,
    conditions,
    position,
  };
}

function createDeferredTemplateLoad(templateId: ToothSvgTemplateId) {
  let resolvePromise: (() => void) | undefined;
  const promise = new Promise<LoadedToothSvgTemplate>((resolve) => {
    resolvePromise = () => {
      resolve(createLoadedTemplate(templateId));
    };
  });

  return {
    promise,
    resolve: () => resolvePromise?.(),
  };
}

function everyFragmentReferenceResolves(root: ParentNode): boolean {
  const ids = new Set(
    Array.from(root.querySelectorAll('[id]')).map((element) => element.id),
  );

  return Array.from(root.querySelectorAll('*')).every((element) =>
    Array.from(element.attributes).every((attribute) => {
      const referencedIds = Array.from(
        attribute.value.matchAll(/url\(\s*['"]?#([^)'" ]+)['"]?\s*\)/gu),
      ).flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

      return referencedIds.every((referencedId) => ids.has(referencedId));
    }),
  );
}
