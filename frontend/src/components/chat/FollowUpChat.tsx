/**
 * FollowUpChat — scoped, session-only chat about the currently explained code.
 * History is kept in local component state only (per the spec's session note),
 * so refreshing the page or explaining new code clears the conversation.
 *
 * Assistant replies render as full markdown (code fences with syntax
 * highlighting + copy buttons, tables, lists, links, blockquotes, etc.).
 * Smart follow-up suggestion chips appear above the input, are context-aware,
 * update after each response, and never repeat prompts already asked.
 */

import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Card, SectionHeader, Button } from '../shared/ui';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { SmartSuggestions } from './SmartSuggestions';
import { api } from '../../lib/api';
import type { ChatMessage, ExplanationResponse } from '../../lib/types';

interface Props {
  code: string;
  language: string;
  explanation: ExplanationResponse;
  onError: (msg: string) => void;
}

export const FollowUpChat: React.FC<Props> = ({ code, language, explanation, onError }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Reset the conversation whenever a new explanation is loaded, since chat
  // context is scoped to the *current* code.
  useEffect(() => {
    setMessages([]);
    setAsked([]);
    setInput('');
  }, [explanation]);

  const sendPrompt = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setInput('');
    const nextHistory: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextHistory);
    setAsked((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setLoading(true);
    try {
      const res = await api.chat({
        code,
        language,
        explanation,
        history: messages, // prior turns, excluding the new user message
        question: trimmed,
        provider: explanation.provider_used,
        model: explanation.model_used,
      });
      setMessages([...nextHistory, { role: 'assistant', content: res.answer }]);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Chat request failed.';
      onError(msg);
      // Keep the user's message visible so they don't lose it.
      setMessages(nextHistory);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPick = (prompt: string) => {
    sendPrompt(prompt);
  };

  return (
    <Card className="p-lg" data-testid="chat-panel">
      <SectionHeader
        eyebrow="Follow-up chat"
        title="Ask a question about this code"
        icon={<MessageCircle size={18} />}
      />

      <div
        ref={scrollRef}
        className="mt-md max-h-[420px] overflow-y-auto space-y-3 pr-1"
        data-testid="chat-messages"
      >
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-border-subtle bg-white/[0.02] p-md text-[13.5px] text-ink-muted">
            No messages yet. Tap a suggestion below or type your own follow-up.
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              data-testid={`chat-msg-${m.role}-${i}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-md py-2.5 text-[14.5px] leading-relaxed animate-fade-in-up ${
                  m.role === 'user'
                    ? 'bg-accent/25 border border-accent/40 text-ink-primary whitespace-pre-wrap'
                    : 'bg-white/[0.04] border border-border-subtle text-ink-secondary'
                }`}
              >
                {m.role === 'assistant' ? (
                  <MarkdownRenderer content={m.content} />
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-md py-2.5 text-[14.5px] bg-white/[0.04] border border-border-subtle text-ink-muted">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-md flex items-center gap-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendPrompt(input);
            }
          }}
          placeholder="Ask a follow-up…"
          className="flex-1 rounded-pill border border-border-subtle bg-white/[0.03] px-md py-2.5 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-accent"
          data-testid="chat-input"
        />
        <Button
          variant="primary"
          onClick={() => sendPrompt(input)}
          loading={loading}
          data-testid="chat-send-btn"
        >
          <Send size={14} />
          Send
        </Button>
      </div>

      {/* Smart context-aware suggestion chips rendered below the input box */}
      <div className="mt-md">
        <SmartSuggestions
          explanation={explanation}
          language={language}
          asked={asked}
          onPick={handleSuggestionPick}
          disabled={loading}
        />
      </div>
    </Card>
  );
};
