'use client';

import Link from 'next/link';
import { Button, Input, Label, ListBox, ListBoxItem, Select, TextArea, TextField, Tooltip } from '@heroui/react';

import { getSettingsFieldHelp, guideHref } from '@/lib/content/settingsFieldGuides';

export type SelectOption = { id: string; label: string; description?: string };

export const readSelectKey = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value instanceof Set) {
    const first: unknown = value.values().next().value;
    if (typeof first === 'string') return first;
    if (typeof first === 'number') return String(first);
    return '';
  }
  return '';
};

const readInputValue = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'target' in value) {
    const target = (value as { target?: { value?: unknown } }).target;
    if (typeof target?.value === 'string') return target.value;
  }
  return '';
};

const MinusCircleIcon = ({ compact }: { compact?: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={compact ? 'h-4 w-4 fill-none stroke-current stroke-2' : 'h-5 w-5 fill-none stroke-current stroke-2'}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12h8" strokeLinecap="round" />
  </svg>
);

const HelpIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 4.2 1.8c-.8.6-1.2 1.1-1.2 2.2" strokeLinecap="round" />
    <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

export const FieldLabelWithHelp = ({ label, helpKey }: { label: string; helpKey?: string }) => {
  const help = helpKey ? getSettingsFieldHelp(helpKey) : undefined;

  if (!help) {
    return <Label className="text-[#b5bac1]">{label}</Label>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-[#b5bac1]">{label}</Label>
      <Tooltip>
        <Tooltip.Trigger>
          <Button
            isIconOnly
            aria-label={`Help: ${label}`}
            className="h-5 w-5 min-w-5 text-[#949ba4] hover:text-[#b5bac1]"
            variant="ghost"
          >
            <HelpIcon />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content className="max-w-xs">
          <p className="text-sm leading-relaxed">{help.tooltip}</p>
          <Link href={guideHref(help)} className="mt-2 inline-block text-sm text-[#00a8fc] hover:underline">
            Read guide →
          </Link>
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
};

export const RemoveButton = ({
  label,
  onPress,
  isDisabled,
  compact,
}: {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  compact?: boolean;
}) => (
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

export const HeroSelect = ({
  label,
  helpKey,
  selectedKey,
  onSelectionChange,
  options,
  placeholder,
}: {
  label: string;
  helpKey?: string;
  selectedKey?: string;
  onSelectionChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) => {
  const selectedOption = options.find((option) => option.id === selectedKey);

  return (
    <Select
      fullWidth
      selectedKey={selectedKey || undefined}
      onSelectionChange={(key) => onSelectionChange(readSelectKey(key))}
    >
      <FieldLabelWithHelp label={label} helpKey={helpKey} />
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
};

export const BoolSelect = ({
  label,
  helpKey,
  value,
  onChange,
}: {
  label: string;
  helpKey?: string;
  value?: string;
  onChange: (value: string) => void;
}) => (
  <HeroSelect
    label={label}
    helpKey={helpKey}
    selectedKey={value === '1' ? '1' : '0'}
    onSelectionChange={onChange}
    options={[
      { id: '1', label: 'Yes' },
      { id: '0', label: 'No' },
    ]}
  />
);

export const DashboardField = ({
  label,
  helpKey,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  helpKey?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <TextField fullWidth value={value} onChange={(next) => onChange(readInputValue(next))}>
    <FieldLabelWithHelp label={label} helpKey={helpKey} />
    <Input className="bg-[#1e1f22]" placeholder={placeholder} />
  </TextField>
);

export const DashboardTextArea = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <TextField fullWidth value={value} onChange={onChange}>
    {label ? <Label className="text-[#b5bac1]">{label}</Label> : null}
    <TextArea className="bg-[#1e1f22]" placeholder={placeholder} />
  </TextField>
);
