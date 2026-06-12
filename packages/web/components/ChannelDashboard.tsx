'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { Button, Card, Input, Label, ListBox, ListBoxItem, Select, Tabs, TextField } from '@heroui/react';

import { readApiError, readJsonResponse } from '@/lib/api/client';
import { featureFlags } from '@/lib/settings/featureFlags';
import { fetchJsonCached } from '@/lib/cache/client';
import { resolveChannelRouteFromTree } from '@/lib/channels/route';
import { buildLfgSettingsPatch, lfgPlatforms, lfgSettingKey, pickLfgSettings } from '@/lib/settings/lfg';
import { formatTrackableLabel } from '@/lib/meta/trackableLabels';

import { useGuildLayout } from './GuildLayoutContext';
import TrackableBadge from './dashboard/TrackableBadge';
import LoadingIndicator from './dashboard/LoadingIndicator';
import { BoolSelect, HeroSelect } from './dashboard/FormControls';

type Panel = 'general' | 'lfg' | 'tracking' | 'permissions';

const allPanelTabs: Array<{ id: Panel; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'lfg', label: 'LFG' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'permissions', label: 'Permissions' },
];
const boolSelect = (value?: string) => value === '1';

type ChannelDashboardProps = {
  guildId: string;
  channelId: string;
};

const ChannelDashboard: FC<ChannelDashboardProps> = ({ guildId, channelId }) => {
  const { tree, roles } = useGuildLayout();
  const route = useMemo(() => resolveChannelRouteFromTree(tree, channelId), [tree, channelId]);
  const isThread = route.isThread;
  const panelTabs = useMemo(
    () => allPanelTabs.filter((tab) => tab.id !== 'permissions' || featureFlags.channelPermissions),
    []
  );
  const [panel, setPanel] = useState<Panel>(isThread ? 'tracking' : 'general');
  const [status, setStatus] = useState('');
  const [loadError, setLoadError] = useState('');
  const [settings, setSettings] = useState<Record<string, string | undefined>>({});
  const [lfgSettings, setLfgSettings] = useState<Record<string, string | undefined>>({});
  const [tracking, setTracking] = useState<{ items: string[]; events: string[] }>({ items: [], events: [] });
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [locales, setLocales] = useState<Array<{ name: string; value: string }>>([]);
  const [platforms, setPlatforms] = useState<Array<{ name: string; value: string }>>([]);
  const [trackableQuery, setTrackableQuery] = useState('');
  const [trackableResults, setTrackableResults] = useState<string[]>([]);
  const [selectedTrackables, setSelectedTrackables] = useState<string[]>([]);
  const [permRoleId, setPermRoleId] = useState('');
  const [permCommandId, setPermCommandId] = useState('');
  const [permAllowed, setPermAllowed] = useState(true);
  const [permScope, setPermScope] = useState<'channel' | 'guild'>('channel');

  const base = `/api/guilds/${guildId}`;
  const channelBase = `${base}/channels/${channelId}`;
  const lfgChannelOptions = useMemo(
    () => [
      { id: '', label: 'None' },
      ...[...tree.categories.flatMap((category) => category.channels), ...tree.uncategorized].map((channel) => ({
        id: channel.id,
        label: `#${channel.name}`,
      })),
    ],
    [tree]
  );

  const loadLocalesPlatforms = useCallback(async () => {
    try {
      const [localeData, platformData] = await Promise.all([
        fetchJsonCached<{ locales: Array<{ name: string; value: string }> }>('/api/meta/locales'),
        fetchJsonCached<{ platforms: Array<{ name: string; value: string }> }>('/api/meta/platforms'),
      ]);
      setLocales(localeData.locales);
      setPlatforms(platformData.platforms);
    } catch {
      // Meta is optional for rendering; panel load will surface settings errors.
    }
  }, []);

  const loadTracking = useCallback(
    async (reportError = true) => {
      setTrackingLoading(true);
      try {
        const res = await fetch(`${channelBase}/tracking`);
        if (res.ok) {
          const data = await readJsonResponse<{ items?: string[]; events?: string[] }>(res);
          setTracking({ items: data.items ?? [], events: data.events ?? [] });
          return;
        }
        if (reportError) setLoadError(await readApiError(res));
      } finally {
        setTrackingLoading(false);
      }
    },
    [channelBase]
  );

  const loadPanel = useCallback(async () => {
    setStatus('');
    setLoadError('');
    const errors: string[] = [];

    if (!isThread && panel === 'general') {
      await loadLocalesPlatforms();
      const res = await fetch(`${channelBase}/settings`, { cache: 'no-store' });
      if (res.ok) {
        const data = await readJsonResponse<{ settings?: Record<string, string | undefined> }>(res);
        setSettings(data.settings ?? {});
      } else errors.push(await readApiError(res));
    }
    if (!isThread && panel === 'lfg') {
      const res = await fetch(`${channelBase}/settings`, { cache: 'no-store' });
      if (res.ok) {
        const data = await readJsonResponse<{ settings?: Record<string, string | undefined> }>(res);
        setLfgSettings(pickLfgSettings(data.settings ?? {}));
      } else errors.push(await readApiError(res));
    }
    if (panel === 'tracking' || isThread) {
      await loadTracking(true);
      return;
    }

    if (errors.length) setLoadError(errors[0]);
  }, [channelBase, isThread, loadLocalesPlatforms, loadTracking, panel]);

  useEffect(() => {
    if (isThread) setPanel('tracking');
  }, [isThread]);

  useEffect(() => {
    if (!featureFlags.channelPermissions && panel === 'permissions') {
      setPanel('general');
    }
  }, [panel]);

  useEffect(() => {
    void loadPanel();
  }, [loadPanel]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        const res = await fetch(`/api/meta/trackables?q=${encodeURIComponent(trackableQuery)}`);
        if (res.ok) {
          const data = await readJsonResponse<{ results?: string[] }>(res);
          setTrackableResults(data.results ?? []);
        }
      })();
    }, 200);
    return () => clearTimeout(timer);
  }, [trackableQuery]);

  const saveGeneral = async () => {
    const res = await fetch(`${channelBase}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: settings.language,
        platform: settings.platform,
        modRole: settings.modRole || null,
        ephemerate: boolSelect(settings.ephemerate),
        allowCustom: boolSelect(settings.allowCustom),
        allowInline: boolSelect(settings.allowInline),
        'settings.cc.ping': boolSelect(settings['settings.cc.ping']),
        deleteExpired: boolSelect(settings.deleteExpired),
      }),
    });
    setStatus(res.ok ? 'General settings saved.' : 'Failed to save general settings.');
  };

  const saveLfg = async () => {
    const res = await fetch(`${channelBase}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildLfgSettingsPatch(lfgSettings)),
      cache: 'no-store',
    });
    setStatus(res.ok ? 'LFG settings saved.' : await readApiError(res));
  };

  const saveTracking = async () => {
    const res = await fetch(`${channelBase}/tracking`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: tracking.events, items: tracking.items, replace: true }),
    });
    setStatus(res.ok ? 'Tracking saved.' : 'Failed to save tracking.');
  };

  const addSelectedTrackables = () => {
    const events = [...tracking.events];
    const items = [...tracking.items];
    selectedTrackables.forEach((value) => {
      if (value.includes('.') || value.startsWith('fissures') || value.startsWith('cetus')) {
        if (!events.includes(value)) events.push(value);
      } else if (!items.includes(value)) {
        items.push(value);
      }
    });
    setTracking({ events, items });
    setSelectedTrackables([]);
  };

  const removeEvent = (event: string) => {
    setTracking((prev) => ({ ...prev, events: prev.events.filter((entry) => entry !== event) }));
  };

  const removeItem = (item: string) => {
    setTracking((prev) => ({ ...prev, items: prev.items.filter((entry) => entry !== item) }));
  };

  const savePermission = async () => {
    const res = await fetch(`${channelBase}/permissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: permScope,
        roleId: permRoleId,
        commandId: permCommandId,
        allowed: permAllowed,
      }),
    });
    setStatus(res.ok ? 'Permission saved.' : 'Failed to save permission.');
  };

  const roleOptions = [{ id: '', label: 'None' }, ...roles.map((role) => ({ id: role.id, label: role.name }))];

  return (
    <main className="flex flex-col gap-6 p-6">
      <div>
        {isThread ? (
          <>
            <h1 className="text-2xl font-semibold text-white">{route.name}</h1>
            <p className="mt-1 text-sm text-[#b5bac1]">
              Thread in{' '}
              <Link
                href={`/guilds/${guildId}/channels/${route.parentChannelId}`}
                className="text-[#00a8fc] hover:underline"
              >
                #{route.parentName}
              </Link>
              . Only tracking is configured per thread; other settings use the parent channel.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-white">#{route.name}</h1>
            <p className="mt-1 text-sm text-[#b5bac1]">Channel settings for Genesis.</p>
          </>
        )}
      </div>

      {!isThread ? (
        <Tabs selectedKey={panel} onSelectionChange={(key) => setPanel(String(key) as Panel)} variant="secondary">
          <Tabs.ListContainer className="overflow-x-auto">
            <Tabs.List>
              {panelTabs.map((tab) => (
                <Tabs.Tab key={tab.id} id={tab.id}>
                  {tab.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      ) : null}

      {status ? <p className="text-sm text-[#b5bac1]">{status}</p> : null}
      {loadError ? <p className="text-sm text-danger">{loadError}</p> : null}

      {panel === 'general' && !isThread ? (
        <Card className="max-w-2xl border border-white/10 bg-[#2b2d31] p-5">
          <Card.Content className="grid gap-4">
            <HeroSelect
              label="Language (guild-wide)"
              selectedKey={settings.language || 'en'}
              onSelectionChange={(value) => setSettings((prev) => ({ ...prev, language: value }))}
              options={locales.map((locale) => ({ id: locale.value, label: locale.name }))}
            />
            <HeroSelect
              label="Platform"
              selectedKey={settings.platform || 'pc'}
              onSelectionChange={(value) => setSettings((prev) => ({ ...prev, platform: value }))}
              options={platforms.map((platform) => ({ id: platform.value, label: platform.name }))}
            />
            <HeroSelect
              label="Mod role (guild-wide)"
              selectedKey={settings.modRole || ''}
              onSelectionChange={(value) => setSettings((prev) => ({ ...prev, modRole: value }))}
              options={roleOptions}
            />
            <BoolSelect
              label="Ephemeral slash replies"
              value={settings.ephemerate}
              onChange={(value) => setSettings((prev) => ({ ...prev, ephemerate: value }))}
            />
            <BoolSelect
              label="Allow custom commands"
              value={settings.allowCustom}
              onChange={(value) => setSettings((prev) => ({ ...prev, allowCustom: value }))}
            />
            <BoolSelect
              label="Allow inline commands"
              value={settings.allowInline}
              onChange={(value) => setSettings((prev) => ({ ...prev, allowInline: value }))}
            />
            <BoolSelect
              label="Ping on custom commands"
              value={settings['settings.cc.ping']}
              onChange={(value) => setSettings((prev) => ({ ...prev, 'settings.cc.ping': value }))}
            />
            <BoolSelect
              label="Delete expired notifications"
              value={settings.deleteExpired}
              onChange={(value) => setSettings((prev) => ({ ...prev, deleteExpired: value }))}
            />
            <Button variant="primary" onPress={() => void saveGeneral()}>
              Save general
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      {panel === 'lfg' && !isThread ? (
        <Card className="max-w-2xl border border-white/10 bg-[#2b2d31] p-5">
          <Card.Content className="grid gap-4">
            <p className="text-sm text-[#b5bac1]">
              Destination channels for /lfg posts from this channel, per platform.
            </p>
            {lfgPlatforms.map((platform) => {
              const key = lfgSettingKey(platform.value);
              return (
                <HeroSelect
                  key={key}
                  label={`${platform.name} LFG channel`}
                  selectedKey={lfgSettings[key] || ''}
                  onSelectionChange={(value) => setLfgSettings((prev) => ({ ...prev, [key]: value }))}
                  options={lfgChannelOptions}
                  placeholder="Select channel"
                />
              );
            })}
            <Button variant="primary" onPress={() => void saveLfg()}>
              Save LFG
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      {panel === 'tracking' || isThread ? (
        <Card className="max-w-2xl border border-white/10 bg-[#2b2d31] p-5">
          <Card.Content className="grid gap-4">
            <div>
              <p className="mb-2 text-sm font-medium text-white">Events</p>
              <div className="flex flex-wrap gap-2">
                {trackingLoading ? (
                  <LoadingIndicator label="Loading events…" />
                ) : tracking.events.length ? (
                  tracking.events.map((event) => (
                    <TrackableBadge key={event} trackable={event} onRemove={() => removeEvent(event)} />
                  ))
                ) : (
                  <p className="text-sm text-[#949ba4]">No events tracked.</p>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-white">Items</p>
              <div className="flex flex-wrap gap-2">
                {trackingLoading ? (
                  <LoadingIndicator label="Loading items…" />
                ) : tracking.items.length ? (
                  tracking.items.map((item) => (
                    <TrackableBadge key={item} trackable={item} onRemove={() => removeItem(item)} />
                  ))
                ) : (
                  <p className="text-sm text-[#949ba4]">No items tracked.</p>
                )}
              </div>
            </div>
            <TextField fullWidth value={trackableQuery} onChange={setTrackableQuery}>
              <Label className="text-[#b5bac1]">Search trackables</Label>
              <Input className="bg-[#1e1f22]" />
            </TextField>
            <Select
              fullWidth
              selectionMode="multiple"
              selectedKeys={selectedTrackables}
              onSelectionChange={(keys) => setSelectedTrackables(Array.from(keys as Set<string>))}
            >
              <Label className="text-[#b5bac1]">Add trackables</Label>
              <Select.Trigger className="bg-[#1e1f22]">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox selectionMode="multiple">
                  {trackableResults.map((result) => (
                    <ListBoxItem key={result} id={result} textValue={formatTrackableLabel(result)}>
                      <div className="flex flex-col gap-0.5">
                        <span>{formatTrackableLabel(result)}</span>
                        <span className="text-xs text-[#949ba4]">{result}</span>
                      </div>
                    </ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onPress={addSelectedTrackables}>
                Add selected
              </Button>
              <Button variant="primary" onPress={() => void saveTracking()}>
                Save tracking
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : null}

      {panel === 'permissions' && !isThread && featureFlags.channelPermissions ? (
        <Card className="max-w-2xl border border-white/10 bg-[#2b2d31] p-5">
          <Card.Content className="grid gap-4">
            <HeroSelect
              label="Scope"
              selectedKey={permScope}
              onSelectionChange={(value) => setPermScope(value as 'channel' | 'guild')}
              options={[
                { id: 'channel', label: 'Channel' },
                { id: 'guild', label: 'Guild' },
              ]}
            />
            <HeroSelect
              label="Role"
              selectedKey={permRoleId}
              onSelectionChange={setPermRoleId}
              options={roles.map((role) => ({ id: role.id, label: role.name }))}
              placeholder="Select role"
            />
            <TextField fullWidth value={permCommandId} onChange={setPermCommandId}>
              <Label className="text-[#b5bac1]">Command ID</Label>
              <Input className="bg-[#1e1f22]" />
            </TextField>
            <HeroSelect
              label="Allowed"
              selectedKey={permAllowed ? '1' : '0'}
              onSelectionChange={(value) => setPermAllowed(value === '1')}
              options={[
                { id: '1', label: 'Allow' },
                { id: '0', label: 'Deny' },
              ]}
            />
            <Button variant="primary" onPress={() => void savePermission()}>
              Save permission
            </Button>
          </Card.Content>
        </Card>
      ) : null}
    </main>
  );
};

export default ChannelDashboard;
