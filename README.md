# Task Management System – Backend API

## Overview

This backend API powers a secure Task Management System built with NestJS and MongoDB. 
It provides authentication, authorization, and task management with strong security practices.

---

## Live Deployment

**Production URL** : https://task-management-system-backend-delta.vercel.app/

**GitHub Repository** : https://github.com/NipunBasnayake/Task-Management-System-Backend.git

---

## Tech Stack

- NestJS  
- TypeScript  
- MongoDB Atlas  
- JWT Authentication (Access + Refresh)  
- HttpOnly Cookies  
- Rate Limiting  
- DTO Validation (class-validator)  

---

## Features

### Authentication

- `POST /auth/register` – User registration (password hashing)  
- `POST /auth/login` – Login & issue JWT tokens  
- `POST /auth/refresh` – Refresh access token  
- `POST /auth/logout`  

### Tasks

- `GET /tasks`  
- `POST /tasks`  
- `PUT /tasks/:id`  
- `DELETE /tasks/:id`  

Users can only access and modify their own tasks.  
Ownership is enforced via JWT guard.

---

## Security Highlights

- Password hashing (bcrypt/argon2)  
- Access & Refresh tokens  
- HttpOnly secure cookies  
- Rate limiting (login protection)  
- DTO validation with whitelist mode  
- CORS configuration  
- No stack trace leaks in responses  

---

## Environment Variables

Create a `.env` file using the following template:

```env
PORT=3001
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database-name>?retryWrites=true&w=majority

JWT_ACCESS_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# DEVELOPMENT CONFIGURATION
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
COOKIE_SAMESITE=
COOKIE_SECURE=
COOKIE_PARTITIONED=false

# PRODUCTION CONFIGURATION
# NODE_ENV=production
# CORS_ORIGIN=frontend-production-url
# COOKIE_SAMESITE=none
# COOKIE_SECURE=true
# COOKIE_PARTITIONED=false
```

## Local Setup
Clone the repository
```bash
git clone https://github.com/NipunBasnayake/Task-Management-System-Backend.git
cd Task-Management-System-Backend
```
Install dependencies
```bash
npm install
```

Configure environment variables

Create a ```.env``` file based on ```.env.example```.

Run the server
```
npm run start:dev
```

Server runs on:
```
http://localhost:3001
```

## Deployment

The API is deployed on Vercel.

### Production Configuration
```
NODE_ENV=production
```
- Secure cookies enabled
- Proper CORS origin set to frontend URL
