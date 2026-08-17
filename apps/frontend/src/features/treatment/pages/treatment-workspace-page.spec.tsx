import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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

  it('reports an unavailable prosthesis subtype for a natural tooth', () => {
    render(<TreatmentWorkspacePage />);

    fireEvent.change(screen.getByLabelText('Finding'), {
      target: { value: 'EXISTING_PROSTHESIS' },
    });

    expect(
      screen.getByText(
        'This clinical concept is not available for the selected tooth base or dentition.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Confirm finding' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('opens the separate periodontal workspace with six-site controls and empty-state summary', async () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Periodontal chart' }));

    await waitFor(() => expect(screen.getByText('Periodontal examination')).toBeTruthy());
    expect(screen.getByRole('spinbutton', { name: 'MB probing depth' })).toBeTruthy();
    expect(screen.getByRole('spinbutton', { name: 'DL probing depth' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'buccal periodontal arch' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'lingual periodontal arch' })).toBeTruthy();
    expect(screen.getByText('Whole-mouth summary')).toBeTruthy();
    expect(screen.getByText('Charted sites')).toBeTruthy();
  });
});
