import Sidebar from '@/components/Sidebar';
import FileUploader from '@/components/FileUploader';

/**
 * Upload Page
 * 
 * Document upload and management interface.
 * Users can upload PDFs, DOCX, TXT, MD, and images
 * to build their personal knowledge base.
 */
export default function UploadPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-20 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Upload <span className="text-gradient">Materials</span>
            </h1>
            <p className="text-text-secondary">
              Upload your textbooks, notes, and study materials. 
              Your AI coach will use these to provide personalized learning experiences.
            </p>
          </div>

          {/* File Uploader */}
          <FileUploader />
        </div>
      </main>
    </div>
  );
}
