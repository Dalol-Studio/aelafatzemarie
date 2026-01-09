# Image Caching with Service Worker

This application uses a Service Worker to cache images from S3, Cloudflare R2, Vercel Blob, and Next.js optimized images in the browser's Cache API.

## How It Works

1. **Service Worker Registration**: The `ServiceWorkerRegistration` component in `app/layout.tsx` registers the service worker on page load.

2. **Caching Strategy**: The service worker uses a "Cache First, Network Fallback" strategy:

   - First, it checks if the image is in the cache
   - If cached and fresh (< 30 days old), it serves from cache
   - If not cached or expired, it fetches from the network and caches the response
   - If network fails, it serves stale cache as fallback

3. **What Gets Cached**:
   - AWS S3 images (`*.s3.*.amazonaws.com`)
   - Cloudflare R2 images (`*.r2.cloudflarestorage.com`)
   - Vercel Blob images (`*.blob.vercel-storage.com`)
   - Next.js optimized images (`/_next/image`)

## Benefits

- **Reduced S3/Storage Requests**: Images are cached locally for 30 days
- **Faster Load Times**: Cached images load instantly
- **Reduced Costs**: Fewer requests to S3/storage = lower costs
- **Offline Support**: Images work even when offline (if previously cached)
- **Reduced Vercel Edge Requests**: Cached images don't hit Vercel's edge functions

## Cache Management

### Clear Cache Manually

Open browser console and run:

```javascript
window.clearImageCache();
```

### Check Service Worker Status

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the sidebar
4. You should see `/sw.js` registered and active

### View Cached Images

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Cache Storage** in the sidebar
4. Expand `photo-grid-cache-v1` to see cached images

## Cache Duration

- **Default**: 30 days
- **Configurable**: Edit `IMAGE_CACHE_DURATION` in `public/sw.js`

## Automatic Updates

When the service worker is updated:

1. A notification appears in the bottom-right corner
2. Click "Update Now" to activate the new version
3. The page will reload with the new service worker

## Development

The service worker is active in both development and production. To disable it temporarily:

1. Open DevTools (F12)
2. Go to **Application** > **Service Workers**
3. Click **Unregister** next to `/sw.js`

## Files

- `public/sw.js` - Service worker implementation
- `src/components/ServiceWorkerRegistration.tsx` - Registration component
- `app/layout.tsx` - Where the service worker is registered
