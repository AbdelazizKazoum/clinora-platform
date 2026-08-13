import { fireEvent, render, screen } from '@testing-library/react';

import {
  ODONTOGRAM_DEFAULT_ZOOM,
  ODONTOGRAM_MAX_ZOOM,
  ODONTOGRAM_MIN_ZOOM,
  OdontogramViewport,
} from './odontogram-viewport';

describe('OdontogramViewport', () => {
  it('renders accessible bounded zoom controls around its chart content', () => {
    render(
      <OdontogramViewport ariaLabel="Odontogram">
        {({ zoom }) => (
          <div data-testid="chart" data-zoom={zoom}>
            Chart
          </div>
        )}
      </OdontogramViewport>,
    );

    expect(screen.getByLabelText('Odontogram zoom controls')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(
      screen.getByLabelText('Zoom out odontogram').hasAttribute('disabled'),
    ).toBe(false);
    expect(
      screen.getByLabelText('Zoom in odontogram').hasAttribute('disabled'),
    ).toBe(false);
    expect(
      screen.getByLabelText('Reset odontogram zoom').hasAttribute('disabled'),
    ).toBe(true);
    expect(screen.getByTestId('chart').getAttribute('data-zoom')).toBe(
      String(ODONTOGRAM_DEFAULT_ZOOM),
    );
  });

  it('zooms in, zooms out, clamps at configured bounds, and resets locally', () => {
    render(
      <OdontogramViewport ariaLabel="Odontogram">
        {({ zoom }) => (
          <div data-testid="chart" data-zoom={zoom}>
            Chart
          </div>
        )}
      </OdontogramViewport>,
    );

    fireEvent.click(screen.getByLabelText('Zoom in odontogram'));
    fireEvent.click(screen.getByLabelText('Zoom in odontogram'));
    fireEvent.click(screen.getByLabelText('Zoom in odontogram'));
    fireEvent.click(screen.getByLabelText('Zoom in odontogram'));
    expect(screen.getByTestId('chart').getAttribute('data-zoom')).toBe(
      String(ODONTOGRAM_MAX_ZOOM),
    );
    expect(
      screen.getByLabelText('Zoom in odontogram').hasAttribute('disabled'),
    ).toBe(true);

    fireEvent.click(screen.getByLabelText('Reset odontogram zoom'));
    expect(screen.getByTestId('chart').getAttribute('data-zoom')).toBe(
      String(ODONTOGRAM_DEFAULT_ZOOM),
    );

    fireEvent.click(screen.getByLabelText('Zoom out odontogram'));
    fireEvent.click(screen.getByLabelText('Zoom out odontogram'));
    expect(screen.getByTestId('chart').getAttribute('data-zoom')).toBe(
      String(ODONTOGRAM_MIN_ZOOM),
    );
    expect(
      screen.getByLabelText('Zoom out odontogram').hasAttribute('disabled'),
    ).toBe(true);
  });

  it('applies the zoom as a scoped CSS variable and transform-layer marker', () => {
    const { container } = render(
      <OdontogramViewport ariaLabel="Odontogram">
        {() => <div>Chart</div>}
      </OdontogramViewport>,
    );

    fireEvent.click(screen.getByLabelText('Zoom in odontogram'));

    const sizer = container.querySelector('[style*="--odontogram-zoom"]');
    const transformedLayer = container.querySelector('[data-odontogram-zoom]');

    expect(sizer?.getAttribute('style')).toContain('--odontogram-zoom: 1.25');
    expect(transformedLayer?.getAttribute('data-odontogram-zoom')).toBe('125');
  });
});
