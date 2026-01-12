// server/routes/upload.ts
import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { authenticateToken } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimit';

const router = express.Router();

// Configure multer to store files in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload image endpoint
router.post('/image', authenticateToken, uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP allowed.' });
    }

    // Upload to Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'wlu-connect',
          resource_type: 'image',
          transformation: [
            { width: 2000, height: 2000, crop: 'limit' }, // Max dimensions
            { quality: 'auto' }, // Auto quality
            { fetch_format: 'auto' } // Auto format (WebP when supported)
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      uploadStream.end(req.file!.buffer);
    });

    // Return the Cloudinary URL
    res.json({
      success: true,
      url: result.secure_url // save this link to the postgres database
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;