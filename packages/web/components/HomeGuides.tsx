import type { FC } from 'react';
import Link from 'next/link';
import { Card } from '@heroui/react';

import { guides } from '@/lib/content/guides';

const HomeGuides: FC = () => (
  <section className="flex flex-col gap-4">
    <div>
      <h2 className="text-xl font-semibold text-white">Guides</h2>
      <p className="mt-1 text-sm text-[#b5bac1]">Instruction guides for using the dashboard.</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {guides.map((guide) => (
        <Card key={guide.slug} className="border border-white/10 bg-[#2b2d31] p-5">
          <Card.Header>
            <Card.Title className="text-white">{guide.title}</Card.Title>
            <Card.Description className="text-[#b5bac1]">{guide.summary}</Card.Description>
          </Card.Header>
          <Card.Content>
            <Link href={`/guides/${guide.slug}`} className="text-sm text-[#00a8fc] hover:underline">
              Read guide
            </Link>
          </Card.Content>
        </Card>
      ))}
    </div>
  </section>
);

export default HomeGuides;
