import { createServerClientWithCookies } from '@cashflow/auth/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClientWithCookies(cookieStore);

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/auth/login', request.url));
}
