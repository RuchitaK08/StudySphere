import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { storage } from '../config/firebase';
import { firestoreService } from './firestoreService';
import type { StudyResource, UserProfile } from '../types';

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const storageService = {
  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File is too large (${formatBytes(file.size)}). Maximum allowed size is 15 MB.`
      };
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/zip',
      'application/x-zip-compressed'
    ];

    const isExtensionAllowed = /\.(pdf|docx?|pptx?|txt|md|png|jpe?g|webp|zip)$/i.test(file.name);

    if (!allowedTypes.includes(file.type) && !isExtensionAllowed) {
      return {
        valid: false,
        error: 'Unsupported file type. Please upload PDF, Word documents, text/markdown, images, or ZIP archives.'
      };
    }

    return { valid: true };
  },

  async uploadStudyResource(params: {
    file: File;
    title: string;
    category: string;
    description: string;
    user: UserProfile;
    roomId?: string | null;
    onProgress: (progressPercent: number, bytesTransferred: number, totalBytes: number) => void;
  }): Promise<StudyResource> {
    const { file, title, category, description, user, roomId, onProgress } = params;

    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `resources/${user.uid}/${timestamp}_${sanitizedFileName}`;

    // Priority 1: Real Firebase Storage upload if configured
    if (storage) {
      const storageRef = ref(storage, storagePath);
      const customMetadata = {
        uploaderId: user.uid,
        uploaderName: user.displayName,
        title,
        category,
        uploadedAt: new Date().toISOString()
      };

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'application/octet-stream',
        customMetadata
      });

      return new Promise<StudyResource>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.round(progress), snapshot.bytesTransferred, snapshot.totalBytes);
          },
          (error) => {
            console.error('Firebase Storage upload error:', error);
            reject(new Error(error.message || 'Storage upload failed. Please verify Storage Rules.'));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const resource = await firestoreService.createResourceRecord({
                name: file.name,
                title: title.trim() || file.name,
                category,
                description: description.trim(),
                sizeBytes: file.size,
                formattedSize: formatBytes(file.size),
                mimeType: file.type || 'application/octet-stream',
                downloadURL,
                storagePath,
                uploaderId: user.uid,
                uploaderName: user.displayName,
                roomId: roomId || null,
                createdAt: timestamp
              });
              resolve(resource);
            } catch (firestoreErr) {
              reject(firestoreErr);
            }
          }
        );
      });
    }

    // Priority 2: Interactive Demo Upload with realistic simulated progress
    return new Promise<StudyResource>((resolve) => {
      let progress = 0;
      const interval = setInterval(async () => {
        progress += 15;
        if (progress > 100) progress = 100;
        onProgress(progress, Math.round((file.size * progress) / 100), file.size);

        if (progress === 100) {
          clearInterval(interval);
          // Create local object URL for instant previewing
          const objectUrl = URL.createObjectURL(file);
          const resource = await firestoreService.createResourceRecord({
            name: file.name,
            title: title.trim() || file.name,
            category,
            description: description.trim(),
            sizeBytes: file.size,
            formattedSize: formatBytes(file.size),
            mimeType: file.type || 'application/pdf',
            downloadURL: objectUrl,
            storagePath: `demo_local/${sanitizedFileName}`,
            uploaderId: user.uid,
            uploaderName: user.displayName,
            roomId: roomId || null,
            createdAt: timestamp
          });
          resolve(resource);
        }
      }, 100);
    });
  },

  async deleteStudyResource(resource: StudyResource): Promise<void> {
    if (storage && resource.storagePath && !resource.storagePath.startsWith('demo_local/')) {
      try {
        const fileRef = ref(storage, resource.storagePath);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn('Could not delete file from Cloud Storage bucket:', err);
      }
    }
    await firestoreService.deleteResourceRecord(resource.id);
  }
};
