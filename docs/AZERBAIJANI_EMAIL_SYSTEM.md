# Azerbaijani Email Verification System

## Overview

Bu sistem Supabase MCP istifadə edərək Azərbaycan dilində hərtərəfli, istifadəçi dostu və görsel cəhətdən cəlbedici e-poçt təsdiqləmə mesajları yaradır.

## 🌟 Xüsusiyyətlər

### ✅ Tam Azərbaycan dili dəstəyi
- Azərbaycan mədəniyyətinə uyğun məzmun
- Düzgün dil nüansları və mərasim
- Milli emoji və simvollardan istifadə

### 🎨 Modern və peşəkar dizayn
- Responsive dizayn mobil və masaüstü cihazlar üçün
- Gradient rənglər və müasir tipografiya
- Dark və light mode uyğunluğu

### 🔒 Təhlükəsizlik prioriteti
- Açıq təhlükəsizlik məlumatları
- Spam və phishing təhlükəsizliyi
- Müfəssəl təlimatlar

### 📧 Çoxlu şablon növləri
- E-poçt təsdiqi (email_verification)
- Şifrə sıfırlama (password_reset) 
- Xoş gəlmisiniz mesajı (welcome)

## 🏗️ Sistem Arxitekturası

### Verilənlər Bazası Strukturu

```sql
-- Email şablonları cədvəli
public.email_templates
├── id (UUID, PRIMARY KEY)
├── template_type (VARCHAR(50))
├── language_code (VARCHAR(5), DEFAULT 'az')
├── subject (TEXT)
├── html_content (TEXT)
├── text_content (TEXT)
├── is_active (BOOLEAN, DEFAULT true)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── created_by (UUID, REFERENCES auth.users)

-- Email logları cədvəli
public.email_logs
├── id (UUID, PRIMARY KEY)
├── email_to (TEXT)
├── subject (TEXT)
├── template_type (VARCHAR(50))
├── sent_at (TIMESTAMP, DEFAULT NOW())
├── delivered_at (TIMESTAMP)
├── status (VARCHAR(20), DEFAULT 'pending')
├── error_message (TEXT)
├── metadata (JSONB)
└── user_id (UUID, REFERENCES auth.users)
```

### Funksiyalar

1. **get_email_template()** - Şablon əldə etmə
2. **send_custom_email_verification()** - E-poçt hazırlama
3. **preview_email_template()** - Şablon önizləməsi
4. **manage_email_template()** - Şablon idarəetməsi

## 🚀 İstifadə Təlimatları

### 1. API Endpointləri

#### Email Verification Göndərmə
```javascript
POST /api/auth/send-verification
{
  "email": "user@example.com",
  "confirmationUrl": "https://suni-intellekt.az/verify?token=abc123",
  "userId": "uuid-here" // opsional
}
```

#### Şablon Önizləməsi
```javascript
GET /api/auth/preview-template?template=email_verification&lang=az&url=https://suni-intellekt.az/verify?token=sample
```

### 2. React Komponent İstifadəsi

```jsx
import EmailTemplateManager from '@/components/EmailTemplateManager';

function AdminPage() {
  return <EmailTemplateManager />;
}
```

### 3. Supabase Funksiya Çağırma

```javascript
// E-poçt hazırlama
const { data, error } = await supabase.rpc('send_custom_email_verification', {
  user_email: 'test@example.com',
  confirmation_url: 'https://suni-intellekt.az/verify?token=123',
  user_id_param: userId
});

// Şablon önizləməsi
const { data, error } = await supabase.rpc('preview_email_template', {
  p_template_type: 'email_verification',
  p_language_code: 'az',
  p_sample_url: 'https://suni-intellekt.az/verify?token=sample'
});
```

## 📋 E-poçt Şablonu Məzmunu

### Email Verification Şablonu

**Mövzu:** "E-poçt ünvanınızı təsdiqləyin - Süni İntellekt Təhsil Platforması"

**Əsas elementlər:**
- 🌟 Süni İntellekt brend logosu və rənglər
- 👋 İsti və dostcasına salamlama
- ✅ Açıq və görünən təsdiqləmə düyməsi
- 🔒 Təhlükəsizlik qeydi
- 🤝 Dəstək əlaqə məlumatları
- 📱 Mobil responsive dizayn

### Password Reset Şablonu

**Mövzu:** "Şifrənizi sıfırlayın - Süni İntellekt Təhsil Platforması"

**Əsas elementlər:**
- 🔐 Şifrə sıfırlama tematikal dizayn
- ⏰ 24 saatlıq etibarlılık xəbərdarlığı
- 🔄 Açıq sıfırlama düyməsi
- ⚠️ Təhlükəsizlik tövsiyələri

### Welcome Şablonu

**Mövzu:** "Xoş gəlmisiniz! - Süni İntellekt Təhsil Platformasına başlayın"

**Əsas elementlər:**
- 🎉 Təbrik mesajı
- 🌟 Platform xüsusiyyətlərinin siyahısı
- 🚀 "Başlayın" call-to-action düyməsi
- 📚 Kurs və öyrənmə imkanları məlumatı

## 🎨 Dizayn Xüsusiyyətləri

### Rəng Palitri
```css
/* Baş rənglər */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
--danger-gradient: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);

/* Mətn rəngləri */
--text-primary: #1e293b;
--text-secondary: #475569;
--text-muted: #64748b;
```

### Tipografiya
```css
font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
```

### Responsive Breakpoints
- Mobil: 600px və aşağı
- Tablet: 601px - 768px  
- Desktop: 769px və yuxarı

## 🔧 Konfiqurasiya

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Supabase RLS Policies
```sql
-- Email templates read access
CREATE POLICY "Email templates are publicly readable" ON public.email_templates
    FOR SELECT USING (is_active = true);

-- Admin management access
CREATE POLICY "Only admins can manage email templates" ON public.email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

## 📊 Monitoring və Logs

### Email Logs İzləmə
```sql
-- Son e-poçtları görüntülə
SELECT 
    email_to,
    subject,
    template_type,
    sent_at,
    status,
    metadata
FROM public.email_logs 
ORDER BY sent_at DESC 
LIMIT 10;
```

### Status Codes
- `pending` - Hazırlanır
- `ready` - Göndərilməyə hazır
- `sent` - Göndərildi
- `delivered` - Çatdırıldı
- `failed` - Uğursuz

## 🚀 Production Deployment

### SMTP Konfiqurasiyası
Həqiqi e-poçt göndərmə üçün bu xidmətlərdən biri konfiqurasiya edilməlidir:

- **SendGrid**
- **AWS SES**
- **Mailgun**
- **Resend**
- **Nodemailer + SMTP**

### Nümunə SendGrid İnteqrasiyası
```javascript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: emailData.email_to,
  from: 'noreply@suni-intellekt.az',
  subject: emailData.subject,
  html: emailData.html_content,
  text: emailData.text_content,
};

await sgMail.send(msg);
```

## 🎯 Best Practices

### E-poçt Göndərmə
1. **Rate Limiting** tətbiq edin
2. **Email Validation** istifadə edin
3. **Unsubscribe** linki əlavə edin
4. **SPF/DKIM** record-ları konfiqurasiya edin

### Təhlükəsizlik
1. E-poçt məzmununu sanitize edin
2. URL-ləri validate edin
3. Template injection-dan qorunun
4. Rate limiting tətbiq edin

### Performance
1. Email queue sistemi istifadə edin
2. Template cache-ing tətbiq edin
3. Database connection pooling
4. Monitoring və alerting

## 🤝 Dəstək və Kömək

### Əlaqə Məlumatları
- **E-poçt:** support@suni-intellekt.az
- **Telefon:** +994 (55) 385 82 20
- **Sayt:** www.suni-intellekt.az
- **İş saatları:** Bazar ertəsi - Cümə: 09:00-18:00

### Texniki Suallar
1. GitHub Issues açın
2. Dokumentasiyaya baxın
3. Community forum istifadə edin
4. Direct support əlaqə saxlayın

---

## 📝 Changelog

### Version 1.0.0 (2025-07-26)
- ✅ İlk versiya buraxıldı
- ✅ Azərbaycan dili dəstəyi
- ✅ 3 əsas şablon növü
- ✅ Tam responsive dizayn
- ✅ Supabase MCP inteqrasiyası
- ✅ Admin management panel
- ✅ Email logging sistemi

---

**© 2025 Süni İntellekt. Bütün hüquqlar qorunur.**
