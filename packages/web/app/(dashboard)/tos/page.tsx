import type { FC } from 'react';

import LegalDocument from '@/components/LegalDocument';
import { termsOfService } from '@/lib/content/legal';

const TermsPage: FC = () => <LegalDocument {...termsOfService} />;

export default TermsPage;
