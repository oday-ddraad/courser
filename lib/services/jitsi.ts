/**
 * JaaS (Jitsi as a Service) Service with Debug Logging
 */
import crypto from 'crypto';

interface JaaSConfig {
  appId: string;
  privateKey: string;
  tenant: string;
}

interface JaaSJWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  nbf: number;
  iat: number;
  room: string;
  context: {
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      moderator?: boolean;
    };
    features?: Record<string, boolean>;
  };
}

class JaaSService {
  private config: JaaSConfig;

  constructor() {
    let privateKey = process.env.JAAS_PRIVATE_KEY || '';
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    this.config = {
      appId: process.env.JITSI_APP_ID || '',
      privateKey: privateKey,
      tenant: process.env.JAAS_TENANT || process.env.JITSI_APP_ID || '',
    };
  }

  isConfigured(): boolean {
    return !!(this.config.appId && this.config.privateKey);
  }

  getConfig() {
    return { ...this.config };
  }

  generateJaaSUserId(mongoUserId: string): string {
    const hash = crypto.createHash('sha256').update(mongoUserId).digest('hex').substring(0, 16);
    return `jaas_${hash}`;
  }

  private signWithRS256(header: string, payload: string): string {
    if (!this.config.privateKey) throw new Error('Private key missing');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${payload}`);
    return sign.sign(this.config.privateKey, 'base64url');
  }

  generateJWTToken(
    userId: string,
    jaasUserId: string,
    userName: string,
    userEmail: string,
    userAvatar?: string,
    isAdmin: boolean = false
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600;

    const payload: JaaSJWTPayload = {
      iss: this.config.tenant, // FIXED: Must be Tenant ID for JaaS
      sub: this.config.tenant,
      aud: 'jitsi',
      exp,
      nbf: now - 30,
      iat: now,
      room: '*',
      context: {
        user: {
          id: jaasUserId,
          name: userName,
          email: userEmail,
          avatar: userAvatar,
          moderator: isAdmin,
        },
        features: {
          livestreaming: true,
          recording: true,
          transcription: true,
          'outbound-call': false,
        },
      },
    };

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: `${this.config.tenant}/${this.config.appId.split('/').pop()}`, 
    };

    // DEBUG LOGS
    console.log('--- JaaS JWT DEBUG ---');
    console.log('KID:', header.kid);
    console.log('ISS:', payload.iss);
    console.log('TENANT:', this.config.tenant);
    console.log('----------------------');

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.signWithRS256(base64Header, base64Payload);

    return `${base64Header}.${base64Payload}.${signature}`;
  }
}

export const jaasService = new JaaSService();