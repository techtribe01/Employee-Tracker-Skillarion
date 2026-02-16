# API Documentation

## SkillArion Employee Tracking System - API Reference

### Base URL
```
Production: https://app.skillariondevelopement.in/api
Development: http://localhost:3000/api
```

### Authentication
All API requests require authentication headers:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## System Endpoints

### Health Check
**GET** `/health`

Check if the application is running and accessible.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T10:30:00Z",
  "services": {
    "database": "up",
    "auth": "up"
  },
  "version": "1.0.0"
}
```

### System Status
**GET** `/status`

Get detailed system metrics and service status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T10:30:00Z",
  "uptime": 86400,
  "services": {
    "database": "up",
    "auth": "up",
    "api": "up"
  },
  "metrics": {
    "activeUsers": 45,
    "averageResponseTime": 245,
    "errorRate": 0.5
  },
  "version": "1.0.0"
}
```

---

## Authentication Endpoints

### Login
**POST** `/auth/login`

Authenticate user and get access token.

**Request:**
```json
{
  "email": "user@skillariondevelopement.in",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@skillariondevelopement.in",
    "role": "employee"
  }
}
```

### Verify Email
**POST** `/auth/verify-email`

Verify email with token.

**Request:**
```json
{
  "token": "verification_token"
}
```

**Response:**
```json
{
  "message": "Email verified successfully"
}
```

### 2FA Verify
**POST** `/auth/verify-2fa`

Verify two-factor authentication code.

**Request:**
```json
{
  "code": "123456",
  "deviceId": "device_uuid"
}
```

**Response:**
```json
{
  "verified": true,
  "message": "2FA code verified"
}
```

---

## Task Endpoints

### Get User Tasks
**GET** `/tasks?status=in_progress&limit=20&offset=0`

Retrieve tasks for authenticated user.

**Query Parameters:**
- `status`: Filter by status (not_started, in_progress, under_review, completed, verified)
- `priority`: Filter by priority (low, medium, high, urgent)
- `limit`: Pagination limit (default: 20)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Task title",
      "description": "Task description",
      "status": "in_progress",
      "priority": "high",
      "due_date": "2026-03-01T00:00:00Z",
      "assigned_to": "uuid",
      "created_at": "2026-02-16T10:00:00Z"
    }
  ],
  "count": 5,
  "total": 12
}
```

### Create Task (Admin Only)
**POST** `/tasks`

Create a new task.

**Request:**
```json
{
  "title": "New task",
  "description": "Task description",
  "assigned_to": "user_uuid",
  "priority": "high",
  "due_date": "2026-03-01T00:00:00Z",
  "estimated_hours": 8
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "New task",
  "status": "not_started",
  "created_at": "2026-02-16T10:30:00Z"
}
```

---

## Attendance Endpoints

### Clock In
**POST** `/attendance/clock-in`

Record clock-in time.

**Request:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "deviceInfo": "iPhone 14 Pro"
}
```

**Response:**
```json
{
  "id": "uuid",
  "timestamp": "2026-02-16T09:00:00Z",
  "type": "clock_in",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

### Get Attendance Records
**GET** `/attendance?from=2026-02-01&to=2026-02-28`

Retrieve attendance records for date range.

**Query Parameters:**
- `from`: Start date (ISO 8601)
- `to`: End date (ISO 8601)
- `user_id`: Filter by user (admin only)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "date": "2026-02-16",
      "clock_in": "09:00:00",
      "clock_out": "17:30:00",
      "total_hours": 8.5,
      "breaks": 0.5
    }
  ],
  "count": 20
}
```

---

## Leave Endpoints

### Submit Leave Request
**POST** `/leave-requests`

Submit a new leave request.

**Request:**
```json
{
  "leave_type": "casual",
  "start_date": "2026-03-01",
  "end_date": "2026-03-03",
  "reason": "Personal work"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "created_at": "2026-02-16T10:30:00Z"
}
```

### Get Leave Balance
**GET** `/leave-requests/balance`

Get remaining leave balance for user.

**Response:**
```json
{
  "casual": {
    "total": 12,
    "used": 3,
    "remaining": 9
  },
  "sick": {
    "total": 10,
    "used": 1,
    "remaining": 9
  }
}
```

---

## Analytics Endpoints

### Get Productivity Metrics
**GET** `/analytics/productivity?period=month`

Get productivity metrics for user or team.

**Query Parameters:**
- `period`: daily, weekly, monthly, quarterly
- `user_id`: Filter by user (optional)
- `department`: Filter by department (optional)

**Response:**
```json
{
  "completion_rate": 85.5,
  "avg_completion_time": 4.2,
  "quality_score": 4.2,
  "tasks_completed": 18,
  "tasks_total": 21
}
```

### Generate Report
**POST** `/reports/generate`

Generate a report.

**Request:**
```json
{
  "report_type": "monthly",
  "format": "pdf",
  "period": "2026-02",
  "include_metrics": ["attendance", "productivity", "tasks"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "generating",
  "download_url": "https://...",
  "created_at": "2026-02-16T10:30:00Z"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "code": "INVALID_REQUEST",
  "details": {}
}
```

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Rate Limiting

API requests are rate limited:
- **Default:** 100 requests per minute per IP
- **Authenticated:** 1000 requests per hour per user
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

**Last Updated:** February 16, 2026
**Version:** 1.0.0
