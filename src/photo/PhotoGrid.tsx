'use client';

import { Photo } from '.';
import { PhotoSetCategory } from '../category';
import PhotoMedium from './PhotoMedium';
import { clsx } from 'clsx/lite';
import AnimateItems from '@/components/AnimateItems';
import { GRID_ASPECT_RATIO } from '@/app/config';
import { useAppState } from '@/app/AppState';
import SelectTileOverlay from '@/components/SelectTileOverlay';
import { ReactNode } from 'react';
import { GRID_GAP_CLASSNAME } from '@/components';
import { useSelectPhotosState } from '@/admin/select/SelectPhotosState';
import {
  DATA_KEY_PHOTO_GRID,
  DATA_KEY_PHOTO_ID,
} from '@/admin/select/SelectPhotosProvider';
import IconLock from '@/components/icons/IconLock';
import Tooltip from '@/components/Tooltip';
import { PRIVATE_DESCRIPTION } from './visibility';

export default function PhotoGrid({
  photos,
  selectedPhoto,
  prioritizeInitialPhotos,
  className,
  classNamePhoto,
  animate = true,
  canStart,
  animateOnFirstLoadOnly,
  staggerOnFirstLoadOnly = true,
  additionalTile,
  small,
  selectable = true,
  onLastPhotoVisible,
  onAnimationComplete,
  ...categories
}: {
  photos: Photo[]
  selectedPhoto?: Photo
  prioritizeInitialPhotos?: boolean
  className?: string
  classNamePhoto?: string
  animate?: boolean
  canStart?: boolean
  animateOnFirstLoadOnly?: boolean
  staggerOnFirstLoadOnly?: boolean
  additionalTile?: ReactNode
  small?: boolean
  selectable?: boolean
  onLastPhotoVisible?: () => void
  onAnimationComplete?: () => void
} & PhotoSetCategory) {
  const {
    isGridHighDensity,
    userRole,
  } = useAppState();

  // Check if user can see private photos
  const canSeePrivatePhotos =
    userRole === 'admin' || userRole === 'private-viewer';

  const {
    isSelectingPhotos,
    selectedPhotoIds,
    setSelectedPhotoIds,
  } = useSelectPhotosState();

  return (
    <div
      {...{ [DATA_KEY_PHOTO_GRID]: selectable, className }}
    >
      <AnimateItems
        className={clsx(
          'grid',
          GRID_GAP_CLASSNAME,
          small
            ? 'grid-cols-3 xs:grid-cols-6'
            : isGridHighDensity
              ? 'grid-cols-2 xs:grid-cols-4 lg:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4',
          'items-center',
          'admin-select-all-container',
        )}
        type={animate === false ? 'none' : undefined}
        canStart={canStart}
        duration={0.7}
        staggerDelay={0.04}
        distanceOffset={40}
        animateOnFirstLoadOnly={animateOnFirstLoadOnly}
        staggerOnFirstLoadOnly={staggerOnFirstLoadOnly}
        onAnimationComplete={onAnimationComplete}
        items={photos.map((photo, index) => {
          const isSelected = selectedPhotoIds?.includes(photo.id) ?? false;
          return <div
            key={photo.id}
            className={clsx(
              'flex relative overflow-hidden',
              'group',
            )}
            style={{
              ...GRID_ASPECT_RATIO !== 0 && {
                aspectRatio: GRID_ASPECT_RATIO,
              },
            }}
            {...{ [DATA_KEY_PHOTO_ID]: photo.id }}
          >
            <PhotoMedium
              className={clsx(
                'flex w-full h-full',
                // Prevent photo navigation when selecting
                isSelectingPhotos && 'pointer-events-none',
                classNamePhoto,
              )}
              {...{
                photo,
                ...categories,
                selected: photo.id === selectedPhoto?.id,
                priority: prioritizeInitialPhotos ? index < 6 : undefined,
                onVisible: index === photos.length - 1
                  ? onLastPhotoVisible
                  : undefined,
              }}
            />
            {isSelectingPhotos &&
              <SelectTileOverlay
                isSelected={isSelected}
                onSelectChange={() => setSelectedPhotoIds?.(isSelected
                  ? (selectedPhotoIds ?? []).filter(id => id !== photo.id)
                  : (selectedPhotoIds ?? []).concat(photo.id),
                )}
              />}
            {/* Private photo indicator */}
            {canSeePrivatePhotos && photo.hidden &&
              <div className={clsx(
                'absolute top-1.5 left-1.5 z-10',
                'bg-black/60 rounded-full p-1',
                'pointer-events-auto',
              )}>
                <Tooltip content={PRIVATE_DESCRIPTION} supportMobile>
                  <IconLock
                    size={12}
                    className="text-white"
                  />
                </Tooltip>
              </div>}
          </div>;
        }).concat(additionalTile ? <>{additionalTile}</> : [])}
        itemKeys={photos.map(photo => photo.id)
          .concat(additionalTile ? ['more'] : [])}
      />
    </div>
  );
};
