import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';
import type { Request, Response } from 'firebase-functions';
import type { JwtHeader, SigningKeyCallback, JwtPayload } from 'jsonwebtoken';
import fetch from 'node-fetch';

// Add type for Microsoft's JWKS response
interface JwksKey {
  kty: string;
  use: string;
  kid: string;
  x5t: string;
  n: string;
  e: string;
  x5c: string[];
  issuer: string;
}

interface JwksResponse {
  keys: JwksKey[];
}

admin.initializeApp();

// Replace these with your Microsoft Teams app's credentials
const TEAMS_APP_ID = process.env.TEAMS_APP_ID || 'YOUR_TEAMS_APP_ID';
// TEAMS_APP_SECRET is kept for future use in token validation
// Uncomment when needed
// const TEAMS_APP_SECRET = process.env.TEAMS_APP_SECRET || 'YOUR_TEAMS_APP_SECRET';

export const exchangeTeamsToken = functions.https.onRequest(async (req: Request, res: Response) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }

    // Verify the Teams token and get user info
    const response = await fetch('https://login.microsoftonline.com/common/discovery/keys');
    const keys: JwksResponse = await response.json();
    
    // Get the signing key
    const getKey: jwt.GetPublicKeyOrSecret = (header: JwtHeader, callback: SigningKeyCallback) => {
      if (!header.kid) {
        return callback(new Error('No key ID in token header'));
      }
      const key = keys.keys.find(k => k.kid === header.kid);
      if (!key) {
        return callback(new Error('Key not found'));
      }
      // Use the first certificate in the x5c array
      const cert = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
      callback(null, cert);
    };

    // Verify the token
    const decoded = await new Promise<JwtPayload>((resolve, reject) => {
      jwt.verify(token, getKey, {
        algorithms: ['RS256'],
        audience: TEAMS_APP_ID,
        issuer: `https://login.microsoftonline.com/${TEAMS_APP_ID}/v2.0`
      }, (err, payload) => {
        if (err) return reject(err);
        if (!payload || typeof payload === 'string') {
          return reject(new Error('Invalid token payload'));
        }
        resolve(payload as JwtPayload);
      });
    });

    // Get or create the user in Firebase
    const userId = `teams:${decoded.oid || decoded.sub}`;
    const userRecord = await getOrCreateUser(userId, {
      displayName: decoded.name || 'Teams User',
      email: decoded.email || `${userId}@teams.user`,
    });

    // Create a Firebase custom token
    const firebaseToken = await admin.auth().createCustomToken(userRecord.uid);
    
    res.json({ customToken: firebaseToken });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

async function getOrCreateUser(userId: string, userData: { displayName: string; email: string }) {
  try {
    return await admin.auth().getUser(userId);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return admin.auth().createUser({
        uid: userId,
        displayName: userData.displayName,
        email: userData.email,
        emailVerified: true,
      });
    }
    throw error;
  }
}
