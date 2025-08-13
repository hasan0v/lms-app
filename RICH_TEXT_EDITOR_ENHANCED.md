# Rich Text Editor with Syntax Highlighting - Enhanced Version

## Özət (Summary)
Bu enhanced Rich Text Editor, Azerbaijani email verification sistemi üçün yaradılmış və syntax highlighting ilə kod bloklarını dəstəkləyən güclü bir mətn redaktorudur.

## Yeniliklər (New Features)

### ✅ Həll edilmiş Problemlər
1. **SSR Hydration İssue**: `immediatelyRender: false` əlavə edildi
2. **Mətn Görünməzliği**: Editor mətni artıq qaranlıq rəngdə və oxunaqlıdır
3. **Formatlama Problemləri**: Bütün formatlama seçimləri düzgün işləyir

### 🎨 Vizual Təkmilləşdirmələr
- **Mətn Rəngi**: Editor məzmunu `#1f2937` (qaranlıq boz) rəngində
- **Başlıqlar**: H1, H2, H3 düzgün ölçü və çəki ilə
- **Siyahılar**: Bullet və nömrəli siyahılar düzgün indentasiya ilə
- **Bold/Italic/Strike**: Bütün mətn formatları vizual olaraq düzgün
- **Highlight**: Sarı fon ilə vurğulanmış mətn

### 💻 Kod Blok Xüsusiyyətləri
- **8 Proqramlaşdırma Dili**: JavaScript, TypeScript, SQL, CSS, HTML, JSON, Bash, Python
- **Syntax Highlighting**: Hər dil üçün öz rəng sxemi
- **İnteraktiv Interface**: Dil seçimi, kod redaktəsi, kopyalama
- **Qaranlıq Tema**: Kod blokları professional qaranlıq fonda

## Texniki Detallar

### Fayl Strukturu
```
src/components/
├── RichTextEditor.tsx          # Əsas komponent
├── RichTextEditor.module.css   # CSS stilləri
└── [test page]
src/app/test-editor/
└── page.tsx                   # Test səhifəsi
```

### CSS Klassları
- `.rich-text-content` - Əsas editor məzmunu
- `.rich-text-heading` - Başlıqlar (H1, H2, H3)
- `.rich-text-paragraph` - Paraqraflar
- `.rich-text-bold/.italic/.strike` - Mətn formatları
- `.rich-text-bullet-list/.ordered-list` - Siyahılar
- `.rich-text-highlight` - Vurğulanmış mətn
- `.hl-*` - Syntax highlighting klassları

### Komponent API
```tsx
interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
}
```

## İstifadə Nümunəsi

### Basic Usage
```tsx
import RichTextEditor from '@/components/RichTextEditor'

function MyComponent() {
  const [content, setContent] = useState('')
  
  return (
    <RichTextEditor
      content={content}
      onChange={setContent}
      placeholder="Yazımağa başlayın..."
    />
  )
}
```

### EmailTemplateManager-də İstifadə
```tsx
// Admin panel email template manager
<RichTextEditor
  content={template.html_content}
  onChange={(newContent) => 
    updateTemplate({ ...template, html_content: newContent })
  }
/>
```

## Toolbar Düymələri

### Mətn Formatları
- **B** - Bold (qalın)
- **I** - Italic (maili)  
- **S** - Strikethrough (üstü xətli)

### Başlıqlar
- **H1** - Böyük başlıq
- **H2** - Orta başlıq
- **H3** - Kiçik başlıq

### Siyahılar
- **• List** - Bullet siyahı
- **1. List** - Nömrəli siyahı

### Media və Linkler
- **🔗 Link** - Hyperlink əlavə et
- **🖼️ Şəkil** - Şəkil daxil et
- **💻 Kod** - Kod bloku əlavə et
- **🟡 Highlight** - Mətni vurğula

### Naviqasiya
- **↶ Geri** - Undo
- **↷ İrəli** - Redo

## Kod Bloku Xüsusiyyətləri

### Dəstəklənən Dillər
1. **🟨 JavaScript** - Modern JS syntax
2. **🔷 TypeScript** - Type annotations
3. **🗃️ SQL** - Database queries
4. **🎨 CSS** - Styling rules
5. **🌐 HTML** - Markup
6. **📋 JSON** - Data format
7. **💻 Bash** - Shell commands
8. **🐍 Python** - Python scripts

### Kod Bloku Interface
- **Dil Seçimi**: Dropdown menyu
- **Sətir Sayğacı**: "X sətir" göstəricisi
- **✏️ Redaktə et**: Kod dəyişdirmək üçün
- **💾 Yadda saxla**: Dəyişiklikləri saxla
- **📋 Kopyala**: Clipboard-a kopyala

## Test Etmək

### Development Server
```bash
cd lms-app
npm run dev
```

### Test Səhifəsi
`http://localhost:3000/test-editor` - Tam test interface

### Testlər üçün Nümunə Kodlar

#### JavaScript
```javascript
const greeting = 'Salam Dünya!';
function showGreeting() {
  console.log(greeting);
  return true;
}
showGreeting();
```

#### SQL
```sql
SELECT u.name, e.subject 
FROM users u 
JOIN emails e ON u.id = e.user_id 
WHERE e.verified = true 
ORDER BY e.created_at DESC;
```

#### CSS
```css
.code-block {
  background: #1a1a1a;
  color: #f8f8f2;
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Monaco', monospace;
}
```

## Performans Optimizasyonu

### SSR Uyğunluğu
- `immediatelyRender: false` - Hydration problemlərini həll edir
- Client-side rendering yalnız lazım olan yerdə

### Memory İdarəetməsi
- Editor cleanup useEffect-də
- Event listener-lərin düzgün silinməsi

### Bundle Size
- Yalnız lazımi TipTap extensions
- CSS module lazy loading

## Gələcək Təkmilləşdirmələr

### Planlaşdırılan Xüsusiyyətlər
1. **Əlavə Dillər**: PHP, Java, C#, Go, Rust
2. **Theme Seçimi**: Light/Dark theme toggle
3. **Export Funksiyası**: HTML, Markdown, PDF
4. **Collaboration**: Real-time editing
5. **Plugin System**: Custom extensions

### Texniki Təkmilləşdirmələr
1. **TypeScript Strictness**: Tam type safety
2. **Testing**: Unit və integration testlər
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Internationalization**: Çoxdilli dəstək

## Troubleshooting

### Yayın Görünən Problemlər

#### Problem: Mətn görünmür
**Həll**: CSS module düzgün import edilib?
```tsx
import styles from './RichTextEditor.module.css'
```

#### Problem: Syntax highlighting işləmir
**Həll**: `syntaxHighlight` funksiyası düzgün dillər dəstəkləyir?

#### Problem: SSR hydration error
**Həll**: `immediatelyRender: false` əlavə edilib?

## Əlaqə və Dəstək

Bu komponent Azerbaijani email verification sistemi üçün hazırlanıb və təkmilləşdirilə bilər.

### Dəyişiklik Tarixi
- **v1.0**: Əsas Rich Text Editor
- **v1.1**: Syntax highlighting əlavəsi
- **v1.2**: SSR fix və styling təkmilləşdirmələri ⭐ (current)

Bu sənədin sonuncu yenilənməsi: 26 İyul 2025
