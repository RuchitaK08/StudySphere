import React, { useState } from 'react';
import { ResourceCard } from '../components/resources/ResourceCard';
import { EmptyState } from '../components/common/EmptyState';
import { Card } from '../components/common/Card';
import { storageService, formatBytes } from '../services/storageService';
import { useToast } from '../components/layout/Toast';
import type { StudyResource } from '../types';
import {
  UploadCloud,
  Search,
  Filter,
  FolderGit2,
  HardDrive,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

interface ResourcesPageProps {
  resources: StudyResource[];
  onOpenUpload: () => void;
  onDeleteResource: (resource: StudyResource) => Promise<void>;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({
  resources,
  onOpenUpload,
  onDeleteResource
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { showToast } = useToast();

  const categories = ['All', 'Technology', 'Exam prep', 'Creative', 'General'];

  const filtered = resources.filter((res) => {
    const matchesCategory =
      selectedCategory === 'All' || res.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      res.title.toLowerCase().includes(q) ||
      res.name.toLowerCase().includes(q) ||
      (res.description && res.description.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  const totalBytes = resources.reduce((acc, r) => acc + (r.sizeBytes || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Cloud Notes & Study Resources
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Store, view, and exchange syllabus notes, PDFs, and cheatsheets on Firebase Cloud Storage.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-4 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-md shadow-primary-500/25 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Study File</span>
        </button>
      </div>

      {/* Cloud Storage Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Cloud Documents</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {resources.length} files
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Cloud Storage Utilized</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatBytes(totalBytes)}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Storage Security Rules</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Uploader-Only Delete
            </p>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title, subject, or filename..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderGit2 className="w-6 h-6" />}
          title="No study files found"
          description={
            searchQuery
              ? `No documents matched "${searchQuery}". Try a different keyword.`
              : 'No notes uploaded yet. Be the first student to upload revision material!'
          }
          action={{
            label: '+ Upload Study File',
            onClick: onOpenUpload
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onDelete={onDeleteResource}
            />
          ))}
        </div>
      )}
    </div>
  );
};
