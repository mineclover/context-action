import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '../types';
import { ChatMessageItem } from './ChatDemo';

const sampleMessage: ChatMessage = {
  id: 'message-from-developer',
  sender: '김개발',
  message: '현재 사용자에 따라 스타일이 바뀌어야 합니다.',
  timestamp: new Date('2026-08-31T00:00:00.000Z'),
  type: 'text',
};

describe('ChatMessageItem', () => {
  it('reclassifies an existing message when the current user changes', () => {
    const onDelete = vi.fn();
    const { container, rerender } = render(
      <ChatMessageItem
        message={sampleMessage}
        currentUser="김개발"
        onDelete={onDelete}
      />
    );

    const messageItem = container.querySelector(
      `[data-message-id="${sampleMessage.id}"]`
    );
    const messageBubble = screen
      .getByText(sampleMessage.message)
      .closest('div[class*="rounded-2xl"]');

    expect(messageItem?.className).toContain('justify-end');
    expect(messageItem?.className).not.toContain('flex-row-reverse');
    expect(messageBubble?.className).toContain('bg-blue-600');
    expect(screen.getByTitle('메시지 삭제')).not.toBeNull();

    rerender(
      <ChatMessageItem
        message={sampleMessage}
        currentUser="이디자인"
        onDelete={onDelete}
      />
    );

    expect(messageItem?.className).toContain('justify-start');
    expect(messageItem?.className).not.toContain('flex-row-reverse');
    expect(messageBubble?.className).toContain('bg-white');
    expect(messageBubble?.className).not.toContain('bg-blue-600');
    expect(screen.queryByTitle('메시지 삭제')).toBeNull();
  });
});
