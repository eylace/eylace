import { Check, Copy, Eye, FileText, Image as ImageIcon, MoreVertical, Trash2, Video } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatSize } from './media-utils';
import type { MediaFile } from './types';

interface MediaLibraryGridProps {
  files: MediaFile[];
  multiple: boolean;
  selectedPaths: string[];
  onCopyLink: (file: MediaFile) => void;
  onDelete: (file: MediaFile) => void;
  onToggleSelect: (path: string) => void;
  onView: (file: MediaFile) => void;
}

const renderPreview = (file: MediaFile) => {
  if (file.kind === 'image') {
    return <img src={file.url} alt={file.name} className="h-full w-full object-cover" loading="lazy" />;
  }

  if (file.kind === 'video') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <Video className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
      <FileText className="h-8 w-8" />
    </div>
  );
};

export function MediaLibraryGrid({
  files,
  multiple,
  selectedPaths,
  onCopyLink,
  onDelete,
  onToggleSelect,
  onView,
}: MediaLibraryGridProps) {
  if (!files.length) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
        <div>
          <ImageIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No media found</p>
          <p className="mt-1 text-xs text-muted-foreground">Upload new files or change the search to see more results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {files.map((file) => {
        const isSelected = selectedPaths.includes(file.path);

        return (
          <button
            key={file.path}
            type="button"
            onClick={() => onToggleSelect(file.path)}
            className={`group relative aspect-square overflow-hidden rounded-xl border text-left transition-all ${
              isSelected
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-accent'
            }`}
          >
            {renderPreview(file)}

            {isSelected && (
              <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}

            {multiple && !isSelected && (
              <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-1 text-[10px] font-medium text-foreground shadow-sm">
                Select
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Manage ${file.name}`}
                  onClick={(event) => event.stopPropagation()}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-opacity group-hover:opacity-100 sm:opacity-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    onView(file);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    onCopyLink(file);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(file);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </button>
        );
      })}
    </div>
  );
}