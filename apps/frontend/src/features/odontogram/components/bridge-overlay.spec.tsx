import { render, waitFor } from '@testing-library/react';
import { StrictMode, useRef } from 'react';

import {
  TOOTH_POSITIONS,
  type OdontogramCondition,
  type OdontogramData,
  type OdontogramTooth,
  type ToothPosition,
} from '../model/odontogram';
import { BridgeOverlay } from './bridge-overlay';

describe('BridgeOverlay', () => {
  let rectSpy: jest.SpyInstance<DOMRect, []>;
  let originalResizeObserver: typeof ResizeObserver | undefined;
  let resizeObserverInstances: TestResizeObserver[];

  beforeEach(() => {
    resizeObserverInstances = [];
    originalResizeObserver = globalThis.ResizeObserver;
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: class ResizeObserverMock extends TestResizeObserver {
        constructor(callback: ResizeObserverCallback) {
          super(callback);
          resizeObserverInstances.push(this);
        }
      } as unknown as typeof ResizeObserver,
      writable: true,
    });

    rectSpy = jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function getMockRect(this: HTMLElement) {
        const position = this.getAttribute('data-odontogram-position');
        if (this.getAttribute('data-testid') === 'odontogram-chart') {
          return domRect(100, 50, 360, 220);
        }

        if (position !== null) {
          return anchorRect(Number(position) as ToothPosition);
        }

        return domRect(0, 0, 0, 0);
      });
  });

  afterEach(() => {
    rectSpy.mockRestore();
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: originalResizeObserver,
      writable: true,
    });
  });

  it('renders bridge bars from anchors inside its own chart container only', async () => {
    const { container } = render(
      <>
        <div
          data-odontogram-bridge-anchor="true"
          data-odontogram-position="16"
          data-testid="outside-anchor"
        />
        <BridgeOverlayHarness
          data={chart({
            16: [bridge('bridge-a', 'abutment')],
            15: [bridge('bridge-a', 'pontic')],
          })}
        />
      </>,
    );

    const bar = await findBridgeBar(container, 'bridge-a');

    expect(bar.getAttribute('data-odontogram-bridge-segment')).toBe('16-15');
    expect(bar.getAttribute('fill')).toBe('#feffbf');
    expect(bar.getAttribute('x')).toBe('145.2');
    expect(bar.getAttribute('width')).toBe('19.599999999999994');
  });

  it('keeps adjacent independent bridge IDs as separate overlay bars', async () => {
    const { container } = render(
      <BridgeOverlayHarness
        data={chart({
          16: [bridge('bridge-a', 'abutment')],
          15: [bridge('bridge-a', 'pontic')],
          14: [bridge('bridge-b', 'abutment', 'gold')],
          13: [bridge('bridge-b', 'pontic', 'gold')],
        })}
      />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('[data-odontogram-bridge-id]')).toHaveLength(2);
    });
    expect(
      Array.from(container.querySelectorAll('[data-odontogram-bridge-id]')).map(
        (element) => element.getAttribute('data-odontogram-bridge-id'),
      ),
    ).toEqual(['bridge-a', 'bridge-b']);
  });

  it('updates bars when controlled data changes', async () => {
    const { container, rerender } = render(
      <BridgeOverlayHarness
        data={chart({
          16: [bridge('bridge-a', 'abutment')],
          15: [bridge('bridge-a', 'pontic')],
        })}
      />,
    );

    await findBridgeBar(container, 'bridge-a');

    rerender(<BridgeOverlayHarness data={chart()} />);

    await waitFor(() => {
      expect(container.querySelector('[data-odontogram-bridge-id]')).toBeNull();
    });
  });

  it('remeasures when ResizeObserver reports a layout change', async () => {
    let tooth15Left = 160;
    rectSpy.mockImplementation(function getMockRect(this: HTMLElement) {
      const position = this.getAttribute('data-odontogram-position');
      if (this.getAttribute('data-testid') === 'odontogram-chart') {
        return domRect(100, 50, 360, 220);
      }

      if (position === '16') {
        return domRect(110, 70, 40, 100);
      }

      if (position === '15') {
        return domRect(tooth15Left, 70, 40, 100);
      }

      return domRect(0, 0, 0, 0);
    });

    const { container } = render(
      <BridgeOverlayHarness
        data={chart({
          16: [bridge('bridge-a', 'abutment')],
          15: [bridge('bridge-a', 'pontic')],
        })}
      />,
    );

    const firstBar = await findBridgeBar(container, 'bridge-a');
    expect(firstBar.getAttribute('width')).toBe('19.599999999999994');

    tooth15Left = 180;
    resizeObserverInstances[0]?.trigger();

    await waitFor(() => {
      expect(
        container
          .querySelector('[data-odontogram-bridge-id="bridge-a"]')
          ?.getAttribute('width'),
      ).toBe('39.599999999999994');
    });
  });

  it('disconnects observers safely across Strict Mode remount cleanup', async () => {
    const { container, unmount } = render(
      <StrictMode>
        <BridgeOverlayHarness
          data={chart({
            16: [bridge('bridge-a', 'abutment')],
            15: [bridge('bridge-a', 'pontic')],
          })}
        />
      </StrictMode>,
    );

    await findBridgeBar(container, 'bridge-a');
    unmount();

    expect(
      resizeObserverInstances.every(
        (instance) => instance.disconnectCallCount > 0,
      ),
    ).toBe(true);
  });
});

function BridgeOverlayHarness({
  data,
  layoutKey,
}: {
  readonly data: OdontogramData;
  readonly layoutKey?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div data-testid="odontogram-chart" ref={containerRef}>
      {TOOTH_POSITIONS.map((position) => (
        <div
          data-odontogram-bridge-anchor="true"
          data-odontogram-position={position}
          key={position}
        />
      ))}
      <BridgeOverlay
        containerRef={containerRef}
        data={data}
        layoutKey={layoutKey}
      />
    </div>
  );
}

async function findBridgeBar(
  container: HTMLElement,
  bridgeId: string,
): Promise<Element> {
  await waitFor(() => {
    expect(
      container.querySelector(`[data-odontogram-bridge-id="${bridgeId}"]`),
    ).not.toBeNull();
  });

  const bar = container.querySelector(
    `[data-odontogram-bridge-id="${bridgeId}"]`,
  );
  if (bar === null) {
    throw new Error(`Expected bridge bar ${bridgeId}`);
  }

  return bar;
}

function chart(
  overrides: Partial<
    Record<ToothPosition, readonly OdontogramCondition[]>
  > = {},
): OdontogramData {
  return {
    teeth: TOOTH_POSITIONS.map((position) =>
      tooth(position, overrides[position] ?? []),
    ),
  };
}

function tooth(
  position: ToothPosition,
  conditions: readonly OdontogramCondition[],
): OdontogramTooth {
  return {
    base: conditions.some(
      (condition) => condition.kind === 'bridge' && condition.role === 'pontic',
    )
      ? 'missing'
      : 'natural',
    conditions,
    position,
  };
}

function bridge(
  bridgeId: string,
  role: Extract<OdontogramCondition, { readonly kind: 'bridge' }>['role'],
  material: Extract<
    OdontogramCondition,
    { readonly kind: 'bridge' }
  >['material'] = 'zircon',
  appearance: Extract<
    OdontogramCondition,
    { readonly kind: 'bridge' }
  >['appearance'] = 'existing',
): Extract<OdontogramCondition, { readonly kind: 'bridge' }> {
  return {
    appearance,
    bridgeId,
    kind: 'bridge',
    material,
    role,
  };
}

function anchorRect(position: ToothPosition): DOMRect {
  const index = TOOTH_POSITIONS.indexOf(position);

  return domRect(110 + index * 50, 70, 40, 100);
}

function domRect(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    toJSON: () => ({}),
    top,
    width,
    x: left,
    y: top,
  } as DOMRect;
}

class TestResizeObserver {
  disconnectCallCount = 0;
  readonly observe = jest.fn();
  readonly unobserve = jest.fn();

  constructor(private readonly callback: ResizeObserverCallback) {}

  disconnect(): void {
    this.disconnectCallCount += 1;
  }

  trigger(): void {
    this.callback([], this as unknown as ResizeObserver);
  }
}
