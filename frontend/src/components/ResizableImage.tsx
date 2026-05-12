import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useRef, useState, useCallback } from 'react';

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
  const showHandles = selected || isResizing;

  return (
    <NodeViewWrapper
      style={{
        display: 'inline-block',
        position: 'relative',
        maxWidth: '100%',
        lineHeight: 0,
      }}
    >
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
          {/* Corner handles */}
          {[
            { bottom: -5, right: -5, cursor: 'se-resize' },
            { bottom: -5, left: -5, cursor: 'sw-resize' },
          ].map((pos, i) => (
            <div
              key={i}
              onMouseDown={onMouseDown}
              style={{
                position: 'absolute',
                width: 12,
                height: 12,
                background: 'var(--accent)',
                border: '2px solid #fff',
                borderRadius: 2,
                ...pos,
                cursor: pos.cursor,
                zIndex: 10,
              }}
            />
          ))}
          {/* Width label */}
          {width && (
            <div style={{
              position: 'absolute',
              top: 6,
              left: 6,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              fontSize: '0.65rem',
              padding: '2px 5px',
              borderRadius: 3,
              pointerEvents: 'none',
              fontFamily: 'var(--font-mono)',
            }}>
              {width}px
            </div>
          )}
        </>
      )}
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
      src: { default: null },
      alt: { default: null },
      width: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { width, ...rest } = HTMLAttributes;
    return ['img', mergeAttributes(rest, width ? { style: `width:${width}px;max-width:100%` } : { style: 'max-width:100%' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;
