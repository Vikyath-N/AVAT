/**
 * Cloudflare R2 Storage Service for AVAT
 * Handles PDF storage and retrieval with Cloudflare R2
 */

// R2 configuration (set in wrangler.toml or environment)
const R2_ACCOUNT_ID = 'YOUR_R2_ACCOUNT_ID';
const R2_ACCESS_KEY_ID = 'YOUR_R2_ACCESS_KEY_ID';
const R2_SECRET_ACCESS_KEY = 'YOUR_R2_SECRET_ACCESS_KEY';
const R2_BUCKET_NAME = 'avat-pdfs';

/**
 * Upload a PDF file to R2
 * @param {string} key - The key/name for the file
 * @param {ArrayBuffer} fileBuffer - The file buffer
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export async function uploadToR2(key, fileBuffer, metadata = {}) {
  try {
    // Create R2 client using Cloudflare's S3-compatible API
    const s3Client = {
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    };

    // For now, we'll use the Web API fetch since we're in Cloudflare Workers
    // In a real implementation, you'd use the AWS SDK or similar
    const response = await fetch(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'application/pdf',
        'Authorization': `Bearer ${R2_ACCESS_KEY_ID}`, // This would need proper signing
        ...metadata
      }
    });

    if (!response.ok) {
      throw new Error(`R2 upload failed: ${response.statusText}`);
    }

    // Return the public URL
    return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  } catch (error) {
    console.error('R2 upload error:', error);
    throw error;
  }
}

/**
 * Download a PDF file from R2
 * @param {string} key - The key/name of the file
 * @returns {Promise<ArrayBuffer>} - The file buffer
 */
export async function downloadFromR2(key) {
  try {
    const response = await fetch(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${R2_ACCESS_KEY_ID}`,
      }
    });

    if (!response.ok) {
      throw new Error(`R2 download failed: ${response.statusText}`);
    }

    return await response.arrayBuffer();

  } catch (error) {
    console.error('R2 download error:', error);
    throw error;
  }
}

/**
 * Delete a PDF file from R2
 * @param {string} key - The key/name of the file
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFromR2(key) {
  try {
    const response = await fetch(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${R2_ACCESS_KEY_ID}`,
      }
    });

    return response.ok;

  } catch (error) {
    console.error('R2 delete error:', error);
    return false;
  }
}

/**
 * List files in R2 bucket with prefix
 * @param {string} prefix - The prefix to filter by
 * @returns {Promise<string[]>} - Array of file keys
 */
export async function listR2Files(prefix = '') {
  try {
    // Note: This would require ListObjectsV2 API implementation
    // For now, return empty array as this is complex to implement without AWS SDK
    console.warn('R2 listing not fully implemented in this demo');
    return [];

  } catch (error) {
    console.error('R2 list error:', error);
    return [];
  }
}

/**
 * Check if a file exists in R2
 * @param {string} key - The key/name of the file
 * @returns {Promise<boolean>} - Whether the file exists
 */
export async function fileExistsInR2(key) {
  try {
    const response = await fetch(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${R2_ACCESS_KEY_ID}`,
      }
    });

    return response.ok;

  } catch (error) {
    console.error('R2 exists check error:', error);
    return false;
  }
}

/**
 * Get file metadata from R2
 * @param {string} key - The key/name of the file
 * @returns {Promise<Object>} - File metadata
 */
export async function getR2FileMetadata(key) {
  try {
    const response = await fetch(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${R2_ACCESS_KEY_ID}`,
      }
    });

    if (!response.ok) {
      throw new Error(`R2 metadata fetch failed: ${response.statusText}`);
    }

    return {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      lastModified: response.headers.get('last-modified'),
      etag: response.headers.get('etag')
    };

  } catch (error) {
    console.error('R2 metadata error:', error);
    return null;
  }
}
