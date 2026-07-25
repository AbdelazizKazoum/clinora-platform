# 🦷 Clinora

> Modern multi-tenant SaaS platform for dental clinics.

Clinora is a scalable, cloud-native platform designed to simplify the daily operations of dental clinics. It provides appointment scheduling, patient management, billing, treatment tracking, and real-time clinic operations through a modern microservices architecture.

---

## ✨ Features

- 👥 Multi-tenant architecture
- 🦷 Patient Management
- 📅 Appointment Scheduling
- ⏳ Queue Management
- 💳 Billing & Payments
- 📝 Treatment Plans
- 📂 Medical Records
- 👨‍⚕️ Staff Management
- 📈 Analytics Dashboard
- 🔔 Real-time Notifications
- 🌍 Multi-language Support
- 🔐 Role-Based Access Control (RBAC)

---

# Architecture

```
                +----------------------+
                |     Next.js Web      |
                +----------+-----------+
                           |
                    API Gateway (NestJS)
                           |
      +--------------------+--------------------+
      |                    |                    |
   Auth MS          Patient MS         Appointment MS
      |                    |                    |
      +---------+----------+----------+---------+
                |                     |
              NATS                gRPC
                |
        Other Business Services
```

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Material UI

### Backend

- NestJS
- TypeScript
- Microservices
- gRPC
- NATS

### Database

- MySQL

### Infrastructure

- Docker
- Docker Compose
- Kubernetes
- NGINX

### Authentication

- JWT
- Refresh Tokens
- Role-Based Access Control

---

## Planned Modules

- Authentication
- Clinic Management
- Staff Management
- Patient Management
- Appointment Management
- Queue Management
- Treatment Management
- Billing
- Reports & Analytics
- Notifications

---

## Project Structure

```
clinora-platform/
│
├── apps/
│   ├── web/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── patient-service/
│   ├── appointment-service/
│   ├── clinic-service/
│   ├── billing-service/
│   └── notification-service/
│
├── packages/
│   ├── shared/
│   ├── ui/
│   ├── config/
│   └── protobuf/
│
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── nginx/
│
└── docs/
```

---

## Roadmap

- [ ] Authentication
- [ ] Clinic Management
- [ ] Staff Management
- [ ] Patient Management
- [ ] Appointment Scheduling
- [ ] Queue Management
- [ ] Treatment Management
- [ ] Billing
- [ ] Reports
- [ ] Patient Portal
- [ ] Mobile Application

---

## Status

🚧 Currently under active development.

---

## License

This project is licensed under the MIT License.
