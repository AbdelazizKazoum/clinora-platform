import { getMiddlewareAuthRole } from '@/features/auth/api/server/middleware-auth-session';
import { canAccessPath } from '@/features/auth/model/access-policy';
import { NextResponse, type NextRequest } from 'next/server';

const SIGN_IN_PATH = '/auth/split/sign-in';
const FORBIDDEN_PATH = '/error/403';

const redirectToSignIn = (request: NextRequest): NextResponse => {
  const url = request.nextUrl.clone();
  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  url.pathname = SIGN_IN_PATH;
  url.search = '';
  url.searchParams.set('callbackUrl', callbackUrl);

  return NextResponse.redirect(url);
};

const redirectToForbidden = (request: NextRequest): NextResponse => {
  const url = request.nextUrl.clone();

  url.pathname = FORBIDDEN_PATH;
  url.search = '';

  return NextResponse.redirect(url);
};

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const role = await getMiddlewareAuthRole(request);

  if (canAccessPath(role, request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return role ? redirectToForbidden(request) : redirectToSignIn(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
