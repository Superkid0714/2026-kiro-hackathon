import { Suspense } from 'react';

import KakaoCallbackClient from './KakaoCallbackClient';

export const dynamic = 'force-dynamic';

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={null}>
      <KakaoCallbackClient />
    </Suspense>
  );
}
