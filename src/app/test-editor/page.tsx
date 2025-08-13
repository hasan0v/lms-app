'use client'

import { useState } from 'react'
import RichTextEditor from '@/components/RichTextEditor'

export default function TestEditorPage() {
  const [content, setContent] = useState(`
    <h1>Rich Text Editor Test</h1>
    <p>Bu səhifə yenilənmiş <strong>Rich Text Editor</strong> komponentini test etmək üçündür.</p>
    
    <h2>Xüsusiyyətlər:</h2>
    <ul>
      <li>📝 <strong>Sadə mətn redaktəsi</strong> - Bold, Italic, Strikethrough</li>
      <li>🔗 <strong>Linklərin əlavə edilməsi</strong></li>
      <li>🖼️ <strong>Şəkillərin daxil edilməsi</strong></li>
      <li>🟡 <strong>Mətni highlighting</strong></li>
      <li>💻 <strong>Kod blokları syntax highlighting ilə</strong> - ən vacib xüsusiyyət!</li>
    </ul>

    <h2>Kod Bloku Nümunəsi:</h2>
    <p>Aşağıda "💻 Kod" düyməsinə basaraq müxtəlif proqramlaşdırma dillərində kod blokları əlavə edə bilərsiniz:</p>
  `)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Rich Text Editor Test Səhifəsi
            </h1>
            <p className="text-gray-600">
              Aşağıdakı editorda syntax highlighting ilə kod blokları yarada bilərsiniz
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                📝 Editor
              </h2>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Mətn yazmağa başlayın..."
              />
            </div>

            {/* Preview */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                👁️ Önizləmə
              </h2>
              <div 
                className="border rounded-lg p-4 bg-gray-50 min-h-[400px] max-h-[600px] overflow-y-auto rich-text-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              💡 Necə istifadə edilir:
            </h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li><strong>💻 Kod düyməsi:</strong> Kod bloku əlavə etmək üçün</li>
              <li><strong>Dil seçimi:</strong> Kod bloku başlığında dil seç (JavaScript, TypeScript, SQL, CSS, HTML, JSON, Bash, Python)</li>
              <li><strong>✏️ Redaktə et:</strong> Kod blokunu dəyişdirmək üçün</li>
              <li><strong>📋 Kopyala:</strong> Kodu clipboard-a kopyalamaq üçün</li>
              <li><strong>Rəngli syntax:</strong> Avtomatik olaraq kodlar rənglənir</li>
              <li><strong>Qaranlıq fon:</strong> Kod blokları qaranlıq fonda göstərilir</li>
            </ul>
          </div>

          {/* Sample Code Blocks */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📋 Nümunə Kodlar (Əlavə etmək üçün)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-100 p-3 rounded">
                <strong>JavaScript Nümunəsi:</strong>
                <pre className="mt-1 text-xs overflow-x-auto">{`const greeting = 'Salam Dünya!';
function showGreeting() {
  console.log(greeting);
  return true;
}
showGreeting();`}</pre>
              </div>

              <div className="bg-gray-100 p-3 rounded">
                <strong>SQL Nümunəsi:</strong>
                <pre className="mt-1 text-xs overflow-x-auto">{`SELECT u.name, e.subject 
FROM users u 
JOIN emails e ON u.id = e.user_id 
WHERE e.verified = true 
ORDER BY e.created_at DESC;`}</pre>
              </div>

              <div className="bg-gray-100 p-3 rounded">
                <strong>CSS Nümunəsi:</strong>
                <pre className="mt-1 text-xs overflow-x-auto">{`.code-block {
  background: #1a1a1a;
  color: #f8f8f2;
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Monaco', monospace;
}`}</pre>
              </div>

              <div className="bg-gray-100 p-3 rounded">
                <strong>JSON Nümunəsi:</strong>
                <pre className="mt-1 text-xs overflow-x-auto">{`{
  "name": "Rich Text Editor",
  "version": "1.0.0",
  "features": ["syntax-highlighting", "code-blocks"],
  "active": true
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
