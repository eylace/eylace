import { useRef } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAcceptedKindsLabel, getFileAcceptValue } from './media-utils';
import type { MediaKind } from './types';

interface MediaUploadPanelProps {
  acceptedKinds: MediaKind[];
  dragOver: boolean;
  multiple: boolean;
  onDragLeave: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onFilesChosen: (files: FileList) => void;
  uploading: boolean;
}

export function MediaUploadPanel({
  acceptedKinds,
  dragOver,
  multiple,
  onDragLeave,
  onDragOver,
  onDrop,
  onFilesChosen,
  uploading,
}: MediaUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileAccept = getFileAcceptValue(acceptedKinds);
  const acceptedLabel = getAcceptedKindsLabel(acceptedKinds);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Upload Media</h3>
          <p className="text-sm text-muted-foreground">
            Upload {acceptedLabel} here and they will instantly appear in your library.
          </p>
        </div>

        <>
          <input
            ref={inputRef}
            type="file"
            accept={fileAccept}
            multiple={multiple}
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) onFilesChosen(event.target.files);
              event.target.value = '';
            }}
          />
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="gap-2 self-start sm:self-auto">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
        </>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
        }`}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
        </div>
        <p className="text-lg font-semibold text-foreground">Upload Files</p>
        <p className="mt-1 text-sm text-muted-foreground">Drag and drop or click to browse</p>
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-5 gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Browse Files
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Supported: {acceptedLabel}. {multiple ? 'You can upload multiple files at once.' : 'Select one file at a time.'}
        </p>
      </div>
    </div>
  );
}