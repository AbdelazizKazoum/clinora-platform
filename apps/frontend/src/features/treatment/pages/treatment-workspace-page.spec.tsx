import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import { Odontogram } from '@/features/odontogram';

import { TreatmentWorkspacePage } from './treatment-workspace-page';

jest.mock('@/features/odontogram', () => {
  const actual = jest.requireActual('@/features/odontogram');
  return {
    ...actual,
    Odontogram: jest.fn(({ data }: { data: { teeth: readonly unknown[] } }) => (
      <output data-testid="odontogram-projection">
        {JSON.stringify(data.teeth)}
      </output>
    )),
    ToothSurfaceSelector: () => <div>Mock surface selector</div>,
  };
});

jest.mock('@/components/PageBreadcrumb', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

describe('Treatment workspace page', () => {
  it('records radiographic depth and displays it in the tooth record', () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.change(screen.getByLabelText('Radiographic depth'), {
      target: { value: 'D2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm finding' }));
    expect(
      screen.getByText('D2 — middle dentine', { selector: 'dd' }),
    ).toBeTruthy();
  });

  it('supports a filling without inventing a marginal defect', () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.change(screen.getByLabelText('Finding'), {
      target: { value: 'EXISTING_FILLING' },
    });
    expect(screen.getByLabelText('Additional clinical detail')).toHaveProperty(
      'value',
      '',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm finding' }));
    expect(
      screen.getByText('Clinical finding confirmed and added to the chart.'),
    ).toBeTruthy();
    expect(
      screen.getByTestId('odontogram-projection').textContent,
    ).not.toContain('filling-defect');
  });

  it('plans a band appliance and projects it immediately', () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment' }));
    fireEvent.change(screen.getByLabelText('Treatment act'), {
      target: { value: 'ORTHODONTIC_APPLIANCE' },
    });
    fireEvent.change(screen.getByLabelText('Appliance type'), {
      target: { value: 'BAND' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment act' }));
    expect(screen.getByTestId('odontogram-projection').textContent).toContain(
      '"subtype":"BAND"',
    );
  });

  it('keeps edge and cervical wear independently editable', () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.change(screen.getByLabelText('Finding'), {
      target: { value: 'TOOTH_WEAR' },
    });
    fireEvent.change(screen.getByLabelText('Incisal / occlusal wear'), {
      target: { value: 'ATTRITION' },
    });
    fireEvent.change(screen.getByLabelText('Cervical wear'), {
      target: { value: 'EROSION' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm finding' }));
    expect(screen.getByTestId('odontogram-projection').textContent).toContain(
      'wear-edge',
    );
    expect(screen.getByTestId('odontogram-projection').textContent).toContain(
      'wear-cervical',
    );
  });

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

    fireEvent.click(
      within(screen.getByRole('row', { name: /Crown/ })).getByRole('button', {
        name: 'Done',
      }),
    );

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
    expect(
      screen.getByRole('button', { name: 'Confirm finding' }),
    ).toHaveProperty('disabled', true);
  });

  it('opens the separate periodontal workspace with six-site controls and empty-state summary', async () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('tab', { name: /Periodontal chart/ }));

    await waitFor(() =>
      expect(screen.getByText('Periodontal examination')).toBeTruthy(),
    );
    expect(
      screen.getByRole('spinbutton', { name: 'MB probing depth' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('spinbutton', { name: 'DL probing depth' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'buccal periodontal arch' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'lingual periodontal arch' }),
    ).toBeTruthy();
    expect(screen.getByText('Whole-mouth summary')).toBeTruthy();
    expect(screen.getByText('Charted sites')).toBeTruthy();

    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'MB probing depth' }),
      { target: { value: '4' } },
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'MB bleeding on probing' }),
    );
    fireEvent.change(screen.getByLabelText('Mobility grade'), {
      target: { value: '2' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'BUCCAL plaque presence' }),
    );
    fireEvent.click(
      screen.getByRole('tab', { name: /Odontogram & tooth details/ }),
    );
    fireEvent.click(screen.getByRole('tab', { name: /Periodontal chart/ }));
    await waitFor(() =>
      expect(
        screen.getByRole('spinbutton', { name: 'MB probing depth' }),
      ).toHaveProperty('value', '4'),
    );
    expect(
      screen.getByRole('checkbox', { name: 'MB bleeding on probing' }),
    ).toHaveProperty('checked', true);
    expect(screen.getByLabelText('Mobility grade')).toHaveProperty(
      'value',
      '2',
    );
    expect(
      screen.getByRole('checkbox', { name: 'BUCCAL plaque presence' }),
    ).toHaveProperty('checked', true);
  });

  it('keeps drafts across tabs and skips chart rendering while typing a note', () => {
    render(<TreatmentWorkspacePage />);
    const chartRenders = jest.mocked(Odontogram).mock.calls.length;
    fireEvent.change(screen.getByLabelText('Clinical note'), {
      target: { value: 'Review radiograph' },
    });
    expect(jest.mocked(Odontogram).mock.calls.length).toBe(chartRenders);

    fireEvent.click(screen.getByRole('tab', { name: /Clinical findings/ }));
    expect(screen.getByRole('table')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('tab', { name: /Odontogram & tooth details/ }),
    );
    expect(screen.getByLabelText('Clinical note')).toHaveProperty(
      'value',
      'Review radiograph',
    );
  });

  it('shows additional finding details only in the finding form', () => {
    render(<TreatmentWorkspacePage />);
    expect(screen.getByLabelText('Additional clinical detail')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Additional clinical detail'), {
      target: { value: 'SUBCROWN' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm finding' }));
    expect(
      screen.getByText('Clinical finding confirmed and added to the chart.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment' }));
    expect(screen.queryByLabelText('Additional clinical detail')).toBeNull();
  });

  it('supports assistant drafts, dentist approval, and visit completion', () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('tab', { name: /Documentation handoff/ }));
    fireEvent.click(screen.getByRole('button', { name: /Assign to Yasmine/ }));
    fireEvent.change(screen.getByLabelText('Demo actor'), {
      target: { value: 'assistant' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Start documentation' }),
    );
    fireEvent.click(
      screen.getByRole('tab', { name: /Odontogram & tooth details/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add draft finding' }));
    expect(
      screen.getByText('Draft finding added for dentist review.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /Documentation handoff/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    fireEvent.change(screen.getByLabelText('Demo actor'), {
      target: { value: 'doctor' },
    });
    fireEvent.click(screen.getByRole('tab', { name: /Clinical findings/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    fireEvent.click(screen.getByRole('tab', { name: /Documentation handoff/ }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Accept documentation' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Complete visit' }));
    expect(screen.getByText('Visit completed and locked.')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('tab', { name: /Odontogram & tooth details/ }),
    );
    expect(screen.getByLabelText('Clinical note')).toHaveProperty(
      'disabled',
      true,
    );
  });
});
