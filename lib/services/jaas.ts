import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface JaaSConfig {
  appId: string;
  apiKeyId: string;
  privateKey: string;
  domain: string;
}

export class JaaSService {
  private config: JaaSConfig;

  constructor() {
    const appId = process.env.JAAS_APP_ID || process.env.JITSI_APP_ID || '';
    // The API Key ID - CRITICAL: This must match exactly what's in JaaS console
    // Format from JaaS: vpaas-magic-cookie-xxx/yyyy (where yyy is the key ID)
    const apiKeyId = process.env.JAAS_API_KEY_ID || appId;
    
    // Load private key from file or env
    let privateKey = '';
    const keyFilePath = path.join(process.cwd(), 'keys', 'jitsiprivateKey.pem');
    
    try {
      if (fs.existsSync(keyFilePath)) {
        privateKey = fs.readFileSync(keyFilePath, 'utf-8');
        console.log('✓ Loaded private key from file');
      } else {
        let privateKeyRaw = process.env.JAAS_PRIVATE_KEY || '';
        privateKeyRaw = privateKeyRaw.replace(/^["']|["']$/g, '').trim();
        privateKeyRaw = privateKeyRaw.replace(/\\n/g, '\n');
        privateKey = privateKeyRaw;
        console.log('✓ Loaded private key from env');
      }
    } catch (error) {
      console.error('✗ Error loading private key:', error);
    }

    this.config = {
      appId,
      apiKeyId,
      privateKey,
      domain: '8x8.vc',
    };

    console.log('JaaS Config:', {
      appId: this.config.appId,
      apiKeyId: this.config.apiKeyId,
      isConfigured: this.isConfigured(),
    });
  }

  isConfigured(): boolean {
    return !!(this.config.appId && this.config.privateKey);
  }

  getConfig(): JaaSConfig {
    return { ...this.config };
  }

  generateJaaSUserId(mongoUserId: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(mongoUserId)
      .digest('hex')
      .substring(0, 16);
    return `jaas_${hash}`;
  }

  /**
   * Generate JWT token with the correct kid format
   * The kid MUST match the API Key ID from JaaS console exactly
   */
  generateJWTToken(
    userId: string,
    jaasUserId: string,
    userName: string,
    userEmail: string,
    isModerator: boolean = false
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600;

    // CRITICAL: kid must be the API Key ID from JaaS console
    // Common formats:
    // - vpaas-magic-cookie-xxx/yyyy (full path with key ID)
    // - vpaas-magic-cookie-xxx (just the app ID)
    // - just the key ID portion: yyy
    
    // Try to extract just the key ID if the full format is provided
    let kid = this.config.apiKeyId;
    
    // If apiKeyId contains a slash, use it as-is (it's likely the full format)
    // Otherwise, try constructing it
    if (!kid.includes('/') && kid.includes('vpaas-magic-cookie')) {
      // If it's just the appId without the key ID portion, we need the key ID
      // The user needs to provide the full apiKeyId from JaaS console
      console.warn('⚠️  apiKeyId does not contain a slash. It should be in format: vpaas-magic-cookie-xxx/yyyy');
    }

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: kid,
    };

    const payload = {
      iss: 'chat',
      sub: this.config.appId,
      aud: 'jitsi',
      iat: now,
      nbf: now,
      exp: exp,
      room: '*',
      context: {
        user: {
          id: jaasUserId,
          name: userName,
          email: userEmail,
          moderator: isModerator ? 'true' : 'false',
          avatar: '',
        },
        features: {
          livestreaming: isModerator,
          recording: isModerator,
          transcription: false,
          'outbound-call': false,
        },
      },
    };

    const encodedHeader = Buffer.from(JSON.stringify(header))
      .toString('base64url')
      .replace(/=/g, '');
    
    const encodedPayload = Buffer.from(JSON.stringify(payload))
      .toString('base64url')
      .replace(/=/g, '');

    const signingInput = `${encodedHeader}.${encodedPayload}`;

    try {
      const signer = crypto.createSign('RSA-SHA256');
      signer.update(signingInput);
      const signature = signer.sign(this.config.privateKey, 'base64url').replace(/=/g, '');
      
      const token = `${encodedHeader}.${encodedPayload}.${signature}`;
      
      console.log('Generated JWT with kid:', kid);
      
      return token;
    } catch (error: any) {
      console.error('JWT signing error:', error);
      throw new Error(`Failed to sign JWT: ${error.message}`);
    }
  }

  generateRoomName(courseSlug: string, lessonId: string): string {
    const timestamp = Date.now().toString(36).slice(-6);
    const sanitizedSlug = courseSlug.replace(/[^a-zA-Z0-9]/g, '-');
    return `course-${sanitizedSlug}-${lessonId}-${timestamp}`;
  }

  getMeetingUrl(roomName: string): string {
    return `https://${this.config.domain}/${this.config.appId}/${roomName}`;
  }

  validateToken(token: string): { valid: boolean; error?: string; decoded?: any } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid JWT format' };
      }

      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

      if (header.alg !== 'RS256') {
        return { valid: false, error: `Invalid algorithm: ${header.alg}` };
      }

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' };
      }

      if (payload.iss !== 'chat') {
        return { valid: false, error: `Invalid issuer: ${payload.iss}` };
      }

      return { valid: true, decoded: { header, payload } };
    } catch (err: any) {
      return { valid: false, error: err?.message || 'Token validation failed' };
    }
  }

  debugToken(token: string): { header?: any; payload?: any; error?: string } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { error: 'Invalid JWT format' };
      }

      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

      return { header, payload };
    } catch (err: any) {
      return { error: err?.message || 'Failed to decode token' };
    }
  }
}

export const jaasService = new JaaSService();
