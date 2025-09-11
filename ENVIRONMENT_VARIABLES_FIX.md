# Railway Environment Variables Setup Guide

## Image Upload Fix - Missing Environment Variables

Your image uploads are failing because Railway doesn't have the required environment variables.

### Required Environment Variables for Railway:

1. **CLOUDINARY_CLOUD_NAME**: drwckjy3
2. **CLOUDINARY_API_KEY**: 233919122513455  
3. **CLOUDINARY_API_SECRET**: tuPd8waa8Z5wprfM4qCZtsf-w
4. **MONGODB_URI**: (Railway should auto-provide this if you have MongoDB service)
5. **JWT_SECRET**: dc4_enterprise_inventory_super_secure_jwt_secret_key_2024_production_ready

### How to Add Environment Variables in Railway:

1. Go to https://railway.app/dashboard
2. Select your project: enterprise-inventory-system
3. Click on your backend service
4. Go to the "Variables" tab
5. Add each environment variable:
   - Click "+ New Variable"
   - Enter the name and value
   - Click "Add"

### Quick Fix Steps:

1. Add the 5 environment variables above to Railway
2. Railway will automatically redeploy
3. Test image upload again

## ISBN-13 Display Issue

The ISBN showing as "1" suggests either:
1. Data was truncated during import
2. Field validation is limiting input

### Recommended Solution:
After fixing the environment variables, try importing the Excel file again. The enhanced ISBN-13 mapping should work correctly now.

If ISBN is still showing as "1", the data might be corrupted in the database and would need to be re-imported or manually updated.
