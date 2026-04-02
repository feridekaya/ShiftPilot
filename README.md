# ShiftPilot

Restaurant Operations & Workforce Automation SaaS.

Yöneticiler çalışanlara vardiya/bölge bazlı görev atar. Çalışanlar görevleri gerçek zamanlı kamera fotoğrafı ile tamamlar. Süpervizörler fotoğraflı gönderimleri onaylar veya reddeder.

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Backend | Django 5.2 + Django REST Framework |
| Veritabanı | PostgreSQL |
| Frontend | Next.js 14 (App Router) + TailwindCSS |
| Auth | JWT (djangorestframework-simplejwt) |
| Görev Kuyruğu | Celery + Redis |
| Depolama | AWS S3 / Cloudflare R2 (fotoğraflar) |

---

## Roller

| Rol | Yetkiler |
|-----|----------|
| **Manager** | Kullanıcı/görev/bölge/vardiya CRUD, çalışanlara görev atama |
| **Supervisor** | Fotoğraflı gönderimleri onaylama / reddetme |
| **Employee** | Günlük görevleri görme, kamera fotoğrafıyla tamamlama |

---

## Kurulum

### Gereksinimler
- Python 3.10+
- Node.js 18+
- PostgreSQL 17+
- Redis (Celery için)

### Backend

```bash
cd ShiftPilot

# Sanal ortam
python -m venv venv
source venv/Scripts/activate   # Windows
# source venv/bin/activate     # macOS/Linux

# Bağımlılıklar
pip install -r requirements.txt

# Ortam değişkenleri
cp .env.example .env
# .env dosyasını düzenle (DB şifresi, secret key vb.)

# Veritabanı
# PostgreSQL'de "shiftpilot" veritabanını oluştur
psql -U postgres -c "CREATE DATABASE shiftpilot;"

# Migration
python manage.py migrate

# İlk admin kullanıcısı
python manage.py createsuperuser

# Sunucu
python manage.py runserver
```

### Frontend

```bash
cd frontend

npm install
cp .env.local.example .env.local   # veya manuel oluştur

# .env.local içeriği:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

npm run dev
```

Uygulama: `http://localhost:3000`

---

## Ortam Değişkenleri

`.env` (backend):

```env
SECRET_KEY=your-secret-key
DEBUG=True

DB_NAME=shiftpilot
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

REDIS_URL=redis://localhost:6379/0

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=
```

---

## API Endpoints

### Auth
| Method | URL | Açıklama |
|--------|-----|----------|
| POST | `/api/auth/login` | Giriş → JWT token + name + role |
| POST | `/api/auth/register` | Kayıt |
| GET | `/api/auth/me` | Mevcut kullanıcı |

### Kullanıcılar (Manager)
| Method | URL |
|--------|-----|
| GET/POST | `/api/users/` |
| PUT/DELETE | `/api/users/{id}/` |

### Görevler
| Method | URL |
|--------|-----|
| GET/POST/PUT/DELETE | `/api/tasks/` |
| GET/POST | `/api/tasks/zones/` |
| GET/POST | `/api/tasks/shifts/` |
| GET/POST | `/api/tasks/schedules/` |

### Atamalar
| Method | URL |
|--------|-----|
| GET | `/api/assignments/` |
| POST | `/api/assignments/` |
| POST | `/api/assignments/submissions/` |
| GET | `/api/assignments/submissions/?status=pending` |
| PUT | `/api/assignments/submissions/{id}/approve/` |
| PUT | `/api/assignments/submissions/{id}/reject/` |

---

## Proje Yapısı

```
ShiftPilot/
├── backend (Django)
│   ├── config/          → Settings, URL routing
│   ├── users/           → Custom User modeli, JWT auth, permission sınıfları
│   ├── tasks/           → Zone, Shift, Task, TaskSchedule modelleri
│   ├── assignments/     → Assignment, TaskSubmission modelleri
│   ├── manage.py
│   └── requirements.txt
│
└── frontend (Next.js)
    ├── app/
    │   ├── login/           → Giriş sayfası
    │   ├── dashboard/       → Rol bazlı yönlendirme hub'ı
    │   ├── manager/         → Kullanıcı, görev, bölge, vardiya, atama yönetimi
    │   ├── supervisor/      → Fotoğraf onay/red ekranı
    │   └── employee/        → Günlük görevler + kamera submission + geçmiş
    ├── components/
    │   ├── ui/              → Button, Input, Modal, Badge, Spinner
    │   ├── layout/          → Navbar, Sidebar
    │   └── CameraCapture.tsx
    ├── contexts/AuthContext.tsx
    ├── services/            → API servis katmanı (axios + JWT interceptor)
    └── types/index.ts
```

---

## Önemli İş Kuralları

- **Fotoğraf zorunluluğu:** Frontend yalnızca kamera erişimine izin verir (`capture="environment"`), galeri seçimi engellenir.
- **İş yükü dengesi:** Görev atamalarında çalışanlar arası katsayı toplamı %20'den fazla sapamaz.
- **JWT:** 8 saatlik access token, 7 günlük refresh token. 401 hatasında otomatik yenileme.

---

## Geliştirme Notları

```bash
# Branch stratejisi
git checkout -b feature/yeni-ozellik develop

# Commit formatı
feat(scope): kısa açıklama
fix(scope): hata düzeltme
```

---

## Lisans

MIT
