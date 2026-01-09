'use client';

/* eslint-disable jsx-a11y/alt-text */
import { BLUR_ENABLED } from '@/app/config';
import { useAppState } from '@/app/AppState';
import { clsx}  from 'clsx/lite';
import Image, { ImageProps } from 'next/image';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

export default function ImageWithFallback({
  ref: refProp,
  className,
  classNameImage = 'object-cover h-full',
  blurDataURL,
  blurCompatibilityLevel = 'low',
  priority,
  ...props
}: ImageProps & {
  ref?: RefObject<HTMLImageElement | null>
  blurCompatibilityLevel?: 'none' | 'low' | 'high'
  classNameImage?: string
}) {
  const ref = useRef<HTMLImageElement>(null);

  const { hasLoadedWithAnimations, shouldDebugImageFallbacks } = useAppState();

  const [isLoading, setIsLoading] = useState(true);
  const [didError, setDidError] = useState(false);
  const [fadeFallbackTransition, setFadeFallbackTransition] =
    useState(!hasLoadedWithAnimations);

  const onLoad = useCallback(() => setIsLoading(false), []);
  const onError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setDidError(true);
    console.error('Image failed to load:', e.currentTarget.src);
  }, []);

  useEffect(() => {
    if (
      !ref.current?.complete ||
      (ref.current?.naturalWidth ?? 0) === 0
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFadeFallbackTransition(true);
    }
  }, []);

  const getBlurClass = () => {
    switch (blurCompatibilityLevel) {
      case 'high':
      // Fix poorly blurred placeholder data generated on client
        return 'blur-[4px] @xs:blue-md scale-[1.05]';
      case 'low':
        return 'blur-[2px] @xs:blue-md scale-[1.01]';
    }
  };

  return (
    <div
      className={clsx(
        'flex relative',
        className,
      )}
    >
      <Image ref={refProp ?? ref} {...{
        ...props,
        priority,
        className: classNameImage,
        onLoad,
        onError,
      }} />
      <div
        className={clsx(
          '@container',
          'absolute inset-0 pointer-events-none',
          'overflow-hidden',
          fadeFallbackTransition &&
            'transition-opacity duration-300 ease-in',
          !(BLUR_ENABLED && blurDataURL) && 'bg-gray-100/10', // Lighter background for better contrast
          (isLoading || didError || shouldDebugImageFallbacks)
            ? 'opacity-100'
            : 'opacity-0',
          'flex items-center justify-center', // Center content
        )}
      >
        {didError ? (
            <div className="flex flex-col items-center justify-center text-dim gap-2 p-2 text-center">
                <span className="text-2xl">⚠️</span>
                <span className="text-xs font-mono">Failed to load</span>
            </div>
        ) : (BLUR_ENABLED && blurDataURL)
          ? <img {...{
            ...props,
            src: blurDataURL,
            className: clsx(
              getBlurClass(),
              classNameImage,
            ),
          }} />
          :  <div className={clsx(
            'w-full h-full',
            'bg-gray-100/10',
          )} />}
      </div>
    </div>
  );
}
