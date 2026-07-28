'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@cashflow/auth';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Leaf,
  ShieldCheck,
  Tractor,
} from 'lucide-react';

const LoginLeftSide = () => (
  <div className="hidden lg:flex flex-col justify-between p-16">

    <div>

      <div className="flex items-center gap-3">

        <div className="h-12 w-12 rounded-xl bg-green-700 flex items-center justify-center shadow-lg">

          <Leaf className="h-6 w-6 text-white" />

        </div>

        <div>

          <h1 className="text-3xl font-bold text-green-900">
            Cashflow
          </h1>

          <p className="text-sm text-green-700">
            Agricultural Finance Platform
          </p>

        </div>

      </div>

    </div>

    <div className="space-y-8 max-w-xl">

      <h2 className="text-5xl font-bold leading-tight text-slate-900">
        Modern Financial Management for Agriculture.
      </h2>

      <p className="text-lg text-slate-600 leading-8">
        Manage farmers, collect produce, calculate valuations,
        issue loans, track repayments and monitor your cooperative
        from one secure platform.
      </p>

      <div className="space-y-5">

        <div className="flex items-center gap-4">

          <ShieldCheck className="text-green-700" />

          <span className="text-slate-700">
            Secure Multi-Tenant Platform
          </span>

        </div>

        <div className="flex items-center gap-4">

          <Leaf className="text-green-700" />

          <span className="text-slate-700">
            Produce Collection & Valuation
          </span>

        </div>

        <div className="flex items-center gap-4">

          <Tractor className="text-green-700" />

          <span className="text-slate-700">
            Farmer & Cooperative Management
          </span>

        </div>

      </div>

    </div>

    <p className="text-sm text-slate-500">
      © 2026 Cashflow Platform
    </p>

  </div>
);


export default function LoginPage() {
  const supabase = createBrowserClient();
  const router = useRouter();
  
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      }
    }
    checkAuth();
  }, [router, supabase]);
  

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const supabase = createBrowserClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google sign in failed.');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-green-50 via-white to-amber-50">

      {/* Left Side */}
      {LoginLeftSide()}

      {/* Right Side */}

      <div className="flex items-center justify-center p-8">

        <div className="w-full max-w-md">

          <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-2xl p-10">

            <div className="text-center">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-700 shadow-lg">

                <Leaf className="h-8 w-8 text-white" />

              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-slate-500">
                Sign in to continue managing your operations.
              </p>

            </div>

            <form
              onSubmit={handleLogin}
              className="mt-8 space-y-5"
            >

              {error && (

                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">

                  {error}

                </div>

              )}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                />

              </div>

              <button
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
              >

                {loading
                  ? 'Signing in...'
                  : (
                    <>
                      Sign In
                      <ArrowRight size={18} />
                    </>
                  )}

              </button>

              <div className="relative py-2">

                <div className="absolute inset-0 flex items-center">

                  <div className="w-full border-t" />

                </div>

                <div className="relative flex justify-center">

                  <span className="bg-white px-4 text-sm text-slate-500">
                    OR
                  </span>

                </div>

              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white font-medium transition hover:bg-slate-50"
              >

                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.7 2.9-4.1 2.9-7 0-.6-.1-1.2-.2-1.8H12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.7 0 5-1 6.7-2.7l-3-2.3c-.8.6-2 1-3.7 1-2.8 0-5.2-1.9-6.1-4.5l-3.1 2.4C4.5 20.5 8 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.9 14.5A7 7 0 015.5 12c0-.9.2-1.7.4-2.5L2.8 7.1A11 11 0 001 12c0 1.8.4 3.5 1.8 4.9l3.1-2.4z"
                  />
                  <path
                    fill="#4285F4"
                    d="M12 5c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 2 14.7 1 12 1 8 1 4.5 3.5 2.8 7.1l3.1 2.4C6.8 6.9 9.2 5 12 5z"
                  />
                </svg>

                Continue with Google

              </button>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}