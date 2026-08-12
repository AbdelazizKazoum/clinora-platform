import { fireEvent, render, screen } from '@testing-library/react';

import type { ToothSurface } from '../model/odontogram';
import { ToothSurfaceSelector } from './tooth-surface-selector';

describe('ToothSurfaceSelector', () => {
  it('renders five canonical surface controls in cross positions', () => {
    const { container } = render(
      <ToothSurfaceSelector toothPosition={16} value={[]} />,
    );

    expect(
      screen.getByRole('group', { name: 'Tooth 16 surfaces' }),
    ).toBeTruthy();
    expect(
      Array.from(container.querySelectorAll('[data-odontogram-surface]')).map(
        (button) => button.getAttribute('data-odontogram-surface'),
      ),
    ).toEqual(['buccal', 'mesial', 'occlusal', 'distal', 'lingual']);
  });

  it('displays position-aware labels while emitting canonical values', () => {
    const onChange = jest.fn();
    render(
      <ToothSurfaceSelector
        onChange={onChange}
        toothPosition={11}
        value={[]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Labial surface' }));
    expect(onChange).toHaveBeenLastCalledWith(['buccal']);

    fireEvent.click(screen.getByRole('button', { name: 'Incisal surface' }));
    expect(onChange).toHaveBeenLastCalledWith(['occlusal']);
  });

  it('uses palatal label only for upper lingual surfaces', () => {
    const { rerender } = render(
      <ToothSurfaceSelector toothPosition={16} value={[]} />,
    );

    expect(
      screen.getByRole('button', { name: 'Palatal surface' }),
    ).toBeTruthy();

    rerender(<ToothSurfaceSelector toothPosition={46} value={[]} />);
    expect(
      screen.getByRole('button', { name: 'Lingual surface' }),
    ).toBeTruthy();
  });

  it('keeps selected surfaces controlled and does not mutate the provided value', () => {
    const onChange = jest.fn();
    const value: readonly ToothSurface[] = ['mesial'];

    render(
      <ToothSurfaceSelector
        onChange={onChange}
        toothPosition={16}
        value={value}
      />,
    );

    expect(
      screen
        .getByRole('button', { name: 'Mesial surface' })
        .getAttribute('aria-pressed'),
    ).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Distal surface' }));

    expect(onChange).toHaveBeenLastCalledWith(['mesial', 'distal']);
    expect(value).toEqual(['mesial']);
    expect(
      screen
        .getByRole('button', { name: 'Distal surface' })
        .getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('toggles selected surfaces off', () => {
    const onChange = jest.fn();
    render(
      <ToothSurfaceSelector
        onChange={onChange}
        toothPosition={16}
        value={['mesial', 'distal']}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mesial surface' }));

    expect(onChange).toHaveBeenLastCalledWith(['distal']);
  });

  it('supports keyboard toggle with Enter and Space', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <ToothSurfaceSelector
        onChange={onChange}
        toothPosition={16}
        value={[]}
      />,
    );

    fireEvent.keyDown(screen.getByRole('button', { name: 'Buccal surface' }), {
      key: 'Enter',
    });
    expect(onChange).toHaveBeenLastCalledWith(['buccal']);

    rerender(
      <ToothSurfaceSelector
        onChange={onChange}
        toothPosition={16}
        value={['buccal']}
      />,
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'Buccal surface' }), {
      key: ' ',
    });
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('renders disabled controls without emitting changes', () => {
    const onChange = jest.fn();
    render(
      <ToothSurfaceSelector
        disabled
        onChange={onChange}
        toothPosition={16}
        value={['mesial']}
      />,
    );

    const mesialButton = screen.getByRole('button', {
      name: 'Mesial surface',
    }) as HTMLButtonElement;

    expect(mesialButton.disabled).toBe(true);
    fireEvent.click(mesialButton);
    fireEvent.keyDown(mesialButton, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
  });
});
