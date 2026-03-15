export function generateVerificationEmail(
  name: string,
  verificationUrl: string,
  locale: 'en' | 'de' | 'ar' = 'en'
): { subject: string; html: string } {
  const translations = {
    en: {
      subject: 'Verify Your Email Address - NexaPath Academy',
      title: 'Email Verification',
      greeting: `Hello ${name},`,
      message: 'Thank you for signing up with NexaPath Academy! Please verify your email address by clicking the button below:',
      button: 'Verify Email',
      expires: 'This link will expire in 24 hours.',
      ignore: 'If you did not create an account, you can safely ignore this email.',
      footer: 'Best regards, NexaPath Academy Team',
    },
    de: {
      subject: 'Bestätigen Sie Ihre E-Mail-Adresse - NexaPath Academy',
      title: 'E-Mail-Verifizierung',
      greeting: `Hallo ${name},`,
      message: 'Vielen Dank für Ihre Anmeldung bei NexaPath Academy! Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf die Schaltfläche unten klicken:',
      button: 'E-Mail bestätigen',
      expires: 'Dieser Link läuft in 24 Stunden ab.',
      ignore: 'Wenn Sie kein Konto erstellt haben, können Sie diese E-Mail ignorieren.',
      footer: 'Mit freundlichen Grüßen, NexaPath Academy Team',
    },
    ar: {
      subject: 'تحقق من عنوان بريدك الإلكتروني - أكاديمية نيكساباث',
      title: 'التحقق من البريد الإلكتروني',
      greeting: `مرحباً ${name}،`,
      message: 'شكراً لتسجيلك في أكاديمية نيكساباث! يرجى التحقق من عنوان بريدك الإلكتروني بالنقر على الزر أدناه:',
      button: 'تحقق من البريد',
      expires: 'سينتهي صلاحية هذا الرابط خلال 24 ساعة.',
      ignore: 'إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد الإلكتروني بأمان.',
      footer: 'مع أطيب التحيات، فريق أكاديمية نيكساباث',
    },
  };

  const t = translations[locale];

  const html = `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .title {
      color: #2563eb;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      color: #4b5563;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .expires {
      color: #6b7280;
      font-size: 14px;
      text-align: center;
      margin-top: 20px;
    }
    .ignore {
      color: #9ca3af;
      font-size: 13px;
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
    }
    .brand {
      font-weight: bold;
      color: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">NEXAPATH</div>
      <h1 class="title">${t.title}</h1>
    </div>
    <div class="content">
      <p>${t.greeting}</p>
      <p>${t.message}</p>
    </div>
    <div class="button-container">
      <a href="${verificationUrl}" class="button">${t.button}</a>
    </div>
    <p class="expires">${t.expires}</p>
    <p class="ignore">${t.ignore}</p>
    <div class="footer">
      <p>${t.footer}</p>
      <p class="brand">NexaPath Academy</p>
    </div>
  </div>
</body>
</html>
  `;

  return {
    subject: t.subject,
    html,
  };
}
