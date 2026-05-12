import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useRef, useState, useCallback } from 'react';

const ALIGN_STYLES: Record<string, React.CSSProperties> = {
  left:   { display: 'block', marginRight: 'auto', marginLeft: 0 },
  center: { display: 'block', marginLeft: 'auto', marginRight: 'auto' },
  right:  { display: 'block', marginLeft: 'auto', marginRight: 0 },
};

function AlignBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{
        padding: '3px 8px', fontSize: '0.7rem', fontWeight: 600,
        background: active ? 'var(--accent)' : 'var(--bg-2)',
        color: active ? '#000' : 'var(--text-2)',
        border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function ResizableImageView({ node, updateAttributes, selected }: any) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startWidth.current = imgRef.current?.offsetWidth || (node.attrs.width as number) || 400;
    setIsResizing(true);

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current;
      const newWidth = Math.max(80, Math.min(startWidth.current + delta, 1200));
      updateAttributes({ width: newWidth });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [node.attrs.width, updateAttributes]);

  const width = node.attrs.width;
  const align: string = node.attrs.align || 'left';
  const showHandles = selected || isResizing;

  const wrapperAlign: React.CSSProperties =
    align === 'center' ? { display: 'flex', justifyContent: 'center' } :
    align === 'right'  ? { display: 'flex', justifyContent: 'flex-end' } :
    { display: 'block' };

  return (
    <NodeViewWrapper style={{ ...wrapperAlign, position: 'relative', maxWidth: '100%', lineHeight: 0, marginBottom: 8 }}>
      <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          style={{
            width: width ? `${width}px` : '100%',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: 6,
            display: 'block',
            outline: showHandles ? '2px solid var(--accent)' : 'none',
            userSelect: 'none',
            cursor: 'default',
          }}
          draggable={false}
        />

        {showHandles && (
          <>
            {/* Alignment toolbar */}
            <div style={{
              position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 4, padding: '4px 6px',
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 20,
              whiteSpace: 'nowrap',
            }}>
              <AlignBtn label="◀ ซ้าย" active={align === 'left'} onClick={() => updateAttributes({ align: 'left' })} />
              <AlignBtn label="■ กลาง" active={align === 'center'} onClick={() => updateAttributes({ align: 'center' })} />
              <AlignBtn label="ขวา ▶" active={align === 'right'} onClick={() => updateAttributes({ align: 'right' })} />
            </div>

            {/* Resize handles */}
            {[
              { bottom: -5, right: -5, cursor: 'se-resize' },
              { bottom: -5, left: -5, cursor: 'sw-resize' },
            ].map((pos, i) => (
              <div
                key={i}
                onMouseDown={onMouseDown}
                style={{
                  position: 'absolute', width: 12, height: 12,
                  background: 'var(--accent)', border: '2px solid #fff',
                  borderRadius: 2, ...pos, cursor: pos.cursor, zIndex: 10,
                }}
              />
            ))}

            {/* Width label */}
            {width && (
              <div style={{
                position: 'absolute', top: 6, left: 6,
                background: 'rgba(0,0,0,0.6)', color: '#fff',
                fontSize: '0.65rem', padding: '2px 5px', borderRadius: 3,
                pointerEvents: 'none', fontFamily: 'var(--font-mono)',
              }}>
                {width}px
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

const ResizableImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src:   { default: null },
      alt:   { default: null },
      width: { default: null },
      align: { default: 'left' },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { width, align, ...rest } = HTMLAttributes;
    const alignStyle =
      align === 'center' ? 'display:block;margin-left:auto;margin-right:auto;' :
      align === 'right'  ? 'display:block;margin-left:auto;margin-right:0;' :
      'display:block;';
    const sizeStyle = width ? `width:${width}px;max-width:100%;` : 'max-width:100%;';
    return ['img', mergeAttributes(rest, { style: alignStyle + sizeStyle })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;
