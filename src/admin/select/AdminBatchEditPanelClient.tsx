'use client';

import Note from '@/components/Note';
import LoaderButton from '@/components/primitives/LoaderButton';
import AppGrid from '@/components/AppGrid';
import { clsx } from 'clsx/lite';
import { IoCloseSharp } from 'react-icons/io5';
import { useEffect, useRef, useState } from 'react';
import { TAG_FAVS, Tags } from '@/tag';
import FieldsetTag from '@/tag/FieldsetTag';
import {
  tagMultiplePhotosAction,
  updateTakenAtMultiplePhotosAction,
  generateTitlesForPhotosAction,
  getPhotosForDownloadAction,
} from '@/photo/actions';
import { toastSuccess } from '@/toast';
import DeletePhotosButton from '@/admin/DeletePhotosButton';
import { photoQuantityText } from '@/photo';
import { FaArrowDown, FaCheck, FaCalendar } from 'react-icons/fa6';
import { MdOutlineFileDownload } from 'react-icons/md';
import ResponsiveText from '@/components/primitives/ResponsiveText';
import IconFavs from '@/components/icons/IconFavs';
import IconTag from '@/components/icons/IconTag';
import { useAppText } from '@/i18n/state/client';
import { useSelectPhotosState } from './SelectPhotosState';
import { Albums } from '@/album';
import FieldsetAlbum from '@/album/FieldsetAlbum';
import IconAlbum from '@/components/icons/IconAlbum';
import { addPhotosToAlbumsAction } from '@/album/actions';
import FieldsetDate from '@/components/FieldsetDate';
import { HiSparkles } from 'react-icons/hi';
import { downloadFileFromBrowser } from '@/utility/url';

export default function AdminBatchEditPanelClient({
  uniqueAlbums,
  uniqueTags,
}: {
  uniqueAlbums: Albums
  uniqueTags: Tags
}) {
  const refNote = useRef<HTMLDivElement>(null);

  const {
    canCurrentPageSelectPhotos,
    isSelectingPhotos,
    stopSelectingPhotos,
    selectedPhotoIds,
    selectAllPhotos,
    isPerformingSelectEdit,
    setIsPerformingSelectEdit,
  } = useSelectPhotosState();

  const appText = useAppText();

  const [albumTitles, setAlbumsTitles] = useState<string>();
  const isInAlbumMode = albumTitles !== undefined;

  const [tags, setTags] = useState<string>();
  const [tagErrorMessage, setTagErrorMessage] = useState('');
  const isInTagMode = tags !== undefined;

  const [takenAt, setTakenAt] = useState<string>();
  const isInDateMode = takenAt !== undefined;

  const photosText = photoQuantityText(
    selectedPhotoIds?.length ?? 0,
    appText,
    false,
    false,
  );

  const isFormDisabled =
    isPerformingSelectEdit ||
    selectedPhotoIds?.length === 0;

  const renderPhotoCTA = selectedPhotoIds?.length === 0
    ? <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <FaArrowDown />
        <ResponsiveText shortText="Select">
          Select photos below
        </ResponsiveText>
      </div>
      <LoaderButton
        styleAs="link"
        onClick={selectAllPhotos}
      >
        Select All
      </LoaderButton>
    </div>
    : <div className="flex items-center gap-3">
      <ResponsiveText shortText={photosText}>
        {photosText} selected
      </ResponsiveText>
      <LoaderButton
        styleAs="link"
        onClick={selectAllPhotos}
      >
        Select All
      </LoaderButton>
    </div>;

  const renderActions = isInTagMode || isInAlbumMode || isInDateMode
    ? <>
      <LoaderButton
        className="min-h-[2.5rem]"
        icon={<IoCloseSharp
          size={19}
          className="translate-y-[0.5px]"
        />}
        onClick={() => {
          setAlbumsTitles(undefined);
          setTags(undefined);
          setTagErrorMessage('');
          setTakenAt(undefined);
        }}
        disabled={isPerformingSelectEdit}
      />
      <LoaderButton
        className="min-h-[2.5rem]"
        icon={<FaCheck size={15} />}
        confirmText={isInTagMode
          // eslint-disable-next-line max-len
          ? `Are you sure you want to apply tags to ${photosText}? This action cannot be undone.`
          : isInAlbumMode
            // eslint-disable-next-line max-len
            ? `Are you sure you want to add ${photosText} to these albums? This action cannot be undone.`
            // eslint-disable-next-line max-len
            : `Are you sure you want to update the date for ${photosText}? This action cannot be undone.`}
        onClick={() => {
          setIsPerformingSelectEdit?.(true);
          if (isInTagMode) {
            tagMultiplePhotosAction(
              tags,
              selectedPhotoIds ?? [],
            )
              .then(() => {
                toastSuccess(`${photosText} tagged`);
                stopSelectingPhotos?.();
              })
              .finally(() => setIsPerformingSelectEdit?.(false));
          } else if (isInAlbumMode) {
            addPhotosToAlbumsAction(
              selectedPhotoIds ?? [],
              albumTitles.split(','),
            )
              .then(() => {
                toastSuccess(`${photosText} added`);
                stopSelectingPhotos?.();
              })
              .finally(() => setIsPerformingSelectEdit?.(false));
          } else if (isInDateMode) {
            // Convert the input to proper formats
            // If user enters naive format (YYYY-MM-DD HH:MM:SS), convert to ISO
            // If user enters ISO format, use as-is
            const isIsoFormat = takenAt.includes('T') && takenAt.includes('Z');
            const takenAtIso = isIsoFormat 
              ? takenAt 
              : new Date(takenAt).toISOString();
            const takenAtNaiveFormat = isIsoFormat
              ? takenAt.replace(/T/, ' ').replace(/\.\d+Z$/, '')
              : takenAt;
            
            updateTakenAtMultiplePhotosAction(
              takenAtIso,
              takenAtNaiveFormat,
              selectedPhotoIds ?? [],
            )
              .then(() => {
                toastSuccess(`${photosText} updated`);
                stopSelectingPhotos?.();
              })
              .finally(() => setIsPerformingSelectEdit?.(false));
          }
        }}
        disabled={
          (
            (!tags || Boolean(tagErrorMessage)) &&
            !albumTitles &&
            !takenAt
          ) ||
          (selectedPhotoIds?.length ?? 0) === 0 ||
          isPerformingSelectEdit
        }
        primary
      >
        Apply
      </LoaderButton>
    </>
    : <>
      <DeletePhotosButton
        photoIds={selectedPhotoIds}
        disabled={isFormDisabled}
        onClick={() => setIsPerformingSelectEdit?.(true)}
        onDelete={stopSelectingPhotos}
        onFinish={() => setIsPerformingSelectEdit?.(false)}
      />
      <LoaderButton
        icon={<IconFavs />}
        disabled={isFormDisabled}
        confirmText={`Are you sure you want to favorite ${photosText}?`}
        onClick={() => {
          setIsPerformingSelectEdit?.(true);
          tagMultiplePhotosAction(
            TAG_FAVS,
            selectedPhotoIds ?? [],
          )
            .then(() => {
              toastSuccess(`${photosText} favorited`);
              stopSelectingPhotos?.();
            })
            .finally(() => setIsPerformingSelectEdit?.(false));
        }}
      />
      <LoaderButton
        onClick={() => setAlbumsTitles('')}
        disabled={isFormDisabled}
        icon={<IconAlbum size={15} className="translate-y-[1.5px]" />}
      >
        Album
      </LoaderButton>
      <LoaderButton
        onClick={() => setTags('')}
        disabled={isFormDisabled}
        icon={<IconTag size={15} className="translate-y-[1.5px]" />}
      >
        Tag
      </LoaderButton>
      <LoaderButton
        onClick={() => setTakenAt('')}
        disabled={isFormDisabled}
        icon={<FaCalendar size={14} className="translate-y-[0.5px]" />}
      >
        Date
      </LoaderButton>
      <LoaderButton
        icon={<HiSparkles />}
        disabled={isFormDisabled}
        confirmText={
          `Are you sure you want to autogenerate titles for ${photosText}?`
        }
        onClick={() => {
          setIsPerformingSelectEdit?.(true);
          generateTitlesForPhotosAction(selectedPhotoIds ?? [])
            .then(() => {
              toastSuccess(`${photosText} titles generated`);
              stopSelectingPhotos?.();
            })
            .finally(() => setIsPerformingSelectEdit?.(false));
        }}
      >
        Title
      </LoaderButton>
      <LoaderButton
        icon={<IoCloseSharp size={19} />}
        onClick={stopSelectingPhotos}
      />
    </>;

  const shouldShowPanel =
    isSelectingPhotos &&
    canCurrentPageSelectPhotos;

  useEffect(() => {
    // Steal focus from Admin Menu to hide tooltip
    if (isSelectingPhotos) {
      refNote.current?.focus();
    }
  }, [isSelectingPhotos]);

  return shouldShowPanel
    ? <AppGrid
      className="sticky top-0 z-10 -mt-2 pt-2"
      contentMain={<div className="flex flex-col gap-2">
        <Note
          ref={refNote}
          color="gray"
          className={clsx(
            'min-h-[3.5rem] pr-2',
            'backdrop-blur-lg border-transparent!',
            'text-gray-900! dark:text-gray-100!',
            'bg-gray-100/90! dark:bg-gray-900/70!',
            // Override default <Note /> content spacing
            '[&>*>*:first-child]:gap-1.5 sm:[&>*>*:first-child]:gap-2.5',
          )}
          padding={isInTagMode ? 'tight-cta-right-left' : 'tight-cta-right'}
          cta={<div className="flex items-center gap-1.5 sm:gap-2.5">
            {renderActions}
          </div>}
          spaceChildren={false}
          hideIcon
        >
          {isInAlbumMode
            ? <FieldsetAlbum
              albumOptions={uniqueAlbums}
              value={albumTitles}
              onChange={setAlbumsTitles}
              readOnly={isPerformingSelectEdit}
              openOnLoad
              hideLabel
            />
            : isInDateMode
              ? <FieldsetDate
                label="Taken At"
                value={takenAt}
                onChange={setTakenAt}
                readOnly={isPerformingSelectEdit}
                hideLabel
              />
              : isInTagMode
                ? <FieldsetTag
                  tags={tags}
                  tagOptions={uniqueTags}
                  placeholder={`Tag ${photosText} ...`}
                  onChange={setTags}
                  onError={setTagErrorMessage}
                  readOnly={isPerformingSelectEdit}
                  openOnLoad
                  hideLabel
                />
                : <div className="text-base flex gap-2 items-center">
                  {renderPhotoCTA}
                </div>}
        </Note>
        {tagErrorMessage &&
          <div className="text-error pl-4">
            {tagErrorMessage}
          </div>}
      </div>} />
    : null;
}
