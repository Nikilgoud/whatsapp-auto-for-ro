'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { OwnerAuthScreen } from '@/components/auth/OwnerAuthScreen';

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <OwnerAuthScreen
        initialMode="FORGOT_MOBILE"
        onSuccess={() => router.push('/')}
        onClose={() => router.push('/auth/login')}
      />
    </div>
  );
}
