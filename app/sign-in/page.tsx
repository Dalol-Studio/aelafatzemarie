import { auth } from '@/auth/server';
import SignInForm from '@/auth/SignInForm';
import { PATH_ROOT } from '@/app/path';
import { clsx } from 'clsx/lite';
import { redirect } from 'next/navigation';
import LinkWithStatus from '@/components/LinkWithStatus';
import { IoArrowBack } from 'react-icons/io5';
import { getAppText } from '@/i18n/state/server';
import Image from 'next/image';
import * as motion from 'framer-motion/client';

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect(PATH_ROOT);
  }

  const appText = await getAppText();
  
  return (
    <div className={clsx(
      'fixed inset-0 z-[100]',
      'flex items-center justify-center flex-col',
      'bg-black',
    )}>
      {/* Background Image with Blur */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/h2.jpg"
          alt="Background"
          fill
          className={clsx(
            'object-cover blur-[8px]',
            'opacity-60 scale-105',
          )}
          priority
        />
        <div className={clsx(
          'absolute inset-0',
          'bg-gradient-to-b from-black/40 via-transparent to-black/60',
        )} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={clsx(
          'relative z-10 flex flex-col items-center gap-8',
          'w-full max-w-sm px-4',
        )}
      >
        <div className="flex flex-col items-center gap-5 text-center">
          <Image
            src="/Aelafat_Logos.png"
            alt="Aelafat Logo"
            width={240}
            height={80}
            className="drop-shadow-2xl"
          />
          <div className="space-y-1">
            <h2 className={clsx(
              'text-white/90 text-sm font-semibold',
              'tracking-[0.3em] uppercase italic',
            )}>
              Media Access Portal
            </h2>
            <p className={clsx(
              'text-white/40 text-[10px]',
              'tracking-[0.4em] uppercase font-light',
            )}>
              Media • Internal • Admin
            </p>
          </div>
        </div>

        <SignInForm 
          includeTitle={false}
          className={clsx(
            'bg-black/50 backdrop-blur-2xl',
            'border border-white/10',
            'shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]',
            'rounded-[2.5rem]',
          )}
        />

        <LinkWithStatus
          href={PATH_ROOT}
          className={clsx(
            'flex items-center gap-2.5',
            'text-white/40 hover:text-white transition-all duration-300',
            'text-[10px] font-medium tracking-[0.3em] uppercase',
          )}
        >
          <IoArrowBack className="translate-y-[0.5px]" />
          {appText.nav.home}
        </LinkWithStatus>
      </motion.div>
    </div>
  );
}
