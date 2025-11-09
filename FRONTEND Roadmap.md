## Frontend Geliştirme Yol Haritası

Bu dosya, Personelim mobil projesini backend yetenekleriyle hizalayacak adımları sıralar. Her adım tamamlandığında dosya güncellenecektir.

### ✅ 1. Timesheet Modülü
- `src/services/employee.js` içinde kişisel mesai servisleri tanımlandı.
- `src/store/personelStore.js`’e timesheet state/aksiyonları eklendi.
- `MyTimesheetsScreen` ve `CreateTimesheetScreen` oluşturulup navigasyona bağlandı.
- Çalışan dashboard’u mesai istatistikleri ve hızlı erişimle güncellendi.

### 2. İzin / Avans Yönetimi Genişletmesi
- Var olan store fonksiyonlarını kullanarak detay, filtre ve onay ekranları ekle.
- Rol bazlı görünürlük kuralları için navigation yapılandırmasını güncelle.

### 3. Payroll & Maaş Yönetimi
- Payroll servis fonksiyonlarını ve gerekirse yeni store modülünü ekle.
- `PayrollListScreen`, `PayrollDetailScreen` gibi ekranlar oluştur.

### 4. Health Monitoring Ekranı
- `/health` endpoint’ini sorgulayan basit servis yaz.
- Sağlık durumu için bir ekran ekleyip navigasyona bağla.

### 5. Auth Akışını Tamamla
- `ForgotPasswordScreen` ve ilgili servis fonksiyonlarını ekle.
- Navigation’da misafir kullanıcı akışını güncelle.


