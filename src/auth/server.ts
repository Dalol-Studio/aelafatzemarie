import {
  PATH_ADMIN,
  PATH_OG,
  PATH_SIGN_IN,
  pathForTag,
} from '@/app/path';
import { TAG_PRIVATE } from '@/tag';
import NextAuth, { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { REQUIRE_LOGIN } from '@/app/config';

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    Credentials({
      async authorize({ email, password }) {
        if (
          process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === email &&
          process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD === password
        ) {
          return { email, name: 'Admin User', role: 'admin' } as User;
        } else if (
          process.env.VISITOR_PRIVATE_EMAIL &&
          process.env.VISITOR_PRIVATE_EMAIL === email &&
          process.env.VISITOR_PRIVATE_PASSWORD &&
          process.env.VISITOR_PRIVATE_PASSWORD === password
        ) {
          return {
            email,
            name: 'Private Viewer',
            role: 'private-viewer',
          } as User;
        } else if (
          process.env.VISITOR_PUBLIC_EMAIL &&
          process.env.VISITOR_PUBLIC_EMAIL === email &&
          process.env.VISITOR_PUBLIC_PASSWORD &&
          process.env.VISITOR_PUBLIC_PASSWORD === password
        ) {
          return {
            email,
            name: 'Public Viewer',
            role: 'public-viewer',
          } as User;
        } else {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const user = auth?.user as any;
      const role = user?.role;

      const isSignInPath = pathname.startsWith(PATH_SIGN_IN);
      const isAdminPath = pathname.startsWith(PATH_ADMIN);
      const isSensitivePath = pathname.startsWith(pathForTag(TAG_PRIVATE));
      const isOgPath = pathname.startsWith(PATH_OG);

      if (isSignInPath) {
        return true;
      } else if (isAdminPath) {
        return role === 'admin';
      } else if (isSensitivePath) {
        return role === 'admin' || role === 'private-viewer';
      } else if (isOgPath) {
        return !!role;
      }

      return REQUIRE_LOGIN ? !!role : true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
});

export const runAuthenticatedAdminServerAction = async <T>(
  callback: () => T,
): Promise<T> => {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role === 'admin') {
    return callback();
  } else {
    throw new Error('Unauthorized admin server action request');
  }
};

export const runAuthenticatedSensitiveServerAction = async <T>(
  callback: () => T,
): Promise<T> => {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role === 'admin' || role === 'private-viewer') {
    return callback();
  } else {
    throw new Error('Unauthorized sensitive server action request');
  }
};

export const runAuthenticatedUserServerAction = async <T>(
  callback: () => T,
): Promise<T> => {
  const session = await auth();
  if (session?.user) {
    return callback();
  } else {
    throw new Error('Unauthorized user server action request');
  }
};
