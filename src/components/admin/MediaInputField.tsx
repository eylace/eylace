import { useState } from 'react';
import { ImageIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MediaManagerModal } from './MediaManagerModal';
import type { MediaKind } from './media-manager/types';

interface MediaInputFieldProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  acceptedKinds?: MediaKind[];
  uploadFolder?: string;
  showPreview?: boolean;
  previewClassName?: string;
  inputId?: string;
  buttonLabel?: string;
}

/**
 * Reusable URL input with a "Browse" button that opens the Media Manager
 * (library + upload). Lets admins pick existing files or upload new ones.
 */
export function MediaInputField({
  value,
  onChange,
  placeholder = 'https://... or pick from library',
  acceptedKinds = ['image'],
  uploadFolder = 'uploads',
  showPreview = true,
  previewClassName = 'h-12 w-12 rounded-md object-cover border border-border bg-muted',
  inputId,
  buttonLabel = 'Browse',
}: MediaInputFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => setOpen(true)}
          className="gap-1.5 shrink-0"
        >
          <ImageIcon className="h-4 w-4" />
          {buttonLabel}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange('')}
            title="Clear"
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showPreview && value && (
        <img
          src={value}
          alt="Preview"
          className={previewClassName}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      )}

      <MediaManagerModal
        open={open}
        onOpenChange={setOpen}
        multiple={false}
        acceptedKinds={acceptedKinds}
        uploadFolder={uploadFolder}
        onSelect={(urls) => {
          if (urls[0]) onChange(urls[0]);
        }}
      />
    </div>
  );
}