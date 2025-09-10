# Cloudinary Setup for Railway Deployment

## Required Environment Variables

Add these environment variables to your Railway project:

### 1. CLOUDINARY_CLOUD_NAME
- Get this from your Cloudinary dashboard
- Example: `your-cloud-name`

### 2. CLOUDINARY_API_KEY  
- Get this from your Cloudinary dashboard
- Example: `123456789012345`

### 3. CLOUDINARY_API_SECRET
- Get this from your Cloudinary dashboard  
- Example: `abcdefghijklmnopqrstuvwxyz123456`

## How to Set Environment Variables in Railway:

1. Go to your Railway project dashboard
2. Click on your service (backend)
3. Go to the "Variables" tab
4. Add each environment variable with the values from your Cloudinary account

## Getting Cloudinary Credentials:

1. Sign up for a free Cloudinary account at https://cloudinary.com
2. Go to your dashboard
3. Copy the Cloud Name, API Key, and API Secret
4. Add them to Railway

## Benefits of Cloudinary:

- ✅ Persistent image storage (survives deployments)
- ✅ Automatic image optimization
- ✅ CDN delivery for fast loading
- ✅ Automatic format conversion (WebP, AVIF)
- ✅ Responsive image delivery
- ✅ 25GB free storage and 25GB monthly bandwidth

## Test Cloudinary Integration:

After setting up the environment variables, test by:
1. Deploying the updated code
2. Adding a new item with a photo
3. Verifying the photo displays correctly
4. Checking that photos persist after redeployment
