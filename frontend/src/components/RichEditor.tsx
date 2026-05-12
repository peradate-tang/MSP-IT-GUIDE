import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
  Image as ImageIcon, ImagePlus, Loader2, Minus, Undo, Redo,
} from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  uploading?: boolean;
  uploadingVideo?: boolean;
  onImageUpload?: () => void;
  onVideoUpload?: () => void;
  onImageUrl?: () => void;
  onVideoUrl?: () => void;
}

export default function RichEditor({
  content, onChange, placeholder,
  uploading, uploadingVideo,
  onImageUpload, onVideoUpload, onImageUrl, onVideoUrl,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Youtube.configure({ width: 640, height: 400 }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder || 'เขียนเนื้อหาที่นี่...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content]);

  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt('URL ลิงก์:');
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px',
        background: 'var(--bg-3)', borderBottom: '1px solid var(--border)',
      }}>
        <TB onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={13} /></TB>
        <TB onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={13} /></TB>
        <Sep />
        <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="ตัวหนา"><Bold size={13} /></TB>
        <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="ตัวเอียง"><Italic size={13} /></TB>
        <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="ขีดเส้นใต้"><UnderlineIcon size={13} /></TB>
        <TB onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="ขีดฆ่า"><Strikethrough size={13} /></TB>
        <TB onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code"><Code size={13} /></TB>
        <Sep />
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="หัวข้อ 1"><Heading1 size={13} /></TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="หัวข้อ 2"><Heading2 size={13} /></TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="หัวข้อ 3"><Heading3 size={13} /></TB>
        <Sep />
        <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="รายการ"><List size={13} /></TB>
        <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="รายการตัวเลข"><ListOrdered size={13} /></TB>
        <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="เส้นคั่น"><Minus size={13} /></TB>
        <Sep />
        <TB onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="ชิดซ้าย"><AlignLeft size={13} /></TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="กึ่งกลาง"><AlignCenter size={13} /></TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="ชิดขวา"><AlignRight size={13} /></TB>
        <Sep />
        <TB onClick={setLink} active={editor.isActive('link')} title="แทรกลิงก์"><LinkIcon size={13} /></TB>
        <TB onClick={onImageUrl} title="แทรกรูปจาก URL"><ImageIcon size={13} /></TB>
        <TB onClick={onImageUpload} disabled={uploading} title="อัพโหลดรูปภาพ">
          {uploading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <ImagePlus size={13} />}
        </TB>
        <TB onClick={onVideoUrl} title="แทรก YouTube / วิดีโอ URL">
          <span style={{ fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>VDO</span>
        </TB>
        <TB onClick={onVideoUpload} disabled={uploadingVideo} title="อัพโหลดวิดีโอจากเครื่อง">
          {uploadingVideo
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <span style={{ fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>↑VDO</span>
          }
        </TB>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} style={{ minHeight: 480, padding: '16px', cursor: 'text' }} />

      <style>{`
        .rich-editor-content { outline: none; min-height: 480px; font-size: 0.9rem; line-height: 1.7; color: var(--text); }
        .rich-editor-content p { margin: 0 0 0.75em; }
        .rich-editor-content h1 { font-size: 1.6rem; font-weight: 700; margin: 1em 0 0.5em; }
        .rich-editor-content h2 { font-size: 1.3rem; font-weight: 700; margin: 1em 0 0.5em; }
        .rich-editor-content h3 { font-size: 1.1rem; font-weight: 600; margin: 1em 0 0.5em; }
        .rich-editor-content ul, .rich-editor-content ol { padding-left: 1.5em; margin: 0.5em 0; }
        .rich-editor-content li { margin: 0.25em 0; }
        .rich-editor-content code { background: var(--bg-3); padding: 2px 5px; border-radius: 3px; font-family: var(--font-mono); font-size: 0.85em; }
        .rich-editor-content pre { background: var(--bg-3); padding: 12px; border-radius: var(--radius); overflow-x: auto; margin: 1em 0; }
        .rich-editor-content pre code { background: none; padding: 0; }
        .rich-editor-content blockquote { border-left: 3px solid var(--accent); margin: 1em 0; padding-left: 1em; color: var(--text-2); }
        .rich-editor-content hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
        .rich-editor-content img { max-width: 100%; height: auto; border-radius: var(--radius); margin: 0.5em 0; display: block; }
        .rich-editor-content video { max-width: 100%; height: auto; border-radius: var(--radius); margin: 0.5em 0; display: block; }
        .rich-editor-content iframe { max-width: 100%; border-radius: var(--radius); margin: 0.5em 0; display: block; }
        .rich-editor-content a { color: var(--accent); }
        .rich-editor-content p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: var(--text-3); pointer-events: none; float: left; height: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function TB({ onClick, title, active, disabled, children }: {
  onClick?: () => void; title?: string; active?: boolean; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: active ? 'var(--accent-dim)' : 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '5px 7px',
        borderRadius: 4,
        color: active ? 'var(--accent)' : 'var(--text-2)',
        display: 'flex',
        alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!disabled && !active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = active ? 'var(--accent-dim)' : 'none'; }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 3px', alignSelf: 'center' }} />;
}
