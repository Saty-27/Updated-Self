const production = process.env.NODE_ENV === "production";

const developmentSecret = (name) => `local-only-${name.toLowerCase()}-change-before-production`;

export const requiredSecret = (name, fallbackName) => {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : "");
  if (value) return value;
  if (production) throw new Error(`${name} must be configured in production.`);
  return developmentSecret(name);
};

export const JWT_SECRET = requiredSecret("JWT_SECRET");
export const OTP_SECRET = requiredSecret("OTP_SECRET", "JWT_SECRET");

export const assertSecureRuntime = () => {
  if (!production) return;
  if (JWT_SECRET.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters in production.");
  if (OTP_SECRET.length < 32) throw new Error("OTP_SECRET must contain at least 32 characters in production.");
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be configured in production.");
  const origins = String(process.env.CLIENT_URL || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!origins.length || origins.some((origin) => !origin.startsWith("https://"))) {
    throw new Error("CLIENT_URL must contain explicit HTTPS origins in production.");
  }
};

export const createCorsOptions = () => {
  const configured = String(process.env.CLIENT_URL || "").split(",").map((x) => x.trim()).filter(Boolean);
  const local = production ? [] : ["http://localhost:5173", "http://127.0.0.1:5173"];
  const allowed = new Set([...configured, ...local]);
  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowed.has(origin)) return callback(null, true);
      const error = new Error("Origin is not allowed by CORS.");
      error.statusCode = 403;
      return callback(error);
    }
  };
};
