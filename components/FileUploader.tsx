'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '@/lib/store';
import { uploadDocument, listDocuments } from '@/lib/api-client';
import type { Document } from '@/lib/types';

/**
 * Categories for organizing documents
 */
const CATEGORIES = [
  { id: 'study-materials', label: 'Study Materials' },
  { id: 'reference-docs', label: 'Reference Docs' },
  { id: 'notes', label: 'Notes' },
  { id: 'other', label: 'Other' },
] as const;

/**
 * Accepted file types
 */
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileUploaderProps {
  onUploadComplete?: () => void;
}

/**
 * FileUploader Component
 * 
 * Modern dark-themed drag-and-drop file upload interface with:
 * - Glassmorphism card design
 * - Accent-colored category pills
 * - Animated upload progress
 * - Hover effects on document cards
 */
export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('study-materials');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { uploadProgress, setUploadProgress, documents, setDocuments, addDocument } = useAppStore();

  /**
   * Handle file drop/selection
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadError(null);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    try {
      // Start upload
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      });

      // Simulate progress (real progress would come from XHR)
      const progressInterval = setInterval(() => {
        setUploadProgress({
          fileName: file.name,
          progress: Math.min(90, (uploadProgress?.progress || 0) + 10),
          status: 'uploading',
        });
      }, 200);

      // Upload document
      const result = await uploadDocument(file, file.name, selectedCategory);

      clearInterval(progressInterval);

      // Processing status
      setUploadProgress({
        fileName: file.name,
        progress: 95,
        status: 'processing',
      });

      // Complete
      setTimeout(() => {
        setUploadProgress({
          fileName: file.name,
          progress: 100,
          status: 'complete',
        });

        // Add to documents list
        const newDoc: Document = {
          id: result.document_id,
          userId: '', // Will be filled by API
          name: file.name,
          category: selectedCategory,
          contentType: file.type,
          size: file.size,
          uploadedAt: new Date(),
          processedAt: result.status === 'indexed' ? new Date() : null,
          elevenLabsDocId: result.document_id,
          metadata: { chunkCount: result.chunk_count },
        };

        addDocument(newDoc);
        onUploadComplete?.();

        // Clear progress after delay
        setTimeout(() => setUploadProgress(null), 2000);
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [selectedCategory, uploadProgress, setUploadProgress, addDocument, onUploadComplete]);

  /**
   * Load documents on mount
   */
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listDocuments();
      setDocuments(response.items);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setDocuments]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  // Group documents by category
  const documentsByCategory = documents.reduce((acc, doc) => {
    const category = doc.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-surface rounded-2xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Upload Learning Materials
        </h2>

        {/* Category Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium
                  ${selectedCategory === category.id
                    ? 'bg-mint text-background'
                    : 'bg-surface-elevated text-text-secondary border border-white/10 hover:bg-white/10 hover:text-text-primary'
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
            ${isDragActive
              ? 'border-mint bg-mint/10'
              : 'border-white/20 hover:border-mint/50'
            }
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center">
            <div className={`p-4 rounded-full mb-4 ${isDragActive ? 'bg-mint/20' : 'bg-surface-elevated'}`}>
              <svg
                className={`w-10 h-10 ${isDragActive ? 'text-mint' : 'text-text-muted'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            
            {isDragActive ? (
              <p className="text-mint font-medium text-lg">Drop your file here...</p>
            ) : (
              <>
                <p className="text-text-primary mb-2 font-medium">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-sm text-text-muted">
                  Supports PDF, DOCX, TXT, MD, PNG, JPG (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>

        {/* File Rejection Errors */}
        {fileRejections.length > 0 && (
          <div className="mt-4 p-4 bg-coral/10 border border-coral/30 rounded-xl">
            <p className="text-coral text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {fileRejections[0].errors[0].message}
            </p>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="mt-4 p-4 bg-coral/10 border border-coral/30 rounded-xl">
            <p className="text-coral text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {uploadError}
            </p>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary truncate max-w-xs">
                {uploadProgress.fileName}
              </span>
              <span className={`text-sm font-medium ${
                uploadProgress.status === 'error' ? 'text-coral' : 
                uploadProgress.status === 'complete' ? 'text-mint' : 'text-text-secondary'
              }`}>
                {uploadProgress.status === 'uploading' && 'Uploading...'}
                {uploadProgress.status === 'processing' && 'Processing...'}
                {uploadProgress.status === 'complete' && 'Complete!'}
                {uploadProgress.status === 'error' && 'Error'}
              </span>
            </div>
            <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full ${
                  uploadProgress.status === 'error'
                    ? 'bg-coral'
                    : uploadProgress.status === 'complete'
                    ? 'bg-mint'
                    : 'bg-mint'
                }`}
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-surface rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">
            Your Documents
          </h2>
          <button
            onClick={loadDocuments}
            disabled={isLoading}
            className="text-sm text-mint hover:text-mint/80 font-medium transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-surface-elevated inline-block mb-4">
              <svg
                className="w-10 h-10 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-text-secondary font-medium">No documents uploaded yet</p>
            <p className="text-sm text-text-muted mt-1">Upload your study materials to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {CATEGORIES.map((category) => {
              const categoryDocs = documentsByCategory[category.id] || [];
              if (categoryDocs.length === 0) return null;

              return (
                <div key={category.id}>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-mint rounded-full" />
                    {category.label} ({categoryDocs.length})
                  </h3>
                  <div className="space-y-2">
                    {categoryDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-surface-elevated/50 rounded-xl hover:bg-surface-elevated border border-white/5 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-mint/10 text-mint">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{doc.name}</p>
                            <p className="text-sm text-text-muted">
                              {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                              {' · '}
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          className="p-2 text-text-muted hover:text-coral hover:bg-coral/10 rounded-lg opacity-0 group-hover:opacity-100"
                          title="Delete document"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
