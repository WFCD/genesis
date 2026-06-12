import ChannelDashboard from '@/components/ChannelDashboard';

type Props = {
  params: Promise<{ guildId: string; channelId: string }>;
};

const ChannelSettingsPage = async ({ params }: Props) => {
  const { guildId, channelId } = await params;
  return <ChannelDashboard guildId={guildId} channelId={channelId} />;
};

export default ChannelSettingsPage;
