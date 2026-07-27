import { fireEvent, render, screen } from '@testing-library/react';
import UserDropdown from '../src/components/layout/shell/components/TopBar/components/SimpleUserDropdown';

describe('user dropdown', () => {
  it('calls the logout action from the menu', async () => {
    const onLogout = jest.fn().mockResolvedValue(undefined);

    render(<UserDropdown isLoggingOut={false} onLogout={onLogout} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'user-image Clinora' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Log Out' }),
    );

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
