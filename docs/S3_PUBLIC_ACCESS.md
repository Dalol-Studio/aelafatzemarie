# S3 Public Access Configuration

To enable Next.js image optimization and improve performance, you need to make your S3 bucket publicly readable.

## Current Setup

- **Bucket**: `aelafat2025`
- **Region**: `eu-north-1`
- **Current Issue**: Next.js image optimizer cannot fetch images from S3, resulting in 500 errors

## Solution: Make S3 Bucket Publicly Readable

### Step 1: Update Bucket Policy

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/s3/buckets)
2. Click on your bucket: `aelafat2025`
3. Go to the **Permissions** tab
4. Scroll down to **Bucket policy**
5. Click **Edit** and paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::aelafat2025/*"
    }
  ]
}
```

6. Click **Save changes**

### Step 2: Disable Block Public Access

1. Still in the **Permissions** tab
2. Find **Block public access (bucket settings)**
3. Click **Edit**
4. **Uncheck** all four options:
   - Block all public access
   - Block public access to buckets and objects granted through new access control lists (ACLs)
   - Block public access to buckets and objects granted through any access control lists (ACLs)
   - Block public access to buckets and objects granted through new public bucket or access point policies
5. Click **Save changes**
6. Type `confirm` when prompted

### Step 3: Enable CORS (Optional but Recommended)

1. Go to the **Permissions** tab
2. Scroll down to **Cross-origin resource sharing (CORS)**
3. Click **Edit** and paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

4. Click **Save changes**

### Step 4: Remove `unoptimized: true` from next.config.ts

Once your bucket is public, remove this line from `next.config.ts`:

```typescript
unoptimized: true, // Remove this line
```

This will enable Next.js image optimization, which provides:

- Automatic image resizing
- WebP/AVIF format conversion
- Quality optimization
- Better performance

## Security Considerations

### ✅ Safe to Make Public

Your photos are **already public** on your website, so making the S3 bucket public doesn't expose anything new. It just allows direct access to the images.

### 🔒 Keep Private Data Secure

If you have any private/sensitive files in S3:

1. Store them in a **different bucket** with private access
2. Use signed URLs for private content
3. Never store credentials or sensitive data in public buckets

## Alternative: Use Signed URLs (More Complex)

If you prefer to keep the bucket private, you can:

1. Generate signed URLs for each image
2. Update the database to store signed URLs
3. Regenerate URLs periodically (they expire)

This is more complex and not recommended for public photo galleries.

## Testing

After making the bucket public, test by:

1. Opening an image URL directly in your browser:

   ```
   https://aelafat2025.s3.eu-north-1.amazonaws.com/photo-[ID].jpg
   ```

2. If it loads, your bucket is public! ✅

3. Restart your dev server and check for 500 errors

## Current Workaround

For now, we're using `unoptimized: true` which:

- ✅ Bypasses Next.js image optimization
- ✅ Serves images directly from S3
- ✅ Still uses service worker caching
- ❌ No automatic resizing/format conversion
- ❌ Larger file sizes

Once you make the bucket public, you can remove `unoptimized: true` for better performance!
