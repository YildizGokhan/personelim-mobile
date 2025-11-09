## Frontend Geliştirme Yol Haritası

Bu dosya, Personelim mobil projesini backend yetenekleriyle hizalayacak adımları sıralar. Her adım tamamlandığında dosya güncellenecektir.

### ✅ 1. Timesheet Modülü
- `src/services/employee.js` içinde kişisel mesai servisleri tanımlandı.
- `src/store/personelStore.js`’e timesheet state/aksiyonları eklendi.
- `MyTimesheetsScreen` ve `CreateTimesheetScreen` oluşturulup navigasyona bağlandı.
- Çalışan dashboard’u mesai istatistikleri ve hızlı erişimle güncellendi.
- Kullanıcıların kendi mesai girişleri backend doğrulamasıyla sınırlı; toplam süre (break çıkarımı) backend tarafından hesaplanıyor.
- Çalışan sideli timesheet girişlerine ek olarak yönetici onay akışı planlanacak (bkz. Step 2).

### 2. İzin / Avans Yönetimi Genişletmesi
- Var olan store fonksiyonlarını kullanarak detay, filtre ve onay ekranları ekle.
- Rol bazlı görünürlük kuralları için navigation yapılandırmasını güncelle.
- **Mesai Onay Süreci:** Owner/manager, çalışanların timesheet kayıtlarını görüntüleyip onaylayabilecek (statü değişimi, not ekleme). Backend onayı destekliyorsa `approved`, `approvedBy` vb. alanlar kullanılacak.
- **Pasif Personeller:** `fetchDeletedPersonelList` API’sini kullanarak “Arşivlenmiş Personeller” ekranı ekle, restore akışını UI’dan yönet.
- **Onay Notu:** Timesheet onay/reddetme işlemlerinde `note` alanını backend sözleşmesine uygun şekilde gönder ve UI’da görüntüle.

### 3. Payroll & Maaş Yönetimi
- Payroll servis fonksiyonlarını ve gerekirse yeni store modülünü ekle.
- `PayrollListScreen`, `PayrollDetailScreen` gibi ekranlar oluştur.

### 4. Health Monitoring Ekranı
- `/health` endpoint’ini sorgulayan basit servis yaz.
- Sağlık durumu için bir ekran ekleyip navigasyona bağla.

### 5. Auth Akışını Tamamla
- `ForgotPasswordScreen` ve ilgili servis fonksiyonlarını ekle.
- Navigation’da misafir kullanıcı akışını güncelle.


