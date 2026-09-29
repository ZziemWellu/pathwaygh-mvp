import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import ReadAloudButton from './ReadAloudButton';

describe('ReadAloudButton', () => {
  const originalSpeechSynthesis = window.speechSynthesis;
  const originalUtterance = window.SpeechSynthesisUtterance;

  afterEach(() => {
    window.speechSynthesis = originalSpeechSynthesis;
    window.SpeechSynthesisUtterance = originalUtterance;
  });

  it('renders nothing when the browser has no speech support', () => {
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;

    const { container } = render(<ReadAloudButton text="Hello" />);
    expect(container.firstChild).toBeNull();
  });

  describe('when speech is supported', () => {
    let cancel;
    let speakFn;

    beforeEach(() => {
      cancel = vi.fn();
      speakFn = vi.fn();
      window.speechSynthesis = { cancel, speak: speakFn, speaking: false };
      window.SpeechSynthesisUtterance = function (text) {
        this.text = text;
      };
    });

    it('starts speaking when clicked', async () => {
      const user = userEvent.setup();
      render(<ReadAloudButton text="Hello world" />);

      await user.click(screen.getByRole('button', { name: /read aloud/i }));

      expect(speakFn).toHaveBeenCalled();
    });

    it('stops speaking when clicked while already speaking', async () => {
      const user = userEvent.setup();
      render(<ReadAloudButton text="Hello world" />);

      await user.click(screen.getByRole('button', { name: /read aloud/i }));
      await user.click(screen.getByRole('button', { name: /stop reading aloud/i }));

      expect(cancel).toHaveBeenCalled();
    });
  });
});
