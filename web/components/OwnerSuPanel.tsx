'use client';

import Link from 'next/link';
import { useState, type FC } from 'react';
import { Avatar, Button, Card, Chip, Input, cn } from '@heroui/react';

import type { DiscordGuildInfo } from '@/lib/discord/types';

import { HeroSelect } from './dashboard/FormControls';

const VERIFICATION: Record<number, { color: string; label: string }> = {
  0: { color: '#747f8d', label: 'None' },
  1: { color: '#43b581', label: 'Low' },
  2: { color: '#faa61a', label: 'Medium' },
  3: { color: '#f57731', label: 'High' },
  4: { color: '#f04747', label: 'Very High' },
};

const REFRESH_SCOPES = [
  { id: 'pings', label: 'Pings' },
  { id: 'trackables', label: 'Trackables' },
  { id: 'guild', label: 'Guild' },
  { id: 'all', label: 'All' },
];

async function postJson<T>(url: string, body: Record<string, string | undefined>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

function GuildResult({ guild }: { guild: DiscordGuildInfo }) {
  const verification = VERIFICATION[guild.verificationLevel] ?? VERIFICATION[0];
  const created = new Date(guild.createdAt).toLocaleString();

  return (
    <Card className="border border-white/10 bg-[#1e1f22]">
      <Card.Header className="flex flex-row items-start gap-4">
        {guild.iconUrl ? (
          <Avatar className="h-16 w-16 shrink-0">
            <Avatar.Image src={guild.iconUrl} alt="" />
            <Avatar.Fallback>{guild.name.slice(0, 2)}</Avatar.Fallback>
          </Avatar>
        ) : null}
        <div className="min-w-0 flex-1">
          <Card.Title className="text-white">{guild.name}</Card.Title>
          <Card.Description className="text-[#b5bac1]">Server ID: {guild.id}</Card.Description>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip size="sm" style={{ backgroundColor: verification.color }}>
              {verification.label}
            </Chip>
            {guild.inDatabase ? (
              <Chip size="sm" color="success">
                In Genesis DB
              </Chip>
            ) : (
              <Chip size="sm" color="warning">
                Not in Genesis DB
              </Chip>
            )}
          </div>
        </div>
        {guild.inDatabase ? (
          <Link href={`/guilds/${guild.id}`}>
            <Button size="sm" variant="secondary">
              Open dashboard
            </Button>
          </Link>
        ) : null}
      </Card.Header>
      <Card.Content className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Created" value={created} />
        <Stat label="Owner" value={<span className="font-mono text-xs">{guild.ownerId}</span>} />
        <Stat label="Members" value={guild.memberCount ?? '—'} />
        <Stat label="Online" value={guild.presenceCount ?? '—'} />
        <Stat label="Text channels" value={guild.textChannelCount} />
        <Stat label="Voice channels" value={guild.voiceChannelCount} />
        <Stat label="Emojis" value={guild.emojiCount} />
        <Stat label="Roles" value={guild.roleCount} />
        <Stat label="Registered channels" value={guild.registeredChannelCount} />
      </Card.Content>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[#2b2d31] px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-[#949ba4]">{label}</div>
      <div className="mt-1 text-sm text-white">{value}</div>
    </div>
  );
}

type ActionCardProps = {
  title: string;
  description: string;
  command: string;
  children: React.ReactNode;
  onRun: () => Promise<void>;
  busy: boolean;
  destructive?: boolean;
};

function ActionCard({ title, description, command, children, onRun, busy, destructive }: ActionCardProps) {
  return (
    <Card className="border border-white/10 bg-[#2b2d31]">
      <Card.Header>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Card.Title className="text-white">{title}</Card.Title>
            <Card.Description className="text-[#b5bac1]">{description}</Card.Description>
          </div>
          <Chip size="sm" variant="soft" className="font-mono text-[10px]">
            /su {command}
          </Chip>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {children}
        <Button className={cn(destructive && 'bg-danger text-white')} isDisabled={busy} onPress={() => void onRun()}>
          Run
        </Button>
      </Card.Content>
    </Card>
  );
}

const OwnerSuPanel: FC = () => {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [guild, setGuild] = useState<DiscordGuildInfo | null>(null);

  const [serverId, setServerId] = useState('');
  const [commandId, setCommandId] = useState('');
  const [refreshScope, setRefreshScope] = useState('all');
  const [refreshGuildId, setRefreshGuildId] = useState('');
  const [webhookChannelId, setWebhookChannelId] = useState('');
  const [leaveGuildId, setLeaveGuildId] = useState('');

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setMessage('');
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Owner Tools</h1>
        <p className="mt-1 text-sm text-[#b5bac1]">
          Web equivalents of <code className="text-[#dbdee1]">/su</code> commands. Uses the bot token — works for
          servers you cannot access with your user account.
        </p>
      </div>

      {(message || error) && (
        <Card
          className={cn(
            'border p-4 text-sm',
            error ? 'border-danger/40 bg-danger/10 text-danger-200' : 'border-success/40 bg-success/10 text-success-200'
          )}
        >
          {error || message}
        </Card>
      )}

      {guild ? <GuildResult guild={guild} /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <ActionCard
          title="Server lookup"
          description="Fetch guild info via bot token (same as /su server)."
          command="server"
          busy={busy === 'server'}
          onRun={() =>
            run('server', async () => {
              const data = await postJson<{ guild: DiscordGuildInfo }>('/api/su/server', { guildId: serverId });
              setGuild(data.guild);
              setMessage(`Loaded ${data.guild.name}.`);
            })
          }
        >
          <Input
            label="Guild ID"
            value={serverId}
            onChange={(event) => setServerId(event.target.value)}
            placeholder="123456789012345678"
          />
        </ActionCard>

        <ActionCard
          title="Command stats"
          description="Global usage count for a command identifier."
          command="stats"
          busy={busy === 'stats'}
          onRun={() =>
            run('stats', async () => {
              const data = await postJson<{ commandId: string; count: number }>('/api/su/stats', {
                commandId,
              });
              setMessage(`\`${data.commandId}\` has been used ${data.count} times globally.`);
            })
          }
        >
          <Input
            label="Command ID"
            value={commandId}
            onChange={(event) => setCommandId(event.target.value)}
            placeholder="settings:general:locale"
          />
        </ActionCard>

        <ActionCard
          title="Refresh worker cache"
          description="Bump global stamp or queue a guild-specific refresh."
          command="refresh"
          busy={busy === 'refresh'}
          onRun={() =>
            run('refresh', async () => {
              const data = await postJson<{ message: string }>('/api/su/refresh', {
                scope: refreshScope,
                guildId: refreshGuildId || undefined,
              });
              setMessage(data.message);
            })
          }
        >
          <HeroSelect
            label="Scope"
            selectedKey={refreshScope}
            onSelectionChange={setRefreshScope}
            options={REFRESH_SCOPES}
          />
          <Input
            label="Guild ID (optional)"
            value={refreshGuildId}
            onChange={(event) => setRefreshGuildId(event.target.value)}
            placeholder="Leave empty for global bump"
          />
        </ActionCard>

        <ActionCard
          title="Clear channel webhooks"
          description="Delete Genesis webhooks for a channel (same as /su clear webhook)."
          command="clear webhook"
          busy={busy === 'webhook'}
          destructive
          onRun={() =>
            run('webhook', async () => {
              if (!window.confirm(`Clear webhooks in channel ${webhookChannelId}?`)) return;
              const data = await postJson<{ message: string }>('/api/su/clear-webhook', {
                channelId: webhookChannelId,
              });
              setMessage(data.message);
            })
          }
        >
          <Input
            label="Channel ID"
            value={webhookChannelId}
            onChange={(event) => setWebhookChannelId(event.target.value)}
            placeholder="123456789012345678"
          />
        </ActionCard>

        <ActionCard
          title="Leave server"
          description="Force the bot to leave a guild (same as /su leave)."
          command="leave"
          busy={busy === 'leave'}
          destructive
          onRun={() =>
            run('leave', async () => {
              if (
                !window.confirm(`Make Genesis leave server ${leaveGuildId}? This cannot be undone from the dashboard.`)
              ) {
                return;
              }
              const data = await postJson<{ message: string }>('/api/su/leave', { guildId: leaveGuildId });
              setGuild(null);
              setMessage(data.message);
            })
          }
        >
          <Input
            label="Guild ID"
            value={leaveGuildId}
            onChange={(event) => setLeaveGuildId(event.target.value)}
            placeholder="123456789012345678"
          />
        </ActionCard>
      </div>

      <Card className="max-w-3xl border border-white/5 bg-[#2b2d31]/50 p-4 text-sm text-[#949ba4]">
        <p>
          Process controls (<code>restart</code>, <code>reload</code>) stay Discord-only.
        </p>
      </Card>
    </main>
  );
};

export default OwnerSuPanel;
