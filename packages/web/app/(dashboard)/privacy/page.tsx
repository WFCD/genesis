import type { FC } from 'react';

import LegalDocument from '@/components/LegalDocument';
import { privacyPolicy } from '@/lib/content/legal';

const PrivacyPage: FC = () => <LegalDocument {...privacyPolicy} />;

export default PrivacyPage;
