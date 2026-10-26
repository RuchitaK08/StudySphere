import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { storageService, formatBytes, MAX_FILE_SIZE_BYTES } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../layout/Toast';
import type { StudyResource } from '../../types';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResourceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (resource: StudyResource) => void;
  roomId?: string | null;
}

export const ResourceUploadModal: React.FC<ResourceUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  roomId = null
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technology');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    const validation = storageService.validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const resource = await storageService.uploadStudyResource({
        file,
        title: title.trim() || file.name,
        category,
        description: description.trim(),
        user,
        roomId,
        onProgress: (percent) => setUploadProgress(percent)
      });

      showToast(`Uploaded "${resource.title}" to Cloud Storage! ✦`, 'success');
      onUploadSuccess(resource);
      onClose();
      // Reset state
      setFile(null);
      setTitle('');
      setDescription('');
      setUploadProgress(0);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Cloud storage upload failed.');
      showToast('Upload failed. Please check file and permissions.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Study Resource to Cloud"
      subtitle="Share PDF notes, lecture slides, or revision guides with students."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag & drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            dragOver
              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30'
              : file
              ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp,.zip"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />

          {file ? (
            <div className="flex items-center justify-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatBytes(file.size)} · Click to change file
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Click to browse or drop your study document here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                PDF, Word, Markdown, Images, or ZIP (Max {formatBytes(MAX_FILE_SIZE_BYTES)})
              </p>
            </div>
          )}
        </div>

        {/* Upload progress bar */}
        {uploading && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              <span>Uploading to Firebase Cloud Storage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary-600 h-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Document metadata inputs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Resource Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Unit 3 Cloud Virtualization Cheatsheet"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Technology">Technology & Computer Science</option>
            <option value="Exam prep">Semester Exam Prep</option>
            <option value="Creative">Creative / Design</option>
            <option value="General">General Reference</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Description (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short overview of what's inside this study file..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !file}
            className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 rounded-xl transition-all shadow-md shadow-primary-500/25 flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{uploading ? 'Uploading...' : 'Save to Cloud ✦'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
