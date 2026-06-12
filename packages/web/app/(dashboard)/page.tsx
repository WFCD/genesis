import SignInButton from '@/components/auth/SignInButton';
import HomeSignInHeader from '@/components/HomeSignInHeader';
import HomeSignedIn from '@/components/HomeSignedIn';
import SiteFooter from '@/components/SiteFooter';
import { auth, signIn } from '@/auth';
import { getAppName } from '@/lib/content/branding';
import { fetchBotAvatarUrl } from '@/lib/discord';
import { filterManageableGuilds, type OAuthGuild } from '@/lib/guild/oauth';

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

const HomePage = async ({ searchParams }: Props) => {
  const session = await auth();
  const appName = getAppName();
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl?.startsWith('/') ? callbackUrl : '/';

  if (!session?.user) {
    const logoUrl = await fetchBotAvatarUrl(128);

    return (
      <main className="flex min-h-screen flex-col bg-[#313338] text-[#dbdee1]">
        <HomeSignInHeader appName={appName} logoUrl={logoUrl} />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-12 pt-16">
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-semibold">{appName} Dashboard</h1>
            <p className="mt-2 text-[#b5bac1]">Manage server settings for channels where {appName} is installed.</p>
          </div>
          <form
            action={async () => {
              'use server';
              await signIn('discord', { redirectTo });
            }}
          >
            <SignInButton />
          </form>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const rawGuilds =
    (session as { guilds?: Array<{ id: string; name: string; permissions: string; icon?: string | null }> }).guilds ??
    [];
  const manageableCount = filterManageableGuilds(
    rawGuilds.map((guild) => ({
      id: guild.id,
      name: guild.name,
      permissions: guild.permissions,
      icon: guild.icon ?? null,
    })) satisfies OAuthGuild[]
  ).length;

  return <HomeSignedIn appName={appName} manageableCount={manageableCount} />;
};

export default HomePage;
