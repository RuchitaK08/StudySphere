import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { FileText, Download, Trash2, Eye, User, Calendar, ExternalLink } from 'lucide-react';
import type { StudyResource } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../layout/Toast';

interface ResourceCardProps {
  resource: StudyResource;
  onDelete: (resource: StudyResource) => Promise<void>;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onDelete }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const isOwner = user?.uid === resource.uploaderId || user?.isDemo;

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${resource.title}" from Cloud Storage?`)) {
      return;
    }
    setDeleting(true);
    try {
      await onDelete(resource);
      showToast('Study resource deleted successfully.', 'info');
    } catch {
      showToast('Could not delete resource. Check permissions.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getFileIconColor = () => {
    if (resource.name.endsWith('.pdf')) return 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900';
    if (resource.name.endsWith('.doc') || resource.name.endsWith('.docx')) return 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900';
    if (resource.name.endsWith('.zip')) return 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900';
    return 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-900';
  };

  const formattedDate = new Date(resource.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <>
      <Card hoverable className="flex flex-col justify-between transition-all">
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${getFileIconColor()}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="purple" size="sm">
                {resource.category || 'Notes'}
              </Badge>
              <span className="text-[11px] font-mono text-slate-400">
                {resource.formattedSize}
              </span>
            </div>
          </div>

          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mb-1" title={resource.title}>
            {resource.title}
          </h4>

          <p className="text-[11px] text-slate-400 line-clamp-1 font-mono mb-2">
            {resource.name}
          </p>

          {resource.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
              {resource.description}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate mr-2">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{resource.uploaderName}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Preview button */}
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Preview details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Download link */}
            <a
              href={resource.downloadURL}
              target="_blank"
              rel="noopener noreferrer"
              download={resource.name}
              className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Delete button (if authorized) */}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={resource.title}
        subtitle={`Uploaded by ${resource.uploaderName} on ${formattedDate}`}
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-slate-400">File Name:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{resource.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-slate-400">Size:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{resource.formattedSize}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-slate-400">MIME Type:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{resource.mimeType}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Cloud Storage Bucket Path:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{resource.storagePath}</span>
            </div>
          </div>

          {resource.description && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Description:
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {resource.description}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2.5 mt-2">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Close
            </button>
            <a
              href={resource.downloadURL}
              target="_blank"
              rel="noopener noreferrer"
              download={resource.name}
              className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-md shadow-primary-500/25 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
};
