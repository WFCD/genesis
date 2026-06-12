import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getGuide } from '@/lib/content/guides';

type Props = {
  params: Promise<{ slug: string }>;
};

const GuidePage = async ({ params }: Props) => {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6 pb-12">
      <div>
        <Link href="/" className="text-sm text-[#00a8fc] hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-white">{guide.title}</h1>
        <p className="mt-2 text-[#b5bac1]">{guide.summary}</p>
      </div>

      <div className="flex flex-col gap-6">
        {guide.sections.map((section, index) => (
          <section key={index} className="rounded-lg border border-white/10 bg-[#2b2d31] p-5">
            {section.heading ? <h2 className="text-lg font-semibold text-white">{section.heading}</h2> : null}
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mt-3 text-sm leading-relaxed text-[#dbdee1]">
                {paragraph}
              </p>
            ))}
            {section.list ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#dbdee1]">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
};

export default GuidePage;
