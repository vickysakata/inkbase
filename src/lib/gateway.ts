import { createHmac, randomBytes } from "crypto";

const APP_ID = process.env.PIE_APP_ID!;
const APP_SECRET = process.env.PIE_APP_SECRET!;
const GATEWAY_PATH = process.env.PIE_GATEWAY_PATH || "https://pie-gateway.weapp.me";

function computeSignature(
  method: string,
  path: string,
  timestamp: number,
  nonce: string,
  appId: string,
  appSecret: string
): string {
  const signatureString = `${method}\n${path}\n${timestamp}\n${nonce}\n${appId}`;
  return createHmac("sha256", appSecret).update(signatureString).digest("hex");
}

export function generateAuthHeaders(method: string, path: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(16).toString("hex");
  const signature = computeSignature(method, path, timestamp, nonce, APP_ID, APP_SECRET);

  return {
    "X-App-Id": APP_ID,
    "X-Timestamp": timestamp.toString(),
    "X-Nonce": nonce,
    Authorization: `HMAC-SHA256 ${signature}`,
  };
}

export function getGatewayUrl(path: string): string {
  return `${GATEWAY_PATH}${path}`;
}
