'use client';

import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { Button, Card, Chip, Tabs } from '@heroui/react';

import { readApiError, readJsonResponse } from '@/lib/api/client';
import { featureFlags } from '@/lib/settings/featureFlags';
import { countTextChannels, countThreads } from '@/lib/channels/tree';
import { formatPingableLabel } from '@/lib/meta/trackableLabels';

import LoadingIndicator from './dashboard/LoadingIndicator';
import { BoolSelect, DashboardField, DashboardTextArea, HeroSelect, RemoveButton } from './dashboard/FormControls';
import MentionTextArea from './dashboard/MentionTextArea';
import { useGuildLayout } from './GuildLayoutContext';

type Panel = 'overview' | 'elevated' | 'custom' | 'welcome' | 'pings' | 'rooms';

const allPanelTabs: Array<{ id: Panel; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'elevated', label: 'Elevated Roles' },
  { id: 'custom', label: 'Custom Commands' },
  { id: 'welcome', label: 'Welcome' },
  { id: 'pings', label: 'Pings' },
  { id: 'rooms', label: 'Rooms' },
];
const boolSelect = (value?: string) => value === '1';

const GuildDashboard: FC = () => {
  const { guildId, guildName, tree, roles } = useGuildLayout();
  const panelTabs = useMemo(() => allPanelTabs.filter((tab) => tab.id !== 'welcome' || featureFlags.guildWelcome), []);
  const [panel, setPanel] = useState<Panel>('overview');
  const [status, setStatus] = useState('');
  const [loadError, setLoadError] = useState('');
  const [elevatedRoles, setElevatedRoles] = useState('');
  const [customCommands, setCustomCommands] = useState<Array<{ call: string; response: string }>>([]);
  const [welcomes, setWelcomes] = useState<Array<{ isDm: boolean; message: string; channelId: string | null }>>([]);
  const [pings, setPings] = useState<Array<{ thing: string; text?: string }>>([]);
  const [customCall, setCustomCall] = useState('');
  const [customResponse, setCustomResponse] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [welcomeIsDm, setWelcomeIsDm] = useState(false);
  const [welcomeChannelId, setWelcomeChannelId] = useState('');
  const [pingQuery, setPingQuery] = useState('');
  const [pingResults, setPingResults] = useState<string[]>([]);
  const [pingTarget, setPingTarget] = useState('');
  const [pingText, setPingText] = useState('');
  const [removingCall, setRemovingCall] = useState<string | null>(null);
  const [removingPing, setRemovingPing] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Record<string, string | undefined>>({});
  const [topCommands, setTopCommands] = useState<Array<{ id: string; count: number }>>([]);
  const [commandStatsError, setCommandStatsError] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(false);

  const base = `/api/guilds/${guildId}`;
  const channelOptions = [...tree.categories.flatMap((category) => category.channels), ...tree.uncategorized].map(
    (channel) => ({ id: channel.id, label: `#${channel.name}` })
  );
  const categoryOptions = tree.categories.map((category) => ({ id: category.id, label: category.name }));
  const mentionChannels = useMemo(
    () =>
      [...tree.categories.flatMap((category) => category.channels), ...tree.uncategorized].map((channel) => ({
        id: channel.id,
        name: channel.name,
      })),
    [tree]
  );

  const loadCustomCommands = useCallback(
    async (reportError: boolean) => {
      const res = await fetch(`${base}/custom-commands`);
      if (res.ok) {
        const data = await readJsonResponse<{ commands?: Array<{ call: string; response: string }> }>(res);
        setCustomCommands(data.commands ?? []);
        return;
      }
      if (reportError) setLoadError(await readApiError(res));
    },
    [base]
  );

  const loadElevatedRoles = useCallback(
    async (reportError: boolean) => {
      const res = await fetch(`${base}/elevated-roles`);
      if (res.ok) {
        const data = await readJsonResponse<{ elevatedRoles?: string }>(res);
        setElevatedRoles(String(data.elevatedRoles ?? ''));
        return;
      }
      if (reportError) setLoadError(await readApiError(res));
    },
    [base]
  );

  const loadWelcomes = useCallback(
    async (reportError: boolean) => {
      const res = await fetch(`${base}/welcome`);
      if (res.ok) {
        const data = await readJsonResponse<{
          welcomes?: Array<{ isDm: boolean; message: string; channelId: string | null }>;
        }>(res);
        setWelcomes(data.welcomes ?? []);
        return;
      }
      if (reportError) setLoadError(await readApiError(res));
    },
    [base]
  );

  const loadPings = useCallback(
    async (reportError: boolean) => {
      const res = await fetch(`${base}/pings`, { cache: 'no-store' });
      if (res.ok) {
        const data = await readJsonResponse<{ pings?: Array<{ thing: string; text?: string }> }>(res);
        setPings(data.pings ?? []);
        return;
      }
      if (reportError) setLoadError(await readApiError(res));
    },
    [base]
  );

  const loadRooms = useCallback(
    async (reportError: boolean) => {
      const res = await fetch(`${base}/rooms`, { cache: 'no-store' });
      if (res.ok) {
        const data = await readJsonResponse<{ settings?: Record<string, string | undefined> }>(res);
        setRooms(data.settings ?? {});
        return;
      }
      if (reportError) setLoadError(await readApiError(res));
    },
    [base]
  );

  const loadCommandStats = useCallback(
    async (reportError: boolean) => {
      setCommandStatsError('');
      const res = await fetch(`${base}/command-stats`, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { commands?: Array<{ id: string; count: number }> };
        setTopCommands(Array.isArray(data.commands) ? data.commands : []);
        return;
      }
      setTopCommands([]);
      const message = await readApiError(res);
      if (reportError) setLoadError(message);
      else setCommandStatsError(message);
    },
    [base]
  );

  const loadPanel = useCallback(async () => {
    setLoadError('');
    if (panel === 'overview') {
      setOverviewLoading(true);
      try {
        await Promise.all([
          loadCustomCommands(false),
          loadElevatedRoles(false),
          ...(featureFlags.guildWelcome ? [loadWelcomes(false)] : []),
          loadPings(false),
          loadCommandStats(false),
        ]);
      } finally {
        setOverviewLoading(false);
      }
      return;
    }
    if (panel === 'elevated') await loadElevatedRoles(true);
    if (panel === 'custom') await loadCustomCommands(true);
    if (panel === 'welcome' && featureFlags.guildWelcome) await loadWelcomes(true);
    if (panel === 'pings') await loadPings(true);
    if (panel === 'rooms') await loadRooms(true);
  }, [loadCommandStats, loadCustomCommands, loadElevatedRoles, loadPings, loadRooms, loadWelcomes, panel]);

  useEffect(() => {
    void loadPanel();
  }, [loadPanel]);

  useEffect(() => {
    if (!featureFlags.guildWelcome && panel === 'welcome') {
      setPanel('overview');
    }
  }, [panel]);

  useEffect(() => {
    if (panel !== 'pings') return;
    setPingQuery((current) => (current === '[object Object]' ? '' : current));
    setPingText((current) => (current === '[object Object]' ? '' : current));
  }, [panel]);

  useEffect(() => {
    if (panel !== 'pings') return;
    const timer = setTimeout(() => {
      void (async () => {
        const res = await fetch(`/api/meta/pingables?q=${encodeURIComponent(pingQuery)}`);
        if (res.ok) {
          const data = await readJsonResponse<{ results?: string[] }>(res);
          setPingResults(data.results ?? []);
        }
      })();
    }, 200);
    return () => clearTimeout(timer);
  }, [panel, pingQuery]);

  const saveElevated = async () => {
    const res = await fetch(`${base}/elevated-roles`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roleIds: elevatedRoles
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean),
      }),
    });
    setStatus(res.ok ? 'Elevated roles saved.' : await readApiError(res));
  };

  const saveCustom = async () => {
    const res = await fetch(`${base}/custom-commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call: customCall, response: customResponse }),
    });
    if (res.ok) {
      setStatus('Custom command added.');
      setCustomCall('');
      setCustomResponse('');
      await loadCustomCommands(false);
      return;
    }
    setStatus(await readApiError(res));
  };

  const removeCustom = async (call: string) => {
    setRemovingCall(call);
    const res = await fetch(`${base}/custom-commands`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call }),
    });
    setRemovingCall(null);
    if (res.ok) {
      setStatus('Custom command removed.');
      await loadCustomCommands(false);
      return;
    }
    setStatus(await readApiError(res));
  };

  const saveWelcome = async () => {
    const res = await fetch(`${base}/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId: welcomeIsDm ? undefined : welcomeChannelId,
        isDm: welcomeIsDm,
        message: welcomeMessage,
      }),
    });
    setStatus(res.ok ? 'Welcome message saved.' : await readApiError(res));
    if (res.ok) await loadWelcomes(false);
  };

  const savePing = async () => {
    const target = pingTarget.trim();
    if (!target) {
      setStatus('Select a ping target first.');
      return;
    }

    const res = await fetch(`${base}/pings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: [target], text: typeof pingText === 'string' ? pingText : '' }),
      cache: 'no-store',
    });
    if (!res.ok) {
      setStatus(await readApiError(res));
      return;
    }

    const data = (await res.json()) as { pings?: Array<{ thing: string; text?: string }> };
    setPings(data.pings ?? []);
    setStatus('Ping saved.');
  };

  const removePing = async (target: string) => {
    setRemovingPing(target);
    const res = await fetch(`${base}/pings`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target }),
      cache: 'no-store',
    });
    setRemovingPing(null);
    if (!res.ok) {
      setStatus(await readApiError(res));
      return;
    }

    const data = (await res.json()) as { pings?: Array<{ thing: string; text?: string }> };
    setPings(data.pings ?? []);
    setStatus('Ping removed.');
  };

  const saveRooms = async () => {
    const res = await fetch(`${base}/rooms`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        createPrivateChannel: boolSelect(rooms.createPrivateChannel),
        defaultRoomsLocked: boolSelect(rooms.defaultRoomsLocked),
        defaultNoText: rooms.defaultNoText === '0',
        defaultShown: boolSelect(rooms.defaultShown),
        tempCategory: rooms.tempCategory || null,
        tempChannel: rooms.tempChannel || null,
      }),
      cache: 'no-store',
    });
    setStatus(res.ok ? 'Room settings saved.' : await readApiError(res));
  };

  const roleSelectOptions = roles.map((role) => ({ id: role.id, label: role.name }));

  return (
    <main className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{guildName}</h1>
        <p className="mt-1 text-sm text-[#b5bac1]">Guild-wide Genesis settings and overview.</p>
      </div>

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

      {status ? <p className="text-sm text-[#b5bac1]">{status}</p> : null}
      {loadError ? <p className="text-sm text-danger">{loadError}</p> : null}

      {panel === 'overview' ? (
        <div className="flex max-w-5xl flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border border-white/10 bg-[#2b2d31] p-5">
              <Card.Header>
                <Card.Title className="text-white">Server overview</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-2 text-sm text-[#b5bac1]">
                <p>
                  <span className="text-white">{countTextChannels(tree)}</span> text channels visible to Genesis
                </p>
                <p>
                  <span className="text-white">{tree.categories.length}</span> categories
                </p>
                <p>
                  <span className="text-white">{countThreads(tree)}</span> active threads
                </p>
                <p>
                  <span className="text-white">{customCommands.length}</span> custom commands
                </p>
                {featureFlags.guildWelcome ? (
                  <p>
                    <span className="text-white">{welcomes.length}</span> welcome messages
                  </p>
                ) : null}
                <p>
                  <span className="text-white">{pings.length}</span> ping overrides
                </p>
                <p>Pick a channel or thread in the left sidebar to edit per-channel settings.</p>
                <p>Server-wide private room settings are under the Rooms tab.</p>
              </Card.Content>
            </Card>

            <Card className="border border-white/10 bg-[#2b2d31] p-5">
              <Card.Header>
                <Card.Title className="text-white">Top commands</Card.Title>
                <Card.Description className="text-[#949ba4]">Most used slash commands in this server.</Card.Description>
              </Card.Header>
              <Card.Content>
                {overviewLoading ? (
                  <LoadingIndicator label="Loading command stats…" />
                ) : commandStatsError ? (
                  <p className="text-sm text-danger">{commandStatsError}</p>
                ) : topCommands.length ? (
                  <div className="overflow-x-auto rounded-md border border-white/10">
                    <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                      <thead className="bg-[#1e1f22] text-xs uppercase tracking-wide text-[#949ba4]">
                        <tr>
                          <th className="px-3 py-2 font-medium">Command</th>
                          <th className="px-3 py-2 text-right font-medium">Uses</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-[#dbdee1]">
                        {topCommands.map((command) => (
                          <tr key={command.id}>
                            <td className="px-3 py-2 font-mono text-sm">{command.id}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{command.count.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-[#949ba4]">No command usage recorded yet.</p>
                )}
              </Card.Content>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {panelTabs.slice(1).map((tab) => (
              <Card key={tab.id} className="border border-white/10 bg-[#2b2d31] p-5">
                <Card.Header>
                  <Card.Title className="text-white">{tab.label}</Card.Title>
                </Card.Header>
                <Card.Content>
                  <Button variant="secondary" onPress={() => setPanel(tab.id)}>
                    Manage {tab.label.toLowerCase()}
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {panel === 'elevated' ? (
        <Card className="max-w-2xl border border-white/10 bg-[#2b2d31] p-5">
          <Card.Content className="grid gap-4">
            <DashboardField
              label="Elevated role IDs (comma-separated)"
              value={elevatedRoles}
              onChange={setElevatedRoles}
            />
            {roleSelectOptions.length ? (
              <div className="flex flex-wrap gap-2">
                {roleSelectOptions.map((role) => (
                  <Chip
                    key={role.id}
                    size="sm"
                    className="cursor-pointer"
                    onClick={() =>
                      setElevatedRoles((prev) => {
                        const ids = prev
                          .split(',')
                          .map((id) => id.trim())
                          .filter(Boolean);
                        if (ids.includes(role.id)) return prev;
                        return [...ids, role.id].join(',');
                      })
                    }
                  >
                    {role.label}
                  </Chip>
                ))}
              </div>
            ) : null}
            <Button variant="primary" onPress={() => void saveElevated()}>
              Save elevated roles
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      {panel === 'custom' ? (
        <Card className="max-w-2xl border border-white/10 bg-[#2b2d31] p-5">
          <Card.Content className="grid gap-4">
            <div className="space-y-2 text-sm">
              {customCommands.length ? (
                customCommands.map((command) => (
                  <div key={command.call} className="flex items-start gap-2 rounded-md bg-[#1e1f22] px-3 py-2">
                    <div className="min-w-0 flex-1 break-words text-[#dbdee1]">
                      <strong className="text-white">{command.call}</strong>: {command.response}
                    </div>
                    <RemoveButton
                      isDisabled={removingCall === command.call}
                      label={`Remove ${command.call}`}
                      onPress={() => void removeCustom(command.call)}
                    />
                  </div>
                ))
              ) : (
                <p className="text-[#949ba4]">No custom commands configured.</p>
              )}
            </div>
            <DashboardField label="Command name" value={customCall} onChange={setCustomCall} />
            <DashboardTextArea value={customResponse} onChange={setCustomResponse} placeholder="Response" />
            <Button variant="primary" onPress={() => void saveCustom()}>
              Add custom command
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      {panel === 'welcome' && featureFlags.guildWelcome ? (
        <Card className="max-w-2xl border border-white/10 bg-[#2b2d31] p-5">
          <Card.Content className="grid gap-4">
            <div className="space-y-2 text-sm">
              {welcomes.map((entry, index) => (
                <div key={`${entry.isDm}-${index}`}>
                  {entry.isDm ? 'DM' : `Channel ${entry.channelId}`}: {entry.message}
                </div>
              ))}
            </div>
            <DashboardTextArea value={welcomeMessage} onChange={setWelcomeMessage} placeholder="Message" />
            <BoolSelect
              label="Send as DM"
              value={welcomeIsDm ? '1' : '0'}
              onChange={(value) => setWelcomeIsDm(value === '1')}
            />
            {!welcomeIsDm ? (
              <HeroSelect
                label="Welcome channel"
                selectedKey={welcomeChannelId}
                onSelectionChange={setWelcomeChannelId}
                options={channelOptions}
                placeholder="Select channel"
              />
            ) : null}
            <Button variant="primary" onPress={() => void saveWelcome()}>
              Save welcome
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      {panel === 'pings' ? (
        <Card className="max-w-2xl border border-white/10 bg-[#2b2d31] p-5">
          <Card.Content className="grid gap-4">
            <div className="space-y-2 text-sm">
              {pings.length ? (
                pings.map((ping) => (
                  <div key={ping.thing} className="flex items-start gap-2 rounded-md bg-[#1e1f22] px-3 py-2">
                    <div className="min-w-0 flex-1 break-words text-[#dbdee1]">
                      <strong className="text-white">{formatPingableLabel(ping.thing)}</strong>
                      <span className="text-[#949ba4]"> ({ping.thing})</span>
                      <span className="text-[#b5bac1]"> — {ping.text || '(empty)'}</span>
                    </div>
                    <RemoveButton
                      isDisabled={removingPing === ping.thing}
                      label={`Remove ${formatPingableLabel(ping.thing)}`}
                      onPress={() => void removePing(ping.thing)}
                    />
                  </div>
                ))
              ) : (
                <p className="text-[#949ba4]">No ping overrides configured.</p>
              )}
            </div>
            <DashboardField label="Search pingables" value={pingQuery} onChange={setPingQuery} />
            <HeroSelect
              label="Ping target"
              selectedKey={pingTarget}
              onSelectionChange={setPingTarget}
              options={pingResults.map((result) => ({
                id: result,
                label: formatPingableLabel(result),
                description: result,
              }))}
              placeholder="Select target"
            />
            <div className="grid gap-1.5">
              <span className="text-sm text-[#b5bac1]">Prepend text</span>
              <MentionTextArea
                channels={mentionChannels}
                guildId={guildId}
                placeholder="Text before the ping — type @ or # for mentions"
                roles={roles}
                value={pingText}
                onChange={setPingText}
              />
            </div>
            <Button variant="primary" onPress={() => void savePing()}>
              Save ping
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      {panel === 'rooms' ? (
        <Card className="max-w-2xl border border-white/10 bg-[#2b2d31] p-5">
          <Card.Content className="grid gap-4">
            <BoolSelect
              label="Private rooms enabled"
              value={rooms.createPrivateChannel}
              onChange={(value) => setRooms((prev) => ({ ...prev, createPrivateChannel: value }))}
            />
            <BoolSelect
              label="Auto-lock new rooms"
              value={rooms.defaultRoomsLocked}
              onChange={(value) => setRooms((prev) => ({ ...prev, defaultRoomsLocked: value }))}
            />
            <BoolSelect
              label="Allow text in new rooms"
              value={rooms.defaultNoText === '0' ? '1' : '0'}
              onChange={(value) => setRooms((prev) => ({ ...prev, defaultNoText: value === '1' ? '0' : '1' }))}
            />
            <BoolSelect
              label="Hide new rooms"
              value={rooms.defaultShown}
              onChange={(value) => setRooms((prev) => ({ ...prev, defaultShown: value }))}
            />
            <HeroSelect
              label="Temp category"
              selectedKey={rooms.tempCategory || ''}
              onSelectionChange={(value) => setRooms((prev) => ({ ...prev, tempCategory: value }))}
              options={[{ id: '', label: 'None' }, ...categoryOptions]}
              placeholder="Select category"
            />
            <HeroSelect
              label="Temp text channel"
              selectedKey={rooms.tempChannel || ''}
              onSelectionChange={(value) => setRooms((prev) => ({ ...prev, tempChannel: value }))}
              options={[{ id: '', label: 'None' }, ...channelOptions]}
              placeholder="Select channel"
            />
            <Button variant="primary" onPress={() => void saveRooms()}>
              Save rooms
            </Button>
          </Card.Content>
        </Card>
      ) : null}
    </main>
  );
};

export default GuildDashboard;
