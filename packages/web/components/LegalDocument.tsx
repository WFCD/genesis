import type { FC } from 'react';
import Link from 'next/link';

import type { LegalSection } from '@/lib/content/legal';

type Props = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

const LegalDocument: FC<Props> = ({ title, intro, sections }) => (
  <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6 pb-12">
    <div>
      <Link href="/" className="text-sm text-[#00a8fc] hover:underline">
        ← Back
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-[#b5bac1]">{intro}</p>
    </div>

    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.title} className="rounded-lg border border-white/10 bg-[#2b2d31] p-5">
          <h2 className="text-lg font-semibold text-white">{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
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

export default LegalDocument;
