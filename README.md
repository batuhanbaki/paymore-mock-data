# Paymore API Documentation

## Base URL
```
**Mock API Base URL:** https://paymore-mock-data.onrender.com
> Tüm istekler bu base URL üzerinden yapılacaktır.
```

## Authentication
Tüm endpoint'ler (login hariç) `Authorization` header'ında Bearer token gerektirir:
```
Authorization: Bearer {access_token}
```

---

## 1. Authentication

### 1.1 Login
Kullanıcı girişi için kullanılır.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "info@paymoredemo.com",
  "password": "Password123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123456",
      "name": "Ahmet Yılmaz",
      "email": "info@paymoredemo.com",
      "merchantId": "PM-2024-MER-001",
      "role": "Admin"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "E-posta veya şifre hatalı"
  }
}
```

### 1.2 Refresh Token
Access token yenilemek için kullanılır.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 1.3 Logout
Kullanıcı çıkışı için kullanılır.

**Endpoint:** `POST /auth/logout`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Başarıyla çıkış yapıldı"
}
```

---

## 2. Dashboard (Home Page)

### 2.1 Get Dashboard Stats
Ana sayfa için günlük istatistikleri getirir.

**Endpoint:** `GET /dashboard/stats`

**Query Parameters:**
- `date` (optional): YYYY-MM-DD formatında tarih (default: bugün)
- `period` (optional): daily, weekly, monthly (default: daily)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "dailySales": {
      "value": 24567.50,
      "currency": "TRY",
      "change": 12.5,
      "isPositive": true
    },
    "transactionCount": {
      "value": 1234,
      "change": 8.2,
      "isPositive": true
    },
    "averageTransaction": {
      "value": 19.91,
      "currency": "TRY",
      "change": -2.3,
      "isPositive": false
    },
    "activeTerminals": {
      "value": 18,
      "total": 25,
      "change": 0,
      "isPositive": true
    }
  }
}
```

### 2.2 Get Recent Transactions
Son işlemleri getirir.

**Endpoint:** `GET /dashboard/recent-transactions`

**Query Parameters:**
- `limit` (optional): Sonuç sayısı (default: 10, max: 50)
- `offset` (optional): Sayfalama için offset (default: 0)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123456",
        "terminalId": "term_001",
        "terminalName": "Terminal 01",
        "amount": 234.50,
        "currency": "TRY",
        "type": "SALE",
        "status": "SUCCESS",
        "timestamp": "2024-01-15T10:23:45Z",
        "cardType": "CREDIT",
        "maskedCardNumber": "****1234"
      },
      {
        "id": "txn_123457",
        "terminalId": "term_003",
        "terminalName": "Terminal 03",
        "amount": 89.00,
        "currency": "TRY",
        "type": "SALE",
        "status": "SUCCESS",
        "timestamp": "2024-01-15T10:18:32Z",
        "cardType": "DEBIT",
        "maskedCardNumber": "****5678"
      },
      {
        "id": "txn_123458",
        "terminalId": "term_001",
        "terminalName": "Terminal 01",
        "amount": 123.00,
        "currency": "TRY",
        "type": "REFUND",
        "status": "SUCCESS",
        "timestamp": "2024-01-15T10:05:12Z",
        "cardType": "CREDIT",
        "maskedCardNumber": "****9012"
      }
    ],
    "pagination": {
      "total": 156,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## 3. Statistics

### 3.1 Get Transaction Statistics
Belirli dönem için işlem istatistiklerini getirir.

**Endpoint:** `GET /statistics/transactions`

**Query Parameters:**
- `startDate` (required): YYYY-MM-DD
- `endDate` (required): YYYY-MM-DD
- `groupBy` (optional): hour, day, week, month (default: day)
- `terminalId` (optional): Belirli terminal için filtreleme

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31",
      "groupBy": "day"
    },
    "summary": {
      "totalSales": 856742.50,
      "totalTransactions": 12456,
      "averageTransaction": 68.78,
      "currency": "TRY"
    },
    "chartData": [
      {
        "date": "2024-01-01",
        "sales": 24567.50,
        "transactions": 345,
        "average": 71.20
      },
      {
        "date": "2024-01-02",
        "sales": 28932.75,
        "transactions": 412,
        "average": 70.23
      }
    ],
    "topTerminals": [
      {
        "terminalId": "term_001",
        "terminalName": "Terminal 01",
        "totalSales": 125678.90,
        "transactionCount": 1823,
        "percentage": 14.67
      },
      {
        "terminalId": "term_003",
        "terminalName": "Terminal 03",
        "totalSales": 98234.50,
        "transactionCount": 1456,
        "percentage": 11.46
      }
    ]
  }
}
```

### 3.2 Get Payment Method Statistics
Ödeme yöntemi dağılımını getirir.

**Endpoint:** `GET /statistics/payment-methods`

**Query Parameters:**
- `startDate` (required): YYYY-MM-DD
- `endDate` (required): YYYY-MM-DD

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentMethods": [
      {
        "method": "CREDIT_CARD",
        "displayName": "Kredi Kartı",
        "count": 8456,
        "totalAmount": 645234.50,
        "percentage": 65.5
      },
      {
        "method": "DEBIT_CARD",
        "displayName": "Banka Kartı",
        "count": 3123,
        "totalAmount": 198765.30,
        "percentage": 28.3
      },
      {
        "method": "CONTACTLESS",
        "displayName": "Temassız",
        "count": 876,
        "totalAmount": 45234.20,
        "percentage": 6.2
      }
    ]
  }
}
```

### 3.3 Get Hourly Statistics
Saatlik işlem dağılımını getirir.

**Endpoint:** `GET /statistics/hourly`

**Query Parameters:**
- `date` (required): YYYY-MM-DD

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "hourlyData": [
      {
        "hour": 9,
        "sales": 12456.50,
        "transactions": 145
      },
      {
        "hour": 10,
        "sales": 18234.75,
        "transactions": 234
      },
      {
        "hour": 11,
        "sales": 23567.90,
        "transactions": 289
      }
    ],
    "peakHour": {
      "hour": 13,
      "sales": 34567.80,
      "transactions": 412
    }
  }
}
```

---

## 4. Terminal Management

### 4.1 Get All Terminals
Tüm terminalleri listeler.

**Endpoint:** `GET /terminals`

**Query Parameters:**
- `status` (optional): active, inactive, maintenance, all (default: all)
- `limit` (optional): Sonuç sayısı (default: 20)
- `offset` (optional): Sayfalama için offset (default: 0)
- `search` (optional): Terminal adı veya ID'si ile arama

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "terminals": [
      {
        "id": "term_001",
        "name": "Terminal 01",
        "serialNumber": "PAY-2024-T001",
        "model": "Paymore Pro X1",
        "status": "ACTIVE",
        "location": "Kasa 1 - Giriş",
        "lastTransaction": "2024-01-15T10:23:45Z",
        "dailyTransactions": 145,
        "dailySales": 12456.50,
        "battery": 87,
        "signalStrength": 95,
        "firmwareVersion": "2.4.1",
        "activationDate": "2024-01-01T00:00:00Z"
      },
      {
        "id": "term_002",
        "name": "Terminal 02",
        "serialNumber": "PAY-2024-T002",
        "model": "Paymore Pro X1",
        "status": "ACTIVE",
        "location": "Kasa 2 - Merkez",
        "lastTransaction": "2024-01-15T10:15:32Z",
        "dailyTransactions": 98,
        "dailySales": 8234.25,
        "battery": 45,
        "signalStrength": 82,
        "firmwareVersion": "2.4.1",
        "activationDate": "2024-01-01T00:00:00Z"
      },
      {
        "id": "term_003",
        "name": "Terminal 03",
        "serialNumber": "PAY-2024-T003",
        "model": "Paymore Lite",
        "status": "MAINTENANCE",
        "location": "Kasa 3 - Çıkış",
        "lastTransaction": "2024-01-14T18:45:12Z",
        "dailyTransactions": 0,
        "dailySales": 0,
        "battery": 0,
        "signalStrength": 0,
        "firmwareVersion": "2.3.8",
        "activationDate": "2024-01-05T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "summary": {
      "total": 25,
      "active": 18,
      "inactive": 5,
      "maintenance": 2
    }
  }
}
```

### 4.2 Get Terminal Details
Belirli bir terminalin detaylarını getirir.

**Endpoint:** `GET /terminals/{terminalId}`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "term_001",
    "name": "Terminal 01",
    "serialNumber": "PAY-2024-T001",
    "model": "Paymore Pro X1",
    "status": "ACTIVE",
    "location": "Kasa 1 - Giriş",
    "lastTransaction": "2024-01-15T10:23:45Z",
    "dailyTransactions": 145,
    "dailySales": 12456.50,
    "battery": 87,
    "signalStrength": 95,
    "firmwareVersion": "2.4.1",
    "activationDate": "2024-01-01T00:00:00Z",
    "hardware": {
      "manufacturer": "Paymore",
      "model": "Pro X1",
      "serialNumber": "PAY-2024-T001",
      "imei": "123456789012345"
    },
    "network": {
      "connectionType": "4G",
      "ipAddress": "192.168.1.45",
      "provider": "Turkcell"
    },
    "recentTransactions": [
      {
        "id": "txn_123456",
        "amount": 234.50,
        "type": "SALE",
        "status": "SUCCESS",
        "timestamp": "2024-01-15T10:23:45Z"
      }
    ],
    "statistics": {
      "today": {
        "transactions": 145,
        "sales": 12456.50
      },
      "week": {
        "transactions": 876,
        "sales": 67823.40
      },
      "month": {
        "transactions": 3456,
        "sales": 234567.80
      }
    }
  }
}
```

### 4.3 Add New Terminal
Yeni terminal ekler.

**Endpoint:** `POST /terminals`

**Request Body:**
```json
{
  "name": "Terminal 04",
  "serialNumber": "PAY-2024-T004",
  "model": "Paymore Pro X1",
  "location": "Kasa 4 - Üst Kat",
  "imei": "123456789012346"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "term_004",
    "name": "Terminal 04",
    "serialNumber": "PAY-2024-T004",
    "model": "Paymore Pro X1",
    "status": "INACTIVE",
    "location": "Kasa 4 - Üst Kat",
    "activationDate": "2024-01-15T10:30:00Z",
    "activationCode": "ACT-1234-5678-9012"
  },
  "message": "Terminal başarıyla eklendi"
}
```

### 4.4 Update Terminal
Terminal bilgilerini günceller.

**Endpoint:** `PUT /terminals/{terminalId}`

**Request Body:**
```json
{
  "name": "Terminal 01 - Güncellenmiş",
  "location": "Kasa 1 - Yeni Lokasyon",
  "status": "ACTIVE"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "term_001",
    "name": "Terminal 01 - Güncellenmiş",
    "location": "Kasa 1 - Yeni Lokasyon",
    "status": "ACTIVE",
    "updatedAt": "2024-01-15T10:35:00Z"
  },
  "message": "Terminal başarıyla güncellendi"
}
```

### 4.5 Delete Terminal
Terminali siler (soft delete).

**Endpoint:** `DELETE /terminals/{terminalId}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Terminal başarıyla silindi"
}
```

### 4.6 Restart Terminal
Terminali uzaktan yeniden başlatır.

**Endpoint:** `POST /terminals/{terminalId}/restart`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Terminal yeniden başlatma komutu gönderildi",
  "data": {
    "commandId": "cmd_789012",
    "status": "PENDING",
    "sentAt": "2024-01-15T10:40:00Z"
  }
}
```

### 4.7 Update Terminal Firmware
Terminal yazılımını günceller.

**Endpoint:** `POST /terminals/{terminalId}/update-firmware`

**Request Body:**
```json
{
  "version": "2.5.0"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Firmware güncelleme başlatıldı",
  "data": {
    "currentVersion": "2.4.1",
    "targetVersion": "2.5.0",
    "updateId": "upd_345678",
    "estimatedTime": 300
  }
}
```

---

## 5. Profile Management

### 5.1 Get Merchant Profile
Merchant bilgilerini getirir.

**Endpoint:** `GET /profile/merchant`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "merchantId": "PM-2024-MER-001",
    "businessName": "Paymore Demo Mağaza",
    "contactPerson": "Ahmet Yılmaz",
    "email": "info@paymoredemo.com",
    "phone": "+90 532 123 4567",
    "address": "Maslak Mahallesi, Büyükdere Cad. No:123 Sarıyer/İstanbul",
    "activeTerminals": 5,
    "totalTerminals": 8,
    "registrationDate": "2024-01-15T00:00:00Z",
    "status": "ACTIVE",
    "taxId": "1234567890",
    "businessType": "RETAIL"
  }
}
```

### 5.2 Update Merchant Profile
Merchant bilgilerini günceller.

**Endpoint:** `PUT /profile/merchant`

**Request Body:**
```json
{
  "businessName": "Paymore Demo Mağaza - Yeni",
  "contactPerson": "Ahmet Yılmaz",
  "email": "info@paymoredemo.com",
  "phone": "+90 532 123 4567",
  "address": "Yeni adres bilgisi"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "merchantId": "PM-2024-MER-001",
    "businessName": "Paymore Demo Mağaza - Yeni",
    "updatedAt": "2024-01-15T10:45:00Z"
  },
  "message": "Profil başarıyla güncellendi"
}
```

### 5.3 Change Password
Kullanıcı şifresini değiştirir.

**Endpoint:** `POST /profile/change-password`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Şifre başarıyla değiştirildi"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "PASSWORD_MISMATCH",
    "message": "Mevcut şifre hatalı"
  }
}
```

### 5.4 Get Team Members
Ekip üyelerini listeler.

**Endpoint:** `GET /profile/team`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "usr_001",
        "name": "Ahmet Yılmaz",
        "email": "ahmet@paymoredemo.com",
        "role": "ADMIN",
        "status": "ACTIVE",
        "createdAt": "2024-01-01T00:00:00Z",
        "lastLogin": "2024-01-15T09:30:00Z",
        "permissions": [
          "DASHBOARD_VIEW",
          "TERMINALS_MANAGE",
          "USERS_MANAGE",
          "REPORTS_VIEW"
        ]
      },
      {
        "id": "usr_002",
        "name": "Zeynep Kaya",
        "email": "zeynep@paymoredemo.com",
        "role": "MANAGER",
        "status": "ACTIVE",
        "createdAt": "2024-01-05T00:00:00Z",
        "lastLogin": "2024-01-15T08:45:00Z",
        "permissions": [
          "DASHBOARD_VIEW",
          "TERMINALS_VIEW",
          "REPORTS_VIEW"
        ]
      },
      {
        "id": "usr_003",
        "name": "Mehmet Demir",
        "email": "mehmet@paymoredemo.com",
        "role": "OPERATOR",
        "status": "INACTIVE",
        "createdAt": "2024-01-10T00:00:00Z",
        "lastLogin": "2024-01-12T16:20:00Z",
        "permissions": [
          "DASHBOARD_VIEW"
        ]
      }
    ],
    "total": 3
  }
}
```

### 5.5 Add Team Member
Yeni ekip üyesi ekler.

**Endpoint:** `POST /profile/team`

**Request Body:**
```json
{
  "name": "Ali Kara",
  "email": "ali@paymoredemo.com",
  "role": "OPERATOR",
  "permissions": [
    "DASHBOARD_VIEW",
    "TERMINALS_VIEW"
  ],
  "sendInvitation": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "usr_004",
    "name": "Ali Kara",
    "email": "ali@paymoredemo.com",
    "role": "OPERATOR",
    "status": "PENDING",
    "invitationSent": true,
    "invitationExpiry": "2024-01-22T10:50:00Z",
    "createdAt": "2024-01-15T10:50:00Z"
  },
  "message": "Kullanıcı başarıyla eklendi ve davetiye gönderildi"
}
```

### 5.6 Update Team Member
Ekip üyesini günceller.

**Endpoint:** `PUT /profile/team/{userId}`

**Request Body:**
```json
{
  "name": "Ali Kara",
  "role": "MANAGER",
  "status": "ACTIVE",
  "permissions": [
    "DASHBOARD_VIEW",
    "TERMINALS_VIEW",
    "REPORTS_VIEW"
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_004",
    "name": "Ali Kara",
    "role": "MANAGER",
    "status": "ACTIVE",
    "updatedAt": "2024-01-15T10:55:00Z"
  },
  "message": "Kullanıcı başarıyla güncellendi"
}
```

### 5.7 Delete Team Member
Ekip üyesini siler.

**Endpoint:** `DELETE /profile/team/{userId}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla silindi"
}
```

---

## 6. Notifications

### 6.1 Get Notifications
Bildirimleri listeler.

**Endpoint:** `GET /notifications`

**Query Parameters:**
- `limit` (optional): Sonuç sayısı (default: 20)
- `offset` (optional): Sayfalama için offset (default: 0)
- `unreadOnly` (optional): Sadece okunmamışlar (true/false)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_001",
        "type": "TRANSACTION",
        "title": "Yüksek Tutarlı İşlem",
        "message": "Terminal 01'de 5.000 TL üzerinde işlem gerçekleştirildi",
        "isRead": false,
        "createdAt": "2024-01-15T10:23:45Z",
        "priority": "HIGH",
        "metadata": {
          "terminalId": "term_001",
          "transactionId": "txn_123456",
          "amount": 5234.50
        }
      },
      {
        "id": "notif_002",
        "type": "TERMINAL_STATUS",
        "title": "Terminal Bağlantı Sorunu",
        "message": "Terminal 03 bağlantısı kesildi",
        "isRead": false,
        "createdAt": "2024-01-15T09:45:12Z",
        "priority": "MEDIUM",
        "metadata": {
          "terminalId": "term_003"
        }
      },
      {
        "id": "notif_003",
        "type": "SYSTEM",
        "title": "Bakım Bildirimi",
        "message": "Yarın saat 02:00-04:00 arası sistem bakımı yapılacaktır",
        "isRead": true,
        "createdAt": "2024-01-14T14:30:00Z",
        "priority": "LOW"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "unreadCount": 12
  }
}
```

### 6.2 Mark Notification as Read
Bildirimi okundu olarak işaretler.

**Endpoint:** `PUT /notifications/{notificationId}/read`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bildirim okundu olarak işaretlendi"
}
```

### 6.3 Mark All Notifications as Read
Tüm bildirimleri okundu olarak işaretler.

**Endpoint:** `PUT /notifications/read-all`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Tüm bildirimler okundu olarak işaretlendi"
}
```

---

## 7. Reports

### 7.1 Generate Report
Rapor oluşturur.

**Endpoint:** `POST /reports/generate`

**Request Body:**
```json
{
  "type": "DAILY_SALES",
  "format": "PDF",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "filters": {
    "terminalIds": ["term_001", "term_002"],
    "includeRefunds": true
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reportId": "rep_123456",
    "status": "PROCESSING",
    "estimatedTime": 30,
    "createdAt": "2024-01-15T11:00:00Z"
  },
  "message": "Rapor oluşturuluyor"
}
```

### 7.2 Get Report Status
Rapor durumunu kontrol eder.

**Endpoint:** `GET /reports/{reportId}`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reportId": "rep_123456",
    "type": "DAILY_SALES",
    "format": "PDF",
    "status": "COMPLETED",
    "downloadUrl": "https://api.paymore.com/v1/reports/rep_123456/download",
    "expiresAt": "2024-01-22T11:00:00Z",
    "createdAt": "2024-01-15T11:00:00Z",
    "completedAt": "2024-01-15T11:00:45Z"
  }
}
```

---

## Common Error Codes

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Hata mesajı"
  }
}
```

### Error Code List:
- `INVALID_CREDENTIALS` - Geçersiz kimlik bilgileri
- `UNAUTHORIZED` - Yetkisiz erişim
- `FORBIDDEN` - İşlem için yetki yok
- `NOT_FOUND` - Kaynak bulunamadı
- `VALIDATION_ERROR` - Doğrulama hatası
- `TERMINAL_OFFLINE` - Terminal çevrimdışı
- `INSUFFICIENT_BALANCE` - Yetersiz bakiye
- `TRANSACTION_FAILED` - İşlem başarısız
- `NETWORK_ERROR` - Ağ hatası
- `SERVER_ERROR` - Sunucu hatası
- `RATE_LIMIT_EXCEEDED` - İstek limiti aşıldı

---

## Rate Limiting

API'ye yapılan istekler rate limit'e tabidir:
- **Standard tier**: 100 istek/dakika
- **Premium tier**: 500 istek/dakika

Rate limit aşıldığında `429 Too Many Requests` hatası döner:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Çok fazla istek. Lütfen 60 saniye sonra tekrar deneyin.",
    "retryAfter": 60
  }
}
```

---

## Webhook Events (Optional)

Backend, önemli olaylar için webhook gönderilebilir:

### Webhook Payload Format:
```json
{
  "eventId": "evt_123456",
  "eventType": "transaction.completed",
  "timestamp": "2024-01-15T10:23:45Z",
  "data": {
    "transactionId": "txn_123456",
    "terminalId": "term_001",
    "amount": 234.50,
    "status": "SUCCESS"
  },
  "signature": "sha256_hash_of_payload"
}
```

### Event Types:
- `transaction.completed` - İşlem tamamlandı
- `transaction.failed` - İşlem başarısız
- `transaction.refunded` - İşlem iade edildi
- `terminal.connected` - Terminal bağlandı
- `terminal.disconnected` - Terminal bağlantısı kesildi
- `terminal.low_battery` - Terminal bataryası düşük
- `user.created` - Kullanıcı oluşturuldu
- `user.deleted` - Kullanıcı silindi

---

## Pagination Standard

Tüm liste endpoint'leri aynı sayfalama formatını kullanır:

**Query Parameters:**
- `limit`: Sayfa başına kayıt sayısı (default: 20, max: 100)
- `offset`: Atlanacak kayıt sayısı (default: 0)

**Response Format:**
```json
{
  "data": {
    "items": [...],
    "pagination": {
      "total": 256,
      "limit": 20,
      "offset": 40,
      "hasMore": true
    }
  }
}
```

---

## Date/Time Format

Tüm tarih ve saat değerleri ISO 8601 formatında UTC timezone'da gönderilir:
```
2024-01-15T10:23:45Z
```

---

## Currency Format

Tüm para değerleri decimal olarak gönderilir:
```json
{
  "amount": 1234.56,
  "currency": "TRY"
}
```

Desteklenen para birimleri: TRY, USD, EUR
