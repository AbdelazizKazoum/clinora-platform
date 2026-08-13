import { fireEvent, render, screen } from '@testing-library/react';

import { TreatmentWorkspacePage } from './treatment-workspace-page';

jest.mock('@/features/odontogram', () => {
  const actual = jest.requireActual('@/features/odontogram');
  return {
    ...actual,
    Odontogram: ({ data }: { data: { teeth: readonly unknown[] } }) => (
      <output data-testid="odontogram-projection">
        {JSON.stringify(data.teeth)}
      </output>
    ),
    ToothSurfaceSelector: () => <div>Mock surface selector</div>,
  };
});

jest.mock('@/components/PageBreadcrumb', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

describe('Treatment workspace page', () => {
  it('renders a visit and immediately projects a newly planned act', () => {
    render(<TreatmentWorkspacePage />);

    expect(screen.getByText('Treatment workspace')).toBeTruthy();
    expect(screen.getByText('Omar El Mansouri')).toBeTruthy();
    expect(screen.getByTestId('odontogram-projection').textContent).toContain(
      'caries',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment' }));
    fireEvent.change(screen.getByLabelText('Treatment act'), {
      target: { value: 'CROWN' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment act' }));

    expect(screen.getByTestId('odontogram-projection').textContent).toContain(
      'restoration',
    );
    expect(
      screen.getByText(
        'Treatment act planned and projected on the odontogram where supported.',
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.getByTestId('odontogram-projection').textContent).toContain(
      '"appearance":"existing","kind":"restoration"',
    );
    expect(
      screen.getByText(
        'Treatment act completed and updated on the odontogram.',
      ),
    ).toBeTruthy();
  });
});
