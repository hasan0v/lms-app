'use client';

import { useState } from 'react';

interface EmailTemplate {
  template_type: string;
  language: string;
  subject: string;
  html_content: string;
  text_content: string;
  preview_url: string;
}

export default function EmailTemplateManager() {
  const [selectedTemplate, setSelectedTemplate] = useState('email_verification');
  const [language, setLanguage] = useState('az');
  const [previewData, setPreviewData] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [confirmationUrl, setConfirmationUrl] = useState('https://suni-intellekt.az/verify?token=test-123');
  const [activeTab, setActiveTab] = useState('preview');

  const templateTypes = [
    { value: 'email_verification', label: 'E-poçt Təsdiqi', icon: '✅' },
    { value: 'password_reset', label: 'Şifrə Sıfırlama', icon: '🔐' },
    { value: 'welcome', label: 'Xoş gəlmisiniz', icon: '🎉' }
  ];

  const languages = [
    { value: 'az', label: 'Azərbaycan dili', flag: '🇦🇿' },
    { value: 'en', label: 'English', flag: '🇺🇸' }
  ];

  const previewTemplate = async () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `/api/auth/preview-template?template=${selectedTemplate}&lang=${language}&url=${encodeURIComponent(confirmationUrl)}`
      );
      
      if (!response.ok) {
        throw new Error('Template yüklənə bilmədi');
      }
      
      const data = await response.json();
      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !confirmationUrl) {
      setError('E-poçt və təsdiqləmə URL-i tələb olunur');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          confirmationUrl: confirmationUrl
        }),
      });
      
      if (!response.ok) {
        throw new Error('E-poçt göndərilə bilmədi');
      }
      
      const data = await response.json();
      setSuccess(`E-poçt uğurla hazırlandı! Log ID: ${data.logId}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Mətni buferə kopyalandı!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const openPreviewInNewTab = () => {
    if (!previewData) return;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(previewData.html_content);
      newWindow.document.close();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📧 E-poçt Şablonları Meneceri
        </h1>
        <p className="text-gray-600">
          Azərbaycan dilində hazırlanmış professional e-poçt şablonları
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">⚠️</div>
            <div className="text-red-700">{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="text-green-600 mr-2">✅</div>
            <div className="text-green-700">{success}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📧 Şablon Seçimi
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şablon Növü
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {templateTypes.map((template) => (
                  <option key={template.value} value={template.value}>
                    {template.icon} {template.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dil
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Təsdiqləmə URL-i
              </label>
              <input
                type="text"
                value={confirmationUrl}
                onChange={(e) => setConfirmationUrl(e.target.value)}
                placeholder="https://suni-intellekt.az/verify?token=..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={previewTemplate}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              👁️ {loading ? 'Yüklənir...' : 'Önizləmə'}
            </button>
          </div>
        </div>

        {/* Test Email Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📤 Test E-poçtu
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test E-poçt Ünvanı
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={sendTestEmail}
              disabled={loading || !testEmail}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              📤 {loading ? 'Göndərilir...' : 'Test E-poçtu Göndər'}
            </button>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <strong>Qeyd:</strong> Bu funksiya yalnız e-poçt məzmununu hazırlayır. 
              Həqiqi göndərmə üçün SMTP servisi konfiqurasiyası lazımdır.
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      {previewData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              👁️ Şablon Önizləməsi
            </h2>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {templateTypes.find(t => t.value === previewData.template_type)?.label}
              </span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                {languages.find(l => l.value === previewData.language)?.label}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex space-x-8">
              {[
                { id: 'preview', label: 'Vizual Önizləmə', icon: '👁️' },
                { id: 'html', label: 'HTML Kodu', icon: '🔧' },
                { id: 'text', label: 'Mətn Versiyası', icon: '📝' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Mövzu: {previewData.subject}</h3>
                <button
                  onClick={openPreviewInNewTab}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                >
                  🔗 Yeni səkmədə aç
                </button>
              </div>
              
              <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <iframe
                  srcDoc={previewData.html_content}
                  className="w-full h-full"
                  title="Email Preview"
                />
              </div>
            </div>
          )}

          {activeTab === 'html' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">HTML Kodu</h3>
                <button
                  onClick={() => copyToClipboard(previewData.html_content)}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                >
                  📋 Kopyala
                </button>
              </div>
              
              <textarea
                value={previewData.html_content}
                readOnly
                className="w-full h-96 p-3 font-mono text-sm border border-gray-300 rounded-md resize-none"
              />
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Mətn Versiyası</h3>
                <button
                  onClick={() => copyToClipboard(previewData.text_content)}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                >
                  📋 Kopyala
                </button>
              </div>
              
              <textarea
                value={previewData.text_content}
                readOnly
                className="w-full h-64 p-3 font-mono text-sm border border-gray-300 rounded-md resize-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">📋 İstifadə Təlimatları</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">🛠️ API Endpointləri</h3>
            <ul className="text-sm space-y-1 text-gray-600">
              <li><code className="bg-gray-100 px-1 rounded">/api/auth/preview-template</code> - Şablon önizləməsi</li>
              <li><code className="bg-gray-100 px-1 rounded">/api/auth/send-verification</code> - E-poçt göndərmə</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">📊 Mövcud Şablonlar</h3>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>✅ E-poçt təsdiqi (email_verification)</li>
              <li>🔐 Şifrə sıfırlama (password_reset)</li>
              <li>🎉 Xoş gəlmisiniz (welcome)</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg mt-6">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Vacib Qeydlər</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• E-poçt şablonları Supabase verilənlər bazasında saxlanılır</li>
            <li>• Həqiqi e-poçt göndərmə üçün SMTP servisi konfiqurasiyası tələb olunur</li>
            <li>• Bütün şablonlar Azərbaycan dili və mədəniyyətinə uyğundur</li>
            <li>• Responsive dizayn mobil cihazlarda da düzgün göstərilir</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
