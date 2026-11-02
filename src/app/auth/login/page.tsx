'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { OwnerAuthScreen } from '@/components/auth/OwnerAuthScreen';

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <OwnerAuthScreen onSuccess={() => router.push('/')} />
    </div>
  );
}
