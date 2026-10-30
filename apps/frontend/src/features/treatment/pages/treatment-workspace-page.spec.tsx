import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import { Odontogram, type OdontogramTooth } from '@/features/odontogram';
import { useSession } from 'next-auth/react';
import { useStaffDirectory, type StaffDirectoryMember } from '@/features/staff';

import { TreatmentWorkspacePage } from './treatment-workspace-page';

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }));
jest.mock('@/features/staff', () => ({ useStaffDirectory: jest.fn() }));

const clinicId = 'clinic-roster';
const assistant = (
  overrides: Partial<StaffDirectoryMember> = {},
): StaffDirectoryMember => ({
  clinicId,
  userId: 'assistant-demo',
  fullName: 'Yasmine Alaoui',
  role: 'DENTAL_ASSISTANT',
  status: 'active',
  isActive: true,
  ...overrides,
});
const staffDirectory = [
  assistant(),
  assistant({
    userId: 'secretary-demo',
    fullName: 'Salma Idrissi',
    role: 'SECRETARY',
  }),
  assistant({ userId: 'assistant-2', fullName: 'Amine Bennani' }),
  assistant({ userId: 'doctor-2', fullName: 'Other Doctor', role: 'DOCTOR' }),
  assistant({
    userId: 'inactive',
    fullName: 'Inactive Assistant',
    status: 'inactive',
    isActive: false,
  }),
  assistant({
    userId: 'leave',
    fullName: 'Assistant On Leave',
    status: 'on-leave',
  }),
  assistant({
    userId: 'disabled',
    fullName: 'Disabled Assistant',
    isActive: false,
  }),
  assistant({
    userId: 'elsewhere',
    fullName: 'Other Clinic Assistant',
    clinicId: 'other-clinic',
  }),
];
const refetchDirectory = jest.fn();

function mockDirectory(
  overrides: Partial<ReturnType<typeof useStaffDirectory>> = {},
) {
  jest.mocked(useStaffDirectory).mockReturnValue({
    data: staffDirectory,
    error: null,
    isError: false,
    isLoading: false,
    isFetching: false,
    refetch: refetchDirectory,
    ...overrides,
  } as ReturnType<typeof useStaffDirectory>);
}

function selectAssistant(userId = 'assistant-demo') {
  fireEvent.change(screen.getByLabelText('Assign to staff member'), {
    target: { value: userId },
  });
}

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
  beforeEach(() => {
    refetchDirectory.mockReset();
    jest.mocked(useSession).mockReturnValue({
      status: 'authenticated',
      data: {
        expires: '2099-01-01T00:00:00.000Z',
        user: {
          id: 'doctor-demo',
          clinicId,
          role: 'doctor',
          fullName: 'Dr. Sara Benali',
          email: 'doctor@example.test',
        },
      },
      update: jest.fn(),
    });
    mockDirectory();
  });

  it('lists active clinic assistants and requires a choice before assigning', () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('tab', { name: /Documentation handoff/ }));
    expect(useStaffDirectory).toHaveBeenCalledWith(clinicId);
    const select = screen.getByLabelText('Assign to staff member');
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'Select an assistant or secretariat user',
      'Yasmine Alaoui · Dental assistant',
      'Salma Idrissi · Secretariat',
      'Amine Bennani · Dental assistant',
    ]);
    fireEvent.change(screen.getByLabelText('Doctor instructions'), {
      target: { value: 'Record findings for review.' },
    });
    expect(
      screen.getByRole('button', { name: 'Assign handoff' }),
    ).toHaveProperty('disabled', true);
  });

  it('retains the selected assistant across tabs and lets that assistant start the handoff', () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('tab', { name: /Documentation handoff/ }));
    selectAssistant('assistant-2');
    fireEvent.change(screen.getByLabelText('Doctor instructions'), {
      target: { value: 'Record the crown plan for review.' },
    });
    fireEvent.click(screen.getByRole('tab', { name: /Clinical findings/ }));
    fireEvent.click(screen.getByRole('tab', { name: /Documentation handoff/ }));
    expect(screen.getByLabelText('Assign to staff member')).toHaveProperty(
      'value',
      'assistant-2',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Assign to Amine Bennani' }),
    );
    expect(
      screen.getByText('Amine Bennani', { selector: 'strong' }),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Assign to staff member')).toBeNull();
    fireEvent.change(screen.getByLabelText('Demo actor'), {
      target: { value: 'assistant' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Start documentation' }),
    );
    expect(screen.getByRole('button', { name: 'Complete visit' })).toBeTruthy();
  });

  it.each([
    {
      state: 'loading',
      query: { data: undefined, isLoading: true },
      message: 'Loading clinic staff...',
    },
    {
      state: 'empty',
      query: { data: [] },
      message:
        'No active assistants or secretariat users are available in this clinic.',
    },
    {
      state: 'failed',
      query: { isError: true },
      message: 'Unable to load the clinic staff list.',
    },
  ])(
    'blocks assignment when the assistant list is $state',
    ({ query, message }) => {
      mockDirectory(query);
      render(<TreatmentWorkspacePage />);
      fireEvent.click(
        screen.getByRole('tab', { name: /Documentation handoff/ }),
      );
      fireEvent.change(screen.getByLabelText('Doctor instructions'), {
        target: { value: 'Record findings.' },
      });
      expect(screen.getByText(message)).toBeTruthy();
      expect(screen.getByLabelText('Assign to staff member')).toHaveProperty(
        'disabled',
        true,
      );
      expect(
        screen.getByRole('button', { name: 'Assign handoff' }),
      ).toHaveProperty('disabled', true);
      if (query.isError) {
        fireEvent.click(
          screen.getByRole('button', { name: 'Retry staff list' }),
        );
        expect(refetchDirectory).toHaveBeenCalledTimes(1);
      }
    },
  );

  it('blocks assignment if the selected assistant becomes inactive', () => {
    const { rerender } = render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('tab', { name: /Documentation handoff/ }));
    selectAssistant('assistant-2');
    fireEvent.change(screen.getByLabelText('Doctor instructions'), {
      target: { value: 'Record findings.' },
    });
    mockDirectory({
      data: staffDirectory.map((member) =>
        member.userId === 'assistant-2'
          ? { ...member, status: 'inactive', isActive: false }
          : member,
      ),
    });
    rerender(<TreatmentWorkspacePage />);
    expect(screen.getByLabelText('Assign to staff member')).toHaveProperty(
      'value',
      '',
    );
    expect(
      screen.getByRole('button', { name: 'Assign handoff' }),
    ).toHaveProperty('disabled', true);
  });

  it('charts crowns on teeth 18 and 17 together and permits replacement on both', () => {
    render(<TreatmentWorkspacePage />);
    const onSelectionChange = jest
      .mocked(Odontogram)
      .mock.calls.at(-1)?.[0].onSelectionChange;
    expect(onSelectionChange).toBeDefined();
    act(() =>
      onSelectionChange?.({
        activeToothPosition: 18,
        selectedToothPositions: [18, 17],
      }),
    );
    fireEvent.change(screen.getByLabelText('Finding'), {
      target: { value: 'EXISTING_FIXED_RESTORATION' },
    });
    fireEvent.change(screen.getByLabelText('Restoration material'), {
      target: { value: 'METAL' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm finding' }));
    const teeth: readonly OdontogramTooth[] = JSON.parse(
      screen.getByTestId('odontogram-projection').textContent ?? '[]',
    );
    for (const position of [18, 17]) {
      expect(
        teeth.find((tooth) => tooth.position === position)?.conditions,
      ).toContainEqual({
        kind: 'restoration',
        restoration: 'crown',
        material: 'metal',
        appearance: 'existing',
      });
    }
    expect(
      teeth.find((tooth) => tooth.position === 16)?.conditions,
    ).not.toContainEqual(
      expect.objectContaining({ kind: 'restoration', restoration: 'crown' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment' }));
    fireEvent.change(screen.getByLabelText('Treatment act'), {
      target: { value: 'CROWN_REPLACEMENT' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment act' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('row', { name: /Crown replacement/ })).toBeTruthy();
    const replacedTeeth: readonly OdontogramTooth[] = JSON.parse(
      screen.getByTestId('odontogram-projection').textContent ?? '[]',
    );
    for (const position of [18, 17]) {
      expect(
        replacedTeeth.find((tooth) => tooth.position === position)?.conditions,
      ).toContainEqual(
        expect.objectContaining({
          state: 'crown-replacement',
          appearance: 'planned',
        }),
      );
    }
  });

  it('explains missing crown prerequisites and allows replacement after confirming the existing crown', async () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment' }));
    fireEvent.change(screen.getByLabelText('Treatment act'), {
      target: { value: 'CROWN_REPLACEMENT' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment act' }));
    const modal = screen.getByRole('dialog', {
      name: 'Cannot plan crown replacement',
    });
    expect(
      within(modal).getByText(/No existing crown is documented on teeth 16/),
    ).toBeTruthy();
    expect(screen.queryByRole('row', { name: /Crown replacement/ })).toBeNull();
    fireEvent.click(
      within(modal).getByRole('button', { name: 'I understand' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(screen.getByRole('button', { name: 'Chart finding' }));
    fireEvent.change(screen.getByLabelText('Finding'), {
      target: { value: 'EXISTING_FIXED_RESTORATION' },
    });
    fireEvent.change(screen.getByLabelText('Clinical detail'), {
      target: { value: 'CROWN' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm finding' }));
    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment' }));
    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment act' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('row', { name: /Crown replacement/ })).toBeTruthy();
    expect(screen.getByTestId('odontogram-projection').textContent).toContain(
      'crown-replacement',
    );
  });

  it('removes a catalogue plan before Start without a reason or cancelled row', () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment' }));
    fireEvent.change(screen.getByLabelText('Treatment act'), {
      target: { value: 'CROWN' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan treatment act' }));
    const row = screen.getByRole('row', { name: /Crown/ });
    expect(within(row).queryByRole('button', { name: 'Cancel' })).toBeNull();
    fireEvent.click(within(row).getByRole('button', { name: 'Remove' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('row', { name: /Crown/ })).toBeNull();
    expect(screen.getByText('Unstarted treatment plan removed.')).toBeTruthy();
    expect(
      screen.getByTestId('odontogram-projection').textContent,
    ).not.toContain('"kind":"restoration"');
    fireEvent.click(screen.getByRole('tab', { name: /Treatment plans/ }));
    expect(screen.queryByRole('row', { name: /Crown/ })).toBeNull();
    expect(screen.queryByText('CANCELLED')).toBeNull();
    expect(screen.queryByText('Crown', { selector: 'strong' })).toBeNull();
  });

  it('requires a cancellation reason immediately after Start and preserves the cancelled session', async () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('tab', { name: /Treatment plans/ }));
    const row = () => screen.getByRole('row', { name: /Root canal filling/ });
    fireEvent.click(within(row()).getByRole('button', { name: 'Start' }));
    expect(within(row()).queryByRole('button', { name: 'Remove' })).toBeNull();
    fireEvent.click(within(row()).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Cancel plan' })).toHaveProperty(
      'disabled',
      true,
    );
    fireEvent.change(screen.getByLabelText('Reason'), {
      target: { value: 'Patient declined further treatment.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel plan' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(within(row()).getByText('CANCELLED')).toBeTruthy();
    expect(
      screen.getByText('Cancellation: Patient declined further treatment.'),
    ).toBeTruthy();
  });

  it('requires a correction reason for completed treatment and retains its session notes', async () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('tab', { name: /Treatment plans/ }));
    const row = () => screen.getByRole('row', { name: /Root canal filling/ });
    fireEvent.click(within(row()).getByRole('button', { name: 'Start' }));
    fireEvent.click(
      within(row()).getByRole('button', { name: 'Close session' }),
    );
    fireEvent.change(screen.getByLabelText('Session notes'), {
      target: { value: 'Treatment entered as completed.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Finish treatment' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(within(row()).queryByRole('button', { name: 'Remove' })).toBeNull();
    fireEvent.click(within(row()).getByRole('button', { name: 'Correct' }));
    expect(
      screen.getByRole('button', { name: 'Mark entered in error' }),
    ).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('Reason'), {
      target: { value: 'Entry recorded against the wrong tooth.' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Mark entered in error' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(within(row()).getByText('ENTERED_IN_ERROR')).toBeTruthy();
    expect(screen.getByText('Treatment entered as completed.')).toBeTruthy();
  });

  it('retains unsent handoff text across tabs and shows the assigned text to the assistant', () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('tab', { name: /Documentation handoff/ }));
    selectAssistant();
    const assign = screen.getByRole('button', { name: /Assign to Yasmine/ });
    expect(assign).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('Doctor instructions'), {
      target: { value: '   \n  ' },
    });
    expect(assign).toHaveProperty('disabled', true);

    const instruction =
      'Plan an MOD composite restoration on tooth 16.\nPlan a crown on tooth 26. Neither has been performed.';
    fireEvent.change(screen.getByLabelText('Doctor instructions'), {
      target: { value: instruction },
    });
    fireEvent.click(screen.getByRole('tab', { name: /Clinical findings/ }));
    fireEvent.click(screen.getByRole('tab', { name: /Documentation handoff/ }));
    expect(screen.getByLabelText('Doctor instructions')).toHaveProperty(
      'value',
      instruction,
    );
    fireEvent.click(screen.getByRole('button', { name: /Assign to Yasmine/ }));

    expect(screen.getByText('Assigned')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Complete visit' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Demo actor'), {
      target: { value: 'assistant' },
    });
    expect(screen.getByLabelText('Doctor instructions')).toHaveProperty(
      'value',
      instruction,
    );
    expect(screen.getByLabelText('Doctor instructions')).toHaveProperty(
      'readOnly',
      true,
    );
    expect(screen.queryByRole('button', { name: /Assign to/ })).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Start documentation' }),
    );
    expect(screen.getByLabelText('Doctor instructions')).toHaveProperty(
      'value',
      instruction,
    );
  });

  it('does not expose a doctor instruction form to an unassigned assistant', () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.change(screen.getByLabelText('Demo actor'), {
      target: { value: 'assistant' },
    });
    fireEvent.click(screen.getByRole('tab', { name: /Documentation handoff/ }));
    expect(screen.queryByLabelText('Doctor instructions')).toBeNull();
    expect(screen.queryByRole('button', { name: /Assign to/ })).toBeNull();
  });

  it('removes a confirmed finding after a dentist provides a reason', () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('tab', { name: /Clinical findings/ }));

    const cariesRow = screen.getByRole('row', { name: /Dental caries/ });
    fireEvent.click(
      within(cariesRow).getByRole('button', {
        name: 'Remove CARIES finding',
      }),
    );
    fireEvent.change(screen.getByLabelText('Reason'), {
      target: { value: 'Recorded against the wrong tooth.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(screen.queryByRole('row', { name: /Dental caries/ })).toBeNull();
    expect(
      screen.getByText('Clinical finding removed from the active chart.'),
    ).toBeTruthy();
  });

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
        name: 'Start',
      }),
    );
    fireEvent.click(
      within(screen.getByRole('row', { name: /Crown/ })).getByRole('button', {
        name: 'Close session',
      }),
    );
    fireEvent.change(screen.getByLabelText('Session notes'), {
      target: { value: 'Crown treatment completed in this visit.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Finish treatment' }));

    expect(screen.getByTestId('odontogram-projection').textContent).toContain(
      '"appearance":"existing","kind":"restoration"',
    );
    expect(
      screen.getByText(
        'Treatment act completed and updated on the odontogram.',
      ),
    ).toBeTruthy();
  });

  it('continues an existing plan in a new visit and keeps the earlier visit read-only', async () => {
    render(<TreatmentWorkspacePage />);
    fireEvent.click(screen.getByRole('tab', { name: /Treatment plans/ }));
    fireEvent.click(
      within(screen.getByRole('row', { name: /Root canal filling/ })).getByRole(
        'button',
        { name: 'Start' },
      ),
    );
    fireEvent.click(
      within(screen.getByRole('row', { name: /Root canal filling/ })).getByRole(
        'button',
        { name: 'Close session' },
      ),
    );
    expect(
      screen.getByRole('button', { name: 'Continue later' }),
    ).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('Session notes'), {
      target: { value: 'Initial work recorded. Further treatment required.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue later' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      within(screen.getByRole('row', { name: /Root canal filling/ })).getByText(
        'IN_PROGRESS',
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Complete visit' }));
    expect(screen.getByText('Completed')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'New visit' }));
    expect(screen.getByLabelText('Clinical note')).toHaveProperty('value', '');
    fireEvent.click(screen.getByRole('tab', { name: /Treatment plans/ }));
    expect(
      screen.getAllByRole('row', { name: /Root canal filling/ }),
    ).toHaveLength(1);
    fireEvent.click(
      screen.getByRole('button', { name: 'Continue in this visit' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
    fireEvent.change(screen.getByLabelText('Session notes'), {
      target: { value: 'Remaining treatment completed.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Finish treatment' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      within(screen.getByRole('row', { name: /Root canal filling/ })).getByText(
        'COMPLETED',
      ),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Visit'), {
      target: { value: 'visit-demo' },
    });
    fireEvent.click(screen.getByRole('tab', { name: /Treatment plans/ }));
    const historical = screen.getByRole('row', { name: /Root canal filling/ });
    expect(within(historical).getByText('IN_PROGRESS')).toBeTruthy();
    expect(within(historical).queryByRole('button')).toBeNull();
    expect(screen.getByRole('button', { name: 'New visit' })).toHaveProperty(
      'disabled',
      true,
    );
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

  it.each([
    { id: 'assistant-demo', role: 'assistant', name: 'Yasmine' },
    { id: 'secretary-demo', role: 'secretary', name: 'Salma' },
  ])(
    'allows assigned $role documentation and completion without approval',
    ({ id, role, name }) => {
      render(<TreatmentWorkspacePage />);
      fireEvent.click(
        screen.getByRole('tab', { name: /Documentation handoff/ }),
      );
      expect(screen.queryByLabelText('Handoff progress')).toBeNull();
      selectAssistant(id);
      fireEvent.change(screen.getByLabelText('Doctor instructions'), {
        target: { value: 'Record today’s treatment and findings.' },
      });
      fireEvent.click(
        screen.getByRole('button', { name: new RegExp(`Assign to ${name}`) }),
      );
      fireEvent.change(screen.getByLabelText('Demo actor'), {
        target: { value: role },
      });
      fireEvent.click(
        screen.getByRole('tab', { name: /Odontogram & tooth details/ }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Confirm finding' }));
      expect(
        screen.getByText('Clinical finding confirmed and added to the chart.'),
      ).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Complete visit' }));
      expect(screen.getByText('Visit completed and locked.')).toBeTruthy();
      expect(screen.getByLabelText('Clinical note')).toHaveProperty(
        'disabled',
        true,
      );
    },
  );

  it.each(['assistant', 'secretary'])(
    'blocks an unassigned %s from documenting',
    (role) => {
      render(<TreatmentWorkspacePage />);
      fireEvent.change(screen.getByLabelText('Demo actor'), {
        target: { value: role },
      });
      expect(
        screen.getByRole('button', { name: 'Confirm finding' }),
      ).toHaveProperty('disabled', true);
      expect(
        screen.queryByRole('button', { name: 'Complete visit' }),
      ).toBeNull();
      fireEvent.click(screen.getByRole('tab', { name: /Treatment plans/ }));
      expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
    },
  );
});
