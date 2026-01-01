'use client';

import { ComponentProps } from 'react';
import FieldsetWithStatus from './FieldsetWithStatus';

export default function FieldsetDate({
  value,
  onChange,
  ...props
}: Omit<ComponentProps<typeof FieldsetWithStatus>, 'type'>) {
  return (
    <FieldsetWithStatus
      {...props}
      type="text"
      value={value}
      onChange={onChange}
      placeholder="YYYY-MM-DD HH:MM:SS"
    />
  );
}
