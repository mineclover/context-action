/**
 * FileUploadService - Pure Business Logic Module
 *
 * Demonstrates business logic separation from React and state management.
 * This service can be tested independently and reused across different UI frameworks.
 */

export type ProcessState =
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error';

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

export interface FileUploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
  processedData?: {
    thumbnailUrl?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Pure business logic service for file uploads
 * No dependencies on React, stores, or UI frameworks
 */
export class FileUploadService {
  private readonly maxSize: number;
  private readonly allowedTypes: string[];
  private readonly chunkCount: number;
  private readonly uploadDelay: number;

  constructor(options?: {
    maxSize?: number;
    allowedTypes?: string[];
    chunkCount?: number;
    uploadDelay?: number;
  }) {
    this.maxSize = options?.maxSize ?? 10 * 1024 * 1024; // 10MB default
    this.allowedTypes = options?.allowedTypes ?? [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];
    this.chunkCount = options?.chunkCount ?? 10;
    this.uploadDelay = options?.uploadDelay ?? 100; // ms per chunk
  }

  /**
   * Validate file before upload
   * Business rule: Files must be within size limit and allowed types
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.maxSize) {
      const maxSizeMB = Math.round(this.maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }

    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${this.allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Simulate file upload with progress tracking
   * Returns progress updates via callback
   */
  async uploadFile(
    file: File,
    onProgress: (progress: UploadProgress) => void
  ): Promise<{ fileId: string }> {
    const totalBytes = file.size;
    const chunkSize = Math.ceil(totalBytes / this.chunkCount);

    for (let i = 0; i <= this.chunkCount; i++) {
      await new Promise((resolve) => setTimeout(resolve, this.uploadDelay));

      const bytesUploaded = Math.min(i * chunkSize, totalBytes);
      const percentage = Math.round((bytesUploaded / totalBytes) * 100);

      onProgress({
        bytesUploaded,
        totalBytes,
        percentage,
      });
    }

    return {
      fileId: `file_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
  }

  /**
   * Process uploaded file
   * Simulates server-side processing with intermediate states
   */
  async processFile(
    fileId: string,
    onStatusUpdate: (status: string) => void
  ): Promise<FileUploadResult> {
    const steps = [
      'Scanning file for viruses...',
      'Extracting metadata...',
      'Generating thumbnail...',
      'Indexing content...',
      'Finalizing upload...',
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      onStatusUpdate(step);
    }

    return {
      success: true,
      fileId,
      processedData: {
        thumbnailUrl: '/placeholder-thumbnail.jpg',
        metadata: {
          processedAt: new Date().toISOString(),
          version: '1.0',
        },
      },
    };
  }

  /**
   * Complete upload workflow
   * Orchestrates validation → upload → processing
   */
  async completeUpload(
    file: File,
    callbacks: {
      onStateChange: (state: ProcessState) => void;
      onProgress: (progress: UploadProgress) => void;
      onStatusUpdate: (status: string) => void;
    }
  ): Promise<FileUploadResult> {
    try {
      // Step 1: Validation
      callbacks.onStateChange('validating');
      await new Promise((resolve) => setTimeout(resolve, 300));

      const validation = this.validateFile(file);
      if (!validation.valid) {
        callbacks.onStateChange('error');
        return { success: false, error: validation.error };
      }

      // Step 2: Upload
      callbacks.onStateChange('uploading');
      const { fileId } = await this.uploadFile(file, callbacks.onProgress);

      // Step 3: Processing
      callbacks.onStateChange('processing');
      const result = await this.processFile(fileId, callbacks.onStatusUpdate);

      // Step 4: Complete
      callbacks.onStateChange('complete');
      return result;
    } catch (error) {
      callbacks.onStateChange('error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }
}
