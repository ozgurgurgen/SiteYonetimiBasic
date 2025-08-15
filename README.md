# Site Yönetimi Basic - Aidat Takip Sistemi

Bu proje, site yöneticileri için geliştirilmiş modern bir aidat takip ve yönetim sistemidir. Excel tablosundan web tabanlı uygulamaya dönüştürülmüş ve **Supabase PostgreSQL** database ile güçlendirilmiştir.

## 🚀 Özellikler

### 💰 Aidat Yönetimi
- **Tarihi Aidat Koruması**: Aidat tutarı değiştirildiğinde geçmiş ödemeler etkilenmez
- **Aylık Ödeme Takibi**: Her ay için ayrı ödeme durumu
- **Otomatik Hesaplamalar**: Toplam gelir, gider ve bakiye hesaplaması
- **Önceki Devir**: Geçmiş yıllardan kalan bakiye takibi
- **☁️ Cloud Database**: Supabase PostgreSQL ile kalıcı veri depolama

### 👥 Üye Yönetimi  
- **Üye Ekleme/Çıkarma**: Dinamik üye listesi yönetimi
- **Ödeme Durumu**: Tıklayarak ödeme durumunu değiştirme
- **Görsel Takip**: Ödenen aylar yeşil, ödenmeyenler sarı renkte

### 💸 Gider Yönetimi
- **Gider Kategorileri**: Temizlik, Bakım, vb. kategoriler
- **Detaylı Açıklamalar**: Her gider için ayrıntılı açıklama
- **Tarih Takibi**: Giderlerin hangi tarihte yapıldığını kaydetme

### 📊 Özet Kartları
- **Aidat Geliri**: Toplanan aidat miktarı
- **Güncel Aidat**: Mevcut aylık aidat tutarı  
- **Toplam Gider**: Yapılan toplam giderler
- **Kasa Bakiyesi**: Mevcut kasa durumu
- **Önceki Devir**: Geçmiş dönem bakiyesi

### 🔐 Admin Paneli
- **Güvenli Giriş**: Şifre korumalı admin paneli (varsayılan: admin123)
- **Ayar Yönetimi**: Aidat tutarı ve yıl ayarlama
- **Veri Yönetimi**: Tüm verileri yönetme yetkisi

### 📱 Responsive Tasarım
- **Mobile-First**: Mobil cihazlar için optimize edilmiş
- **Tablet Uyumlu**: Orta boyutlu ekranlar için adaptive layout
- **Desktop Friendly**: Büyük ekranlarda tam özellik seti

## 🛠️ Teknoloji Yığını

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web framework
- **JSON Dosya**: Basit veri depolama
- **CORS**: Cross-origin resource sharing

### Frontend  
- **Vanilla JavaScript**: Modern ES6+ özellikleri
- **HTML5**: Semantic markup
- **CSS3**: Flexbox, Grid, Responsive design

## 📦 Kurulum

### Gereksinimler
- Node.js (v14 veya üstü)
- npm veya yarn
- Supabase hesabı

### Database Kurulumu (Supabase)
1. **Supabase hesabı oluşturun**: https://supabase.com
2. **Yeni proje oluşturun**
3. **SQL Editor'da `supabase-schema.sql` dosyasındaki komutları çalıştırın**
4. **Project Settings > API'dan URL ve Key bilgilerini alın**

### Adımlar
1. **Repository'yi klonlayın**
   ```bash
   git clone https://github.com/ozgurgurgen/SiteYonetimiBasic.git
   cd SiteYonetimiBasic
   ```

2. **Backend bağımlılıklarını yükleyin**
   ```bash
   npm install
   ```

3. **Environment variables ayarlayın**
   ```bash
   cp .env.example .env
   # .env dosyasını Supabase bilgilerinizle düzenleyin
   ```

4. **Sunucuyu başlatın**
   ```bash
   node app.js
   ```

4. **Tarayıcıda açın**
   - Ana Sayfa: http://localhost:3000
   - Admin Paneli: http://localhost:3000/admin.html

## 🖥️ Kullanım

### Ana Sayfa
- Site aidat durumunu görüntüleyin
- Özet kartlardan finansal durumu takip edin
- Gider listesini inceleyin

### Admin Paneli  
- **Giriş**: Sağ alttaki "Admin" butonuna tıklayın (Şifre: admin123)
- **Üye Ekleme**: "Yeni Üye Ekle" bölümünden üye ekleyin
- **Ödeme Değiştirme**: Aylık ödeme kutularına tıklayarak durumu değiştirin
- **Gider Ekleme**: "Gider Ekle" bölümünden yeni gider kaydedin
- **Ayar Değiştirme**: Aylık aidat tutarını ve yılı güncelleyin

### Önemli Özellikler
- **Tarihi Koruma**: Aidat tutarını değiştirdiğinizde geçmiş ödemeler etkilenmez
- **Otomatik Kaydet**: Tüm değişiklikler otomatik olarak kaydedilir
- **Responsive**: Mobil cihazlarda da tam işlevsellik

## 📁 Proje Yapısı

```
SiteYonetimiBasic/
├── backend/
│   ├── app.js              # Express server
│   ├── db.json            # Veri dosyası
│   └── package.json       # Backend dependencies
├── frontend/
│   ├── index.html         # Ana sayfa
│   └── admin.html         # Admin paneli
├── standalone.html        # Tek dosyalı demo
├── README.md              # Bu dosya
└── .gitignore            # Git ignore kuralları
```

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📞 İletişim

**Özgür Gürgen** - [GitHub Profile](https://github.com/ozgurgurgen)

Proje Linki: [https://github.com/ozgurgurgen/SiteYonetimiBasic](https://github.com/ozgurgurgen/SiteYonetimiBasic)

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
