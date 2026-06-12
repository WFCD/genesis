'use client';

import { Button, Input, Label, ListBox, ListBoxItem, Select, TextArea, TextField, Tooltip } from '@heroui/react';

export type SelectOption = { id: string; label: string; description?: string };

export function readSelectKey(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value instanceof Set) {
    const first: unknown = value.values().next().value;
    if (typeof first === 'string') return first;
    if (typeof first === 'number') return String(first);
    return '';
  }
  return '';
}

function readInputValue(value: unknown) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'target' in value) {
    const target = (value as { target?: { value?: unknown } }).target;
    if (typeof target?.value === 'string') return target.value;
  }
  return '';
}

function MinusCircleIcon({ compact }: { compact?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={compact ? 'h-4 w-4 fill-none stroke-current stroke-2' : 'h-5 w-5 fill-none stroke-current stroke-2'}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

export function RemoveButton({
  label,
  onPress,
  isDisabled,
  compact,
}: {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Button
          isIconOnly
          aria-label={label}
          className={
            compact
              ? 'h-6 w-6 min-w-6 shrink-0 text-[#949ba4] hover:text-danger'
              : 'h-8 w-8 min-w-8 shrink-0 text-[#b5bac1] hover:text-danger'
          }
          isDisabled={isDisabled}
          variant="ghost"
          onPress={onPress}
        >
          <MinusCircleIcon compact={compact} />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}

export function HeroSelect({
  label,
  selectedKey,
  onSelectionChange,
  options,
  placeholder,
}: {
  label: string;
  selectedKey?: string;
  onSelectionChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const selectedOption = options.find((option) => option.id === selectedKey);

  return (
    <Select
      fullWidth
      selectedKey={selectedKey || undefined}
      onSelectionChange={(key) => onSelectionChange(readSelectKey(key))}
    >
      <Label className="text-[#b5bac1]">{label}</Label>
      <Select.Trigger className="bg-[#1e1f22]">
        <Select.Value>
          {({ selectedText }) => selectedOption?.label || selectedText || placeholder || 'Select…'}
        </Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBoxItem key={option.id} id={option.id} textValue={option.label}>
              {option.description ? (
                <div className="flex flex-col gap-0.5">
                  <span>{option.label}</span>
                  <span className="text-xs text-[#949ba4]">{option.description}</span>
                </div>
              ) : (
                option.label
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function BoolSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <HeroSelect
      label={label}
      selectedKey={value === '1' ? '1' : '0'}
      onSelectionChange={onChange}
      options={[
        { id: '1', label: 'Yes' },
        { id: '0', label: 'No' },
      ]}
    />
  );
}

export function DashboardField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm text-[#b5bac1]">{label}</span>
      <Input
        className="bg-[#1e1f22]"
        value={value}
        onChange={(next) => onChange(readInputValue(next))}
        placeholder={placeholder}
      />
    </label>
  );
}

export function DashboardTextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <TextField fullWidth value={value} onChange={onChange}>
      {label ? <Label className="text-[#b5bac1]">{label}</Label> : null}
      <TextArea className="bg-[#1e1f22]" placeholder={placeholder} />
    </TextField>
  );
}
