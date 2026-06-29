# ShiftPilot

Restoran operasyonları ve iş gücü yönetimi için SaaS platformu.

Yöneticiler çalışanlara vardiya/bölge bazlı görev atar. Çalışanlar görevleri gerçek zamanlı kamera fotoğrafıyla tamamlar. Süpervizörler gönderimleri onaylar veya reddeder.

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Backend | Django 5.2 + Django REST Framework |
| Veritabanı | PostgreSQL |
| Frontend | Next.js 14 (App Router) + TailwindCSS |
| Auth | JWT (djangorestframework-simplejwt) |
| Görev Kuyruğu | Celery + Redis |
| Depolama | AWS S3 / Cloudflare R2 |

---

## Roller

| Rol | Yetkiler |
|-----|----------|
| **Manager** | Kullanıcı / görev / bölge / vardiya CRUD, çalışan atamaları, çizelge yönetimi, denetim, mola ve performans raporları |
| **Supervisor** | Fotoğraflı gönderimleri onaylama / reddetme, atama ve bölge görüntüleme |
| **Employee** | Günlük görevleri görme, kamera fotoğrafıyla tamamlama, mola ve performans geçmişi |

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
# .env dosyasını düzenle

# Veritabanı oluştur
psql -U postgres -c "CREATE DATABASE shiftpilot;"

# Migration
python manage.py migrate

# İlk yönetici kullanıcısı
python manage.py createsuperuser

# Sunucu
python manage.py runserver
```

### Celery (arka plan görevleri)

```bash
celery -A config worker --loglevel=info
celery -A config beat --loglevel=info
```

### Frontend

```bash
cd frontend
npm install

# .env.local oluştur
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local

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
| POST | `/api/auth/login` | Giriş — JWT token + kullanıcı bilgisi |
| POST | `/api/auth/register` | Kayıt |
| GET | `/api/auth/me` | Oturum açık kullanıcı |

### Kullanıcılar
| Method | URL |
|--------|-----|
| GET / POST | `/api/users/` |
| PUT / DELETE | `/api/users/{id}/` |

### Görevler
| Method | URL |
|--------|-----|
| GET / POST / PUT / DELETE | `/api/tasks/` |
| GET / POST | `/api/tasks/zones/` |
| GET / POST | `/api/tasks/shifts/` |
| GET / POST | `/api/tasks/schedules/` |
| GET / POST | `/api/tasks/work-schedules/` |

### Atamalar & Gönderimlер
| Method | URL |
|--------|-----|
| GET / POST | `/api/assignments/` |
| POST | `/api/assignments/submissions/` |
| GET | `/api/assignments/submissions/?status=pending` |
| PUT | `/api/assignments/submissions/{id}/approve/` |
| PUT | `/api/assignments/submissions/{id}/reject/` |
| GET | `/api/assignments/audit/` |
| GET | `/api/assignments/performance/` |

### Molalar
| Method | URL |
|--------|-----|
| GET / POST | `/api/breaks/` |
| PUT | `/api/breaks/{id}/end/` |

---

## Proje Yapısı

```
ShiftPilot/
├── config/              → Settings, URL routing, Celery
├── users/               → Kullanıcı modeli, JWT auth, izin sınıfları
├── tasks/               → Zone, Shift, Task, TaskSchedule, WorkSchedule
├── assignments/         → Assignment, TaskSubmission, RejectionLog, testler
├── breaks/              → Break modeli, Celery görevleri
├── requirements.txt
├── manage.py
│
└── frontend/
    ├── app/
    │   ├── login/               → Giriş sayfası
    │   ├── dashboard/           → Rol bazlı yönlendirme hub'ı
    │   ├── manager/
    │   │   ├── store/           → Dükkan genel görünümü
    │   │   ├── users/           → Kullanıcı yönetimi
    │   │   ├── tasks/           → Görev yönetimi
    │   │   ├── zones/           → Bölge yönetimi
    │   │   ├── assignments/     → Atama listesi (liste + haftalık görünüm)
    │   │   ├── schedule/        → Çalışma çizelgesi
    │   │   ├── breaks/          → Mola takibi + günlük ortalamalar
    │   │   ├── performance/     → Performans raporları
    │   │   └── audit/           → Denetim kaydı
    │   ├── supervisor/
    │   │   ├── page.tsx         → Bekleyen gönderimleri onayla / reddet
    │   │   ├── assignments/     → Atama görüntüleme (haftalık)
    │   │   ├── tasks/           → Görev listesi
    │   │   ├── zones/           → Bölge listesi
    │   │   ├── schedule/        → Çizelge görüntüleme
    │   │   └── breaks/          → Mola görüntüleme
    │   └── employee/
    │       ├── page.tsx         → Bugünün görevleri
    │       ├── history/         → Geçmiş atamalar
    │       ├── schedule/        → Kişisel çizelge
    │       ├── breaks/          → Mola geçmişi
    │       └── performance/     → Kişisel performans
    ├── components/
    │   ├── ui/                  → Button, Input, Modal, Badge, Spinner
    │   ├── layout/              → Navbar, Sidebar
    │   └── CameraCapture.tsx    → Kamera zorunluluğu bileşeni
    ├── contexts/AuthContext.tsx
    ├── services/                → API katmanı (axios + JWT interceptor)
    ├── lib/excel.ts             → Excel dışa aktarma
    └── types/index.ts           → TypeScript tip tanımları
```

---

## Önemli İş Kuralları

- **Fotoğraf zorunluluğu:** Kamera erişimi `capture="environment"` ile zorlanır, galeri seçimi engellenir.
- **İş yükü dengesi:** Atamada çalışanlar arası görev katsayısı toplamı %20'den fazla sapamaz.
- **Mola limiti:** Çalışanlar günde yalnızca bir kez yemek molası yapabilir (20 dk).
- **JWT:** 8 saatlik access token, 7 günlük refresh token. 401 hatasında silent refresh.
- **Rol koruması:** Her sayfa; Manager / Supervisor / Employee için ayrı layout guard içerir.

---

## Testler

```bash
# Tüm testleri çalıştır
python manage.py test

# Yalnızca atama testleri (23 test)
python manage.py test assignments.tests
```

Test kapsamı: görev atama → fotoğraflı gönderim → onay/red → denetim kaydı → performans görünümü.

---

## Git & Branch Stratejisi

```bash
# Yeni özellik
git checkout -b feature/ozellik-adi develop

# Commit formatı
feat(scope): kısa açıklama
fix(scope): hata düzeltme
refactor(scope): kod iyileştirme
```

---

## Lisans

MIT
