/**
 * FileUploadZone Component
 *
 * File selection and drag-and-drop zone.
 * Pure presentation component with action dispatching.
 */

import { useCallback, useState } from 'react';
import { useUploadAction } from '../contexts/UploadActionContext';

export function FileUploadZone() {
  const dispatch = useUploadAction();
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      dispatch('addFiles', { files: fileArray });
    },
    [dispatch]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input to allow selecting same file again
      e.target.value = '';
    },
    [handleFiles]
  );

  return (
    <div className="mb-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-4xl mb-4">📁</div>
        <h3 className="text-lg font-semibold mb-2">
          Drop files here or click to select
        </h3>
        <p className="text-gray-600 mb-4">
          Supports: Images (JPEG, PNG, GIF, WebP) and PDF files up to 10MB
        </p>

        <label className="inline-block">
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileInput}
            className="hidden"
          />
          <span className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer inline-block">
            Select Files
          </span>
        </label>
      </div>
    </div>
  );
}
