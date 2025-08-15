# 🔧 Supabase Database Kurulum Rehberi

## 1. Supabase Hesabı Oluşturma

1. **Supabase'e gidin**: https://supabase.com
2. **"Start your project"** butonuna tıklayın
3. **GitHub hesabınızla giriş yapın** (önerilen)
4. **"New project"** butonuna tıklayın

## 2. Proje Oluşturma

1. **Organization seçin** (kişisel hesap için "Personal")
2. **Proje bilgilerini girin**:
   - Name: `aidat-management` (veya istediğiniz isim)
   - Database Password: **Güçlü bir şifre oluşturun ve kaydedin!**
   - Region: `Central EU (Frankfurt)` (Türkiye'ye en yakın)
3. **"Create new project"** butonuna tıklayın
4. **2-3 dakika bekleyin** (proje hazırlanıyor)

## 3. Database Schema Kurulumu

1. **Sol menüden "SQL Editor"** seçin
2. **"New query"** butonuna tıklayın
3. **`supabase-schema.sql` dosyasının tamamını kopyalayın**
4. **SQL Editor'a yapıştırın**
5. **"Run"** butonuna tıklayın (⚡ veya Ctrl+Enter)
6. **"Success. No rows returned"** mesajını görürseniz başarılı!

## 4. API Keys Alma

1. **Sol menüden "Settings"** seçin
2. **"API"** sekmesine tıklayın
3. **Şu bilgileri kopyalayın**:
   - **Project URL**: `https://xyz.supabase.co` formatında
   - **anon public key**: `eyJ...` ile başlayan uzun anahtar

## 5. Environment Variables Ayarlama

1. **Proje klasöründe `.env` dosyası oluşturun**:
   ```bash
   cp .env.example .env
   ```

2. **`.env` dosyasını düzenleyin**:
   ```env
   NODE_ENV=development
   PORT=3000
   
   # Supabase bilgilerinizi buraya yazın
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 6. Test Etme

1. **Uygulamayı başlatın**:
   ```bash
   npm run dev
   ```

2. **Browser'da açın**: http://localhost:3000

3. **Admin paneline gidin**: http://localhost:3000/admin.html
   - Şifre: `admin123`

4. **Test üyesi ekleyin** ve ödeme durumunu değiştirin

5. **Database'de kontrol edin**:
   - Supabase Dashboard > Table Editor > members tablosuna bakın

## 7. Vercel Deployment

1. **Vercel'e environment variables ekleyin**:
   - Dashboard > Project > Settings > Environment Variables
   - `SUPABASE_URL` ekleyin
   - `SUPABASE_ANON_KEY` ekleyin
   - `NODE_ENV=production` ekleyin

2. **Deploy edin**:
   ```bash
   vercel --prod
   ```

## 🚨 Güvenlik Önemli Notları

### ⚠️ Production İçin Önemli:

1. **Row Level Security (RLS)**:
   - Şu anda herkes verilere erişebilir
   - Production'da user authentication eklenmeli
   - RLS policies güçlendirilmeli

2. **Admin Şifresi**:
   - `admin123` şifresini değiştirin
   - Environment variable yapın

3. **API Keys**:
   - `.env` dosyasını GitHub'a pushlamamaya dikkat edin
   - `.gitignore`'da olduğunu kontrol edin

## 🐛 Sorun Giderme

### Database bağlantı hatası:
```
Error: Invalid API key
```
**Çözüm**: SUPABASE_ANON_KEY doğru kopyalanmış mı kontrol edin

### CORS hatası:
```
Access-Control-Allow-Origin error
```
**Çözüm**: Backend'de CORS ayarları yapıldı, frontend URL'ini kontrol edin

### Tablolar oluşmadı:
```
relation "public.settings" does not exist
```
**Çözüm**: `supabase-schema.sql` komutlarını tekrar çalıştırın

### Environment variables yüklenmiyor:
```
your-supabase-url-here
```
**Çözüm**: 
- `dotenv` paketi yüklü mü: `npm install dotenv`
- `.env` dosyası doğru konumda mı
- `dotenv.config()` çağrıldı mı

## 📊 Database Yapısı

### Tables:
- **settings**: Sistem ayarları (aidat tutarı, yıl, geçmiş)
- **members**: Üye listesi ve ödeme durumları  
- **expenses**: Gider kayıtları

### JSON Yapıları:
- **fee_history**: `[{"amount": 100, "start_date": "2025-01-01", "description": "..."}]`
- **payments**: `{"2025-01": {"paid": true, "amount": 100, "paidAt": "2025-01-15T10:00:00Z"}}`

## 🎯 Sonraki Adımlar

1. **✅ Database kurulumu tamamlandı**
2. **✅ Local development çalışıyor**
3. **✅ Vercel deployment hazır**
4. **🔄 User authentication eklenecek**
5. **🔄 Email notifications eklenecek**

---

**❓ Yardıma mı ihtiyacınız var?**
- Supabase Discord: https://discord.supabase.com
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: Bu repository'de issue açın
