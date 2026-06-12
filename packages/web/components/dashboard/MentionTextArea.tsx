'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FC, type KeyboardEvent } from 'react';

import { readJsonResponse } from '@/lib/api/client';
import {
  filterChannelSuggestions,
  filterRoleSuggestions,
  getActiveMention,
  insertMention,
  mapMemberSuggestions,
  type MentionSuggestion,
} from '@/lib/discord/mentions';

type Props = {
  guildId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  roles: Array<{ id: string; name: string }>;
  channels: Array<{ id: string; name: string }>;
};

const MentionTextArea: FC<Props> = ({ guildId, value, onChange, placeholder, roles, channels }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);

  const activeMention = useMemo(() => getActiveMention(value, cursor), [cursor, value]);

  const suggestions = useMemo(() => {
    if (!activeMention) return [] as MentionSuggestion[];

    if (activeMention.kind === 'channel') {
      return filterChannelSuggestions(channels, activeMention.query);
    }

    const roleSuggestions = filterRoleSuggestions(roles, activeMention.query);
    const memberSuggestions = activeMention.query.trim() ? mapMemberSuggestions(members) : [];
    return [...roleSuggestions, ...memberSuggestions];
  }, [activeMention, channels, members, roles]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeMention?.kind, activeMention?.query, suggestions.length]);

  useEffect(() => {
    if (!activeMention || activeMention.kind !== 'at') {
      setMembers([]);
      return;
    }
    if (!activeMention.query.trim()) return;

    const timer = setTimeout(() => {
      void (async () => {
        const res = await fetch(`/api/guilds/${guildId}/members?q=${encodeURIComponent(activeMention.query)}&limit=10`);
        if (res.ok) {
          const data = await readJsonResponse<{ members?: Array<{ id: string; name: string }> }>(res);
          setMembers(data.members ?? []);
        }
      })();
    }, 200);

    return () => clearTimeout(timer);
  }, [activeMention, guildId]);

  const syncCursor = useCallback(() => {
    const next = textareaRef.current?.selectionStart ?? value.length;
    setCursor(next);
  }, [value.length]);

  const applySuggestion = useCallback(
    (suggestion: MentionSuggestion) => {
      if (!activeMention) return;
      const { value: nextValue, cursor: nextCursor } = insertMention(
        value,
        activeMention.start,
        activeMention.end,
        suggestion.insert
      );
      onChange(nextValue);
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
        setCursor(nextCursor);
      });
    },
    [activeMention, onChange, value]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!activeMention || !suggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % suggestions.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      applySuggestion(suggestions[selectedIndex]);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setCursor(activeMention.end);
    }
  };

  return (
    <div className="relative grid gap-1.5">
      <textarea
        ref={textareaRef}
        className="min-h-24 w-full resize-y rounded-lg border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-[#dbdee1] outline-none focus:border-[#5865f2]"
        placeholder={placeholder}
        value={value}
        onBlur={syncCursor}
        onChange={(event) => {
          onChange(event.target.value);
          setCursor(event.target.selectionStart || event.target.value.length);
        }}
        onClick={syncCursor}
        onKeyDown={handleKeyDown}
        onKeyUp={syncCursor}
        onSelect={syncCursor}
      />
      {activeMention && suggestions.length ? (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#2b2d31] py-1 shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.kind}-${suggestion.id}`}>
              <button
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                  index === selectedIndex ? 'bg-[#404249] text-white' : 'text-[#dbdee1] hover:bg-[#35373c]'
                }`}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applySuggestion(suggestion);
                }}
              >
                <span className="truncate">{suggestion.label}</span>
                <span className="shrink-0 text-xs text-[#949ba4]">{suggestion.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-[#949ba4]">
        Type <code className="text-[#b5bac1]">@</code> for roles or users, <code className="text-[#b5bac1]">#</code> for
        channels. Inserts Discord mention tokens like <code className="text-[#b5bac1]">&lt;@&amp;roleId&gt;</code>.
      </p>
    </div>
  );
};

export default MentionTextArea;
