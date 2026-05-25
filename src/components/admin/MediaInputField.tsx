import { useState } from 'react';
import { ImageIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
  /** Max file size in bytes. Checked via HEAD Content-Length when available. */
  maxSizeBytes?: number;
  /** Max image width in pixels. */
  maxWidth?: number;
  /** Max image height in pixels. */
  maxHeight?: number;
  /** Min image width in pixels. */
  minWidth?: number;
  /** Min image height in pixels. */
  minHeight?: number;
}

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

async function validateAsset(
  url: string,
  opts: { maxSizeBytes?: number; maxWidth?: number; maxHeight?: number; minWidth?: number; minHeight?: number },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  // Size check via HEAD (best-effort; skip on CORS / missing header)
  if (opts.maxSizeBytes) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const len = Number(res.headers.get('content-length') || 0);
      if (len && len > opts.maxSizeBytes) {
        return {
          ok: false,
          reason: `File is too large (${formatBytes(len)}). Max ${formatBytes(opts.maxSizeBytes)}.`,
        };
      }
    } catch {
      /* ignore */
    }
  }

  // Dimension check via Image load
  if (opts.maxWidth || opts.maxHeight || opts.minWidth || opts.minHeight) {
    const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = url;
    });
    if (!dims) return { ok: false, reason: 'Could not load image to validate dimensions.' };
    if (opts.maxWidth && dims.w > opts.maxWidth) return { ok: false, reason: `Width ${dims.w}px exceeds max ${opts.maxWidth}px.` };
    if (opts.maxHeight && dims.h > opts.maxHeight) return { ok: false, reason: `Height ${dims.h}px exceeds max ${opts.maxHeight}px.` };
    if (opts.minWidth && dims.w < opts.minWidth) return { ok: false, reason: `Width ${dims.w}px is below min ${opts.minWidth}px.` };
    if (opts.minHeight && dims.h < opts.minHeight) return { ok: false, reason: `Height ${dims.h}px is below min ${opts.minHeight}px.` };
  }

  return { ok: true };
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
  maxSizeBytes,
  maxWidth,
  maxHeight,
  minWidth,
  minHeight,
}: MediaInputFieldProps) {
  const [open, setOpen] = useState(false);
  const [validating, setValidating] = useState(false);

  const hasValidation = Boolean(maxSizeBytes || maxWidth || maxHeight || minWidth || minHeight);

  const applyWithValidation = async (url: string) => {
    if (!url || !hasValidation || !acceptedKinds.includes('image')) {
      onChange(url);
      return;
    }
    onChange(url);
    setValidating(true);
    const result = await validateAsset(url, { maxSizeBytes, maxWidth, maxHeight, minWidth, minHeight });
    setValidating(false);
    if (!result.ok) {
      toast.error(result.reason);
      onChange('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            if (hasValidation && e.target.value && e.target.value !== '') {
              void applyWithValidation(e.target.value);
            }
          }}
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
          if (urls[0]) void applyWithValidation(urls[0]);
        }}
      />
      {validating && (
        <p className="text-xs text-muted-foreground">Validating file…</p>
      )}
    </div>
  );
}