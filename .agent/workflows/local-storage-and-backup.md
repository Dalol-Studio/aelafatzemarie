---
description: How to use local storage and database backup
---

# Local Storage and Backup Workflow

This workflow describes how to use the newly implemented local storage for images and the database backup feature.

## 1. Local Image Storage

To enable storing uploaded images in the local `public/uploads` directory instead of cloud storage (S3, Vercel Blob, etc.), set the following environment variable in your `.env.local` file:

```bash
NEXT_PUBLIC_USE_LOCAL_STORAGE=1
```

Or explicitly set the preference:

```bash
NEXT_PUBLIC_STORAGE_PREFERENCE=local-fs
```

When enabled:

- New uploads will go to `public/uploads`.
- The application will serve images from `/uploads/...`.

## 2. Database Backup

You can backup the PostgreSQL database to local JSON files.

### Via Admin Interface

1. Log in to the Admin Dashboard.
2. Click the specific menu action or look for "Backup Database" in the main menu (under the "Update Photos" or similar section).
3. Confirm the action.
4. Backups will be stored in `public/backups`.

### Backup Location

The backup files (JSON format) are stored in:
`project-root/public/backups/`

Each table gets its own JSON file (e.g., `photos.json`, `cameras.json`). A `backup-meta.json` file tracks the latest backup timestamp.
