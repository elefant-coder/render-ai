/**
 * Storage Module
 * Supabase Storage を使用（R2から移行）
 */

export {
  uploadImage,
  uploadBase64Image,
  saveGeneratedImages,
  getImageUrl,
  deleteImage,
  deleteGenerationImages,
  isStorageConfigured,
} from './supabase';
