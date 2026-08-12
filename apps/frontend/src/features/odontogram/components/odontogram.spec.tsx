import { render, screen, waitFor } from '@testing-library/react';

import {
  TOOTH_POSITIONS,
  type OdontogramCondition,
  type OdontogramData,
  type OdontogramSelection,
  type ToothPosition,
} from '../model/odontogram';
import {
  TOOTH_SVG_TEMPLATE_MANIFEST,
  loadToothSvgTemplate,
  type LoadedToothSvgTemplate,
  type ToothSvgTemplateId,
} from '../rendering/svg-template-loader';
import { Odontogram } from './odontogram';

jest.mock('../rendering/svg-template-loader', () => {
  const actual = jest.requireActual('../rendering/svg-template-loader');

  return {
    ...actual,
    loadToothSvgTemplate: jest.fn(),
  };
});

const mockedLoadToothSvgTemplate = jest.mocked(loadToothSvgTemplate);

describe('Odontogram', () => {
  beforeEach(() => {
    mockedLoadToothSvgTemplate.mockReset();
    mockedLoadToothSvgTemplate.mockImplementation(async (templateId) =>
      createLoadedTemplate(templateId),
    );
  });

  it('renders all 32 permanent positions in upper and lower arch order', async () => {
    const { container } = render(
      <Odontogram data={createChart()} selection={EMPTY_SELECTION} />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('svg')).toHaveLength(32);
    });

    expect(screen.getByRole('listbox', { name: 'Odontogram' })).toBeTruthy();
    expect(
      screen
        .getAllByRole('option')
        .map((option) =>
          Number(option.getAttribute('data-odontogram-position')),
        ),
    ).toEqual([...TOOTH_POSITIONS]);
    expect(
      container.querySelectorAll('[data-odontogram-bridge-anchor="true"]'),
    ).toHaveLength(32);
  });

  it('keeps one accessible tooth option per position and hides visual tooth cells from the accessibility tree', async () => {
    const { container } = render(
      <Odontogram data={createChart()} selection={EMPTY_SELECTION} />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('svg')).toHaveLength(32);
    });

    expect(screen.getAllByRole('option')).toHaveLength(32);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('side view renders no occlusal tooth roots or template requests', async () => {
    const { container } = render(
      <Odontogram
        data={createChart()}
        selection={EMPTY_SELECTION}
        view="side"
      />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('svg')).toHaveLength(32);
    });

    expect(
      mockedLoadToothSvgTemplate.mock.calls.some(([templateId]) =>
        templateId.endsWith('_occl'),
      ),
    ).toBe(false);
    expect(
      container.querySelectorAll('[data-odontogram-tooth-view="occlusal"]'),
    ).toHaveLength(0);
  });

  it('side-and-occlusal view renders only the 20 posterior occlusal tooth roots', async () => {
    const { container } = render(
      <Odontogram
        data={createChart()}
        selection={EMPTY_SELECTION}
        view="side-and-occlusal"
      />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('svg')).toHaveLength(52);
    });

    expect(
      container.querySelectorAll('[data-odontogram-tooth-view="occlusal"]'),
    ).toHaveLength(20);
    expect(
      mockedLoadToothSvgTemplate.mock.calls.filter(([templateId]) =>
        templateId.endsWith('_occl'),
      ),
    ).toHaveLength(20);
  });

  it('changes displayed labels for FDI, Universal, and Palmer without changing tooth identity', async () => {
    const { container, rerender } = render(
      <Odontogram
        data={createChart()}
        numberingSystem="fdi"
        selection={EMPTY_SELECTION}
      />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('svg')).toHaveLength(32);
    });
    expect(optionLabels()).toEqual([
      'Tooth 18',
      'Tooth 17',
      'Tooth 16',
      'Tooth 15',
    ]);

    rerender(
      <Odontogram
        data={createChart()}
        numberingSystem="universal"
        selection={EMPTY_SELECTION}
      />,
    );
    expect(optionLabels()).toEqual([
      'Tooth 1',
      'Tooth 2',
      'Tooth 3',
      'Tooth 4',
    ]);

    rerender(
      <Odontogram
        data={createChart()}
        numberingSystem="palmer"
        selection={EMPTY_SELECTION}
      />,
    );
    expect(optionLabels()).toEqual([
      'Tooth UR-8',
      'Tooth UR-7',
      'Tooth UR-6',
      'Tooth UR-5',
    ]);
    expect(
      screen
        .getAllByRole('option')
        .map((option) =>
          Number(option.getAttribute('data-odontogram-position')),
        ),
    ).toEqual([...TOOTH_POSITIONS]);
  });

  it('renders two chart instances independently without duplicate SVG IDs', async () => {
    const { container } = render(
      <div>
        <Odontogram
          ariaLabel="First odontogram"
          data={createChart()}
          selection={EMPTY_SELECTION}
        />
        <Odontogram
          ariaLabel="Second odontogram"
          data={createChart()}
          selection={EMPTY_SELECTION}
        />
      </div>,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('svg')).toHaveLength(64);
    });

    const ids = Array.from(container.querySelectorAll('svg [id], svg[id]')).map(
      (element) => element.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(
      screen.getByRole('listbox', { name: 'First odontogram' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('listbox', { name: 'Second odontogram' }),
    ).toBeTruthy();
  });

  it('shows scoped loading UI while tooth assets are pending', () => {
    mockedLoadToothSvgTemplate.mockReturnValue(new Promise(() => undefined));

    render(<Odontogram data={createChart()} selection={EMPTY_SELECTION} />);

    expect(screen.getAllByRole('status')).toHaveLength(32);
    expect(screen.getAllByRole('status')[0]?.textContent).toBe(
      'Loading tooth 18',
    );
  });

  it('shows scoped asset-error UI when tooth assets fail', async () => {
    mockedLoadToothSvgTemplate.mockRejectedValue(new Error('Asset failed'));

    render(<Odontogram data={createChart()} selection={EMPTY_SELECTION} />);

    await waitFor(() => {
      expect(screen.getAllByRole('alert')).toHaveLength(32);
    });
    expect(screen.getAllByRole('alert')[0]?.textContent).toBe('Asset failed');
  });

  it('renders a chart-level error and no tooth chart when a position is missing', () => {
    render(
      <Odontogram
        data={{
          teeth: createChart().teeth.filter((tooth) => tooth.position !== 18),
        }}
        selection={EMPTY_SELECTION}
      />,
    );

    expect(screen.getByRole('alert').textContent).toContain('Missing tooth 18');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(mockedLoadToothSvgTemplate).not.toHaveBeenCalled();
  });

  it('renders a chart-level error and no tooth chart when a position is duplicated', () => {
    const chart = createChart();
    const firstTooth = chart.teeth[0];
    if (firstTooth === undefined) {
      throw new Error('Expected a complete chart fixture');
    }

    render(
      <Odontogram
        data={{ teeth: [firstTooth, ...chart.teeth] }}
        selection={EMPTY_SELECTION}
      />,
    );

    expect(screen.getByRole('alert').textContent).toContain(
      'Duplicate tooth 18',
    );
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(mockedLoadToothSvgTemplate).not.toHaveBeenCalled();
  });
});

const EMPTY_SELECTION: OdontogramSelection = {
  activeToothPosition: null,
  selectedToothPositions: [],
};

function createChart(
  overrides: Partial<
    Record<ToothPosition, readonly OdontogramCondition[]>
  > = {},
): OdontogramData {
  return {
    teeth: TOOTH_POSITIONS.map((position) => ({
      position,
      base: 'natural',
      conditions: overrides[position] ?? [],
    })),
  };
}

function optionLabels(): readonly (string | null)[] {
  return screen
    .getAllByRole('option')
    .slice(0, 4)
    .map((option) => option.getAttribute('aria-label'));
}

function createLoadedTemplate(
  templateId: ToothSvgTemplateId,
): LoadedToothSvgTemplate {
  const svg = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" id="template-${templateId}" viewBox="0 0 39.7 70.8">
      <defs>
        <linearGradient id="paint-${templateId}"><stop offset="0" stop-color="#fff" /></linearGradient>
      </defs>
      <path id="tooth-base" data-active="1" style="fill: url(#paint-${templateId});" d="M0 0h1v1H0z" />
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
