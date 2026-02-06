# Maryland (MathAdventure) — Backend

Backend API for an e-learning platform:
- Students and Teachers  
- Lessons + video chapters  
- Quizzes/Quests + progress tracking  
- Paid subscriptions via Stripe  
- Media uploads via AWS S3  

## Requirements
- Node.js (recommended: 22+)
- MongoDB (Atlas or local)
- (Optional) Stripe account (for subscriptions)
- (Optional) AWS S3 (for uploads)
- (Optional) SMTP email account (for verification/reset emails)

## Setup

### 1) Install
```bash
npm install
```

### 2) Create environment file
```bash
cp .env.example .env
```

### 3) Fill `.env`
Minimum to start the server:
- MONGO_URI  
- PORT  
- JWT_SECRET  

If you want full functionality:
- Email: SMTP_USER, SMTP_PASS, BASE_URL, FRONTEND_URL  
- S3 uploads: AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY  
- Stripe: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET  

### 4) Run (dev)
```bash
npm run dev
```

API base:
- http://localhost:<PORT>/api/v1  

Stripe webhook endpoint:
- http://localhost:<PORT>/stripe/webhook  

## Deployment (simple)

Set the same `.env` on the server.

Install deps:
```bash
npm ci
```

Start with PM2:
```bash
pm2 start index.js --name maryland-backend
pm2 save
```

## Notes
- Admin access is based on a user with role: "admin" (no separate Admin model).
- Payments are recorded in `billinghistories` after Stripe webhook `invoice.payment_succeeded`.
