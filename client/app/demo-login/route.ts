import { NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/nextjs/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE !== 'true') {
    return new NextResponse('Not Found', { status: 404 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token || token !== process.env.DEMO_BYPASS_TOKEN) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  try {
    const signInToken = await clerkClient.signInTokens.createSignInToken({
      userId: process.env.DEMO_TARGET_USER_ID,
      expiresInSeconds: 60,
    });

    return NextResponse.redirect(signInToken.url);
  } catch (error) {
    return new NextResponse('Authentication Failed', { status: 500 });
  }
}
