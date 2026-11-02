'use client';

import { useAuth } from '@/context/AuthContext';
import { Button, Avatar, Menu } from '@/components/ui';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Dashboard — Welcome, {user?.fullName || 'Owner'}
      </h1>

      <div className="mt-6">
        <Button
          onClick={() => {
            logout().then(() => router.push('/auth/login'));
          }}
          className="text-sm text-white hover:bg-emerald-700/90"
        >
          <LogOut className="mr-2" /> Sign Out
        </Button>
      </div>

      <p className="mt-4 text-slate-500 dark:text-slate-400">
        This is a protected route. Only OWNERS and MANAGERS can access this page.
      </p>
    </div>
  );
}