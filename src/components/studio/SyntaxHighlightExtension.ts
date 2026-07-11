import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Node as ProsemirrorNode } from '@tiptap/pm/model';

const findDecorations = (doc: ProsemirrorNode) => {
  const decorations: Decoration[] = [];
  
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    
    const text = node.text || '';
    
    // Highlight {{if ...}}, {{else}}, {{endif}}
    const blockRegex = /\{\{[^}]+\}\}/g;
    let match;
    while ((match = blockRegex.exec(text)) !== null) {
      decorations.push(
        Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
          class: 'syntax-block',
        })
      );
    }
    
    // Highlight [Variable] (Negative lookbehind to ignore #[Tag])
    const varRegex = /(?<!#)\[[^\]]+\]/g;
    while ((match = varRegex.exec(text)) !== null) {
      decorations.push(
        Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
          class: 'syntax-variable',
        })
      );
    }
    
    // Highlight #[Tag]
    const tagRegex = /#\[[^\]]+\]/g;
    while ((match = tagRegex.exec(text)) !== null) {
      decorations.push(
        Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
          class: 'syntax-tag',
        })
      );
    }
  });
  
  return DecorationSet.create(doc, decorations);
};

export const SyntaxHighlight = Extension.create({
  name: 'syntaxHighlight',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('syntaxHighlight'),
        state: {
          init(_, { doc }) {
            return findDecorations(doc);
          },
          apply(tr, old) {
            // Update decorations when document changes
            return findDecorations(tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
