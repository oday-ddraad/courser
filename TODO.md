# New Signup Experience Implementation

## Branch: `blackboxai/new-signup-experience`

---

## ✅ COMPLETED

### Phase 1: User Model & Database Schema Updates ✅
- [x] Updated `lib/mongodb/models/User.ts`
  - [x] Added `provider` field ('credentials' | 'google')
  - [x] Added `googleId` field (sparse, unique)
  - [x] Added `firstName` and `lastName` fields
  - [x] Added `profileCompleted` boolean (default: false)
  - [x] Added `profileCompletedAt` Date
  - [x] Added structured `address` object (street, city, state, zipCode)
  - [x] Added `documents` array for file uploads
  - [x] Added email verification fields (token, expires, verified)
  - [x] Added `whatsappConsent` boolean and `whatsappConsentAt`
  - [x] Made `password` optional for OAuth users
  - [x] Updated indexes

### Phase 2: Google OAuth Configuration ✅
- [x] Updated `lib/auth/config.ts`
  - [x] Added GoogleProvider import
  - [x] Configured Google OAuth provider
  - [x] Handle OAuth sign-in callback (create user if new)
  - [x] Set provider type in user record
- [x] Updated `types/database.ts` with new session/JWT types

### Phase 3: Secure File Upload System ✅
- [x] Created `lib/upload/config.ts` - Upload configuration
- [x] Created `app/api/upload/route.ts` - Authenticated file upload API
- [x] Created `app/api/file/[...path]/route.ts` - Secure file serving API
- [x] Created `uploads/` directory (outside public)
- [x] File validation (max 5MB, types: pdf, jpg, png, webp)
- [x] Ownership checks in file serving

### Phase 4: Email Verification System ✅
- [x] Created `lib/email/templates/verify-email.ts`
- [x] Created `app/api/auth/verify-email/route.ts` - Send verification email
- [x] Created `app/api/auth/verify-email/confirm/route.ts` - Confirm token
- [x] Created `app/[locale]/verify-email/page.tsx` - Verification landing page

### Phase 5: Profile Completion Page & API ✅
- [x] Created `app/[locale]/complete-profile/page.tsx`
- [x] Created `components/auth/ProfileCompletionForm.tsx`
  - [x] Step 1: Personal Info (firstName, lastName, country)
  - [x] Step 2: Contact (email verification for non-Google, phone + WhatsApp OTP)
  - [x] Step 3: Address (street, city, state, zip)
  - [x] Step 4: Documents (secure file upload with document type dropdown)
    - [x] Fixed document type options: National ID, Passport, Certificate, Other
    - [x] Custom name input for "Other" option
    - [x] Multi-language support for document types

  - [x] Step 5: WhatsApp Consent
- [x] Created `app/api/profile/complete/route.ts` - Save profile data

### Phase 6: Middleware & Redirect Flow ✅
- [x] Updated `middleware.ts`
  - [x] Check `profileCompleted` flag after authentication
  - [x] Redirect to `/complete-profile` if incomplete
  - [x] Allow access to verification and profile pages

### Phase 7: Update Existing Components ✅
- [x] Updated `app/api/register/route.ts`
  - [x] Set `profileCompleted: false` for new registrations
  - [x] Set `provider: 'credentials'` for email/password users
- [x] Updated `components/auth/SignupForm.tsx`
  - [x] Added "Sign up with Google" button
  - [x] Style with Google branding
- [x] Updated `components/auth/LoginForm.tsx`
  - [x] Added "Continue with Google" button
  - [x] Redirect to dashboard after login (middleware handles profile check)

---

## 🔄 REMAINING TASKS

### Phase 8: Internationalization ✅
- [x] Update `messages/en.json`
  - [x] Profile completion translations
  - [x] Email verification messages
  - [x] File upload instructions
  - [x] Consent language
- [x] Update `messages/de.json`
- [x] Update `messages/ar.json`


### Phase 9: Testing & Security Review
- [ ] Test Google OAuth flow
- [ ] Test email/password registration with verification
- [ ] Test file upload security (unauthorized access attempts)
- [ ] Test profile completion flow
- [ ] Test WhatsApp OTP integration
- [ ] Verify middleware redirects work correctly

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Add to `.env.local`:
```env
# Google OAuth (Required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Existing (should already be set)
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
JWT_LIFESPAN=86400

# Email (for verification emails)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure consent screen (External for testing)
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env.local`

### 4. Create Uploads Directory (Already Done)
```bash
mkdir -p uploads/documents
```

### 5. Run Development Server
```bash
npm run dev
```

---

## 📋 User Flow

### Email/Password Registration:
1. User registers at `/register`
2. User created with `profileCompleted: false`
3. User redirected to `/login`
4. After login, middleware checks `profileCompleted`
5. Redirected to `/complete-profile`
6. Step 1: Fill personal info
7. Step 2: Verify email (click link sent to email)
8. Step 3: Fill address (optional)
9. Step 4: Upload documents (optional)
10. Step 5: Give WhatsApp consent
11. Profile saved, `profileCompleted: true`
12. Redirected to dashboard

### Google OAuth Registration:
1. User clicks "Sign up with Google"
2. Google account selected
3. User created with `profileCompleted: false`, `emailVerified: true`
4. Redirected to `/complete-profile`
5. Skip email verification (already verified by Google)
6. Complete remaining steps
7. Redirected to dashboard

---

## 🔒 Security Features

- **File Uploads**: Stored outside web root (`/uploads/`), served via authenticated API
- **File Access**: Users can only access their own files, admins can access all
- **Email Verification**: 24-hour expiry token, one-time use
- **Profile Enforcement**: Middleware ensures incomplete profiles can't access protected routes
- **OAuth Security**: State parameter handled by NextAuth.js

---

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/verify-email` | POST | Send verification email |
| `/api/auth/verify-email/confirm` | GET | Confirm email verification |
| `/api/profile/complete` | GET | Get profile status |
| `/api/profile/complete` | POST | Save profile data |
| `/api/upload` | POST | Upload document |
| `/api/file/[...path]` | GET | Serve file (authenticated) |

---

## 📁 Files Created/Modified

### New Files:
```
lib/upload/config.ts
lib/email/templates/verify-email.ts
app/api/upload/route.ts
app/api/file/[...path]/route.ts
app/api/auth/verify-email/route.ts
app/api/auth/verify-email/confirm/route.ts
app/api/profile/complete/route.ts
app/[locale]/verify-email/page.tsx
app/[locale]/complete-profile/page.tsx
components/auth/ProfileCompletionForm.tsx
.env.local.example
NEW_SIGNUP_EXPERIENCE_SUMMARY.md
```

### Modified Files:
```
lib/mongodb/models/User.ts
lib/auth/config.ts
types/database.ts
middleware.ts
app/api/register/route.ts
components/auth/SignupForm.tsx
components/auth/LoginForm.tsx
TODO.md
```

---

## 🌐 Git Commands

```bash
# Create and switch to new branch
git checkout -b blackboxai/new-signup-experience

# Add all new and modified files
git add .

# Commit with descriptive message
git commit -m "feat: implement new signup experience with Google OAuth and profile completion

- Add Google OAuth provider with NextAuth.js
- Create multi-step profile completion flow (5 steps)
- Implement secure file upload system outside public directory
- Add email verification system with 24h tokens
- Update User model with OAuth and profile fields
- Add middleware protection for incomplete profiles
- Update SignupForm and LoginForm with Google buttons
- Create API endpoints for profile, upload, and verification
- Add email templates in 3 languages (EN, DE, AR)"

# Push to remote
git push -u origin blackboxai/new-signup-experience
