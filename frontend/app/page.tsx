// GitCode.dev/frontend/app/page.tsx
'use client';

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
}