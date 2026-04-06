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
import { useEffect, useCallback, useState } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
  Undo, Redo, Highlighter, Type, Maximize2, Minimize2,
  Heading1, Heading2, Heading3, Code, Quote, Minus,
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

const ToolbarButton = ({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-1.5 rounded hover:bg-muted transition-colors',
      active && 'bg-muted text-primary',
      disabled && 'opacity-40 cursor-not-allowed'
    )}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-6 bg-border mx-0.5" />;

export const RichTextEditor = ({ value, onChange, placeholder = 'Write product description...', className }: RichTextEditorProps) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
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
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-[120px] px-3 py-2',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
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

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  const Toolbar = () => (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border bg-muted/30">
      {/* Text style */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Color */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="p-1.5 rounded hover:bg-muted transition-colors" title="Text Color">
            <Type className="h-4 w-4" style={{ color: editor.getAttributes('textStyle').color || 'currentColor' }} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="grid grid-cols-6 gap-1">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => editor.chain().focus().setColor(color).run()}
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button type="button" onClick={() => editor.chain().focus().unsetColor().run()} className="mt-2 text-xs text-muted-foreground hover:text-foreground">
            Reset color
          </button>
        </PopoverContent>
      </Popover>

      {/* Highlight */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffc078' }).run()} active={editor.isActive('highlight')} title="Highlight">
        <Highlighter className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Link */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={cn('p-1.5 rounded hover:bg-muted transition-colors', editor.isActive('link') && 'bg-muted text-primary')} title="Link">
            <LinkIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="flex gap-2">
            <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="h-8 text-sm" />
            <Button type="button" size="sm" className="h-8" onClick={addLink}>Add</Button>
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
          <button type="button" className="p-1.5 rounded hover:bg-muted transition-colors" title="Insert Image">
            <ImageIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="flex gap-2">
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL..." className="h-8 text-sm" />
            <Button type="button" size="sm" className="h-8" onClick={addImage}>Add</Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Table */}
      <ToolbarButton onClick={insertTable} title="Insert Table">
        <TableIcon className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Blockquote & Code & HR */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Fullscreen */}
      <ToolbarButton onClick={() => setFullscreen(f => !f)} title="Fullscreen">
        {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </ToolbarButton>

      <Divider />

      {/* Undo/Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );

  return (
    <div className={cn(
      'border border-border rounded-lg overflow-hidden bg-background',
      fullscreen && 'fixed inset-4 z-50 flex flex-col shadow-2xl',
      className,
    )}>
      <Toolbar />
      <div className={cn('overflow-y-auto', fullscreen ? 'flex-1' : 'max-h-[400px]')}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
