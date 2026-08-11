import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteButton } from './DeleteButton';

describe('DeleteButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call onConfirm if the user cancels the confirmation dialog', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onConfirm = vi.fn();

    render(<DeleteButton label="Delete route" confirmMessage="Are you sure?" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Delete route'));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when the user accepts the confirmation dialog', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(<DeleteButton label="Delete route" confirmMessage="Are you sure?" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Delete route'));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('shows a "Deleting..." state while onConfirm is pending', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let resolveConfirm: () => void;
    const onConfirm = vi.fn(
      () => new Promise<void>((resolve) => { resolveConfirm = resolve; })
    );

    render(<DeleteButton label="Delete route" confirmMessage="Are you sure?" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Delete route'));

    expect(await screen.findByText('Deleting...')).toBeInTheDocument();
    resolveConfirm!();
    // Wait for the resulting re-render to settle before the test ends,
    // so React doesn't warn about an unwrapped state update after teardown.
    await waitFor(() => expect(screen.queryByText('Deleting...')).not.toBeInTheDocument());
  });

  it('passes the exact confirmMessage to window.confirm', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<DeleteButton label="Delete" confirmMessage="Delete this thing forever?" onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByText('Delete'));

    expect(confirmSpy).toHaveBeenCalledWith('Delete this thing forever?');
  });
});
