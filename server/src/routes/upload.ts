// server/routes/upload.ts
import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Configure multer to store files in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload image endpoint
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'wlu-connect',
          resource_type: 'image'
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