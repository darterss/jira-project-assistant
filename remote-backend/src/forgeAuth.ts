import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

/**
 * Validate Forge Invocation Token (FIT) against Forge JWKS
 * See Forge Remote essentials for JWKS URL and requirements.
 * Docs: https://developer.atlassian.com/platform/forge/remote/essentials/
 */
const JWKS_URL = 'https://forge.cdn.prod.atlassian-dev.net/.well-known/jwks.json';

export async function validateFIT(token: string, appId: string): Promise<JWTPayload> {
    if (!token) throw new Error('No token provided');
    const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
    // We expect issuer 'forge/invocation-token' and audience = appId in jwtVerify options
    const { payload } = await jwtVerify(token, JWKS, { audience: appId, issuer: 'forge/invocation-token' });
    return payload;
}
