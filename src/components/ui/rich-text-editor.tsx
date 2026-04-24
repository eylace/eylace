import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { FontFamily } from '@tiptap/extension-font-family';
import { useEffect, useCallback, useState } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
  Undo, Redo, Highlighter, Type, Maximize2, Minimize2,
  Video, ChevronDown, Heading1, Heading2, Heading3,
  Quote, Code, Code2, Minus, SuperscriptIcon, SubscriptIcon,
  Eraser, IndentIncrease, IndentDecrease, Pilcrow,
} from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
  '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
  '#ff0066', '#ff6633', '#ccff00', '#00cccc', '#3366ff', '#cc33ff',
];

const HIGHLIGHT_COLORS = [
  '#ffc078', '#ffd43b', '#a9e34b', '#63e6be', '#74c0fc', '#b197fc',
  '#f783ac', '#ff8787', '#ffffff',
];

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Sans Serif', value: 'ui-sans-serif, system-ui, sans-serif' },
  { label: 'Serif', value: 'ui-serif, Georgia, serif' },
  { label: 'Monospace', value: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
];

const ToolbarBtn = ({
  onClick, active, disabled, children, title,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-2 rounded-md hover:bg-muted transition-colors flex items-center justify-center',
      active && 'bg-primary/10 text-primary',
      disabled && 'opacity-30 cursor-not-allowed'
    )}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-7 bg-border mx-1" />;

export const RichTextEditor = ({ value, onChange, placeholder = 'Write product description...', className }: RichTextEditorProps) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily.configure({ types: ['textStyle'] }),
      Subscript,
      Superscript,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer nofollow' } }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-[160px] px-4 py-3',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setLinkUrl('');
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
  }, [editor, imageUrl]);

  const addVideo = useCallback(() => {
    if (!editor || !videoUrl) return;
    const iframe = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;"><iframe src="${videoUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
    editor.chain().focus().insertContent(iframe).run();
    setVideoUrl('');
  }, [editor, videoUrl]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  const iconSize = "h-5 w-5";
  const boldIconClass = `${iconSize} stroke-[2.5]`;

  return (
    <div className={cn(
      'border-2 border-dashed border-border rounded-lg overflow-hidden bg-background',
      fullscreen && 'fixed inset-4 z-50 flex flex-col shadow-2xl border-solid',
      className,
    )}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/20">
        {/* Headings / Paragraph */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-0.5 min-w-[70px]" title="Paragraph style">
              {editor.isActive('heading', { level: 1 }) ? <Heading1 className={boldIconClass} /> :
               editor.isActive('heading', { level: 2 }) ? <Heading2 className={boldIconClass} /> :
               editor.isActive('heading', { level: 3 }) ? <Heading3 className={boldIconClass} /> :
               <Pilcrow className={boldIconClass} />}
              <ChevronDown className="h-3 w-3 stroke-[2.5]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="start">
            <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={cn('flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm hover:bg-muted', editor.isActive('paragraph') && !editor.isActive('heading') && 'bg-primary/10 text-primary')}>
              <Pilcrow className="h-4 w-4" /> Paragraph
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn('flex items-center gap-2 w-full px-2 py-1.5 rounded text-base font-bold hover:bg-muted', editor.isActive('heading', { level: 1 }) && 'bg-primary/10 text-primary')}>
              <Heading1 className="h-4 w-4" /> Heading 1
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn('flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm font-bold hover:bg-muted', editor.isActive('heading', { level: 2 }) && 'bg-primary/10 text-primary')}>
              <Heading2 className="h-4 w-4" /> Heading 2
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={cn('flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm font-semibold hover:bg-muted', editor.isActive('heading', { level: 3 }) && 'bg-primary/10 text-primary')}>
              <Heading3 className="h-4 w-4" /> Heading 3
            </button>
          </PopoverContent>
        </Popover>

        {/* Font family */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-1 text-xs font-medium max-w-[110px] truncate" title="Font family">
              <span className="truncate">{FONT_FAMILIES.find(f => f.value && editor.getAttributes('textStyle').fontFamily === f.value)?.label || 'Font'}</span>
              <ChevronDown className="h-3 w-3 stroke-[2.5] shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="start">
            {FONT_FAMILIES.map(f => (
              <button key={f.label} type="button" onClick={() => f.value ? editor.chain().focus().setFontFamily(f.value).run() : editor.chain().focus().unsetFontFamily().run()} style={{ fontFamily: f.value || undefined }} className={cn('flex items-center w-full px-2 py-1.5 rounded text-sm hover:bg-muted', editor.getAttributes('textStyle').fontFamily === f.value && 'bg-primary/10 text-primary')}>
                {f.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <Divider />

        {/* Bold / Underline / Italic / Strikethrough */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold className={boldIconClass} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <UnderlineIcon className={boldIconClass} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <Italic className={boldIconClass} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className={boldIconClass} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => (editor.chain().focus() as any).toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
          <SubscriptIcon className={boldIconClass} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => (editor.chain().focus() as any).toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
          <SuperscriptIcon className={boldIconClass} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
          <Eraser className={boldIconClass} />
        </ToolbarBtn>

        <Divider />

        {/* Lists */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className={boldIconClass} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
          <ListOrdered className={boldIconClass} />
        </ToolbarBtn>

        {/* Alignment Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-0.5" title="Text Alignment">
              {editor.isActive({ textAlign: 'center' }) ? <AlignCenter className={boldIconClass} /> :
               editor.isActive({ textAlign: 'right' }) ? <AlignRight className={boldIconClass} /> :
               <AlignLeft className={boldIconClass} />}
              <ChevronDown className="h-3 w-3 stroke-[2.5]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1.5 flex gap-1" align="start">
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Left">
              <AlignLeft className={boldIconClass} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">
              <AlignCenter className={boldIconClass} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Right">
              <AlignRight className={boldIconClass} />
            </ToolbarBtn>
          </PopoverContent>
        </Popover>

        <Divider />

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className={cn('p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-0.5', editor.isActive('highlight') && 'bg-primary/10 text-primary')} title="Highlight">
              <Highlighter className={boldIconClass} />
              <ChevronDown className="h-3 w-3 stroke-[2.5]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-3 gap-1.5">
              {HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                  className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()} className="mt-2 text-xs text-muted-foreground hover:text-foreground w-full text-left">
              Remove highlight
            </button>
          </PopoverContent>
        </Popover>

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-0.5" title="Text Color">
              <span className="relative">
                <Type className={boldIconClass} />
                <span className="absolute -bottom-0.5 left-0 right-0 h-1 rounded" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000' }} />
              </span>
              <ChevronDown className="h-3 w-3 stroke-[2.5]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-6 gap-1.5">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button type="button" onClick={() => editor.chain().focus().unsetColor().run()} className="mt-2 text-xs text-muted-foreground hover:text-foreground">
              Reset color
            </button>
          </PopoverContent>
        </Popover>

        {/* Table Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-0.5" title="Table">
              <TableIcon className={boldIconClass} />
              <ChevronDown className="h-3 w-3 stroke-[2.5]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 space-y-1.5" align="start">
            <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-sm font-semibold" onClick={insertTable}>
              Insert 3×3 Table
            </Button>
            {editor.isActive('table') && (
              <>
                <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => editor.chain().focus().addColumnAfter().run()}>Add Column</Button>
                <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => editor.chain().focus().addRowAfter().run()}>Add Row</Button>
                <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-sm text-destructive" onClick={() => editor.chain().focus().deleteTable().run()}>Delete Table</Button>
              </>
            )}
          </PopoverContent>
        </Popover>

        <Divider />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className={cn('p-2 rounded-md hover:bg-muted transition-colors', editor.isActive('link') && 'bg-primary/10 text-primary')} title="Insert Link">
              <LinkIcon className={boldIconClass} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="flex gap-2">
              <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="h-8 text-sm" />
              <Button type="button" size="sm" className="h-8 font-semibold" onClick={addLink}>Add</Button>
            </div>
            {editor.isActive('link') && (
              <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className="mt-2 text-xs text-destructive hover:underline">
                Remove link
              </button>
            )}
          </PopoverContent>
        </Popover>

        {/* Image */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-2 rounded-md hover:bg-muted transition-colors" title="Insert Image">
              <ImageIcon className={boldIconClass} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="flex gap-2">
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL..." className="h-8 text-sm" />
              <Button type="button" size="sm" className="h-8 font-semibold" onClick={addImage}>Add</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Video Embed */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-2 rounded-md hover:bg-muted transition-colors" title="Embed Video">
              <Video className={boldIconClass} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <p className="text-xs text-muted-foreground mb-2 font-medium">YouTube / Vimeo embed URL</p>
            <div className="flex gap-2">
              <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." className="h-8 text-sm" />
              <Button type="button" size="sm" className="h-8 font-semibold" onClick={addVideo}>Add</Button>
            </div>
          </PopoverContent>
        </Popover>

        <Divider />

        {/* Fullscreen */}
        <ToolbarBtn onClick={() => setFullscreen(f => !f)} title="Fullscreen">
          {fullscreen ? <Minimize2 className={boldIconClass} /> : <Maximize2 className={boldIconClass} />}
        </ToolbarBtn>

        {/* Undo / Redo */}
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className={boldIconClass} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className={boldIconClass} />
        </ToolbarBtn>
      </div>

      {/* Editor Area */}
      <div className={cn('overflow-y-auto', fullscreen ? 'flex-1' : 'max-h-[400px]')}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
