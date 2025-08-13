'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import { useCallback, useEffect, useState } from 'react'
import './RichTextEditor.css'

// Custom Code Block Extension with Language Selection
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React from 'react'

// Syntax highlighting function
const syntaxHighlight = (code: string, language: string = 'javascript'): string => {
  const patterns: { [key: string]: Array<{ regex: RegExp; className: string }> } = {
    javascript: [
      { regex: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|as|default|async|await|try|catch|finally|throw|new|this|super|extends|implements|interface|type)\b/g, className: 'keyword' },
      { regex: /\b(true|false|null|undefined|Infinity|NaN)\b/g, className: 'boolean' },
      { regex: /\b\d+(\.\d+)?\b/g, className: 'number' },
      { regex: /(["'`])(?:(?!(\\|\\1))[^\\]|\\.)*/g, className: 'string' },
      { regex: /\/\/.*$/gm, className: 'comment' },
      { regex: /\/\*[\s\S]*?\*\//g, className: 'comment' },
      { regex: /\b[A-Z][a-zA-Z0-9]*\b/g, className: 'class-name' },
    ],
    typescript: [
      { regex: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|as|default|async|await|try|catch|finally|throw|new|this|super|extends|implements|interface|type|enum|namespace|declare|readonly|private|public|protected|static)\b/g, className: 'keyword' },
      { regex: /\b(string|number|boolean|object|any|void|never|unknown)\b/g, className: 'type' },
      { regex: /\b(true|false|null|undefined|Infinity|NaN)\b/g, className: 'boolean' },
      { regex: /\b\d+(\.\d+)?\b/g, className: 'number' },
      { regex: /(["'`])(?:(?!(\\|\\1))[^\\]|\\.)*/g, className: 'string' },
      { regex: /\/\/.*$/gm, className: 'comment' },
      { regex: /\/\*[\s\S]*?\*\//g, className: 'comment' },
    ],
    sql: [
      { regex: /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|DATABASE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|ORDER|BY|HAVING|LIMIT|OFFSET|UNION|AND|OR|NOT|NULL|IS|AS|DISTINCT|COUNT|SUM|AVG|MIN|MAX)\b/gi, className: 'keyword' },
      { regex: /\b(VARCHAR|INT|INTEGER|BIGINT|SMALLINT|DECIMAL|FLOAT|DOUBLE|BOOLEAN|DATE|TIME|TIMESTAMP|TEXT|BLOB|JSON|JSONB|UUID)\b/gi, className: 'type' },
      { regex: /\b\d+(\.\d+)?\b/g, className: 'number' },
      { regex: /(["'])(?:(?!(\\|\\1))[^\\]|\\.)*/g, className: 'string' },
      { regex: /--.*$/gm, className: 'comment' },
      { regex: /\/\*[\s\S]*?\*\//g, className: 'comment' },
    ],
    css: [
      { regex: /\b(color|background|border|margin|padding|width|height|font|display|position|top|left|right|bottom|z-index|opacity|transform|transition|animation)\b/g, className: 'property' },
      { regex: /#[0-9a-fA-F]{3,6}\b/g, className: 'color' },
      { regex: /\b\d+(\.\d+)?(px|em|rem|%|vh|vw|pt|pc|in|cm|mm)\b/g, className: 'number' },
      { regex: /(["'])(?:(?!(\\|\\1))[^\\]|\\.)*/g, className: 'string' },
      { regex: /\/\*[\s\S]*?\*\//g, className: 'comment' },
      { regex: /[.#][a-zA-Z][\w-]*/g, className: 'selector' },
    ],
    html: [
      { regex: /(<\/?)([a-zA-Z][a-zA-Z0-9]*)(.*?)(\/?>)/g, className: 'tag' },
      { regex: /\s([a-zA-Z-]+)(=)(["'])([^"']*)\3/g, className: 'attr' },
      { regex: /<!--[\s\S]*?-->/g, className: 'comment' },
    ],
    json: [
      { regex: /"([^"\\\\]|\\\\.)*"/g, className: 'string' },
      { regex: /\b\d+(\.\d+)?\b/g, className: 'number' },
      { regex: /\b(true|false|null)\b/g, className: 'boolean' },
      { regex: /[{}[\],]/g, className: 'punctuation' },
    ]
  };

  let highlightedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const languagePatterns = patterns[language] || patterns.javascript;

  languagePatterns.forEach(({ regex, className }) => {
    highlightedCode = highlightedCode.replace(regex, (match) => {
      return `<span class="hl-${className}">${match}</span>`;
    });
  });

  return highlightedCode;
};

// React Component for Code Block
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CodeBlockComponent = ({ node, updateAttributes }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(node.attrs.code || '');
  const [language, setLanguage] = useState(node.attrs.language || 'javascript');

  const languages = [
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'typescript', label: 'TypeScript', icon: '🔷' },
    { value: 'sql', label: 'SQL', icon: '🗃️' },
    { value: 'css', label: 'CSS', icon: '🎨' },
    { value: 'html', label: 'HTML', icon: '🌐' },
    { value: 'json', label: 'JSON', icon: '📋' },
    { value: 'bash', label: 'Bash', icon: '💻' },
    { value: 'python', label: 'Python', icon: '🐍' },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  const saveCode = () => {
    updateAttributes({ code, language });
    setIsEditing(false);
  };

  useEffect(() => {
    setCode(node.attrs.code || '');
    setLanguage(node.attrs.language || 'javascript');
  }, [node.attrs.code, node.attrs.language]);

  return (
    <NodeViewWrapper>
      <div className={`code-block-container my-4 border border-gray-300 rounded-lg overflow-hidden shadow-sm`}>
        {/* Header */}
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                updateAttributes({ language: e.target.value });
              }}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.icon} {lang.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-300">
              {code.split('\n').length} sətir
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isEditing) {
                  saveCode();
                } else {
                  setIsEditing(true);
                }
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
            >
              {isEditing ? '💾 Yadda saxla' : '✏️ Redaktə et'}
            </button>
            <button
              onClick={copyToClipboard}
              className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded"
            >
              📋 Kopyala
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="bg-gray-900 text-gray-100 relative">
          {isEditing ? (
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onBlur={saveCode}
              className="w-full bg-gray-900 text-gray-100 p-4 font-mono text-sm resize-none border-none outline-none"
              style={{ minHeight: '200px' }}
              placeholder="Kod daxil edin..."
              autoFocus
            />
          ) : (
            <div className="p-4 overflow-x-auto">
              <pre className="font-mono text-sm leading-relaxed">
                <code
                  dangerouslySetInnerHTML={{
                    __html: syntaxHighlight(code, language)
                  }}
                />
              </pre>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// Custom Code Block Extension
const CustomCodeBlock = Node.create({
  name: 'customCodeBlock',
  
  group: 'block',
  
  code: true,
  
  addAttributes() {
    return {
      language: {
        default: 'javascript',
      },
      code: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="code-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'code-block' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCodeBlock: (attributes: any) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
});

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [isClient, setIsClient] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'rich-text-heading',
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: 'rich-text-paragraph',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'rich-text-bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'rich-text-ordered-list',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'rich-text-list-item',
          },
        },
        bold: {
          HTMLAttributes: {
            class: 'rich-text-bold',
          },
        },
        italic: {
          HTMLAttributes: {
            class: 'rich-text-italic',
          },
        },
        strike: {
          HTMLAttributes: {
            class: 'rich-text-strike',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md',
        },
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'rich-text-highlight',
        },
      }),
      CustomCodeBlock,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'rich-text-content focus:outline-none min-h-[300px] p-4 text-gray-900',
      },
    },
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '')
    }
  }, [content, editor])

  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('URL:', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Şəkil URL-i:')
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addCodeBlock = useCallback(() => {
    editor?.chain().focus().insertContent({
      type: 'customCodeBlock',
      attrs: { language: 'javascript', code: '// Kod yazın...' }
    }).run()
  }, [editor])

  if (!isClient) {
    return <div className="min-h-[300px] border rounded-lg bg-gray-50" />
  }

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('bold')
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          <strong>B</strong>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('italic')
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          <em>I</em>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('strike')
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          <s>S</s>
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          H1
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          H2
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          H3
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('bulletList')
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          • List
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('orderedList')
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          1. List
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        <button
          onClick={addLink}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('link')
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          🔗 Link
        </button>

        <button
          onClick={addImage}
          className="px-3 py-1 rounded text-sm font-medium bg-white hover:bg-gray-100 text-gray-700"
        >
          🖼️ Şəkil
        </button>

        <button
          onClick={addCodeBlock}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('customCodeBlock')
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          💻 Kod
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('highlight')
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          🟡 Highlight
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="px-3 py-1 rounded text-sm font-medium bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50"
        >
          ↶ Geri
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="px-3 py-1 rounded text-sm font-medium bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50"
        >
          ↷ İrəli
        </button>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
