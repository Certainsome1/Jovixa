import { existsSync, readFileSync } from "node:fs";
import https from "node:https";
import { resolve } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        return [key.trim(), valueParts.join("=").trim()];
      })
  );
}

function cleanSupabaseUrl(url) {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

async function findUserByEmail(supabase, email) {
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (page < 20) {
    const data = await supabase.adminRequest(
      "GET",
      `/auth/v1/admin/users?page=${page}&per_page=100`
    );

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === normalizedEmail
    );

    if (user || data.users.length < 100) {
      return user;
    }

    page += 1;
  }

  return null;
}

function requestJson(supabaseUrl, serviceRoleKey, method, path, body) {
  return new Promise((resolveRequest, rejectRequest) => {
    const endpoint = new URL(path, supabaseUrl);
    const payload = body ? JSON.stringify(body) : undefined;

    const request = https.request(
      endpoint,
      {
        method,
        timeout: 60000,
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (response) => {
        let responseBody = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          const parsedBody = responseBody ? JSON.parse(responseBody) : {};

          if (response.statusCode && response.statusCode >= 400) {
            rejectRequest(
              new Error(
                parsedBody.msg ||
                  parsedBody.message ||
                  `Supabase request failed with ${response.statusCode}`
              )
            );
            return;
          }

          resolveRequest(parsedBody);
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("Supabase request timed out"));
    });
    request.on("error", rejectRequest);

    if (payload) {
      request.write(payload);
    }

    request.end();
  });
}

const env = {
  ...loadEnvFile(resolve(process.cwd(), "..", ".env")),
  ...loadEnvFile(resolve(process.cwd(), "..", "backend", ".env")),
  ...loadEnvFile(resolve(process.cwd(), ".env.local")),
  ...process.env,
};

const supabaseUrl = cleanSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL || "");
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = env.ADMIN_EMAIL || "admin@jovixa.com";
const adminPassword = env.ADMIN_PASSWORD || "Admin@12345";

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
}

if (!serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to frontend/.env.local or set it in your shell."
  );
}

const supabase = {
  adminRequest(method, path, body) {
    return requestJson(supabaseUrl, serviceRoleKey, method, path, body);
  },
};

const existingUser = await findUserByEmail(supabase, adminEmail);

if (existingUser) {
  await supabase.adminRequest("PUT", `/auth/v1/admin/users/${existingUser.id}`, {
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      ...(existingUser.user_metadata || {}),
      name: existingUser.user_metadata?.name || "Admin",
      role: "admin",
    },
  });

  console.log(`Updated admin account: ${adminEmail}`);
} else {
  await supabase.adminRequest("POST", "/auth/v1/admin/users", {
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      name: "Admin",
      role: "admin",
    },
  });

  console.log(`Created admin account: ${adminEmail}`);
}

console.log(`Login email: ${adminEmail}`);
console.log(`Login password: ${adminPassword}`);
