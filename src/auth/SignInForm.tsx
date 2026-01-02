'use client';

import FieldsetWithStatus from '@/components/FieldsetWithStatus';
import Container from '@/components/Container';
import SubmitButtonWithStatus from '@/components/SubmitButtonWithStatus';
import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getAuthAction, signInAction } from './actions';
import ErrorNote from '@/components/ErrorNote';
import {
  KEY_CALLBACK_URL,
  KEY_CREDENTIALS_SIGN_IN_ERROR,
  KEY_CREDENTIALS_SUCCESS,
} from '.';
import { useSearchParams } from 'next/navigation';
import { useAppState } from '@/app/AppState';
import { clsx } from 'clsx/lite';
import { PATH_ROOT } from '@/app/path';
import IconLock from '@/components/icons/IconLock';
import { useAppText } from '@/i18n/state/client';

export default function SignInForm({
  includeTitle = true,
  shouldRedirect = true,
  className,
}: {
  includeTitle?: boolean
  shouldRedirect?: boolean
  className?: string
}) {
  const params = useSearchParams();

  const { setUserEmail } = useAppState();

  const appText = useAppText();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [response, action] = useActionState(signInAction, undefined);

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timeout = setTimeout(() => emailRef.current?.focus(), 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (response === KEY_CREDENTIALS_SUCCESS) {
      setUserEmail?.(email);
    }
  }, [setUserEmail, response, email]);

  useEffect(() => {
    return () => {
      // Capture user email before unmounting
      getAuthAction().then(auth =>
        setUserEmail?.(auth?.user?.email ?? undefined));
    };
  }, [setUserEmail]);

  const isFormValid =
    email.length > 0 &&
    password.length > 0;

  return (
    <Container
      className={clsx(
        'w-full max-w-[360px]',
        'px-8 py-8',
        'flex flex-col gap-6',
        className,
      )}
    >
      {includeTitle &&
        <h1 className={clsx(
          'flex gap-3 items-center justify-center',
          'self-start text-2xl font-semibold',
          'mb-4 text-white',
        )}>
          <IconLock className="text-white/80 translate-y-[0.5px]" />
          <span>
            {appText.auth.signIn}
          </span>
        </h1>}
      <form action={action} className="w-full">
        <div className="space-y-6 w-full mt-2">
          {response === KEY_CREDENTIALS_SIGN_IN_ERROR &&
            <ErrorNote className="bg-red-500/20 border-red-500/50 text-red-200">
              {appText.auth.invalidEmailPassword}
            </ErrorNote>}
          <div className="space-y-4 w-full">
            <FieldsetWithStatus
              id="email"
              inputRef={emailRef}
              label={appText.auth.email}
              type="email"
              value={email}
              onChange={setEmail}
              className="*:text-white/70 *:bg-white/5 *:border-white/10"
            />
            <FieldsetWithStatus
              id="password"
              label={appText.auth.password}
              type="password"
              value={password}
              onChange={setPassword}
              className="*:text-white/70 *:bg-white/5 *:border-white/10"
            />
            {shouldRedirect &&
              <input
                type="hidden"
                name={KEY_CALLBACK_URL}
                value={params.get(KEY_CALLBACK_URL) || PATH_ROOT}
              />}
          </div>
          <SubmitButtonWithStatus 
            disabled={!isFormValid}
            className={clsx(
              'w-full py-3 rounded-xl font-bold uppercase tracking-widest',
              'bg-white text-black hover:bg-white/90',
              'transform transition-all active:scale-[0.98]',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'disabled:active:scale-100',
            )}
          >
            {appText.auth.signIn}
          </SubmitButtonWithStatus>
        </div>
      </form>
    </Container>
  );
}
