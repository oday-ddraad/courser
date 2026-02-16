import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { jaasService } from '@/lib/services/jaas';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Get configuration info
    const config = jaasService.getConfig();
    const keyFilePath = path.join(process.cwd(), 'keys', 'jitsiprivateKey.pem');
    const keyFileExists = fs.existsSync(keyFilePath);
    
    // Try to read the key file to verify it exists and is readable
    let keyFileStats = null;
    let keyFilePreview = '';
    if (keyFileExists) {
      try {
        const stats = fs.statSync(keyFilePath);
        keyFileStats = {
          size: stats.size,
          isFile: stats.isFile(),
          readable: true,
        };
        const content = fs.readFileSync(keyFilePath, 'utf-8');
        keyFilePreview = content.substring(0, 50) + '...';
      } catch (e: any) {
        keyFileStats = {
          error: e.message,
          readable: false,
        };
      }
    }

    // Generate a test token
    let testToken = null;
    let tokenError = null;
    try {
      testToken = jaasService.generateJWTToken(
        'test-user-id',
        'test-jaas-user-id',
        'Test User',
        'test@example.com',
        true
      );
    } catch (e: any) {
      tokenError = e.message;
    }

    // Decode the test token
    let tokenDebug = null;
    if (testToken) {
      tokenDebug = jaasService.debugToken(testToken);
    }

    return NextResponse.json({
      authenticated: !!session?.user,
      config: {
        appId: config.appId,
        apiKeyId: config.apiKeyId,
        domain: config.domain,
        privateKeyLength: config.privateKey.length,
        privateKeyHasHeaders: config.privateKey.includes('-----BEGIN PRIVATE KEY-----'),
      },
      keyFile: {
        path: keyFilePath,
        exists: keyFileExists,
        stats: keyFileStats,
        preview: keyFilePreview,
      },
      testToken: {
        generated: !!testToken,
        error: tokenError,
        debug: tokenDebug,
        preview: testToken ? testToken.substring(0, 100) + '...' : null,
      },
      environment: {
        JAAS_APP_ID: process.env.JAAS_APP_ID ? 'Set' : 'Not set',
        JAAS_API_KEY_ID: process.env.JAAS_API_KEY_ID ? 'Set' : 'Not set',
        JAAS_PRIVATE_KEY: process.env.JAAS_PRIVATE_KEY ? 'Set (length: ' + process.env.JAAS_PRIVATE_KEY.length + ')' : 'Not set',
        NODE_ENV: process.env.NODE_ENV,
      },
      suggestions: [
        'If "could not obtain public key": The kid format is wrong. Try setting JAAS_API_KEY_ID to match your JaaS API Key ID',
        'The kid should be in format: vpaas-magic-cookie-xxx/yyyy or just the API Key ID portion',
        'Check your JaaS console at https://8x8.vc to find your API Key ID',
      ],
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 });
  }
}
