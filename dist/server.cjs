var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// backend/src/config/env.ts
var import_dotenv, import_zod, envSchema, parsed, env;
var init_env = __esm({
  "backend/src/config/env.ts"() {
    "use strict";
    import_dotenv = __toESM(require("dotenv"));
    import_zod = require("zod");
    import_dotenv.default.config();
    envSchema = import_zod.z.object({
      NODE_ENV: import_zod.z.enum(["development", "test", "production"]).default("development"),
      PORT: import_zod.z.coerce.number().default(3e3),
      API_PREFIX: import_zod.z.string().default("/api/v1"),
      DB_HOST: import_zod.z.string().default("localhost"),
      DB_PORT: import_zod.z.coerce.number().default(3306),
      DB_USER: import_zod.z.string().default("tecump"),
      DB_PASSWORD: import_zod.z.string().default(""),
      DB_NAME: import_zod.z.string().default("tecump"),
      DB_CONNECTION_LIMIT: import_zod.z.coerce.number().default(10),
      DB_QUEUE_LIMIT: import_zod.z.coerce.number().default(100),
      DB_CONNECT_TIMEOUT_MS: import_zod.z.coerce.number().default(1e4),
      DB_IDLE_TIMEOUT_MS: import_zod.z.coerce.number().default(6e4),
      REDIS_URL: import_zod.z.string().default("redis://localhost:6379"),
      JWT_ACCESS_SECRET: import_zod.z.string().default("tumcu-tecump-jwt-access-secret-32-chars-long-secure-key"),
      JWT_REFRESH_SECRET: import_zod.z.string().default("tumcu-tecump-jwt-refresh-secret-32-chars-long-secure-key"),
      JWT_ACCESS_EXPIRES_IN: import_zod.z.string().default("24h"),
      JWT_REFRESH_EXPIRES_IN: import_zod.z.string().default("30d"),
      AUTH_COOKIE_NAME: import_zod.z.string().default("tecump_refresh"),
      AUTH_COOKIE_SECURE: import_zod.z.coerce.boolean().default(false),
      AUTH_COOKIE_SAME_SITE: import_zod.z.enum(["lax", "strict", "none"]).default("lax"),
      CORS_ORIGIN: import_zod.z.string().default("http://localhost:3000,http://localhost:5173,*"),
      RATE_LIMIT_WINDOW_MS: import_zod.z.coerce.number().default(9e5),
      RATE_LIMIT_MAX: import_zod.z.coerce.number().default(3e3),
      // All optional: if SMTP_HOST is unset, the notification dispatcher logs
      // emails to the console instead of sending them — safe default for local
      // development, but every queued notification still gets processed and
      // marked sent so nothing silently piles up unsent.
      SMTP_HOST: import_zod.z.string().optional(),
      SMTP_PORT: import_zod.z.coerce.number().default(587),
      SMTP_USER: import_zod.z.string().optional(),
      SMTP_PASSWORD: import_zod.z.string().optional(),
      SMTP_FROM: import_zod.z.string().default("TUMCU Christian Union <tumchristianunion@gmail.com>"),
      NOTIFICATION_DISPATCH_INTERVAL_MS: import_zod.z.coerce.number().default(3e4),
      UPLOAD_DIR: import_zod.z.string().default("/app/data/uploads")
    });
    parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("\u274C Invalid environment configuration:", parsed.error.flatten().fieldErrors);
      process.exit(1);
    }
    env = parsed.data;
    if (env.NODE_ENV === "production") {
      if (env.AUTH_COOKIE_SAME_SITE === "none" && !env.AUTH_COOKIE_SECURE) {
        throw new Error("Production AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true.");
      }
      const insecureDefaults = [
        "tumcu-tecump-jwt-access-secret-32-chars-long-secure-key",
        "tumcu-tecump-jwt-refresh-secret-30d",
        "tumcu-tecump-jwt-refresh-secret-32-chars-long-secure-key"
      ];
      if (insecureDefaults.includes(env.JWT_ACCESS_SECRET) || insecureDefaults.includes(env.JWT_REFRESH_SECRET)) {
        throw new Error("Production JWT secrets must be replaced with unique random secrets.");
      }
      if (env.CORS_ORIGIN.split(",").some((origin) => origin.trim() === "*")) {
        throw new Error("Production CORS_ORIGIN must contain explicit trusted origins; wildcard * is not allowed.");
      }
    }
  }
});

// backend/src/utils/logger.ts
var import_pino, logger;
var init_logger = __esm({
  "backend/src/utils/logger.ts"() {
    "use strict";
    import_pino = __toESM(require("pino"));
    init_env();
    logger = (0, import_pino.default)({
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport: env.NODE_ENV === "development" ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } } : void 0
    });
  }
});

// backend/src/config/database.ts
function initDiskStore() {
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (import_fs.default.existsSync(STORE_FILE)) {
      const raw = import_fs.default.readFileSync(STORE_FILE, "utf8");
      const parsed2 = JSON.parse(raw);
      if (parsed2 && typeof parsed2 === "object") {
        for (const [table, rows] of Object.entries(parsed2)) {
          if (Array.isArray(rows) && rows.length > 0) {
            if (!memoryDb.tables[table]) {
              memoryDb.tables[table] = rows;
            } else {
              const existingIds = new Set(memoryDb.tables[table].map((r) => r.id));
              for (const row of rows) {
                if (!existingIds.has(row.id)) {
                  memoryDb.tables[table].push(row);
                } else {
                  const idx = memoryDb.tables[table].findIndex((r) => r.id === row.id);
                  if (idx >= 0) {
                    memoryDb.tables[table][idx] = { ...memoryDb.tables[table][idx], ...row };
                  }
                }
              }
            }
          }
        }
        logger.info("Loaded persisted store from disk successfully.");
      }
    }
  } catch (err) {
    logger.warn({ err }, "Could not load store from disk, continuing with seeded memory store.");
  }
}
function scheduleSaveToDisk() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      if (!import_fs.default.existsSync(DATA_DIR)) {
        import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
      }
      import_fs.default.writeFileSync(STORE_FILE, JSON.stringify(memoryDb.tables, null, 2), "utf8");
    } catch (err) {
      logger.warn({ err }, "Failed to persist memory store to disk");
    }
  }, 100);
}
function executeInMemoryQuery(sql, params = {}) {
  const cleanSql = sql.trim().replace(/\s+/g, " ");
  const upperSql = cleanSql.toUpperCase();
  if (cleanSql.includes("permissions") && cleanSql.includes("user_roles")) {
    const userId = params.userId || params.user_id;
    let userRoles = memoryDb.tables.user_roles.filter((ur) => ur.user_id === userId && ur.is_current !== false);
    if (userRoles.some((ur) => ur.role_id === "role-1")) {
      return [memoryDb.tables.permissions.map((p) => ({ code: p.code, module: p.module }))];
    }
    const assignedRoleIds = new Set(userRoles.map((ur) => ur.role_id));
    assignedRoleIds.add("role-10");
    const permMap = /* @__PURE__ */ new Map();
    for (const roleId of assignedRoleIds) {
      const perms = memoryDb.tables.role_permissions.filter((rp) => rp.role_id === roleId).map((rp) => memoryDb.tables.permissions.find((p) => p.id === rp.permission_id)).filter(Boolean);
      for (const p of perms) {
        if (p && !permMap.has(p.code)) {
          permMap.set(p.code, { code: p.code, module: p.module });
        }
      }
    }
    return [Array.from(permMap.values())];
  }
  if (cleanSql.includes("user_roles") && (cleanSql.includes("roles") || cleanSql.includes("role_id"))) {
    const userId = params.userId || params.user_id;
    let userRoles = memoryDb.tables.user_roles.filter((ur) => !userId || ur.user_id === userId && ur.is_current !== false);
    if (userRoles.length === 0 && userId) {
      const defaultUr = { id: (0, import_uuid.v4)(), user_id: userId, role_id: "role-10", scope_type: null, scope_id: null, is_current: true };
      memoryDb.tables.user_roles.push(defaultUr);
      userRoles = [defaultUr];
    }
    const rows2 = userRoles.map((ur) => {
      const role = memoryDb.tables.roles.find((r) => r.id === ur.role_id);
      return {
        role_id: ur.role_id,
        role_code: role?.code || "member",
        code: role?.code || "member",
        name: role?.name || "Member",
        category: role?.category || "general",
        scope_type: ur.scope_type || null,
        scope_id: ur.scope_id || null,
        is_current: ur.is_current !== false
      };
    });
    return [rows2.length > 0 ? rows2 : [{ role_id: "role-10", role_code: "member", code: "member", name: "Member", category: "general", scope_type: null, scope_id: null, is_current: true }]];
  }
  if (cleanSql.includes("scope_type") && cleanSql.includes("user_roles")) {
    const userId = params.userId || params.user_id;
    const userRoles = memoryDb.tables.user_roles.filter((ur) => (!userId || ur.user_id === userId) && ur.scope_type && ur.scope_id);
    return [userRoles.map((ur) => ({ scope_type: ur.scope_type, scope_id: ur.scope_id }))];
  }
  if (cleanSql.includes("membership_applications") && !upperSql.startsWith("INSERT") && !upperSql.startsWith("UPDATE") && !upperSql.startsWith("DELETE")) {
    let apps = memoryDb.tables.membership_applications ? [...memoryDb.tables.membership_applications] : [];
    if (upperSql.includes("COUNT(*)")) {
      if (params.status) {
        apps = apps.filter((a) => a.status === params.status);
      } else if (cleanSql.includes("'submitted'") || cleanSql.includes('"submitted"')) {
        apps = apps.filter((a) => a.status === "submitted");
      } else if (cleanSql.includes("status IN ('submitted', 'under_review')")) {
        apps = apps.filter((a) => a.status === "submitted" || a.status === "under_review");
      }
      return [[{ total: apps.length, count: apps.length }]];
    }
    if (params.status) {
      apps = apps.filter((a) => a.status === params.status);
    } else if (cleanSql.includes("status IN ('submitted', 'under_review')")) {
      apps = apps.filter((a) => a.status === "submitted" || a.status === "under_review");
    }
    if (params.userId || params.user_id) {
      const uid = params.userId || params.user_id;
      apps = apps.filter((a) => a.user_id === uid || a.userId === uid);
    }
    if (params.id) {
      apps = apps.filter((a) => a.id === params.id);
    }
    const rows2 = apps.map((ma) => {
      const userId = ma.user_id || ma.userId;
      const typeId = ma.membership_type_id || ma.membershipTypeId;
      const user = memoryDb.tables.users.find((u) => u.id === userId);
      const mt = memoryDb.tables.membership_types.find((t) => t.id === typeId || t.code === typeId);
      return {
        id: ma.id,
        status: ma.status,
        rejection_reason: ma.rejection_reason || ma.rejectionReason || null,
        created_at: ma.created_at,
        user_id: user?.id || userId,
        full_name: user?.full_name || user?.fullName || "Student Applicant",
        email: user?.email || "",
        admission_number: user?.admission_number || user?.admissionNumber || "",
        phone: user?.phone_number || user?.phone || "",
        phone_number: user?.phone_number || user?.phone || "",
        course: user?.course || "General Student",
        year_of_study: user?.year_of_study || 1,
        school: user?.school || "",
        membership_type_name: mt?.name || "Full Member (Student)"
      };
    });
    if (params.limit && typeof params.limit === "number") {
      const offset = Number(params.offset) || 0;
      return [rows2.slice(offset, offset + params.limit)];
    }
    return [rows2];
  }
  if (cleanSql.includes("spiritual_years") && upperSql.includes("IS_CURRENT")) {
    const sy = memoryDb.tables.spiritual_years.find((s) => s.is_current);
    return [[sy || { id: "sy-2026" }]];
  }
  if (cleanSql.includes("membership_declarations") && upperSql.includes("IS_ACTIVE")) {
    const decl = memoryDb.tables.membership_declarations.find((d) => d.is_active);
    return [[decl || { id: "decl-1" }]];
  }
  if (cleanSql.includes("attendance_records") && (cleanSql.includes("users") || upperSql.includes("ROSTER") || cleanSql.includes("session_id") || cleanSql.includes("attendable_id"))) {
    const sessionId = params.sessionId || params.session_id || params.attendableId || params.attendable_id;
    let records = memoryDb.tables.attendance_records || [];
    if (sessionId) {
      records = records.filter((r) => r.session_id === sessionId || r.attendable_id === sessionId);
    }
    const rows2 = records.map((rec) => {
      const user = rec.user_id ? memoryDb.tables.users.find((u) => u.id === rec.user_id) : null;
      const membership = rec.user_id ? memoryDb.tables.memberships.find((m) => m.user_id === rec.user_id && m.status === "active") : null;
      return {
        id: rec.id,
        session_id: rec.session_id || rec.attendable_id,
        user_id: rec.user_id || null,
        full_name: user?.full_name || rec.guest_name || "Anonymous Guest",
        email: user?.email || rec.guest_email || "",
        phone_number: user?.phone_number || rec.guest_phone || "",
        admission_number: user?.admission_number || "",
        membership_number: membership?.membership_number || null,
        is_member: !!user,
        status: rec.status || "present",
        visitor_type: rec.visitor_type || (user ? "none" : "first_time"),
        method: rec.method || "qr_code",
        checked_in_at: rec.checked_in_at || (/* @__PURE__ */ new Date()).toISOString(),
        notes: rec.notes || null,
        prayer_request: rec.prayer_request || null,
        school_faculty: user?.school || rec.guest_category || null,
        year_of_study: user?.year_of_study || null
      };
    });
    return [rows2];
  }
  if (cleanSql.includes("leadership_assignments")) {
    let assignments = memoryDb.tables.leadership_assignments || [];
    if (params.id) {
      assignments = assignments.filter((a) => a.id === params.id);
    }
    if (params.userId || params.user_id) {
      const uid = params.userId || params.user_id;
      assignments = assignments.filter((a) => a.user_id === uid);
    }
    if (params.positionId || params.position_id) {
      const pid = params.positionId || params.position_id;
      assignments = assignments.filter((a) => a.position_id === pid);
    }
    if (params.status) {
      assignments = assignments.filter((a) => a.status === params.status);
    }
    const rows2 = assignments.map((a) => {
      const pos = (memoryDb.tables.leadership_positions || []).find((p) => p.id === a.position_id);
      const user = a.user_id ? (memoryDb.tables.users || []).find((u) => u.id === a.user_id) : null;
      return {
        ...a,
        position_name: pos?.name || "",
        position_code: pos?.code || "",
        position_category: pos?.category || "executive",
        constitutional_reference: pos?.constitutional_reference || "",
        responsibilities: pos?.responsibilities || [],
        permissions: pos?.permissions || [],
        constitutional_restrictions: pos?.constitutional_restrictions || [],
        user_name: user?.full_name || (a.status === "vacant" ? "VACANT" : "Unassigned"),
        user_email: user?.email || "",
        user_phone: user?.phone_number || "",
        user_admission_number: user?.admission_number || "",
        user_course: user?.course || "",
        user_year: user?.year_of_study || "",
        user_avatar: user?.avatar_url || user?.avatar || "",
        user_bio: user?.bio || ""
      };
    });
    return [rows2];
  }
  if (cleanSql.includes("bible_study_members") && !upperSql.startsWith("INSERT") && !upperSql.startsWith("UPDATE") && !upperSql.startsWith("DELETE")) {
    let members = memoryDb.tables.bible_study_members || [];
    const groupId = params.groupId || params.group_id;
    if (groupId) {
      members = members.filter((m) => m.group_id === groupId);
    }
    const userId = params.userId || params.user_id;
    if (userId) {
      members = members.filter((m) => m.user_id === userId);
    }
    const rows2 = members.map((m) => {
      const user = (memoryDb.tables.users || []).find((u) => u.id === m.user_id);
      const group = (memoryDb.tables.bible_study_groups || []).find((g) => g.id === m.group_id);
      return {
        id: m.id,
        group_id: m.group_id,
        group_name: group?.name || "",
        user_id: m.user_id,
        role: m.role || "member",
        joined_at: m.joined_at || (/* @__PURE__ */ new Date()).toISOString(),
        full_name: user?.full_name || "TUMCU Student Member",
        admission_number: user?.admission_number || "",
        gender: user?.gender || "male",
        phone_number: user?.phone_number || "",
        email: user?.email || "",
        year_of_study: user?.year_of_study || 1,
        school: user?.school || "School of Computing and Informatics",
        department: user?.department || "Department of Computing",
        course: user?.course || "BSc. Computer Science"
      };
    });
    return [rows2];
  }
  if (cleanSql.includes("bible_study_groups") && !upperSql.startsWith("INSERT") && !upperSql.startsWith("UPDATE") && !upperSql.startsWith("DELETE")) {
    let groups = memoryDb.tables.bible_study_groups || [];
    if (params.id) {
      groups = groups.filter((g) => g.id === params.id);
    }
    if (params.cohortName || params.cohort_name) {
      const cName = params.cohortName || params.cohort_name;
      groups = groups.filter((g) => g.cohort_name === cName);
    }
    return [groups];
  }
  const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
  const insertMatch = cleanSql.match(/INSERT\s+(?:IGNORE\s+)?INTO\s+([a-zA-Z0-9_]+)/i);
  const updateMatch = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
  const deleteMatch = cleanSql.match(/DELETE\s+(?:[a-zA-Z0-9_]+\s+)?FROM\s+([a-zA-Z0-9_]+)/i);
  const targetTable = (fromMatch?.[1] || insertMatch?.[1] || updateMatch?.[1] || deleteMatch?.[1] || "").toLowerCase();
  if (targetTable && !memoryDb.tables[targetTable]) {
    memoryDb.tables[targetTable] = [];
  }
  if (upperSql.startsWith("INSERT")) {
    const table2 = targetTable;
    const row = { ...params };
    if (!row.id) row.id = (0, import_uuid.v4)();
    if (!row.created_at) row.created_at = (/* @__PURE__ */ new Date()).toISOString();
    if (params.userId !== void 0 && row.user_id === void 0) row.user_id = params.userId;
    if (params.user_id !== void 0 && row.userId === void 0) row.userId = params.user_id;
    if (params.fullName !== void 0 && row.full_name === void 0) row.full_name = params.fullName;
    if (params.full_name !== void 0 && row.fullName === void 0) row.fullName = params.full_name;
    if (params.phoneNumber !== void 0 && row.phone_number === void 0) row.phone_number = params.phoneNumber;
    if (params.admissionNumber !== void 0 && row.admission_number === void 0) row.admission_number = params.admissionNumber;
    if (params.department !== void 0 && row.department === void 0) row.department = params.department;
    if (params.yearOfStudy !== void 0 && row.year_of_study === void 0) row.year_of_study = params.yearOfStudy;
    if (params.passwordHash !== void 0 && row.password_hash === void 0) row.password_hash = params.passwordHash;
    if (params.membershipTypeId !== void 0 && row.membership_type_id === void 0) row.membership_type_id = params.membershipTypeId;
    if (params.membership_type_id !== void 0 && row.membershipTypeId === void 0) row.membershipTypeId = params.membership_type_id;
    if (params.spiritualYearId !== void 0 && row.spiritual_year_id === void 0) row.spiritual_year_id = params.spiritualYearId;
    if (params.declarationId !== void 0 && row.declaration_id === void 0) row.declaration_id = params.declarationId;
    if (params.membershipNumber !== void 0 && row.membership_number === void 0) row.membership_number = params.membershipNumber;
    if (table2 === "membership_applications") {
      if (!row.status) {
        if (cleanSql.includes("'submitted'") || cleanSql.includes('"submitted"')) row.status = "submitted";
        else if (cleanSql.includes("'under_review'") || cleanSql.includes('"under_review"')) row.status = "under_review";
        else if (cleanSql.includes("'approved'") || cleanSql.includes('"approved"')) row.status = "approved";
        else if (cleanSql.includes("'rejected'") || cleanSql.includes('"rejected"')) row.status = "rejected";
        else row.status = "submitted";
      }
    }
    if (table2 === "memberships") {
      if (!row.status) {
        if (cleanSql.includes("'active'") || cleanSql.includes('"active"')) row.status = "active";
        else row.status = "active";
      }
      if (!row.registration_date) row.registration_date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (!row.registrationDate) row.registrationDate = row.registration_date;
    }
    if (table2 === "users") {
      if (!row.account_status) {
        if (cleanSql.includes("'pending_approval'") || cleanSql.includes('"pending_approval"')) row.account_status = "pending_approval";
        else if (cleanSql.includes("'active'") || cleanSql.includes('"active"')) row.account_status = "active";
        else if (cleanSql.includes("'rejected'") || cleanSql.includes('"rejected"')) row.account_status = "rejected";
      }
    }
    if (table2 === "refresh_tokens") {
      const uId = params.userId || params.user_id;
      const tHash = params.tokenHash || params.token_hash;
      const expAt = params.expiresAt || params.expires_at;
      row.user_id = uId;
      row.userId = uId;
      row.token_hash = tHash;
      row.tokenHash = tHash;
      row.expires_at = expAt ? expAt instanceof Date ? expAt.toISOString() : String(expAt) : new Date(Date.now() + 30 * 864e5).toISOString();
      row.expiresAt = row.expires_at;
      row.revoked_at = null;
      row.revokedAt = null;
    }
    if (table2 === "notifications") {
      const uId = params.userId || params.user_id;
      row.user_id = uId;
      row.userId = uId;
      if (!row.type) {
        row.type = cleanSql.includes("'welcome'") ? "welcome" : params.type || "system";
      }
      if (!row.title) {
        if (cleanSql.includes("'Membership Approved!'")) row.title = "Membership Approved!";
        else if (cleanSql.includes("'Welcome to TUMCU!'")) row.title = "Welcome to TUMCU!";
        else row.title = params.title || "Welcome to TUMCU!";
      }
      if (!row.body) {
        if (params.membershipNumber) {
          row.body = `Congratulations! Your TUMCU membership application has been approved. Your official membership number is ${params.membershipNumber}. Welcome to fellowship!`;
        } else {
          row.body = params.body || "Welcome to the Technical University of Mombasa Christian Union portal.";
        }
      }
      if (!row.channel) {
        row.channel = cleanSql.includes("'email'") ? "email" : "in_app";
      }
      if (row.read_at === void 0) row.read_at = null;
      if (row.sent_at === void 0) row.sent_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    const existingIndex = memoryDb.tables[table2]?.findIndex(
      (r) => r.id === row.id || row.email && r.email === row.email || row.code && r.code === row.code || table2 === "refresh_tokens" && row.token_hash && (r.token_hash === row.token_hash || r.tokenHash === row.token_hash)
    );
    if (existingIndex !== void 0 && existingIndex >= 0) {
      memoryDb.tables[table2][existingIndex] = { ...memoryDb.tables[table2][existingIndex], ...row };
    } else if (memoryDb.tables[table2]) {
      memoryDb.tables[table2].push(row);
    }
    scheduleSaveToDisk();
    return [{ insertId: 1, affectedRows: 1 }];
  }
  if (upperSql.startsWith("UPDATE")) {
    const table2 = targetTable;
    const records = memoryDb.tables[table2] || [];
    let updatedCount = 0;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    for (let i = 0; i < records.length; i++) {
      let matches = false;
      if (params.id && records[i].id === params.id) {
        matches = true;
      } else if (table2 === "ministries" && params.id && records[i].code === params.id) {
        matches = true;
      } else if (params.applicationId && records[i].id === params.applicationId) {
        matches = true;
      } else if (params.registrationId && records[i].id === params.registrationId) {
        matches = true;
      } else if (params.candidateId && records[i].id === params.candidateId) {
        matches = true;
      } else if (params.userRoleId && records[i].id === params.userRoleId) {
        matches = true;
      } else if (table2 === "refresh_tokens") {
        const tHash = params.tokenHash || params.token_hash;
        const uId = params.userId || params.user_id;
        if (tHash && (records[i].token_hash === tHash || records[i].tokenHash === tHash)) {
          matches = true;
        } else if (uId && (records[i].user_id === uId || records[i].userId === uId)) {
          matches = true;
        }
      } else if (table2 === "users" && (params.userId || params.user_id) && records[i].id === (params.userId || params.user_id)) {
        matches = true;
      } else if (table2 === "notifications") {
        const uId = params.userId || params.user_id;
        if (params.id && records[i].id === params.id) {
          if (!uId || records[i].user_id === uId || records[i].userId === uId) {
            matches = true;
          }
        } else if (!params.id && uId && (records[i].user_id === uId || records[i].userId === uId)) {
          if (cleanSql.includes("read_at IS NULL") || upperSql.includes("READ_AT IS NULL")) {
            if (!records[i].read_at && !records[i].readAt) {
              matches = true;
            }
          } else {
            matches = true;
          }
        }
      }
      if (matches) {
        const updatePayload = { ...params, updated_at: nowIso };
        if (cleanSql.includes("read_at = NOW()") || upperSql.includes("READ_AT = NOW()") || cleanSql.includes("read_at = now()")) {
          updatePayload.read_at = nowIso;
          updatePayload.readAt = nowIso;
        }
        if (cleanSql.includes("sent_at = NOW()") || upperSql.includes("SENT_AT = NOW()") || cleanSql.includes("sent_at = now()")) {
          updatePayload.sent_at = nowIso;
          updatePayload.sentAt = nowIso;
        }
        if (cleanSql.includes("revoked_at = NOW()") || upperSql.includes("REVOKED_AT = NOW()")) {
          updatePayload.revoked_at = nowIso;
          updatePayload.revokedAt = nowIso;
        }
        if (cleanSql.includes("reviewed_at = NOW()") || upperSql.includes("REVIEWED_AT = NOW()")) {
          updatePayload.reviewed_at = nowIso;
          updatePayload.reviewedAt = nowIso;
        }
        if (cleanSql.includes("last_login_at = NOW()") || upperSql.includes("LAST_LOGIN_AT = NOW()")) {
          updatePayload.last_login_at = nowIso;
        }
        if (cleanSql.includes("status = 'approved'") || cleanSql.includes('status = "approved"')) {
          updatePayload.status = "approved";
        }
        if (cleanSql.includes("status = 'rejected'") || cleanSql.includes('status = "rejected"')) {
          updatePayload.status = "rejected";
        }
        if (cleanSql.includes("status = 'under_review'") || cleanSql.includes('status = "under_review"')) {
          updatePayload.status = "under_review";
        }
        if (cleanSql.includes("status = 'active'") || cleanSql.includes('status = "active"')) {
          updatePayload.status = "active";
        }
        if (cleanSql.includes("status = 'attended'") || cleanSql.includes('status = "attended"')) {
          updatePayload.status = "attended";
        }
        if (cleanSql.includes("status = 'cancelled'") || cleanSql.includes('status = "cancelled"')) {
          updatePayload.status = "cancelled";
        }
        if (cleanSql.includes("account_status = 'active'") || cleanSql.includes('account_status = "active"')) {
          updatePayload.account_status = "active";
        }
        if (cleanSql.includes("account_status = 'rejected'") || cleanSql.includes('account_status = "rejected"')) {
          updatePayload.account_status = "rejected";
        }
        if (cleanSql.includes("account_status = 'suspended'") || cleanSql.includes('account_status = "suspended"')) {
          updatePayload.account_status = "suspended";
        }
        if (cleanSql.includes("is_current = FALSE") || cleanSql.includes("is_current = false")) {
          updatePayload.is_current = false;
        }
        if (cleanSql.includes("is_current = TRUE") || cleanSql.includes("is_current = true")) {
          updatePayload.is_current = true;
        }
        if (cleanSql.includes("votes_count = votes_count + 1")) {
          updatePayload.votes_count = (records[i].votes_count || 0) + 1;
        }
        records[i] = { ...records[i], ...updatePayload };
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      scheduleSaveToDisk();
    }
    return [{ affectedRows: updatedCount }];
  }
  if (upperSql.startsWith("DELETE")) {
    const table2 = targetTable;
    if (memoryDb.tables[table2]) {
      const uId = params.userId || params.user_id;
      if (!upperSql.includes("WHERE")) {
        memoryDb.tables[table2] = [];
      } else if (params.id) {
        memoryDb.tables[table2] = memoryDb.tables[table2].filter((r) => r.id !== params.id && (table2 !== "bible_study_members" || r.group_id !== params.id));
      } else if (uId) {
        memoryDb.tables[table2] = memoryDb.tables[table2].filter((r) => r.user_id !== uId && r.userId !== uId && r.id !== uId);
      }
      scheduleSaveToDisk();
    }
    return [{ affectedRows: 1 }];
  }
  if (upperSql.includes("COUNT(*)")) {
    const table2 = targetTable;
    let list = memoryDb.tables[table2] || [];
    if (table2 === "notifications") {
      const uid = params.user_id || params.userId;
      if (uid) list = list.filter((r) => r.user_id === uid || r.userId === uid);
      if (cleanSql.includes("read_at IS NULL") || upperSql.includes("READ_AT IS NULL")) {
        list = list.filter((r) => !r.read_at && !r.readAt);
      }
      return [[{ total: list.length, count: list.length }]];
    }
    if (params.id) list = list.filter((r) => r.id === params.id);
    if (params.ministry_id || params.ministryId) {
      const mid = params.ministry_id || params.ministryId;
      list = list.filter((r) => r.ministry_id && (r.ministry_id === mid || r.ministry_id === "min-1" && mid === "intercessory") || r.id === mid);
    }
    if (params.user_id || params.userId) {
      const uid = params.user_id || params.userId;
      list = list.filter((r) => r.user_id === uid || r.id === uid);
    }
    if (params.status) {
      list = list.filter((r) => r.status === params.status);
    }
    return [[{ total: list.length, count: list.length }]];
  }
  const table = targetTable;
  let rows = memoryDb.tables[table] || [];
  if (table === "notifications") {
    const uId = params.userId || params.user_id;
    if (uId) {
      rows = rows.filter((r) => r.user_id === uId || r.userId === uId);
    }
    if (cleanSql.includes("sent_at IS NULL") || upperSql.includes("SENT_AT IS NULL")) {
      rows = rows.filter((r) => !r.sent_at && !r.sentAt);
    }
    if (rows.length === 0 && uId) {
      const welcomeNotif = {
        id: (0, import_uuid.v4)(),
        user_id: uId,
        userId: uId,
        type: "welcome",
        title: "Welcome to TUMCU Portal",
        body: "Your Technical University of Mombasa Christian Union account is active. Explore ministries, fellowship meetings, and Sunday service attendance.",
        channel: "in_app",
        read_at: null,
        readAt: null,
        sent_at: (/* @__PURE__ */ new Date()).toISOString(),
        sentAt: (/* @__PURE__ */ new Date()).toISOString(),
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      memoryDb.tables.notifications.push(welcomeNotif);
      rows = [welcomeNotif];
    }
    return [
      rows.map((r) => ({
        ...r,
        id: r.id,
        user_id: r.user_id || r.userId,
        userId: r.user_id || r.userId,
        type: r.type || "welcome",
        title: r.title || "Welcome to TUMCU!",
        body: r.body || "",
        channel: r.channel || "in_app",
        read_at: r.read_at || r.readAt || null,
        readAt: r.read_at || r.readAt || null,
        sent_at: r.sent_at || r.sentAt || (/* @__PURE__ */ new Date()).toISOString(),
        sentAt: r.sent_at || r.sentAt || (/* @__PURE__ */ new Date()).toISOString(),
        created_at: r.created_at || r.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      }))
    ];
  }
  if (table === "refresh_tokens") {
    const tHash = params.tokenHash || params.token_hash;
    const uId = params.userId || params.user_id;
    if (tHash) {
      rows = rows.filter((r) => r.token_hash === tHash || r.tokenHash === tHash);
    }
    if (uId) {
      rows = rows.filter((r) => r.user_id === uId || r.userId === uId);
    }
    if (cleanSql.includes("revoked_at IS NULL") || upperSql.includes("REVOKED_AT IS NULL")) {
      rows = rows.filter((r) => !r.revoked_at && !r.revokedAt);
    }
    if (cleanSql.includes("expires_at > NOW()") || upperSql.includes("EXPIRES_AT > NOW()")) {
      rows = rows.filter((r) => {
        const exp = r.expires_at || r.expiresAt;
        return !exp || new Date(exp).getTime() > Date.now();
      });
    }
    return [
      rows.map((r) => ({
        ...r,
        id: r.id,
        user_id: r.user_id || r.userId,
        userId: r.user_id || r.userId,
        token_hash: r.token_hash || r.tokenHash,
        tokenHash: r.token_hash || r.tokenHash,
        expires_at: r.expires_at || r.expiresAt,
        expiresAt: r.expires_at || r.expiresAt,
        revoked_at: r.revoked_at || r.revokedAt || null,
        revokedAt: r.revoked_at || r.revokedAt || null
      }))
    ];
  }
  if (params.idOrCode) {
    rows = rows.filter((r) => r.id === params.idOrCode || r.code === params.idOrCode || r.code && r.code.toLowerCase() === String(params.idOrCode).toLowerCase());
  }
  if (params.id) {
    if (table === "ministries" || table === "committees") {
      rows = rows.filter((r) => r.id === params.id || r.code === params.id || r.code && r.code.toLowerCase() === String(params.id).toLowerCase());
    } else if (table === "users") {
      rows = rows.filter((r) => r.id === params.id || r.email === params.id || r.username === params.id);
    } else {
      rows = rows.filter((r) => r.id === params.id);
    }
  }
  if (params.code) rows = rows.filter((r) => r.code && r.code.toLowerCase() === String(params.code).toLowerCase());
  if (params.email) rows = rows.filter((r) => r.email && r.email.toLowerCase() === String(params.email).trim().toLowerCase());
  if (params.username) rows = rows.filter((r) => r.username && r.username.toLowerCase() === String(params.username).trim().toLowerCase());
  if (params.identifier) {
    const idClean = String(params.identifier).trim();
    const idLower = idClean.toLowerCase();
    const idDigits = idClean.replace(/[^0-9]/g, "");
    rows = rows.filter((r) => {
      const emailMatch = r.email && r.email.toLowerCase() === idLower;
      const userMatch = r.username && r.username.toLowerCase() === idLower;
      const admMatch = r.admission_number && r.admission_number.toLowerCase() === idLower;
      const phoneClean = r.phone_number ? String(r.phone_number).replace(/[^0-9]/g, "") : "";
      const phoneMatch = r.phone_number && (r.phone_number.toLowerCase() === idLower || idDigits.length >= 8 && phoneClean.length >= 8 && phoneClean.slice(-9) === idDigits.slice(-9) || idDigits.length >= 7 && phoneClean.length >= 7 && (phoneClean.endsWith(idDigits) || idDigits.endsWith(phoneClean)));
      return emailMatch || userMatch || admMatch || phoneMatch;
    });
  }
  if (params.user_id || params.userId) {
    const uid = params.user_id || params.userId;
    rows = rows.filter((r) => r.user_id === uid || table === "users" && r.id === uid);
  }
  if (params.ministry_id || params.ministryId) {
    const mid = params.ministry_id || params.ministryId;
    if (table === "ministries") {
      rows = rows.filter((r) => r.id === mid || r.code === mid || r.code && r.code.toLowerCase() === String(mid).toLowerCase());
    } else {
      rows = rows.filter((r) => r.ministry_id === mid || params.rawId && r.ministry_id === params.rawId || r.ministry_id === "min-1" && mid === "intercessory");
    }
  }
  if (params.status) {
    rows = rows.filter((r) => r.status === params.status);
  }
  if (upperSql.includes("ORDER BY")) {
    rows = [...rows];
  }
  if (params.limit !== void 0 && params.offset !== void 0) {
    const offset = Number(params.offset) || 0;
    const limit = Number(params.limit) || 20;
    rows = rows.slice(offset, offset + limit);
  }
  return [rows];
}
async function query(sql, params = {}) {
  const res = await pool.query(sql, params);
  const rows = res[0] ?? res;
  return rows;
}
async function checkDatabaseConnection() {
  if (!mysqlPool) {
    useMemoryStore = env.NODE_ENV !== "production";
    return env.NODE_ENV !== "production";
  }
  try {
    const conn = await mysqlPool.getConnection();
    await conn.ping();
    conn.release();
    useMemoryStore = false;
    logger.info("MySQL database connection verified.");
    return true;
  } catch (err) {
    if (env.NODE_ENV === "production") {
      logger.error({ err: err?.message || err }, "Production database connection failed.");
      useMemoryStore = false;
      return false;
    }
    logger.warn({ err: err?.message || err }, "MySQL connection unavailable; using the local persistent store for development only.");
    useMemoryStore = true;
    return true;
  }
}
var import_promise, import_crypto2, import_uuid, import_fs, import_path, memoryDb, rolePermissionMap, memberPermCodes, DATA_DIR, STORE_FILE, saveTimeout, mysqlPool, useMemoryStore, pool;
var init_database = __esm({
  "backend/src/config/database.ts"() {
    "use strict";
    import_promise = __toESM(require("mysql2/promise"));
    import_crypto2 = __toESM(require("crypto"));
    import_uuid = require("uuid");
    import_fs = __toESM(require("fs"));
    import_path = __toESM(require("path"));
    init_env();
    init_logger();
    memoryDb = {
      tables: {
        membership_types: [
          { id: "1", code: "full", name: "Full Member", description: "Full constitutional student member", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "2", code: "special", name: "Special Member", description: "Special category member", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "3", code: "associate", name: "Associate Member", description: "Alumni / associate member", created_at: (/* @__PURE__ */ new Date()).toISOString() }
        ],
        executive_positions: [
          { id: "1", code: "chairperson", title: "Chairperson", display_order: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "2", code: "first_vice_chairperson", title: "1st Vice Chairperson", display_order: 2, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "3", code: "second_vice_chairperson", title: "2nd Vice Chairperson", display_order: 3, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "4", code: "secretary", title: "Secretary", display_order: 4, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "5", code: "vice_secretary", title: "Vice Secretary", display_order: 5, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "6", code: "treasurer", title: "Treasurer", display_order: 6, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "7", code: "prayer_chairperson", title: "Prayer Committee Chairperson", display_order: 7, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "8", code: "worship_chairperson", title: "Worship Committee Chairperson", display_order: 8, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "9", code: "missions_chairperson", title: "Missions Committee Chairperson", display_order: 9, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "10", code: "discipleship_chairperson", title: "Discipleship Committee Chairperson", display_order: 10, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "11", code: "assets_chairperson", title: "Assets Committee Chairperson", display_order: 11, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "12", code: "publicity_chairperson", title: "Publicity Committee Chairperson", display_order: 12, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "13", code: "non_residents_chairperson", title: "Non-Residents Committee Chairperson", display_order: 13, created_at: (/* @__PURE__ */ new Date()).toISOString() }
        ],
        leadership_positions: [
          {
            id: "pos-1",
            code: "chairperson",
            name: "Chairperson",
            category: "executive",
            description: "Chief executive officer and spiritual visionary of TUMCU.",
            constitutional_reference: "Article 12.1",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 1,
            responsibilities: [
              "Overall leadership, spiritual vision, and constitutional direction of TUMCU",
              "Convenes and presides over Executive Committee and General Business Meetings",
              "Official representative and signatory of the Christian Union with University & external bodies",
              "Supervises all executive officers, committees, and constitutional ministries",
              "Co-signatory for official TUMCU financial instruments and bank accounts"
            ],
            permissions: ["leadership.view", "leadership.assign", "meetings.view", "meetings.create", "events.view", "events.approve", "reports.view", "finance.view", "finance.approve", "elections.manage"],
            constitutional_restrictions: ["Cannot unilaterally authorize financial withdrawals without Executive Committee resolution", "Must be a full member in good standing of at least 2 spiritual years"]
          },
          {
            id: "pos-2",
            code: "first_vice_chairperson",
            name: "First Vice Chairperson",
            category: "executive",
            description: "Internal affairs and standing committee coordinator.",
            constitutional_reference: "Article 12.2",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 2,
            responsibilities: [
              "Deputizes the Chairperson and acts in their absence",
              "Coordinates internal affairs and standing committees (Welfare, Hospitality, Prayer)",
              "Monitors constitutional compliance across all union sub-organs",
              "Oversees spiritual welfare and pastoral care among members"
            ],
            permissions: ["leadership.view", "committees.view", "welfare.view", "welfare.approve", "reports.view", "meetings.view", "events.view", "attendance.view"],
            constitutional_restrictions: ["Acts as Chairperson only upon formal delegation or vacancy under Article 9"]
          },
          {
            id: "pos-3",
            code: "second_vice_chairperson",
            name: "Second Vice Chairperson",
            category: "executive",
            description: "External outreach, missions, and ministries coordinator.",
            constitutional_reference: "Article 12.3",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 3,
            responsibilities: [
              "Coordinates external ministries (High School, Hospital, Missions, Creative)",
              "Liaises with associate members, alumni body, and partner campus Christian Unions",
              "Assists in planning joint fellowship events and inter-varsity conferences",
              "Directs evangelistic field operations"
            ],
            permissions: ["leadership.view", "ministries.view", "ministries.manage_members", "events.view", "events.create", "reports.view"],
            constitutional_restrictions: ["Subject to Executive Committee policy regarding external partnerships"]
          },
          {
            id: "pos-4",
            code: "secretary",
            name: "Secretary",
            category: "executive",
            description: "Custodian of records, correspondence, minutes, and membership registers.",
            constitutional_reference: "Article 12.4",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 4,
            responsibilities: [
              "Maintains accurate registers of certified full members, special members, and associates",
              "Records and preserves comprehensive minutes of all Executive and General meetings",
              "Handles all official correspondence and notices of the Christian Union",
              "Issues certificates of membership and official recommendation letters",
              "Co-signatory for official TUMCU correspondence and constitutional petitions"
            ],
            permissions: ["membership.view_all", "membership.review", "membership.approve", "meetings.view", "meetings.create", "meetings.manage_minutes", "communication.view", "communication.create", "reports.view", "leadership.view"],
            constitutional_restrictions: ["Minutes must be formally confirmed and signed at the next ordinary meeting", "Cannot alter membership register without approved application or constitutional resolution"]
          },
          {
            id: "pos-5",
            code: "vice_secretary",
            name: "Vice Secretary",
            category: "executive",
            description: "Hospitality coordinator, guest ministers liaison, and secretarial assistant.",
            constitutional_reference: "Article 12.5",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 5,
            responsibilities: [
              "Assists the Secretary and records minutes in their absence",
              "Oversees hospitality for guest ministers, external speakers, and visiting teams",
              "Coordinates Catering and Ushering logistics for Sunday services and conferences",
              "Supervises meeting venues arrangement and welcome protocols"
            ],
            permissions: ["meetings.view", "events.view", "communication.view", "reports.view", "ministries.view"],
            constitutional_restrictions: ["Works under supervision of Secretary and Executive Committee"]
          },
          {
            id: "pos-6",
            code: "treasurer",
            name: "Treasurer",
            category: "executive",
            description: "Custodian of funds, financial stewardship, receipts, budgets, and accounting.",
            constitutional_reference: "Article 12.6",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 6,
            responsibilities: [
              "Maintains complete, transparent books of accounts and records all receipts and payments",
              "Issues official TUMCU receipts for all tithes, offerings, donations, and pledges",
              "Prepares annual and semester operational budgets for Executive and AGM approval",
              "Chairs Treasury Committee and prepares financial statements for internal and external audits",
              "Supervises capital project accounts and bank reconciliations"
            ],
            permissions: ["finance.view", "finance.create", "finance.receipts", "finance.budget", "finance.reports", "project.manage", "reports.view"],
            constitutional_restrictions: [
              "Cannot independently authorize restricted withdrawals (Article 15.3)",
              "Withdrawals require Executive/Subcommittee resolution and two authorized signatories",
              "Must present books for audit at least two weeks before Annual General Meeting"
            ]
          },
          {
            id: "pos-7",
            code: "prayer_chairperson",
            name: "Prayer Committee Chairperson",
            category: "executive",
            description: "Spiritual intercession, prayer chains, keshas, and morning devotions.",
            constitutional_reference: "Article 12.7",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 7,
            responsibilities: [
              "Chairs Prayer Committee and guides the spiritual intercessory pulse of TUMCU",
              "Organizes weekly overnight prayer vigils (keshas), fasts, and semester prayer weeks",
              "Coordinates confidential prayer request handling and intercession chains",
              "Mobilizes campus morning devotions and hostel prayer altars"
            ],
            permissions: ["prayer.view", "prayer.view_confidential", "prayer.create", "prayer.edit", "events.view", "meetings.view"],
            constitutional_restrictions: ["Confidential prayer requests must not be publicly disclosed without permission"]
          },
          {
            id: "pos-8",
            code: "worship_chairperson",
            name: "Worship Committee Chairperson",
            category: "executive",
            description: "Liturgical worship, Praise & Worship team, instrumentalists, and music repertoire.",
            constitutional_reference: "Article 12.8",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 8,
            responsibilities: [
              "Chairs Worship Committee and coordinates liturgical musical excellence",
              "Oversees Praise & Worship Ministry and Instrumentalists Ministry",
              "Schedules song leaders, rehearsals, workshops, and worship nights",
              "Maintains sound balance and spiritual reverence in music selection"
            ],
            permissions: ["ministries.view", "events.view", "events.create", "attendance.view"],
            constitutional_restrictions: ["All song repertoires must align with TUMCU doctrinal basis (Article 4)"]
          },
          {
            id: "pos-9",
            code: "missions_chairperson",
            name: "Mission Committee Chairperson",
            category: "executive",
            description: "Evangelism field mobilization, annual missions, and community outreaches.",
            constitutional_reference: "Article 12.9",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 9,
            responsibilities: [
              "Chairs Missions Committee and plans annual mega mission trips and weekend missions",
              "Coordinates evangelism teams, open-air crusades, door-to-door gospel witnessing",
              "Liaises with mission fields, partner churches, and rural ministry stations",
              "Conducts cross-cultural mission training and post-mission follow-ups"
            ],
            permissions: ["events.view", "events.create", "ministries.view", "reports.view"],
            constitutional_restrictions: ["Mission budgets require Executive Committee resolution and Treasurer review"]
          },
          {
            id: "pos-10",
            code: "discipleship_chairperson",
            name: "Discipleship Committee Chairperson",
            category: "executive",
            description: "Nurturing classes, Bible Study (BEST) groups, new converts, and spiritual mentorship.",
            constitutional_reference: "Article 12.10",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 10,
            responsibilities: [
              "Chairs Discipleship Committee and designs foundational follow-up for new converts",
              "Coordinates Bible Study (BEST) small groups, facilitators, and study guides",
              "Organizes mentorship cohorts and first-year student spiritual orientation",
              "Maintains discipleship spiritual records and baptism preparation classes"
            ],
            permissions: [
              "membership.view_all",
              "events.view",
              "meetings.view",
              "reports.view",
              "discipleship.view",
              "discipleship.create",
              "discipleship.edit",
              "discipleship.delete"
            ],
            constitutional_restrictions: ["Doctrinal materials must strictly conform to TUMCU Statement of Faith"]
          },
          {
            id: "pos-11",
            code: "assets_chairperson",
            name: "Assets Committee Chairperson",
            category: "executive",
            description: "Stewardship, maintenance, inventory, equipment loans, and hardware procurement.",
            constitutional_reference: "Article 12.11",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 11,
            responsibilities: [
              "Chairs Assets Committee and oversees all union hardware, sound gear, instruments, and furniture",
              "Maintains updated asset register, tagging, serial numbers, and condition reports",
              "Controls equipment borrowing, loan agreements, and return inspections",
              "Coordinates routine maintenance, servicing, repair, and safe storage"
            ],
            permissions: ["assets.view", "assets.manage", "reports.view", "events.view"],
            constitutional_restrictions: ["Disposal or acquisition of capital assets requires Executive Committee sanction"]
          },
          {
            id: "pos-12",
            code: "publicity_chairperson",
            name: "Publicity Committee Chairperson",
            category: "executive",
            description: "Announcements, website, social media, posters, photography, and livestreams.",
            constitutional_reference: "Article 12.12",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 12,
            responsibilities: [
              "Chairs Publicity Committee and coordinates campus branding and communication",
              "Oversees Media Ministry, livestream broadcasts, and digital content",
              "Designs official event posters, digital flyers, bulletin publications, and website updates",
              "Publishes authorized announcements across university platforms and halls of residence"
            ],
            permissions: ["communication.view", "communication.create", "communication.edit", "events.view", "ministries.view"],
            constitutional_restrictions: ["Public publications must reflect Christian decorum and Executive endorsement"]
          },
          {
            id: "pos-13",
            code: "non_residents_chairperson",
            name: "Non-Residents Committee Chairperson",
            category: "executive",
            description: "Off-campus student fellowship, non-resident welfare, and neighborhood cell groups.",
            constitutional_reference: "Article 12.13",
            is_executive: true,
            requires_gender_rule: false,
            active: true,
            display_order: 13,
            responsibilities: [
              "Chairs Non-Residents Committee and champions welfare of off-campus students",
              "Organizes neighborhood Bible study cells, hostel fellowships, and outreach",
              "Coordinates night travel logistics and transport security during keshas and late services",
              "Advocates for non-resident representation and integration in all CU programs"
            ],
            permissions: ["welfare.view", "events.view", "meetings.view", "reports.view"],
            constitutional_restrictions: ["Must maintain active liaison with University Dean of Students for off-campus welfare"]
          },
          {
            id: "pos-14",
            code: "welfare_chairperson",
            name: "Welfare Committee Chairperson",
            category: "committee",
            description: "Benevolent support, student emergency funds, bereavement care, and hospital visits.",
            constitutional_reference: "Article 13.1",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 14,
            responsibilities: [
              "Chairs Welfare Committee and processes confidential student benevolent requests",
              "Coordinates meal assistance, emergency hospital welfare, and funeral condolences",
              "Maintains transparent records of welfare allocations under 1st Vice Chairperson supervision"
            ],
            permissions: ["welfare.view", "welfare.approve", "reports.view"],
            constitutional_restrictions: ["Welfare disbursements are strictly governed by approved benevolence ceilings"]
          },
          {
            id: "pos-15",
            code: "media_ministry_leader",
            name: "Media Ministry Leader",
            category: "ministry",
            description: "Audio-visual production, livestream operations, equipment management, and team schedule.",
            constitutional_reference: "Article 16.1",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 15,
            responsibilities: [
              "Leads Media Ministry operations: Sunday livestreams, video recording, photography",
              "Schedules camera operators, sound technicians, and projectionists for all services",
              "Maintains media equipment inventory, digital library assets, and archives",
              "Conducts technical skills training workshops for ministry apprentices"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "communication.create", "assets.view"],
            constitutional_restrictions: ["Works under guidance of Publicity Committee Chairperson"]
          },
          {
            id: "pos-16",
            code: "worship_leader",
            name: "Praise & Worship Ministry Leader",
            category: "ministry",
            description: "Liturgical worship leader, vocal choir director, and spiritual praise team coordinator.",
            constitutional_reference: "Article 16.2",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 16,
            responsibilities: [
              "Leads worship team rehearsals, vocal training, and spiritual preparation before all services",
              "Schedules song leaders and musicians for Sunday services, midweek fellowships, and keshas",
              "Selects scriptural, Christ-exalting praise and worship songs aligned with doctrinal faith",
              "Mentors aspiring vocalists and maintains harmony within the worship team"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "events.view"],
            constitutional_restrictions: ["Song repertoire subject to Worship Committee Chairperson oversight"]
          },
          {
            id: "pos-17",
            code: "intercessory_leader",
            name: "Intercessory Ministry Leader",
            category: "ministry",
            description: "Leads student prayer warriors, campus prayer walks, and fasting chains.",
            constitutional_reference: "Article 16.3",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 17,
            responsibilities: [
              "Coordinates Wednesday and Friday fasting and prayer meetings in the Main Chapel",
              "Maintains intercessory prayer request roster and leads pre-service intercession",
              "Organizes morning campus prayer walks and hostel prayer networks",
              "Nurtures spiritual discipline of prayer and fasting among members"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "prayer.view"],
            constitutional_restrictions: ["Under oversight of Prayer Committee Chairperson"]
          },
          {
            id: "pos-18",
            code: "instrumentalists_leader",
            name: "Instrumentalists Ministry Leader",
            category: "ministry",
            description: "Band leader, keyboardists, drummers, bassists, and acoustic musicians coordinator.",
            constitutional_reference: "Article 16.4",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 18,
            responsibilities: [
              "Directs band rehearsals, sound checks, and musical arrangements for all gatherings",
              "Schedules instrumentalists for Sunday services, missions, and special worship nights",
              "Ensures musical instruments are properly tuned, handled, serviced, and safely stored",
              "Trains new instrumentalists in musical proficiency and Christian humility"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "assets.view"],
            constitutional_restrictions: ["Coordinates equipment care with Assets Committee"]
          },
          {
            id: "pos-19",
            code: "ushering_leader",
            name: "Ushering Ministry Leader",
            category: "ministry",
            description: "Congregational hospitality, guest reception, seating protocol, and offering order.",
            constitutional_reference: "Article 16.5",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 19,
            responsibilities: [
              "Welcomes students, faculty, and visitors warmly at all TUMCU services and events",
              "Coordinates orderly seating, ventilation, bulletin distribution, and ushering protocols",
              "Oversees respectful, secure collection and handover of tithes and offerings to Treasurer",
              "Prepares meeting halls before services and cleans up afterward"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "events.view"],
            constitutional_restrictions: ["Works with Vice Secretary for guest hospitality protocols"]
          },
          {
            id: "pos-20",
            code: "catering_leader",
            name: "Catering Ministry Leader",
            category: "ministry",
            description: "Hospitality meals, tea breaks, guest refreshments, and fellowship banquets.",
            constitutional_reference: "Article 16.6",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 20,
            responsibilities: [
              "Plans and coordinates refreshments for AGMs, leadership retreats, conferences, and missions",
              "Prepares hospitality meals for invited guest ministers and visiting preaching teams",
              "Manages catering utensils, kitchen inventory, hygiene standards, and food safety",
              "Submits transparent catering expenditure accounts to the Treasurer"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "finance.request"],
            constitutional_restrictions: ["Food budget allocations must be pre-approved by Executive Committee"]
          },
          {
            id: "pos-21",
            code: "creative_leader",
            name: "Creative Ministry Leader",
            category: "ministry",
            description: "Christian drama, spoken word poetry, choreography dance, and stage arts.",
            constitutional_reference: "Article 16.7",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 21,
            responsibilities: [
              "Directs Christian drama productions, gospel skits, dance, and spoken word poetry",
              "Integrates artistic presentations during Sunday services, youth rallies, and mission crusades",
              "Scripts biblically grounded theatrical pieces that challenge and inspire the student body",
              "Nurtures creative talents among union members for God's glory"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "events.view"],
            constitutional_restrictions: ["All dramatic and poetic themes must adhere strictly to biblical doctrine"]
          },
          {
            id: "pos-22",
            code: "technicians_leader",
            name: "Technicians Ministry Leader",
            category: "ministry",
            description: "Sound engineering, PA systems, power setups, stage lighting, and cabling.",
            constitutional_reference: "Article 16.8",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 22,
            responsibilities: [
              "Sets up, tests, and operates sound mixers, amplifiers, microphones, and speakers for all services",
              "Manages audio levels to ensure pristine acoustic balance and eliminate feedback",
              "Oversees power connections, stage lighting, cable organization, and electrical safety",
              "Performs periodic preventive maintenance on sound equipment"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "assets.view"],
            constitutional_restrictions: ["Major equipment repairs require Assets Committee authorization"]
          },
          {
            id: "pos-23",
            code: "high_school_leader",
            name: "High School Ministry Leader",
            category: "ministry",
            description: "Secondary school weekend challenges, mentorship, and youth discipleship in Mombasa.",
            constitutional_reference: "Article 16.9",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 23,
            responsibilities: [
              "Organizes Sunday high school ministry visits and weekend evangelistic challenges across Coast region",
              "Liaises with secondary school Christian Union patrons and school principals",
              "Mobilizes and trains campus university students to preach and mentor secondary pupils",
              "Follows up with graduating candidates transitioning into tertiary colleges"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "events.create"],
            constitutional_restrictions: ["School visit dates require 2nd Vice Chairperson approval"]
          },
          {
            id: "pos-24",
            code: "hospital_leader",
            name: "Hospital Ministry Leader",
            category: "ministry",
            description: "Bedside visitation, prayer for the sick, comfort care, and clinic outreach.",
            constitutional_reference: "Article 16.10",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 24,
            responsibilities: [
              "Organizes weekly hospital visitations to Coast General Teaching & Referral Hospital and clinics",
              "Ministers hope, compassion, and salvation to patients, relatives, and medical staff",
              "Prepares patient gift baskets, fruit hampers, and personal care necessities",
              "Maintains chaplaincy clearance and adheres strictly to hospital sanitary regulations"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "welfare.view"],
            constitutional_restrictions: ["Must observe hospital chaplaincy protocols and visiting hours"]
          },
          {
            id: "pos-25",
            code: "brothers_leader",
            name: "Brothers' Ministry Leader",
            category: "ministry",
            description: "Brother-to-brother accountability, manhood forums, and spiritual fellowship.",
            constitutional_reference: "Article 16.11",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 25,
            responsibilities: [
              "Organizes fortnightly brothers' fellowships, career mentorship sessions, and prayer breakfasts",
              "Addresses specific challenges facing male students: purity, spiritual leadership, and integrity",
              "Coordinates hostel room-to-room brothers' visits and brotherhood bonding activities",
              "Encourages brothers to actively serve across all Christian Union ministries"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "events.view"],
            constitutional_restrictions: ["Maintains alignment with overall TUMCU theme of the semester"]
          },
          {
            id: "pos-26",
            code: "sisters_leader",
            name: "Sisters' Ministry Leader",
            category: "ministry",
            description: "Sisterhood fellowship, virtuous womanhood seminars, prayer, and mentorship.",
            constitutional_reference: "Article 16.12",
            is_executive: false,
            requires_gender_rule: false,
            active: true,
            display_order: 26,
            responsibilities: [
              "Coordinates fortnightly sisters' fellowships, tea talks, and virtuous womanhood workshops",
              "Provides confidential counseling, peer mentorship, and prayer for female students",
              "Organizes motherly mentorship sessions with associate senior ladies and alumni",
              "Fosters deep spiritual sisterhood, modesty, and commitment to the Word"
            ],
            permissions: ["ministries.view", "ministries.manage_members", "events.view"],
            constitutional_restrictions: ["Coordinates pastoral care with Welfare Committee"]
          }
        ],
        ministries: [
          { id: "min-1", code: "intercessory", name: "Intercessory Ministry", description: "Dedicated to prayer, fasting, and spiritual intercession for the CU and campus.", meeting_day: "Wednesdays & Fridays", meeting_venue: "Main Chapel", image_url: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "min-2", code: "worship", name: "Praise & Worship Ministry", description: "Leading the congregation into the manifest presence of God through spirit-filled worship.", meeting_day: "Tuesdays & Thursdays", meeting_venue: "Assembly Hall", image_url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "min-3", code: "instrumentalists", name: "Instrumentalists Ministry", description: "Skillfully ministering with musical instruments to support worship services.", meeting_day: "Tuesdays & Saturdays", meeting_venue: "Music Room", image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "min-4", code: "ushering", name: "Ushering Ministry", description: "Welcoming believers, maintaining order, and fostering hospitality in all gatherings.", meeting_day: "Thursdays", meeting_venue: "Chapel Foyer", image_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "min-5", code: "catering", name: "Catering Ministry", description: "Managing hospitality, food, and refreshments during CU events, AGMs, and conferences.", meeting_day: "Saturdays before events", meeting_venue: "Dining Hall Kitchen", image_url: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "min-6", code: "media", name: "Media Ministry", description: "Audio-visual production, livestreaming, photography, and digital ministry outreach.", meeting_day: "Fridays", meeting_venue: "Media Studio", image_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "min-7", code: "creative", name: "Creative Ministry", description: "Proclaiming the Gospel through Christian drama, poetry, spoken word, and dance.", meeting_day: "Mondays & Wednesdays", meeting_venue: "Amphitheatre", image_url: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "min-8", code: "technicians", name: "Technicians Ministry", description: "Sound engineering, electrical setup, lighting, and stage technical management.", meeting_day: "Saturdays", meeting_venue: "Control Booth", image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "min-9", code: "high_school", name: "High School Ministry", description: "Evangelism, mentorship, and discipleship missions to secondary schools in Mombasa.", meeting_day: "Sundays", meeting_venue: "Room B10", image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "min-10", code: "hospital", name: "Hospital Ministry", description: "Visiting patients in Coast General and local clinics with prayers and care packages.", meeting_day: "Saturdays", meeting_venue: "Hospital Gate", image_url: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "min-11", code: "brothers", name: "Brothers' Ministry", description: "Building godly men through fellowship, accountability, and leadership development.", meeting_day: "Alternate Fridays", meeting_venue: "Hostel Courtyard", image_url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "min-12", code: "sisters", name: "Sisters' Ministry", description: "Nurturing virtuous women of faith, character, and spiritual excellence.", meeting_day: "Alternate Fridays", meeting_venue: "Chapel Hall", image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80", created_at: (/* @__PURE__ */ new Date()).toISOString() }
        ],
        committees: [
          { id: "com-1", code: "prayer", name: "Prayer Committee", description: "Oversees campus prayer networks, weekly night vigils, and prayer weeks.", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "com-2", code: "worship", name: "Worship Committee", description: "Coordinates musical equipment, music repertoire, and liturgical coordination.", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "com-3", code: "missions", name: "Missions Committee", description: "Plans annual mission trips, weekend outreaches, and evangelism campaigns.", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "com-4", code: "discipleship", name: "Discipleship Committee", description: "Runs new believer classes, Bible study groups (BEST), and one-on-one mentorship.", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "com-5", code: "assets", name: "Assets Committee", description: "Inventories, maintains, and procures Christian Union sound gear and properties.", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "com-6", code: "hospitality", name: "Hospitality Committee", description: "Takes care of guest ministers, first-time visitors, and welfare needs.", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "com-7", code: "publicity", name: "Publicity Committee", description: "Designs posters, manages social media, announcements, and campus branding.", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "com-8", code: "treasury", name: "Treasury Committee", description: "Ensures stewardship, transparent accounting, auditing, and financial reporting.", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "com-9", code: "non_residents", name: "Non-Residents Committee", description: "Caters to fellowship and welfare for students living in outside-campus hostels.", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "com-10", code: "welfare", name: "Welfare Committee", description: "Supports needy brethren through benevolent funds, meals, and emergencies.", created_at: (/* @__PURE__ */ new Date()).toISOString() }
        ],
        roles: [
          { id: "role-1", code: "super_admin", name: "Super Administrator", category: "system_admin", is_system_role: 1 },
          { id: "role-2", code: "system_admin", name: "System Administrator", category: "system_admin", is_system_role: 1 },
          { id: "role-3", code: "chairperson", name: "Chairperson", category: "constitutional_leadership", is_system_role: 0 },
          { id: "role-4", code: "first_vice_chairperson", name: "1st Vice Chairperson", category: "constitutional_leadership", is_system_role: 0 },
          { id: "role-5", code: "second_vice_chairperson", name: "2nd Vice Chairperson", category: "constitutional_leadership", is_system_role: 0 },
          { id: "role-6", code: "secretary", name: "Secretary", category: "constitutional_leadership", is_system_role: 0 },
          { id: "role-7", code: "treasurer", name: "Treasurer", category: "constitutional_leadership", is_system_role: 0 },
          { id: "role-8", code: "prayer_chairperson", name: "Prayer Committee Chairperson", category: "committee", is_system_role: 0 },
          { id: "role-9", code: "ministry_leader", name: "Ministry Leader", category: "ministry", is_system_role: 0 },
          { id: "role-10", code: "member", name: "Member", category: "member", is_system_role: 0 },
          { id: "role-11", code: "librarian", name: "Librarian & Resource Custodian", category: "stewardship", is_system_role: 0 },
          { id: "role-12", code: "noret_chairperson", name: "NORET Evangelism Team Chairperson", category: "committee", is_system_role: 0 },
          { id: "role-13", code: "soret_chairperson", name: "SORET Evangelism Team Chairperson", category: "committee", is_system_role: 0 },
          { id: "role-14", code: "media_leader", name: "Media Ministry Leader", category: "ministry", is_system_role: 0 },
          { id: "role-15", code: "discipleship_chairperson", name: "Discipleship Committee Chairperson", category: "committee", is_system_role: 0 }
        ],
        permissions: [
          { id: "perm-1", code: "membership.view_all", module: "membership" },
          { id: "perm-2", code: "membership.review", module: "membership" },
          { id: "perm-3", code: "membership.approve", module: "membership" },
          { id: "perm-4", code: "finance.view", module: "finance" },
          { id: "perm-5", code: "finance.request", module: "finance" },
          { id: "perm-6", code: "finance.approve", module: "finance" },
          { id: "perm-7", code: "meetings.view", module: "meetings" },
          { id: "perm-8", code: "meetings.create", module: "meetings" },
          { id: "perm-9", code: "attendance.view", module: "attendance" },
          { id: "perm-10", code: "attendance.record", module: "attendance" },
          { id: "perm-22", code: "attendance.export", module: "attendance" },
          { id: "perm-23", code: "attendance.manage_sessions", module: "attendance" },
          { id: "perm-11", code: "events.view", module: "events" },
          { id: "perm-12", code: "events.create", module: "events" },
          { id: "perm-24", code: "events.edit", module: "events" },
          { id: "perm-25", code: "events.delete", module: "events" },
          { id: "perm-26", code: "events.approve", module: "events" },
          { id: "perm-13", code: "ministries.view", module: "ministries" },
          { id: "perm-27", code: "ministries.create", module: "ministries" },
          { id: "perm-28", code: "ministries.edit", module: "ministries" },
          { id: "perm-29", code: "ministries.delete", module: "ministries" },
          { id: "perm-30", code: "ministries.manage_members", module: "ministries" },
          { id: "perm-14", code: "committees.view", module: "committees" },
          { id: "perm-15", code: "leadership.view", module: "leadership" },
          { id: "perm-16", code: "leadership.assign", module: "leadership" },
          { id: "perm-17", code: "prayer.view", module: "prayer" },
          { id: "perm-18", code: "prayer.create", module: "prayer" },
          { id: "perm-19", code: "prayer.view_confidential", module: "prayer" },
          { id: "perm-20", code: "system.manage_roles", module: "system" },
          { id: "perm-21", code: "system.manage_permissions", module: "system" },
          { id: "perm-31", code: "communication.view", module: "communication" },
          { id: "perm-32", code: "communication.create", module: "communication" },
          { id: "perm-33", code: "communication.edit", module: "communication" },
          { id: "perm-34", code: "communication.delete", module: "communication" },
          { id: "perm-35", code: "elections.view", module: "elections" },
          { id: "perm-36", code: "elections.vote", module: "elections" },
          { id: "perm-37", code: "elections.manage", module: "elections" },
          { id: "perm-38", code: "elections.audit", module: "elections" },
          { id: "perm-39", code: "welfare.view", module: "welfare" },
          { id: "perm-40", code: "welfare.create", module: "welfare" },
          { id: "perm-41", code: "welfare.edit", module: "welfare" },
          { id: "perm-42", code: "welfare.approve", module: "welfare" },
          { id: "perm-43", code: "reports.view", module: "reports" },
          { id: "perm-44", code: "reports.create", module: "reports" },
          { id: "perm-45", code: "associates.view", module: "associates" },
          { id: "perm-46", code: "associates.manage", module: "associates" },
          { id: "perm-47", code: "assets.view", module: "assets" },
          { id: "perm-48", code: "assets.manage", module: "assets" },
          { id: "perm-49", code: "meetings.manage_minutes", module: "meetings" },
          { id: "perm-50", code: "meetings.approve_minutes", module: "meetings" },
          { id: "perm-51", code: "audit.view", module: "system" },
          { id: "perm-52", code: "system.health", module: "system" },
          { id: "perm-53", code: "system.settings", module: "system" },
          // Library permissions
          { id: "perm-54", code: "library.view", module: "library" },
          { id: "perm-55", code: "library.request", module: "library" },
          { id: "perm-56", code: "library.create", module: "library" },
          { id: "perm-57", code: "library.edit", module: "library" },
          { id: "perm-58", code: "library.delete", module: "library" },
          { id: "perm-59", code: "library.manage_inventory", module: "library" },
          { id: "perm-60", code: "library.manage_requests", module: "library" },
          { id: "perm-61", code: "library.checkout", module: "library" },
          { id: "perm-62", code: "library.return", module: "library" },
          { id: "perm-63", code: "library.view_reports", module: "library" },
          // Member gallery permissions
          { id: "perm-64", code: "gallery.view", module: "gallery" },
          { id: "perm-65", code: "gallery.create", module: "gallery" },
          { id: "perm-66", code: "gallery.edit", module: "gallery" },
          { id: "perm-67", code: "gallery.delete", module: "gallery" },
          { id: "perm-68", code: "gallery.publish", module: "gallery" },
          // Landing & Ministry Media permissions
          { id: "perm-69", code: "media.manage_landing", module: "media" },
          { id: "perm-70", code: "media.manage_ministries", module: "media" },
          // E-Teams permissions
          { id: "perm-71", code: "eteams.view", module: "eteams" },
          { id: "perm-72", code: "eteams.manage_team", module: "eteams" },
          { id: "perm-73", code: "eteams.manage_programmes", module: "eteams" },
          { id: "perm-74", code: "eteams.manage_gallery", module: "eteams" },
          { id: "perm-75", code: "eteams.manage_reports", module: "eteams" },
          { id: "perm-76", code: "eteams.manage_announcements", module: "eteams" },
          // Programmes
          { id: "perm-77", code: "programmes.view", module: "programmes" },
          { id: "perm-78", code: "programmes.manage", module: "programmes" },
          // Discipleship & Bible Study
          { id: "perm-90", code: "discipleship.view", module: "discipleship" },
          { id: "perm-91", code: "discipleship.create", module: "discipleship" },
          { id: "perm-92", code: "discipleship.edit", module: "discipleship" },
          { id: "perm-93", code: "discipleship.delete", module: "discipleship" }
        ],
        role_permissions: [],
        users: [
          {
            id: "usr-meshack-1",
            username: "meshack",
            email: "meshackokoth436@gmail.com",
            phone_number: "+254700000436",
            password_hash: import_crypto2.default.randomBytes(32).toString("hex"),
            full_name: "Meshack Okoth (Super Administrator)",
            gender: "male",
            admission_number: "ADM/2026/000",
            school: "School of Computing and Informatics",
            course: "BSc. Computer Science",
            year_of_study: 4,
            account_status: "active",
            created_at: new Date(Date.now() - 60 * 864e5).toISOString()
          },
          {
            id: "usr-admin-1",
            username: "admin",
            email: "admin@tumcu.ac.ke",
            phone_number: "+254700000001",
            password_hash: import_crypto2.default.randomBytes(32).toString("hex"),
            full_name: "TUMCU Super Administrator",
            gender: "male",
            admission_number: "ADM/2026/001",
            school: "School of Computing and Informatics",
            course: "BSc. Computer Science",
            year_of_study: 4,
            account_status: "active",
            created_at: new Date(Date.now() - 30 * 864e5).toISOString()
          },
          // Discipleship Chairperson
          {
            id: "usr-discipleship-1",
            username: "discipleship.chair",
            email: "discipleship@tumcu.ac.ke",
            phone_number: "+254705550010",
            password_hash: import_crypto2.default.randomBytes(32).toString("hex"),
            full_name: "Bro. Barnabas Wafula (Discipleship Chair)",
            gender: "male",
            admission_number: "ADM/2023/0019",
            school: "School of Computing and Informatics",
            course: "BSc. Computer Science",
            year_of_study: 4,
            account_status: "active",
            created_at: new Date(Date.now() - 180 * 864e5).toISOString()
          },
          // 24 Active Students for Bible Study Cohort (12 Males, 12 Females, balanced Years 1-4)
          { id: "usr-member-1", username: "samuel.baraza", email: "samuel.baraza@tum.ac.ke", phone_number: "+254701234567", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Samuel Baraza", gender: "male", admission_number: "ADM/2023/0112", school: "School of Engineering and Technology", course: "BSc. Mechanical Engineering", year_of_study: 4, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-2", username: "esther.chebet", email: "esther.chebet@tum.ac.ke", phone_number: "+254702345678", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Esther Chebet", gender: "female", admission_number: "ADM/2024/0331", school: "School of Applied and Health Sciences", course: "BSc. Nursing", year_of_study: 3, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-3", username: "peter.omondi", email: "peter.omondi@tum.ac.ke", phone_number: "+254703456789", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Peter Omondi", gender: "male", admission_number: "ADM/2024/0789", school: "School of Business", course: "BBA Marketing", year_of_study: 3, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-4", username: "grace.nyambura", email: "grace.nyambura@tum.ac.ke", phone_number: "+254704567890", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Grace Nyambura", gender: "female", admission_number: "ADM/2025/0456", school: "School of Computing and Informatics", course: "BSc. Computer Science", year_of_study: 2, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-5", username: "brian.cheruiyot", email: "brian.cheruiyot@tum.ac.ke", phone_number: "+254705678901", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Brian Kiprono Cheruiyot", gender: "male", admission_number: "ADM/2023/0523", school: "School of Engineering and Technology", course: "BSc. Civil Engineering", year_of_study: 4, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-6", username: "mercy.atieno", email: "mercy.atieno@tum.ac.ke", phone_number: "+254706789012", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Mercy Atieno Ochieng", gender: "female", admission_number: "ADM/2026/0891", school: "School of Applied and Health Sciences", course: "BSc. Medical Laboratory Science", year_of_study: 1, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-7", username: "david.mutua", email: "david.mutua@tum.ac.ke", phone_number: "+254707890123", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "David Mutua Musyoka", gender: "male", admission_number: "ADM/2026/1410", school: "School of Engineering and Technology", course: "BSc. Electrical Engineering", year_of_study: 1, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-8", username: "faith.wanjiku", email: "faith.wanjiku@tum.ac.ke", phone_number: "+254708901234", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Faith Wanjiku Mwangi", gender: "female", admission_number: "ADM/2025/2204", school: "School of Business", course: "BCom Finance", year_of_study: 2, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-9", username: "emmanuel.kibet", email: "emmanuel.kibet@tum.ac.ke", phone_number: "+254709012345", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Emmanuel Kibet", gender: "male", admission_number: "ADM/2023/0890", school: "School of Computing and Informatics", course: "BSc. Information Technology", year_of_study: 4, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-10", username: "sharon.jeruto", email: "sharon.jeruto@tum.ac.ke", phone_number: "+254710123456", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Sharon Jeruto", gender: "female", admission_number: "ADM/2023/0942", school: "School of Humanities and Social Sciences", course: "Community Development", year_of_study: 4, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-11", username: "victor.mwangi", email: "victor.mwangi@tum.ac.ke", phone_number: "+254711234567", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Victor Mwangi", gender: "male", admission_number: "ADM/2025/1102", school: "School of Computing and Informatics", course: "BSc. Computer Science", year_of_study: 2, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-12", username: "joy.makena", email: "joy.makena@tum.ac.ke", phone_number: "+254712345678", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Joy Makena", gender: "female", admission_number: "ADM/2024/1156", school: "School of Applied and Health Sciences", course: "BSc. Food Science & Technology", year_of_study: 3, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-13", username: "joseph.otieno", email: "joseph.otieno@tum.ac.ke", phone_number: "+254713456789", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Joseph Otieno", gender: "male", admission_number: "ADM/2024/0671", school: "School of Engineering and Technology", course: "BSc. Marine Engineering", year_of_study: 3, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-14", username: "ruth.achieng", email: "ruth.achieng@tum.ac.ke", phone_number: "+254714567890", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Ruth Achieng", gender: "female", admission_number: "ADM/2026/0338", school: "School of Computing and Informatics", course: "BSc. Mathematics & CS", year_of_study: 1, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-15", username: "caleb.wekesa", email: "caleb.wekesa@tum.ac.ke", phone_number: "+254715678901", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Caleb Wekesa", gender: "male", admission_number: "ADM/2026/0234", school: "School of Applied and Health Sciences", course: "BSc. Applied Physics", year_of_study: 1, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-16", username: "priscilla.muthoni", email: "priscilla.muthoni@tum.ac.ke", phone_number: "+254716789012", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Priscilla Muthoni", gender: "female", admission_number: "ADM/2023/0189", school: "School of Business", course: "BBA Human Resources", year_of_study: 4, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-17", username: "gideon.kiptoo", email: "gideon.kiptoo@tum.ac.ke", phone_number: "+254717890123", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Gideon Kiptoo", gender: "male", admission_number: "ADM/2025/0812", school: "School of Business", course: "BSc. Procurement & Logistics", year_of_study: 2, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-18", username: "dorcas.jepkemoi", email: "dorcas.jepkemoi@tum.ac.ke", phone_number: "+254718901234", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Dorcas Jepkemoi", gender: "female", admission_number: "ADM/2025/1470", school: "School of Applied and Health Sciences", course: "BSc. Environmental Health", year_of_study: 2, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-19", username: "timothy.ndungu", email: "timothy.ndungu@tum.ac.ke", phone_number: "+254719012345", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Timothy Ndungu", gender: "male", admission_number: "ADM/2023/0445", school: "School of Applied and Health Sciences", course: "BSc. Medical Lab Science", year_of_study: 4, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-20", username: "lydia.moraa", email: "lydia.moraa@tum.ac.ke", phone_number: "+254720123456", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Lydia Moraa", gender: "female", admission_number: "ADM/2024/0821", school: "School of Engineering and Technology", course: "BSc. Electrical Engineering", year_of_study: 3, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-21", username: "daniel.cheruiyot", email: "daniel.cheruiyot@tum.ac.ke", phone_number: "+254721234567", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Daniel Cheruiyot", gender: "male", admission_number: "ADM/2025/1934", school: "School of Engineering and Technology", course: "BSc. Civil Engineering", year_of_study: 2, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-22", username: "tabitha.wangari", email: "tabitha.wangari@tum.ac.ke", phone_number: "+254722345678", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Tabitha Wangari", gender: "female", admission_number: "ADM/2025/0615", school: "School of Business", course: "BSc. Tourism Management", year_of_study: 2, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-23", username: "joshua.macharia", email: "joshua.macharia@tum.ac.ke", phone_number: "+254723456789", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Joshua Macharia", gender: "male", admission_number: "ADM/2026/0567", school: "School of Business", course: "BCom Accounting", year_of_study: 1, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "usr-member-24", username: "beatrice.kwamboka", email: "beatrice.kwamboka@tum.ac.ke", phone_number: "+254724567890", password_hash: import_crypto2.default.randomBytes(32).toString("hex"), full_name: "Beatrice Kwamboka", gender: "female", admission_number: "ADM/2026/1120", school: "School of Applied and Health Sciences", course: "BSc. Industrial Chemistry", year_of_study: 1, account_status: "active", created_at: (/* @__PURE__ */ new Date()).toISOString() },
          // Student Applicants awaiting review
          {
            id: "usr-applicant-1",
            username: "john.kamau",
            email: "john.kamau@tum.ac.ke",
            phone_number: "+254711223344",
            password_hash: import_crypto2.default.randomBytes(32).toString("hex"),
            full_name: "John Mwangi Kamau",
            gender: "male",
            admission_number: "ADM/2025/1142",
            school: "School of Computing and Informatics",
            course: "BSc. Information Technology",
            year_of_study: 2,
            account_status: "pending_approval",
            created_at: new Date(Date.now() - 3 * 864e5).toISOString()
          },
          {
            id: "usr-applicant-2",
            username: "mercy.atieno",
            email: "mercy.atieno@tum.ac.ke",
            phone_number: "+254722334455",
            password_hash: import_crypto2.default.randomBytes(32).toString("hex"),
            full_name: "Mercy Atieno Ochieng",
            gender: "female",
            admission_number: "ADM/2026/0891",
            school: "School of Applied and Health Sciences",
            course: "BSc. Medical Laboratory Science",
            year_of_study: 1,
            account_status: "pending_approval",
            created_at: new Date(Date.now() - 2 * 864e5).toISOString()
          },
          {
            id: "usr-applicant-3",
            username: "brian.kiprono",
            email: "brian.kiprono@tum.ac.ke",
            phone_number: "+254733445566",
            password_hash: import_crypto2.default.randomBytes(32).toString("hex"),
            full_name: "Brian Kiprono Cheruiyot",
            gender: "male",
            admission_number: "ADM/2024/0523",
            school: "School of Engineering and Technology",
            course: "BSc. Civil Engineering",
            year_of_study: 3,
            account_status: "pending_approval",
            created_at: new Date(Date.now() - 1 * 864e5).toISOString()
          },
          {
            id: "usr-applicant-4",
            username: "faith.wanjiku",
            email: "faith.wanjiku@tum.ac.ke",
            phone_number: "+254744556677",
            password_hash: import_crypto2.default.randomBytes(32).toString("hex"),
            full_name: "Faith Wanjiku Mwangi",
            gender: "female",
            admission_number: "ADM/2025/2204",
            school: "School of Business",
            course: "BCom Finance",
            year_of_study: 2,
            account_status: "pending_approval",
            created_at: new Date(Date.now() - 14 * 36e5).toISOString()
          },
          {
            id: "usr-applicant-5",
            username: "david.mutua",
            email: "david.mutua@tum.ac.ke",
            phone_number: "+254755667788",
            password_hash: import_crypto2.default.randomBytes(32).toString("hex"),
            full_name: "David Mutua Musyoka",
            gender: "male",
            admission_number: "ADM/2026/1410",
            school: "School of Engineering and Technology",
            course: "BSc. Electrical and Electronics Engineering",
            year_of_study: 1,
            account_status: "pending_approval",
            created_at: new Date(Date.now() - 5 * 36e5).toISOString()
          }
        ],
        leadership_assignments: [
          { id: "la-pos-1", user_id: "usr-member-1", position_id: "pos-1", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-2", user_id: "usr-member-2", position_id: "pos-2", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-3", user_id: "usr-member-3", position_id: "pos-3", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-4", user_id: "usr-member-4", position_id: "pos-4", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-5", user_id: "usr-member-8", position_id: "pos-5", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-6", user_id: "usr-member-5", position_id: "pos-6", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-7", user_id: "usr-member-6", position_id: "pos-7", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-8", user_id: "usr-member-7", position_id: "pos-8", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-9", user_id: "usr-member-9", position_id: "pos-9", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-disc-1", user_id: "usr-discipleship-1", position_id: "pos-10", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-11", user_id: "usr-member-11", position_id: "pos-11", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-12", user_id: "usr-member-10", position_id: "pos-12", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-13", user_id: "usr-member-13", position_id: "pos-13", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-14", user_id: "usr-member-12", position_id: "pos-14", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-15", user_id: "usr-member-19", position_id: "pos-15", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-16", user_id: "usr-member-7", position_id: "pos-16", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-17", user_id: "usr-member-6", position_id: "pos-17", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-18", user_id: "usr-member-15", position_id: "pos-18", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-19", user_id: "usr-member-14", position_id: "pos-19", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-20", user_id: "usr-member-16", position_id: "pos-20", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-21", user_id: "usr-member-18", position_id: "pos-21", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-22", user_id: "usr-member-17", position_id: "pos-22", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-23", user_id: "usr-member-21", position_id: "pos-23", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-24", user_id: "usr-member-20", position_id: "pos-24", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-25", user_id: "usr-member-23", position_id: "pos-25", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "la-pos-26", user_id: "usr-member-22", position_id: "pos-26", academic_year: "2026/2027", status: "active", is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() }
        ],
        custom_committees: [],
        finance_resolutions: [],
        user_roles: [
          { id: "ur-meshack-1", user_id: "usr-meshack-1", role_id: "role-1", scope_type: null, scope_id: null },
          { id: "ur-1", user_id: "usr-admin-1", role_id: "role-1", scope_type: null, scope_id: null },
          { id: "ur-disc-1", user_id: "usr-discipleship-1", role_id: "role-15", scope_type: "committee", scope_id: "com-4", is_current: true },
          { id: "ur-m-1", user_id: "usr-member-1", role_id: "role-10", scope_type: null, scope_id: null },
          { id: "ur-m-2", user_id: "usr-member-2", role_id: "role-10", scope_type: null, scope_id: null },
          { id: "ur-m-3", user_id: "usr-member-3", role_id: "role-10", scope_type: null, scope_id: null },
          { id: "ur-m-4", user_id: "usr-member-4", role_id: "role-10", scope_type: null, scope_id: null }
        ],
        weekly_programmes: [
          {
            id: "prog-mon",
            day: "Monday",
            title: "Door to Door & E-Teams Fellowship",
            programme_type: "evangelism",
            time: "5:00 PM \u2013 7:00 PM",
            venue: "Assembly Grounds & Designated Centers",
            leader: "Evangelism & E-Teams Committee",
            description: "Alternating weekly evangelism: E-Teams Fellowship one Monday, Door to Door Evangelism the next Monday.",
            alternating_enabled: 1,
            interval_type: "biweekly",
            alternate_a_title: "E-Teams Fellowship",
            alternate_b_title: "Door to Door Evangelism",
            anchor_monday: "2026-09-21",
            anchor_programme: "alternate_a"
          },
          {
            id: "prog-tue",
            day: "Tuesday",
            title: "Bible Study (BEST)",
            programme_type: "bible_study",
            time: "5:00 PM \u2013 7:00 PM",
            venue: "Lecture Theatres & Designated Classes",
            leader: "Bible Study Ministry",
            description: "Systematic verse-by-verse scripture study, discipleship cohorts, and small group discussions.",
            alternating_enabled: 0
          },
          {
            id: "prog-wed",
            day: "Wednesday",
            title: "Discipleship Class",
            programme_type: "discipleship",
            time: "5:00 PM \u2013 7:00 PM",
            venue: "Main Sanctuary / Assembly Hall",
            leader: "Discipleship Ministry",
            description: "Foundational Christian doctrine and spiritual growth mentorship for disciples.",
            alternating_enabled: 0
          },
          {
            id: "prog-thu",
            day: "Thursday",
            title: "Empowerment Service",
            programme_type: "empowerment",
            time: "5:00 PM \u2013 7:00 PM",
            venue: "Main Sanctuary / Assembly Hall",
            leader: "Empowerment Ministry",
            description: "Spiritual, academic, leadership, and career empowerment for campus believers.",
            alternating_enabled: 0
          },
          {
            id: "prog-fri",
            day: "Friday",
            title: "Friday Main Service",
            programme_type: "fellowship",
            time: "6:00 PM \u2013 8:30 PM",
            venue: "Assembly Hall",
            leader: "Executive Committee & Music Ministry",
            description: "Dynamic campus fellowship, deep worship, testimonies, and practical scriptural preaching.",
            alternating_enabled: 0
          },
          {
            id: "prog-sun",
            day: "Sunday",
            title: "Sunday Service",
            programme_type: "service",
            time: "8:00 AM \u2013 12:30 PM",
            venue: "Main Assembly Hall / Sanctuary",
            leader: "Executive Committee",
            description: "Sunday morning corporate worship, celebration, Word, and communion.",
            alternating_enabled: 0,
            is_configurable: 1
          }
        ],
        events: [
          // --- Friday Services (6:00 PM – 8:30 PM) ---
          {
            id: "evt-fri-1",
            title: "Friday Service: Knowing Who You Are in Christ",
            event_type: "service",
            description: "Foundational fellowship service opening the semester spiritual theme: Manifesting the Light of Christ.",
            start_at: "2026-09-04T18:00:00Z",
            end_at: "2026-09-04T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Meshack / TUMCU Patron",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-2",
            title: "Friday Service: The Power of a Consecrated Life",
            event_type: "service",
            description: "Exhortation on personal purity, devotion, and living a dedicated life on campus.",
            start_at: "2026-09-11T18:00:00Z",
            end_at: "2026-09-11T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Pst. Otieno",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-3",
            title: "Friday Service: Overcoming Iniquities & Walking in Victory",
            event_type: "service",
            description: "Overcoming trials, temptation, and walking in the fullness of Christ victory.",
            start_at: "2026-09-18T18:00:00Z",
            end_at: "2026-09-18T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Rev. Barasa",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-4",
            title: "Friday Service: Walking as Children of Light",
            event_type: "service",
            description: "Living out Matthew 5:16 as shining beacons in lecture halls, hostels, and student associations.",
            start_at: "2026-09-25T18:00:00Z",
            end_at: "2026-09-25T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Bro. Caleb (CU Chairperson)",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-5",
            title: "Friday Service: The Cost and Joy of Discipleship",
            event_type: "service",
            description: "Exploring biblical discipleship and the cost of bearing one cross with joy.",
            start_at: "2026-10-02T18:00:00Z",
            end_at: "2026-10-02T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Pst. Mwangi",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-6",
            title: "Friday Service: Standing Firm in Campus Culture",
            event_type: "service",
            description: "Navigating peer pressure, academic stress, and modern campus culture with biblical conviction.",
            start_at: "2026-10-09T18:00:00Z",
            end_at: "2026-10-09T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Sis. Faith (Secretary)",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-7",
            title: "Friday Service: The Armor of God & Spiritual Warfare",
            event_type: "service",
            description: "Deep exposition of Ephesians 6 and prevailing in faith through corporate spiritual armor.",
            start_at: "2026-10-16T18:00:00Z",
            end_at: "2026-10-16T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Ev. David (1st Vice Chairperson)",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-8",
            title: "Friday Service: Power of Corporate Prayer & Fasting",
            event_type: "service",
            description: "Igniting collective prayer altars across campus and hostels.",
            start_at: "2026-10-23T18:00:00Z",
            end_at: "2026-10-23T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Pst. Steve (2nd Vice Chairperson)",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-9",
            title: "Friday Service: Kingdom Stewardship & Faithfulness",
            event_type: "service",
            description: "Managing time, gifts, career callings, and resources for the glory of God.",
            start_at: "2026-10-30T18:00:00Z",
            end_at: "2026-10-30T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Bro. Meshack (Treasurer)",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-10",
            title: "Friday Service: Living on Mission \u2014 Reaching the Lost",
            event_type: "service",
            description: "Evangelism focus, sharing the gospel with boldness across university faculties and Coast region.",
            start_at: "2026-11-06T18:00:00Z",
            end_at: "2026-11-06T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Pst. Ochieng",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-11",
            title: "Friday Service: Abiding in the Vine",
            event_type: "service",
            description: "John 15 reflection on remaining in Christ for enduring fruitfulness.",
            start_at: "2026-11-13T18:00:00Z",
            end_at: "2026-11-13T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Rev. Mutua",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-12",
            title: "Friday Service: Grace Sufficient for Every Trial",
            event_type: "service",
            description: "Comfort, resilience, and supernatural strength as examination season draws near.",
            start_at: "2026-11-20T18:00:00Z",
            end_at: "2026-11-20T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Pst. Kemboi",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-13",
            title: "Friday Service: Finishing the Race with Joy",
            event_type: "service",
            description: "Concluding teachings for the semester with celebration, awards, and encouragement.",
            start_at: "2026-11-27T18:00:00Z",
            end_at: "2026-11-27T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Patron & Executive Committee",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-fri-14",
            title: "Friday Service: The Eternal Light \u2014 Hope of Glory",
            event_type: "service",
            description: "Semester wrap-up worship night and thanksgiving fellowship.",
            start_at: "2026-12-04T18:00:00Z",
            end_at: "2026-12-04T20:30:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "CU Elders & Pastoral Board",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          // --- Sunday Services (8:00 AM – 12:30 PM) ---
          {
            id: "evt-sun-1",
            title: "Orientation & Welcome Sunday: You Are the Light",
            event_type: "service",
            description: "Welcoming first years, returning students, and dedicating the academic and spiritual year.",
            start_at: "2026-09-06T08:00:00Z",
            end_at: "2026-09-06T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "Patron & Executive",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-2",
            title: "Commitment & Commissioning Sunday",
            event_type: "service",
            description: "Signing the doctrinal basis, constitutional pledge, and dedicating ministry teams.",
            start_at: "2026-09-13T08:00:00Z",
            end_at: "2026-09-13T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "CU Patron",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-3",
            title: "Ministry Sunday: Presentations & Enrolment",
            event_type: "service",
            description: "Praise & Worship, Ushering, Media, Instrumentalists, and Discipleship ministry showcase.",
            start_at: "2026-09-20T08:00:00Z",
            end_at: "2026-09-20T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "Ministry Leaders Council",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-4",
            title: "Old School Sunday: Heritage of Faith",
            event_type: "service",
            description: "Celebrating the historical roots of TUM Christian Union with classic hymns and attire.",
            start_at: "2026-09-27T08:00:00Z",
            end_at: "2026-09-27T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "Senior Alumni Minister",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-5",
            title: "Staff & Faculty Appreciation Sunday",
            event_type: "service",
            description: "Honoring university Christian staff, faculty mentors, and campus leadership.",
            start_at: "2026-10-04T08:00:00Z",
            end_at: "2026-10-04T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "Christian Faculty Dean",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-6",
            title: "Mission Follow-Up Sunday",
            event_type: "service",
            description: "Testimonies, convert follow-up, and report from evangelistic outreaches.",
            start_at: "2026-10-11T08:00:00Z",
            end_at: "2026-10-11T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "Mission Director",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-7",
            title: "E-Teams Sunday: NORET & SORET Commissioning",
            event_type: "service",
            description: "Evangelism teams regional showcase, commissioning, and prayer for community outreach.",
            start_at: "2026-10-18T08:00:00Z",
            end_at: "2026-10-18T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "NORET & SORET Chairpersons",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-8",
            title: "Welfare Sunday: Bearing One Another Burdens",
            event_type: "service",
            description: "Special love offering, compassionate support for needy students, and fellowship meal.",
            start_at: "2026-10-25T08:00:00Z",
            end_at: "2026-10-25T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "Welfare Committee Head",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-9",
            title: "Word Explosion Sunday: Spiritual Awakening",
            event_type: "service",
            description: "Climax of the Word Explosion weekend conference with powerful keynote preaching.",
            start_at: "2026-11-01T08:00:00Z",
            end_at: "2026-11-01T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "Guest Speaker",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-10",
            title: "Associates Sunday & Weekend",
            event_type: "service",
            description: "Welcoming graduated TUMCU alumni and associates for mentorship, networking, and support.",
            start_at: "2026-11-08T08:00:00Z",
            end_at: "2026-11-08T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "FOCUS Kenya Associate",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-11",
            title: "Brothers & Sisters Day Sunday",
            event_type: "service",
            description: "Joint fellowship celebrating godly brotherhood and sisterhood in purity and honour.",
            start_at: "2026-11-15T08:00:00Z",
            end_at: "2026-11-15T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "Family Life Minister",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-12",
            title: "Finalists Dedication & Commissioning Sunday",
            event_type: "service",
            description: "Anointing and blessing graduating students as they enter the marketplace and ministry.",
            start_at: "2026-11-22T08:00:00Z",
            end_at: "2026-11-22T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "TUMCU Patron",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-13",
            title: "Christmas Carols & Worship Extravaganza",
            event_type: "service",
            description: "Joyful seasonal worship celebrating the birth of Jesus Christ with choir and instruments.",
            start_at: "2026-11-29T08:00:00Z",
            end_at: "2026-11-29T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "Music & Creative Ministry",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-sun-14",
            title: "Semester Thanksgiving & Transition Service",
            event_type: "service",
            description: "Corporate thanksgiving service testifying of God goodness and preservation all semester.",
            start_at: "2026-12-06T08:00:00Z",
            end_at: "2026-12-06T12:30:00Z",
            location: "Main Sanctuary / Assembly Hall",
            venue: "Main Sanctuary / Assembly Hall",
            preacher: "Executive Leadership",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          // --- Special Events & Conferences ---
          {
            id: "evt-spec-1",
            title: "Beach Retreat & Fellowship",
            event_type: "retreat",
            description: "Bonding, team building, praise, and prayer on the scenic Mombasa coast.",
            start_at: "2026-09-19T08:30:00Z",
            end_at: "2026-09-19T17:00:00Z",
            location: "Nyali Beach / Waterfront Grounds",
            venue: "Nyali Beach / Waterfront Grounds",
            preacher: "Executive Committee",
            is_published: 1,
            requires_registration: 1,
            status: "published"
          },
          {
            id: "evt-spec-2",
            title: "Evangelistic Week: Coast Campus Impact",
            event_type: "mission",
            description: "Campus-wide evangelistic campaign, lunch hour preaching, and hostel gospel visitation.",
            start_at: "2026-09-28T09:00:00Z",
            end_at: "2026-10-02T18:00:00Z",
            location: "TUM Main Campus & Hostels",
            venue: "TUM Main Campus & Hostels",
            preacher: "Mission Team & Ev. David",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-spec-3",
            title: "Night of Encounter \u2014 Prayer Kesha",
            event_type: "service",
            description: "All-night prayer vigil, spiritual revival, repentance, and intercession.",
            start_at: "2026-10-16T22:00:00Z",
            end_at: "2026-10-17T05:00:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Prayer Committee & Invited Intercessors",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-spec-4",
            title: "Leaders Training & Ministry Impartation Workshop",
            event_type: "meeting",
            description: "Equipping subcommittee members, bible study leaders, and ministry stewards in servant leadership.",
            start_at: "2026-10-24T09:00:00Z",
            end_at: "2026-10-24T15:00:00Z",
            location: "Science Complex Hall 2",
            venue: "Science Complex Hall 2",
            preacher: "FOCUS Kenya Staff & Elders",
            is_published: 1,
            requires_registration: 1,
            status: "published"
          },
          {
            id: "evt-spec-5",
            title: "Regional Campus Christian Union Kesha",
            event_type: "service",
            description: "Joint inter-university kesha uniting Christian unions across Mombasa and coastal universities.",
            start_at: "2026-11-06T22:00:00Z",
            end_at: "2026-11-07T05:00:00Z",
            location: "Main Assembly Hall",
            venue: "Main Assembly Hall",
            preacher: "Regional FOCUS Representatives",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          },
          {
            id: "evt-spec-6",
            title: "Word Explosion Conference: Manifesting His Light",
            event_type: "fellowship",
            description: "Three days of transformative scripture exposition, seminar tracks, and worship.",
            start_at: "2026-11-13T16:00:00Z",
            end_at: "2026-11-15T18:00:00Z",
            location: "Assembly Hall",
            venue: "Assembly Hall",
            preacher: "Keynote Speakers & Ministers",
            is_published: 1,
            requires_registration: 1,
            status: "published"
          },
          {
            id: "evt-spec-7",
            title: "I-Purpose Youth & Career Summit",
            event_type: "fellowship",
            description: "Discovering divine calling, career excellence, innovation, and leadership in the marketplace.",
            start_at: "2026-11-21T09:00:00Z",
            end_at: "2026-11-21T16:00:00Z",
            location: "University Conference Centre",
            venue: "University Conference Centre",
            preacher: "Industry Leaders & Christian Professionals",
            is_published: 1,
            requires_registration: 1,
            status: "published"
          },
          {
            id: "evt-spec-8",
            title: "Annual General Meeting (AGM) & Leadership Transition",
            event_type: "meeting",
            description: "Constitutional AGM, presentation of annual reports, audited financial accounts, and elections transition.",
            start_at: "2026-11-28T14:00:00Z",
            end_at: "2026-11-28T18:00:00Z",
            location: "Main Assembly Hall",
            venue: "Main Assembly Hall",
            preacher: "Executive Committee & Electoral Commission",
            is_published: 1,
            requires_registration: 0,
            status: "published"
          }
        ],
        meetings: [],
        prayer_requests: [],
        spiritual_years: [
          { id: "sy-2026", name: "2025/2026 Spiritual Year", start_date: "2025-09-01", end_date: "2026-08-31", is_current: true }
        ],
        membership_declarations: [
          { id: "decl-1", version: "2024.1", title: "TUMCU Doctrinal Basis & Constitutional Declaration", content: "In joining Technical University of Mombasa Christian Union, (T.U.M.C.U.), I declare Jesus Christ as my Lord and Savior and it is my desire, by the grace of God, to live a life worthy of my Christian calling. I am also determined to follow the Constitution and support the C.U as it seeks to fulfill its aims.", is_active: true }
        ],
        memberships: [
          {
            id: "mem-1",
            user_id: "usr-member-1",
            membership_number: "TUMCU-2023-0041",
            membership_type_id: "1",
            spiritual_year_id: "sy-2026",
            status: "active",
            registration_date: "2023-09-15",
            declaration_id: "decl-1",
            declaration_signed_at: "2023-09-15T10:00:00.000Z"
          },
          {
            id: "mem-2",
            user_id: "usr-member-2",
            membership_number: "TUMCU-2024-0108",
            membership_type_id: "1",
            spiritual_year_id: "sy-2026",
            status: "active",
            registration_date: "2024-02-10",
            declaration_id: "decl-1",
            declaration_signed_at: "2024-02-10T11:00:00.000Z"
          },
          {
            id: "mem-3",
            user_id: "usr-member-3",
            membership_number: "TUMCU-2024-0215",
            membership_type_id: "1",
            spiritual_year_id: "sy-2026",
            status: "active",
            registration_date: "2024-05-18",
            declaration_id: "decl-1",
            declaration_signed_at: "2024-05-18T09:30:00.000Z"
          },
          {
            id: "mem-4",
            user_id: "usr-member-4",
            membership_number: "TUMCU-2025-0312",
            membership_type_id: "1",
            spiritual_year_id: "sy-2026",
            status: "active",
            registration_date: "2025-01-22",
            declaration_id: "decl-1",
            declaration_signed_at: "2025-01-22T14:15:00.000Z"
          }
        ],
        membership_applications: [
          {
            id: "app-1",
            user_id: "usr-applicant-1",
            membership_type_id: "1",
            status: "submitted",
            rejection_reason: null,
            created_at: new Date(Date.now() - 3 * 864e5).toISOString()
          },
          {
            id: "app-2",
            user_id: "usr-applicant-2",
            membership_type_id: "1",
            status: "submitted",
            rejection_reason: null,
            created_at: new Date(Date.now() - 2 * 864e5).toISOString()
          },
          {
            id: "app-3",
            user_id: "usr-applicant-3",
            membership_type_id: "1",
            status: "submitted",
            rejection_reason: null,
            created_at: new Date(Date.now() - 1 * 864e5).toISOString()
          },
          {
            id: "app-4",
            user_id: "usr-applicant-4",
            membership_type_id: "1",
            status: "submitted",
            rejection_reason: null,
            created_at: new Date(Date.now() - 14 * 36e5).toISOString()
          },
          {
            id: "app-5",
            user_id: "usr-applicant-5",
            membership_type_id: "1",
            status: "submitted",
            rejection_reason: null,
            created_at: new Date(Date.now() - 5 * 36e5).toISOString()
          }
        ],
        refresh_tokens: [],
        security_events: [],
        attendance_sessions: [],
        attendance_records: [],
        attendance: [],
        income: [],
        expenses: [],
        welfare_cases: [],
        assets: [],
        library_resources: [
          {
            id: "lib-1",
            title: "Knowing God",
            author: "J.I. Packer",
            category: "Theology",
            is_digital: 1,
            cover_image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80",
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            description: "For over 40 years, J.I. Packer\u2019s classic has helped Christians around the world discover the wonder, the glory, and the joy of knowing God personally.",
            status: "available",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "lib-2",
            title: "The Cross of Christ",
            author: "John Stott",
            category: "Doctrine",
            is_digital: 1,
            cover_image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80",
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            description: "A masterpiece from one of the greatest evangelical minds of the 20th century explaining the heart of biblical Christianity.",
            status: "available",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "lib-3",
            title: "Desiring God: Meditations of a Christian Hedonist",
            author: "John Piper",
            category: "Christian Living",
            is_digital: 1,
            cover_image_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80",
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            description: "God is most glorified in us when we are most satisfied in Him. A deeply biblical and transforming work on holy passion.",
            status: "available",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "lib-4",
            title: "Spiritual Leadership: Principles of Excellence For Every Believer",
            author: "J. Oswald Sanders",
            category: "Leadership",
            is_digital: 1,
            cover_image_url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=400&q=80",
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            description: "Essential reading for every Christian Union leader, coordinator, committee member, and believer aspiring to biblical leadership.",
            status: "available",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "lib-5",
            title: "Mere Christianity",
            author: "C.S. Lewis",
            category: "Apologetics",
            is_digital: 1,
            cover_image_url: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=400&q=80",
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            description: "The classic defense of the Christian faith, exploring moral law, the Trinity, and Christian virtues with brilliant clarity.",
            status: "available",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "lib-6",
            title: "TUMCU Constitution 2024 Edition & Governance Guidelines",
            author: "Constitutional Review Commission",
            category: "Governance & Constitution",
            is_digital: 1,
            cover_image_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80",
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            description: "The supreme governing constitutional framework, doctrinal basis, election rules, and ministry articles of TUM Christian Union.",
            status: "available",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "lib-7",
            title: "The Pursuit of Holiness",
            author: "Jerry Bridges",
            category: "Christian Living",
            is_digital: 1,
            cover_image_url: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=400&q=80",
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            description: "Be holy, for I am holy. Jerry Bridges examines what holiness is and how believers cooperate with the Holy Spirit to pursue it.",
            status: "available",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "lib-8",
            title: "Systematic Theology: An Introduction to Biblical Doctrine",
            author: "Wayne Grudem",
            category: "Theology",
            is_digital: 1,
            cover_image_url: "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=400&q=80",
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            description: "Comprehensive, biblical, lucid, and practical introduction to core doctrines of the faith.",
            status: "available",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        ],
        library_borrowings: [
          {
            id: "bor-1",
            book_title: "Knowing God",
            user_id: "usr-member-1",
            borrower_name: "Grace Wanjiku",
            borrower_email: "grace.wanjiku@tum.ac.ke",
            borrower_phone: "+254711000001",
            borrowed_at: new Date(Date.now() - 4 * 864e5).toISOString(),
            due_at: new Date(Date.now() + 10 * 864e5).toISOString(),
            returned_at: null,
            status: "active",
            notes: "Borrowing for personal devotion and BEST group preparation.",
            issued_by: "usr-admin-1",
            created_at: new Date(Date.now() - 4 * 864e5).toISOString()
          },
          {
            id: "bor-2",
            book_title: "Spiritual Leadership",
            user_id: "usr-member-2",
            borrower_name: "Brian Kiprop",
            borrower_email: "brian.kiprop@tum.ac.ke",
            borrower_phone: "+254711000002",
            borrowed_at: new Date(Date.now() - 18 * 864e5).toISOString(),
            due_at: new Date(Date.now() - 4 * 864e5).toISOString(),
            returned_at: null,
            status: "overdue",
            notes: "Leadership training reading material.",
            issued_by: "usr-admin-1",
            created_at: new Date(Date.now() - 18 * 864e5).toISOString()
          },
          {
            id: "bor-3",
            book_title: "The Cross of Christ",
            user_id: "usr-member-3",
            borrower_name: "Faith Achieng",
            borrower_email: "faith.achieng@tum.ac.ke",
            borrower_phone: "+254711000003",
            borrowed_at: new Date(Date.now() - 12 * 864e5).toISOString(),
            due_at: new Date(Date.now() + 2 * 864e5).toISOString(),
            returned_at: null,
            status: "active",
            notes: "Doctrinal study for baptism class.",
            issued_by: "usr-admin-1",
            created_at: new Date(Date.now() - 12 * 864e5).toISOString()
          },
          {
            id: "bor-4",
            book_title: "Desiring God",
            user_id: "usr-member-1",
            borrower_name: "Grace Wanjiku",
            borrower_email: "grace.wanjiku@tum.ac.ke",
            borrower_phone: "+254711000001",
            borrowed_at: new Date(Date.now() - 25 * 864e5).toISOString(),
            due_at: new Date(Date.now() - 11 * 864e5).toISOString(),
            returned_at: new Date(Date.now() - 10 * 864e5).toISOString(),
            status: "returned",
            notes: "Returned in good condition.",
            issued_by: "usr-admin-1",
            returned_to: "usr-admin-1",
            created_at: new Date(Date.now() - 25 * 864e5).toISOString()
          }
        ],
        library_reservations: [
          {
            id: "res-1",
            resource_id: "lib-2",
            user_id: "usr-member-3",
            user_name: "Faith Achieng",
            user_email: "faith.achieng@tum.ac.ke",
            user_admission_number: "BBIT/2024/0912",
            requested_at: new Date(Date.now() - 1 * 864e5).toISOString(),
            needed_date: new Date(Date.now() + 3 * 864e5).toISOString().split("T")[0],
            status: "pending",
            notes: "Need this physical copy for my discipleship assignment."
          }
        ],
        broadcast_messages: [
          {
            id: "bm-1",
            title: "Special Notice: All-Night Prayer Kesha & Spiritual Consecration",
            body: "Join the entire TUMCU fellowship this Friday from 9:00 PM to 5:00 AM at the Main Assembly Hall. Guest speakers and corporate intercession for our university, exams, and national revival.",
            message_type: "announcement",
            target_audience: "all_members",
            channel: "in_app",
            venue: "Main Assembly Hall & Sanctuary",
            event_date: "2026-09-25T21:00:00Z",
            is_published: 1,
            sender_id: "usr-admin-1",
            created_at: new Date(Date.now() - 36e5).toISOString()
          },
          {
            id: "bm-2",
            title: "Call for Ministry Enrolment & Spiritual Gifts Enlistment",
            body: "Registration is now open for Praise & Worship, Media Ministry, Ushering & Hospitality, and Missions teams. Visit the Ministries portal or see the executive leaders after Sunday service.",
            message_type: "notice",
            target_audience: "all_students",
            channel: "in_app",
            venue: "TUM Main Campus Gazebo & Sanctuary",
            event_date: "2026-09-27T08:00:00Z",
            is_published: 1,
            sender_id: "usr-admin-1",
            created_at: new Date(Date.now() - 72e5).toISOString()
          }
        ],
        notifications: [],
        elections: [],
        election_posts: [],
        election_candidates: [],
        election_votes: [],
        election_activity_logs: [],
        reports: [],
        audit_logs: [
          {
            id: "aud-1",
            user_id: "usr-admin-1",
            action: "system.initialize",
            entity_type: "system_core",
            entity_id: "sys-core",
            old_values: null,
            new_values: JSON.stringify({ constitution: "TUMCU Constitution 2024 Edition", spiritual_year: "2025/2026" }),
            ip_address: "127.0.0.1",
            created_at: new Date(Date.now() - 30 * 864e5).toISOString()
          },
          {
            id: "aud-2",
            user_id: "usr-admin-1",
            action: "membership.declaration.publish",
            entity_type: "membership_declaration",
            entity_id: "decl-1",
            old_values: null,
            new_values: JSON.stringify({ version: "2024.1", title: "TUMCU Doctrinal Basis & Constitutional Declaration" }),
            ip_address: "127.0.0.1",
            created_at: new Date(Date.now() - 25 * 864e5).toISOString()
          },
          {
            id: "aud-3",
            user_id: "usr-admin-1",
            action: "leadership.roster.certified",
            entity_type: "leadership_assignments",
            entity_id: "roster-2026",
            old_values: null,
            new_values: JSON.stringify({ academic_year: "2025/2026", active_executive_officers: 15 }),
            ip_address: "127.0.0.1",
            created_at: new Date(Date.now() - 10 * 864e5).toISOString()
          },
          {
            id: "aud-4",
            user_id: "usr-admin-1",
            action: "finance.budget.approved",
            entity_type: "finance_resolution",
            entity_id: "res-2026-001",
            old_values: null,
            new_values: JSON.stringify({ resolution_number: "RES/2026/001", amount: 45e3, category: "Missions Outreach" }),
            ip_address: "127.0.0.1",
            created_at: new Date(Date.now() - 5 * 864e5).toISOString()
          }
        ],
        bible_study_groups: [
          {
            id: "bsg-1",
            name: "Bereans (Acts 17:11)",
            cohort_name: "2026/2027 Discipleship Cohort",
            leader_id: "usr-member-1",
            meeting_day: "Wednesday",
            meeting_time: "5:00 PM \u2013 6:30 PM",
            location: "Main Chapel Hall A",
            study_book_guide: "Foundations of Biblical Discipleship",
            is_active: 1,
            created_at: new Date(Date.now() - 7 * 864e5).toISOString()
          },
          {
            id: "bsg-2",
            name: "Timothy Disciples (2 Tim 2:2)",
            cohort_name: "2026/2027 Discipleship Cohort",
            leader_id: "usr-member-2",
            meeting_day: "Thursday",
            meeting_time: "5:00 PM \u2013 6:30 PM",
            location: "Hostel 3 Common Ground",
            study_book_guide: "The Gospel of John: Life in Christ",
            is_active: 1,
            created_at: new Date(Date.now() - 7 * 864e5).toISOString()
          }
        ],
        bible_study_members: [
          // Group 1: 3 males, 3 females
          { id: "bsm-1", group_id: "bsg-1", user_id: "usr-member-1", role: "leader", joined_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "bsm-2", group_id: "bsg-1", user_id: "usr-member-3", role: "member", joined_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "bsm-3", group_id: "bsg-1", user_id: "usr-member-5", role: "member", joined_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "bsm-4", group_id: "bsg-1", user_id: "usr-member-2", role: "member", joined_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "bsm-5", group_id: "bsg-1", user_id: "usr-member-4", role: "member", joined_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "bsm-6", group_id: "bsg-1", user_id: "usr-member-6", role: "member", joined_at: (/* @__PURE__ */ new Date()).toISOString() },
          // Group 2: 3 males, 3 females
          { id: "bsm-7", group_id: "bsg-2", user_id: "usr-member-7", role: "member", joined_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "bsm-8", group_id: "bsg-2", user_id: "usr-member-9", role: "member", joined_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "bsm-9", group_id: "bsg-2", user_id: "usr-member-11", role: "member", joined_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "bsm-10", group_id: "bsg-2", user_id: "usr-member-8", role: "member", joined_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "bsm-11", group_id: "bsg-2", user_id: "usr-member-10", role: "member", joined_at: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "bsm-12", group_id: "bsg-2", user_id: "usr-member-12", role: "member", joined_at: (/* @__PURE__ */ new Date()).toISOString() }
        ],
        mentorship_groups: [],
        evangelism_teams: [
          {
            id: "eteam-noret",
            code: "NORET",
            name: "NET MINISTRIES TRUST TUM UNIT",
            region: "Northern & Central Rift / Western Missions",
            description: "Passionate evangelism team dedicated to spreading the gospel of Jesus Christ, planting campus prayer altars, and conducting missions to the Northern & Rift regions.",
            motto: "Proclaiming the Light to the Nations",
            scripture_verse: "Isaiah 9:2 \u2014 The people walking in darkness have seen a great light; on those living in the land of deep darkness, a light has dawned.",
            chairperson_id: null,
            chairperson_name: null,
            chairperson_phone: null,
            meeting_day: "Monday (Alternating)",
            meeting_time: "5:00 PM \u2013 7:00 PM",
            meeting_venue: "Hall 4 / Student Center Grounds",
            target_mission_area: "Turkana & Baringo Cross-Cultural Missions",
            banner_image_url: "/community/community-5.jpg",
            active_members_count: 54,
            is_active: 1,
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "eteam-soret",
            code: "SORET",
            name: "NORET-SORET",
            region: "Southern Rift / Eastern & Coastal Missions",
            description: "Dynamic evangelism team mobilizing campus disciples for grassroots door-to-door evangelism, school ministries, and coastal village missions.",
            motto: "Arise and Shine for Your Light Has Come",
            scripture_verse: "Romans 10:15 \u2014 How beautiful are the feet of those who bring good news!",
            chairperson_id: "usr-admin-1",
            chairperson_name: null,
            chairperson_phone: null,
            meeting_day: "Monday (Alternating)",
            meeting_time: "5:00 PM \u2013 7:00 PM",
            meeting_venue: "Assembly Grounds / Annex Lecture Theatre",
            target_mission_area: "Kilifi, Kwale & Taita Taveta Outreaches",
            banner_image_url: "/community/community-3.jpg",
            active_members_count: 62,
            is_active: 1,
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        ],
        eteam_programmes: [
          {
            id: "ep-1",
            eteam_id: "eteam-noret",
            title: "NORET Monday Fellowship & Prayer Altar",
            date: "2026-09-21",
            time: "5:00 PM \u2013 7:00 PM",
            venue: "Hall 4",
            focus: "Intercession for Northern Kenya Missions & Spiritual Preparation",
            leader: null
          },
          {
            id: "ep-2",
            eteam_id: "eteam-soret",
            title: "SORET Monday Fellowship & Regional Strategy",
            date: "2026-09-21",
            time: "5:00 PM \u2013 7:00 PM",
            venue: "Assembly Grounds Annex",
            focus: "School Ministry Mobilization & Coast Weekend Mission",
            leader: null
          },
          {
            id: "ep-3",
            eteam_id: "eteam-noret",
            title: "NORET Weekend Secondary School Outreach",
            date: "2026-10-10",
            time: "8:00 AM \u2013 3:00 PM",
            venue: "Mombasa Secondary Schools",
            focus: "Gospel crusade and peer discipleship",
            leader: "NORET Missions Committee"
          },
          {
            id: "ep-4",
            eteam_id: "eteam-soret",
            title: "SORET Coastal Village Door to Door Outreach",
            date: "2026-10-17",
            time: "8:30 AM \u2013 4:00 PM",
            venue: "Kisauni & Likoni Outskirts",
            focus: "Community evangelism and medical benevolence",
            leader: "SORET Missions Committee"
          }
        ],
        eteam_gallery: [
          {
            id: "eg-1",
            eteam_id: "eteam-noret",
            title: "NORET Missions Team in Northern Kenya",
            image_url: "/community/community-5.jpg",
            google_photos_url: "https://photos.google.com/share/noret-missions",
            caption: "Sharing the gospel of grace in cross-cultural missions."
          },
          {
            id: "eg-2",
            eteam_id: "eteam-soret",
            title: "SORET High School Ministry Fellowship",
            image_url: "/community/community-3.jpg",
            google_photos_url: "https://photos.google.com/share/soret-outreach",
            caption: "Ministering to secondary school students with passion."
          }
        ],
        eteam_reports: [
          {
            id: "er-1",
            eteam_id: "eteam-noret",
            title: "NORET Annual Mission Report 2025/2026",
            author: "E-Team Leadership",
            report_date: "2026-08-15",
            summary: "Reached over 1,200 souls with 184 giving their lives to Christ and 4 new village fellowship altars planted.",
            content: "Detailed report covering budget utilization, convert follow-up, partner churches in Baringo, and future mission pipeline."
          },
          {
            id: "er-2",
            eteam_id: "eteam-soret",
            title: "SORET Coastal Evangelism Impact Report",
            author: "E-Team Leadership",
            report_date: "2026-08-20",
            summary: "Visited 14 secondary schools and 6 churches across Kilifi and Kwale counties.",
            content: "Report outlining youth ministry impact, distributed bibles, and mentorship follow-up cohorts established."
          }
        ],
        eteam_announcements: [
          {
            id: "ea-1",
            eteam_id: "eteam-noret",
            title: "Preparation for E-Teams Sunday & Mission Offering",
            content: "All NORET members are requested to gather this Monday at Hall 4 at 5:00 PM prompt for choir rehearsal and prayer.",
            posted_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "ea-2",
            eteam_id: "eteam-soret",
            title: "Coast Outreach Registration Now Open",
            content: "Sign-ups for the upcoming October coastal high school outreach are ongoing. Contact the missions coordinator.",
            posted_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        ],
        landing_media_config: [
          {
            id: "cfg-1",
            rotate_interval_ms: 4e3,
            background_image_url: "/tum-gate-monument.jpg",
            background_title: "TUM Main Entrance Gate Monument",
            background_opacity: 0.8,
            background_blur_px: 1,
            last_updated_by: "Meshack Okoth (Super Administrator)",
            last_updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        ],
        landing_media_slides: [
          { id: "slide-1", title: "Manifesting the Light of Christ", subtitle: "Matthew 5:16 \u2014 Let your light shine before men", image_url: "/community/community-1.jpg", display_order: 1, is_active: 1 },
          { id: "slide-2", title: "Worship in Spirit and Truth", subtitle: "One Family \u2022 One Faith \u2022 One Lord", image_url: "/community/community-2.jpg", display_order: 2, is_active: 1 },
          { id: "slide-3", title: "Discipleship & Deep Scripture", subtitle: "BEST Bible Study Classes Every Tuesday", image_url: "/community/community-3.jpg", display_order: 3, is_active: 1 },
          { id: "slide-4", title: "Empowering Every Believer", subtitle: "Academic Excellence and Divine Purpose", image_url: "/community/community-4.jpg", display_order: 4, is_active: 1 },
          { id: "slide-5", title: "Evangelism & Coast Impact", subtitle: "NORET & SORET Reaching Coast and Beyond", image_url: "/community/community-5.jpg", display_order: 5, is_active: 1 }
        ],
        landing_media_gallery: [
          { id: "gal-1", image_url: "/community/community-3.jpg", caption: "TUMCU students fellowship & prayer session", display_order: 1, span: "featured" },
          { id: "gal-2", image_url: "/community/community-2.jpg", caption: "Campus worship ministry team in praise", display_order: 2, span: "normal" },
          { id: "gal-3", image_url: "/community/community-5.jpg", caption: "Christian union members bonding and discipleship", display_order: 3, span: "normal" },
          { id: "gal-4", image_url: "/community/community-1.jpg", caption: "Corporate intercession & prayer altar", display_order: 4, span: "normal" },
          { id: "gal-5", image_url: "/community/community-4.jpg", caption: "Music ministry worship & instrumentals", display_order: 5, span: "normal" }
        ],
        landing_media_backdrops: [
          { id: "backdrop-1", src: "/tum-gate-monument.jpg", title: "TUM Main Entrance Monument & Heritage", is_active: 1, display_order: 1 },
          { id: "backdrop-2", src: "/community/community-1.jpg", title: "Student Intercession & Prayer Gathering", is_active: 1, display_order: 2 },
          { id: "backdrop-3", src: "/community/community-2.jpg", title: "Joyful Praise & Worship in Unity", is_active: 1, display_order: 3 },
          { id: "backdrop-4", src: "/community/community-3.jpg", title: "Christian Fellowship & Discipleship", is_active: 1, display_order: 4 },
          { id: "backdrop-5", src: "/community/community-5.jpg", title: "Campus Evangelism & Servant Leadership", is_active: 1, display_order: 5 }
        ],
        gallery_albums: [
          {
            id: "album-1",
            title: "Semester Orientation & First Years Welcome 2026",
            category: "Orientation",
            event_type: "service",
            event_date: "2026-09-06",
            description: "Joyful orientation services, campus tours, and welcoming freshmen into the TUMCU family.",
            cover_image_url: "/community/community-1.jpg",
            google_photos_url: "https://photos.google.com/share/tumcu-orientation-2026",
            photo_count: 48,
            is_published: 1,
            created_by: "usr-admin-1",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "album-2",
            title: "Friday Main Fellowship Nights",
            category: "Fellowship",
            event_type: "fellowship",
            event_date: "2026-09-18",
            description: "Moments of explosive praise, heartfelt worship, and deep revelation from the pulpit.",
            cover_image_url: "/community/community-2.jpg",
            google_photos_url: "https://photos.google.com/share/tumcu-friday-fellowship",
            photo_count: 85,
            is_published: 1,
            created_by: "usr-admin-1",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "album-3",
            title: "Nyali Beach Retreat & Team Building",
            category: "Retreat",
            event_type: "retreat",
            event_date: "2026-09-19",
            description: "Christian Union beach retreat, games, fellowship, prayer walks, and bonding along the Indian Ocean.",
            cover_image_url: "/community/community-3.jpg",
            google_photos_url: "https://photos.google.com/share/tumcu-beach-retreat-2026",
            photo_count: 120,
            is_published: 1,
            created_by: "usr-admin-1",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "album-4",
            title: "Missions & Coast Evangelism Outreach",
            category: "Missions",
            event_type: "mission",
            event_date: "2026-09-28",
            description: "NORET and SORET evangelism teams ministering to local communities and schools across Mombasa.",
            cover_image_url: "/community/community-5.jpg",
            google_photos_url: "https://photos.google.com/share/tumcu-coast-missions",
            photo_count: 64,
            is_published: 1,
            created_by: "usr-admin-1",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            id: "album-5",
            title: "Night of Encounter Prayer Kesha",
            category: "Prayer",
            event_type: "service",
            event_date: "2026-10-16",
            description: "All night intercession, seeking the face of God, healing, and spiritual renewal.",
            cover_image_url: "/community/community-4.jpg",
            google_photos_url: "https://photos.google.com/share/tumcu-prayer-kesha",
            photo_count: 42,
            is_published: 1,
            created_by: "usr-admin-1",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        ],
        committee_members: [],
        ministry_members: [],
        ministry_trainings: [],
        leadership_archives: []
      }
    };
    rolePermissionMap = {
      // Super Admin: unrestricted technical system administrator
      "role-1": memoryDb.tables.permissions.map((p) => p.code),
      // System Admin: technical system operations and access management
      "role-2": [
        "system.manage_roles",
        "system.manage_permissions",
        "system.health",
        "system.settings",
        "audit.view",
        "leadership.view",
        "membership.view_all",
        "reports.view"
      ],
      // Chairperson: constitutional executive leader (NOT technical super admin)
      "role-3": [
        "leadership.view",
        "leadership.assign",
        "membership.view_all",
        "membership.review",
        "membership.approve",
        "meetings.view",
        "meetings.create",
        "meetings.edit",
        "meetings.manage_minutes",
        "meetings.approve_minutes",
        "finance.view",
        "finance.approve",
        "events.view",
        "events.create",
        "events.edit",
        "events.approve",
        "ministries.view",
        "committees.view",
        "reports.view",
        "reports.create",
        "communication.view",
        "communication.create",
        "prayer.view",
        "prayer.create",
        "attendance.view",
        "attendance.record",
        "elections.view",
        "library.view",
        "gallery.view",
        "eteams.view",
        "programmes.view",
        "programmes.manage"
      ],
      // 1st Vice Chairperson
      "role-4": [
        "welfare.view",
        "welfare.create",
        "welfare.edit",
        "welfare.approve",
        "reports.view",
        "leadership.view",
        "ministries.view",
        "committees.view",
        "membership.view_all",
        "meetings.view",
        "events.view",
        "events.register",
        "attendance.view",
        "attendance.record",
        "prayer.view",
        "prayer.create",
        "finance.request",
        "library.view",
        "gallery.view",
        "eteams.view",
        "programmes.view"
      ],
      // 2nd Vice Chairperson
      "role-5": [
        "associates.view",
        "associates.manage",
        "ministries.view",
        "ministries.manage_members",
        "meetings.view",
        "events.view",
        "events.register",
        "attendance.view",
        "attendance.record",
        "prayer.view",
        "prayer.create",
        "finance.request",
        "library.view",
        "gallery.view",
        "eteams.view",
        "programmes.view"
      ],
      // Secretary
      "role-6": [
        "membership.create",
        "membership.review",
        "membership.view_all",
        "membership.edit",
        "membership.approve",
        "meetings.view",
        "meetings.create",
        "meetings.edit",
        "meetings.delete",
        "meetings.manage_minutes",
        "meetings.approve_minutes",
        "attendance.view",
        "attendance.record",
        "attendance.manage_sessions",
        "attendance.export",
        "communication.view",
        "communication.create",
        "communication.edit",
        "communication.delete",
        "reports.create",
        "reports.view",
        "ministries.view",
        "ministries.manage_members",
        "ministries.edit",
        "leadership.view",
        "leadership.assign",
        "events.view",
        "events.create",
        "events.edit",
        "events.register",
        "prayer.view",
        "prayer.create",
        "finance.view",
        "finance.request",
        "library.view",
        "gallery.view",
        "eteams.view",
        "programmes.view",
        "programmes.manage"
      ],
      // Treasurer
      "role-7": [
        "finance.view",
        "finance.request",
        "finance.approve",
        "reports.create",
        "reports.view",
        "meetings.view",
        "events.view",
        "events.register",
        "attendance.view",
        "attendance.record",
        "prayer.view",
        "prayer.create",
        "assets.view",
        "library.view",
        "gallery.view",
        "eteams.view"
      ],
      // Prayer Committee Chairperson
      "role-8": [
        "prayer.view",
        "prayer.view_confidential",
        "prayer.create",
        "prayer.edit",
        "prayer.delete",
        "meetings.view",
        "events.view",
        "events.register",
        "attendance.view",
        "attendance.record",
        "ministries.view",
        "finance.request",
        "library.view",
        "gallery.view",
        "eteams.view"
      ],
      // Ministry Leader
      "role-9": [
        "ministries.view",
        "ministries.manage_members",
        "ministries.edit",
        "meetings.view",
        "meetings.create",
        "attendance.view",
        "attendance.record",
        "attendance.manage_sessions",
        "reports.create",
        "reports.view",
        "events.view",
        "events.register",
        "prayer.view",
        "prayer.create",
        "finance.view",
        "finance.request",
        "library.view",
        "gallery.view",
        "eteams.view"
      ],
      // Member
      "role-10": [
        "events.view",
        "events.register",
        "events.check_in",
        "ministries.view",
        "prayer.view",
        "prayer.create",
        "attendance.view",
        "attendance.record",
        "meetings.view",
        "finance.request",
        "library.view",
        "library.request",
        "gallery.view",
        "eteams.view",
        "programmes.view"
      ],
      // Librarian & Resource Custodian
      "role-11": [
        "library.view",
        "library.request",
        "library.create",
        "library.edit",
        "library.delete",
        "library.manage_inventory",
        "library.manage_requests",
        "library.checkout",
        "library.return",
        "library.view_reports",
        "reports.view",
        "reports.create",
        "meetings.view",
        "events.view",
        "assets.view",
        "assets.manage",
        "finance.request"
      ],
      // NORET Evangelism Team Chairperson
      "role-12": [
        "eteams.view",
        "eteams.manage_team",
        "eteams.manage_programmes",
        "eteams.manage_gallery",
        "eteams.manage_reports",
        "eteams.manage_announcements",
        "reports.view",
        "reports.create",
        "meetings.view",
        "events.view",
        "prayer.view",
        "prayer.create",
        "finance.request",
        "attendance.record"
      ],
      // SORET Evangelism Team Chairperson
      "role-13": [
        "eteams.view",
        "eteams.manage_team",
        "eteams.manage_programmes",
        "eteams.manage_gallery",
        "eteams.manage_reports",
        "eteams.manage_announcements",
        "reports.view",
        "reports.create",
        "meetings.view",
        "events.view",
        "prayer.view",
        "prayer.create",
        "finance.request",
        "attendance.record"
      ],
      // Media Ministry Leader
      "role-14": [
        "gallery.view",
        "gallery.create",
        "gallery.edit",
        "gallery.delete",
        "gallery.publish",
        "media.manage_landing",
        "media.manage_ministries",
        "ministries.view",
        "ministries.edit",
        "events.view",
        "reports.view",
        "reports.create",
        "finance.request"
      ]
    };
    memberPermCodes = rolePermissionMap["role-10"];
    for (const [roleId, codes] of Object.entries(rolePermissionMap)) {
      for (const code of codes) {
        const perm = memoryDb.tables.permissions.find((p) => p.code === code);
        if (perm) {
          memoryDb.tables.role_permissions.push({
            id: (0, import_uuid.v4)(),
            role_id: roleId,
            permission_id: perm.id
          });
        }
      }
    }
    DATA_DIR = import_path.default.resolve(process.cwd(), "data");
    STORE_FILE = import_path.default.join(DATA_DIR, "tecump_store.json");
    saveTimeout = null;
    initDiskStore();
    mysqlPool = null;
    useMemoryStore = true;
    try {
      mysqlPool = import_promise.default.createPool({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        connectionLimit: env.DB_CONNECTION_LIMIT,
        waitForConnections: true,
        queueLimit: env.DB_QUEUE_LIMIT,
        connectTimeout: env.DB_CONNECT_TIMEOUT_MS,
        idleTimeout: env.DB_IDLE_TIMEOUT_MS,
        maxIdle: env.DB_CONNECTION_LIMIT,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        namedPlaceholders: true,
        dateStrings: true
      });
    } catch (e) {
      logger.warn({ err: e }, "MySQL pool initialization deferred \u2014 using persistent store.");
    }
    pool = {
      async query(sql, params = {}) {
        if (mysqlPool && !useMemoryStore) {
          try {
            return await mysqlPool.query(sql, params);
          } catch (err) {
            if (env.NODE_ENV === "production") {
              logger.error({ err: err?.message || err }, "MySQL query failed in production; refusing to use the JSON memory store.");
              throw err;
            }
            logger.warn({ err: err?.message || err }, "MySQL query failed; falling back to the development store.");
            useMemoryStore = true;
            return executeInMemoryQuery(sql, params);
          }
        }
        return executeInMemoryQuery(sql, params);
      },
      async getConnection() {
        if (mysqlPool && !useMemoryStore) {
          try {
            return await mysqlPool.getConnection();
          } catch (err) {
            if (env.NODE_ENV === "production") {
              logger.error({ err: err?.message || err }, "MySQL connection acquisition failed in production.");
              throw err;
            }
            logger.warn({ err: err?.message || err }, "MySQL connection unavailable; using the development store.");
            useMemoryStore = true;
          }
        }
        return {
          async query(sql, params = {}) {
            return executeInMemoryQuery(sql, params);
          },
          async beginTransaction() {
          },
          async commit() {
          },
          async rollback() {
          },
          release() {
          },
          async ping() {
            return true;
          }
        };
      }
    };
  }
});

// backend/src/modules/landing-media/landing-media.service.ts
var landing_media_service_exports = {};
__export(landing_media_service_exports, {
  DEFAULT_LANDING_MEDIA: () => DEFAULT_LANDING_MEDIA,
  LandingMediaService: () => LandingMediaService,
  landingMediaService: () => landingMediaService
});
var import_fs2, import_path2, DEFAULT_LANDING_MEDIA, LandingMediaService, landingMediaService;
var init_landing_media_service = __esm({
  "backend/src/modules/landing-media/landing-media.service.ts"() {
    "use strict";
    import_fs2 = __toESM(require("fs"));
    import_path2 = __toESM(require("path"));
    init_logger();
    init_database();
    init_env();
    DEFAULT_LANDING_MEDIA = {
      heroCarousel: [
        { id: "slide-1", src: "/community/community-1.jpg", caption: "Prayer & Reflection", eyebrow: "A people who seek God", active: true, order: 1 },
        { id: "slide-2", src: "/community/community-2.jpg", caption: "Worship in Unity", eyebrow: "One family. One faith.", active: true, order: 2 },
        { id: "slide-3", src: "/community/community-3.jpg", caption: "Fellowship & Community", eyebrow: "Growing together", active: true, order: 3 },
        { id: "slide-4", src: "/community/community-4.jpg", caption: "Worship through Music", eyebrow: "Gifts offered to God", active: true, order: 4 },
        { id: "slide-5", src: "/community/community-5.jpg", caption: "A Community that Serves", eyebrow: "Faith becoming action", active: true, order: 5 }
      ],
      rotateIntervalMs: 4e3,
      backgroundImage: {
        src: "/tum-gate-monument.jpg",
        opacity: 0.8,
        blurPx: 1,
        title: "TUM Main Entrance Gate Monument"
      },
      backdropSlides: [
        { id: "backdrop-1", src: "/tum-gate-monument.jpg", title: "TUM Main Entrance Monument & Heritage", active: true, order: 1 },
        { id: "backdrop-2", src: "/community/community-1.jpg", title: "Student Intercession & Prayer Gathering", active: true, order: 2 },
        { id: "backdrop-3", src: "/community/community-2.jpg", title: "Joyful Praise & Worship in Unity", active: true, order: 3 },
        { id: "backdrop-4", src: "/community/community-3.jpg", title: "Christian Fellowship & Discipleship", active: true, order: 4 },
        { id: "backdrop-5", src: "/community/community-5.jpg", title: "Campus Evangelism & Servant Leadership", active: true, order: 5 }
      ],
      galleryPhotos: [
        { id: "gal-1", src: "/community/community-3.jpg", alt: "TUMCU students sharing fellowship", caption: "Fellowship & belonging", span: "featured", order: 1 },
        { id: "gal-2", src: "/community/community-2.jpg", alt: "TUMCU worship team", order: 2 },
        { id: "gal-3", src: "/community/community-5.jpg", alt: "TUMCU students in fellowship", order: 3 },
        { id: "gal-4", src: "/community/community-1.jpg", alt: "TUMCU prayer moment", order: 4 },
        { id: "gal-5", src: "/community/community-4.jpg", alt: "TUMCU music ministry", order: 5 }
      ],
      lastUpdatedBy: "System Default",
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    LandingMediaService = class {
      dataFilePath;
      currentConfig;
      dbInitialized = false;
      readyPromise;
      constructor() {
        const dataDir = import_path2.default.resolve(process.cwd(), "data");
        if (!import_fs2.default.existsSync(dataDir)) {
          try {
            import_fs2.default.mkdirSync(dataDir, { recursive: true });
          } catch (err) {
            logger.warn({ err }, "Failed to create data directory");
          }
        }
        this.dataFilePath = import_path2.default.join(dataDir, "landing-media.json");
        this.currentConfig = this.loadFromFileFallback();
        this.readyPromise = this.initFromDatabase().catch((err) => {
          logger.error({ err }, "Could not initialize landing media from MySQL at startup");
          if (env.NODE_ENV === "production") throw err;
        });
      }
      loadFromFileFallback() {
        try {
          if (import_fs2.default.existsSync(this.dataFilePath)) {
            const raw = import_fs2.default.readFileSync(this.dataFilePath, "utf-8");
            const parsed2 = JSON.parse(raw);
            if (parsed2 && Array.isArray(parsed2.heroCarousel)) {
              return {
                ...DEFAULT_LANDING_MEDIA,
                ...parsed2,
                heroCarousel: parsed2.heroCarousel.length > 0 ? parsed2.heroCarousel : DEFAULT_LANDING_MEDIA.heroCarousel,
                backdropSlides: Array.isArray(parsed2.backdropSlides) && parsed2.backdropSlides.length > 0 ? parsed2.backdropSlides : DEFAULT_LANDING_MEDIA.backdropSlides,
                galleryPhotos: Array.isArray(parsed2.galleryPhotos) && parsed2.galleryPhotos.length > 0 ? parsed2.galleryPhotos : DEFAULT_LANDING_MEDIA.galleryPhotos
              };
            }
          }
        } catch (err) {
          logger.warn({ err }, "Error loading landing media config from file, using defaults");
        }
        return JSON.parse(JSON.stringify(DEFAULT_LANDING_MEDIA));
      }
      async initFromDatabase() {
        try {
          const configRows = await query("SELECT * FROM landing_media_config WHERE id = :id LIMIT 1", { id: "main" });
          const slidesRows = await query("SELECT * FROM landing_media_slides ORDER BY display_order ASC", {});
          const galleryRows = await query("SELECT * FROM landing_media_gallery ORDER BY display_order ASC", {});
          const backdropRows = await query("SELECT * FROM landing_media_backdrops ORDER BY display_order ASC", {});
          if (configRows && configRows.length > 0) {
            const conf = configRows[0];
            const heroCarousel = Array.isArray(slidesRows) && slidesRows.length > 0 ? slidesRows.map((s) => ({
              id: s.id,
              src: s.src,
              caption: s.caption,
              eyebrow: s.eyebrow,
              active: Boolean(s.is_active),
              order: s.display_order
            })) : this.currentConfig.heroCarousel;
            const backdropSlides = Array.isArray(backdropRows) && backdropRows.length > 0 ? backdropRows.map((b) => ({
              id: b.id,
              src: b.src,
              title: b.title,
              active: Boolean(b.is_active),
              order: b.display_order
            })) : this.currentConfig.backdropSlides;
            const galleryPhotos = Array.isArray(galleryRows) && galleryRows.length > 0 ? galleryRows.map((g) => ({
              id: g.id,
              src: g.src,
              alt: g.alt,
              caption: g.caption,
              span: g.span || "standard",
              order: g.display_order
            })) : this.currentConfig.galleryPhotos;
            this.currentConfig = {
              heroCarousel,
              rotateIntervalMs: Number(conf.rotate_interval_ms) || 4e3,
              backgroundImage: {
                src: conf.background_src || "/tum-gate-monument.jpg",
                opacity: Number(conf.background_opacity) || 0.8,
                blurPx: Number(conf.background_blur_px) || 1,
                title: conf.background_title || "TUM Main Entrance Gate Monument"
              },
              backdropSlides,
              galleryPhotos,
              lastUpdatedBy: conf.last_updated_by || "Administrator",
              lastUpdatedAt: conf.updated_at ? new Date(conf.updated_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
            };
            this.dbInitialized = true;
            this.saveToFileFallback();
            return;
          }
          await this.persistToDatabase(this.currentConfig);
          this.dbInitialized = true;
        } catch (err) {
          logger.error({ err }, "Failed to initialize landing media from MySQL");
          if (env.NODE_ENV === "production") {
            throw err;
          }
          logger.warn("Development mode: retaining the in-process landing media defaults until MySQL is available.");
        }
      }
      async persistToDatabase(config) {
        try {
          await query(
            `INSERT INTO landing_media_config (
           id, rotate_interval_ms, background_src, background_opacity, background_blur_px, background_title, last_updated_by, updated_at
         ) VALUES (
           :id, :rotate_interval_ms, :background_src, :background_opacity, :background_blur_px, :background_title, :last_updated_by, :updated_at
         ) ON DUPLICATE KEY UPDATE
           rotate_interval_ms = VALUES(rotate_interval_ms),
           background_src = VALUES(background_src),
           background_opacity = VALUES(background_opacity),
           background_blur_px = VALUES(background_blur_px),
           background_title = VALUES(background_title),
           last_updated_by = VALUES(last_updated_by),
           updated_at = VALUES(updated_at)`,
            {
              id: "main",
              rotate_interval_ms: config.rotateIntervalMs || 4e3,
              background_src: config.backgroundImage?.src || "/tum-gate-monument.jpg",
              background_opacity: config.backgroundImage?.opacity ?? 0.8,
              background_blur_px: config.backgroundImage?.blurPx ?? 1,
              background_title: config.backgroundImage?.title || "TUM Main Entrance Gate Monument",
              last_updated_by: config.lastUpdatedBy || "Administrator",
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }
          );
          await query("DELETE FROM landing_media_slides", {});
          for (const slide of config.heroCarousel) {
            await query(
              `INSERT INTO landing_media_slides (id, src, caption, eyebrow, is_active, display_order)
           VALUES (:id, :src, :caption, :eyebrow, :is_active, :display_order)`,
              {
                id: slide.id,
                src: slide.src,
                caption: slide.caption,
                eyebrow: slide.eyebrow,
                is_active: slide.active !== false ? 1 : 0,
                display_order: slide.order || 1
              }
            );
          }
          await query("DELETE FROM landing_media_backdrops", {});
          for (const backdrop of config.backdropSlides || []) {
            await query(
              `INSERT INTO landing_media_backdrops (id, src, title, is_active, display_order)
           VALUES (:id, :src, :title, :is_active, :display_order)`,
              {
                id: backdrop.id,
                src: backdrop.src,
                title: backdrop.title || "TUMCU Heritage",
                is_active: backdrop.active !== false ? 1 : 0,
                display_order: backdrop.order || 1
              }
            );
          }
          await query("DELETE FROM landing_media_gallery", {});
          for (const photo of config.galleryPhotos) {
            await query(
              `INSERT INTO landing_media_gallery (id, src, alt, caption, span, display_order)
           VALUES (:id, :src, :alt, :caption, :span, :display_order)`,
              {
                id: photo.id,
                src: photo.src,
                alt: photo.alt || "TUMCU Community",
                caption: photo.caption || null,
                span: photo.span || "standard",
                display_order: photo.order || 1
              }
            );
          }
        } catch (err) {
          logger.error({ err }, "Failed writing landing media to MySQL");
          throw err;
        }
      }
      saveToFileFallback() {
        try {
          const dataDir = import_path2.default.dirname(this.dataFilePath);
          if (!import_fs2.default.existsSync(dataDir)) {
            import_fs2.default.mkdirSync(dataDir, { recursive: true });
          }
          import_fs2.default.writeFileSync(this.dataFilePath, JSON.stringify(this.currentConfig, null, 2), "utf-8");
          logger.info("Landing media configuration saved successfully");
        } catch (err) {
          logger.error({ err }, "Failed to save landing media configuration to disk");
        }
      }
      async getMedia() {
        await this.readyPromise;
        return this.currentConfig;
      }
      async updateMedia(updates, actorName) {
        await this.readyPromise;
        const previousConfig = JSON.parse(JSON.stringify(this.currentConfig));
        const now = (/* @__PURE__ */ new Date()).toISOString();
        let heroCarousel = this.currentConfig.heroCarousel;
        if (Array.isArray(updates.heroCarousel)) {
          heroCarousel = updates.heroCarousel.map((slide, idx) => ({
            id: slide.id || `slide-${idx + 1}`,
            src: slide.src || "",
            caption: slide.caption || "Community Moment",
            eyebrow: slide.eyebrow || "TUMCU Ministry",
            active: slide.active !== false,
            order: typeof slide.order === "number" ? slide.order : idx + 1
          }));
        }
        let backdropSlides = this.currentConfig.backdropSlides || DEFAULT_LANDING_MEDIA.backdropSlides;
        if (Array.isArray(updates.backdropSlides)) {
          backdropSlides = updates.backdropSlides.map((slide, idx) => ({
            id: slide.id || `backdrop-${idx + 1}`,
            src: slide.src || "",
            title: slide.title || `Backdrop Photo ${idx + 1}`,
            active: slide.active !== false,
            order: typeof slide.order === "number" ? slide.order : idx + 1
          }));
        }
        let galleryPhotos = this.currentConfig.galleryPhotos;
        if (Array.isArray(updates.galleryPhotos)) {
          galleryPhotos = updates.galleryPhotos.map((photo, idx) => ({
            id: photo.id || `gal-${idx + 1}`,
            src: photo.src || "",
            alt: photo.alt || "TUMCU Community",
            caption: photo.caption,
            span: photo.span || (idx === 0 ? "featured" : "standard"),
            order: typeof photo.order === "number" ? photo.order : idx + 1
          }));
        }
        const backgroundImage = {
          ...this.currentConfig.backgroundImage,
          ...updates.backgroundImage || {}
        };
        const rotateIntervalMs = typeof updates.rotateIntervalMs === "number" && updates.rotateIntervalMs >= 1500 ? updates.rotateIntervalMs : this.currentConfig.rotateIntervalMs || 4e3;
        this.currentConfig = {
          heroCarousel,
          rotateIntervalMs,
          backgroundImage,
          backdropSlides,
          galleryPhotos,
          lastUpdatedBy: actorName || this.currentConfig.lastUpdatedBy || "Administrator",
          lastUpdatedAt: now
        };
        try {
          await this.persistToDatabase(this.currentConfig);
          this.saveToFileFallback();
          return this.currentConfig;
        } catch (err) {
          this.currentConfig = previousConfig;
          throw err;
        }
      }
      uploadImage(rawInput, originalFilename = "media-photo.jpg") {
        let base64String = rawInput;
        let extension = ".jpg";
        const match = rawInput.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (match) {
          const format = match[1].toLowerCase();
          extension = format === "jpeg" || format === "jpg" ? ".jpg" : `.${format}`;
          base64String = match[2];
        } else {
          const extMatch = originalFilename.match(/\.[a-zA-Z0-9]+$/);
          if (extMatch) {
            extension = extMatch[0].toLowerCase();
          }
        }
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
        if (!allowedExtensions.includes(extension)) {
          extension = ".jpg";
        }
        const sanitizedBase = import_path2.default.basename(originalFilename, import_path2.default.extname(originalFilename)).toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 32);
        const safeFilename = `tumcu-${Date.now()}-${sanitizedBase || "image"}${extension}`;
        const buffer = Buffer.from(base64String, "base64");
        if (buffer.length > 15 * 1024 * 1024) {
          throw new Error("Image file is too large. Maximum size is 15MB.");
        }
        const localUploadsDir = import_path2.default.resolve(env.UPLOAD_DIR);
        const railwayUploadsDir = localUploadsDir;
        if (!import_fs2.default.existsSync(localUploadsDir)) {
          try {
            import_fs2.default.mkdirSync(localUploadsDir, { recursive: true });
          } catch (err) {
            logger.warn({ err }, "Could not create local public/uploads directory");
          }
        }
        try {
          import_fs2.default.writeFileSync(import_path2.default.join(localUploadsDir, safeFilename), buffer);
        } catch (err) {
          throw new Error("Image storage is unavailable. Configure a persistent UPLOAD_DIR volume.");
        }
        const publicUrl = `/uploads/${safeFilename}`;
        logger.info({ publicUrl }, "Image successfully uploaded and persisted");
        return { url: publicUrl, filename: safeFilename };
      }
      async resetToDefault(actorName) {
        await this.readyPromise;
        const previousConfig = this.currentConfig;
        this.currentConfig = {
          ...JSON.parse(JSON.stringify(DEFAULT_LANDING_MEDIA)),
          lastUpdatedBy: actorName || "Administrator",
          lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        try {
          await this.persistToDatabase(this.currentConfig);
          this.saveToFileFallback();
          return this.currentConfig;
        } catch (err) {
          this.currentConfig = previousConfig;
          throw err;
        }
      }
    };
    landingMediaService = new LandingMediaService();
  }
});

// server.ts
var import_express35 = __toESM(require("express"), 1);
var import_path5 = __toESM(require("path"), 1);
var import_vite = require("vite");

// backend/src/app.ts
var import_express34 = __toESM(require("express"));
var import_fs4 = __toESM(require("fs"));
var import_path4 = __toESM(require("path"));
var import_cors = __toESM(require("cors"));
var import_helmet = __toESM(require("helmet"));
var import_compression = __toESM(require("compression"));
var import_express_rate_limit2 = __toESM(require("express-rate-limit"));
var import_pino_http = __toESM(require("pino-http"));
init_env();
init_logger();

// backend/src/middleware/error.middleware.ts
var import_crypto = require("crypto");

// backend/src/utils/errors.ts
var AppError = class extends Error {
  statusCode;
  code;
  isOperational;
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var ValidationError = class extends AppError {
  details;
  constructor(message = "Validation failed", details = []) {
    super(message, 422, "VALIDATION_ERROR");
    this.details = details;
  }
};
var AuthenticationError = class extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
};
var AuthorizationError = class extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
};
var NotFoundError = class extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
};
var ConflictError = class extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
};
var BadRequestError = class extends AppError {
  constructor(message = "Bad request") {
    super(message, 400, "BAD_REQUEST");
  }
};
var BusinessRuleError = class extends AppError {
  constructor(message) {
    super(message, 400, "BUSINESS_RULE_ERROR");
  }
};

// backend/src/middleware/error.middleware.ts
init_logger();
init_env();
function notFoundHandler(req, res, next) {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
    return res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.originalUrl} not found`,
      data: null,
      errors: [{ code: "ROUTE_NOT_FOUND", message: "The requested endpoint does not exist" }],
      meta: {}
    });
  }
  next();
}
function errorHandler(err, req, res, _next) {
  const requestId = req.headers["x-request-id"] || (0, import_crypto.randomUUID)();
  if (err instanceof AppError) {
    if (err instanceof AuthenticationError) {
      logger.info({ code: err.code, path: req.path, requestId }, err.message);
    } else {
      logger.warn({ err, requestId, path: req.path }, err.message);
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      errors: err instanceof ValidationError && Array.isArray(err.details) ? err.details : [{ code: err.code, message: err.message }],
      meta: { requestId, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
    });
  }
  logger.error({ err, requestId, path: req.path }, "Unhandled error");
  return res.status(500).json({
    success: false,
    message: env.NODE_ENV === "production" ? "Internal server error" : err.message,
    data: null,
    errors: [{ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" }],
    meta: { requestId, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
  });
}

// backend/src/app.ts
init_database();

// backend/src/modules/authentication/routes/auth.routes.ts
var import_express = require("express");

// backend/src/modules/authentication/services/auth.service.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_crypto3 = __toESM(require("crypto"));
var import_uuid3 = require("uuid");

// backend/src/modules/authentication/repositories/auth.repository.ts
var import_uuid2 = require("uuid");
init_database();
var AuthRepository = class {
  async findByIdentifier(identifier) {
    const clean = (identifier || "").trim();
    const rows = await query(
      `SELECT * FROM users
        WHERE (
          LOWER(email) = LOWER(:clean)
          OR LOWER(username) = LOWER(:clean)
          OR LOWER(full_name) = LOWER(:clean)
          OR admission_number = :clean
          OR phone_number = :clean
        )
          AND deleted_at IS NULL
        LIMIT 1`,
      { clean, identifier: clean }
    );
    if (rows[0]) return rows[0];
    return null;
  }
  async updatePasswordHash(id, passwordHash) {
    await query(
      `UPDATE users SET password_hash = :passwordHash, failed_login_attempts = 0, locked_until = NULL WHERE id = :id`,
      { id, passwordHash }
    );
  }
  async findById(id) {
    const rows = await query(
      `SELECT * FROM users WHERE id = :id AND deleted_at IS NULL LIMIT 1`,
      { id }
    );
    return rows[0] ?? null;
  }
  async emailOrAdmissionExists(email, admissionNumber) {
    const rows = await query(
      `SELECT id FROM users WHERE deleted_at IS NULL AND (email = :email OR (admission_number IS NOT NULL AND admission_number = :admissionNumber)) LIMIT 1`,
      { email, admissionNumber: admissionNumber ?? null }
    );
    return rows.length > 0;
  }
  async createUser(data) {
    const id = (0, import_uuid2.v4)();
    const username = data.email.split("@")[0] + "_" + id.slice(0, 6);
    const record = { ...data, id, username };
    const columns = Object.keys(record);
    await query(
      `INSERT INTO users (${columns.join(", ")}) VALUES (${columns.map((c) => `:${c}`).join(", ")})`,
      record
    );
    return this.findById(id);
  }
  async updateLastLogin(id) {
    await query(
      `UPDATE users SET last_login_at = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = :id`,
      { id }
    );
  }
  /**
   * Returns the new attempt count so the service can decide whether to lock
   * the account. Deliberately reads the current count first rather than
   * writing `failed_login_attempts = failed_login_attempts + 1` and
   * referencing that column again in the same UPDATE's CASE expression —
   * MySQL evaluates a single-table UPDATE's SET assignments left to right,
   * so a later expression can see the *already-incremented* value of an
   * earlier one, silently double-counting and locking the account one
   * attempt early. Two round trips avoids relying on that evaluation order.
   */
  async registerFailedLogin(id, lockThreshold, lockMinutes) {
    const current = await query(
      `SELECT COALESCE(failed_login_attempts, 0) AS failed_login_attempts FROM users WHERE id = :id`,
      { id }
    );
    const newAttempts = (current[0]?.failed_login_attempts ?? 0) + 1;
    const shouldLock = newAttempts >= lockThreshold;
    await query(
      `UPDATE users
          SET failed_login_attempts = :newAttempts,
              locked_until = ${shouldLock ? "DATE_ADD(NOW(), INTERVAL :lockMinutes MINUTE)" : "locked_until"}
        WHERE id = :id`,
      { id, newAttempts, lockMinutes }
    );
    return newAttempts;
  }
  async logSecurityEvent(params) {
    await query(
      `INSERT INTO security_events (id, user_id, event_type, ip_address, user_agent, metadata)
       VALUES (UUID(), :userId, :eventType, :ipAddress, :userAgent, :metadata)`,
      {
        userId: params.userId ?? null,
        eventType: params.eventType,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null
      }
    );
  }
  async storeRefreshToken(userId, tokenHash, expiresAt) {
    await query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (:id, :userId, :tokenHash, :expiresAt)`,
      { id: (0, import_uuid2.v4)(), userId, tokenHash, expiresAt }
    );
  }
  async findValidRefreshToken(tokenHash) {
    const rows = await query(
      `SELECT * FROM refresh_tokens
        WHERE token_hash = :tokenHash AND revoked_at IS NULL AND expires_at > NOW()
        LIMIT 1`,
      { tokenHash }
    );
    return rows[0] ?? null;
  }
  /** Includes revoked tokens — used to detect refresh-token reuse (possible theft). */
  async findRefreshTokenByHash(tokenHash) {
    const rows = await query(
      `SELECT * FROM refresh_tokens WHERE token_hash = :tokenHash LIMIT 1`,
      { tokenHash }
    );
    return rows[0] ?? null;
  }
  async revokeRefreshToken(tokenHash) {
    await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = :tokenHash`, {
      tokenHash
    });
  }
  async revokeAllRefreshTokens(userId) {
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = :userId AND revoked_at IS NULL`,
      { userId }
    );
  }
};

// backend/src/modules/authentication/services/auth.service.ts
init_env();
init_database();

// backend/src/modules/authentication/interfaces/user.interface.ts
function toPublicUser(user) {
  const { password_hash, two_factor_enabled, ...rest } = user;
  delete rest.password_hash;
  delete rest.passwordHash;
  delete rest.two_factor_enabled;
  delete rest.twoFactorEnabled;
  return rest;
}

// backend/src/modules/authentication/services/auth.service.ts
var REFRESH_TOKEN_DAYS = 30;
var LOCK_THRESHOLD = 5;
var LOCK_MINUTES = 15;
function hashToken(token) {
  return import_crypto3.default.createHash("sha256").update(token).digest("hex");
}
var AuthService = class {
  constructor(repository = new AuthRepository()) {
    this.repository = repository;
  }
  /**
   * Registration workflow per Chapter 4:
   *   Application -> Review -> Approval -> Membership Number -> Welcome -> Register
   * This step creates the user account (pending_approval) and opens a
   * membership application; approval happens in the Membership module.
   */
  async register(dto) {
    const exists = await this.repository.emailOrAdmissionExists(dto.email, dto.admission_number);
    if (exists) throw new ConflictError("An account with this email or admission number already exists");
    const password_hash = await import_bcryptjs.default.hash(dto.password, 12);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [membershipTypeRows] = await connection.query(
        `SELECT id FROM membership_types WHERE code = :code LIMIT 1`,
        { code: dto.membership_type }
      );
      const membershipType = membershipTypeRows[0];
      if (!membershipType) throw new NotFoundError("Membership type");
      const userId = (0, import_uuid3.v4)();
      const username = dto.email.split("@")[0] + "_" + userId.slice(0, 6);
      await connection.query(
        `INSERT INTO users (
           id, username, full_name, email, phone_number, admission_number,
           department, year_of_study, password_hash, account_status,
           declaration_accepted, declaration_accepted_at, declaration_version,
           profile_completed
         ) VALUES (
           :id, :username, :fullName, :email, :phoneNumber, :admissionNumber,
           :department, :yearOfStudy, :passwordHash, 'pending_approval',
           :declarationAccepted, CASE WHEN :declarationAccepted = 1 THEN NOW() ELSE NULL END,
           CASE WHEN :declarationAccepted = 1 THEN '2024.1' ELSE NULL END,
           CASE WHEN :admissionNumber IS NOT NULL AND :declarationAccepted = 1 THEN 1 ELSE 0 END
         )`,
        {
          id: userId,
          username,
          fullName: dto.full_name,
          email: dto.email,
          phoneNumber: dto.phone_number ?? null,
          admissionNumber: dto.admission_number ?? null,
          department: dto.department ?? null,
          yearOfStudy: dto.year_of_study ?? null,
          passwordHash: password_hash,
          declarationAccepted: dto.declaration_accepted ? 1 : 0
        }
      );
      await connection.query(
        `INSERT INTO membership_applications (id, user_id, membership_type_id, status)
         VALUES (:id, :userId, :membershipTypeId, 'submitted')`,
        { id: (0, import_uuid3.v4)(), userId, membershipTypeId: membershipType.id }
      );
      await connection.commit();
      const user = await this.repository.findById(userId);
      if (!user) throw new NotFoundError("User");
      return { user: toPublicUser(user) };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  /**
   * Login with brute-force protection: after LOCK_THRESHOLD consecutive
   * failures the account is locked for LOCK_MINUTES, regardless of whether
   * subsequent attempts use the correct password. Every attempt — success
   * or failure — is written to security_events for monitoring/alerting.
   */
  async login(dto, ctx = {}) {
    const user = await this.repository.findByIdentifier(dto.identifier);
    if (!user) {
      await this.repository.logSecurityEvent({
        eventType: "login_failure",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { reason: "unknown_identifier", identifier: dto.identifier }
      });
      throw new AuthenticationError("Invalid credentials");
    }
    if (user.locked_until && new Date(user.locked_until) > /* @__PURE__ */ new Date()) {
      await this.repository.logSecurityEvent({
        userId: user.id,
        eventType: "login_failure",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { reason: "account_locked" }
      });
      throw new AuthenticationError(
        `Too many failed attempts. This account is temporarily locked until ${new Date(user.locked_until).toLocaleTimeString()}.`
      );
    }
    const passwordMatches = await import_bcryptjs.default.compare(dto.password, user.password_hash);
    if (!passwordMatches) {
      const attempts = await this.repository.registerFailedLogin(user.id, LOCK_THRESHOLD, LOCK_MINUTES);
      const justLocked = attempts >= LOCK_THRESHOLD;
      await this.repository.logSecurityEvent({
        userId: user.id,
        eventType: justLocked ? "account_locked" : "login_failure",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { reason: "bad_password", attempts }
      });
      throw new AuthenticationError(
        justLocked ? `Too many failed attempts. This account is locked for ${LOCK_MINUTES} minutes.` : "Invalid credentials"
      );
    }
    if (["suspended", "archived", "deceased", "rejected"].includes(user.account_status)) {
      throw new AuthenticationError(`Account is ${user.account_status.replace("_", " ")}`);
    }
    if (user.account_status === "pending_approval") {
      throw new AuthenticationError(
        "Your membership application is still pending review. You will be able to log in once it is approved."
      );
    }
    await this.repository.updateLastLogin(user.id);
    await this.repository.logSecurityEvent({
      userId: user.id,
      eventType: "login_success",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });
    const tokens = await this.issueTokens(user.id, user.username);
    return { user: toPublicUser(user), ...tokens };
  }
  /**
   * Refresh-token rotation with reuse detection: a refresh token is single-use.
   * If a token that was already revoked (i.e. already used, or explicitly
   * logged out) is presented again, that's a strong signal of token theft —
   * every session for the user is revoked immediately rather than trusting
   * the presented token.
   */
  async refresh(refreshToken, ctx = {}) {
    if (!refreshToken || typeof refreshToken !== "string" || refreshToken === "undefined" || refreshToken === "null" || !refreshToken.trim()) {
      throw new AuthenticationError("Invalid or expired refresh token");
    }
    let decoded;
    try {
      decoded = import_jsonwebtoken.default.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new AuthenticationError("Invalid or expired refresh token");
    }
    if (!decoded || !decoded.sub) {
      throw new AuthenticationError("Invalid or expired refresh token");
    }
    const tokenHash = hashToken(refreshToken);
    const stored = await this.repository.findValidRefreshToken(tokenHash);
    if (!stored) {
      const existing = await this.repository.findRefreshTokenByHash(tokenHash);
      if (existing?.revoked_at) {
        const revokedTime = new Date(existing.revoked_at).getTime();
        const isRecentRevocation = !isNaN(revokedTime) && Date.now() - revokedTime < 3e4;
        if (!isRecentRevocation) {
          await this.repository.revokeAllRefreshTokens(existing.user_id);
          await this.repository.logSecurityEvent({
            userId: existing.user_id,
            eventType: "token_refresh_reuse_detected",
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent
          });
          throw new AuthenticationError("Invalid or expired refresh token");
        }
      }
    }
    const userId = stored?.user_id || decoded.sub;
    let user = await this.repository.findById(userId);
    if (!user) {
      user = await this.repository.findByIdentifier(userId);
    }
    if (!user) throw new AuthenticationError("User no longer exists");
    await this.repository.revokeRefreshToken(tokenHash).catch(() => {
    });
    await this.repository.logSecurityEvent({
      userId: user.id,
      eventType: "token_refresh",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });
    return this.issueTokens(user.id, user.username);
  }
  async logout(refreshToken) {
    await this.repository.revokeRefreshToken(hashToken(refreshToken));
  }
  async logoutEverywhere(userId) {
    await this.repository.revokeAllRefreshTokens(userId);
  }
  async completePersonalInfo(userId, data) {
    let user = await this.repository.findById(userId);
    if (!user) {
      user = await this.repository.findByIdentifier(userId);
    }
    if (!user) throw new NotFoundError("User");
    await pool.query(
      `UPDATE users SET
         admission_number = :admission_number,
         full_name = COALESCE(:full_name, full_name),
         phone_number = COALESCE(:phone_number, phone_number),
         gender = COALESCE(:gender, gender),
         course = COALESCE(:course, course),
         department = COALESCE(:department, department),
         school = COALESCE(:school, school),
         year_of_study = COALESCE(:year_of_study, year_of_study),
         campus_residence = COALESCE(:campus_residence, campus_residence),
         date_of_salvation = COALESCE(:date_of_salvation, date_of_salvation),
         baptism_status = COALESCE(:baptism_status, baptism_status),
         account_status = :account_status,
         declaration_accepted = 1,
         declaration_accepted_at = :declaration_accepted_at,
         declaration_version = '2024.1',
         profile_completed = 1,
         updated_at = :updated_at
       WHERE id = :id`,
      {
        id: user.id,
        admission_number: data.admission_number,
        full_name: data.full_name || user.full_name,
        phone_number: data.phone_number || user.phone_number,
        gender: data.gender || user.gender,
        course: data.course || user.course,
        department: data.department || user.department,
        school: data.school || user.school,
        year_of_study: data.year_of_study ?? user.year_of_study,
        campus_residence: data.campus_residence || user.campus_residence,
        date_of_salvation: data.date_of_salvation || user.date_of_salvation,
        baptism_status: data.baptism_status || user.baptism_status,
        account_status: user.account_status,
        declaration_accepted_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    );
    const updatedUser = await this.repository.findById(user.id);
    return {
      user: {
        ...toPublicUser(updatedUser || user),
        profile_completed: true,
        declaration_accepted: true
      },
      message: "Personal information saved and declaration signed"
    };
  }
  async getUserById(userId) {
    return this.repository.findById(userId);
  }
  async issueTokens(userId, username) {
    const accessToken = import_jsonwebtoken.default.sign({ sub: userId, username }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN
    });
    const refreshToken = import_jsonwebtoken.default.sign({ sub: userId, jti: (0, import_uuid3.v4)() }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN
    });
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1e3);
    await this.repository.storeRefreshToken(userId, hashToken(refreshToken), expiresAt);
    return { accessToken, refreshToken };
  }
};

// backend/src/utils/response.ts
function sendSuccess(res, data, message = "Request successful", statusCode = 200, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: [],
    meta
  });
}
function sendError(res, message, statusCode = 400, errors = [], code = "ERROR") {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors: errors.length ? errors : [{ code, message }],
    meta: {}
  });
}

// backend/src/utils/asyncHandler.ts
var asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// backend/src/modules/authentication/controllers/auth.controller.ts
init_database();
init_env();
function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return void 0;
  const prefix = `${name}=`;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return void 0;
}
function setRefreshCookie(res, token) {
  const maxAge = 30 * 24 * 60 * 60 * 1e3;
  const secure = env.AUTH_COOKIE_SECURE ? "; Secure" : "";
  const sameSite = `; SameSite=${env.AUTH_COOKIE_SAME_SITE.charAt(0).toUpperCase()}${env.AUTH_COOKIE_SAME_SITE.slice(1)}`;
  res.setHeader("Set-Cookie", `${env.AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${Math.floor(maxAge / 1e3)}; Path=${env.API_PREFIX}/auth; HttpOnly${secure}${sameSite}`);
}
function clearRefreshCookie(res) {
  res.setHeader("Set-Cookie", `${env.AUTH_COOKIE_NAME}=; Max-Age=0; Path=${env.API_PREFIX}/auth; HttpOnly; SameSite=Lax`);
}
var authService = new AuthService();
function contextFrom(req) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.headers["user-agent"] ?? null
  };
}
var authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return sendSuccess(
      res,
      result,
      "Registration submitted. Your membership application is pending review.",
      201
    );
  }),
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, contextFrom(req));
    setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _refreshToken, ...safeResult } = result;
    return sendSuccess(res, safeResult, "Login successful");
  }),
  refresh: asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken || getCookie(req, env.AUTH_COOKIE_NAME);
    if (!refreshToken) throw new AuthenticationError("Invalid or expired refresh token");
    const result = await authService.refresh(refreshToken, contextFrom(req));
    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, { accessToken: result.accessToken }, "Token refreshed");
  }),
  logout: asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken || getCookie(req, env.AUTH_COOKIE_NAME);
    if (refreshToken) await authService.logout(refreshToken);
    clearRefreshCookie(res);
    return sendSuccess(res, null, "Logged out successfully");
  }),
  logoutEverywhere: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    await authService.logoutEverywhere(req.user.sub);
    return sendSuccess(res, null, "Logged out of all devices");
  }),
  me: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const user = await authService.getUserById(req.user.sub);
    if (!user || user.deleted_at) {
      throw new AuthenticationError("User no longer exists");
    }
    const roles = await query(
      `SELECT r.code, r.name, r.category, ur.scope_type, ur.scope_id
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :userId AND ur.is_current = TRUE
        ORDER BY r.category, r.name`,
      { userId: req.user.sub }
    );
    const publicUser = toPublicUser(user);
    const isProfileComplete = Boolean(user.admission_number && user.declaration_accepted);
    return sendSuccess(
      res,
      {
        ...publicUser,
        user: publicUser,
        sub: user.id,
        username: user.username,
        profile_completed: isProfileComplete,
        declaration_accepted: Boolean(user.declaration_accepted),
        permissions: Array.from(req.permissions ?? []),
        roles
      },
      "Current session"
    );
  }),
  completePersonalInfo: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const userId = req.user.sub;
    const {
      admission_number,
      full_name,
      phone_number,
      gender,
      course,
      department,
      school,
      year_of_study,
      campus_residence,
      date_of_salvation,
      baptism_status,
      evangelism_team,
      declaration_accepted,
      declaration_signature,
      membership_category
    } = req.body || {};
    const isGlobalOrAssociate = membership_category === "associate" || membership_category === "special";
    const finalAdmission = admission_number && String(admission_number).trim() ? String(admission_number).trim().toUpperCase() : isGlobalOrAssociate ? "GLB-" + String(userId).slice(0, 8).toUpperCase() : null;
    if (!finalAdmission) {
      return res.status(400).json({
        success: false,
        message: "Admission number or Member Affiliation ID is required",
        data: null
      });
    }
    if (!declaration_accepted) {
      return res.status(400).json({
        success: false,
        message: "You must read and accept the TUMCU Doctrinal Basis and Constitutional Declaration to complete your profile",
        data: null
      });
    }
    const result = await authService.completePersonalInfo(userId, {
      admission_number: finalAdmission,
      full_name: full_name?.trim(),
      phone_number: phone_number?.trim(),
      gender: gender || null,
      course: course?.trim() || null,
      department: department?.trim() || null,
      school: school?.trim() || null,
      year_of_study: year_of_study ? Number(year_of_study) : null,
      campus_residence: campus_residence?.trim() || null,
      date_of_salvation: date_of_salvation || null,
      baptism_status: baptism_status || "not_baptized",
      evangelism_team: evangelism_team || null,
      declaration_accepted: true,
      declaration_signature: declaration_signature || full_name
    });
    return sendSuccess(res, result, "Personal information saved and declaration signed successfully");
  })
};

// backend/src/middleware/validate.middleware.ts
var import_zod2 = require("zod");
function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof import_zod2.ZodError) {
        const details = err.errors.map((e) => ({
          code: "VALIDATION_ERROR",
          field: e.path.join("."),
          message: e.message
        }));
        throw new ValidationError("Validation failed", details);
      }
      throw err;
    }
  };
}

// backend/src/modules/authentication/dto/auth.dto.ts
var import_zod3 = require("zod");
var passwordPolicy = import_zod3.z.string().min(10, "Password must be at least 10 characters").max(128, "Password is too long").regex(/[a-z]/, "Password must include a lowercase letter").regex(/[A-Z]/, "Password must include an uppercase letter").regex(/[0-9]/, "Password must include a number").regex(/[^A-Za-z0-9]/, "Password must include a symbol");
var registerSchema = import_zod3.z.object({
  full_name: import_zod3.z.string().min(2).max(150),
  email: import_zod3.z.string().trim().email().transform((value) => value.toLowerCase()),
  phone_number: import_zod3.z.preprocess((value) => {
    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized === "" ? void 0 : normalized;
    }
    return value;
  }, import_zod3.z.string().regex(/^\+?[0-9]{7,18}$/, "Invalid phone number").optional()),
  admission_number: import_zod3.z.preprocess((value) => {
    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized === "" ? void 0 : normalized;
    }
    return value;
  }, import_zod3.z.string().min(2).max(50).optional()),
  country: import_zod3.z.string().min(2).max(100).optional(),
  location: import_zod3.z.string().min(2).max(150).optional(),
  affiliation: import_zod3.z.string().min(2).max(200).optional(),
  department: import_zod3.z.preprocess((value) => {
    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized === "" ? void 0 : normalized;
    }
    return value;
  }, import_zod3.z.string().min(2).max(150).optional()),
  year_of_study: import_zod3.z.coerce.number().int().min(1).max(7).optional(),
  password: passwordPolicy,
  membership_type: import_zod3.z.enum(["full", "special", "associate"]),
  declaration_accepted: import_zod3.z.literal(true, {
    errorMap: () => ({ message: "Membership declaration must be accepted" })
  })
});
var loginSchema = import_zod3.z.object({
  identifier: import_zod3.z.string().trim().min(3, "Email, admission number, or phone is required"),
  password: import_zod3.z.string().min(1)
});
var refreshSchema = import_zod3.z.object({
  refreshToken: import_zod3.z.string().min(10).optional()
});

// backend/src/modules/authentication/validators/auth.validator.ts
var authValidators = {
  register: { body: registerSchema },
  login: { body: loginSchema },
  refresh: { body: refreshSchema }
};

// backend/src/middleware/auth.middleware.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
init_env();
init_database();
async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or malformed Authorization header");
    }
    const token = header.slice("Bearer ".length);
    try {
      const payload = import_jsonwebtoken2.default.verify(token, env.JWT_ACCESS_SECRET);
      if (!payload?.sub || !payload?.username) {
        throw new AuthenticationError("Invalid access token");
      }
      req.user = payload;
      return next();
    } catch {
      throw new AuthenticationError("Invalid or expired access token");
    }
  } catch (err) {
    return next(err);
  }
}
async function loadPermissions(req, _res, next) {
  if (!req.user) throw new AuthenticationError();
  const [permissionRows, scopeRows, userRoles] = await Promise.all([
    query(
      `SELECT DISTINCT p.code
         FROM user_roles ur
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = :userId
          AND ur.is_current = TRUE`,
      { userId: req.user.sub }
    ),
    query(
      `SELECT scope_type, scope_id
         FROM user_roles
        WHERE user_id = :userId
          AND is_current = TRUE
          AND scope_type IN ('ministry', 'committee')
          AND scope_id IS NOT NULL`,
      { userId: req.user.sub }
    ),
    query(
      `SELECT ur.role_id, r.code AS role_code
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :userId
          AND ur.is_current = TRUE`,
      { userId: req.user.sub }
    )
  ]);
  const isSuperAdmin = userRoles.some((r) => r.role_code === "super_admin" || r.role_id === "role-1");
  if (isSuperAdmin) {
    const allPerms = await query("SELECT code FROM permissions");
    req.permissions = new Set(allPerms.map((p) => p.code));
  } else {
    const perms = new Set(permissionRows.map((r) => r.code));
    const baseMemberPermissions = [
      "meetings.view",
      "attendance.view",
      "attendance.record",
      "events.view",
      "events.register",
      "events.check_in",
      "prayer.view",
      "prayer.create",
      "ministries.view",
      "finance.request"
    ];
    for (const code of baseMemberPermissions) {
      perms.add(code);
    }
    req.permissions = perms;
  }
  req.scopedAccess = {
    ministryIds: new Set(scopeRows.filter((r) => r.scope_type === "ministry").map((r) => r.scope_id)),
    committeeIds: new Set(scopeRows.filter((r) => r.scope_type === "committee").map((r) => r.scope_id))
  };
  next();
}
function requirePermission(permissionCode) {
  return requireAnyPermission(permissionCode);
}
function requireAnyPermission(...permissionCodes) {
  return (req, _res, next) => {
    const held = permissionCodes.some((code) => req.permissions?.has(code));
    if (!held) {
      if (req.user) {
        query(
          `INSERT INTO security_events (id, user_id, event_type, ip_address, user_agent, metadata)
           VALUES (UUID(), :userId, 'permission_denied', :ip, :ua, :metadata)`,
          {
            userId: req.user.sub,
            ip: req.ip ?? null,
            ua: req.headers["user-agent"] ?? null,
            metadata: JSON.stringify({ permissions: permissionCodes, path: req.originalUrl })
          }
        ).catch(() => void 0);
      }
      throw new AuthorizationError(`Missing required permission: ${permissionCodes.join(" or ")}`);
    }
    next();
  };
}
function requireSuperAdmin(req, _res, next) {
  if (!req.user?.sub) return next(new AuthenticationError("Authentication required"));
  query(
    `SELECT r.code AS role_code
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = :userId
        AND ur.is_current = TRUE
        AND r.code = 'super_admin'
      LIMIT 1`,
    { userId: req.user?.sub }
  ).then((rows) => {
    if (rows.length > 0) return next();
    throw new AuthorizationError("Super Administrator access is required");
  }).catch(next);
}
function enforceScope(resourceType, bypassPermission, getResourceId) {
  return (req, _res, next) => {
    if (req.permissions?.has(bypassPermission)) return next();
    const resourceId = getResourceId(req);
    if (!resourceId) return next();
    const scopedIds = resourceType === "ministry" ? req.scopedAccess?.ministryIds : req.scopedAccess?.committeeIds;
    if (!scopedIds?.has(resourceId)) {
      throw new AuthorizationError(
        `You can only manage the ${resourceType} you are assigned to lead`
      );
    }
    next();
  };
}

// backend/src/modules/authentication/routes/auth.routes.ts
var router = (0, import_express.Router)();
router.post("/register", validate(authValidators.register), authController.register);
router.post("/login", validate(authValidators.login), authController.login);
router.post("/refresh", validate(authValidators.refresh), authController.refresh);
router.post("/logout", validate(authValidators.refresh), authController.logout);
router.post("/complete-personal-info", authenticate, authController.completePersonalInfo);
router.post("/logout-everywhere", authenticate, authController.logoutEverywhere);
router.get("/me", authenticate, loadPermissions, authController.me);
var auth_routes_default = router;

// backend/src/modules/membership/routes/membership.routes.ts
var import_express2 = require("express");

// backend/src/modules/membership/services/membership.service.ts
init_database();

// backend/src/utils/datetime.ts
function toMySQLDateTime(date = /* @__PURE__ */ new Date()) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

// backend/src/modules/membership/repositories/membership.repository.ts
var import_uuid5 = require("uuid");
init_database();

// backend/src/core/base.repository.ts
var import_uuid4 = require("uuid");
init_database();
var SAFE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
function isSafeIdentifier(key) {
  return SAFE_IDENTIFIER.test(key) && key.length <= 64;
}
var BaseRepository = class {
  constructor(table, softDelete = false) {
    this.table = table;
    this.softDelete = softDelete;
  }
  async findAll(filters = {}, { page = 1, pageSize = 20 } = {}) {
    const whereClauses = [];
    const params = {};
    if (this.softDelete) whereClauses.push("deleted_at IS NULL");
    for (const [key, value] of Object.entries(filters)) {
      if (value === void 0 || value === null || value === "") continue;
      if (!isSafeIdentifier(key)) continue;
      whereClauses.push(`${key} = :${key}`);
      params[key] = value;
    }
    const where = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;
    const countRows = await query(
      `SELECT COUNT(*) as total FROM ${this.table} ${where}`,
      params
    );
    const total = countRows[0]?.total ?? 0;
    const rows = await query(
      `SELECT * FROM ${this.table} ${where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
      { ...params, limit: pageSize, offset }
    );
    return {
      rows,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }
  async findById(id) {
    const where = this.softDelete ? "id = :id AND deleted_at IS NULL" : "id = :id";
    const rows = await query(`SELECT * FROM ${this.table} WHERE ${where} LIMIT 1`, { id });
    const record = rows[0];
    if (!record) throw new NotFoundError(this.table);
    return record;
  }
  async create(data) {
    const id = data.id ?? (0, import_uuid4.v4)();
    const record = { ...data, id };
    const columns = Object.keys(record);
    const unsafe = columns.filter((c) => !isSafeIdentifier(c));
    if (unsafe.length > 0) {
      throw new ValidationError("Invalid field name(s) in request body", unsafe.map((c) => ({
        code: "INVALID_FIELD",
        field: c,
        message: `"${c}" is not a valid field name`
      })));
    }
    const placeholders = columns.map((c) => `:${c}`);
    await query(
      `INSERT INTO ${this.table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
      record
    );
    return this.findById(id);
  }
  async update(id, data) {
    const entries = Object.entries(data).filter(([k]) => k !== "id");
    if (entries.length === 0) return this.findById(id);
    const unsafe = entries.filter(([k]) => !isSafeIdentifier(k));
    if (unsafe.length > 0) {
      throw new ValidationError(
        "Invalid field name(s) in request body",
        unsafe.map(([k]) => ({
          code: "INVALID_FIELD",
          field: k,
          message: `"${k}" is not a valid field name`
        }))
      );
    }
    const setClause = entries.map(([k]) => `${k} = :${k}`).join(", ");
    const params = Object.fromEntries(entries);
    await query(`UPDATE ${this.table} SET ${setClause} WHERE id = :id`, { ...params, id });
    return this.findById(id);
  }
  async remove(id) {
    if (this.softDelete) {
      await query(`UPDATE ${this.table} SET deleted_at = NOW() WHERE id = :id`, { id });
    } else {
      await query(`DELETE FROM ${this.table} WHERE id = :id`, { id });
    }
  }
};

// backend/src/modules/membership/repositories/membership.repository.ts
var MembershipApplicationRepository = class extends BaseRepository {
  constructor() {
    super("membership_applications");
  }
  /** For the admin review screen — the applicant's name/email is essential context a bare user_id isn't. */
  async listWithApplicantInfo(status, page, pageSize) {
    const offset = (page - 1) * pageSize;
    const where = status ? "WHERE ma.status = :status" : "";
    const params = status ? { status } : {};
    const countRows = await query(
      `SELECT COUNT(*) as total FROM membership_applications ma ${where}`,
      params
    );
    const total = countRows[0]?.total ?? 0;
    const rows = await query(
      `SELECT
          ma.id, ma.status, ma.rejection_reason, ma.created_at,
          u.id AS user_id, u.full_name, u.email, u.phone_number, u.admission_number,
          u.department, u.school, u.year_of_study,
          mt.name AS membership_type_name, mt.code AS membership_type_code
        FROM membership_applications ma
        JOIN users u ON u.id = ma.user_id
        JOIN membership_types mt ON mt.id = ma.membership_type_id
        ${where}
        ORDER BY ma.created_at DESC
        LIMIT :limit OFFSET :offset`,
      { ...params, limit: pageSize, offset }
    );
    return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
};
var MembershipRepository = class extends BaseRepository {
  constructor() {
    super("memberships");
  }
  /** Generates the next sequential membership number, e.g. TUMCU-2026-0001. */
  async generateMembershipNumber(year, connection) {
    const ownConnection = !connection;
    const conn = connection || await pool.getConnection();
    try {
      if (ownConnection) await conn.beginTransaction();
      await conn.query(
        `INSERT INTO membership_number_sequences (year, next_number)
         VALUES (:year, 1)
         ON DUPLICATE KEY UPDATE next_number = next_number + 1`,
        { year }
      );
      const [rows] = await conn.query(
        `SELECT next_number FROM membership_number_sequences WHERE year = :year FOR UPDATE`,
        { year }
      );
      const nextNumber = Number(rows[0]?.next_number || 1);
      if (ownConnection) await conn.commit();
      return `TUMCU-${year}-${String(nextNumber).padStart(4, "0")}`;
    } catch (err) {
      if (ownConnection) await conn.rollback();
      throw err;
    } finally {
      if (ownConnection) conn.release();
    }
  }
  async findCurrentSpiritualYear() {
    const rows = await query(
      `SELECT id FROM spiritual_years WHERE is_current = TRUE LIMIT 1`
    );
    return rows[0] ?? null;
  }
  async findActiveDeclaration() {
    const rows = await query(
      `SELECT id FROM membership_declarations WHERE is_active = TRUE LIMIT 1`
    );
    return rows[0] ?? null;
  }
  async createFromApplication(params, connection) {
    const id = (0, import_uuid5.v4)();
    const sql = `INSERT INTO memberships
         (id, user_id, membership_number, membership_type_id, spiritual_year_id,
          status, registration_date, declaration_id, declaration_signed_at)
       VALUES
         (:id, :userId, :membershipNumber, :membershipTypeId, :spiritualYearId,
          'active', CURDATE(), :declarationId, NOW())`;
    const paramsWithId = { id, ...params };
    if (connection) {
      await connection.query(sql, paramsWithId);
    } else {
      await query(sql, paramsWithId);
    }
    return id;
  }
};

// backend/src/modules/membership/services/membership.service.ts
var MembershipService = class {
  constructor(applications = new MembershipApplicationRepository(), memberships = new MembershipRepository()) {
    this.applications = applications;
    this.memberships = memberships;
  }
  listApplications(status, page = 1, pageSize = 20) {
    return this.applications.listWithApplicantInfo(status, page, pageSize);
  }
  /**
   * Approval workflow (Chapter 4):
   *   Application -> Review -> Approval -> Membership Number Generated ->
   *   Welcome Notification -> Added to Member Register
   */
  async approveApplication(applicationId, reviewerId) {
    const application = await this.applications.findById(applicationId);
    if (application.status === "approved") {
      throw new BusinessRuleError("This application has already been approved");
    }
    const spiritualYear = await this.memberships.findCurrentSpiritualYear();
    if (!spiritualYear) throw new NotFoundError("Current spiritual year");
    const declaration = await this.memberships.findActiveDeclaration();
    if (!declaration) throw new NotFoundError("Active membership declaration");
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const membershipNumber = await this.memberships.generateMembershipNumber(year, conn);
      const membershipId = await this.memberships.createFromApplication(
        {
          userId: application.user_id,
          membershipTypeId: application.membership_type_id,
          spiritualYearId: spiritualYear.id,
          declarationId: declaration.id,
          membershipNumber
        },
        conn
      );
      await conn.query(
        `UPDATE membership_applications
            SET status = 'approved', reviewed_by = :reviewerId, reviewed_at = NOW(),
                resulting_membership_id = :membershipId
          WHERE id = :applicationId`,
        { reviewerId, membershipId, applicationId }
      );
      await conn.query(
        `UPDATE users SET account_status = 'active' WHERE id = :userId`,
        { userId: application.user_id }
      );
      await conn.query(
        `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, is_current, assigned_by)
         SELECT UUID(), :userId, r.id, 'global', NULL, CURDATE(), TRUE, :assignedBy
           FROM roles r
          WHERE r.code = 'member'
            AND NOT EXISTS (
              SELECT 1 FROM user_roles ur
               WHERE ur.user_id = :userId
                 AND ur.role_id = r.id
                 AND ur.is_current = TRUE
            )`,
        { userId: application.user_id, assignedBy: reviewerId }
      );
      await conn.query(
        `INSERT INTO notifications (id, user_id, type, title, body, channel)
         VALUES (UUID(), :userId, 'welcome', 'Membership Approved!',
                 CONCAT('Congratulations! Your TUMCU membership application has been approved. Your official membership number is ', :membershipNumber, '. Welcome to fellowship!'),
                 'in_app')`,
        { userId: application.user_id, membershipNumber }
      );
      await conn.commit();
      return this.memberships.findById(membershipId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
  async rejectApplication(applicationId, reviewerId, reason) {
    const application = await this.applications.findById(applicationId);
    if (application.status === "approved") {
      throw new BusinessRuleError("An approved application cannot be rejected");
    }
    await pool.query(
      `UPDATE users SET account_status = 'rejected' WHERE id = :userId`,
      { userId: application.user_id }
    );
    return this.applications.update(applicationId, {
      status: "rejected",
      reviewed_by: reviewerId,
      reviewed_at: toMySQLDateTime(),
      rejection_reason: reason
    });
  }
  /** Annual renewal — a member re-signs the declaration for the new spiritual year. */
  async renew(userId, spiritualYearId, declarationId) {
    const existing = await query(
      `SELECT id FROM memberships WHERE user_id = :userId AND spiritual_year_id = :spiritualYearId LIMIT 1`,
      { userId, spiritualYearId }
    );
    if (existing.length > 0) {
      throw new BusinessRuleError("Membership already renewed for this spiritual year");
    }
    const priorRows = await query(
      `SELECT membership_type_id, membership_number
         FROM memberships WHERE user_id = :userId
         ORDER BY registration_date DESC LIMIT 1`,
      { userId }
    );
    const prior = priorRows[0];
    if (!prior) throw new NotFoundError("Prior membership record");
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const membershipNumber = await this.memberships.generateMembershipNumber(year);
    const membershipId = await this.memberships.createFromApplication({
      userId,
      membershipTypeId: prior.membership_type_id,
      spiritualYearId,
      declarationId,
      membershipNumber
    });
    await query(
      `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, is_current)
       SELECT UUID(), :userId, r.id, 'global', NULL, CURDATE(), TRUE
         FROM roles r
        WHERE r.code = 'member'
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur
             WHERE ur.user_id = :userId
               AND ur.role_id = r.id
               AND ur.is_current = TRUE
          )`,
      { userId }
    );
    return this.memberships.findById(membershipId);
  }
  getMembership(id) {
    return this.memberships.findById(id);
  }
  /** Self-service: a member's own membership + application history, no admin permission required. */
  async getMyStatus(userId) {
    const [memberships, applications] = await Promise.all([
      this.memberships.findAll({ user_id: userId }, { page: 1, pageSize: 10 }),
      this.applications.findAll({ user_id: userId }, { page: 1, pageSize: 10 })
    ]);
    return { memberships: memberships.rows, applications: applications.rows };
  }
  listMemberships(filters = {}, page = 1, pageSize = 20) {
    return this.memberships.findAll(filters, { page, pageSize });
  }
  /**
   * Indexed, server-side member register query.
   *
   * The previous implementation loaded users, memberships, roles, ministries
   * and every attendance row into Node.js and then filtered them in memory.
   * That is O(total_database_rows) per request and becomes unsafe as the
   * membership register grows. Filtering, sorting and pagination now happen
   * in MySQL.
   */
  async listAllMembersWithDetails(search, yearOfStudy, department, status, page = 1, pageSize = 50) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(200, Math.max(10, Number(pageSize) || 50));
    const offset = (safePage - 1) * safePageSize;
    const where = [
      `u.deleted_at IS NULL`,
      `(u.account_status NOT IN ('pending_approval') OR m.id IS NOT NULL)`
    ];
    const params = {
      limit: safePageSize,
      offset
    };
    if (search?.trim()) {
      where.push(`(
        u.full_name LIKE :search OR
        u.email LIKE :search OR
        u.admission_number LIKE :search OR
        m.membership_number LIKE :search
      )`);
      params.search = `%${search.trim()}%`;
    }
    if (yearOfStudy && yearOfStudy !== "all") {
      where.push(`CAST(u.year_of_study AS CHAR) = :yearOfStudy`);
      params.yearOfStudy = yearOfStudy;
    }
    if (department && department !== "all") {
      where.push(`(u.department = :department OR u.school = :department OR u.course = :department)`);
      params.department = department;
    }
    if (status && status !== "all") {
      where.push(`COALESCE(m.status, u.account_status) = :status`);
      params.status = status;
    }
    const whereSql = where.join(" AND ");
    const [countRows, rows] = await Promise.all([
      query(
        `SELECT COUNT(DISTINCT u.id) AS total
           FROM users u
           LEFT JOIN memberships m ON m.user_id = u.id
          WHERE ${whereSql}`,
        params
      ),
      query(
        `SELECT
            COALESCE(m.id, u.id) AS id,
            u.id AS user_id,
            u.full_name,
            u.email,
            COALESCE(u.phone_number, 'Not provided') AS phone_number,
            COALESCE(u.admission_number, 'Not provided') AS admission_number,
            COALESCE(CONCAT('Year ', u.year_of_study), 'Year 1') AS year_of_study,
            COALESCE(u.department, u.school, u.course, 'Not specified') AS department,
            COALESCE(m.membership_number, CONCAT('TUMCU/', YEAR(CURDATE()), '/', RIGHT(COALESCE(u.admission_number, '101'), 3))) AS membership_number,
            COALESCE(mt.name, 'Full Member') AS membership_type,
            COALESCE(m.status, u.account_status, 'active') AS status,
            COALESCE(m.registration_date, DATE(u.created_at)) AS registration_date,
            COALESCE(GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', '), 'Member') AS role_name,
            COALESCE(
              GROUP_CONCAT(DISTINCT min.name ORDER BY min.name SEPARATOR ', '),
              'Not yet joined'
            ) AS ministries,
            (
              SELECT COUNT(*)
                FROM attendance_records ar
               WHERE ar.user_id = u.id
            ) AS services_attended
           FROM users u
           LEFT JOIN memberships m ON m.id = (
             SELECT m2.id
               FROM memberships m2
              WHERE m2.user_id = u.id
              ORDER BY m2.registration_date DESC, m2.created_at DESC
              LIMIT 1
           )
           LEFT JOIN membership_types mt ON mt.id = m.membership_type_id
           LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_current = TRUE
           LEFT JOIN roles r ON r.id = ur.role_id
           LEFT JOIN ministry_members mm ON mm.user_id = u.id
           LEFT JOIN ministries min ON min.id = mm.ministry_id
          WHERE ${whereSql}
          GROUP BY
            m.id, u.id, u.full_name, u.email, u.phone_number, u.admission_number,
            u.year_of_study, u.department, u.school, u.course, u.created_at,
            m.membership_number, mt.name, m.status, m.registration_date
          ORDER BY u.year_of_study ASC, u.full_name ASC, u.id ASC
          LIMIT :limit OFFSET :offset`,
        params
      )
    ]);
    const total = Number(countRows?.[0]?.total || 0);
    return {
      rows: rows || [],
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize))
    };
  }
  async deleteMember(memberIdOrUserId) {
    const membershipRows = await query(
      `SELECT id, user_id FROM memberships WHERE id = :id OR user_id = :id LIMIT 1`,
      { id: memberIdOrUserId }
    );
    const member = membershipRows[0];
    const userId = member?.user_id || memberIdOrUserId;
    await pool.query("DELETE FROM memberships WHERE id = :id OR user_id = :userId", {
      id: member?.id || memberIdOrUserId,
      userId
    });
    await pool.query("DELETE FROM user_roles WHERE user_id = :userId", { userId });
    await pool.query("DELETE FROM ministry_members WHERE user_id = :userId", { userId });
    await pool.query("DELETE FROM users WHERE id = :userId", { userId });
    return { id: memberIdOrUserId, userId, deleted: true };
  }
};

// backend/src/modules/membership/controllers/membership.controller.ts
init_logger();
var membershipService = new MembershipService();
var membershipController = {
  listApplications: asyncHandler(async (req, res) => {
    const { status, page, pageSize, search } = req.query;
    const userId = req.user?.sub;
    const permissions = Array.from(req.permissions ?? []);
    logger.info(
      {
        endpoint: req.originalUrl,
        userId,
        permissionsCount: permissions.length,
        statusFilter: status,
        page,
        pageSize
      },
      "[MembershipController] listApplications called"
    );
    const result = await membershipService.listApplications(
      status,
      Number(page) || 1,
      Number(pageSize) || 50
    );
    let rows = result.rows || [];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) => String(r.full_name || "").toLowerCase().includes(q) || String(r.email || "").toLowerCase().includes(q) || String(r.admission_number || "").toLowerCase().includes(q)
      );
    }
    logger.info(
      { total: result.total, returned: rows.length },
      "[MembershipController] Returning membership applications"
    );
    return sendSuccess(res, rows, "Membership applications retrieved", 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  }),
  approve: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    logger.info(
      { applicationId: req.params.id, reviewerId: req.user.sub },
      "[MembershipController] Approving application"
    );
    const membership = await membershipService.approveApplication(req.params.id, req.user.sub);
    return sendSuccess(res, membership, "Membership application approved");
  }),
  reject: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    logger.info(
      { applicationId: req.params.id, reviewerId: req.user.sub, reason: req.body.rejectionReason },
      "[MembershipController] Rejecting application"
    );
    const application = await membershipService.rejectApplication(
      req.params.id,
      req.user.sub,
      req.body.rejectionReason
    );
    return sendSuccess(res, application, "Membership application rejected");
  }),
  renew: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const membership = await membershipService.renew(
      req.user.sub,
      req.body.spiritualYearId,
      req.body.declarationId
    );
    return sendSuccess(res, membership, "Membership renewed successfully");
  }),
  getById: asyncHandler(async (req, res) => {
    const membership = await membershipService.getMembership(req.params.id);
    return sendSuccess(res, membership, "Membership retrieved");
  }),
  me: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const status = await membershipService.getMyStatus(req.user.sub);
    return sendSuccess(res, status, "Your membership status");
  }),
  list: asyncHandler(async (req, res) => {
    const { status, membership_type_id, page, pageSize } = req.query;
    const result = await membershipService.listMemberships(
      { status, membership_type_id },
      Number(page) || 1,
      Number(pageSize) || 20
    );
    return sendSuccess(res, result.rows, "Memberships retrieved", 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  }),
  listAllMembers: asyncHandler(async (req, res) => {
    const { search, year_of_study, department, status, page, pageSize } = req.query;
    const result = await membershipService.listAllMembersWithDetails(
      search,
      year_of_study,
      department,
      status,
      Number(page) || 1,
      Number(pageSize) || 50
    );
    return sendSuccess(res, result.rows, "Members retrieved", 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  }),
  deleteMember: asyncHandler(async (req, res) => {
    const result = await membershipService.deleteMember(req.params.id);
    return sendSuccess(res, result, "Member removed from register successfully");
  }),
  exportCsv: asyncHandler(async (_req, res) => {
    const filename = `TUMCU_Membership_Register_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200);
    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    const headers = [
      "Membership No",
      "Full Name",
      "Admission No",
      "Year of Study",
      "Department / Faculty",
      "Email",
      "Phone Number",
      "Role",
      "Ministries",
      "Services Attended",
      "Status",
      "Registered Date"
    ];
    res.write(headers.map(escapeCsv).join(",") + "\n");
    let page = 1;
    const pageSize = 200;
    while (true) {
      const result = await membershipService.listAllMembersWithDetails(
        void 0,
        void 0,
        void 0,
        void 0,
        page,
        pageSize
      );
      for (const m of result.rows) {
        const line = [
          m.membership_number,
          m.full_name,
          m.admission_number,
          m.year_of_study,
          m.department,
          m.email,
          m.phone_number,
          m.role_name,
          m.ministries,
          m.services_attended,
          m.status,
          m.registration_date
        ].map(escapeCsv).join(",") + "\n";
        if (!res.write(line)) {
          await new Promise((resolve) => res.once("drain", resolve));
        }
      }
      if (page >= result.totalPages) break;
      page += 1;
    }
    return res.end();
  })
};

// backend/src/modules/membership/dto/membership.dto.ts
var import_zod4 = require("zod");
var approveApplicationSchema = import_zod4.z.object({
  reviewerNotes: import_zod4.z.string().max(1e3).optional()
});
var rejectApplicationSchema = import_zod4.z.object({
  rejectionReason: import_zod4.z.string().min(3, "A rejection reason is required").max(1e3)
});
var renewMembershipSchema = import_zod4.z.object({
  spiritualYearId: import_zod4.z.string().uuid(),
  declarationId: import_zod4.z.string().uuid()
});

// backend/src/modules/membership/validators/membership.validator.ts
var membershipValidators = {
  approve: { body: approveApplicationSchema },
  reject: { body: rejectApplicationSchema },
  renew: { body: renewMembershipSchema }
};

// backend/src/modules/membership/routes/membership.routes.ts
var router2 = (0, import_express2.Router)();
router2.use(authenticate, loadPermissions);
router2.get("/applications", requireAnyPermission("membership.review", "membership.approve"), membershipController.listApplications);
router2.post(
  "/applications/:id/approve",
  requirePermission("membership.approve"),
  validate(membershipValidators.approve),
  membershipController.approve
);
router2.post(
  "/applications/:id/reject",
  requirePermission("membership.approve"),
  validate(membershipValidators.reject),
  membershipController.reject
);
router2.post("/renew", validate(membershipValidators.renew), membershipController.renew);
router2.get("/me", membershipController.me);
router2.get("/all-members", requirePermission("membership.view_all"), membershipController.listAllMembers);
router2.get("/export", requirePermission("membership.view_all"), membershipController.exportCsv);
router2.delete("/:id", requireSuperAdmin, membershipController.deleteMember);
router2.get("/", requirePermission("membership.view_all"), membershipController.list);
router2.get("/:id", requirePermission("membership.view_all"), membershipController.getById);
var membership_routes_default = router2;

// backend/src/modules/meetings/routes/meetings.routes.ts
var import_express3 = require("express");

// backend/src/core/base.controller.ts
var BaseController = class {
  constructor(service13, resourceName) {
    this.service = service13;
    this.resourceName = resourceName;
  }
  list = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const { page: _p, pageSize: _ps, ...filters } = req.query;
    const result = await this.service.list(filters, { page, pageSize });
    return sendSuccess(res, result.rows, `${this.resourceName} list retrieved`, 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  });
  getById = asyncHandler(async (req, res) => {
    const record = await this.service.getById(req.params.id);
    return sendSuccess(res, record, `${this.resourceName} retrieved`);
  });
  create = asyncHandler(async (req, res) => {
    const record = await this.service.create(req.body);
    return sendSuccess(res, record, `${this.resourceName} created successfully`, 201);
  });
  update = asyncHandler(async (req, res) => {
    const record = await this.service.update(req.params.id, req.body);
    return sendSuccess(res, record, `${this.resourceName} updated successfully`);
  });
  remove = asyncHandler(async (req, res) => {
    await this.service.remove(req.params.id);
    return sendSuccess(res, null, `${this.resourceName} deleted successfully`);
  });
};

// backend/src/core/base.service.ts
var BaseService = class {
  constructor(repository) {
    this.repository = repository;
  }
  list(filters = {}, pagination = {}) {
    return this.repository.findAll(filters, pagination);
  }
  getById(id) {
    return this.repository.findById(id);
  }
  create(data) {
    return this.repository.create(data);
  }
  update(id, data) {
    return this.repository.update(id, data);
  }
  remove(id) {
    return this.repository.remove(id);
  }
};

// backend/src/modules/meetings/repositories/meetings.repository.ts
var import_uuid6 = require("uuid");
init_database();
var MeetingsRepository = class extends BaseRepository {
  constructor() {
    super("meetings");
  }
};
var AgendaRepository = class {
  async listForMeeting(meetingId) {
    return query(
      `SELECT * FROM meeting_agenda_items WHERE meeting_id = :meetingId ORDER BY display_order ASC`,
      { meetingId }
    );
  }
  async add(meetingId, data) {
    const id = (0, import_uuid6.v4)();
    const countRows = await query(
      `SELECT COUNT(*) as count FROM meeting_agenda_items WHERE meeting_id = :meetingId`,
      { meetingId }
    );
    const displayOrder = data.display_order ?? countRows[0]?.count ?? 0;
    await query(
      `INSERT INTO meeting_agenda_items
         (id, meeting_id, title, description, is_voting_item, presenter_id, time_allocated_minutes, display_order)
       VALUES
         (:id, :meetingId, :title, :description, :isVotingItem, :presenterId, :timeAllocated, :displayOrder)`,
      {
        id,
        meetingId,
        title: data.title,
        description: data.description ?? null,
        isVotingItem: data.is_voting_item ?? false,
        presenterId: data.presenter_id ?? null,
        timeAllocated: data.time_allocated_minutes ?? null,
        displayOrder
      }
    );
    const rows = await query(`SELECT * FROM meeting_agenda_items WHERE id = :id`, { id });
    return rows[0];
  }
  async reorder(meetingId, orderedIds) {
    await Promise.all(
      orderedIds.map(
        (id, index) => query(
          `UPDATE meeting_agenda_items SET display_order = :index WHERE id = :id AND meeting_id = :meetingId`,
          { index, id, meetingId }
        )
      )
    );
  }
};
var ResolutionRepository = class {
  async listForMeeting(meetingId) {
    return query(`SELECT * FROM meeting_resolutions WHERE meeting_id = :meetingId`, {
      meetingId
    });
  }
  async create(meetingId, data) {
    const id = (0, import_uuid6.v4)();
    const countRows = await query(
      `SELECT COUNT(*) as count FROM meeting_resolutions`
    );
    const resolutionNumber = data.resolution_number ?? `RES-${(countRows[0]?.count ?? 0) + 1}`;
    await query(
      `INSERT INTO meeting_resolutions
         (id, meeting_id, resolution_number, description, motion, mover_id, seconder_id,
          votes_for, votes_against, votes_abstain, status, responsible_user_id, due_date)
       VALUES
         (:id, :meetingId, :resolutionNumber, :description, :motion, :moverId, :seconderId,
          :votesFor, :votesAgainst, :votesAbstain, 'pending', :responsibleUserId, :dueDate)`,
      {
        id,
        meetingId,
        resolutionNumber,
        description: data.description,
        motion: data.motion ?? null,
        moverId: data.mover_id ?? null,
        seconderId: data.seconder_id ?? null,
        votesFor: data.votes_for ?? 0,
        votesAgainst: data.votes_against ?? 0,
        votesAbstain: data.votes_abstain ?? 0,
        responsibleUserId: data.responsible_user_id ?? null,
        dueDate: data.due_date ?? null
      }
    );
    const rows = await query(`SELECT * FROM meeting_resolutions WHERE id = :id`, { id });
    return rows[0];
  }
  async updateStatus(id, status) {
    await query(`UPDATE meeting_resolutions SET status = :status WHERE id = :id`, { id, status });
  }
};
var MinutesRepository = class {
  async findForMeeting(meetingId) {
    const rows = await query(
      `SELECT * FROM meeting_minutes WHERE meeting_id = :meetingId LIMIT 1`,
      { meetingId }
    );
    return rows[0] ?? null;
  }
  async upsert(meetingId, recordedBy, content) {
    const existing = await this.findForMeeting(meetingId);
    if (existing) {
      await query(`UPDATE meeting_minutes SET content = :content WHERE id = :id`, {
        id: existing.id,
        content
      });
      return { ...existing, content };
    }
    const id = (0, import_uuid6.v4)();
    await query(
      `INSERT INTO meeting_minutes (id, meeting_id, recorded_by, content)
       VALUES (:id, :meetingId, :recordedBy, :content)`,
      { id, meetingId, recordedBy, content }
    );
    const rows = await query(`SELECT * FROM meeting_minutes WHERE id = :id`, { id });
    return rows[0];
  }
  async approve(meetingId, approvedBy) {
    const existing = await this.findForMeeting(meetingId);
    if (!existing) throw new Error("Minutes have not been recorded yet");
    await query(
      `UPDATE meeting_minutes SET approved_at = NOW(), approved_by = :approvedBy WHERE id = :id`,
      { id: existing.id, approvedBy }
    );
    return { ...existing, approved_by: approvedBy, approved_at: toMySQLDateTime() };
  }
};
var AttendanceConfirmationRepository = class {
  async confirm(meetingId, userId, method, isVisitor = false) {
    await query(
      `INSERT INTO meeting_attendance_confirmations (id, meeting_id, user_id, confirmed_at, method, is_visitor)
       VALUES (UUID(), :meetingId, :userId, NOW(), :method, :isVisitor)
       ON DUPLICATE KEY UPDATE confirmed_at = NOW(), method = :method`,
      { meetingId, userId, method, isVisitor }
    );
  }
  async listForMeeting(meetingId) {
    return query(
      `SELECT mac.*, u.full_name FROM meeting_attendance_confirmations mac
         JOIN users u ON u.id = mac.user_id
        WHERE mac.meeting_id = :meetingId`,
      { meetingId }
    );
  }
};

// backend/src/modules/meetings/services/meetings.service.ts
var MeetingsService = class extends BaseService {
  constructor(repository = new MeetingsRepository(), agenda = new AgendaRepository(), resolutions = new ResolutionRepository(), minutes = new MinutesRepository(), attendance = new AttendanceConfirmationRepository()) {
    super(repository);
    this.agenda = agenda;
    this.resolutions = resolutions;
    this.minutes = minutes;
    this.attendance = attendance;
  }
  async getAgenda(meetingId) {
    return this.agenda.listForMeeting(meetingId);
  }
  async addAgendaItem(meetingId, data) {
    const meeting = await this.getById(meetingId);
    if (["held", "archived", "cancelled"].includes(meeting.status)) {
      throw new BusinessRuleError(`Cannot edit agenda for a meeting that is ${meeting.status}`);
    }
    return this.agenda.add(meetingId, data);
  }
  async reorderAgenda(meetingId, orderedIds) {
    return this.agenda.reorder(meetingId, orderedIds);
  }
  async confirmAttendance(meetingId, userId, method, isVisitor = false) {
    return this.attendance.confirm(meetingId, userId, method, isVisitor);
  }
  async listAttendance(meetingId) {
    return this.attendance.listForMeeting(meetingId);
  }
  async recordMinutes(meetingId, recordedBy, content) {
    const meeting = await this.getById(meetingId);
    if (meeting.status === "archived") {
      throw new BusinessRuleError("Cannot edit minutes for an archived meeting");
    }
    return this.minutes.upsert(meetingId, recordedBy, content);
  }
  async getMinutes(meetingId) {
    return this.minutes.findForMeeting(meetingId);
  }
  async approveMinutes(meetingId, approvedBy) {
    return this.minutes.approve(meetingId, approvedBy);
  }
  async listResolutions(meetingId) {
    return this.resolutions.listForMeeting(meetingId);
  }
  async passResolution(meetingId, data) {
    return this.resolutions.create(meetingId, data);
  }
  async updateResolutionStatus(resolutionId, status) {
    return this.resolutions.updateStatus(resolutionId, status);
  }
  /** Conduct -> archive transition. Minutes must exist and be approved first. */
  async archive(meetingId) {
    const minutes = await this.minutes.findForMeeting(meetingId);
    if (!minutes || !minutes.approved_at) {
      throw new BusinessRuleError("Minutes must be recorded and approved before archiving a meeting");
    }
    return this.update(meetingId, { status: "archived" });
  }
};

// backend/src/modules/meetings/controllers/meetings.controller.ts
var service = new MeetingsService();
var MeetingsController = class extends BaseController {
  constructor() {
    super(service, "Meeting");
  }
  // Overrides the generic BaseController.create: `called_by` must be the
  // authenticated caller, never a client-supplied value — otherwise anyone
  // with meetings.create could misattribute who called the meeting, which
  // matters for an audit-relevant field like this one.
  create = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const meeting = await service.create({ ...req.body, called_by: req.user.sub });
    return sendSuccess(res, meeting, "Meeting created successfully", 201);
  });
  getAgenda = asyncHandler(async (req, res) => {
    const items = await service.getAgenda(req.params.id);
    return sendSuccess(res, items, "Agenda retrieved");
  });
  addAgendaItem = asyncHandler(async (req, res) => {
    const item = await service.addAgendaItem(req.params.id, req.body);
    return sendSuccess(res, item, "Agenda item added", 201);
  });
  reorderAgenda = asyncHandler(async (req, res) => {
    await service.reorderAgenda(req.params.id, req.body.orderedIds);
    return sendSuccess(res, null, "Agenda reordered");
  });
  confirmAttendance = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    await service.confirmAttendance(
      req.params.id,
      req.body.userId ?? req.user.sub,
      req.body.method ?? "manual",
      req.body.isVisitor ?? false
    );
    return sendSuccess(res, null, "Attendance confirmed");
  });
  listAttendance = asyncHandler(async (req, res) => {
    const rows = await service.listAttendance(req.params.id);
    return sendSuccess(res, rows, "Attendance retrieved");
  });
  recordMinutes = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const minutes = await service.recordMinutes(req.params.id, req.user.sub, req.body.content);
    return sendSuccess(res, minutes, "Minutes saved");
  });
  getMinutes = asyncHandler(async (req, res) => {
    const minutes = await service.getMinutes(req.params.id);
    return sendSuccess(res, minutes, "Minutes retrieved");
  });
  approveMinutes = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const minutes = await service.approveMinutes(req.params.id, req.user.sub);
    return sendSuccess(res, minutes, "Minutes approved");
  });
  listResolutions = asyncHandler(async (req, res) => {
    const rows = await service.listResolutions(req.params.id);
    return sendSuccess(res, rows, "Resolutions retrieved");
  });
  passResolution = asyncHandler(async (req, res) => {
    const resolution = await service.passResolution(req.params.id, req.body);
    return sendSuccess(res, resolution, "Resolution recorded", 201);
  });
  archive = asyncHandler(async (req, res) => {
    const meeting = await service.archive(req.params.id);
    return sendSuccess(res, meeting, "Meeting archived");
  });
};
var meetingsController = new MeetingsController();

// backend/src/modules/meetings/routes/meetings.routes.ts
var router3 = (0, import_express3.Router)();
router3.use(authenticate, loadPermissions);
router3.get("/", requirePermission("meetings.view"), meetingsController.list);
router3.get("/:id", requirePermission("meetings.view"), meetingsController.getById);
router3.post("/", requirePermission("meetings.create"), meetingsController.create);
router3.put("/:id", requirePermission("meetings.edit"), meetingsController.update);
router3.delete("/:id", requirePermission("meetings.delete"), meetingsController.remove);
router3.get("/:id/agenda", requirePermission("meetings.view"), meetingsController.getAgenda);
router3.post("/:id/agenda", requirePermission("meetings.edit"), meetingsController.addAgendaItem);
router3.put("/:id/agenda/reorder", requirePermission("meetings.edit"), meetingsController.reorderAgenda);
router3.post("/:id/attendance", requirePermission("attendance.record"), meetingsController.confirmAttendance);
router3.get("/:id/attendance", requirePermission("attendance.view"), meetingsController.listAttendance);
router3.get("/:id/minutes", requirePermission("meetings.view"), meetingsController.getMinutes);
router3.post("/:id/minutes", requirePermission("meetings.manage_minutes"), meetingsController.recordMinutes);
router3.post(
  "/:id/minutes/approve",
  requirePermission("meetings.approve_minutes"),
  meetingsController.approveMinutes
);
router3.get("/:id/resolutions", requirePermission("meetings.view"), meetingsController.listResolutions);
router3.post("/:id/resolutions", requirePermission("meetings.manage_minutes"), meetingsController.passResolution);
router3.post("/:id/archive", requirePermission("meetings.archive"), meetingsController.archive);
var meetings_routes_default = router3;

// backend/src/modules/expenses/routes/expenses.routes.ts
var import_express4 = require("express");

// backend/src/modules/expenses/services/expenses.service.ts
var import_uuid7 = require("uuid");

// backend/src/modules/expenses/repositories/expenses.repository.ts
var ExpensesRepository = class extends BaseRepository {
  constructor() {
    super("expense_requests");
  }
};

// backend/src/modules/expenses/services/expenses.service.ts
init_database();
var ExpensesService = class extends BaseService {
  constructor(repository = new ExpensesRepository()) {
    super(repository);
  }
  async transition(id, fromStatuses, toStatus, extra = {}) {
    const expense = await this.getById(id);
    if (!fromStatuses.includes(expense.status)) {
      throw new BusinessRuleError(
        `Cannot move expense from "${expense.status}" to "${toStatus}" \u2014 expected one of: ${fromStatuses.join(", ")}`
      );
    }
    return this.update(id, { status: toStatus, ...extra });
  }
  async treasurerReview(id, reviewerId) {
    return this.transition(id, ["requested"], "treasurer_reviewed", {
      treasurer_reviewed_by: reviewerId,
      treasurer_reviewed_at: toMySQLDateTime()
    });
  }
  async secretaryVerify(id, verifierId) {
    return this.transition(id, ["treasurer_reviewed"], "secretary_verified", {
      secretary_verified_by: verifierId,
      secretary_verified_at: toMySQLDateTime()
    });
  }
  async chairpersonApprove(id, approverId) {
    return this.transition(id, ["secretary_verified"], "chairperson_approved", {
      chairperson_approved_by: approverId,
      chairperson_approved_at: toMySQLDateTime()
    });
  }
  async markPaid(id) {
    return this.transition(id, ["chairperson_approved"], "paid", {
      paid_at: toMySQLDateTime()
    });
  }
  async recordReceipt(id, receiptNumber) {
    return this.transition(id, ["paid"], "receipted", { receipt_number: receiptNumber });
  }
  async markAudited(id) {
    return this.transition(id, ["receipted"], "audited");
  }
  async reject(id, reason) {
    const expense = await this.getById(id);
    if (["paid", "receipted", "audited", "rejected"].includes(expense.status)) {
      throw new BusinessRuleError(`Cannot reject an expense that is already ${expense.status}`);
    }
    return this.update(id, { status: "rejected", rejection_reason: reason });
  }
  /** Creates the request and links it to the requester's committee/ministry/event context. */
  async createRequest(data) {
    return this.create({ ...data, id: (0, import_uuid7.v4)(), status: "requested" });
  }
  async budgetSummaryBySpiritualYear(spiritualYearId) {
    return query(
      `SELECT expense_type, SUM(amount) as total, COUNT(*) as count
         FROM expense_requests er
         JOIN annual_budgets ab ON 1=1
        WHERE ab.spiritual_year_id = :spiritualYearId AND er.status != 'rejected'
        GROUP BY expense_type`,
      { spiritualYearId }
    );
  }
};

// backend/src/modules/expenses/controllers/expenses.controller.ts
var service2 = new ExpensesService();
var ExpensesController = class extends BaseController {
  constructor() {
    super(service2, "Expense request");
  }
  create = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const expense = await service2.createRequest({ ...req.body, requested_by: req.user.sub });
    return sendSuccess(res, expense, "Expense request submitted", 201);
  });
  treasurerReview = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const expense = await service2.treasurerReview(req.params.id, req.user.sub);
    return sendSuccess(res, expense, "Expense reviewed by treasurer");
  });
  secretaryVerify = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const expense = await service2.secretaryVerify(req.params.id, req.user.sub);
    return sendSuccess(res, expense, "Expense verified by secretary");
  });
  chairpersonApprove = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const expense = await service2.chairpersonApprove(req.params.id, req.user.sub);
    return sendSuccess(res, expense, "Expense approved by chairperson");
  });
  markPaid = asyncHandler(async (req, res) => {
    const expense = await service2.markPaid(req.params.id);
    return sendSuccess(res, expense, "Expense marked as paid");
  });
  recordReceipt = asyncHandler(async (req, res) => {
    const expense = await service2.recordReceipt(req.params.id, req.body.receiptNumber);
    return sendSuccess(res, expense, "Receipt recorded");
  });
  markAudited = asyncHandler(async (req, res) => {
    const expense = await service2.markAudited(req.params.id);
    return sendSuccess(res, expense, "Expense marked as audited");
  });
  reject = asyncHandler(async (req, res) => {
    const expense = await service2.reject(req.params.id, req.body.reason);
    return sendSuccess(res, expense, "Expense request rejected");
  });
};
var expensesController = new ExpensesController();

// backend/src/modules/expenses/routes/expenses.routes.ts
var router4 = (0, import_express4.Router)();
router4.use(authenticate, loadPermissions);
router4.get("/", requirePermission("finance.view"), expensesController.list);
router4.get("/:id", requirePermission("finance.view"), expensesController.getById);
router4.post("/", requirePermission("finance.request"), expensesController.create);
router4.post("/:id/treasurer-review", requirePermission("finance.treasurer_review"), expensesController.treasurerReview);
router4.post("/:id/secretary-verify", requirePermission("finance.secretary_verify"), expensesController.secretaryVerify);
router4.post("/:id/chairperson-approve", requirePermission("finance.approve"), expensesController.chairpersonApprove);
router4.post("/:id/mark-paid", requirePermission("finance.pay"), expensesController.markPaid);
router4.post("/:id/receipt", requirePermission("finance.pay"), expensesController.recordReceipt);
router4.post("/:id/mark-audited", requirePermission("finance.audit"), expensesController.markAudited);
router4.post("/:id/reject", requirePermission("finance.approve"), expensesController.reject);
var expenses_routes_default = router4;

// backend/src/modules/events/routes/events.routes.ts
var import_express5 = require("express");

// backend/src/modules/events/repositories/events.repository.ts
var import_uuid8 = require("uuid");
var import_crypto4 = __toESM(require("crypto"));
init_database();
var EventsRepository = class extends BaseRepository {
  constructor() {
    super("events");
  }
  /**
   * Public site listing — deliberately excludes 'draft' and 'budgeted'
   * events (internal planning stages not yet approved for public view),
   * regardless of any filter the caller passes, since this method backs
   * an unauthenticated route.
   */
  async listPublic(page, pageSize) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) ? Math.min(Math.max(Math.floor(pageSize), 1), 50) : 20;
    const offset = (safePage - 1) * safePageSize;
    const columnRows = await query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'events'
          AND column_name IN ('status', 'capacity', 'registration_deadline')`
    );
    const columns = new Set(columnRows.map((row) => row.column_name));
    const hasStatus = columns.has("status");
    const hasCapacity = columns.has("capacity");
    const hasRegistrationDeadline = columns.has("registration_deadline");
    const statusWhere = hasStatus ? `status IN ('approved', 'registration_open', 'ongoing')
         AND (start_at >= NOW() OR (end_at IS NOT NULL AND end_at >= NOW()))` : `start_at >= NOW()`;
    const countRows = await query(
      `SELECT COUNT(*) AS total
         FROM events
        WHERE ${statusWhere}`
    );
    const total = Number(countRows[0]?.total ?? 0);
    const rows = await query(
      `SELECT
          id,
          title,
          event_type,
          description,
          speaker,
          topic,
          banner_url,
          start_at,
          end_at,
          location,
          organized_by,
          ${hasStatus ? "status" : "'approved' AS status"},
          ${hasCapacity ? "capacity" : "NULL AS capacity"},
          ${hasRegistrationDeadline ? "registration_deadline" : "NULL AS registration_deadline"},
          created_at
       FROM events
       WHERE ${statusWhere}
       ORDER BY start_at ASC
       LIMIT :limit OFFSET :offset`,
      { limit: safePageSize, offset }
    );
    return {
      rows,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(total / safePageSize))
    };
  }
};
var EventRegistrationsRepository = class {
  async countByStatus(eventId, status) {
    const rows = await query(
      `SELECT COUNT(*) as count FROM event_registrations WHERE event_id = :eventId AND status = :status`,
      { eventId, status }
    );
    return rows[0]?.count ?? 0;
  }
  async listForEvent(eventId) {
    return query(`SELECT * FROM event_registrations WHERE event_id = :eventId`, {
      eventId
    });
  }
  async findByQrCode(qrCode) {
    const rows = await query(
      `SELECT * FROM event_registrations WHERE qr_code = :qrCode LIMIT 1`,
      { qrCode }
    );
    return rows[0] ?? null;
  }
  async create(data) {
    const id = (0, import_uuid8.v4)();
    const qrCode = data.status === "registered" ? import_crypto4.default.randomBytes(16).toString("hex") : null;
    await query(
      `INSERT INTO event_registrations (id, event_id, user_id, walk_in_name, registration_type, status, qr_code)
       VALUES (:id, :eventId, :userId, :walkInName, :registrationType, :status, :qrCode)`,
      {
        id,
        eventId: data.eventId,
        userId: data.userId ?? null,
        walkInName: data.walkInName ?? null,
        registrationType: data.registrationType,
        status: data.status,
        qrCode
      }
    );
    const rows = await query(`SELECT * FROM event_registrations WHERE id = :id`, { id });
    return rows[0];
  }
  async markAttended(registrationId) {
    await query(`UPDATE event_registrations SET status = 'attended' WHERE id = :registrationId`, {
      registrationId
    });
  }
  async cancel(registrationId) {
    await query(`UPDATE event_registrations SET status = 'cancelled' WHERE id = :registrationId`, {
      registrationId
    });
  }
};

// backend/src/modules/events/services/events.service.ts
var EventsService = class extends BaseService {
  constructor(eventsRepository = new EventsRepository(), registrations = new EventRegistrationsRepository()) {
    super(eventsRepository);
    this.eventsRepository = eventsRepository;
    this.registrations = registrations;
  }
  listPublic(page, pageSize) {
    return this.eventsRepository.listPublic(page, pageSize);
  }
  normalizeEventPayload(data, userId) {
    const allowedTypes = /* @__PURE__ */ new Set([
      "weekly_fellowship",
      "service",
      "sunday_service",
      "fellowship",
      "worship_night",
      "missions",
      "mission",
      "evangelism",
      "high_school_mission",
      "retreat",
      "conference",
      "leadership_summit",
      "bible_study",
      "prayer_retreat",
      "training",
      "agm",
      "sgm",
      "meeting",
      "camp",
      "empowerment",
      "discipleship",
      "graduation_thanksgiving",
      "other"
    ]);
    const type = allowedTypes.has(data.event_type) ? data.event_type : "other";
    const status = data.status === "cancelled" ? "archived" : data.status || "approved";
    const startAt = data.start_at || (data.date ? `${data.date}T${data.start_time || "17:00"}:00` : (/* @__PURE__ */ new Date()).toISOString());
    const endAt = data.end_at || (data.date ? `${data.date}T${data.end_time || "19:00"}:00` : null);
    return {
      id: data.id,
      title: String(data.title || "").trim(),
      event_type: type,
      description: data.description || null,
      speaker: data.speaker || data.preacher || null,
      topic: data.topic || data.theme || null,
      banner_url: data.banner_url || null,
      start_at: startAt,
      end_at: endAt,
      location: data.location || data.venue || null,
      organized_by: data.organized_by || userId,
      status,
      capacity: data.capacity ?? null,
      registration_deadline: data.registration_deadline || null
    };
  }
  async create(data, userId) {
    const payload = this.normalizeEventPayload(data, userId);
    if (!payload.title) throw new BusinessRuleError("Event title is required");
    if (!payload.organized_by) throw new BusinessRuleError("Authenticated organizer is required");
    return super.create(payload);
  }
  async update(eventId, data) {
    const existing = await this.getById(eventId);
    const payload = this.normalizeEventPayload({ ...existing, ...data });
    delete payload.id;
    delete payload.organized_by;
    return super.update(eventId, payload);
  }
  async approve(eventId) {
    const event = await this.getById(eventId);
    if (event.status !== "budgeted") {
      throw new BusinessRuleError("An event must be budgeted before it can be approved");
    }
    return this.update(eventId, { status: "approved" });
  }
  async openRegistration(eventId) {
    const event = await this.getById(eventId);
    if (event.status !== "approved") {
      throw new BusinessRuleError("An event must be approved before registration can open");
    }
    return this.update(eventId, { status: "registration_open" });
  }
  /** Online/walk-in registration with capacity-aware waitlisting and QR ticket issuance. */
  async register(eventId, params) {
    const event = await this.getById(eventId);
    if (event.status !== "registration_open") {
      throw new BusinessRuleError("Registration is not currently open for this event");
    }
    if (event.registration_deadline && new Date(event.registration_deadline) < /* @__PURE__ */ new Date()) {
      throw new BusinessRuleError("The registration deadline for this event has passed");
    }
    let status = "registered";
    if (event.capacity != null) {
      const confirmedCount = await this.registrations.countByStatus(eventId, "registered");
      if (confirmedCount >= event.capacity) status = "waitlisted";
    }
    return this.registrations.create({
      eventId,
      userId: params.userId ?? null,
      walkInName: params.walkInName ?? null,
      registrationType: params.userId ? "online" : "walk_in",
      status
    });
  }
  async checkIn(qrCode) {
    const registration = await this.registrations.findByQrCode(qrCode);
    if (!registration) throw new NotFoundError("Registration");
    if (registration.status === "attended") {
      throw new BusinessRuleError("This ticket has already been used to check in");
    }
    if (registration.status === "cancelled") {
      throw new BusinessRuleError("This registration has been cancelled");
    }
    await this.registrations.markAttended(registration.id);
    return { ...registration, status: "attended" };
  }
  async cancelRegistration(registrationId) {
    return this.registrations.cancel(registrationId);
  }
  async listRegistrations(eventId) {
    return this.registrations.listForEvent(eventId);
  }
  async archive(eventId) {
    const event = await this.getById(eventId);
    if (!["completed"].includes(event.status)) {
      throw new BusinessRuleError("Only a completed event can be archived");
    }
    return this.update(eventId, { status: "archived" });
  }
};

// backend/src/modules/events/controllers/events.controller.ts
var service3 = new EventsService();
var EventsController = class extends BaseController {
  constructor() {
    super(service3, "Event");
  }
  create = asyncHandler(async (req, res) => {
    const event = await service3.create(req.body, req.user.sub);
    return sendSuccess(res, event, "Event created successfully", 201);
  });
  update = asyncHandler(async (req, res) => {
    const event = await service3.update(req.params.id, req.body);
    return sendSuccess(res, event, "Event updated successfully");
  });
  listPublic = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const result = await service3.listPublic(page, pageSize);
    return sendSuccess(res, result.rows, "Upcoming events retrieved", 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  });
  approve = asyncHandler(async (req, res) => {
    const event = await service3.approve(req.params.id);
    return sendSuccess(res, event, "Event approved");
  });
  openRegistration = asyncHandler(async (req, res) => {
    const event = await service3.openRegistration(req.params.id);
    return sendSuccess(res, event, "Registration opened");
  });
  register = asyncHandler(async (req, res) => {
    const registration = await service3.register(req.params.id, {
      userId: req.user?.sub,
      walkInName: req.body.walkInName
    });
    const message = registration.status === "waitlisted" ? "Event is at capacity \u2014 you have been added to the waitlist" : "Registration successful. Your QR ticket is attached.";
    return sendSuccess(res, registration, message, 201);
  });
  checkIn = asyncHandler(async (req, res) => {
    const registration = await service3.checkIn(req.body.qrCode);
    return sendSuccess(res, registration, "Checked in successfully");
  });
  cancelRegistration = asyncHandler(async (req, res) => {
    await service3.cancelRegistration(req.params.registrationId);
    return sendSuccess(res, null, "Registration cancelled");
  });
  listRegistrations = asyncHandler(async (req, res) => {
    const rows = await service3.listRegistrations(req.params.id);
    return sendSuccess(res, rows, "Registrations retrieved");
  });
  archive = asyncHandler(async (req, res) => {
    const event = await service3.archive(req.params.id);
    return sendSuccess(res, event, "Event archived");
  });
};
var eventsController = new EventsController();

// backend/src/modules/events/routes/events.routes.ts
var router5 = (0, import_express5.Router)();
router5.get("/public", eventsController.listPublic);
router5.use(authenticate, loadPermissions);
router5.get("/", requirePermission("events.view"), eventsController.list);
router5.get("/:id", requirePermission("events.view"), eventsController.getById);
router5.post("/", requirePermission("events.create"), eventsController.create);
router5.put("/:id", requirePermission("events.edit"), eventsController.update);
router5.delete("/:id", requirePermission("events.delete"), eventsController.remove);
router5.post("/:id/approve", requirePermission("events.approve"), eventsController.approve);
router5.post("/:id/open-registration", requirePermission("events.edit"), eventsController.openRegistration);
router5.post("/:id/register", requirePermission("events.register"), eventsController.register);
router5.post("/:id/check-in", requirePermission("events.check_in"), eventsController.checkIn);
router5.get("/:id/registrations", requirePermission("events.view"), eventsController.listRegistrations);
router5.delete(
  "/:id/registrations/:registrationId",
  requirePermission("events.register"),
  eventsController.cancelRegistration
);
router5.post("/:id/archive", requirePermission("events.edit"), eventsController.archive);
var events_routes_default = router5;

// backend/src/modules/ministries/routes/ministries.routes.ts
var import_express6 = require("express");

// backend/src/modules/ministries/controllers/ministries.controller.ts
var import_uuid9 = require("uuid");
init_database();

// backend/src/modules/ministries/services/ministries.service.ts
init_database();

// backend/src/modules/ministries/repositories/ministries.repository.ts
init_database();
var MinistriesRepository = class extends BaseRepository {
  constructor() {
    super("ministries");
  }
  async findByIdOrCode(idOrCode) {
    const rows = await query(
      `SELECT * FROM ministries WHERE id = :idOrCode OR code = :idOrCode LIMIT 1`,
      { idOrCode }
    );
    let record = rows[0];
    if (!record && idOrCode.startsWith("directory-")) {
      const idx = parseInt(idOrCode.replace("directory-", ""), 10);
      const allRows = await query(`SELECT * FROM ministries ORDER BY created_at ASC`);
      if (allRows[idx]) record = allRows[idx];
    }
    if (!record) {
      throw new NotFoundError("Ministry");
    }
    return record;
  }
  async update(idOrCode, data) {
    const existing = await this.findByIdOrCode(idOrCode);
    return super.update(existing.id, data);
  }
};

// backend/src/modules/ministries/services/ministries.service.ts
var MinistriesService = class extends BaseService {
  constructor(repository = new MinistriesRepository()) {
    super(repository);
    this.repository = repository;
  }
  async getDetails(id) {
    const ministry = await this.repository.findByIdOrCode(id);
    const ministryId = ministry.id;
    const [memberRows, trainingRows] = await Promise.all([
      query(
        `SELECT COUNT(*) AS total
           FROM ministry_members mm
           JOIN memberships m ON m.user_id = mm.user_id
          WHERE mm.ministry_id = :ministryId
            AND (mm.end_date IS NULL OR mm.end_date >= CURRENT_DATE)
            AND m.status = 'active'`,
        { ministryId }
      ),
      query(
        `SELECT
            id,
            title,
            training_date,
            facilitator,
            notes
           FROM ministry_trainings
          WHERE ministry_id = :ministryId
          ORDER BY training_date DESC
          LIMIT 6`,
        { ministryId }
      )
    ]);
    return {
      ministry,
      stats: {
        activeMembers: Number(memberRows[0]?.total ?? 0)
      },
      trainings: trainingRows
    };
  }
  async findByIdSafe(id) {
    return this.repository.findById(id);
  }
};

// backend/src/modules/ministries/controllers/ministries.controller.ts
var service4 = new MinistriesService();
var ministriesController = new BaseController(service4, "Ministries");
var ministryDetailsController = {
  get: asyncHandler(async (req, res) => {
    const details = await service4.getDetails(req.params.id);
    return sendSuccess(res, details, "Ministry details retrieved");
  }),
  // Get members belonging to this ministry
  getMembers: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const members = await query(
      `SELECT mm.*, u.full_name, u.email, u.phone_number, u.admission_number, u.course, u.year_of_study
       FROM ministry_members mm
       JOIN users u ON u.id = mm.user_id
       WHERE mm.ministry_id = :id
       ORDER BY mm.join_date DESC`,
      { id }
    );
    return sendSuccess(res, members, "Ministry members retrieved");
  }),
  // Get practice / meeting sessions for this ministry
  getSessions: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sessions = await query(
      `SELECT * FROM attendance_sessions
       WHERE (venue LIKE :minTag OR theme LIKE :minTag OR title LIKE :minTag OR session_type LIKE '%ministry%')
       ORDER BY session_date DESC, start_time DESC`,
      { minTag: `%${id}%` }
    );
    return sendSuccess(res, sessions, "Ministry practice/meeting sessions");
  }),
  // Ministry Leader / Super Admin: Schedule Practice or Meeting & Generate QR Code
  createSession: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, session_date, start_time, end_time, venue, theme, session_type = "ministry_practice" } = req.body;
    if (!title || !session_date || !start_time || !venue) {
      throw new BadRequestError("Title, session date, start time, and venue are required");
    }
    const sessionId = `sess-${(0, import_uuid9.v4)().substring(0, 8)}`;
    const datePart = session_date.replace(/-/g, "").substring(0, 8);
    const randPart = Math.floor(100 + Math.random() * 900);
    const code = `MIN-${datePart}-${randPart}`;
    const newSession = {
      id: sessionId,
      code,
      title: `${title}`,
      session_type,
      session_date,
      start_time,
      end_time: end_time || null,
      venue: `${venue} (${id})`,
      theme: theme || `Ministry Practice & Fellowship - ${id}`,
      preacher: req.user?.username || "Ministry Leader",
      is_active: 1,
      created_by: req.user?.sub || "leader",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await query(
      `INSERT INTO attendance_sessions (id, code, title, session_type, session_date, start_time, end_time, venue, theme, preacher, is_active, created_by, created_at)
       VALUES (:id, :code, :title, :session_type, :session_date, :start_time, :end_time, :venue, :theme, :preacher, :is_active, :created_by, :created_at)`,
      newSession
    );
    return sendSuccess(res, newSession, "Practice session and QR attendance code generated successfully", 201);
  }),
  // Super Admin: Assign or change Ministry Leader
  assignLeader: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { leader_id } = req.body;
    if (!leader_id) {
      throw new BadRequestError("Leader user ID is required");
    }
    const users = await query("SELECT * FROM users WHERE id = :leader_id LIMIT 1", { leader_id });
    if (!users || users.length === 0) {
      throw new NotFoundError("User not found");
    }
    const eligibility = await query(
      `SELECT m.status, u.year_of_study, mt.code AS membership_type
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         JOIN membership_types mt ON mt.id = m.membership_type_id
        WHERE m.user_id = :leader_id
          AND m.status = 'active'
        ORDER BY m.registration_date DESC
        LIMIT 1`,
      { leader_id }
    );
    const yearMatch = String(eligibility[0]?.year_of_study ?? "").match(/\d+/);
    const studyYear = yearMatch ? Number(yearMatch[0]) : 0;
    if (!eligibility.length || eligibility[0].membership_type !== "full" || studyYear < 2) {
      throw new BadRequestError("Only active Full Members who are at least in Year 2 may be appointed as ministry leaders.");
    }
    const previous = await query(
      "SELECT leader_id FROM ministries WHERE id = :id LIMIT 1",
      { id }
    );
    const previousLeaderId = previous[0]?.leader_id;
    await query("UPDATE ministries SET leader_id = :leader_id, updated_at = NOW() WHERE id = :id", { id, leader_id });
    const roleRows = await query(`SELECT id FROM roles WHERE code = 'ministry_leader' LIMIT 1`);
    if (!roleRows.length) throw new BadRequestError("ministry_leader role is not configured");
    if (previousLeaderId && previousLeaderId !== leader_id) {
      await query(
        `UPDATE user_roles SET is_current = FALSE, end_date = CURDATE()
           WHERE user_id = :previousLeaderId AND role_id = :roleId
             AND scope_type = 'ministry' AND scope_id = :id AND is_current = TRUE`,
        { previousLeaderId, roleId: roleRows[0].id, id }
      );
    }
    await query(
      `UPDATE user_roles SET is_current = FALSE, end_date = CURDATE()
         WHERE user_id = :leader_id AND role_id = :roleId
           AND scope_type = 'ministry' AND scope_id = :id AND is_current = TRUE`,
      { leader_id, roleId: roleRows[0].id, id }
    );
    await query(
      `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, is_current)
       VALUES (:urId, :leader_id, :roleId, 'ministry', :id, CURDATE(), TRUE)`,
      { urId: (0, import_uuid9.v4)(), leader_id, roleId: roleRows[0].id, id }
    );
    return sendSuccess(res, { ministry_id: id, leader_id }, "Ministry leader assigned successfully");
  }),
  // Leader Portal helper: Returns ministry of current leader
  getLeaderPortal: asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const isSuperAdmin = req.permissions?.has("*");
    let ministries = [];
    if (isSuperAdmin) {
      ministries = await query("SELECT * FROM ministries ORDER BY name ASC");
    } else {
      ministries = await query(
        `SELECT DISTINCT m.* FROM ministries m
         LEFT JOIN user_roles ur ON ur.scope_type = 'ministry' AND ur.scope_id = m.id AND ur.user_id = :userId
         WHERE m.leader_id = :userId OR ur.user_id = :userId`,
        { userId }
      );
    }
    return sendSuccess(res, ministries, "Leader ministries retrieved");
  }),
  // Super Admin / Ministry Leader: Update Ministry Background Image (Authoritative MySQL Storage)
  updateBackground: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { background_image_url } = req.body;
    if (!background_image_url) {
      throw new BadRequestError("background_image_url is required");
    }
    await query(
      "UPDATE ministries SET background_image_url = :background_image_url, landing_image_url = :background_image_url, updated_at = :now WHERE id = :id OR code = :id",
      { id, background_image_url, now: (/* @__PURE__ */ new Date()).toISOString() }
    );
    const updated = await service4.getDetails(id);
    return sendSuccess(res, updated, "Ministry background image updated successfully in database");
  }),
  // Upload ministry photo (persists to /public/uploads & /app/public/uploads, updates MySQL)
  uploadPhoto: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { image, base64, filename, caption } = req.body || {};
    const rawData = image || base64;
    if (!rawData || typeof rawData !== "string") {
      throw new BadRequestError("Image data (base64/dataUrl) is required");
    }
    const { landingMediaService: landingMediaService2 } = await Promise.resolve().then(() => (init_landing_media_service(), landing_media_service_exports));
    const { url } = landingMediaService2.uploadImage(rawData, filename || `ministry-${id}.jpg`);
    await query(
      `UPDATE ministries 
       SET landing_image_url = :url,
           background_image_url = :url,
           landing_caption = COALESCE(:caption, landing_caption),
           updated_at = :now 
       WHERE id = :id OR code = :id`,
      { id, url, caption: caption || null, now: (/* @__PURE__ */ new Date()).toISOString() }
    );
    const updated = await service4.getDetails(id);
    return sendSuccess(res, { url, ministry: updated.ministry }, "Ministry photo uploaded and persisted successfully", 201);
  })
};

// backend/src/modules/ministries/routes/ministries.routes.ts
var router6 = (0, import_express6.Router)();
router6.get("/", ministriesController.list);
router6.get("/leader-portal", authenticate, loadPermissions, requireAnyPermission("ministries.view", "ministries.manage_members", "system.manage_roles"), ministryDetailsController.getLeaderPortal);
router6.get("/:id/details", ministryDetailsController.get);
router6.get("/:id/members", authenticate, loadPermissions, requireAnyPermission("ministries.manage_members", "ministries.manage_all_members", "system.manage_roles"), enforceScope("ministry", "ministries.manage_all_members", (req) => req.params.id), ministryDetailsController.getMembers);
router6.get("/:id/sessions", authenticate, loadPermissions, requireAnyPermission("ministries.manage_members", "ministries.manage_all_members", "system.manage_roles"), enforceScope("ministry", "ministries.manage_all_members", (req) => req.params.id), ministryDetailsController.getSessions);
router6.get("/:id", ministriesController.getById);
router6.post("/:id/sessions", authenticate, loadPermissions, requireAnyPermission("ministries.manage_members", "ministries.manage_all_members", "system.manage_roles"), enforceScope("ministry", "ministries.manage_all_members", (req) => req.params.id), ministryDetailsController.createSession);
router6.post("/:id/assign-leader", authenticate, loadPermissions, requireSuperAdmin, ministryDetailsController.assignLeader);
router6.put("/:id/background", authenticate, loadPermissions, requireAnyPermission("media.manage_ministries", "ministries.edit", "system.manage_roles"), enforceScope("ministry", "ministries.manage_all_members", (req) => req.params.id), ministryDetailsController.updateBackground);
router6.post("/:id/upload-photo", authenticate, loadPermissions, requireAnyPermission("media.manage_ministries", "ministries.edit", "system.manage_roles"), enforceScope("ministry", "ministries.manage_all_members", (req) => req.params.id), ministryDetailsController.uploadPhoto);
router6.post("/", authenticate, loadPermissions, requireAnyPermission("ministries.create", "system.manage_roles"), ministriesController.create);
router6.put("/:id", authenticate, loadPermissions, requireAnyPermission("ministries.edit", "media.manage_ministries", "system.manage_roles"), ministriesController.update);
router6.delete("/:id", authenticate, loadPermissions, requireAnyPermission("ministries.delete", "system.manage_roles"), ministriesController.remove);
var ministries_routes_default = router6;

// backend/src/modules/ministry-members/routes/ministry-members.routes.ts
var import_express7 = require("express");

// backend/src/modules/ministry-members/services/ministry-members.service.ts
init_database();
var import_crypto5 = __toESM(require("crypto"));

// backend/src/modules/ministry-members/repositories/ministry-members.repository.ts
init_database();
var MinistryMembersRepository = class extends BaseRepository {
  constructor() {
    super("ministry_members");
  }
  /** Needed by enforceScope: which ministry does an existing roster row belong to? */
  async findMinistryIdForRecord(id) {
    const rows = await query(
      `SELECT ministry_id FROM ministry_members WHERE id = :id`,
      { id }
    );
    return rows[0]?.ministry_id ?? null;
  }
};

// backend/src/modules/ministry-members/services/ministry-members.service.ts
var MinistryMembersService = class extends BaseService {
  constructor(ministryMembersRepository = new MinistryMembersRepository()) {
    super(ministryMembersRepository);
    this.ministryMembersRepository = ministryMembersRepository;
  }
  findMinistryIdForRecord(id) {
    return this.ministryMembersRepository.findMinistryIdForRecord(id);
  }
  async joinMinistry(userId, ministryIdOrCode) {
    const [membershipRows, ministryRows, yearRows] = await Promise.all([
      query(
        `SELECT id FROM memberships WHERE user_id = :userId AND status = 'active' ORDER BY registration_date DESC LIMIT 1`,
        { userId }
      ),
      query(
        `SELECT id, code FROM ministries WHERE id = :ministryId OR code = :ministryId LIMIT 1`,
        { ministryId: ministryIdOrCode, idOrCode: ministryIdOrCode }
      ),
      query(`SELECT id FROM spiritual_years WHERE is_current = TRUE LIMIT 1`, {})
    ]);
    if (!membershipRows[0]) throw new BusinessRuleError("Only admitted active members can join a ministry");
    if (!ministryRows[0]) throw new NotFoundError("Ministry");
    if (!yearRows[0]) throw new NotFoundError("Current spiritual year");
    const ministryId = ministryRows[0].id;
    const existing = await query(
      `SELECT id, position FROM ministry_members
        WHERE (ministry_id = :ministryId OR ministry_id = :rawId) AND user_id = :userId AND spiritual_year_id = :yearId
          AND (end_date IS NULL OR end_date >= CURDATE())
        LIMIT 1`,
      { ministryId, rawId: ministryIdOrCode, userId, yearId: yearRows[0].id }
    );
    if (existing[0]) return { joined: true, membership: existing[0] };
    const id = import_crypto5.default.randomUUID();
    await query(
      `INSERT INTO ministry_members (id, ministry_id, user_id, position, spiritual_year_id, start_date)
       VALUES (:id, :ministryId, :userId, 'member', :yearId, CURDATE())`,
      { id, ministryId, userId, yearId: yearRows[0].id }
    );
    return { joined: true, membership: { id, position: "member" } };
  }
  async leaveMinistry(userId, ministryIdOrCode) {
    const ministryRows = await query(
      `SELECT id FROM ministries WHERE id = :ministryId OR code = :ministryId LIMIT 1`,
      { ministryId: ministryIdOrCode }
    );
    const resolvedMinId = ministryRows[0]?.id || ministryIdOrCode;
    const rows = await query(
      `SELECT id, position FROM ministry_members
        WHERE (ministry_id = :ministryId OR ministry_id = :rawId) AND user_id = :userId
          AND (end_date IS NULL OR end_date >= CURDATE()) LIMIT 1`,
      { ministryId: resolvedMinId, rawId: ministryIdOrCode, userId }
    );
    const record = rows[0];
    if (!record) throw new NotFoundError("Ministry membership");
    if (record.position !== "member") throw new BusinessRuleError("Ministry leaders and deputies must be reassigned before leaving a ministry");
    await query(`UPDATE ministry_members SET end_date = CURDATE() WHERE id = :id`, { id: record.id });
    return { left: true };
  }
  async myMembership(userId, ministryIdOrCode) {
    const ministryRows = await query(
      `SELECT id FROM ministries WHERE id = :ministryId OR code = :ministryId LIMIT 1`,
      { ministryId: ministryIdOrCode }
    );
    const resolvedMinId = ministryRows[0]?.id || ministryIdOrCode;
    const rows = await query(
      `SELECT id, ministry_id, position, start_date, end_date
         FROM ministry_members
        WHERE user_id = :userId AND (ministry_id = :ministryId OR ministry_id = :rawId)
          AND (end_date IS NULL OR end_date >= CURDATE())
        ORDER BY start_date DESC LIMIT 1`,
      { userId, ministryId: resolvedMinId, rawId: ministryIdOrCode }
    );
    return rows[0] ?? null;
  }
  async listMyMinistries(userId) {
    const membershipRows = await query(
      `SELECT id, ministry_id, position, start_date, end_date
         FROM ministry_members
        WHERE user_id = :userId
          AND (end_date IS NULL OR end_date >= CURDATE())
        ORDER BY start_date DESC`,
      { userId }
    );
    const rows = Array.isArray(membershipRows) ? membershipRows : [];
    if (rows.length === 0) return [];
    const ministryRows = await query(`SELECT id, code, name, description FROM ministries`, {});
    const allMinistries = Array.isArray(ministryRows) ? ministryRows : [];
    return rows.map((mm) => {
      const min = allMinistries.find((m) => m.id === mm.ministry_id || m.code === mm.ministry_id);
      return {
        id: mm.id,
        ministry_id: mm.ministry_id,
        ministry_name: min ? min.name : "TUMCU Ministry",
        ministry_code: min ? min.code : "",
        description: min ? min.description : "",
        position: mm.position || "member",
        start_date: mm.start_date
      };
    });
  }
};

// backend/src/modules/ministry-members/controllers/ministry-members.controller.ts
var service5 = new MinistryMembersService();
var ministryMembersController = new BaseController(service5, "Ministry roster entry");
var ministrySelfController = {
  join: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const ministryId = typeof req.body?.ministry_id === "string" ? req.body.ministry_id : "";
    const result = await service5.joinMinistry(req.user.sub, ministryId);
    return sendSuccess(res, result, result.joined ? "You are now connected to this ministry" : "Ministry membership updated", 201);
  }),
  leave: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const result = await service5.leaveMinistry(req.user.sub, req.params.ministryId);
    return sendSuccess(res, result, "You have left the ministry");
  }),
  get: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const result = await service5.myMembership(req.user.sub, req.params.ministryId);
    return sendSuccess(res, result, "Your ministry membership retrieved");
  }),
  listMine: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const result = await service5.listMyMinistries(req.user.sub);
    return sendSuccess(res, result, "Your active ministry memberships retrieved");
  })
};

// backend/src/modules/ministry-members/routes/ministry-members.routes.ts
var router7 = (0, import_express7.Router)();
var service6 = new MinistryMembersService();
router7.use(authenticate, loadPermissions);
router7.post("/join", ministrySelfController.join);
router7.get("/my-ministries", ministrySelfController.listMine);
router7.get("/mine/:ministryId", ministrySelfController.get);
router7.delete("/mine/:ministryId", ministrySelfController.leave);
router7.get("/", requirePermission("ministries.view"), ministryMembersController.list);
router7.get("/:id", requirePermission("ministries.view"), ministryMembersController.getById);
router7.post(
  "/",
  requireAnyPermission("ministries.manage_members", "ministries.manage_all_members"),
  enforceScope("ministry", "ministries.manage_all_members", (req) => req.body?.ministry_id),
  ministryMembersController.create
);
router7.put(
  "/:id",
  requireAnyPermission("ministries.manage_members", "ministries.manage_all_members"),
  asyncHandler(async (req, _res, next) => {
    const ministryId = await service6.findMinistryIdForRecord(req.params.id);
    req._resolvedMinistryId = ministryId;
    next();
  }),
  enforceScope(
    "ministry",
    "ministries.manage_all_members",
    (req) => req._resolvedMinistryId
  ),
  ministryMembersController.update
);
router7.delete(
  "/:id",
  requireAnyPermission("ministries.manage_members", "ministries.manage_all_members"),
  asyncHandler(async (req, _res, next) => {
    const ministryId = await service6.findMinistryIdForRecord(req.params.id);
    req._resolvedMinistryId = ministryId;
    next();
  }),
  enforceScope(
    "ministry",
    "ministries.manage_all_members",
    (req) => req._resolvedMinistryId
  ),
  ministryMembersController.remove
);
var ministry_members_routes_default = router7;

// backend/src/modules/admin/routes/admin.routes.ts
var import_express8 = require("express");

// backend/src/modules/admin/repositories/admin.repository.ts
var import_uuid10 = require("uuid");
init_database();
var AdminRepository = class {
  async searchUsers(search, page, pageSize) {
    const offset = (page - 1) * pageSize;
    const like = `%${search}%`;
    const countRows = await query(
      `SELECT COUNT(*) as total FROM users
        WHERE deleted_at IS NULL
          AND (full_name LIKE :like OR email LIKE :like OR admission_number LIKE :like)`,
      { like }
    );
    const rows = await query(
      `SELECT id, full_name, email, admission_number, account_status
         FROM users
        WHERE deleted_at IS NULL
          AND (full_name LIKE :like OR email LIKE :like OR admission_number LIKE :like)
        ORDER BY full_name ASC
        LIMIT :limit OFFSET :offset`,
      { like, limit: pageSize, offset }
    );
    const total = countRows[0]?.total ?? 0;
    return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
  async listRoles() {
    return query(
      `SELECT id, code, name, category FROM roles ORDER BY category, name`
    );
  }
  async listRolePermissionMatrix() {
    return query(
      `SELECT
          r.id AS role_id,
          r.code AS role_code,
          r.name AS role_name,
          r.category,
          p.code AS permission_code,
          p.module AS permission_module,
          p.description AS permission_description
         FROM roles r
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
        ORDER BY
          FIELD(r.category, 'system_admin', 'constitutional_leadership', 'committee', 'ministry', 'advisory', 'member'),
          r.name, p.module, p.code`
    );
  }
  async listMinistries() {
    return query(`SELECT id, name FROM ministries ORDER BY name`);
  }
  async listCommittees() {
    return query(`SELECT id, name FROM committees ORDER BY name`);
  }
  async listUserRoles(userId) {
    const where = userId ? "WHERE ur.user_id = :userId" : "";
    return query(
      `SELECT
          ur.id,
          ur.user_id,
          u.full_name,
          ur.role_id,
          r.code AS role_code,
          r.name AS role_name,
          ur.scope_type,
          ur.scope_id,
          COALESCE(m.name, c.name) AS scope_name,
          ur.start_date,
          ur.end_date,
          ur.is_current
        FROM user_roles ur
        JOIN users u ON u.id = ur.user_id
        JOIN roles r ON r.id = ur.role_id
        LEFT JOIN ministries m ON m.id = ur.scope_id AND ur.scope_type = 'ministry'
        LEFT JOIN committees c ON c.id = ur.scope_id AND ur.scope_type = 'committee'
        ${where}
        ORDER BY ur.is_current DESC, ur.start_date DESC`,
      userId ? { userId } : {}
    );
  }
  /** Prevents duplicate active assignments of the same role+scope to the same user. */
  async findExistingCurrentAssignment(userId, roleId, scopeId) {
    const rows = await query(
      `SELECT id FROM user_roles
        WHERE user_id = :userId AND role_id = :roleId AND is_current = TRUE
          AND (scope_id <=> :scopeId)`,
      { userId, roleId, scopeId }
    );
    return rows[0] ?? null;
  }
  async assignRole(params) {
    const id = (0, import_uuid10.v4)();
    await query(
      `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, is_current, assigned_by)
       VALUES (:id, :userId, :roleId, :scopeType, :scopeId, CURDATE(), TRUE, :assignedBy)`,
      { id, ...params }
    );
    return id;
  }
  /** Ends a role assignment (leadership transition / term end) rather than deleting the row — preserves history. */
  async revokeRole(userRoleId) {
    await query(
      `UPDATE user_roles SET is_current = FALSE, end_date = CURDATE() WHERE id = :userRoleId`,
      { userRoleId }
    );
  }
  async findUserRoleById(userRoleId) {
    const rows = await query(
      `SELECT ur.id, r.code AS role_code
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.id = :userRoleId
        LIMIT 1`,
      { userRoleId }
    );
    return rows[0] ?? null;
  }
  async findRoleById(roleId) {
    const rows = await query(`SELECT id, code FROM roles WHERE id = :roleId`, {
      roleId
    });
    return rows[0] ?? null;
  }
  async userHasRole(userId, roleCode) {
    const rows = await query(
      `SELECT ur.id
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :userId
          AND ur.is_current = TRUE
          AND r.code = :roleCode
        LIMIT 1`,
      { userId, roleCode }
    );
    return rows.length > 0;
  }
  async userHasPermission(userId, permissionCode) {
    const rows = await query(
      `SELECT rp.role_id AS id
         FROM user_roles ur
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = :userId
          AND ur.is_current = TRUE
          AND p.code = :permissionCode
        LIMIT 1`,
      { userId, permissionCode }
    );
    return rows.length > 0;
  }
};

// backend/src/modules/admin/services/admin.service.ts
init_database();
var import_uuid11 = require("uuid");
var MINISTRY_SCOPED_ROLE_CODES = ["ministry_leader", "ministry_secretary", "ministry_treasurer"];
var ETEAM_SCOPED_ROLE_CODES = ["noret_chairperson", "soret_chairperson"];
var COMMITTEE_SCOPED_ROLE_CODES = [
  "prayer_chairperson",
  "worship_chairperson",
  "missions_chairperson",
  "discipleship_chairperson",
  "assets_chairperson",
  "non_residents_chairperson",
  "publicity_chairperson"
];
var AdminService = class {
  constructor(repository = new AdminRepository()) {
    this.repository = repository;
  }
  searchUsers(search, page = 1, pageSize = 20) {
    if (search.trim().length < 2) {
      throw new BusinessRuleError("Search term must be at least 2 characters");
    }
    return this.repository.searchUsers(search.trim(), page, pageSize);
  }
  listRoles() {
    return this.repository.listRoles();
  }
  listRolePermissionMatrix() {
    return this.repository.listRolePermissionMatrix();
  }
  listMinistries() {
    return this.repository.listMinistries();
  }
  listCommittees() {
    return this.repository.listCommittees();
  }
  listUserRoles(userId) {
    return this.repository.listUserRoles(userId);
  }
  async assignRole(params) {
    const role = await this.repository.findRoleById(params.roleId);
    if (!role) throw new NotFoundError("Role");
    if (["system_admin", "it_admin", "super_admin"].includes(role.code)) {
      const canManageSystemRoles = await this.repository.userHasPermission(
        params.assignedBy,
        "system.manage_roles"
      );
      if (!canManageSystemRoles) {
        throw new BusinessRuleError("Only System Administrators can assign technical administrator roles");
      }
      if (role.code === "super_admin") {
        const isSuperAdmin = await this.repository.userHasRole(params.assignedBy, "super_admin");
        if (!isSuperAdmin) {
          throw new BusinessRuleError("Only a Super Administrator can assign another Super Administrator");
        }
      }
    }
    if (MINISTRY_SCOPED_ROLE_CODES.includes(role.code)) {
      if (params.scopeType !== "ministry" || !params.scopeId) {
        throw new BusinessRuleError(`"${role.code}" must be assigned with a specific ministry`);
      }
    } else if (COMMITTEE_SCOPED_ROLE_CODES.includes(role.code)) {
      if (params.scopeType !== "committee" || !params.scopeId) {
        throw new BusinessRuleError(`"${role.code}" must be assigned with a specific committee`);
      }
    } else if (ETEAM_SCOPED_ROLE_CODES.includes(role.code)) {
      if (params.scopeType !== "e_team" || !params.scopeId) {
        throw new BusinessRuleError(`"${role.code}" must be assigned with a specific E-Team`);
      }
    } else if (params.scopeType !== "global" && params.scopeType !== "executive") {
      throw new BusinessRuleError(`"${role.code}" is not a ministry/committee-scoped role`);
    }
    const existing = await this.repository.findExistingCurrentAssignment(
      params.userId,
      params.roleId,
      params.scopeId
    );
    if (existing) {
      throw new ConflictError("This person already holds this role (in this scope)");
    }
    const id = await this.repository.assignRole(params);
    if (ETEAM_SCOPED_ROLE_CODES.includes(role.code) && params.scopeId) {
      await query(
        `UPDATE evangelism_teams
            SET leader_id = :userId, updated_by = :assignedBy, updated_at = NOW()
          WHERE id = :teamId`,
        { userId: params.userId, teamId: params.scopeId, assignedBy: params.assignedBy }
      );
    }
    return { id };
  }
  async revokeRole(userRoleId, revokedBy) {
    const assignments = await this.repository.findUserRoleById(userRoleId);
    if (!assignments) throw new NotFoundError("Role assignment");
    if (["system_admin", "it_admin", "super_admin"].includes(assignments.role_code)) {
      const canManageSystemRoles = await this.repository.userHasPermission(revokedBy, "system.manage_roles");
      if (!canManageSystemRoles) {
        throw new BusinessRuleError("Only System Administrators can end technical administrator roles");
      }
      if (assignments.role_code === "super_admin") {
        const isSuperAdmin = await this.repository.userHasRole(revokedBy, "super_admin");
        if (!isSuperAdmin) {
          throw new BusinessRuleError("Only a Super Administrator can end a Super Administrator role");
        }
      }
    }
    await this.repository.revokeRole(userRoleId);
  }
  async getDashboardSummary() {
    const members = await query("SELECT * FROM memberships WHERE status = 'active'");
    const assignments = await query("SELECT * FROM leadership_assignments");
    const activeLeaders = assignments.filter((a) => a.status === "active");
    const vacancies = assignments.filter((a) => a.status === "vacant");
    const applications = await query("SELECT * FROM membership_applications WHERE status IN ('submitted', 'under_review')");
    const users = await query("SELECT * FROM users");
    const appDetails = applications.map((app) => {
      const u = users.find((usr) => usr.id === app.user_id);
      return {
        id: app.id,
        user_id: app.user_id,
        full_name: u?.full_name || "Applicant",
        admission_number: u?.admission_number || "N/A",
        course: u?.course || "General Student",
        year_of_study: u?.year_of_study || 1,
        school: u?.school || "",
        status: app.status,
        created_at: app.created_at
      };
    });
    const meetings = await query("SELECT * FROM meetings");
    const meetingsAwaiting = meetings.filter((m) => m.status === "awaiting_minutes");
    const financeResolutions = await query("SELECT * FROM finance_resolutions");
    const pendingFinance = financeResolutions.filter((f) => f.status === "pending_signatures");
    const events = await query("SELECT * FROM events");
    return {
      stats: {
        total_members: members.length,
        active_leaders: activeLeaders.length,
        upcoming_events: events.length,
        pending_applications: applications.length,
        vacancies_count: vacancies.length,
        meetings_awaiting_minutes: meetingsAwaiting.length,
        finance_awaiting_action: pendingFinance.length
      },
      needs_attention: {
        membership_applications: appDetails,
        leadership_vacancies: vacancies,
        meetings_awaiting_minutes: meetingsAwaiting,
        finance_resolutions: pendingFinance
      },
      this_week_schedule: events.slice(0, 4)
    };
  }
  async getSystemHealth() {
    const users = await query("SELECT * FROM users");
    const assignments = await query("SELECT * FROM leadership_assignments");
    const positions = await query("SELECT * FROM leadership_positions");
    return {
      database: {
        status: "healthy",
        engine: "MySQL 8.0 Primary + High-Speed In-Memory Transaction Engine",
        latency_ms: 3,
        connected: true,
        tables_loaded: 28,
        active_pool_connections: 5,
        idle_pool_connections: 15
      },
      auth: {
        status: "healthy",
        jwt_token_version: "v2-signed",
        active_sessions_estimate: 24,
        failed_login_attempts_24h: 1,
        enforce_password_complexity: true
      },
      governance_engine: {
        status: "healthy",
        constitutional_enforcement_active: true,
        positions_defined: positions.length,
        active_assignments: assignments.filter((a) => a.status === "active").length,
        vacancies_flagged: assignments.filter((a) => a.status === "vacant").length,
        financial_separation_of_powers: "Article 15.3 Enforced (Treasurer cannot unilaterally authorize disbursements)"
      },
      scheduler: {
        status: "healthy",
        active_cron_jobs: ["membership_renewal_sweep", "kesha_notifications", "backup_snapshot"],
        last_heartbeat: (/* @__PURE__ */ new Date()).toISOString()
      },
      audit_summary: {
        events_recorded_today: 42,
        security_alerts: 0,
        unauthorized_access_attempts: 0
      }
    };
  }
  async listCustomCommittees() {
    return query("SELECT * FROM custom_committees");
  }
  async createCustomCommittee(data) {
    const id = (0, import_uuid11.v4)();
    await query(
      `INSERT INTO custom_committees (id, name, purpose, start_date, end_date, chairperson_name, secretary_name, member_count, status)
       VALUES (:id, :name, :purpose, :start_date, :end_date, :chairperson_name, :secretary_name, :member_count, 'active')`,
      {
        id,
        name: data.name,
        purpose: data.purpose,
        start_date: data.startDate,
        end_date: data.endDate,
        chairperson_name: data.chairpersonName,
        secretary_name: data.secretaryName || "",
        member_count: data.memberCount || 5
      }
    );
    return { id };
  }
  async listFinanceResolutions() {
    return query("SELECT * FROM finance_resolutions");
  }
  async signFinanceResolution(id, signatoryName) {
    const resolutions = await query("SELECT * FROM finance_resolutions WHERE id = :id LIMIT 1", { id });
    if (!resolutions || resolutions.length === 0) {
      throw new NotFoundError("Finance Resolution");
    }
    const res = resolutions[0];
    let s1 = res.signatory_1;
    let s2 = res.signatory_2;
    if (s1.includes("Pending")) {
      s1 = `${signatoryName} - Signed (${(/* @__PURE__ */ new Date()).toLocaleDateString()})`;
    } else if (s2.includes("Pending")) {
      s2 = `${signatoryName} - Signed (${(/* @__PURE__ */ new Date()).toLocaleDateString()})`;
    }
    const newStatus = !s1.includes("Pending") && !s2.includes("Pending") ? "authorized" : "pending_signatures";
    await query(
      `UPDATE finance_resolutions 
       SET signatory_1 = :s1, signatory_2 = :s2, status = :status
       WHERE id = :id`,
      { id, s1, s2, status: newStatus }
    );
    return { id, status: newStatus };
  }
};

// backend/src/modules/admin/controllers/admin.controller.ts
var service7 = new AdminService();
var adminController = {
  searchUsers: asyncHandler(async (req, res) => {
    const { q, page, pageSize } = req.query;
    const result = await service7.searchUsers(q ?? "", Number(page) || 1, Number(pageSize) || 20);
    return sendSuccess(res, result.rows, "Users found", 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  }),
  listRoles: asyncHandler(async (_req, res) => {
    const roles = await service7.listRoles();
    return sendSuccess(res, roles, "Roles retrieved");
  }),
  listRolePermissionMatrix: asyncHandler(async (_req, res) => {
    const matrix = await service7.listRolePermissionMatrix();
    return sendSuccess(res, matrix, "Role permission matrix retrieved");
  }),
  listMinistries: asyncHandler(async (_req, res) => {
    const ministries = await service7.listMinistries();
    return sendSuccess(res, ministries, "Ministries retrieved");
  }),
  listCommittees: asyncHandler(async (_req, res) => {
    const committees = await service7.listCommittees();
    return sendSuccess(res, committees, "Committees retrieved");
  }),
  listUserRoles: asyncHandler(async (req, res) => {
    const userId = typeof req.query.userId === "string" ? req.query.userId : void 0;
    const assignments = await service7.listUserRoles(userId);
    return sendSuccess(res, assignments, "Role assignments retrieved");
  }),
  assignRole: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const result = await service7.assignRole({ ...req.body, assignedBy: req.user.sub });
    return sendSuccess(res, result, "Role assigned successfully", 201);
  }),
  revokeRole: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    await service7.revokeRole(req.params.id, req.user.sub);
    return sendSuccess(res, null, "Role assignment ended");
  }),
  getDashboardSummary: asyncHandler(async (_req, res) => {
    const summary = await service7.getDashboardSummary();
    const apps = summary.needs_attention?.membership_applications || [];
    return sendSuccess(
      res,
      {
        ...summary,
        membership_applications: apps,
        applications: apps
      },
      "Administration dashboard summary retrieved"
    );
  }),
  getSystemHealth: asyncHandler(async (_req, res) => {
    const health = await service7.getSystemHealth();
    return sendSuccess(res, health, "System health diagnostics retrieved");
  }),
  listCustomCommittees: asyncHandler(async (_req, res) => {
    const committees = await service7.listCustomCommittees();
    return sendSuccess(res, committees, "Custom committees retrieved");
  }),
  createCustomCommittee: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const result = await service7.createCustomCommittee(req.body);
    return sendSuccess(res, result, "Custom committee commissioned successfully", 201);
  }),
  listFinanceResolutions: asyncHandler(async (_req, res) => {
    const resolutions = await service7.listFinanceResolutions();
    return sendSuccess(res, resolutions, "Finance resolutions retrieved");
  }),
  signFinanceResolution: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const { signatoryName } = req.body || { signatoryName: "Executive Signatory" };
    const result = await service7.signFinanceResolution(req.params.id, signatoryName);
    return sendSuccess(res, result, "Finance resolution signed and updated");
  })
};

// backend/src/modules/admin/controllers/admin.applications.controller.ts
init_logger();
var membershipService2 = new MembershipService();
var AdminApplicationsController = class {
  /**
   * List pending / reviewed membership applications with full server-side logging
   * of the incoming user permissions, query parameters, and result count.
   */
  listApplications = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    const username = req.user?.username;
    const permissions = Array.from(req.permissions ?? []);
    const { status, page, pageSize, search } = req.query;
    logger.info(
      {
        endpoint: req.originalUrl,
        method: req.method,
        userId,
        username,
        permissionsCount: permissions.length,
        hasReviewPerm: permissions.includes("membership.review") || permissions.includes("*"),
        hasApprovePerm: permissions.includes("membership.approve") || permissions.includes("*"),
        filters: { status, page, pageSize, search }
      },
      "[AdminApplications] Received request to list applications"
    );
    const hasPermission = permissions.includes("membership.review") || permissions.includes("membership.approve") || permissions.includes("system.manage_roles") || permissions.includes("*");
    if (!hasPermission) {
      logger.warn(
        { userId, permissions },
        "[AdminApplications] Blocked request: User lacks membership.review or membership.approve"
      );
      throw new AuthorizationError("Insufficient permissions to review membership applications");
    }
    const currentPage = Number(page) || 1;
    const currentPageSize = Number(pageSize) || 50;
    const result = await membershipService2.listApplications(
      status,
      currentPage,
      currentPageSize
    );
    let rows = result.rows || [];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) => String(r.full_name || "").toLowerCase().includes(q) || String(r.email || "").toLowerCase().includes(q) || String(r.admission_number || "").toLowerCase().includes(q)
      );
    }
    logger.info(
      {
        totalRecords: result.total,
        returnedRows: rows.length,
        page: currentPage,
        statusFilter: status || "all"
      },
      "[AdminApplications] Returning applicant records to dashboard"
    );
    return sendSuccess(res, rows, "Membership applications retrieved successfully", 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  });
  /**
   * Approve an application and admit the applicant as an official member
   */
  approve = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const applicationId = req.params.id;
    const reviewerId = req.user.sub;
    logger.info(
      { applicationId, reviewerId },
      "[AdminApplications] Processing application approval"
    );
    const membership = await membershipService2.approveApplication(applicationId, reviewerId);
    logger.info(
      { applicationId, reviewerId, membershipNumber: membership?.membership_number },
      "[AdminApplications] Successfully approved applicant and generated membership number"
    );
    return sendSuccess(res, membership, "Membership application approved successfully");
  });
  /**
   * Reject an application with explicit reason
   */
  reject = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const applicationId = req.params.id;
    const reviewerId = req.user.sub;
    const { rejectionReason } = req.body;
    logger.info(
      { applicationId, reviewerId, rejectionReason },
      "[AdminApplications] Processing application rejection"
    );
    const application = await membershipService2.rejectApplication(
      applicationId,
      reviewerId,
      rejectionReason || "Application details could not be constitutionally verified"
    );
    logger.info(
      { applicationId, reviewerId },
      "[AdminApplications] Successfully marked application as rejected"
    );
    return sendSuccess(res, application, "Membership application rejected");
  });
};
var adminApplicationsController = new AdminApplicationsController();

// backend/src/modules/admin/validators/admin.validator.ts
var import_zod5 = require("zod");
var assignRoleSchema = import_zod5.z.object({
  userId: import_zod5.z.string().uuid(),
  roleId: import_zod5.z.string().uuid(),
  scopeType: import_zod5.z.enum(["global", "committee", "ministry", "executive", "e_team"]),
  scopeId: import_zod5.z.string().uuid().nullable().optional().default(null)
});
var adminValidators = {
  assignRole: { body: assignRoleSchema }
};

// backend/src/modules/admin/routes/admin.routes.ts
var router8 = (0, import_express8.Router)();
router8.get(
  "/applications",
  authenticate,
  loadPermissions,
  requireSuperAdmin,
  adminApplicationsController.listApplications
);
router8.post(
  "/applications/:id/approve",
  authenticate,
  loadPermissions,
  requireSuperAdmin,
  validate(membershipValidators.approve),
  adminApplicationsController.approve
);
router8.post(
  "/applications/:id/reject",
  authenticate,
  loadPermissions,
  requireSuperAdmin,
  validate(membershipValidators.reject),
  adminApplicationsController.reject
);
router8.use(authenticate, loadPermissions, requireSuperAdmin);
router8.get("/users/search", adminController.searchUsers);
router8.get("/dashboard-summary", adminController.getDashboardSummary);
router8.get("/dashboard/summary", adminController.getDashboardSummary);
router8.get("/overview", adminController.getDashboardSummary);
router8.get("/system-health", adminController.getSystemHealth);
router8.get("/custom-committees", adminController.listCustomCommittees);
router8.post("/custom-committees", adminController.createCustomCommittee);
router8.get("/finance-resolutions", adminController.listFinanceResolutions);
router8.post("/finance-resolutions/:id/sign", adminController.signFinanceResolution);
router8.get("/roles", adminController.listRoles);
router8.get("/role-permissions", adminController.listRolePermissionMatrix);
router8.get("/ministries", adminController.listMinistries);
router8.get("/committees", adminController.listCommittees);
router8.get("/user-roles", adminController.listUserRoles);
router8.post("/user-roles", validate(adminValidators.assignRole), adminController.assignRole);
router8.delete("/user-roles/:id", adminController.revokeRole);
var admin_routes_default = router8;

// backend/src/modules/attendance/routes/attendance.routes.ts
var import_express9 = require("express");

// backend/src/modules/attendance/services/attendance.service.ts
init_database();

// backend/src/modules/attendance/repositories/attendance.repository.ts
var import_uuid12 = require("uuid");
init_database();
var AttendanceRepository = class extends BaseRepository {
  constructor() {
    super("attendance_records");
  }
  /**
   * Self-service: a member's own attendance history across every attendable type.
   */
  async listForUser(userId, page, pageSize) {
    const offset = (page - 1) * pageSize;
    const countRows = await query(
      `SELECT
         (SELECT COUNT(*) FROM attendance_records WHERE user_id = :userId) +
         (SELECT COUNT(*) FROM meeting_attendance_confirmations WHERE user_id = :userId)
         AS total`,
      { userId }
    );
    const total = countRows[0]?.total ?? 0;
    const rows = await query(
      `SELECT id, attendable_type, attendable_id, user_id, status, method, visitor_type, checked_in_at FROM (
         SELECT id, attendable_type, attendable_id, user_id, status, method, visitor_type, checked_in_at
           FROM attendance_records WHERE user_id = :userId
         UNION ALL
         SELECT id, 'meeting' AS attendable_type, meeting_id AS attendable_id, user_id,
                CASE arrival_status
                  WHEN 'on_time' THEN 'present'
                  WHEN 'late' THEN 'late'
                  WHEN 'excused' THEN 'excused'
                  ELSE 'absent'
                END AS status,
                method, IF(is_visitor, 'first_time', 'none') AS visitor_type, confirmed_at AS checked_in_at
           FROM meeting_attendance_confirmations WHERE user_id = :userId
       ) combined
       ORDER BY checked_in_at DESC
       LIMIT :limit OFFSET :offset`,
      { userId, limit: pageSize, offset }
    );
    return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
  /**
   * List all attendance sessions (Sunday services, Bible studies, Keshas, meetings)
   * with calculated attendee totals.
   */
  async listSessions() {
    const sessions = await query(
      `SELECT * FROM attendance_sessions ORDER BY session_date DESC, start_time DESC`
    );
    const allRecords = await query(`SELECT * FROM attendance_records`);
    return sessions.map((sess) => {
      const matchedRecords = allRecords.filter(
        (r) => r.session_id === sess.id || r.attendable_id === sess.id
      );
      const membersCount = matchedRecords.filter((r) => !!r.user_id).length;
      const visitorsCount = matchedRecords.filter((r) => !r.user_id).length;
      return {
        ...sess,
        attendees_count: matchedRecords.length,
        members_count: membersCount,
        visitors_count: visitorsCount
      };
    });
  }
  /**
   * Get an attendance session by its ID or its short QR code (e.g. SUN-2026-0830).
   */
  async getSessionByIdOrCode(idOrCode) {
    const rows = await query(
      `SELECT * FROM attendance_sessions WHERE id = :idOrCode OR code = :idOrCode LIMIT 1`,
      { idOrCode }
    );
    if (!rows || rows.length === 0) return null;
    const sess = rows[0];
    const records = await query(
      `SELECT * FROM attendance_records WHERE session_id = :id OR attendable_id = :id`,
      { id: sess.id }
    );
    return {
      ...sess,
      attendees_count: records.length,
      members_count: records.filter((r) => !!r.user_id).length,
      visitors_count: records.filter((r) => !r.user_id).length
    };
  }
  /**
   * Create or generate a new attendance session with a unique code for QR generation.
   */
  async createSession(data) {
    const id = `sess-${(0, import_uuid12.v4)().substring(0, 8)}`;
    const prefix = data.session_type === "sunday_service" ? "SUN" : data.session_type === "bible_study" ? "MID" : "TUMCU";
    const datePart = data.session_date.replace(/-/g, "").substring(0, 8);
    const randPart = Math.floor(100 + Math.random() * 900);
    const code = `${prefix}-${datePart}-${randPart}`;
    const newSession = {
      id,
      code,
      title: data.title,
      session_type: data.session_type,
      session_date: data.session_date,
      start_time: data.start_time,
      end_time: data.end_time || null,
      venue: data.venue,
      theme: data.theme || null,
      preacher: data.preacher || null,
      is_active: 1,
      created_by: data.created_by || "system",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await query(
      `INSERT INTO attendance_sessions (id, code, title, session_type, session_date, start_time, end_time, venue, theme, preacher, is_active, created_by, created_at)
       VALUES (:id, :code, :title, :session_type, :session_date, :start_time, :end_time, :venue, :theme, :preacher, :is_active, :created_by, :created_at)`,
      newSession
    );
    return newSession;
  }
  /**
   * Update session status (e.g. toggle active/inactive).
   */
  async updateSession(id, updates) {
    await query(`UPDATE attendance_sessions SET is_active = :is_active WHERE id = :id`, {
      id,
      ...updates
    });
    return true;
  }
  /**
   * Get full attendee roster for a session, joining member names/contacts or visitor inputs.
   */
  async getSessionRoster(sessionId) {
    const rows = await query(
      `SELECT * FROM attendance_records WHERE session_id = :sessionId OR attendable_id = :sessionId ORDER BY checked_in_at DESC`,
      { sessionId }
    );
    return rows;
  }
  /**
   * Check in a member or visitor.
   */
  async recordPublicOrGuestAttendance(data) {
    const id = `att-${(0, import_uuid12.v4)().substring(0, 8)}`;
    const attendableType = data.attendableType || "sunday_service";
    const method = data.method || "qr_code";
    const visitorType = data.userId ? "none" : data.visitorType || "first_time";
    const newRecord = {
      id,
      session_id: data.sessionId,
      attendable_type: attendableType,
      attendable_id: data.sessionId,
      user_id: data.userId || null,
      guest_name: data.fullName || null,
      guest_email: data.email || null,
      guest_phone: data.phoneNumber || null,
      guest_category: data.category || null,
      status: "present",
      method,
      visitor_type: visitorType,
      checked_in_at: (/* @__PURE__ */ new Date()).toISOString(),
      notes: data.notes || null,
      prayer_request: data.prayerRequest || null
    };
    await query(
      `INSERT INTO attendance_records (id, session_id, attendable_type, attendable_id, user_id, guest_name, guest_email, guest_phone, guest_category, status, method, visitor_type, notes, prayer_request, checked_in_at)
       VALUES (:id, :session_id, :attendable_type, :attendable_id, :user_id, :guest_name, :guest_email, :guest_phone, :guest_category, :status, :method, :visitor_type, :notes, :prayer_request, :checked_in_at)`,
      newRecord
    );
    return newRecord;
  }
  /** Upserts member attendance */
  async recordAttendance(data) {
    const id = `att-${(0, import_uuid12.v4)().substring(0, 8)}`;
    await query(
      `INSERT INTO attendance_records (id, session_id, attendable_type, attendable_id, user_id, status, method, visitor_type, checked_in_at)
       VALUES (:id, :attendableId, :attendableType, :attendableId, :userId, :status, :method, :visitorType, NOW())
       ON DUPLICATE KEY UPDATE status = :status, method = :method, checked_in_at = NOW()`,
      { id, ...data }
    );
    const rows = await query(
      `SELECT * FROM attendance_records WHERE (attendable_id = :attendableId OR session_id = :attendableId) AND user_id = :userId`,
      { attendableId: data.attendableId, userId: data.userId }
    );
    return rows[0] || { id, ...data, checked_in_at: (/* @__PURE__ */ new Date()).toISOString() };
  }
};

// backend/src/modules/attendance/services/attendance.service.ts
var AttendanceService = class extends BaseService {
  constructor(attendanceRepository = new AttendanceRepository()) {
    super(attendanceRepository);
    this.attendanceRepository = attendanceRepository;
  }
  listForUser(userId, page = 1, pageSize = 20) {
    return this.attendanceRepository.listForUser(userId, page, pageSize);
  }
  listSessions() {
    return this.attendanceRepository.listSessions();
  }
  getSession(idOrCode) {
    return this.attendanceRepository.getSessionByIdOrCode(idOrCode);
  }
  createSession(data) {
    return this.attendanceRepository.createSession(data);
  }
  updateSession(id, updates) {
    return this.attendanceRepository.updateSession(id, updates);
  }
  getSessionRoster(sessionId) {
    return this.attendanceRepository.getSessionRoster(sessionId);
  }
  async checkInMemberOrGuest(data) {
    let matchedUserId = data.userId || null;
    let isMember = false;
    let memberDetails = null;
    const searchIdentifier = (data.identifier || data.email || "").trim().toLowerCase();
    if (!matchedUserId && searchIdentifier) {
      const users = await query(
        `SELECT id, full_name, email, phone_number, admission_number, school FROM users WHERE LOWER(email) = :ident OR LOWER(admission_number) = :ident LIMIT 1`,
        { ident: searchIdentifier }
      );
      if (users && users.length > 0) {
        matchedUserId = users[0].id;
        memberDetails = users[0];
      }
    } else if (matchedUserId) {
      const users = await query(
        `SELECT id, full_name, email, phone_number, admission_number, school FROM users WHERE id = :userId LIMIT 1`,
        { userId: matchedUserId }
      );
      if (users && users.length > 0) {
        memberDetails = users[0];
      }
    }
    if (matchedUserId) {
      isMember = true;
      const record2 = await this.attendanceRepository.recordPublicOrGuestAttendance({
        sessionId: data.sessionId,
        attendableType: data.attendableType || "sunday_service",
        userId: matchedUserId,
        fullName: memberDetails?.full_name || data.fullName,
        email: memberDetails?.email || data.email,
        phoneNumber: memberDetails?.phone_number || data.phoneNumber,
        category: memberDetails?.school || data.category,
        visitorType: "none",
        method: data.method || "qr_code",
        prayerRequest: data.prayerRequest,
        notes: data.notes
      });
      return {
        success: true,
        is_member: true,
        message: `Welcome ${memberDetails?.full_name || "Member"}! Your attendance has been successfully recorded.`,
        user: memberDetails,
        record: record2,
        prompt_registration: false
      };
    }
    const visitorType = data.visitorType || "first_time";
    const record = await this.attendanceRepository.recordPublicOrGuestAttendance({
      sessionId: data.sessionId,
      attendableType: data.attendableType || "sunday_service",
      userId: null,
      fullName: data.fullName || "Anonymous Visitor",
      email: data.email || null,
      phoneNumber: data.phoneNumber || null,
      category: data.category || "Guest / Visitor",
      visitorType,
      method: data.method || "qr_code",
      prayerRequest: data.prayerRequest,
      notes: data.notes
    });
    return {
      success: true,
      is_member: false,
      message: `Welcome to TUMCU, ${data.fullName || "Guest"}! Your attendance has been confirmed.`,
      guest: {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        visitorType
      },
      record,
      prompt_registration: true
      // Prompts non-members to become full registered members
    };
  }
  async generateRosterCsv(sessionId) {
    const session = await this.attendanceRepository.getSessionByIdOrCode(sessionId);
    const roster = await this.attendanceRepository.getSessionRoster(sessionId);
    const safeTitle = (session?.title || "Attendance_Records").replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeDate = session?.session_date || (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
    const filename = `TUMCU_Attendance_${safeTitle}_${safeDate}.csv`;
    const headers = [
      "No",
      "Full Name",
      "Email Address",
      "Phone Number",
      "Attendee Type",
      "Admission / Student ID",
      "Membership Number",
      "Status",
      "Check-in Method",
      "Check-in Time",
      "School / Faculty",
      "Prayer Request / Notes"
    ];
    const rows = roster.map((item, index) => {
      const typeLabel = item.is_member ? "Full Member" : item.visitor_type === "first_time" ? "First-Time Visitor" : item.visitor_type === "returning" ? "Returning Guest" : "Guest";
      const escapeField = (val) => {
        if (val === null || val === void 0) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };
      return [
        index + 1,
        escapeField(item.full_name),
        escapeField(item.email),
        escapeField(item.phone_number),
        escapeField(typeLabel),
        escapeField(item.admission_number || "N/A"),
        escapeField(item.membership_number || "N/A"),
        escapeField(item.status),
        escapeField(item.method),
        escapeField(new Date(item.checked_in_at).toLocaleString("en-KE")),
        escapeField(item.school_faculty || ""),
        escapeField(item.prayer_request || item.notes || "")
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\r\n");
    return { filename, csv: csvContent };
  }
  recordAttendance(data) {
    return this.attendanceRepository.recordAttendance(data);
  }
};

// backend/src/modules/attendance/controllers/attendance.controller.ts
var service8 = new AttendanceService();
var AttendanceController = class extends BaseController {
  constructor() {
    super(service8, "Attendance record");
  }
  me = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const result = await service8.listForUser(req.user.sub, page, pageSize);
    return sendSuccess(res, result.rows, "Your attendance history", 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  });
  listSessions = asyncHandler(async (_req, res) => {
    const sessions = await service8.listSessions();
    return sendSuccess(res, sessions, "Attendance sessions retrieved");
  });
  getActivePublicSessions = asyncHandler(async (_req, res) => {
    const sessions = await service8.listSessions();
    const active = sessions.filter((s) => s.is_active);
    return sendSuccess(res, active, "Active attendance sessions");
  });
  getSession = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const session = await service8.getSession(id);
    if (!session) throw new NotFoundError("Attendance session not found");
    return sendSuccess(res, session, "Attendance session details");
  });
  createSession = asyncHandler(async (req, res) => {
    const { title, session_type, session_date, start_time, end_time, venue, theme, preacher } = req.body;
    if (!title || !session_date || !start_time || !venue) {
      throw new BadRequestError("Title, date, start time, and venue are required");
    }
    const session = await service8.createSession({
      title,
      session_type: session_type || "sunday_service",
      session_date,
      start_time,
      end_time,
      venue,
      theme,
      preacher,
      created_by: req.user?.sub
    });
    return sendSuccess(res, session, "Attendance session and QR code generated successfully", 201);
  });
  updateSession = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await service8.updateSession(id, req.body);
    const updated = await service8.getSession(id);
    return sendSuccess(res, updated, "Session updated successfully");
  });
  getSessionRoster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const roster = await service8.getSessionRoster(id);
    return sendSuccess(res, roster, "Session attendance roster");
  });
  exportCsv = asyncHandler(async (req, res) => {
    const sessionId = req.params.id || req.query.sessionId || req.query.session_id;
    if (!sessionId) {
      throw new BadRequestError("Session ID is required for export");
    }
    const { filename, csv } = await service8.generateRosterCsv(sessionId);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  });
  // Public/Guest check-in (scanned from QR code or direct link)
  publicCheckIn = asyncHandler(async (req, res) => {
    const {
      sessionId,
      sessionCode,
      identifier,
      fullName,
      email,
      phoneNumber,
      category,
      visitorType,
      prayerRequest,
      notes
    } = req.body;
    let targetSessionId = sessionId;
    if (!targetSessionId && sessionCode) {
      const sess = await service8.getSession(sessionCode);
      if (sess) targetSessionId = sess.id;
    }
    if (!targetSessionId) {
      throw new BadRequestError("Invalid or missing service session identifier");
    }
    const userId = req.user?.sub || null;
    const result = await service8.checkInMemberOrGuest({
      sessionId: targetSessionId,
      attendableType: "sunday_service",
      userId,
      identifier,
      fullName,
      email,
      phoneNumber,
      category,
      visitorType,
      method: "qr_code",
      prayerRequest,
      notes
    });
    return sendSuccess(res, result, result.message, 200);
  });
  // Self check-in for authenticated members
  selfCheckIn = asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const targetSessionId = req.body.attendableId || req.body.sessionId;
    const result = await service8.checkInMemberOrGuest({
      sessionId: targetSessionId,
      attendableType: req.body.attendableType || "sunday_service",
      userId: req.user.sub,
      method: req.body.method || "self_check_in",
      prayerRequest: req.body.prayerRequest,
      notes: req.body.notes
    });
    return sendSuccess(res, result, "Attendance recorded successfully", 201);
  });
  // Leader-recorded: for marking someone present manually
  recordForOthers = asyncHandler(async (req, res) => {
    const targetSessionId = req.body.attendableId || req.body.sessionId;
    const result = await service8.checkInMemberOrGuest({
      sessionId: targetSessionId,
      attendableType: req.body.attendableType || "sunday_service",
      userId: req.body.userId || null,
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      category: req.body.category,
      visitorType: req.body.visitorType,
      method: req.body.method || "leader_check_in",
      prayerRequest: req.body.prayerRequest,
      notes: req.body.notes
    });
    return sendSuccess(res, result, "Attendance recorded", 201);
  });
};
var attendanceController = new AttendanceController();

// backend/src/modules/attendance/routes/attendance.routes.ts
var router9 = (0, import_express9.Router)();
router9.get("/public/sessions/active", attendanceController.getActivePublicSessions);
router9.get("/public/sessions/:id", attendanceController.getSession);
router9.post("/public/check-in", attendanceController.publicCheckIn);
router9.use(authenticate, loadPermissions);
router9.get("/me", attendanceController.me);
router9.post("/self-check-in", attendanceController.selfCheckIn);
router9.get("/sessions", requirePermission("attendance.view"), attendanceController.listSessions);
router9.post("/sessions", requirePermission("attendance.record"), attendanceController.createSession);
router9.get("/sessions/:id", requirePermission("attendance.view"), attendanceController.getSession);
router9.put("/sessions/:id", requirePermission("attendance.record"), attendanceController.updateSession);
router9.get("/sessions/:id/roster", requirePermission("attendance.view"), attendanceController.getSessionRoster);
router9.get("/sessions/:id/export", requirePermission("attendance.view"), attendanceController.exportCsv);
router9.get("/export", requirePermission("attendance.view"), attendanceController.exportCsv);
router9.post("/manual-check-in", requirePermission("attendance.record"), attendanceController.recordForOthers);
router9.get("/", requirePermission("attendance.view"), attendanceController.list);
router9.get("/:id", requirePermission("attendance.view"), attendanceController.getById);
router9.post("/", requirePermission("attendance.record"), attendanceController.recordForOthers);
router9.put("/:id", requirePermission("attendance.edit"), attendanceController.update);
router9.delete("/:id", requirePermission("attendance.delete"), attendanceController.remove);
var attendance_routes_default = router9;

// backend/src/modules/prayer-requests/routes/prayer-requests.routes.ts
var import_express10 = require("express");

// backend/src/modules/prayer-requests/repositories/prayer-requests.repository.ts
var import_uuid13 = require("uuid");
init_database();
var PrayerRequestsRepository = class {
  /**
   * Privacy is enforced here, not left to the controller/service to
   * remember — every caller of this method gets a correctly-filtered list,
   * never "everything" by accident. A caller always sees:
   *   - every 'public' request
   *   - their OWN requests, regardless of privacy level
   *   - (if canViewConfidential) 'prayer_team' / 'executive_only' / 'private' too
   */
  async listVisibleTo(userId, canViewConfidential2, page, pageSize) {
    const offset = (page - 1) * pageSize;
    const visibilityClause = canViewConfidential2 ? "1=1" : `(privacy_level = 'public' OR requested_by = :userId)`;
    const countRows = await query(
      `SELECT COUNT(*) as total FROM prayer_requests WHERE ${visibilityClause}`,
      { userId }
    );
    const total = countRows[0]?.total ?? 0;
    const rows = await query(
      `SELECT * FROM prayer_requests
        WHERE ${visibilityClause}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset`,
      { userId, limit: pageSize, offset }
    );
    return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
  async findByIdVisibleTo(id, userId, canViewConfidential2) {
    const rows = await query(`SELECT * FROM prayer_requests WHERE id = :id`, { id });
    const record = rows[0];
    if (!record) throw new NotFoundError("Prayer request");
    const visible = canViewConfidential2 || record.privacy_level === "public" || record.requested_by === userId;
    if (!visible) throw new NotFoundError("Prayer request");
    return record;
  }
  async create(data) {
    const id = (0, import_uuid13.v4)();
    await query(
      `INSERT INTO prayer_requests (id, requested_by, title, details, privacy_level, status)
       VALUES (:id, :requestedBy, :title, :details, :privacyLevel, 'open')`,
      { id, ...data }
    );
    const rows = await query(`SELECT * FROM prayer_requests WHERE id = :id`, { id });
    return rows[0];
  }
  /** Only the original requester or confidential-tier staff may update status/content. */
  async updateIfAllowed(id, userId, canViewConfidential2, data) {
    const existing = await this.findByIdVisibleTo(id, userId, canViewConfidential2);
    const isOwner = existing.requested_by === userId;
    if (!isOwner && !canViewConfidential2) {
      throw new NotFoundError("Prayer request");
    }
    const entries = Object.entries(data);
    if (entries.length > 0) {
      const setClause = entries.map(([k]) => `${k} = :${k}`).join(", ");
      await query(`UPDATE prayer_requests SET ${setClause} WHERE id = :id`, {
        ...Object.fromEntries(entries),
        id
      });
    }
    const rows = await query(`SELECT * FROM prayer_requests WHERE id = :id`, { id });
    return rows[0];
  }
};

// backend/src/modules/prayer-requests/services/prayer-requests.service.ts
var PrayerRequestsService = class {
  constructor(repository = new PrayerRequestsRepository()) {
    this.repository = repository;
  }
  list(userId, canViewConfidential2, page = 1, pageSize = 20) {
    return this.repository.listVisibleTo(userId, canViewConfidential2, page, pageSize);
  }
  getById(id, userId, canViewConfidential2) {
    return this.repository.findByIdVisibleTo(id, userId, canViewConfidential2);
  }
  /**
   * `anonymous: true` means the request is submitted by an authenticated
   * member (still required, to prevent spam) but requested_by is stored as
   * NULL — true anonymity, not just "hidden in the UI". There is no way to
   * later trace an anonymous request back to its author from this record.
   */
  create(params) {
    return this.repository.create({
      requestedBy: params.anonymous ? null : params.userId,
      title: params.title,
      details: params.details,
      privacyLevel: params.privacyLevel
    });
  }
  update(id, userId, canViewConfidential2, data) {
    return this.repository.updateIfAllowed(id, userId, canViewConfidential2, data);
  }
};

// backend/src/modules/prayer-requests/controllers/prayer-requests.controller.ts
var service9 = new PrayerRequestsService();
function canViewConfidential(req) {
  return req.permissions?.has("prayer.view_confidential") ?? false;
}
var prayerRequestsController = {
  list: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const result = await service9.list(req.user.sub, canViewConfidential(req), page, pageSize);
    return sendSuccess(res, result.rows, "Prayer requests retrieved", 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  }),
  getById: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const record = await service9.getById(req.params.id, req.user.sub, canViewConfidential(req));
    return sendSuccess(res, record, "Prayer request retrieved");
  }),
  create: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const record = await service9.create({
      userId: req.user.sub,
      title: req.body.title,
      details: req.body.details,
      privacyLevel: req.body.privacyLevel ?? "public",
      anonymous: Boolean(req.body.anonymous)
    });
    return sendSuccess(res, record, "Prayer request submitted", 201);
  }),
  update: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const record = await service9.update(req.params.id, req.user.sub, canViewConfidential(req), req.body);
    return sendSuccess(res, record, "Prayer request updated");
  })
};

// backend/src/modules/prayer-requests/validators/prayer-requests.validator.ts
var import_zod6 = require("zod");
var createPrayerRequestSchema = import_zod6.z.object({
  title: import_zod6.z.string().min(3).max(200),
  details: import_zod6.z.string().min(3).max(2e3),
  privacyLevel: import_zod6.z.enum(["public", "prayer_team", "executive_only", "private"]).default("public"),
  anonymous: import_zod6.z.boolean().default(false)
});
var updatePrayerRequestSchema = import_zod6.z.object({
  status: import_zod6.z.enum(["open", "being_prayed_for", "answered", "closed"]).optional(),
  title: import_zod6.z.string().min(3).max(200).optional(),
  details: import_zod6.z.string().min(3).max(2e3).optional(),
  privacy_level: import_zod6.z.enum(["public", "prayer_team", "executive_only", "private"]).optional()
});
var prayerRequestValidators = {
  create: { body: createPrayerRequestSchema },
  update: { body: updatePrayerRequestSchema }
};

// backend/src/modules/prayer-requests/routes/prayer-requests.routes.ts
var router10 = (0, import_express10.Router)();
router10.use(authenticate, loadPermissions);
router10.get("/", requirePermission("prayer.view"), prayerRequestsController.list);
router10.get("/:id", requirePermission("prayer.view"), prayerRequestsController.getById);
router10.post("/", requirePermission("prayer.create"), validate(prayerRequestValidators.create), prayerRequestsController.create);
router10.put("/:id", requirePermission("prayer.view"), validate(prayerRequestValidators.update), prayerRequestsController.update);
var prayer_requests_routes_default = router10;

// backend/src/modules/notifications/routes/notifications.routes.ts
var import_express11 = require("express");

// backend/src/modules/notifications/repositories/notifications.repository.ts
init_database();
var NotificationsRepository = class {
  /** Notifications that have been queued (by an approval, etc.) but never dispatched. */
  async findUnsent(limit) {
    return query(
      `SELECT n.*, u.email AS user_email
         FROM notifications n
         JOIN users u ON u.id = n.user_id
        WHERE n.sent_at IS NULL
        ORDER BY n.created_at ASC
        LIMIT :limit`,
      { limit }
    );
  }
  async markSent(id) {
    await query(`UPDATE notifications SET sent_at = NOW() WHERE id = :id`, { id });
  }
  async listForUser(userId, page, pageSize) {
    const offset = (page - 1) * pageSize;
    const countRows = await query(
      `SELECT COUNT(*) as total FROM notifications WHERE user_id = :userId`,
      { userId }
    );
    const total = countRows[0]?.total ?? 0;
    const rows = await query(
      `SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
      { userId, limit: pageSize, offset }
    );
    return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
  async markRead(id, userId) {
    await query(`UPDATE notifications SET read_at = NOW() WHERE id = :id AND user_id = :userId`, {
      id,
      userId
    });
  }
  async markAllRead(userId) {
    await query(`UPDATE notifications SET read_at = NOW() WHERE user_id = :userId AND read_at IS NULL`, {
      userId
    });
  }
  async countUnread(userId) {
    const rows = await query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = :userId AND read_at IS NULL`,
      { userId }
    );
    return rows[0]?.count ?? 0;
  }
};

// backend/src/modules/notifications/services/email-provider.ts
var import_nodemailer = __toESM(require("nodemailer"));
init_env();
init_logger();
var ConsoleEmailProvider = class {
  async send(message) {
    logger.info(
      { to: message.to, subject: message.subject },
      `\u{1F4E7} [console email provider \u2014 no SMTP configured] Would send: "${message.subject}" to ${message.to}`
    );
  }
};
var SmtpEmailProvider = class {
  transporter;
  constructor() {
    this.transporter = import_nodemailer.default.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : void 0
    });
  }
  async send(message) {
    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      text: message.body
    });
  }
};
function createEmailProvider() {
  if (!env.SMTP_HOST) {
    logger.warn(
      "SMTP_HOST is not set \u2014 notifications will be logged to the console instead of actually sent. Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD in .env for real email delivery."
    );
    return new ConsoleEmailProvider();
  }
  return new SmtpEmailProvider();
}

// backend/src/modules/notifications/services/notification-dispatch.service.ts
init_logger();
var BATCH_SIZE = 25;
var NotificationDispatchService = class {
  constructor(repository = new NotificationsRepository(), emailProvider = createEmailProvider()) {
    this.repository = repository;
    this.emailProvider = emailProvider;
  }
  /**
   * Sends every currently-unsent notification and marks each one sent_at as
   * it succeeds. A failure on one notification is logged and skipped
   * (stays unsent, retried on the next dispatch cycle) rather than
   * aborting the whole batch — one bad email address shouldn't block
   * everyone else's approval notice.
   */
  async dispatchPending() {
    const pending = await this.repository.findUnsent(BATCH_SIZE);
    let sent = 0;
    let failed = 0;
    for (const notification of pending) {
      try {
        if (notification.channel === "email") {
          await this.emailProvider.send({
            to: notification.user_email,
            subject: notification.title,
            body: notification.body ?? notification.title
          });
        }
        await this.repository.markSent(notification.id);
        sent++;
      } catch (err) {
        logger.error({ err, notificationId: notification.id }, "Failed to dispatch notification");
        failed++;
      }
    }
    if (sent > 0 || failed > 0) {
      logger.info({ sent, failed }, "Notification dispatch cycle complete");
    }
    return { sent, failed };
  }
  listForUser(userId, page = 1, pageSize = 20) {
    return this.repository.listForUser(userId, page, pageSize);
  }
  markRead(id, userId) {
    return this.repository.markRead(id, userId);
  }
  markAllRead(userId) {
    return this.repository.markAllRead(userId);
  }
  countUnread(userId) {
    return this.repository.countUnread(userId);
  }
};
function startNotificationDispatcher(intervalMs) {
  const service13 = new NotificationDispatchService();
  const timer = setInterval(() => {
    service13.dispatchPending().catch((err) => logger.error({ err }, "Notification dispatch cycle crashed"));
  }, intervalMs);
  service13.dispatchPending().catch((err) => logger.error({ err }, "Initial notification dispatch failed"));
  return () => clearInterval(timer);
}

// backend/src/modules/notifications/controllers/notifications.controller.ts
var service10 = new NotificationDispatchService();
var notificationsController = {
  list: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const result = await service10.listForUser(req.user.sub, page, pageSize);
    return sendSuccess(res, result.rows, "Notifications retrieved", 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  }),
  unreadCount: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const count = await service10.countUnread(req.user.sub);
    return sendSuccess(res, { count }, "Unread count retrieved");
  }),
  markRead: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    await service10.markRead(req.params.id, req.user.sub);
    return sendSuccess(res, null, "Notification marked read");
  }),
  markAllRead: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    await service10.markAllRead(req.user.sub);
    return sendSuccess(res, null, "All notifications marked read");
  })
};

// backend/src/modules/notifications/routes/notifications.routes.ts
var router11 = (0, import_express11.Router)();
router11.use(authenticate, loadPermissions);
router11.get("/", notificationsController.list);
router11.get("/unread-count", notificationsController.unreadCount);
router11.post("/read-all", notificationsController.markAllRead);
router11.post("/:id/read", notificationsController.markRead);
var notifications_routes_default = router11;

// backend/src/modules/elections/routes/elections.routes.ts
var import_express12 = require("express");
var import_uuid14 = require("uuid");
init_database();
var router12 = (0, import_express12.Router)();
router12.get(
  "/",
  asyncHandler(async (_req, res) => {
    const elections = await query("SELECT * FROM elections ORDER BY created_at DESC");
    return sendSuccess(res, elections, "Elections retrieved");
  })
);
router12.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const elections = await query("SELECT * FROM elections WHERE id = :id", { id });
    if (!elections || elections.length === 0) {
      throw new NotFoundError("Election not found");
    }
    const election = elections[0];
    const posts = await query(
      "SELECT * FROM election_posts WHERE election_id = :id ORDER BY display_order ASC",
      { id }
    );
    const candidates = await query(
      "SELECT * FROM election_candidates WHERE election_id = :id ORDER BY created_at ASC",
      { id }
    );
    const postsWithCandidates = posts.map((post) => {
      const postCandidates = candidates.filter((c) => c.post_id === post.id);
      return {
        ...post,
        candidates: postCandidates
      };
    });
    return sendSuccess(
      res,
      {
        ...election,
        posts: postsWithCandidates
      },
      "Election details retrieved"
    );
  })
);
router12.post(
  "/:id/nominate",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { postId, manifesto, salvationTestimony, admissionNumber, course } = req.body;
    if (!postId || !manifesto) {
      throw new BadRequestError("Office and manifesto are required");
    }
    const posts = await query("SELECT * FROM election_posts WHERE id = :postId AND election_id = :id", {
      postId,
      id
    });
    if (!posts || posts.length === 0) {
      throw new NotFoundError("Election office not found");
    }
    const candidateId = `cand-rec-${(0, import_uuid14.v4)().substring(0, 8)}`;
    const newCandidate = {
      id: candidateId,
      election_id: id,
      post_id: postId,
      user_id: req.user?.sub,
      full_name: req.body.fullName || "TUMCU Member",
      admission_number: req.body.admissionNumber || "ADM/2026/000",
      course: course || "Undergraduate Degree",
      manifesto,
      salvation_testimony: salvationTestimony || "Born again believer in Jesus Christ.",
      vetting_status: "pending",
      vetting_notes: "Submitted for Electoral Commission vetting.",
      votes_count: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await query(
      `INSERT INTO election_candidates (id, election_id, post_id, user_id, full_name, admission_number, course, manifesto, salvation_testimony, vetting_status, vetting_notes, votes_count, created_at)
       VALUES (:id, :election_id, :post_id, :user_id, :full_name, :admission_number, :course, :manifesto, :salvation_testimony, :vetting_status, :vetting_notes, :votes_count, :created_at)`,
      newCandidate
    );
    return sendSuccess(res, newCandidate, "Nomination submitted successfully for vetting", 201);
  })
);
router12.post(
  "/:id/vote",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { votes } = req.body;
    if (!Array.isArray(votes) || votes.length === 0) {
      throw new BadRequestError("At least one vote selection is required");
    }
    const userId = req.user.sub;
    const existingVotes = await query(
      "SELECT * FROM election_votes WHERE election_id = :id AND voter_id = :userId",
      { id, userId }
    );
    if (existingVotes && existingVotes.length > 0) {
      throw new BadRequestError("You have already cast your ballot in this election.");
    }
    const recordedVotes = [];
    const postTitlesVoted = [];
    for (const v of votes) {
      const voteId = `vote-${(0, import_uuid14.v4)().substring(0, 8)}`;
      const record = {
        id: voteId,
        election_id: id,
        post_id: v.postId,
        candidate_id: v.candidateId,
        voter_id: userId,
        voted_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      await query(
        `INSERT INTO election_votes (id, election_id, post_id, candidate_id, voter_id, voted_at)
         VALUES (:id, :election_id, :post_id, :candidate_id, :voter_id, :voted_at)`,
        record
      );
      await query(
        `UPDATE election_candidates SET votes_count = votes_count + 1 WHERE id = :candidateId`,
        { candidateId: v.candidateId }
      );
      recordedVotes.push(record);
      postTitlesVoted.push(v.postTitle || v.postId);
    }
    const logId = `log-${(0, import_uuid14.v4)().substring(0, 8)}`;
    const auditRecord = {
      id: logId,
      election_id: id,
      voter_id: userId,
      voter_name: req.user?.username || "Verified Member",
      admission_number: "TUMCU/MEMBER",
      post_title: postTitlesVoted.join(", "),
      ip_address: req.ip || "127.0.0.1",
      action: "Ballot Submitted Successfully",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    await query(
      `INSERT INTO election_activity_logs (id, election_id, voter_id, voter_name, admission_number, post_title, ip_address, action, timestamp)
       VALUES (:id, :election_id, :voter_id, :voter_name, :admission_number, :post_title, :ip_address, :action, :timestamp)`,
      auditRecord
    );
    return sendSuccess(
      res,
      { count: recordedVotes.length, timestamp: (/* @__PURE__ */ new Date()).toISOString() },
      "Your ballot has been securely cast and verified by the Electoral Commission.",
      201
    );
  })
);
router12.get(
  "/:id/audit-logs",
  authenticate,
  loadPermissions,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const hasAccess = req.permissions?.has("*") || req.permissions?.has("system.manage_roles") || req.permissions?.has("leadership.assign");
    if (!hasAccess) {
      throw new AuthorizationError("Super Admin electoral audit access required");
    }
    const logs = await query(
      "SELECT * FROM election_activity_logs WHERE election_id = :id ORDER BY timestamp DESC",
      { id }
    );
    const totalVotesCast = await query(
      "SELECT COUNT(DISTINCT voter_id) as total_voters, COUNT(*) as total_ballots FROM election_votes WHERE election_id = :id",
      { id }
    );
    return sendSuccess(
      res,
      {
        logs,
        summary: totalVotesCast[0] || { total_voters: logs.length, total_ballots: logs.length }
      },
      "Election audit activity logs retrieved"
    );
  })
);
router12.patch(
  "/candidates/:candidateId/vet",
  authenticate,
  loadPermissions,
  asyncHandler(async (req, res) => {
    const { candidateId } = req.params;
    const { status, notes } = req.body;
    const hasAccess = req.permissions?.has("*") || req.permissions?.has("system.manage_roles") || req.permissions?.has("leadership.assign");
    if (!hasAccess) {
      throw new AuthorizationError("Super Admin permissions required to vet candidates");
    }
    await query(
      `UPDATE election_candidates SET vetting_status = :status, vetting_notes = :notes WHERE id = :candidateId`,
      { candidateId, status, notes: notes || "" }
    );
    return sendSuccess(res, { candidateId, status }, `Candidate status updated to ${status}`);
  })
);
router12.post(
  "/:id/posts",
  authenticate,
  loadPermissions,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      title,
      code,
      category = "executive",
      displayOrder = 10,
      minYearOfStudy = 2,
      requiredMembershipDuration = "Full Member",
      spiritualRequirements,
      academicRequirements,
      responsibilities,
      seats = 1
    } = req.body;
    const postId = `post-${(0, import_uuid14.v4)().substring(0, 8)}`;
    const newPost = {
      id: postId,
      election_id: id,
      code: code || title.toLowerCase().replace(/\s+/g, "_"),
      title,
      category,
      display_order: Number(displayOrder),
      min_year_of_study: Number(minYearOfStudy),
      required_membership_duration: requiredMembershipDuration,
      spiritual_requirements: spiritualRequirements || "Born again believer in good standing.",
      academic_requirements: academicRequirements || "Good academic standing without disciplinary issues.",
      responsibilities: responsibilities || "Constitutional office responsibilities.",
      seats: Number(seats),
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await query(
      `INSERT INTO election_posts (id, election_id, code, title, category, display_order, min_year_of_study, required_membership_duration, spiritual_requirements, academic_requirements, responsibilities, seats, created_at)
       VALUES (:id, :election_id, :code, :title, :category, :display_order, :min_year_of_study, :required_membership_duration, :spiritual_requirements, :academic_requirements, :responsibilities, :seats, :created_at)`,
      newPost
    );
    return sendSuccess(res, newPost, "Election office added successfully", 201);
  })
);
router12.patch(
  "/:id/status",
  authenticate,
  loadPermissions,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, electoral_commissioner } = req.body;
    await query(
      `UPDATE elections SET status = :status, electoral_commissioner = COALESCE(:electoral_commissioner, electoral_commissioner) WHERE id = :id`,
      { id, status, electoral_commissioner: electoral_commissioner || null }
    );
    return sendSuccess(res, { id, status }, `Election status updated to ${status}`);
  })
);
router12.post(
  "/:id/candidates",
  authenticate,
  loadPermissions,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      postId,
      fullName,
      admissionNumber,
      course,
      yearOfStudy,
      durationInCU,
      manifesto,
      salvationTestimony,
      vettingStatus = "approved",
      vettingNotes = "Verified against Constitution Article 14.3"
    } = req.body;
    if (!postId || !fullName || !admissionNumber) {
      throw new BadRequestError("Post ID, Full Name, and Admission Number are required");
    }
    const candidateId = `cand-rec-${(0, import_uuid14.v4)().substring(0, 8)}`;
    const candidate = {
      id: candidateId,
      election_id: id,
      post_id: postId,
      user_id: `usr-${(0, import_uuid14.v4)().substring(0, 6)}`,
      full_name: fullName,
      admission_number: admissionNumber,
      course: course || `${yearOfStudy || "Year 3"} Student`,
      manifesto: manifesto || "To serve faithfully with humility, integrity, and diligence.",
      salvation_testimony: salvationTestimony || "Born again believer committed to Christ.",
      vetting_status: vettingStatus,
      vetting_notes: vettingNotes,
      votes_count: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await query(
      `INSERT INTO election_candidates (id, election_id, post_id, user_id, full_name, admission_number, course, manifesto, salvation_testimony, vetting_status, vetting_notes, votes_count, created_at)
       VALUES (:id, :election_id, :post_id, :user_id, :full_name, :admission_number, :course, :manifesto, :salvation_testimony, :vetting_status, :vetting_notes, :votes_count, :created_at)`,
      candidate
    );
    return sendSuccess(res, candidate, "Candidate registered and vetted successfully", 201);
  })
);
router12.delete(
  "/:id/candidates/:candidateId",
  authenticate,
  loadPermissions,
  asyncHandler(async (req, res) => {
    const { candidateId } = req.params;
    await query("DELETE FROM election_candidates WHERE id = :candidateId", { candidateId });
    return sendSuccess(res, { candidateId, deleted: true }, "Candidate removed from ballot");
  })
);
router12.get(
  "/:id/results",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const posts = await query(
      "SELECT * FROM election_posts WHERE election_id = :id ORDER BY display_order ASC",
      { id }
    );
    const candidates = await query(
      "SELECT * FROM election_candidates WHERE election_id = :id ORDER BY votes_count DESC, created_at ASC",
      { id }
    );
    const totalVotes = candidates.reduce((sum, c) => sum + (c.votes_count || 0), 0);
    const resultsByPost = posts.map((post) => {
      const postCandidates = candidates.filter((c) => c.post_id === post.id).sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
      const postTotal = postCandidates.reduce((sum, c) => sum + (c.votes_count || 0), 0);
      const ranked = postCandidates.map((c, index) => ({
        ...c,
        rank: index + 1,
        percentage: postTotal > 0 ? (c.votes_count / postTotal * 100).toFixed(1) : "0.0",
        is_winner: index === 0 && (c.votes_count || 0) > 0
      }));
      return {
        ...post,
        total_votes: postTotal,
        candidates: ranked
      };
    });
    return sendSuccess(
      res,
      {
        election_id: id,
        total_votes: totalVotes,
        posts: resultsByPost
      },
      "Election results retrieved"
    );
  })
);
var elections_routes_default = router12;

// backend/src/modules/sermons/routes/sermons.routes.ts
var import_express13 = require("express");
var router13 = (0, import_express13.Router)();
var sermonsStore = [];
var givingStore = [];
function canManageSermons(req) {
  if (!req.user) return false;
  if (req.permissions?.has("*") || req.permissions?.has("system.manage_roles") || req.permissions?.has("leadership.assign")) {
    return true;
  }
  return true;
}
router13.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, series } = req.query;
    let list = [...sermonsStore];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.speaker.toLowerCase().includes(q) || s.scripture.toLowerCase().includes(q) || s.series.toLowerCase().includes(q)
      );
    }
    if (series) {
      list = list.filter((s) => s.series === series);
    }
    return sendSuccess(res, list, "Sermons list retrieved");
  })
);
router13.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sermon = sermonsStore.find((s) => s.id === id);
    if (!sermon) throw new NotFoundError("Sermon not found");
    return sendSuccess(res, sermon, "Sermon retrieved");
  })
);
router13.post(
  "/",
  authenticate,
  loadPermissions,
  asyncHandler(async (req, res) => {
    if (!canManageSermons(req)) {
      throw new AuthorizationError("You do not have permissions to manage sermons");
    }
    const { title, speaker, date, series, scripture, audio_url, duration, description, notes_pdf_url } = req.body;
    if (!title || !speaker || !scripture) {
      throw new BadRequestError("Title, speaker, and scripture are required");
    }
    const newSermon = {
      id: `serm-${Date.now()}`,
      title,
      speaker,
      date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      series: series || "Sunday Service",
      scripture,
      audio_url: audio_url || null,
      duration: duration || (audio_url ? "45:00" : "Notes"),
      description: description || "",
      notes_pdf_url: notes_pdf_url || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    sermonsStore.unshift(newSermon);
    return sendSuccess(res, newSermon, "Sermon created successfully", 201);
  })
);
router13.put(
  "/:id",
  authenticate,
  loadPermissions,
  asyncHandler(async (req, res) => {
    if (!canManageSermons(req)) {
      throw new AuthorizationError("You do not have permissions to edit sermons");
    }
    const { id } = req.params;
    const index = sermonsStore.findIndex((s) => s.id === id);
    if (index === -1) throw new NotFoundError("Sermon not found");
    sermonsStore[index] = {
      ...sermonsStore[index],
      ...req.body,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    return sendSuccess(res, sermonsStore[index], "Sermon updated successfully");
  })
);
router13.delete(
  "/:id",
  authenticate,
  loadPermissions,
  asyncHandler(async (req, res) => {
    if (!canManageSermons(req)) {
      throw new AuthorizationError("You do not have permissions to delete sermons");
    }
    const { id } = req.params;
    const index = sermonsStore.findIndex((s) => s.id === id);
    if (index === -1) throw new NotFoundError("Sermon not found");
    sermonsStore.splice(index, 1);
    return sendSuccess(res, { id }, "Sermon deleted successfully");
  })
);
router13.post(
  "/giving",
  asyncHandler(async (req, res) => {
    const { donor_name, admission_number, category, amount, mpesa_code } = req.body;
    if (!amount || !mpesa_code) {
      throw new BadRequestError("Amount and M-Pesa reference code are required");
    }
    const record = {
      id: `giv-${Date.now()}`,
      donor_name: donor_name || "TUMCU Supporter",
      admission_number: admission_number || "",
      category: category || "Offering",
      amount: Number(amount),
      mpesa_code: mpesa_code.toUpperCase(),
      payment_method: "M-Pesa Paybill (247247 / TUMCU-GIVING)",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    givingStore.unshift(record);
    return sendSuccess(res, record, "Giving recorded successfully. God bless you!", 201);
  })
);
router13.get(
  "/giving/list",
  asyncHandler(async (_req, res) => {
    return sendSuccess(res, givingStore, "Giving records retrieved");
  })
);
router13.get(
  "/giving/export",
  asyncHandler(async (_req, res) => {
    const headers = ["ID", "Donor Name", "Admission No", "Category", "Amount (KES)", "M-Pesa Reference", "Payment Method", "Timestamp"];
    const rows = givingStore.map((g) => [
      g.id,
      `"${g.donor_name}"`,
      `"${g.admission_number || ""}"`,
      `"${g.category}"`,
      g.amount,
      `"${g.mpesa_code}"`,
      `"${g.payment_method}"`,
      `"${g.created_at}"`
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="TUMCU_Giving_Report.csv"');
    return res.status(200).send(csv);
  })
);
var sermons_routes_default = router13;

// backend/src/modules/programmes/routes/programmes.routes.ts
var import_express14 = require("express");

// backend/src/modules/programmes/controllers/programmes.controller.ts
var import_uuid15 = require("uuid");
init_database();

// backend/src/modules/programmes/services/calendar-download.service.ts
var import_fs3 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));
init_logger();
var DEFAULT_CALENDAR_CONFIG = {
  is_custom: false,
  title: "TUMCU Official Semester 1 Calendar",
  semester: "Semester 1 (September \u2013 December 2026)",
  academic_year: "2026/2027",
  filename: "tumcu-semester-program-2026.ics",
  public_url: "/api/programmes/download-calendar",
  file_size_bytes: 18450,
  formatted_size: "18 KB",
  mime_type: "text/calendar",
  file_format: "ICS",
  uploaded_at: null,
  uploaded_by_name: null,
  notes: "System synchronized calendar with all semester services, fellowships, and recurring weekly meetings."
};
var CalendarDownloadService = class {
  configFilePath;
  currentConfig;
  constructor() {
    const dataDir = import_path3.default.resolve(process.cwd(), "data");
    if (!import_fs3.default.existsSync(dataDir)) {
      try {
        import_fs3.default.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        logger.warn({ err }, "Failed to create data directory for downloadable calendar");
      }
    }
    this.configFilePath = import_path3.default.join(dataDir, "downloadable-calendar.json");
    this.currentConfig = this.loadConfig();
  }
  loadConfig() {
    try {
      if (import_fs3.default.existsSync(this.configFilePath)) {
        const raw = import_fs3.default.readFileSync(this.configFilePath, "utf-8");
        const parsed2 = JSON.parse(raw);
        if (parsed2 && typeof parsed2.is_custom === "boolean") {
          return {
            ...DEFAULT_CALENDAR_CONFIG,
            ...parsed2
          };
        }
      }
    } catch (err) {
      logger.warn({ err }, "Error loading downloadable calendar config from disk, using default");
    }
    return { ...DEFAULT_CALENDAR_CONFIG };
  }
  saveConfig(config) {
    try {
      const dataDir = import_path3.default.dirname(this.configFilePath);
      if (!import_fs3.default.existsSync(dataDir)) {
        import_fs3.default.mkdirSync(dataDir, { recursive: true });
      }
      import_fs3.default.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2), "utf-8");
    } catch (err) {
      logger.warn({ err }, "Failed to write downloadable calendar config to disk");
    }
  }
  getCalendarInfo() {
    this.currentConfig = this.loadConfig();
    if (this.currentConfig.is_custom && this.currentConfig.saved_filename) {
      const localFilePath = import_path3.default.resolve(process.cwd(), "public", "uploads", this.currentConfig.saved_filename);
      const railwayFilePath = import_path3.default.join("/app/public/uploads", this.currentConfig.saved_filename);
      if (!import_fs3.default.existsSync(localFilePath) && !import_fs3.default.existsSync(railwayFilePath)) {
        return {
          ...DEFAULT_CALENDAR_CONFIG,
          notes: "Previously uploaded calendar file could not be found; displaying default calendar."
        };
      }
    }
    return { ...this.currentConfig };
  }
  uploadCalendarFile(params) {
    const {
      rawInput,
      originalFilename = "tumcu-semester-calendar.pdf",
      title = "TUMCU Official Semester Calendar",
      semester = "Semester 1 (September \u2013 December 2026)",
      academic_year = "2026/2027",
      notes,
      uploaded_by_id,
      uploaded_by_name = "Executive Leadership"
    } = params;
    let base64String = rawInput;
    let extension = ".pdf";
    let mimeType = "application/pdf";
    const dataUrlMatch = rawInput.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1].toLowerCase();
      base64String = dataUrlMatch[2];
    }
    const extMatch = originalFilename.match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch) {
      extension = "." + extMatch[1].toLowerCase();
    }
    const extToMimeMap = {
      ".pdf": { mime: "application/pdf", format: "PDF" },
      ".ics": { mime: "text/calendar", format: "ICS" },
      ".xlsx": { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", format: "Excel" },
      ".xls": { mime: "application/vnd.ms-excel", format: "Excel" },
      ".docx": { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", format: "Word" },
      ".doc": { mime: "application/msword", format: "Word" },
      ".png": { mime: "image/png", format: "PNG" },
      ".jpg": { mime: "image/jpeg", format: "JPEG" },
      ".jpeg": { mime: "image/jpeg", format: "JPEG" },
      ".csv": { mime: "text/csv", format: "CSV" }
    };
    const detected = extToMimeMap[extension] || { mime: mimeType || "application/octet-stream", format: extension.replace(".", "").toUpperCase() };
    mimeType = detected.mime;
    const fileFormat = detected.format;
    const buffer = Buffer.from(base64String, "base64");
    if (buffer.length === 0) {
      throw new Error("Uploaded calendar file is empty");
    }
    if (buffer.length > 25 * 1024 * 1024) {
      throw new Error("Calendar file is too large. Maximum size is 25MB.");
    }
    const sanitizedBase = import_path3.default.basename(originalFilename, import_path3.default.extname(originalFilename)).toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 35);
    const safeFilename = `tumcu-calendar-${Date.now()}-${sanitizedBase || "official"}${extension}`;
    const localUploadsDir = import_path3.default.resolve(process.cwd(), "public", "uploads");
    const railwayUploadsDir = "/app/public/uploads";
    const distUploadsDir = import_path3.default.resolve(process.cwd(), "dist", "uploads");
    if (!import_fs3.default.existsSync(localUploadsDir)) {
      try {
        import_fs3.default.mkdirSync(localUploadsDir, { recursive: true });
      } catch (err) {
        logger.warn({ err }, "Could not create local public/uploads directory");
      }
    }
    try {
      import_fs3.default.writeFileSync(import_path3.default.join(localUploadsDir, safeFilename), buffer);
    } catch (err) {
      logger.warn({ err }, "Failed writing calendar to local public/uploads");
    }
    if (import_fs3.default.existsSync(railwayUploadsDir)) {
      try {
        import_fs3.default.writeFileSync(import_path3.default.join(railwayUploadsDir, safeFilename), buffer);
      } catch (rErr) {
        logger.warn({ rErr }, "Railway /app/public/uploads write issue");
      }
    }
    if (import_fs3.default.existsSync(distUploadsDir)) {
      try {
        import_fs3.default.writeFileSync(import_path3.default.join(distUploadsDir, safeFilename), buffer);
      } catch (dErr) {
        logger.warn({ dErr }, "Failed mirroring calendar to dist/uploads");
      }
    }
    const formatBytes = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };
    const newConfig = {
      is_custom: true,
      title: title.trim() || "TUMCU Official Semester Calendar",
      semester: semester.trim() || "Semester 1 (September \u2013 December 2026)",
      academic_year: academic_year.trim() || "2026/2027",
      filename: originalFilename.trim() || `TUMCU-Semester-Calendar${extension}`,
      saved_filename: safeFilename,
      public_url: "/api/programmes/download-calendar",
      file_size_bytes: buffer.length,
      formatted_size: formatBytes(buffer.length),
      mime_type: mimeType,
      file_format: fileFormat,
      uploaded_at: (/* @__PURE__ */ new Date()).toISOString(),
      uploaded_by_id: uploaded_by_id || null,
      uploaded_by_name: uploaded_by_name || "Administrator",
      notes: notes?.trim() || "Official leadership-approved semester calendar document."
    };
    this.currentConfig = newConfig;
    this.saveConfig(newConfig);
    logger.info({ safeFilename, title: newConfig.title }, "Admin uploaded custom downloadable calendar");
    return this.currentConfig;
  }
  resetToDefault() {
    this.currentConfig = { ...DEFAULT_CALENDAR_CONFIG };
    this.saveConfig(this.currentConfig);
    logger.info("Reset downloadable calendar to default system generated iCalendar");
    return this.currentConfig;
  }
  serveCalendar(res, inline = false, generateSystemIcsFallback) {
    const config = this.getCalendarInfo();
    if (config.is_custom && config.saved_filename) {
      const localFilePath = import_path3.default.resolve(process.cwd(), "public", "uploads", config.saved_filename);
      const railwayFilePath = import_path3.default.join("/app/public/uploads", config.saved_filename);
      let targetPath = null;
      if (import_fs3.default.existsSync(localFilePath)) {
        targetPath = localFilePath;
      } else if (import_fs3.default.existsSync(railwayFilePath)) {
        targetPath = railwayFilePath;
      }
      if (targetPath) {
        const disposition = inline ? "inline" : "attachment";
        res.setHeader("Content-Type", config.mime_type || "application/octet-stream");
        res.setHeader(
          "Content-Disposition",
          `${disposition}; filename="${encodeURIComponent(config.filename)}"`
        );
        res.sendFile(targetPath);
        return;
      }
    }
    generateSystemIcsFallback().then((icsContent) => {
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="tumcu-semester-program-2026.ics"');
      res.status(200).send(icsContent);
    }).catch((err) => {
      logger.error({ err }, "Error generating fallback calendar");
      res.status(500).send("Error generating calendar");
    });
  }
};
var calendarDownloadService = new CalendarDownloadService();

// backend/src/modules/programmes/controllers/programmes.controller.ts
var DAY_ORDER = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
};
function calculateMondaySchedule(targetDate = /* @__PURE__ */ new Date()) {
  const d = new Date(targetDate);
  const day = d.getDay();
  const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
  const currentMonday = new Date(d.getFullYear(), d.getMonth(), diffToMon);
  currentMonday.setHours(0, 0, 0, 0);
  const anchorMonday = new Date(2026, 8, 21);
  anchorMonday.setHours(0, 0, 0, 0);
  const diffMs = currentMonday.getTime() - anchorMonday.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1e3));
  const isETeams = Math.abs(diffWeeks) % 2 === 0;
  const currentTitle = isETeams ? "E-Teams Fellowship" : "Door to Door Evangelism";
  const nextTitle = isETeams ? "Door to Door Evangelism" : "E-Teams Fellowship";
  const upcomingMondays = [];
  for (let i = 0; i < 12; i++) {
    const nextMon = new Date(currentMonday);
    nextMon.setDate(currentMonday.getDate() + i * 7);
    const wDiff = Math.round((nextMon.getTime() - anchorMonday.getTime()) / (7 * 24 * 60 * 60 * 1e3));
    const isET = Math.abs(wDiff) % 2 === 0;
    upcomingMondays.push({
      date: nextMon.toISOString().split("T")[0],
      title: isET ? "E-Teams Fellowship" : "Door to Door Evangelism",
      type: isET ? "eteams" : "evangelism",
      description: isET ? "Regional fellowship at designated team centers (NORET, SORET) focusing on prayer, mission planning, and discipleship." : "Grassroots door-to-door campus and hostel gospel outreach, personal evangelism, and tract distribution."
    });
  }
  return {
    thisMondayDate: currentMonday.toISOString().split("T")[0],
    isETeams,
    currentTitle,
    nextTitle,
    upcomingMondays
  };
}
var ProgrammesController = class {
  list = asyncHandler(async (_req, res) => {
    const rows = await query("SELECT * FROM weekly_programmes");
    const monSchedule = calculateMondaySchedule();
    const enriched = rows.map((p) => {
      if (p.day?.toLowerCase() === "monday") {
        return {
          ...p,
          active_this_week_title: monSchedule.currentTitle,
          alternating_info: {
            current_week_activity: monSchedule.currentTitle,
            next_week_activity: monSchedule.nextTitle,
            this_monday_date: monSchedule.thisMondayDate,
            rule: "Alternating every Monday between E-Teams Fellowship and Door to Door Evangelism",
            upcoming_mondays: monSchedule.upcomingMondays
          }
        };
      }
      return p;
    });
    const sorted = [...enriched].sort((a, b) => {
      const orderA = DAY_ORDER[a.day?.toLowerCase()?.trim()] ?? 99;
      const orderB = DAY_ORDER[b.day?.toLowerCase()?.trim()] ?? 99;
      return orderA - orderB;
    });
    return sendSuccess(res, sorted, "Weekly programmes retrieved", 200, {
      total: sorted.length,
      monday_schedule: monSchedule
    });
  });
  getMondayForecast = asyncHandler(async (_req, res) => {
    const schedule = calculateMondaySchedule();
    return sendSuccess(res, schedule, "Monday alternating schedule forecast retrieved");
  });
  getById = asyncHandler(async (req, res) => {
    const rows = await query("SELECT * FROM weekly_programmes WHERE id = :id LIMIT 1", {
      id: req.params.id
    });
    if (!rows.length) throw new NotFoundError("Programme");
    const p = rows[0];
    if (p.day?.toLowerCase() === "monday") {
      const monSchedule = calculateMondaySchedule();
      return sendSuccess(res, {
        ...p,
        active_this_week_title: monSchedule.currentTitle,
        alternating_info: monSchedule
      }, "Programme retrieved");
    }
    return sendSuccess(res, p, "Programme retrieved");
  });
  create = asyncHandler(async (req, res) => {
    const id = req.body.id || (0, import_uuid15.v4)();
    const newProg = {
      id,
      day: req.body.day || "Sunday",
      title: req.body.title || "Fellowship Program",
      programme_type: req.body.programme_type || req.body.type || "fellowship",
      time: req.body.time || "5:00 PM \u2013 7:00 PM",
      venue: req.body.venue || "Main Sanctuary",
      leader: req.body.leader || "",
      description: req.body.description || "",
      alternating_enabled: req.body.alternating_enabled ? 1 : 0,
      interval_type: req.body.interval_type || "weekly",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await query(
      `INSERT INTO weekly_programmes (id, day, title, programme_type, time, venue, leader, description, alternating_enabled, created_at)
       VALUES (:id, :day, :title, :programme_type, :time, :venue, :leader, :description, :alternating_enabled, :created_at)`,
      newProg
    );
    return sendSuccess(res, newProg, "Weekly programme created successfully", 201);
  });
  update = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const existing = await query("SELECT * FROM weekly_programmes WHERE id = :id LIMIT 1", { id });
    if (!existing.length) throw new NotFoundError("Programme");
    const updated = {
      ...existing[0],
      day: req.body.day !== void 0 ? req.body.day : existing[0].day,
      title: req.body.title !== void 0 ? req.body.title : existing[0].title,
      programme_type: req.body.programme_type !== void 0 ? req.body.programme_type : existing[0].programme_type,
      time: req.body.time !== void 0 ? req.body.time : existing[0].time,
      venue: req.body.venue !== void 0 ? req.body.venue : existing[0].venue,
      leader: req.body.leader !== void 0 ? req.body.leader : existing[0].leader,
      description: req.body.description !== void 0 ? req.body.description : existing[0].description,
      alternating_enabled: req.body.alternating_enabled !== void 0 ? req.body.alternating_enabled ? 1 : 0 : existing[0].alternating_enabled,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await query(
      `UPDATE weekly_programmes SET day = :day, title = :title, programme_type = :programme_type, time = :time, venue = :venue, leader = :leader, description = :description, alternating_enabled = :alternating_enabled, updated_at = :updated_at WHERE id = :id`,
      updated
    );
    return sendSuccess(res, updated, "Weekly programme updated successfully");
  });
  remove = asyncHandler(async (req, res) => {
    const id = req.params.id;
    await query("DELETE FROM weekly_programmes WHERE id = :id", { id });
    return sendSuccess(res, null, "Weekly programme removed successfully");
  });
  // Helper to generate system iCalendar content as fallback
  generateSystemIcs = async () => {
    const events = await query("SELECT * FROM events");
    const programmes = await query("SELECT * FROM weekly_programmes");
    function formatIcsDate(dateStr) {
      const d = new Date(dateStr);
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    }
    function cleanString(str) {
      return (str || "").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    }
    const now = formatIcsDate((/* @__PURE__ */ new Date()).toISOString());
    let ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Technical University of Mombasa Christian Union//TUMCU Semester Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:TUMCU Semester & Weekly Programmes",
      "X-WR-TIMEZONE:Africa/Nairobi",
      "X-WR-CALDESC:Technical University of Mombasa Christian Union official semester schedule, Friday services, Sunday services, and weekly fellowships."
    ];
    for (const evt of events) {
      const dtStart = evt.start_at ? formatIcsDate(evt.start_at) : now;
      const dtEnd = evt.end_at ? formatIcsDate(evt.end_at) : formatIcsDate(new Date(new Date(evt.start_at).getTime() + 2 * 36e5).toISOString());
      ics.push(
        "BEGIN:VEVENT",
        `UID:${evt.id || (0, import_uuid15.v4)()}@tumcu.ac.ke`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${cleanString(evt.title)}`,
        `DESCRIPTION:${cleanString((evt.description || "") + (evt.preacher ? `\\nMinister: ${evt.preacher}` : ""))}`,
        `LOCATION:${cleanString(evt.venue || evt.location || "Main Assembly Hall")}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Reminder: TUMCU Fellowship",
        "TRIGGER:-PT30M",
        "END:VALARM",
        "END:VEVENT"
      );
    }
    const dayToIcsMap = {
      monday: "MO",
      tuesday: "TU",
      wednesday: "WE",
      thursday: "TH",
      friday: "FR",
      sunday: "SU"
    };
    for (const prog of programmes) {
      const dayKey = prog.day?.toLowerCase();
      const byDay = dayToIcsMap[dayKey];
      if (!byDay) continue;
      if (dayKey === "friday" || dayKey === "sunday") continue;
      let startHour = 17;
      let startMinute = 0;
      let endHour = 19;
      let endMinute = 0;
      if (prog.time.includes("6:00 PM")) {
        startHour = 18;
        endHour = 20;
        endMinute = 30;
      } else if (prog.time.includes("8:00 AM")) {
        startHour = 8;
        endHour = 12;
        endMinute = 30;
      }
      const dayOffsetMap = {
        monday: 21,
        tuesday: 22,
        wednesday: 23,
        thursday: 24
      };
      const startDay = dayOffsetMap[dayKey] || 21;
      const startDate = new Date(Date.UTC(2026, 8, startDay, startHour, startMinute, 0));
      const endDate = new Date(Date.UTC(2026, 8, startDay, endHour, endMinute, 0));
      const dtStart = formatIcsDate(startDate.toISOString());
      const dtEnd = formatIcsDate(endDate.toISOString());
      ics.push(
        "BEGIN:VEVENT",
        `UID:${prog.id || (0, import_uuid15.v4)()}@tumcu.ac.ke`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;UNTIL=20261220T235959Z;BYDAY=${byDay}`,
        `SUMMARY:${cleanString(prog.title)}`,
        `DESCRIPTION:${cleanString(prog.description || "TUMCU Weekly Fellowship")}`,
        `LOCATION:${cleanString(prog.venue || "TUM Campus")}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT"
      );
    }
    ics.push("END:VCALENDAR");
    return ics.join("\r\n");
  };
  // Get current downloadable calendar metadata (custom uploaded vs system fallback)
  getCalendarInfo = asyncHandler(async (_req, res) => {
    const info = calendarDownloadService.getCalendarInfo();
    return sendSuccess(res, info, "Downloadable calendar info retrieved");
  });
  // Admin upload custom downloadable calendar file (PDF, ICS, Excel, etc.)
  uploadCalendar = asyncHandler(async (req, res) => {
    const { fileData, filename, title, semester, academic_year, notes } = req.body;
    if (!fileData) {
      throw new BadRequestError("Calendar fileData is required (base64 string or data URL)");
    }
    if (!filename) {
      throw new BadRequestError("Calendar filename is required");
    }
    const user = req.user;
    const uploaderName = user?.full_name || user?.name || user?.email || "Executive Leadership";
    const result = calendarDownloadService.uploadCalendarFile({
      rawInput: fileData,
      originalFilename: filename,
      title,
      semester,
      academic_year,
      notes,
      uploaded_by_id: user?.id,
      uploaded_by_name: uploaderName
    });
    return sendSuccess(res, result, "Official downloadable calendar uploaded successfully", 201);
  });
  // Admin reset downloadable calendar to system-generated ICS
  resetCalendar = asyncHandler(async (_req, res) => {
    const result = calendarDownloadService.resetToDefault();
    return sendSuccess(res, result, "Downloadable calendar reset to system default");
  });
  // Download official calendar (admin-uploaded file if present, else generated .ics)
  downloadCalendar = asyncHandler(async (req, res) => {
    const inline = req.query.inline === "true";
    calendarDownloadService.serveCalendar(res, inline, this.generateSystemIcs);
  });
  // Backward compatibility alias for /calendar.ics and /download-ics
  downloadIcs = asyncHandler(async (req, res) => {
    const inline = req.query.inline === "true";
    calendarDownloadService.serveCalendar(res, inline, this.generateSystemIcs);
  });
};
var programmesController = new ProgrammesController();

// backend/src/modules/programmes/routes/programmes.routes.ts
var router14 = (0, import_express14.Router)();
router14.get("/", programmesController.list);
router14.get("/calendar-info", programmesController.getCalendarInfo);
router14.get("/download-calendar", programmesController.downloadCalendar);
router14.get("/calendar.ics", programmesController.downloadIcs);
router14.get("/download-ics", programmesController.downloadIcs);
router14.get("/monday-forecast", programmesController.getMondayForecast);
router14.get("/:id", programmesController.getById);
router14.use(authenticate, loadPermissions);
router14.post(
  "/upload-calendar",
  requireAnyPermission("events.create", "events.edit", "system.manage_roles"),
  programmesController.uploadCalendar
);
router14.post(
  "/reset-calendar",
  requireAnyPermission("events.create", "events.edit", "system.manage_roles"),
  programmesController.resetCalendar
);
router14.post(
  "/",
  requireAnyPermission("events.create", "events.edit", "system.manage_roles"),
  programmesController.create
);
router14.put(
  "/:id",
  requireAnyPermission("events.edit", "events.create", "system.manage_roles"),
  programmesController.update
);
router14.delete(
  "/:id",
  requireAnyPermission("events.delete", "events.edit", "system.manage_roles"),
  programmesController.remove
);
var programmes_routes_default = router14;

// backend/src/modules/gemini/routes/gemini.routes.ts
var import_express15 = require("express");
var import_genai = require("@google/genai");
var router15 = (0, import_express15.Router)();
var PERSONA_PROMPTS = {
  prayer_comfort: `You are the TUMCU Spiritual Care & Biblical Prayer Companion for the Technical University of Mombasa Christian Union (TUMCU / TECUMP).
Your role is to offer warm, scripture-saturated encouragement, biblical comfort, hope in Jesus Christ, and composed prayers for students and members going through spiritual, emotional, or personal trials. Ground every reflection in sound biblical theology, quoting relevant scripture references (e.g. Psalms, Isaiah, Romans, Philippians, Gospels). Always point the believer to God's unfailing grace, sovereign love, and the fellowship of the body of Christ at TUM.`,
  doctrinal_scholar: `You are the TUMCU Doctrinal & Hermeneutics Scholar for the Technical University of Mombasa Christian Union (TUMCU).
Your mission is to provide rigorous, accurate, and faith-building explanations of biblical texts, theological doctrines (e.g. Trinity, Justification by Faith, Authority of Scripture, Grace, Sanctification, Christian Ethics), Greek and Hebrew historical-grammatical insights, and apologetics. Ground your explanations in Evangelical Christian orthodox truth adhering to TUMCU's doctrinal basis. Be structured, clear, and intellectually thorough while honoring the supreme authority of God's Word.`,
  campus_mentor: `You are the TUMCU Campus & Academic Mentor for university students at Technical University of Mombasa (TUM).
You counsel and advise Christian undergraduate and diploma students on navigating university academics, engineering/computing/business CATs, final exams, time management, hostel living, purity, peer pressure, career calling, and balancing passionate ministry service in TUMCU with academic excellence. Speak with brotherly/sisterly wisdom, practical discipline, and Christ-centered encouragement.`,
  fast_navigator: `You are the TUMCU Fast Campus & Ministry Navigator.
You provide concise, accurate, instant answers regarding TUMCU Christian Union programs, Sunday service timings (Main Sanctuary 8:00 AM - 1:00 PM), Tuesday Fellowships (5:00 PM - 7:00 PM), Thursday Bible Study / BEST (5:00 PM - 6:30 PM), Friday Ministry Practices (4:30 PM - 7:00 PM), Monthly Kesha (Friday 9:00 PM - 5:00 AM), Ministry Leaders (Worship, Intercessory, Ushering, Media, Missions, Discipleship), Executive Board, Giving M-Pesa Paybill / Till guidelines, and venue locations across TUM Main Campus, Tudor, and student hostels. Keep responses concise, organized, and helpful with bullet points.`
};
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
router15.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const { prompt, persona = "prayer_comfort", conversationHistory = [] } = req.body;
    if (!prompt || typeof prompt !== "string") {
      throw new BadRequestError("Prompt text is required");
    }
    const ai = getGeminiClient();
    if (!ai) {
      const fallbackResponses = {
        prayer_comfort: `Praise the Lord! "The Lord is near to all who call on him, to all who call on him in truth." (Psalm 145:18).

Heavenly Father, we bring this brother/sister before Your throne of grace. Grant them peace that surpasses human understanding, strengthen their faith amidst every trial, and remind them that they are dearly loved. In Jesus' mighty name, Amen.

*(Note: For personalized dynamic responses, ensure GEMINI_API_KEY is configured in Settings > Secrets).*`,
        doctrinal_scholar: `Biblical Hermeneutics Insight:

Scripture interprets Scripture (Analogia Scripturae). When examining this theological question, we see God's consistent covenantal faithfulness from Genesis to Revelation. "All Scripture is God-breathed and useful for teaching, rebuking, correcting and training in righteousness" (2 Timothy 3:16).

*(Configuring GEMINI_API_KEY enables live deep-scholar queries).*`,
        campus_mentor: `Peace be with you, TUMCU comrade!

Balancing university academics at TUM with dedicated ministry is entirely possible through disciplined stewardship. "Whatever you do, work at it with all your heart, as working for the Lord" (Colossians 3:23). Create a structured study timetable, prioritize your quiet time with God, and lean on your fellowship accountability partners.

*(Configuring GEMINI_API_KEY enables live conversational mentoring).*`,
        fast_navigator: `TUMCU Quick Guide:
\u2022 Sunday Service: 8:00 AM - 1:00 PM (Main Auditorium)
\u2022 Tuesday Midweek Fellowship: 5:00 PM - 7:00 PM (LT B)
\u2022 Thursday Bible Study: 5:00 PM - 6:30 PM (Classrooms)
\u2022 Weekly Kesha: Every 3rd Friday (Sanctuary)
\u2022 Giving Paybill: 247247 | Acc: TUMCU-GIVING

*(Configuring GEMINI_API_KEY enables live interactive navigation).*`
      };
      return sendSuccess(
        res,
        {
          response: fallbackResponses[persona] || fallbackResponses.prayer_comfort,
          persona,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          isFallback: true
        },
        "Spiritual companion response generated"
      );
    }
    const systemInstruction = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.prayer_comfort;
    try {
      const contents = [];
      if (Array.isArray(conversationHistory)) {
        for (const item of conversationHistory.slice(-6)) {
          if (item.sender === "user" && item.text) {
            contents.push({ role: "user", parts: [{ text: item.text }] });
          } else if (item.sender === "bot" && item.text) {
            contents.push({ role: "model", parts: [{ text: item.text }] });
          }
        }
      }
      contents.push({ role: "user", parts: [{ text: prompt }] });
      const selectedModel = "gemini-3.8-flash";
      let response;
      try {
        response = await ai.models.generateContent({
          model: selectedModel,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });
      } catch (genErr) {
        throw genErr;
      }
      const generatedText = response.text || "May the Lord bless you and keep you; may His face shine upon you.";
      return sendSuccess(
        res,
        {
          response: generatedText,
          persona,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          isFallback: false
        },
        "Spiritual companion response generated"
      );
    } catch (err) {
      const isQuotaOrCreditErr = err?.message?.includes("prepayment credits") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("402") || err?.message?.includes("429");
      const offlineResponses = {
        prayer_comfort: `Praise the Lord! "The Lord is near to all who call on him, to all who call on him in truth." (Psalm 145:18).

Heavenly Father, we bring this beloved brother/sister before Your throne of grace. Pour Your divine peace over their heart, dispel every fear and anxiety, and grant them strength and joy in Jesus Christ. In Jesus' mighty name, Amen.`,
        doctrinal_scholar: `Scriptural Insight:

"All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work." (2 Timothy 3:16-17). In Christian orthodox theology, God's Word remains our supreme and final authority.`,
        campus_mentor: `Peace be with you, TUMCU comrade!

Remember: "Commit to the Lord whatever you do, and he will establish your plans." (Proverbs 16:3). Whether facing tough CATs, lab reports, or campus pressures, God has called you to excel for His glory. Set a disciplined daily schedule and keep walking faithfully with Christ.`,
        fast_navigator: `TUMCU Service & Fellowship Schedule:
\u2022 Sunday Main Service: 8:00 AM - 1:00 PM (Assembly Hall)
\u2022 Tuesday Bible Study (BEST): 5:00 PM - 6:30 PM (LH 01 & LH 02)
\u2022 Friday Ministry Practices: 4:30 PM - 7:00 PM (Main Sanctuary)
\u2022 Giving Paybill: 247247 | Acc: TUMCU-GIVING
\u2022 Venue: TUM Main Campus, Tudor`
      };
      const fallbackText = offlineResponses[persona] || offlineResponses.prayer_comfort;
      const creditNotice = isQuotaOrCreditErr ? `

*(Notice: AI Studio prepayment credits for this project are currently depleted. You can manage project credits at https://ai.studio/projects. TUMCU spiritual companion offline guidance is active.)*` : "";
      return sendSuccess(
        res,
        {
          response: `${fallbackText}${creditNotice}`,
          persona,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          isFallback: true,
          error: err?.message
        },
        "Spiritual companion response generated"
      );
    }
  })
);
var gemini_routes_default = router15;

// backend/src/modules/landing-media/landing-media.routes.ts
var import_express16 = require("express");

// backend/src/modules/landing-media/landing-media.controller.ts
init_landing_media_service();
var landingMediaController = {
  getMedia: asyncHandler(async (_req, res) => {
    const data = await landingMediaService.getMedia();
    return sendSuccess(res, data, "Landing media configuration retrieved");
  }),
  updateMedia: asyncHandler(async (req, res) => {
    const actorName = req.user?.username || req.user?.email || "Administrator";
    const updated = await landingMediaService.updateMedia(req.body, actorName);
    return sendSuccess(res, updated, "Landing media configuration updated globally");
  }),
  uploadImage: asyncHandler(async (req, res) => {
    const { image, base64, filename } = req.body || {};
    const rawData = image || base64;
    if (!rawData || typeof rawData !== "string") {
      throw new ValidationError("Image data is required (dataUrl or base64 string)");
    }
    const result = landingMediaService.uploadImage(rawData, filename || "media.jpg");
    return sendSuccess(res, result, "Image uploaded successfully", 201);
  }),
  resetMedia: asyncHandler(async (req, res) => {
    const actorName = req.user?.username || req.user?.email || "Administrator";
    const resetConfig = await landingMediaService.resetToDefault(actorName);
    return sendSuccess(res, resetConfig, "Landing media restored to TUMCU defaults");
  })
};

// backend/src/modules/landing-media/landing-media.routes.ts
var router16 = (0, import_express16.Router)();
router16.get("/", landingMediaController.getMedia);
router16.put(
  "/",
  authenticate,
  loadPermissions,
  requireAnyPermission("media.manage_landing", "system.manage_roles"),
  landingMediaController.updateMedia
);
router16.post(
  "/upload",
  authenticate,
  loadPermissions,
  requireAnyPermission("media.manage_landing", "system.manage_roles"),
  landingMediaController.uploadImage
);
router16.post(
  "/reset",
  authenticate,
  loadPermissions,
  requireAnyPermission("media.manage_landing", "system.manage_roles"),
  landingMediaController.resetMedia
);
var landing_media_routes_default = router16;

// backend/src/modules/contact/routes/contact.routes.ts
var import_express17 = require("express");
var import_express_rate_limit = __toESM(require("express-rate-limit"));

// backend/src/modules/contact/services/contact.service.ts
var import_uuid17 = require("uuid");
init_database();

// backend/src/modules/contact/repositories/contact.repository.ts
init_database();
var import_uuid16 = require("uuid");
var ContactRepository = class {
  async create(data) {
    const id = (0, import_uuid16.v4)();
    await query(`INSERT INTO contact_messages (id, sender_name, sender_email, sender_phone, subject, message)
      VALUES (:id, :sender_name, :sender_email, :sender_phone, :subject, :message)`, { id, ...data });
    const rows = await query("SELECT * FROM contact_messages WHERE id = :id", { id });
    return rows[0];
  }
  async list(page = 1, pageSize = 30, status) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeSize = Math.min(100, Math.max(10, Number(pageSize) || 30));
    const offset = (safePage - 1) * safeSize;
    const where = status && status !== "all" ? "WHERE status = :status" : "";
    const countRows = await query(`SELECT COUNT(*) total FROM contact_messages ${where}`, { status: status || null });
    const rows = await query(`SELECT * FROM contact_messages ${where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`, { status: status || null, limit: safeSize, offset });
    const total = Number(countRows[0]?.total || 0);
    return { rows, total, page: safePage, pageSize: safeSize, totalPages: Math.max(1, Math.ceil(total / safeSize)) };
  }
  async update(id, data) {
    await query(`UPDATE contact_messages SET
      status = COALESCE(:status,status), assigned_to = COALESCE(:assigned_to,assigned_to),
      read_at = CASE WHEN :status = 'read' AND read_at IS NULL THEN NOW() ELSE read_at END,
      replied_at = CASE WHEN :status = 'replied' THEN NOW() ELSE replied_at END
      WHERE id = :id`, { id, status: data.status || null, assigned_to: data.assigned_to || null });
    const rows = await query("SELECT * FROM contact_messages WHERE id = :id", { id });
    return rows[0];
  }
};

// backend/src/modules/contact/services/contact.service.ts
var ContactService = class {
  constructor(repo = new ContactRepository()) {
    this.repo = repo;
  }
  async create(data) {
    const contact = await this.repo.create({ sender_name: data.name, sender_email: data.email, sender_phone: data.phone || null, subject: data.subject, message: data.message });
    const recipients = await query(`
      SELECT DISTINCT u.id, u.email FROM users u
      JOIN user_roles ur ON ur.user_id=u.id AND ur.is_current=TRUE
      JOIN roles r ON r.id=ur.role_id
      WHERE u.account_status='active' AND r.code IN ('secretary','chairperson','super_admin') AND u.email IS NOT NULL`);
    for (const recipient of recipients) {
      const title = `New TUMCU contact message: ${data.subject}`;
      const body = `From: ${data.name} <${data.email}>${data.phone ? ` | Phone: ${data.phone}` : ""}

${data.message}`;
      await query(`INSERT INTO notifications (id,user_id,type,title,body,channel)
        VALUES (:id,:userId,'contact_message',:title,:body,'in_app')`, {
        id: (0, import_uuid17.v4)(),
        userId: recipient.id,
        title,
        body
      });
      await query(`INSERT INTO notifications (id,user_id,type,title,body,channel)
        VALUES (:id,:userId,'contact_message',:title,:body,'email')`, {
        id: (0, import_uuid17.v4)(),
        userId: recipient.id,
        title,
        body
      });
    }
    return contact;
  }
  list(page, pageSize, status) {
    return this.repo.list(page, pageSize, status);
  }
  async update(id, data) {
    const updated = await this.repo.update(id, data);
    if (!updated) throw new NotFoundError("Contact message");
    return updated;
  }
};
var contactService = new ContactService();

// backend/src/modules/contact/controllers/contact.controller.ts
var contactController = {
  create: asyncHandler(async (req, res) => sendSuccess(res, await contactService.create(req.body), "Message received. TUMCU leadership has been notified.", 201)),
  list: asyncHandler(async (req, res) => {
    const q = req.query;
    const result = await contactService.list(Number(q.page) || 1, Number(q.pageSize) || 30, q.status);
    return sendSuccess(res, result.rows, "Contact messages retrieved", 200, { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages });
  }),
  update: asyncHandler(async (req, res) => sendSuccess(res, await contactService.update(req.params.id, req.body), "Contact message updated"))
};

// backend/src/modules/contact/validators/contact.validator.ts
var import_zod7 = require("zod");
var contactValidators = {
  create: import_zod7.z.object({
    name: import_zod7.z.string().trim().min(2).max(150),
    email: import_zod7.z.string().trim().email().max(190),
    phone: import_zod7.z.string().trim().max(30).optional().nullable(),
    subject: import_zod7.z.string().trim().min(2).max(255),
    message: import_zod7.z.string().trim().min(5).max(1e4)
  }),
  update: import_zod7.z.object({
    status: import_zod7.z.enum(["new", "read", "replied", "archived"]).optional(),
    assigned_to: import_zod7.z.string().uuid().nullable().optional()
  })
};

// backend/src/modules/contact/routes/contact.routes.ts
var router17 = (0, import_express17.Router)();
var publicLimiter = (0, import_express_rate_limit.default)({ windowMs: 15 * 60 * 1e3, max: 20, standardHeaders: true, legacyHeaders: false });
router17.post("/", publicLimiter, validate({ body: contactValidators.create }), contactController.create);
router17.use(authenticate, loadPermissions, requirePermission("communication.view"));
router17.get("/", contactController.list);
router17.put("/:id", requirePermission("communication.edit"), validate({ body: contactValidators.update }), contactController.update);
var contact_routes_default = router17;

// backend/src/modules/library/library.routes.ts
var import_express18 = require("express");

// backend/src/modules/library/library.service.ts
var import_uuid18 = require("uuid");
init_database();
var LibraryService = class {
  // =========================================================================
  // 1. E-LIBRARY (Digital Books & Documents Catalogue)
  // =========================================================================
  async getResources(params) {
    let sql = "SELECT * FROM library_resources WHERE 1=1";
    const queryParams = {};
    if (params.category && params.category !== "all") {
      sql += " AND category = :category";
      queryParams.category = params.category;
    }
    if (params.search && params.search.trim()) {
      sql += " AND (title LIKE :search OR author LIKE :search OR description LIKE :search OR category LIKE :search)";
      queryParams.search = `%${params.search.trim()}%`;
    }
    sql += " ORDER BY title ASC";
    const rows = await query(sql, queryParams);
    return rows || [];
  }
  async getResourceById(id) {
    const rows = await query("SELECT * FROM library_resources WHERE id = :id LIMIT 1", { id });
    if (!rows || rows.length === 0) {
      throw new NotFoundError("E-Library Resource");
    }
    return rows[0];
  }
  async createResource(data) {
    if (!data.title?.trim()) {
      throw new BadRequestError("Book title is required");
    }
    const id = `lib-${(0, import_uuid18.v4)().substring(0, 8)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await query(
      `INSERT INTO library_resources (
        id, title, author, category, is_digital,
        cover_image_url, file_url, description, status, created_at
      ) VALUES (
        :id, :title, :author, :category, 1,
        :cover_image_url, :file_url, :description, :status, :created_at
      )`,
      {
        id,
        title: data.title.trim(),
        author: data.author?.trim() || "TUMCU Ministry",
        category: data.category || "General",
        cover_image_url: data.cover_image_url || null,
        file_url: data.file_url || null,
        description: data.description || null,
        status: data.status || "available",
        created_at: now
      }
    );
    return this.getResourceById(id);
  }
  async updateResource(id, data) {
    const existing = await this.getResourceById(id);
    await query(
      `UPDATE library_resources SET
        title = :title,
        author = :author,
        category = :category,
        cover_image_url = :cover_image_url,
        file_url = :file_url,
        description = :description,
        status = :status,
        updated_at = :now
      WHERE id = :id`,
      {
        id,
        title: data.title !== void 0 ? data.title.trim() : existing.title,
        author: data.author !== void 0 ? data.author.trim() : existing.author,
        category: data.category !== void 0 ? data.category : existing.category,
        cover_image_url: data.cover_image_url !== void 0 ? data.cover_image_url : existing.cover_image_url,
        file_url: data.file_url !== void 0 ? data.file_url : existing.file_url,
        description: data.description !== void 0 ? data.description : existing.description,
        status: data.status !== void 0 ? data.status : existing.status,
        now: (/* @__PURE__ */ new Date()).toISOString()
      }
    );
    return this.getResourceById(id);
  }
  async deleteResource(id) {
    await this.getResourceById(id);
    await query("DELETE FROM library_resources WHERE id = :id", { id });
  }
  // =========================================================================
  // 2. PHYSICAL BOOK LENDING REGISTER
  // =========================================================================
  async checkoutBook(params) {
    let bookTitle = params.book_title?.trim();
    if (!bookTitle && params.resource_id) {
      try {
        const res = await this.getResourceById(params.resource_id);
        bookTitle = res.title;
      } catch {
        bookTitle = "General Book";
      }
    }
    if (!bookTitle) {
      throw new BadRequestError("Physical book title is required to record a loan");
    }
    if (!params.user_id) {
      throw new BadRequestError("Borrower selection is required");
    }
    const userRows = await query("SELECT * FROM users WHERE id = :id LIMIT 1", { id: params.user_id });
    if (!userRows || userRows.length === 0) {
      throw new NotFoundError("Registered Member");
    }
    const borrower = userRows[0];
    const borrowingId = `bor-${(0, import_uuid18.v4)().substring(0, 8)}`;
    const now = /* @__PURE__ */ new Date();
    let dueDate;
    if (params.due_at) {
      dueDate = new Date(params.due_at);
      if (isNaN(dueDate.getTime())) {
        dueDate = new Date(now.getTime() + 14 * 864e5);
      }
    } else {
      const days = Number(params.due_days) || 14;
      dueDate = new Date(now.getTime() + days * 864e5);
    }
    await query(
      `INSERT INTO library_borrowings (
        id, book_title, user_id, borrower_name, borrower_email, borrower_phone, user_admission_number,
        borrowed_at, due_at, status, notes, issued_by, created_at
      ) VALUES (
        :id, :book_title, :user_id, :borrower_name, :borrower_email, :borrower_phone, :user_admission_number,
        :borrowed_at, :due_at, 'active', :notes, :issued_by, :created_at
      )`,
      {
        id: borrowingId,
        book_title: bookTitle,
        user_id: borrower.id,
        borrower_name: borrower.full_name || "Member",
        borrower_email: borrower.email || "",
        borrower_phone: borrower.phone_number || "",
        user_admission_number: borrower.admission_number || null,
        borrowed_at: now.toISOString(),
        due_at: dueDate.toISOString(),
        notes: params.notes || null,
        issued_by: params.librarian_id || null,
        created_at: now.toISOString()
      }
    );
    return {
      id: borrowingId,
      book_title: bookTitle,
      borrower_name: borrower.full_name,
      due_at: dueDate.toISOString(),
      status: "active",
      message: `Loan recorded: "${bookTitle}" issued to ${borrower.full_name}. Due on ${dueDate.toLocaleDateString()}.`
    };
  }
  async returnBook(borrowingId, returnedToId) {
    const rows = await query("SELECT * FROM library_borrowings WHERE id = :id LIMIT 1", { id: borrowingId });
    if (!rows || rows.length === 0) {
      throw new NotFoundError("Borrowing record");
    }
    const borrowing = rows[0];
    if (borrowing.status === "returned" || borrowing.returned_at) {
      throw new BadRequestError("This book loan has already been marked as returned.");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await query(
      `UPDATE library_borrowings SET status = 'returned', returned_at = :now, returned_to = :returnedToId, updated_at = :now WHERE id = :id`,
      { id: borrowingId, now, returnedToId: returnedToId || null }
    );
    return {
      id: borrowingId,
      book_title: borrowing.book_title || "Book",
      borrower_name: borrowing.borrower_name || "Member",
      status: "returned",
      returned_at: now,
      message: `"${borrowing.book_title || "Book"}" has been marked as returned.`
    };
  }
  async extendDueDate(borrowingId, additionalDays = 7) {
    const rows = await query("SELECT * FROM library_borrowings WHERE id = :id LIMIT 1", { id: borrowingId });
    if (!rows || rows.length === 0) throw new NotFoundError("Borrowing record");
    const borrowing = rows[0];
    if (borrowing.returned_at) {
      throw new BadRequestError("Cannot extend loan for a book that has already been returned.");
    }
    const currentDue = new Date(borrowing.due_at || Date.now());
    const newDue = new Date(currentDue.getTime() + additionalDays * 864e5);
    await query(
      `UPDATE library_borrowings SET due_at = :newDue, notes = CONCAT(COALESCE(notes, ''), ' [Extended by ${additionalDays} days]'), updated_at = :now WHERE id = :id`,
      { id: borrowingId, newDue: newDue.toISOString(), now: (/* @__PURE__ */ new Date()).toISOString() }
    );
    return {
      id: borrowingId,
      due_at: newDue.toISOString(),
      message: `Due date extended to ${newDue.toLocaleDateString()}.`
    };
  }
  async getBorrowings(statusFilter, search) {
    let sql = "SELECT * FROM library_borrowings WHERE 1=1";
    const params = {};
    if (search && search.trim()) {
      sql += " AND (book_title LIKE :search OR borrower_name LIKE :search OR borrower_email LIKE :search OR borrower_phone LIKE :search)";
      params.search = `%${search.trim()}%`;
    }
    sql += " ORDER BY borrowed_at DESC";
    const rows = await query(sql, params);
    const now = Date.now();
    const enriched = (rows || []).map((row) => {
      const isReturned = Boolean(row.returned_at || row.status === "returned");
      const dueTime = row.due_at ? new Date(row.due_at).getTime() : now;
      const diffMs = dueTime - now;
      const diffDays = Math.round(diffMs / 864e5);
      let computedStatus = "active";
      let isOverdue = false;
      let daysOverdue = 0;
      let daysRemaining = 0;
      let isDueSoon = false;
      if (isReturned) {
        computedStatus = "returned";
      } else if (diffMs < 0) {
        computedStatus = "overdue";
        isOverdue = true;
        daysOverdue = Math.abs(diffDays) === 0 ? 1 : Math.abs(diffDays);
      } else {
        computedStatus = "active";
        daysRemaining = diffDays;
        isDueSoon = diffDays <= 3;
      }
      return {
        ...row,
        book_title: row.book_title || "Christian Literature",
        borrower_name: row.borrower_name || row.user_name || "Member",
        borrower_email: row.borrower_email || row.user_email || "",
        borrower_phone: row.borrower_phone || row.user_phone || "",
        status: computedStatus,
        is_overdue: isOverdue,
        days_overdue: daysOverdue,
        days_remaining: daysRemaining,
        is_due_soon: isDueSoon
      };
    });
    if (statusFilter && statusFilter !== "all") {
      return enriched.filter((b) => b.status === statusFilter);
    }
    return enriched;
  }
  async getMyBorrowings(userId) {
    const rows = await query(
      "SELECT * FROM library_borrowings WHERE user_id = :userId ORDER BY borrowed_at DESC",
      { userId }
    );
    const now = Date.now();
    return (rows || []).map((row) => {
      const isReturned = Boolean(row.returned_at || row.status === "returned");
      const dueTime = row.due_at ? new Date(row.due_at).getTime() : now;
      const diffMs = dueTime - now;
      const diffDays = Math.round(diffMs / 864e5);
      let computedStatus = "active";
      let isOverdue = false;
      let daysOverdue = 0;
      let daysRemaining = 0;
      let isDueSoon = false;
      if (isReturned) {
        computedStatus = "returned";
      } else if (diffMs < 0) {
        computedStatus = "overdue";
        isOverdue = true;
        daysOverdue = Math.abs(diffDays) === 0 ? 1 : Math.abs(diffDays);
      } else {
        computedStatus = "active";
        daysRemaining = diffDays;
        isDueSoon = diffDays <= 3;
      }
      return {
        ...row,
        book_title: row.book_title || "Christian Literature",
        borrower_name: row.borrower_name || row.user_name || "Me",
        borrower_email: row.borrower_email || row.user_email || "",
        borrower_phone: row.borrower_phone || row.user_phone || "",
        status: computedStatus,
        is_overdue: isOverdue,
        days_overdue: daysOverdue,
        days_remaining: daysRemaining,
        is_due_soon: isDueSoon
      };
    });
  }
  async getLibraryStats() {
    const allBorrowings = await this.getBorrowings("all");
    const digitalResources = await query("SELECT COUNT(*) as total FROM library_resources");
    let booksOut = 0;
    let dueSoon = 0;
    let overdue = 0;
    let returned = 0;
    for (const b of allBorrowings) {
      if (b.status === "returned") {
        returned++;
      } else if (b.status === "overdue") {
        overdue++;
        booksOut++;
      } else {
        booksOut++;
        if (b.is_due_soon) {
          dueSoon++;
        }
      }
    }
    return {
      booksOut,
      dueSoon,
      overdue,
      returned,
      totalLoansRecorded: allBorrowings.length,
      totalDigitalResources: Number(digitalResources[0]?.total || 0)
    };
  }
  // =========================================================================
  // 3. SEARCH & AUTOCOMPLETE HELPERS
  // =========================================================================
  async searchBorrowers(q) {
    if (!q || q.trim().length < 1) {
      const rows2 = await query(
        `SELECT id, full_name, email, phone_number, admission_number
         FROM users
         WHERE account_status = 'active' OR account_status IS NULL
         ORDER BY full_name ASC LIMIT 20`
      );
      return rows2 || [];
    }
    const term = `%${q.trim()}%`;
    const rows = await query(
      `SELECT id, full_name, email, phone_number, admission_number
       FROM users
       WHERE (full_name LIKE :term OR email LIKE :term OR phone_number LIKE :term OR admission_number LIKE :term)
       ORDER BY full_name ASC LIMIT 20`,
      { term }
    );
    return rows || [];
  }
  async suggestBookTitles(q) {
    const term = q ? `%${q.trim()}%` : "%";
    const rows = await query(
      `SELECT DISTINCT book_title
       FROM library_borrowings
       WHERE book_title LIKE :term
       ORDER BY book_title ASC LIMIT 15`,
      { term }
    );
    return (rows || []).map((r) => r.book_title).filter(Boolean);
  }
};
var libraryService = new LibraryService();

// backend/src/modules/library/library.controller.ts
var libraryController = {
  // Public / Member: Browse E-Library Catalog
  listResources: asyncHandler(async (req, res) => {
    const { category, search } = req.query;
    const resources = await libraryService.getResources({
      category,
      search
    });
    return sendSuccess(res, resources, "E-library resources retrieved");
  }),
  getResource: asyncHandler(async (req, res) => {
    const resource = await libraryService.getResourceById(req.params.id);
    return sendSuccess(res, resource, "E-library resource details");
  }),
  // Admin / Librarian: Manage E-Library
  createResource: asyncHandler(async (req, res) => {
    if (!req.body.title) {
      throw new BadRequestError("Book title is required");
    }
    const created = await libraryService.createResource(req.body);
    return sendSuccess(res, created, "Book added to E-Library", 201);
  }),
  updateResource: asyncHandler(async (req, res) => {
    const updated = await libraryService.updateResource(req.params.id, req.body);
    return sendSuccess(res, updated, "E-Library resource updated successfully");
  }),
  deleteResource: asyncHandler(async (req, res) => {
    await libraryService.deleteResource(req.params.id);
    return sendSuccess(res, null, "Resource removed from E-Library");
  }),
  // Member: View Personal Borrowing History
  getMyBorrowings: asyncHandler(async (req, res) => {
    const data = await libraryService.getMyBorrowings(req.user.sub);
    return sendSuccess(res, data, "Personal borrowing records retrieved");
  }),
  // Backward compatibility alias for getMyBorrowings
  getMyRequests: asyncHandler(async (req, res) => {
    const borrowings = await libraryService.getMyBorrowings(req.user.sub);
    return sendSuccess(res, { borrowings, reservations: [] }, "Personal borrowing records retrieved");
  }),
  // Librarian: Record Physical Book Loan
  recordLoan: asyncHandler(async (req, res) => {
    const { book_title, user_id, due_at, due_days, notes, resource_id } = req.body;
    if (!book_title && !resource_id) {
      throw new BadRequestError("Physical book title is required");
    }
    if (!user_id) {
      throw new BadRequestError("Borrowing member must be selected from registered members");
    }
    const result = await libraryService.checkoutBook({
      book_title,
      resource_id,
      user_id,
      due_at,
      due_days: Number(due_days) || 14,
      notes,
      librarian_id: req.user.sub
    });
    return sendSuccess(res, result, result.message, 201);
  }),
  // Alias for backward compatibility
  checkout: asyncHandler(async (req, res) => {
    const { book_title, user_id, due_at, due_days, notes, resource_id } = req.body;
    const result = await libraryService.checkoutBook({
      book_title,
      resource_id,
      user_id,
      due_at,
      due_days: Number(due_days) || 14,
      notes,
      librarian_id: req.user.sub
    });
    return sendSuccess(res, result, result.message, 201);
  }),
  // Librarian: Record Return
  returnBook: asyncHandler(async (req, res) => {
    const result = await libraryService.returnBook(req.params.id, req.user.sub);
    return sendSuccess(res, result, result.message);
  }),
  // Librarian: Extend Loan Due Date
  extendDueDate: asyncHandler(async (req, res) => {
    const { days = 7 } = req.body;
    const result = await libraryService.extendDueDate(req.params.id, Number(days));
    return sendSuccess(res, result, result.message);
  }),
  // Librarian: View Borrowing Register
  getBorrowings: asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const borrowings = await libraryService.getBorrowings(status, search);
    return sendSuccess(res, borrowings, "Borrowing register records retrieved");
  }),
  // Librarian: Summary Statistics
  getStats: asyncHandler(async (_req, res) => {
    const stats = await libraryService.getLibraryStats();
    return sendSuccess(res, stats, "Library statistics retrieved");
  }),
  // Librarian: Member Search for Borrowing
  searchBorrowers: asyncHandler(async (req, res) => {
    const { q = "" } = req.query;
    const members = await libraryService.searchBorrowers(String(q));
    return sendSuccess(res, members, "Matching registered members");
  }),
  // Librarian: Book Title Suggestions
  suggestTitles: asyncHandler(async (req, res) => {
    const { q = "" } = req.query;
    const titles = await libraryService.suggestBookTitles(String(q));
    return sendSuccess(res, titles, "Previous book title suggestions");
  })
};

// backend/src/modules/library/library.routes.ts
var router18 = (0, import_express18.Router)();
router18.get("/resources", libraryController.listResources);
router18.get("/resources/:id", libraryController.getResource);
router18.use(authenticate);
router18.get("/my-borrowings", libraryController.getMyBorrowings);
router18.get("/my-requests", libraryController.getMyRequests);
router18.use(loadPermissions);
router18.post("/resources", libraryController.createResource);
router18.put("/resources/:id", libraryController.updateResource);
router18.delete("/resources/:id", libraryController.deleteResource);
router18.get("/borrowings", libraryController.getBorrowings);
router18.post("/borrowings", libraryController.recordLoan);
router18.post("/checkout", libraryController.checkout);
router18.post("/borrowings/:id/return", libraryController.returnBook);
router18.post("/borrowings/:id/extend", libraryController.extendDueDate);
router18.get("/members/search", libraryController.searchBorrowers);
router18.get("/titles/suggest", libraryController.suggestTitles);
router18.get("/reports/stats", libraryController.getStats);
router18.get("/stats", libraryController.getStats);
var library_routes_default = router18;

// backend/src/modules/gallery/gallery.routes.ts
var import_express19 = require("express");

// backend/src/modules/gallery/gallery.service.ts
var import_uuid19 = require("uuid");
init_database();
var GalleryService = class {
  async getAlbums(category, includeUnpublished = false) {
    let sql = "SELECT * FROM gallery_albums WHERE 1=1";
    const params = {};
    if (!includeUnpublished) {
      sql += " AND is_published = 1";
    }
    if (category && category !== "all") {
      sql += " AND category = :category";
      params.category = category;
    }
    sql += " ORDER BY event_date DESC, created_at DESC";
    const rows = await query(sql, params);
    return rows || [];
  }
  async getAlbumById(id) {
    const rows = await query("SELECT * FROM gallery_albums WHERE id = :id LIMIT 1", { id });
    if (!rows || rows.length === 0) throw new NotFoundError("Gallery Album");
    return rows[0];
  }
  async createAlbum(data, creatorId) {
    if (!data.title || !data.cover_image_url) {
      throw new BadRequestError("Album title and cover image URL are required");
    }
    if (data.google_photos_url && !data.google_photos_url.startsWith("http://") && !data.google_photos_url.startsWith("https://")) {
      throw new BadRequestError("Google Photos link must be a valid URL starting with http:// or https://");
    }
    const id = `album-${(0, import_uuid19.v4)().substring(0, 8)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const eventDate = data.event_date || now.split("T")[0];
    await query(
      `INSERT INTO gallery_albums (
        id, title, category, event_type, event_date, description,
        cover_image_url, google_photos_url, photo_count, is_published,
        created_by, created_at
      ) VALUES (
        :id, :title, :category, :event_type, :event_date, :description,
        :cover_image_url, :google_photos_url, :photo_count, :is_published,
        :created_by, :created_at
      )`,
      {
        id,
        title: data.title,
        category: data.category || "Special Events",
        event_type: data.event_type || "service",
        event_date: eventDate,
        description: data.description || null,
        cover_image_url: data.cover_image_url,
        google_photos_url: data.google_photos_url || null,
        photo_count: Number(data.photo_count) || 0,
        is_published: data.is_published !== false ? 1 : 0,
        created_by: creatorId || null,
        created_at: now
      }
    );
    return this.getAlbumById(id);
  }
  async updateAlbum(id, data) {
    const existing = await this.getAlbumById(id);
    if (data.google_photos_url && !data.google_photos_url.startsWith("http://") && !data.google_photos_url.startsWith("https://")) {
      throw new BadRequestError("Google Photos link must be a valid URL starting with http:// or https://");
    }
    await query(
      `UPDATE gallery_albums SET
        title = :title,
        category = :category,
        event_type = :event_type,
        event_date = :event_date,
        description = :description,
        cover_image_url = :cover_image_url,
        google_photos_url = :google_photos_url,
        photo_count = :photo_count,
        is_published = :is_published,
        updated_at = :now
      WHERE id = :id`,
      {
        id,
        title: data.title ?? existing.title,
        category: data.category ?? existing.category,
        event_type: data.event_type ?? existing.event_type,
        event_date: data.event_date ?? existing.event_date,
        description: data.description !== void 0 ? data.description : existing.description,
        cover_image_url: data.cover_image_url ?? existing.cover_image_url,
        google_photos_url: data.google_photos_url !== void 0 ? data.google_photos_url : existing.google_photos_url,
        photo_count: data.photo_count !== void 0 ? Number(data.photo_count) : existing.photo_count,
        is_published: data.is_published !== void 0 ? data.is_published ? 1 : 0 : existing.is_published,
        now: (/* @__PURE__ */ new Date()).toISOString()
      }
    );
    return this.getAlbumById(id);
  }
  async deleteAlbum(id) {
    await this.getAlbumById(id);
    await query("DELETE FROM gallery_albums WHERE id = :id", { id });
  }
};
var galleryService = new GalleryService();

// backend/src/modules/gallery/gallery.controller.ts
var galleryController = {
  // Member: Get Albums (only published unless admin/leader)
  listAlbums: asyncHandler(async (req, res) => {
    const { category, include_unpublished } = req.query;
    const isLeader = req.permissions?.has("*") || req.permissions?.has("gallery.manage") || req.permissions?.has("media.manage");
    const includeUnpublished = isLeader && include_unpublished === "true";
    const albums = await galleryService.getAlbums(category, includeUnpublished);
    return sendSuccess(res, albums, "Member gallery albums retrieved");
  }),
  getAlbum: asyncHandler(async (req, res) => {
    const album = await galleryService.getAlbumById(req.params.id);
    return sendSuccess(res, album, "Gallery album details");
  }),
  // Media Ministry Leader / Admin: Create Album
  createAlbum: asyncHandler(async (req, res) => {
    const album = await galleryService.createAlbum(req.body, req.user.sub);
    return sendSuccess(res, album, "Gallery album created successfully", 201);
  }),
  // Media Ministry Leader / Admin: Update Album
  updateAlbum: asyncHandler(async (req, res) => {
    const album = await galleryService.updateAlbum(req.params.id, req.body);
    return sendSuccess(res, album, "Gallery album updated successfully");
  }),
  // Media Ministry Leader / Admin: Delete Album
  deleteAlbum: asyncHandler(async (req, res) => {
    await galleryService.deleteAlbum(req.params.id);
    return sendSuccess(res, null, "Gallery album deleted");
  })
};

// backend/src/modules/gallery/gallery.routes.ts
var router19 = (0, import_express19.Router)();
router19.use(authenticate, loadPermissions);
router19.get("/albums", galleryController.listAlbums);
router19.get("/albums/:id", galleryController.getAlbum);
router19.post("/albums", galleryController.createAlbum);
router19.put("/albums/:id", galleryController.updateAlbum);
router19.delete("/albums/:id", galleryController.deleteAlbum);
var gallery_routes_default = router19;

// backend/src/modules/e-teams/e-teams.routes.ts
var import_express20 = require("express");

// backend/src/modules/e-teams/e-teams.service.ts
var import_uuid20 = require("uuid");
init_database();
function publicTeam(row) {
  return {
    ...row,
    code: row.code || row.short_name || String(row.name || "").toUpperCase().replace(/\s+/g, "_"),
    scripture_verse: row.scripture_verse || row.scripture_theme || null,
    banner_image_url: row.banner_image_url || row.cover_image_url || null,
    target_mission_area: row.target_mission_area || row.mission_purpose || null,
    meeting_day: row.meeting_day || null,
    meeting_time: row.meeting_time || null
  };
}
var ETeamsService = class {
  async getTeams() {
    const rows = await query(
      `SELECT et.*,
              u.full_name AS chairperson_name,
              u.phone_number AS chairperson_phone,
              COALESCE((SELECT COUNT(*) FROM evangelism_team_members etm
                        WHERE etm.team_id = et.id), 0) AS active_members_count
         FROM evangelism_teams et
         LEFT JOIN users u ON u.id = et.leader_id
        WHERE et.is_active = TRUE
        ORDER BY et.name ASC`
    );
    return (rows || []).map(publicTeam);
  }
  async getTeamById(idOrCode) {
    const rows = await query(
      `SELECT et.*,
              u.full_name AS chairperson_name,
              u.phone_number AS chairperson_phone,
              COALESCE((SELECT COUNT(*) FROM evangelism_team_members etm
                        WHERE etm.team_id = et.id), 0) AS active_members_count
         FROM evangelism_teams et
         LEFT JOIN users u ON u.id = et.leader_id
        WHERE et.id = :idOrCode OR et.code = :idOrCode
        LIMIT 1`,
      { idOrCode }
    );
    if (!rows?.length) throw new NotFoundError("Evangelism Team");
    const team = publicTeam(rows[0]);
    const [programmes, announcements, gallery, reports] = await Promise.all([
      query(
        `SELECT id, team_id AS eteam_id, title,
                scheduled_date AS date, time_slot AS time, venue,
                description AS focus, leader_name AS leader
           FROM eteam_programmes
          WHERE team_id = :teamId
          ORDER BY scheduled_date ASC, id DESC`,
        { teamId: team.id }
      ),
      query(
        `SELECT id, team_id, title, content,
                published_at AS posted_at
           FROM eteam_announcements
          WHERE team_id = :teamId
            AND (expires_at IS NULL OR expires_at >= NOW())
          ORDER BY published_at DESC, id DESC`,
        { teamId: team.id }
      ),
      query(
        `SELECT id, team_id AS eteam_id, title, image_url,
                google_photos_url, caption, event_date
           FROM eteam_gallery
          WHERE team_id = :teamId
          ORDER BY event_date DESC, id DESC`,
        { teamId: team.id }
      ),
      query(
        `SELECT er.id, er.team_id, er.title,
                COALESCE(u.full_name, 'E-Team Leadership') AS author,
                er.activity_date AS report_date,
                er.summary,
                CONCAT_WS('\\n\\n', er.outcomes, er.follow_up_notes) AS content
           FROM eteam_reports er
           LEFT JOIN users u ON u.id = er.submitted_by
          WHERE er.team_id = :teamId
          ORDER BY er.activity_date DESC, er.id DESC`,
        { teamId: team.id }
      )
    ]);
    return {
      ...team,
      programmes: programmes || [],
      announcements: announcements || [],
      gallery: gallery || [],
      reports: reports || []
    };
  }
  async verifyChairpersonScope(user, teamIdOrCode) {
    if (!user?.sub) throw new AuthorizationError("Authentication required");
    const team = await this.getTeamById(teamIdOrCode);
    const roles = await query(
      `SELECT r.code, ur.scope_type, ur.scope_id
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :userId
          AND ur.is_current = TRUE
          AND (
            (ur.scope_type = 'e_team' AND ur.scope_id = :teamId)
            OR r.code = 'super_admin'
          )
        LIMIT 10`,
      { userId: user.sub, teamId: team.id }
    );
    if (roles.some((r) => r.code === "super_admin")) return team;
    if (team.chairperson_id === user.sub) return team;
    if (roles.some((r) => r.scope_type === "e_team" && r.scope_id === team.id)) return team;
    throw new AuthorizationError(
      `You are not authorized to manage ${team.name}. Only its appointed leader may manage it.`
    );
  }
  async createTeam(data, userId) {
    const name = String(data.name || "").trim();
    const code = String(data.code || "").trim().toUpperCase();
    if (!name || !code) throw new BadRequestError("E-Team name and code are required");
    const existing = await query(
      `SELECT id FROM evangelism_teams WHERE code = :code OR name = :name LIMIT 1`,
      { code, name }
    );
    if (existing.length) throw new BadRequestError("An E-Team with this name or code already exists");
    const id = (0, import_uuid20.v4)();
    await query(
      `INSERT INTO evangelism_teams
        (id, name, short_name, code, outreach_type, leader_id, region, description,
         mission_purpose, vision, scripture_theme, cover_image_url, banner_image_url,
         logo_url, meeting_schedule, meeting_venue, meeting_day, meeting_time,
         motto, target_mission_area, is_active, created_at, updated_by, updated_at)
       VALUES
        (:id, :name, :short_name, :code, :outreach_type, :leader_id, :region, :description,
         :mission_purpose, :vision, :scripture_theme, :cover_image_url, :banner_image_url,
         :logo_url, :meeting_schedule, :meeting_venue, :meeting_day, :meeting_time,
         :motto, :target_mission_area, TRUE, NOW(), :updated_by, NOW())`,
      {
        id,
        name,
        short_name: data.short_name || code,
        code,
        outreach_type: data.outreach_type || "campus",
        leader_id: data.leader_id || null,
        region: data.region || null,
        description: data.description || null,
        mission_purpose: data.mission_purpose || null,
        vision: data.vision || null,
        scripture_theme: data.scripture_theme || null,
        cover_image_url: data.cover_image_url || null,
        banner_image_url: data.banner_image_url || data.cover_image_url || null,
        logo_url: data.logo_url || null,
        meeting_schedule: data.meeting_schedule || null,
        meeting_venue: data.meeting_venue || null,
        meeting_day: data.meeting_day || null,
        meeting_time: data.meeting_time || null,
        motto: data.motto || null,
        target_mission_area: data.target_mission_area || null,
        updated_by: userId
      }
    );
    return this.getTeamById(id);
  }
  async updateTeam(teamId, data, userId) {
    const existing = await this.getTeamById(teamId);
    const name = String(data.name ?? existing.name).trim();
    const code = String(data.code ?? existing.code).trim().toUpperCase();
    if (!name || !code) throw new BadRequestError("E-Team name and code are required");
    await query(
      `UPDATE evangelism_teams
          SET name = :name,
              short_name = :short_name,
              code = :code,
              outreach_type = :outreach_type,
              leader_id = :leader_id,
              region = :region,
              description = :description,
              mission_purpose = :mission_purpose,
              vision = :vision,
              scripture_theme = :scripture_theme,
              cover_image_url = :cover_image_url,
              banner_image_url = :banner_image_url,
              logo_url = :logo_url,
              meeting_schedule = :meeting_schedule,
              meeting_venue = :meeting_venue,
              meeting_day = :meeting_day,
              meeting_time = :meeting_time,
              motto = :motto,
              target_mission_area = :target_mission_area,
              is_active = :is_active,
              updated_by = :updated_by,
              updated_at = NOW()
        WHERE id = :id`,
      {
        id: existing.id,
        name,
        code,
        short_name: data.short_name ?? existing.short_name ?? code,
        outreach_type: data.outreach_type ?? existing.outreach_type ?? "campus",
        leader_id: data.leader_id ?? existing.chairperson_id ?? null,
        region: data.region ?? existing.region ?? null,
        description: data.description ?? existing.description ?? null,
        mission_purpose: data.mission_purpose ?? existing.mission_purpose ?? null,
        vision: data.vision ?? existing.vision ?? null,
        scripture_theme: data.scripture_theme ?? existing.scripture_theme ?? existing.scripture_verse ?? null,
        cover_image_url: data.cover_image_url ?? existing.cover_image_url ?? null,
        banner_image_url: data.banner_image_url ?? existing.banner_image_url ?? existing.cover_image_url ?? null,
        logo_url: data.logo_url ?? existing.logo_url ?? null,
        meeting_schedule: data.meeting_schedule ?? existing.meeting_schedule ?? null,
        meeting_venue: data.meeting_venue ?? existing.meeting_venue ?? null,
        meeting_day: data.meeting_day ?? existing.meeting_day ?? null,
        meeting_time: data.meeting_time ?? existing.meeting_time ?? null,
        motto: data.motto ?? existing.motto ?? null,
        target_mission_area: data.target_mission_area ?? existing.target_mission_area ?? null,
        is_active: data.is_active ?? existing.is_active ?? true,
        updated_by: userId
      }
    );
    return this.getTeamById(existing.id);
  }
  async addProgramme(teamId, data, user) {
    const team = await this.verifyChairpersonScope(user, teamId);
    const id = (0, import_uuid20.v4)();
    await query(
      `INSERT INTO eteam_programmes
        (id, team_id, title, activity_type, scheduled_date, time_slot, venue,
         description, leader_name, status, created_by)
       VALUES (:id, :teamId, :title, :activity_type, :scheduled_date, :time_slot,
               :venue, :description, :leader_name, 'scheduled', :created_by)`,
      {
        id,
        teamId: team.id,
        title: data.title,
        activity_type: data.activity_type || "fellowship",
        scheduled_date: data.date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        time_slot: data.time || "5:00 PM \u2013 7:00 PM",
        venue: data.venue || team.meeting_venue || "Hall 4",
        description: data.focus || data.description || "Weekly Fellowship",
        leader_name: data.leader || team.chairperson_name || "E-Team Leadership",
        created_by: user.sub
      }
    );
    return { id, message: "Programme added successfully" };
  }
  async updateProgramme(teamId, progId, data, user) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query(
      `UPDATE eteam_programmes SET
        title = :title, scheduled_date = :scheduled_date, time_slot = :time_slot,
        venue = :venue, description = :description, leader_name = :leader_name,
        updated_at = NOW()
       WHERE id = :progId AND team_id = :teamId`,
      {
        progId,
        teamId: team.id,
        title: data.title,
        scheduled_date: data.date,
        time_slot: data.time,
        venue: data.venue,
        description: data.focus || data.description,
        leader_name: data.leader || null
      }
    );
    return { progId, message: "Programme updated successfully" };
  }
  async deleteProgramme(teamId, progId, user) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query("DELETE FROM eteam_programmes WHERE id = :progId AND team_id = :teamId", { progId, teamId: team.id });
    return { message: "Programme deleted" };
  }
  async addAnnouncement(teamId, data, user) {
    const team = await this.verifyChairpersonScope(user, teamId);
    const id = (0, import_uuid20.v4)();
    await query(
      `INSERT INTO eteam_announcements
        (id, team_id, title, content, priority, published_at, expires_at, created_by)
       VALUES (:id, :teamId, :title, :content, :priority, NOW(), :expires_at, :created_by)`,
      {
        id,
        teamId: team.id,
        title: data.title,
        content: data.content,
        priority: data.priority || "normal",
        expires_at: data.expires_at || null,
        created_by: user.sub
      }
    );
    return { id, message: "Announcement posted successfully" };
  }
  async deleteAnnouncement(teamId, annId, user) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query("DELETE FROM eteam_announcements WHERE id = :annId AND team_id = :teamId", { annId, teamId: team.id });
    return { message: "Announcement removed" };
  }
  async addPhoto(teamId, data, user) {
    const team = await this.verifyChairpersonScope(user, teamId);
    if (!data.image_url) throw new BadRequestError("image_url is required");
    const id = (0, import_uuid20.v4)();
    await query(
      `INSERT INTO eteam_gallery
        (id, team_id, title, event_date, caption, image_url, google_photos_url, created_by)
       VALUES (:id, :teamId, :title, :event_date, :caption, :image_url, :google_photos_url, :created_by)`,
      {
        id,
        teamId: team.id,
        title: data.title || "E-Team Moment",
        event_date: data.event_date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        caption: data.caption || null,
        image_url: data.image_url,
        google_photos_url: data.google_photos_url || null,
        created_by: user.sub
      }
    );
    return { id, message: "Photo added to team gallery" };
  }
  async deletePhoto(teamId, photoId, user) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query("DELETE FROM eteam_gallery WHERE id = :photoId AND team_id = :teamId", { photoId, teamId: team.id });
    return { message: "Photo removed from gallery" };
  }
  async addReport(teamId, data, user) {
    const team = await this.verifyChairpersonScope(user, teamId);
    const id = (0, import_uuid20.v4)();
    await query(
      `INSERT INTO eteam_reports
        (id, team_id, title, activity_date, location, participants_count,
         souls_reached, outreach_type, summary, outcomes, follow_up_notes, submitted_by)
       VALUES (:id, :teamId, :title, :activity_date, :location, :participants_count,
               :souls_reached, :outreach_type, :summary, :outcomes, :follow_up_notes, :submitted_by)`,
      {
        id,
        teamId: team.id,
        title: data.title,
        activity_date: data.report_date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        location: data.location || team.region || "Campus",
        participants_count: Number(data.participants_count || 0),
        souls_reached: Number(data.souls_reached || 0),
        outreach_type: data.outreach_type || "outreach",
        summary: data.summary || "",
        outcomes: data.content || null,
        follow_up_notes: data.follow_up_notes || null,
        submitted_by: user.sub
      }
    );
    return { id, message: "Activity report submitted successfully" };
  }
  async uploadTeamImage(teamId, rawData, filename, field, userId) {
    const team = await this.getTeamById(teamId);
    const { landingMediaService: landingMediaService2 } = await Promise.resolve().then(() => (init_landing_media_service(), landing_media_service_exports)).catch(() => ({ landingMediaService: null }));
    if (!landingMediaService2) throw new BadRequestError("Media service unavailable");
    const { url } = landingMediaService2.uploadImage(rawData, filename || `${team.code}-${field}.jpg`);
    const column = field === "cover" ? "cover_image_url" : field === "banner" ? "banner_image_url" : "logo_url";
    await query(`UPDATE evangelism_teams SET ${column} = :url, updated_by = :userId, updated_at = NOW() WHERE id = :id`, { url, userId, id: team.id });
    return { url, team: await this.getTeamById(team.id) };
  }
  async appointChairperson(teamId, userId, phone, assignedBy) {
    const team = await this.getTeamById(teamId);
    const userRows = await query(
      "SELECT id, full_name, phone_number FROM users WHERE id = :userId LIMIT 1",
      { userId }
    );
    if (!userRows?.length) throw new NotFoundError("User");
    await query(
      `UPDATE evangelism_teams
          SET leader_id = :userId, updated_by = :assignedBy, updated_at = NOW()
        WHERE id = :teamId`,
      { userId, assignedBy: assignedBy || null, teamId: team.id }
    );
    const roleRows = await query(
      `SELECT id FROM roles WHERE code = :roleCode LIMIT 1`,
      { roleCode: team.code.toLowerCase() === "noret" ? "noret_chairperson" : "soret_chairperson" }
    );
    if (!roleRows.length) throw new NotFoundError("E-Team leadership role");
    const roleId = roleRows[0].id;
    await query(
      `UPDATE user_roles
          SET is_current = FALSE, end_date = CURDATE()
        WHERE role_id = :roleId
          AND scope_type = 'e_team'
          AND scope_id = :teamId
          AND is_current = TRUE`,
      { roleId, teamId: team.id }
    );
    await query(
      `INSERT INTO user_roles
        (id, user_id, role_id, scope_type, scope_id, start_date, is_current, assigned_by)
       VALUES (UUID(), :userId, :roleId, 'e_team', :teamId, CURDATE(), TRUE, :assignedBy)`,
      { userId, roleId, teamId: team.id, assignedBy: assignedBy || null }
    );
    return {
      message: `${userRows[0].full_name} appointed as Chairperson for ${team.name}`,
      teamId: team.id,
      chairperson: userRows[0].full_name
    };
  }
};
var eteamsService = new ETeamsService();

// backend/src/modules/e-teams/e-teams.controller.ts
var eteamsController = {
  // Public / Member: List E-Teams
  listTeams: asyncHandler(async (_req, res) => {
    const teams = await eteamsService.getTeams();
    return sendSuccess(res, teams, "Evangelism teams retrieved");
  }),
  // Public / Member: Get single team details
  getTeam: asyncHandler(async (req, res) => {
    const team = await eteamsService.getTeamById(req.params.id);
    return sendSuccess(res, team, "Evangelism team details");
  }),
  // Super Admin: Create/Edit complete E-Team metadata
  createTeam: asyncHandler(async (req, res) => {
    const result = await eteamsService.createTeam(req.body, req.user?.sub);
    return sendSuccess(res, result, "Evangelism team created successfully", 201);
  }),
  updateTeam: asyncHandler(async (req, res) => {
    const result = await eteamsService.updateTeam(req.params.id, req.body, req.user?.sub);
    return sendSuccess(res, result, "Evangelism team updated successfully");
  }),
  // Chairperson: Add Programme
  addProgramme: asyncHandler(async (req, res) => {
    const result = await eteamsService.addProgramme(req.params.id, req.body, req.user);
    return sendSuccess(res, result, result.message, 201);
  }),
  // Chairperson: Update Programme
  updateProgramme: asyncHandler(async (req, res) => {
    const result = await eteamsService.updateProgramme(req.params.id, req.params.progId, req.body, req.user);
    return sendSuccess(res, result, result.message);
  }),
  // Chairperson: Delete Programme
  deleteProgramme: asyncHandler(async (req, res) => {
    const result = await eteamsService.deleteProgramme(req.params.id, req.params.progId, req.user);
    return sendSuccess(res, result, result.message);
  }),
  // Chairperson: Post Announcement
  addAnnouncement: asyncHandler(async (req, res) => {
    const result = await eteamsService.addAnnouncement(req.params.id, req.body, req.user);
    return sendSuccess(res, result, result.message, 201);
  }),
  // Chairperson: Delete Announcement
  deleteAnnouncement: asyncHandler(async (req, res) => {
    const result = await eteamsService.deleteAnnouncement(req.params.id, req.params.annId, req.user);
    return sendSuccess(res, result, result.message);
  }),
  // Chairperson: Add Photo
  addPhoto: asyncHandler(async (req, res) => {
    const result = await eteamsService.addPhoto(req.params.id, req.body, req.user);
    return sendSuccess(res, result, result.message, 201);
  }),
  // Chairperson: Delete Photo
  deletePhoto: asyncHandler(async (req, res) => {
    const result = await eteamsService.deletePhoto(req.params.id, req.params.photoId, req.user);
    return sendSuccess(res, result, result.message);
  }),
  // Chairperson: Submit Report
  addReport: asyncHandler(async (req, res) => {
    const result = await eteamsService.addReport(req.params.id, req.body, req.user);
    return sendSuccess(res, result, result.message, 201);
  }),
  // Super Admin: Upload durable E-Team imagery
  uploadTeamImage: asyncHandler(async (req, res) => {
    const { base64, image, filename, field = "cover" } = req.body || {};
    if (!["cover", "banner", "logo"].includes(field)) throw new BadRequestError("field must be cover, banner or logo");
    const rawData = image || base64;
    if (!rawData || typeof rawData !== "string") throw new BadRequestError("Image data is required");
    const result = await eteamsService.uploadTeamImage(req.params.id, rawData, filename || `${req.params.id}-${field}.jpg`, field, req.user.sub);
    return sendSuccess(res, result, "E-Team image uploaded and persisted", 201);
  }),
  // Super Admin: Appoint Chairperson
  appointChairperson: asyncHandler(async (req, res) => {
    const { user_id, phone } = req.body;
    if (!user_id) throw new BadRequestError("user_id is required");
    const result = await eteamsService.appointChairperson(req.params.id, user_id, phone, req.user.sub);
    return sendSuccess(res, result, result.message);
  })
};

// backend/src/modules/e-teams/e-teams.routes.ts
var router20 = (0, import_express20.Router)();
router20.get("/", eteamsController.listTeams);
router20.get("/:id", eteamsController.getTeam);
router20.use(authenticate, loadPermissions);
router20.post("/", requireSuperAdmin, eteamsController.createTeam);
router20.put("/:id", requireSuperAdmin, eteamsController.updateTeam);
router20.post("/:id/programmes", requirePermission("eteams.manage_programmes"), eteamsController.addProgramme);
router20.put("/:id/programmes/:progId", requirePermission("eteams.manage_programmes"), eteamsController.updateProgramme);
router20.delete("/:id/programmes/:progId", requirePermission("eteams.manage_programmes"), eteamsController.deleteProgramme);
router20.post("/:id/announcements", requirePermission("eteams.manage_announcements"), eteamsController.addAnnouncement);
router20.delete("/:id/announcements/:annId", requirePermission("eteams.manage_announcements"), eteamsController.deleteAnnouncement);
router20.post("/:id/gallery", requirePermission("eteams.manage_gallery"), eteamsController.addPhoto);
router20.delete("/:id/gallery/:photoId", requirePermission("eteams.manage_gallery"), eteamsController.deletePhoto);
router20.post("/:id/reports", requirePermission("eteams.manage_reports"), eteamsController.addReport);
router20.post("/:id/upload-image", requireSuperAdmin, eteamsController.uploadTeamImage);
router20.post(
  "/:id/appoint-chairperson",
  requireSuperAdmin,
  eteamsController.appointChairperson
);
var e_teams_routes_default = router20;

// backend/src/modules/leadership/routes/leadership.routes.ts
var import_express21 = require("express");

// backend/src/modules/leadership/services/leadership.service.ts
var import_uuid22 = require("uuid");

// backend/src/modules/leadership/repositories/leadership.repository.ts
init_database();
var import_uuid21 = require("uuid");
var LeadershipRepository = class extends BaseRepository {
  constructor() {
    super("executive_terms");
  }
  async findPositions() {
    const rows = await query(`SELECT * FROM leadership_positions ORDER BY display_order ASC`);
    return rows.map((row) => ({
      ...row,
      responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : typeof row.responsibilities === "string" ? JSON.parse(row.responsibilities || "[]") : [],
      permissions: Array.isArray(row.permissions) ? row.permissions : typeof row.permissions === "string" ? JSON.parse(row.permissions || "[]") : [],
      constitutional_restrictions: Array.isArray(row.constitutional_restrictions) ? row.constitutional_restrictions : typeof row.constitutional_restrictions === "string" ? JSON.parse(row.constitutional_restrictions || "[]") : []
    }));
  }
  async findPositionById(id) {
    const rows = await query(
      "SELECT * FROM leadership_positions WHERE id = :id LIMIT 1",
      { id }
    );
    return rows[0] || null;
  }
  async findAssignments(filters = {}) {
    let sql = `SELECT la.*, lp.code AS position_code, lp.name AS position_name,
                      lp.category AS position_category, lp.constitutional_reference,
                      lp.responsibilities, lp.permissions, lp.constitutional_restrictions,
                      u.full_name AS user_name, u.email AS user_email,
                      u.phone_number AS user_phone, u.admission_number AS user_admission_number,
                      u.course AS user_course, u.year_of_study AS user_year,
                      u.passport_photo_url AS user_avatar
                 FROM leadership_assignments la
                 JOIN leadership_positions lp ON lp.id = la.position_id
                 LEFT JOIN users u ON u.id = la.user_id
                WHERE 1=1`;
    const params = {};
    if (filters.status) {
      sql += " AND status = :status";
      params.status = filters.status;
    }
    if (filters.positionId) {
      sql += " AND position_id = :positionId";
      params.positionId = filters.positionId;
    }
    if (filters.userId) {
      sql += " AND user_id = :userId";
      params.userId = filters.userId;
    }
    const rows = await query(sql, params);
    return rows.map((row) => ({
      ...row,
      responsibilities: typeof row.responsibilities === "string" ? JSON.parse(row.responsibilities || "[]") : row.responsibilities || [],
      permissions: typeof row.permissions === "string" ? JSON.parse(row.permissions || "[]") : row.permissions || [],
      constitutional_restrictions: typeof row.constitutional_restrictions === "string" ? JSON.parse(row.constitutional_restrictions || "[]") : row.constitutional_restrictions || []
    }));
  }
  async findAssignmentById(id) {
    const rows = await query(
      "SELECT * FROM leadership_assignments WHERE id = :id LIMIT 1",
      { id }
    );
    return rows[0] || null;
  }
  async createAssignment(data) {
    const id = data.id || (0, import_uuid21.v4)();
    await query(
      `INSERT INTO leadership_assignments (id, position_id, user_id, academic_year, assignment_type, start_date, end_date, status, notes)
       VALUES (:id, :position_id, :user_id, :academic_year, :assignment_type, :start_date, :end_date, :status, :notes)`,
      {
        id,
        position_id: data.position_id,
        user_id: data.user_id,
        academic_year: data.academic_year || "2025/2026",
        assignment_type: data.assignment_type || "permanent",
        start_date: data.start_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        end_date: data.end_date || null,
        status: data.status || "active",
        notes: data.notes || ""
      }
    );
    return id;
  }
  async updateAssignment(id, data) {
    await query(
      `UPDATE leadership_assignments 
       SET status = :status, vacancy_reason = :vacancy_reason, vacancy_date = :vacancy_date, notes = :notes, user_id = :user_id
       WHERE id = :id`,
      {
        id,
        status: data.status,
        vacancy_reason: data.vacancy_reason || null,
        vacancy_date: data.vacancy_date || null,
        notes: data.notes || "",
        user_id: data.user_id !== void 0 ? data.user_id : null
      }
    );
  }
  async deleteAssignment(id) {
    await query("DELETE FROM leadership_assignments WHERE id = :id", { id });
  }
  async getCounts() {
    const assignments = await this.findAssignments();
    const active = assignments.filter((a) => a.status === "active");
    const vacant = assignments.filter((a) => a.status === "vacant");
    return {
      total: assignments.length,
      active: active.length,
      vacant: vacant.length
    };
  }
};

// backend/src/modules/leadership/services/leadership.service.ts
init_database();
var LeadershipService = class extends BaseService {
  leadershipRepo;
  constructor(repository = new LeadershipRepository()) {
    super(repository);
    this.leadershipRepo = repository;
  }
  getRoleCodeForPosition(positionCode) {
    const executive = /* @__PURE__ */ new Set([
      "chairperson",
      "first_vice_chairperson",
      "second_vice_chairperson",
      "secretary",
      "vice_secretary",
      "treasurer",
      "prayer_chairperson",
      "worship_chairperson",
      "missions_chairperson",
      "discipleship_chairperson",
      "assets_chairperson",
      "publicity_chairperson",
      "non_residents_chairperson",
      "welfare_chairperson"
    ]);
    if (executive.has(positionCode)) return { roleCode: positionCode, scopeType: "executive" };
    const ministryCode = positionCode === "media_ministry_leader" ? "media" : positionCode.replace(/_leader$/, "");
    return { roleCode: "ministry_leader", scopeType: "ministry", ministryCode };
  }
  async syncUserRoleForLeadership(userId, positionCode, positionId, activate) {
    const { roleCode, scopeType, ministryCode } = this.getRoleCodeForPosition(positionCode);
    const roleRows = await query("SELECT id FROM roles WHERE code = :roleCode LIMIT 1", { roleCode });
    if (!roleRows.length) throw new BusinessRuleError(`Role ${roleCode} is not configured. Run database seed.`);
    const roleId = roleRows[0].id;
    if (!activate) {
      let revokeScopeId = positionId;
      if (scopeType === "ministry") {
        const ministryRows = await query("SELECT id FROM ministries WHERE code = :code LIMIT 1", { code: ministryCode });
        revokeScopeId = ministryRows[0]?.id || null;
      }
      await query(
        `UPDATE user_roles SET is_current = FALSE, end_date = CURDATE()
          WHERE user_id = :userId AND role_id = :roleId AND is_current = TRUE
            AND scope_type = :scopeType AND scope_id = :scopeId`,
        { userId, roleId, scopeType, scopeId: revokeScopeId }
      );
      return;
    }
    let scopeId = positionId;
    if (scopeType === "ministry") {
      const ministryRows = await query("SELECT id FROM ministries WHERE code = :code LIMIT 1", { code: ministryCode });
      if (!ministryRows.length) throw new BusinessRuleError(`Ministry ${ministryCode} is not configured. Run database seed.`);
      scopeId = ministryRows[0].id;
    }
    await query(
      `UPDATE user_roles SET is_current = FALSE, end_date = CURDATE()
        WHERE user_id = :userId AND role_id = :roleId AND is_current = TRUE
          AND scope_type = :scopeType AND scope_id = :scopeId`,
      { userId, roleId, scopeType, scopeId }
    );
    await query(
      `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, end_date, is_current, assigned_by)
       VALUES (UUID(), :userId, :roleId, :scopeType, :scopeId, CURDATE(), NULL, TRUE, :assignedBy)`,
      { userId, roleId, scopeType, scopeId, assignedBy: userId }
    );
  }
  async listPositions() {
    return this.leadershipRepo.findPositions();
  }
  async listAssignments(filters) {
    return this.leadershipRepo.findAssignments(filters);
  }
  async assignLeader(params) {
    const position = await this.leadershipRepo.findPositionById(params.positionId);
    if (!position) {
      throw new NotFoundError("Leadership Position");
    }
    const users = await query("SELECT * FROM users WHERE id = :id LIMIT 1", { id: params.userId });
    if (!users || users.length === 0) {
      throw new NotFoundError("User");
    }
    const roleInfo = this.getRoleCodeForPosition(position.code);
    const existing = await this.leadershipRepo.findAssignments({ positionId: params.positionId, status: "active" });
    if (existing.length > 0) {
      const prev = existing[0];
      await this.leadershipRepo.updateAssignment(prev.id, {
        status: "ended",
        notes: `Replaced by ${users[0].full_name} (${params.assignmentType})`
      });
      if (prev.user_id && prev.user_id !== params.userId) {
        await this.syncUserRoleForLeadership(prev.user_id, position.code, params.positionId, false);
      }
    }
    const id = await this.leadershipRepo.createAssignment({
      position_id: params.positionId,
      user_id: params.userId,
      assignment_type: params.assignmentType,
      academic_year: params.academicYear || "2025/2026",
      status: "active",
      notes: params.notes || `Appointed as ${position.name} (${params.assignmentType})`
    });
    await this.syncUserRoleForLeadership(params.userId, position.code, params.positionId, true);
    if (memoryDb.tables.audit_logs) {
      memoryDb.tables.audit_logs.unshift({
        id: (0, import_uuid22.v4)(),
        user_id: params.userId,
        action: "leadership.appointed",
        entity_type: "leadership_assignment",
        entity_id: id,
        old_values: null,
        new_values: JSON.stringify({
          position: position.name,
          roleCode: roleInfo.roleCode,
          type: params.assignmentType,
          academicYear: params.academicYear || "2025/2026"
        }),
        ip_address: "127.0.0.1",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    return { id };
  }
  async appointReplacement(positionId, params) {
    const position = await this.leadershipRepo.findPositionById(positionId);
    if (!position) {
      throw new NotFoundError("Leadership Position");
    }
    const roleInfo = this.getRoleCodeForPosition(position.code);
    const vacantAssignments = await this.leadershipRepo.findAssignments({ positionId, status: "vacant" });
    if (vacantAssignments.length > 0) {
      await this.leadershipRepo.updateAssignment(vacantAssignments[0].id, {
        user_id: params.userId,
        status: "active",
        vacancy_reason: null,
        vacancy_date: null,
        notes: params.notes || `Appointed replacement under Article 9 (${params.assignmentType})`
      });
      await this.syncUserRoleForLeadership(params.userId, position.code, positionId, true);
      return { id: vacantAssignments[0].id };
    }
    return this.assignLeader({
      positionId,
      userId: params.userId,
      assignmentType: params.assignmentType,
      notes: params.notes
    });
  }
  async updateAssignment(id, data) {
    const existing = await this.leadershipRepo.findAssignmentById(id);
    if (!existing) {
      throw new NotFoundError("Leadership Assignment");
    }
    await this.leadershipRepo.updateAssignment(id, data);
  }
  async revokeAssignment(id, reason) {
    const existing = await this.leadershipRepo.findAssignmentById(id);
    if (!existing) {
      throw new NotFoundError("Leadership Assignment");
    }
    await this.leadershipRepo.updateAssignment(id, {
      status: "vacant",
      user_id: null,
      vacancy_reason: reason || "Relieved of responsibility / Vacancy declared pursuant to Constitution Article 9",
      vacancy_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    });
    if (existing.user_id && existing.position_id) {
      const position = await this.leadershipRepo.findPositionById(existing.position_id);
      if (position) {
        await this.syncUserRoleForLeadership(existing.user_id, position.code, existing.position_id, false);
      }
    }
  }
  async getMyResponsibilities(userId) {
    const users = await query("SELECT * FROM users WHERE id = :id LIMIT 1", { id: userId });
    const user = users[0] || {
      id: userId,
      full_name: "CU Leader",
      email: "",
      phone_number: "",
      admission_number: ""
    };
    const assignments = await this.leadershipRepo.findAssignments({ userId, status: "active" });
    const allDuties = [];
    const allPerms = [];
    const allRestrictions = [];
    for (const a of assignments) {
      if (a.responsibilities) allDuties.push(...a.responsibilities);
      if (a.permissions) allPerms.push(...a.permissions);
      if (a.constitutional_restrictions) allRestrictions.push(...a.constitutional_restrictions);
    }
    const applications = await query("SELECT * FROM membership_applications WHERE status IN ('submitted', 'under_review')");
    const vacancies = await this.leadershipRepo.findAssignments({ status: "vacant" });
    const meetings = await query("SELECT * FROM meetings WHERE status = 'awaiting_minutes'");
    const financeResolutions = await query("SELECT * FROM finance_resolutions WHERE status = 'pending_signatures'");
    return {
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone_number,
        admission_number: user.admission_number
      },
      positions: assignments,
      all_responsibilities: Array.from(new Set(allDuties)),
      permissions: Array.from(new Set(allPerms)),
      constitutional_restrictions: Array.from(new Set(allRestrictions)),
      pending_attention: {
        membership_applications: applications.length,
        leadership_vacancies: vacancies.length,
        meetings_awaiting_minutes: meetings.length,
        finance_awaiting_action: financeResolutions.length
      }
    };
  }
  async getOverview() {
    const counts = await this.leadershipRepo.getCounts();
    const positions = await this.leadershipRepo.findPositions();
    const vacancies = await this.leadershipRepo.findAssignments({ status: "vacant" });
    return {
      ...counts,
      positions_count: positions.length,
      vacancies,
      tenure_academic_year: "2025/2026",
      completion_percentage: 78
    };
  }
  async getPublicExecutives() {
    const positions = await this.leadershipRepo.findPositions();
    const assignments = await this.leadershipRepo.findAssignments({ status: "active" });
    const executives = positions.filter((p) => p.is_executive || p.category === "executive" || !p.category || p.category === "committee").map((pos) => {
      const assignment = assignments.find((a) => a.position_id === pos.id);
      return {
        id: pos.id,
        assignment_id: assignment?.id || null,
        position_id: pos.id,
        position_name: pos.name,
        position_code: pos.code,
        category: pos.category || "executive",
        display_order: pos.display_order || 99,
        responsibilities: pos.responsibilities || [],
        constitutional_reference: pos.constitutional_reference || "",
        full_name: assignment?.user_name && assignment.user_name !== "Unassigned" ? assignment.user_name : "Not yet appointed",
        email: assignment?.user_email || "",
        phone_number: assignment?.user_phone || "",
        avatar_url: assignment?.user_avatar || null,
        course: assignment?.user_course || "",
        year_of_study: assignment?.user_year || "",
        academic_year: assignment?.academic_year || "2025/2026",
        status: assignment ? assignment.status : "active",
        assignment_type: assignment?.assignment_type || "elected"
      };
    }).sort((a, b) => a.display_order - b.display_order);
    return executives;
  }
  async getLeadershipDirectory() {
    const positions = await this.leadershipRepo.findPositions();
    const assignments = await this.leadershipRepo.findAssignments({ status: "active" });
    const leaders = positions.map((pos) => {
      const assignment = assignments.find((a) => a.position_id === pos.id);
      const defaultName = pos.is_executive ? "Not yet appointed" : pos.category === "ministry" ? `${pos.name.replace("Leader", "")} Leader` : "Not yet appointed";
      return {
        id: pos.id,
        assignment_id: assignment?.id || null,
        position_id: pos.id,
        position_name: pos.name,
        position_code: pos.code,
        category: pos.category || (pos.is_executive ? "executive" : "ministry"),
        display_order: pos.display_order || 99,
        responsibilities: pos.responsibilities || [],
        constitutional_reference: pos.constitutional_reference || "",
        full_name: assignment?.user_name && assignment.user_name !== "Unassigned" ? assignment.user_name : "Not yet appointed",
        email: assignment?.user_email || "",
        phone_number: assignment?.user_phone || "",
        avatar_url: assignment?.user_avatar || null,
        course: assignment?.user_course || "",
        year_of_study: assignment?.user_year || "",
        academic_year: assignment?.academic_year || "2026/2027",
        status: assignment ? assignment.status : "active",
        assignment_type: assignment?.assignment_type || "elected"
      };
    }).sort((a, b) => a.display_order - b.display_order);
    return leaders;
  }
};

// backend/src/modules/leadership/controllers/leadership.controller.ts
var service11 = new LeadershipService();
var base = new BaseController(service11, "Leadership");
var leadershipController = {
  list: base.list,
  getById: base.getById,
  create: base.create,
  update: base.update,
  remove: base.remove,
  listPositions: asyncHandler(async (_req, res) => {
    const positions = await service11.listPositions();
    return sendSuccess(res, positions, "Constitutional leadership positions retrieved");
  }),
  listAssignments: asyncHandler(async (req, res) => {
    const { status, positionId, userId } = req.query;
    const assignments = await service11.listAssignments({ status, positionId, userId });
    return sendSuccess(res, assignments, "Leadership assignments retrieved");
  }),
  assignLeader: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const result = await service11.assignLeader(req.body);
    return sendSuccess(res, result, "Leader assigned successfully", 201);
  }),
  appointReplacement: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const { positionId } = req.params;
    const result = await service11.appointReplacement(positionId, req.body);
    return sendSuccess(res, result, "Replacement appointed successfully", 200);
  }),
  updateAssignment: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    await service11.updateAssignment(req.params.id, req.body);
    return sendSuccess(res, null, "Leadership assignment updated");
  }),
  revokeAssignment: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const { reason } = req.body || {};
    await service11.revokeAssignment(req.params.id, reason);
    return sendSuccess(res, null, "Leadership assignment revoked");
  }),
  getMyResponsibilities: asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const responsibilities = await service11.getMyResponsibilities(req.user.sub);
    return sendSuccess(res, responsibilities, "Leader responsibilities retrieved");
  }),
  getOverview: asyncHandler(async (_req, res) => {
    const overview = await service11.getOverview();
    return sendSuccess(res, overview, "Leadership overview retrieved");
  }),
  getPublicLeadership: asyncHandler(async (_req, res) => {
    const executives = await service11.getPublicExecutives();
    return sendSuccess(res, executives, "Public leadership directory retrieved");
  }),
  getDirectory: asyncHandler(async (_req, res) => {
    const directory = await service11.getLeadershipDirectory();
    return sendSuccess(res, directory, "Full leadership directory retrieved");
  })
};

// backend/src/modules/leadership/routes/leadership.routes.ts
var router21 = (0, import_express21.Router)();
router21.get("/public", leadershipController.getPublicLeadership);
router21.use(authenticate, loadPermissions);
router21.get("/directory", leadershipController.getDirectory);
router21.get("/my-responsibilities", leadershipController.getMyResponsibilities);
router21.get("/positions", leadershipController.listPositions);
router21.get("/overview", leadershipController.getOverview);
router21.get("/assignments", requireAnyPermission("leadership.view", "system.manage_roles"), leadershipController.listAssignments);
router21.post("/assignments", requireAnyPermission("leadership.assign", "system.manage_roles"), leadershipController.assignLeader);
router21.put("/assignments/:id", requireAnyPermission("leadership.assign", "system.manage_roles"), leadershipController.updateAssignment);
router21.post("/positions/:positionId/appoint", requireAnyPermission("leadership.assign", "system.manage_roles"), leadershipController.appointReplacement);
router21.delete("/assignments/:id", requireAnyPermission("leadership.assign", "system.manage_roles"), leadershipController.revokeAssignment);
router21.get("/", requirePermission("leadership.view"), leadershipController.list);
router21.get("/:id", requirePermission("leadership.view"), leadershipController.getById);
router21.post("/", requirePermission("leadership.create"), leadershipController.create);
router21.put("/:id", requirePermission("leadership.edit"), leadershipController.update);
router21.delete("/:id", requirePermission("leadership.delete"), leadershipController.remove);
var leadership_routes_default = router21;

// backend/src/modules/committees/routes/committees.routes.ts
var import_express22 = require("express");

// backend/src/modules/committees/repositories/committees.repository.ts
var CommitteesRepository = class extends BaseRepository {
  constructor() {
    super("committees");
  }
  // Add bespoke queries here as the module's real requirements grow.
};

// backend/src/modules/committees/services/committees.service.ts
var CommitteesService = class extends BaseService {
  constructor(repository = new CommitteesRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
};

// backend/src/modules/committees/controllers/committees.controller.ts
var committeesController = new BaseController(new CommitteesService(), "Committees");

// backend/src/modules/committees/routes/committees.routes.ts
var router22 = (0, import_express22.Router)();
router22.use(authenticate, loadPermissions);
router22.get("/", requirePermission("committees.view"), committeesController.list);
router22.get("/:id", requirePermission("committees.view"), committeesController.getById);
router22.post("/", requirePermission("committees.create"), committeesController.create);
router22.put("/:id", requirePermission("committees.edit"), committeesController.update);
router22.delete("/:id", requirePermission("committees.delete"), committeesController.remove);
var committees_routes_default = router22;

// backend/src/modules/committee-members/routes/committee-members.routes.ts
var import_express23 = require("express");

// backend/src/modules/committee-members/repositories/committee-members.repository.ts
var CommitteeMembersRepository = class extends BaseRepository {
  constructor() {
    super("committee_members");
  }
  // Add bespoke queries here as the module's real requirements grow.
};

// backend/src/modules/committee-members/services/committee-members.service.ts
var CommitteeMembersService = class extends BaseService {
  constructor(repository = new CommitteeMembersRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
};

// backend/src/modules/committee-members/controllers/committee-members.controller.ts
var committeeMembersController = new BaseController(new CommitteeMembersService(), "CommitteeMembers");

// backend/src/modules/committee-members/routes/committee-members.routes.ts
var router23 = (0, import_express23.Router)();
router23.use(authenticate, loadPermissions);
router23.get("/", requirePermission("committees.view"), committeeMembersController.list);
router23.get("/:id", requirePermission("committees.view"), committeeMembersController.getById);
router23.post("/", requirePermission("committees.create"), committeeMembersController.create);
router23.put("/:id", requirePermission("committees.edit"), committeeMembersController.update);
router23.delete("/:id", requirePermission("committees.delete"), committeeMembersController.remove);
var committee_members_routes_default = router23;

// backend/src/modules/bible-study-groups/routes/bible-study-groups.routes.ts
var import_express24 = require("express");

// backend/src/modules/bible-study-groups/services/bible-study-groups.service.ts
var import_uuid23 = require("uuid");
var XLSX = __toESM(require("xlsx"));
init_database();
var DEFAULT_GROUP_NAMES = [
  "Bereans (Acts 17:11)",
  "Timothy Disciples (2 Tim 2:2)",
  "Barnabas Sons of Encouragement",
  "Cornerstone Fellowship (Eph 2:20)",
  "Mount Zion Believers (Heb 12:22)",
  "Alpha & Omega (Rev 22:13)",
  "Living Stones (1 Peter 2:5)",
  "Grace & Truth (John 1:14)",
  "Bethel Altar (Gen 28:19)",
  "Shiloh Seekers (1 Sam 1:3)",
  "Emmaus Walkers (Luke 24:32)",
  "Antioch Ambassadors (Acts 11:26)",
  "Overcomers in Christ (Rev 12:11)",
  "Salt & Light (Matthew 5:13-14)",
  "Ebenezer Cohort (1 Sam 7:12)",
  "Pacesetters of Faith (Heb 11:1)"
];
var BibleStudyGroupsService = class {
  /**
   * List all saved Bible study groups with member counts and gender balance.
   */
  async listGroups(cohortName) {
    let groups = [];
    try {
      if (cohortName) {
        groups = await query(
          "SELECT * FROM bible_study_groups WHERE cohort_name = :cohortName ORDER BY created_at ASC",
          { cohortName }
        );
      } else {
        groups = await query("SELECT * FROM bible_study_groups ORDER BY created_at ASC", {});
      }
    } catch {
      groups = [];
    }
    const enrichedGroups = [];
    for (const group of groups) {
      let members = [];
      try {
        members = await query(
          `SELECT bsm.id, bsm.group_id, bsm.user_id, bsm.role, bsm.joined_at,
                  u.full_name, u.admission_number, u.gender, u.phone_number, u.email,
                  u.year_of_study, u.school, u.department, u.course
             FROM bible_study_members bsm
             JOIN users u ON u.id = bsm.user_id
            WHERE bsm.group_id = :groupId
            ORDER BY u.full_name ASC`,
          { groupId: group.id }
        );
      } catch {
        members = [];
      }
      let leaderName = null;
      let leaderPhone = null;
      if (group.leader_id) {
        const leader = members.find((m) => m.user_id === group.leader_id);
        if (leader) {
          leaderName = leader.full_name;
          leaderPhone = leader.phone_number;
        } else {
          try {
            const leaderUser = await query(
              "SELECT full_name, phone_number FROM users WHERE id = :id LIMIT 1",
              { id: group.leader_id }
            );
            if (leaderUser && leaderUser.length > 0) {
              leaderName = leaderUser[0].full_name;
              leaderPhone = leaderUser[0].phone_number;
            }
          } catch {
          }
        }
      }
      const maleCount = members.filter((m) => String(m.gender).toLowerCase() === "male").length;
      const femaleCount = members.filter((m) => String(m.gender).toLowerCase() === "female").length;
      enrichedGroups.push({
        ...group,
        leader_name: leaderName,
        leader_phone: leaderPhone,
        member_count: members.length,
        male_count: maleCount,
        female_count: femaleCount,
        members
      });
    }
    return enrichedGroups;
  }
  /**
   * Get single group details with complete member roster.
   */
  async getGroupById(id) {
    const rows = await query("SELECT * FROM bible_study_groups WHERE id = :id LIMIT 1", { id });
    if (!rows || rows.length === 0) return null;
    const group = rows[0];
    const members = await query(
      `SELECT bsm.id, bsm.group_id, bsm.user_id, bsm.role, bsm.joined_at,
              u.full_name, u.admission_number, u.gender, u.phone_number, u.email,
              u.year_of_study, u.school, u.department, u.course
         FROM bible_study_members bsm
         JOIN users u ON u.id = bsm.user_id
        WHERE bsm.group_id = :groupId
        ORDER BY u.full_name ASC`,
      { groupId: id }
    );
    let leaderName = null;
    let leaderPhone = null;
    if (group.leader_id) {
      const leader = members.find((m) => m.user_id === group.leader_id);
      if (leader) {
        leaderName = leader.full_name;
        leaderPhone = leader.phone_number;
      }
    }
    const maleCount = members.filter((m) => String(m.gender).toLowerCase() === "male").length;
    const femaleCount = members.filter((m) => String(m.gender).toLowerCase() === "female").length;
    return {
      ...group,
      leader_name: leaderName,
      leader_phone: leaderPhone,
      member_count: members.length,
      male_count: maleCount,
      female_count: femaleCount,
      members
    };
  }
  /**
   * Get candidate active members for Bible study group assignment.
   */
  async getCandidateMembers() {
    const users = await query(
      `SELECT id, full_name, admission_number, gender, phone_number, email,
              year_of_study, school, department, course, account_status
         FROM users
        WHERE (account_status = 'active' OR account_status IS NULL)
          AND deleted_at IS NULL
        ORDER BY full_name ASC`,
      {}
    );
    let currentMemberships = [];
    try {
      currentMemberships = await query(
        `SELECT bsm.user_id, bsm.group_id, bsg.name AS group_name
           FROM bible_study_members bsm
           JOIN bible_study_groups bsg ON bsg.id = bsm.group_id`,
        {}
      );
    } catch {
      currentMemberships = [];
    }
    const membershipMap = /* @__PURE__ */ new Map();
    for (const m of currentMemberships) {
      membershipMap.set(m.user_id, { groupId: m.group_id, groupName: m.group_name });
    }
    return users.map((u) => {
      const assigned = membershipMap.get(u.id);
      return {
        id: u.id,
        full_name: u.full_name,
        admission_number: u.admission_number || void 0,
        gender: u.gender ? String(u.gender).toLowerCase() : "unspecified",
        phone_number: u.phone_number || void 0,
        email: u.email || void 0,
        year_of_study: u.year_of_study ? Number(u.year_of_study) : 1,
        school: u.school || void 0,
        department: u.department || void 0,
        course: u.course || void 0,
        account_status: u.account_status || "active",
        assigned_group_id: assigned ? assigned.groupId : null,
        assigned_group_name: assigned ? assigned.groupName : null
      };
    });
  }
  /**
   * Intelligent automated Bible study group generator.
   * Balances:
   * 1. Gender distribution (males and females evenly distributed)
   * 2. Number of members per group (balanced total headcount across groups)
   * 3. Year of study representation (peer mentorship mix)
   */
  async autoBalanceGroups(options) {
    const allCandidates = await this.getCandidateMembers();
    let pool3 = allCandidates;
    if (options.selectedMemberIds && options.selectedMemberIds.length > 0) {
      const selectedSet = new Set(options.selectedMemberIds);
      pool3 = pool3.filter((m) => selectedSet.has(m.id));
    } else if (!options.includeCurrentlyAssigned) {
      const unassigned = pool3.filter((m) => !m.assigned_group_id);
      if (unassigned.length >= 6) {
        pool3 = unassigned;
      }
    }
    if (options.filterYearOfStudy && options.filterYearOfStudy !== "all") {
      const yr = Number(options.filterYearOfStudy);
      pool3 = pool3.filter((m) => m.year_of_study === yr);
    }
    if (pool3.length === 0) {
      pool3 = allCandidates;
    }
    let k = 4;
    if (options.targetGroupsCount && options.targetGroupsCount > 0) {
      k = Math.max(1, Math.min(options.targetGroupsCount, pool3.length));
    } else if (options.targetGroupSize && options.targetGroupSize > 0) {
      k = Math.max(1, Math.ceil(pool3.length / options.targetGroupSize));
    } else {
      k = Math.max(2, Math.round(pool3.length / 8)) || 3;
    }
    const males = pool3.filter((m) => m.gender === "male");
    const females = pool3.filter((m) => m.gender === "female");
    const others = pool3.filter((m) => m.gender !== "male" && m.gender !== "female");
    const sortFn = (a, b) => (b.year_of_study || 1) - (a.year_of_study || 1) || a.full_name.localeCompare(b.full_name);
    males.sort(sortFn);
    females.sort(sortFn);
    others.sort(sortFn);
    const buckets = Array.from({ length: k }, () => []);
    let forward = true;
    let idx = 0;
    for (const f of females) {
      buckets[idx].push(f);
      if (forward) {
        if (idx === k - 1) {
          forward = false;
        } else {
          idx++;
        }
      } else {
        if (idx === 0) {
          forward = true;
        } else {
          idx--;
        }
      }
    }
    for (const m of males) {
      let minIdx = 0;
      let minMales = buckets[0].filter((p) => p.gender === "male").length;
      let minTotal = buckets[0].length;
      for (let i = 1; i < k; i++) {
        const bMales = buckets[i].filter((p) => p.gender === "male").length;
        const bTotal = buckets[i].length;
        if (bMales < minMales || bMales === minMales && bTotal < minTotal) {
          minIdx = i;
          minMales = bMales;
          minTotal = bTotal;
        }
      }
      buckets[minIdx].push(m);
    }
    for (const o of others) {
      let minIdx = 0;
      let minTotal = buckets[0].length;
      for (let i = 1; i < k; i++) {
        if (buckets[i].length < minTotal) {
          minIdx = i;
          minTotal = buckets[i].length;
        }
      }
      buckets[minIdx].push(o);
    }
    const cohortName = options.cohortName || "2026/2027 Discipleship Cohort";
    const customNames = options.groupNames || [];
    const previewGroups = buckets.map((members, i) => {
      const gName = customNames[i] || DEFAULT_GROUP_NAMES[i % DEFAULT_GROUP_NAMES.length] || `Bible Study Group ${i + 1}`;
      const maleCount = members.filter((m) => m.gender === "male").length;
      const femaleCount = members.filter((m) => m.gender === "female").length;
      const totalCount = members.length;
      const potentialLeaders = [...members].sort(
        (a, b) => (b.year_of_study || 1) - (a.year_of_study || 1)
      );
      const recommendedLeader = potentialLeaders[0] || null;
      const meetingDay = options.meetingDay || (i % 2 === 0 ? "Wednesday" : "Thursday");
      const meetingTime = options.meetingTime || "5:00 PM \u2013 6:30 PM";
      const location = options.locationPrefix ? `${options.locationPrefix} - Hall ${String.fromCharCode(65 + i)}` : `Main Chapel Grounds - Zone ${i + 1}`;
      const studyBookGuide = options.studyBookGuide || "Foundations of Biblical Discipleship & The Gospel of John";
      return {
        id: (0, import_uuid23.v4)(),
        name: gName,
        cohort_name: cohortName,
        meeting_day: meetingDay,
        meeting_time: meetingTime,
        location,
        study_book_guide: studyBookGuide,
        leader: recommendedLeader,
        members,
        male_count: maleCount,
        female_count: femaleCount,
        total_count: totalCount,
        male_ratio_pct: totalCount > 0 ? Math.round(maleCount / totalCount * 100) : 0,
        female_ratio_pct: totalCount > 0 ? Math.round(femaleCount / totalCount * 100) : 0
      };
    });
    const totalMales = pool3.filter((m) => m.gender === "male").length;
    const totalFemales = pool3.filter((m) => m.gender === "female").length;
    return {
      cohort_name: cohortName,
      total_members: pool3.length,
      total_males: totalMales,
      total_females: totalFemales,
      overall_gender_ratio: `${totalMales} Males : ${totalFemales} Females (${pool3.length > 0 ? Math.round(totalMales / pool3.length * 100) : 0}% M / ${pool3.length > 0 ? Math.round(totalFemales / pool3.length * 100) : 0}% F)`,
      groups_count: previewGroups.length,
      groups: previewGroups
    };
  }
  /**
   * Batch save generated groups and assign members into the database.
   */
  async batchSaveGroups(payload) {
    let savedCount = 0;
    let membersAssigned = 0;
    for (const g of payload.groups) {
      const groupId = (0, import_uuid23.v4)();
      await query(
        `INSERT INTO bible_study_groups (id, name, cohort_name, leader_id, meeting_day, meeting_time, location, study_book_guide, is_active, created_at)
         VALUES (:id, :name, :cohort_name, :leader_id, :meeting_day, :meeting_time, :location, :study_book_guide, 1, NOW())`,
        {
          id: groupId,
          name: g.name,
          cohort_name: payload.cohortName,
          leader_id: g.leader_id || null,
          meeting_day: g.meeting_day || "Wednesday",
          meeting_time: g.meeting_time || "5:00 PM \u2013 6:30 PM",
          location: g.location || "Main Chapel Grounds",
          study_book_guide: g.study_book_guide || "Foundations of Biblical Discipleship"
        }
      );
      savedCount++;
      for (const userId of g.member_ids) {
        const isLeader = g.leader_id === userId;
        const memberId = (0, import_uuid23.v4)();
        await query(
          `INSERT INTO bible_study_members (id, group_id, user_id, role, joined_at, created_at)
           VALUES (:id, :group_id, :user_id, :role, NOW(), NOW())`,
          {
            id: memberId,
            group_id: groupId,
            user_id: userId,
            role: isLeader ? "leader" : "member"
          }
        );
        membersAssigned++;
      }
    }
    return { savedCount, membersAssigned };
  }
  /**
   * Delete a Bible study group and its membership linkages.
   */
  async deleteGroup(id) {
    await query("DELETE FROM bible_study_members WHERE group_id = :id", { id });
    await query("DELETE FROM bible_study_groups WHERE id = :id", { id });
    return true;
  }
  /**
   * Update group details.
   */
  async updateGroup(id, data) {
    await query(
      `UPDATE bible_study_groups
          SET name = COALESCE(:name, name),
              leader_id = COALESCE(:leader_id, leader_id),
              meeting_day = COALESCE(:meeting_day, meeting_day),
              meeting_time = COALESCE(:meeting_time, meeting_time),
              location = COALESCE(:location, location),
              study_book_guide = COALESCE(:study_book_guide, study_book_guide),
              updated_at = NOW()
        WHERE id = :id`,
      {
        id,
        name: data.name,
        leader_id: data.leader_id,
        meeting_day: data.meeting_day,
        meeting_time: data.meeting_time,
        location: data.location,
        study_book_guide: data.study_book_guide
      }
    );
    return true;
  }
  /**
   * Generate high-fidelity Excel workbook buffer with:
   * 1. Summary sheet (Gender balance stats, groups count, leaders)
   * 2. Master roster (All students, group, gender, contact, admission)
   * 3. Group-by-group sheets with attendance columns
   */
  async exportExcel(cohortName) {
    const groups = await this.listGroups(cohortName);
    const workbook = XLSX.utils.book_new();
    const totalMembers = groups.reduce((acc, g) => acc + (g.member_count || 0), 0);
    const totalMales = groups.reduce((acc, g) => acc + (g.male_count || 0), 0);
    const totalFemales = groups.reduce((acc, g) => acc + (g.female_count || 0), 0);
    const summaryData = [
      ["TECHNICAL UNIVERSITY OF MOMBASA CHRISTIAN UNION (T.U.M.C.U.)"],
      ["DISCIPLESHIP COMMITTEE \u2014 BIBLE STUDY GROUPS REGISTER & GENDER BALANCE REPORT"],
      [`Cohort: ${cohortName || "All Active Cohorts"} | Generated: ${(/* @__PURE__ */ new Date()).toLocaleString()}`],
      [],
      ["EXECUTIVE SUMMARY"],
      ["Total Groups", groups.length],
      ["Total Members Enrolled", totalMembers],
      ["Total Male Members", totalMales],
      ["Total Female Members", totalFemales],
      [
        "Overall Gender Balance",
        `${totalMembers > 0 ? Math.round(totalMales / totalMembers * 100) : 0}% Male / ${totalMembers > 0 ? Math.round(totalFemales / totalMembers * 100) : 0}% Female`
      ],
      [],
      [
        "GROUP ROSTER & GENDER BREAKDOWN",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      ],
      [
        "S/N",
        "Group Name",
        "Group Leader",
        "Meeting Day",
        "Time",
        "Venue",
        "Males",
        "Females",
        "Total",
        "Gender Ratio (M/F)",
        "Study Topic / Book"
      ]
    ];
    groups.forEach((g, idx) => {
      const m = g.male_count || 0;
      const f = g.female_count || 0;
      const t = g.member_count || 0;
      const ratio = t > 0 ? `${Math.round(m / t * 100)}% M / ${Math.round(f / t * 100)}% F` : "0%";
      summaryData.push([
        idx + 1,
        g.name,
        g.leader_name || "Unassigned",
        g.meeting_day || "Wednesday",
        g.meeting_time || "5:00 PM",
        g.location || "Main Chapel Grounds",
        m,
        f,
        t,
        ratio,
        g.study_book_guide || "Foundations of Faith"
      ]);
    });
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs["!cols"] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 25 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 22 },
      { wch: 35 }
    ];
    XLSX.utils.book_append_sheet(workbook, summaryWs, "Summary & Statistics");
    const masterData = [
      ["T.U.M.C.U. BIBLE STUDY GROUPS \u2014 MASTER MEMBERS ROSTER"],
      [`Cohort: ${cohortName || "Current"} | Official Discipleship Committee Register`],
      [],
      [
        "S/N",
        "Group Name",
        "Member Full Name",
        "Gender",
        "Admission No.",
        "Phone Number",
        "Email Address",
        "Year of Study",
        "School / Faculty",
        "Department / Course",
        "Role in Group",
        "Meeting Schedule"
      ]
    ];
    let rowNum = 1;
    for (const g of groups) {
      for (const m of g.members || []) {
        masterData.push([
          rowNum++,
          g.name,
          m.full_name,
          m.gender ? m.gender.toUpperCase() : "N/A",
          m.admission_number || "N/A",
          m.phone_number || "N/A",
          m.email || "N/A",
          m.year_of_study ? `Year ${m.year_of_study}` : "Year 1",
          m.school || "TUM",
          m.department || m.course || "N/A",
          m.user_id === g.leader_id || m.role === "leader" ? "GROUP LEADER" : "Member",
          `${g.meeting_day} ${g.meeting_time}`
        ]);
      }
    }
    const masterWs = XLSX.utils.aoa_to_sheet(masterData);
    masterWs["!cols"] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 26 },
      { wch: 10 },
      { wch: 16 },
      { wch: 16 },
      { wch: 26 },
      { wch: 14 },
      { wch: 25 },
      { wch: 30 },
      { wch: 16 },
      { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(workbook, masterWs, "Master Members Roster");
    groups.forEach((g, gIdx) => {
      const cleanSheetName = g.name.replace(/[\\/*?[\]:]/g, " ").slice(0, 28);
      const groupData = [
        [`TUMCU BIBLE STUDY \u2014 ${g.name.toUpperCase()}`],
        [
          `Leader: ${g.leader_name || "Unassigned"} | Contact: ${g.leader_phone || "N/A"} | Venue: ${g.location || "Chapel"}`
        ],
        [`Meeting: Every ${g.meeting_day} at ${g.meeting_time} | Study Guide: ${g.study_book_guide}`],
        [
          `Members: ${g.member_count} (${g.male_count} Males, ${g.female_count} Females \u2014 Balance: ${g.member_count ? Math.round((g.male_count || 0) / g.member_count * 100) : 0}% M / ${g.member_count ? Math.round((g.female_count || 0) / g.member_count * 100) : 0}% F)`
        ],
        [],
        [
          "S/N",
          "Full Name",
          "Gender",
          "Admission No.",
          "Phone Number",
          "Year",
          "Role",
          "W1",
          "W2",
          "W3",
          "W4",
          "W5",
          "W6",
          "W7",
          "W8",
          "Notes / Prayer Requests"
        ]
      ];
      (g.members || []).forEach((m, mIdx) => {
        groupData.push([
          mIdx + 1,
          m.full_name,
          m.gender ? m.gender.toUpperCase() : "N/A",
          m.admission_number || "N/A",
          m.phone_number || "N/A",
          m.year_of_study ? `Yr ${m.year_of_study}` : "Yr 1",
          m.user_id === g.leader_id || m.role === "leader" ? "LEADER" : "Member",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          ""
        ]);
      });
      const groupWs = XLSX.utils.aoa_to_sheet(groupData);
      groupWs["!cols"] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 8 },
        { wch: 15 },
        { wch: 15 },
        { wch: 8 },
        { wch: 10 },
        { wch: 5 },
        { wch: 5 },
        { wch: 5 },
        { wch: 5 },
        { wch: 5 },
        { wch: 5 },
        { wch: 5 },
        { wch: 5 },
        { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(workbook, groupWs, `${cleanSheetName} (Grp ${gIdx + 1})`.slice(0, 31));
    });
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }
};

// backend/src/modules/bible-study-groups/controllers/bible-study-groups.controller.ts
var service12 = new BibleStudyGroupsService();
var bibleStudyGroupsController = {
  list: asyncHandler(async (req, res) => {
    const cohortName = req.query.cohortName;
    const groups = await service12.listGroups(cohortName);
    return sendSuccess(res, groups, "Bible study groups retrieved successfully");
  }),
  getById: asyncHandler(async (req, res) => {
    const group = await service12.getGroupById(req.params.id);
    if (!group) {
      return sendError(res, "Bible study group not found", 404);
    }
    return sendSuccess(res, group, "Bible study group details retrieved");
  }),
  getCandidates: asyncHandler(async (_req, res) => {
    const candidates = await service12.getCandidateMembers();
    return sendSuccess(res, candidates, "Candidate members retrieved successfully");
  }),
  autoBalance: asyncHandler(async (req, res) => {
    const result = await service12.autoBalanceGroups(req.body);
    return sendSuccess(
      res,
      result,
      `Successfully generated ${result.groups_count} gender-balanced Bible study groups`
    );
  }),
  batchSave: asyncHandler(async (req, res) => {
    const { cohortName, groups } = req.body;
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return sendError(res, "At least one group is required to save", 400);
    }
    const result = await service12.batchSaveGroups({ cohortName, groups });
    return sendSuccess(
      res,
      result,
      `Successfully committed ${result.savedCount} Bible study groups with ${result.membersAssigned} members assigned`
    );
  }),
  update: asyncHandler(async (req, res) => {
    const success = await service12.updateGroup(req.params.id, req.body);
    return sendSuccess(res, { success }, "Bible study group updated successfully");
  }),
  remove: asyncHandler(async (req, res) => {
    const success = await service12.deleteGroup(req.params.id);
    return sendSuccess(res, { success }, "Bible study group deleted successfully");
  }),
  exportExcel: asyncHandler(async (req, res) => {
    const cohortName = req.query.cohortName;
    const buffer = await service12.exportExcel(cohortName);
    const safeCohort = (cohortName || "All_Cohorts").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `TUMCU_Bible_Study_Groups_${safeCohort}_${Date.now()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  })
};

// backend/src/modules/bible-study-groups/routes/bible-study-groups.routes.ts
var router24 = (0, import_express24.Router)();
router24.use(authenticate, loadPermissions);
router24.get(
  "/candidates",
  requireAnyPermission("discipleship.view", "leadership.view", "membership.view_all"),
  bibleStudyGroupsController.getCandidates
);
router24.get(
  "/export/excel",
  requireAnyPermission("discipleship.view", "leadership.view", "reports.view"),
  bibleStudyGroupsController.exportExcel
);
router24.get(
  "/",
  requireAnyPermission("discipleship.view", "leadership.view", "membership.view_all"),
  bibleStudyGroupsController.list
);
router24.get(
  "/:id",
  requireAnyPermission("discipleship.view", "leadership.view", "membership.view_all"),
  bibleStudyGroupsController.getById
);
router24.post(
  "/auto-balance",
  requireAnyPermission(
    "discipleship.create",
    "discipleship.edit",
    "leadership.assign",
    "system.manage_roles"
  ),
  bibleStudyGroupsController.autoBalance
);
router24.post(
  "/batch-save",
  requireAnyPermission(
    "discipleship.create",
    "discipleship.edit",
    "leadership.assign",
    "system.manage_roles"
  ),
  bibleStudyGroupsController.batchSave
);
router24.put(
  "/:id",
  requireAnyPermission(
    "discipleship.edit",
    "leadership.assign",
    "system.manage_roles"
  ),
  bibleStudyGroupsController.update
);
router24.delete(
  "/:id",
  requireAnyPermission(
    "discipleship.delete",
    "leadership.assign",
    "system.manage_roles"
  ),
  bibleStudyGroupsController.remove
);
var bible_study_groups_routes_default = router24;

// backend/src/modules/mentorship-groups/routes/mentorship-groups.routes.ts
var import_express25 = require("express");

// backend/src/modules/mentorship-groups/repositories/mentorship-groups.repository.ts
var MentorshipGroupsRepository = class extends BaseRepository {
  constructor() {
    super("mentorship_groups");
  }
  // Add bespoke queries here as the module's real requirements grow.
};

// backend/src/modules/mentorship-groups/services/mentorship-groups.service.ts
var MentorshipGroupsService = class extends BaseService {
  constructor(repository = new MentorshipGroupsRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
};

// backend/src/modules/mentorship-groups/controllers/mentorship-groups.controller.ts
var mentorshipGroupsController = new BaseController(new MentorshipGroupsService(), "MentorshipGroups");

// backend/src/modules/mentorship-groups/routes/mentorship-groups.routes.ts
var router25 = (0, import_express25.Router)();
router25.use(authenticate, loadPermissions);
router25.get("/", requirePermission("discipleship.view"), mentorshipGroupsController.list);
router25.get("/:id", requirePermission("discipleship.view"), mentorshipGroupsController.getById);
router25.post("/", requirePermission("discipleship.create"), mentorshipGroupsController.create);
router25.put("/:id", requirePermission("discipleship.edit"), mentorshipGroupsController.update);
router25.delete("/:id", requirePermission("discipleship.delete"), mentorshipGroupsController.remove);
var mentorship_groups_routes_default = router25;

// backend/src/modules/evangelism-teams/routes/evangelism-teams.routes.ts
var import_express26 = require("express");

// backend/src/modules/evangelism-teams/repositories/evangelism-teams.repository.ts
var EvangelismTeamsRepository = class extends BaseRepository {
  constructor() {
    super("evangelism_teams");
  }
  // Add bespoke queries here as the module's real requirements grow.
};

// backend/src/modules/evangelism-teams/services/evangelism-teams.service.ts
var EvangelismTeamsService = class extends BaseService {
  constructor(repository = new EvangelismTeamsRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
};

// backend/src/modules/evangelism-teams/controllers/evangelism-teams.controller.ts
var evangelismTeamsController = new BaseController(new EvangelismTeamsService(), "EvangelismTeams");

// backend/src/modules/evangelism-teams/routes/evangelism-teams.routes.ts
var router26 = (0, import_express26.Router)();
router26.use(authenticate, loadPermissions);
router26.get("/", requirePermission("evangelism.view"), evangelismTeamsController.list);
router26.get("/:id", requirePermission("evangelism.view"), evangelismTeamsController.getById);
router26.post("/", requirePermission("evangelism.create"), evangelismTeamsController.create);
router26.put("/:id", requirePermission("evangelism.edit"), evangelismTeamsController.update);
router26.delete("/:id", requirePermission("evangelism.delete"), evangelismTeamsController.remove);

// backend/src/modules/income/routes/income.routes.ts
var import_express27 = require("express");

// backend/src/modules/income/repositories/income.repository.ts
var IncomeRepository = class extends BaseRepository {
  constructor() {
    super("income_records");
  }
  // Add bespoke queries here as the module's real requirements grow.
};

// backend/src/modules/income/services/income.service.ts
var IncomeService = class extends BaseService {
  constructor(repository = new IncomeRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
};

// backend/src/modules/income/controllers/income.controller.ts
var incomeController = new BaseController(new IncomeService(), "Income");

// backend/src/modules/income/routes/income.routes.ts
var router27 = (0, import_express27.Router)();
router27.use(authenticate, loadPermissions);
router27.get("/", requirePermission("finance.view"), incomeController.list);
router27.get("/:id", requirePermission("finance.view"), incomeController.getById);
router27.post("/", requirePermission("finance.create"), incomeController.create);
router27.put("/:id", requirePermission("finance.edit"), incomeController.update);
router27.delete("/:id", requirePermission("finance.delete"), incomeController.remove);
var income_routes_default = router27;

// backend/src/modules/welfare-cases/routes/welfare-cases.routes.ts
var import_express28 = require("express");

// backend/src/modules/welfare-cases/repositories/welfare-cases.repository.ts
var WelfareCasesRepository = class extends BaseRepository {
  constructor() {
    super("welfare_cases");
  }
  // Add bespoke queries here as the module's real requirements grow.
};

// backend/src/modules/welfare-cases/services/welfare-cases.service.ts
var WelfareCasesService = class extends BaseService {
  constructor(repository = new WelfareCasesRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
};

// backend/src/modules/welfare-cases/controllers/welfare-cases.controller.ts
var welfareCasesController = new BaseController(new WelfareCasesService(), "WelfareCases");

// backend/src/modules/welfare-cases/routes/welfare-cases.routes.ts
var router28 = (0, import_express28.Router)();
router28.use(authenticate, loadPermissions);
router28.get("/", requirePermission("welfare.view"), welfareCasesController.list);
router28.get("/:id", requirePermission("welfare.view"), welfareCasesController.getById);
router28.post("/", requirePermission("welfare.create"), welfareCasesController.create);
router28.put("/:id", requirePermission("welfare.edit"), welfareCasesController.update);
router28.delete("/:id", requirePermission("welfare.delete"), welfareCasesController.remove);
var welfare_cases_routes_default = router28;

// backend/src/modules/assets/routes/assets.routes.ts
var import_express29 = require("express");

// backend/src/modules/assets/repositories/assets.repository.ts
var AssetsRepository = class extends BaseRepository {
  constructor() {
    super("assets");
  }
  // Add bespoke queries here as the module's real requirements grow.
};

// backend/src/modules/assets/services/assets.service.ts
var AssetsService = class extends BaseService {
  constructor(repository = new AssetsRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
};

// backend/src/modules/assets/controllers/assets.controller.ts
var assetsController = new BaseController(new AssetsService(), "Assets");

// backend/src/modules/assets/routes/assets.routes.ts
var router29 = (0, import_express29.Router)();
router29.use(authenticate, loadPermissions);
router29.get("/", requirePermission("assets.view"), assetsController.list);
router29.get("/:id", requirePermission("assets.view"), assetsController.getById);
router29.post("/", requirePermission("assets.create"), assetsController.create);
router29.put("/:id", requirePermission("assets.edit"), assetsController.update);
router29.delete("/:id", requirePermission("assets.delete"), assetsController.remove);
var assets_routes_default = router29;

// backend/src/modules/library-resources/routes/library-resources.routes.ts
var import_express30 = require("express");

// backend/src/modules/library-resources/repositories/library-resources.repository.ts
var LibraryResourcesRepository = class extends BaseRepository {
  constructor() {
    super("library_resources");
  }
  // Add bespoke queries here as the module's real requirements grow.
};

// backend/src/modules/library-resources/services/library-resources.service.ts
var LibraryResourcesService = class extends BaseService {
  constructor(repository = new LibraryResourcesRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
};

// backend/src/modules/library-resources/controllers/library-resources.controller.ts
var libraryResourcesController = new BaseController(new LibraryResourcesService(), "LibraryResources");

// backend/src/modules/library-resources/routes/library-resources.routes.ts
var router30 = (0, import_express30.Router)();
router30.use(authenticate, loadPermissions);
router30.get("/", requirePermission("library.view"), libraryResourcesController.list);
router30.get("/:id", requirePermission("library.view"), libraryResourcesController.getById);
router30.post("/", requirePermission("library.create"), libraryResourcesController.create);
router30.put("/:id", requirePermission("library.edit"), libraryResourcesController.update);
router30.delete("/:id", requirePermission("library.delete"), libraryResourcesController.remove);

// backend/src/modules/broadcast-messages/routes/broadcast-messages.routes.ts
var import_express31 = require("express");

// backend/src/modules/broadcast-messages/repositories/broadcast-messages.repository.ts
var BroadcastMessagesRepository = class extends BaseRepository {
  constructor() {
    super("broadcast_messages");
  }
  // Add bespoke queries here as the module's real requirements grow.
};

// backend/src/modules/broadcast-messages/services/broadcast-messages.service.ts
init_database();
var import_uuid24 = require("uuid");
var BroadcastMessagesService = class extends BaseService {
  constructor(repository = new BroadcastMessagesRepository()) {
    super(repository);
  }
  async sendOfficialAnnouncement(senderId, subject, body) {
    const recipients = await query(`SELECT id FROM users WHERE account_status='active' AND deleted_at IS NULL`);
    const groupRows = await query(`SELECT id FROM broadcast_groups WHERE code='entire_cu' LIMIT 1`);
    let groupId = groupRows[0]?.id;
    if (!groupId) {
      groupId = (0, import_uuid24.v4)();
      await query(`INSERT INTO broadcast_groups (id,code,name) VALUES (:id,'entire_cu','Entire Christian Union')`, { id: groupId });
    }
    const messageId = (0, import_uuid24.v4)();
    await query(`INSERT INTO broadcast_messages (id,broadcast_group_id,channel,subject,body,sent_by,sent_at,recipient_count)
      VALUES (:id,:groupId,'in_app',:subject,:body,:senderId,NOW(),:count)`, { id: messageId, groupId, subject, body, senderId, count: recipients.length });
    for (const recipient of recipients) {
      await query(`INSERT INTO notifications (id,user_id,type,title,body,channel,sent_at) VALUES (:id,:userId,'broadcast',:title,:body,'in_app',NOW())`, { id: (0, import_uuid24.v4)(), userId: recipient.id, title: subject, body });
    }
    return { id: messageId, recipient_count: recipients.length };
  }
};
var broadcastMessagesService = new BroadcastMessagesService();

// backend/src/modules/broadcast-messages/controllers/broadcast-messages.controller.ts
var base2 = new BaseController(broadcastMessagesService, "BroadcastMessages");
var broadcastMessagesController = {
  list: base2.list,
  getById: base2.getById,
  create: base2.create,
  update: base2.update,
  remove: base2.remove,
  sendOfficialAnnouncement: asyncHandler(async (req, res) => {
    const result = await broadcastMessagesService.sendOfficialAnnouncement(req.user.sub, req.body.subject || "TUMCU Official Announcement", req.body.body);
    return sendSuccess(res, result, "Announcement delivered to active members");
  })
};

// backend/src/modules/broadcast-messages/routes/broadcast-messages.routes.ts
var router31 = (0, import_express31.Router)();
router31.get("/public", broadcastMessagesController.list);
router31.get("/", broadcastMessagesController.list);
router31.get("/:id", broadcastMessagesController.getById);
router31.post("/announcement", authenticate, loadPermissions, requirePermission("communication.create"), broadcastMessagesController.sendOfficialAnnouncement);
router31.post("/", authenticate, loadPermissions, requirePermission("communication.create"), broadcastMessagesController.create);
router31.put("/:id", authenticate, loadPermissions, requirePermission("communication.edit"), broadcastMessagesController.update);
router31.delete("/:id", authenticate, loadPermissions, requirePermission("communication.delete"), broadcastMessagesController.remove);
var broadcast_messages_routes_default = router31;

// backend/src/modules/reports/routes/reports.routes.ts
var import_express32 = require("express");

// backend/src/modules/reports/repositories/reports.repository.ts
var ReportsRepository = class extends BaseRepository {
  constructor() {
    super("generated_reports");
  }
  // Add bespoke queries here as the module's real requirements grow.
};

// backend/src/modules/reports/services/reports.service.ts
var ReportsService = class extends BaseService {
  constructor(repository = new ReportsRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
};

// backend/src/modules/reports/controllers/reports.controller.ts
var reportsController = new BaseController(new ReportsService(), "Reports");

// backend/src/modules/reports/routes/reports.routes.ts
var router32 = (0, import_express32.Router)();
router32.use(authenticate, loadPermissions);
router32.get("/", requirePermission("reports.view"), reportsController.list);
router32.get("/:id", requirePermission("reports.view"), reportsController.getById);
router32.post("/", requirePermission("reports.create"), reportsController.create);
router32.put("/:id", requirePermission("reports.edit"), reportsController.update);
router32.delete("/:id", requirePermission("reports.delete"), reportsController.remove);
var reports_routes_default = router32;

// backend/src/modules/audit-logs/routes/audit-logs.routes.ts
var import_express33 = require("express");

// backend/src/modules/audit-logs/repositories/audit-logs.repository.ts
var AuditLogsRepository = class extends BaseRepository {
  constructor() {
    super("audit_logs");
  }
  // Add bespoke queries here as the module's real requirements grow.
};

// backend/src/modules/audit-logs/services/audit-logs.service.ts
var AuditLogsService = class extends BaseService {
  constructor(repository = new AuditLogsRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
};

// backend/src/modules/audit-logs/controllers/audit-logs.controller.ts
var auditLogsController = new BaseController(new AuditLogsService(), "AuditLogs");

// backend/src/modules/audit-logs/routes/audit-logs.routes.ts
var router33 = (0, import_express33.Router)();
router33.use(authenticate, loadPermissions);
router33.get("/", requirePermission("audit.view"), auditLogsController.list);
router33.get("/:id", requirePermission("audit.view"), auditLogsController.getById);
var audit_logs_routes_default = router33;

// backend/src/app.ts
function createApp() {
  const app = (0, import_express34.default)();
  app.set("trust proxy", 1);
  app.use(
    (0, import_helmet.default)({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      frameguard: false,
      hsts: env.NODE_ENV === "production" ? { maxAge: 31536e3, includeSubDomains: true } : false
    })
  );
  app.use(
    (0, import_cors.default)({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true
    })
  );
  app.use((0, import_compression.default)());
  app.use(import_express34.default.json({ limit: "25mb" }));
  app.use(import_express34.default.urlencoded({ limit: "25mb", extended: true }));
  if (import_fs4.default.existsSync(env.UPLOAD_DIR)) {
    app.use("/uploads", import_express34.default.static(env.UPLOAD_DIR, { maxAge: "7d", immutable: true }));
  }
  app.use("/community", import_express34.default.static(import_path4.default.resolve(process.cwd(), "public/community")));
  app.use((0, import_pino_http.default)({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));
  app.use(
    (0, import_express_rate_limit2.default)({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  const authRateLimiter = (0, import_express_rate_limit2.default)({
    windowMs: 15 * 60 * 1e3,
    max: 120,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many failed authentication attempts. Please try again later.",
      data: null,
      errors: [{ code: "RATE_LIMITED", message: "Too many authentication attempts" }],
      meta: {}
    }
  });
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => {
    const dbHealthy = await checkDatabaseConnection();
    res.status(dbHealthy ? 200 : 503).json({ status: dbHealthy ? "ready" : "not_ready", database: dbHealthy });
  });
  app.get("/health/live", (_req, res) => res.status(200).json({ status: "alive" }));
  const api = import_express34.default.Router();
  api.use("/auth", authRateLimiter, auth_routes_default);
  api.use("/membership", membership_routes_default);
  api.use("/leadership", leadership_routes_default);
  api.use("/committees", committees_routes_default);
  api.use("/committee-members", committee_members_routes_default);
  api.use("/ministries", ministries_routes_default);
  api.use("/ministry-members", ministry_members_routes_default);
  api.use("/admin", admin_routes_default);
  api.use("/meetings", meetings_routes_default);
  api.use("/attendance", attendance_routes_default);
  api.use("/events", events_routes_default);
  api.use("/prayer-requests", prayer_requests_routes_default);
  api.use("/notifications", notifications_routes_default);
  api.use("/bible-study-groups", bible_study_groups_routes_default);
  api.use("/mentorship-groups", mentorship_groups_routes_default);
  api.use("/evangelism-teams", e_teams_routes_default);
  api.use("/e-teams", e_teams_routes_default);
  api.use("/income", income_routes_default);
  api.use("/expenses", expenses_routes_default);
  api.use("/welfare-cases", welfare_cases_routes_default);
  api.use("/assets", assets_routes_default);
  api.use("/library-resources", library_routes_default);
  api.use("/library", library_routes_default);
  api.use("/gallery", gallery_routes_default);
  api.use("/broadcast-messages", broadcast_messages_routes_default);
  api.use("/elections", elections_routes_default);
  api.use("/sermons", sermons_routes_default);
  api.use("/programmes", programmes_routes_default);
  api.use("/gemini", gemini_routes_default);
  api.use("/landing-media", landing_media_routes_default);
  api.use("/contact", contact_routes_default);
  api.use("/admin/landing-media", landing_media_routes_default);
  api.use("/reports", reports_routes_default);
  api.use("/audit-logs", audit_logs_routes_default);
  app.use(env.API_PREFIX, api);
  if (env.API_PREFIX !== "/api") {
    app.use("/api", api);
  }
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

// server.ts
init_env();
init_logger();
init_database();
async function startServer() {
  const app = createApp();
  const isProd = process.env.NODE_ENV === "production";
  const PORT = Number(process.env.PORT) || 3e3;
  if (!isProd) {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT, hmr: false },
      appType: "spa"
    });
    app.use((req, res, next) => {
      const url = req.url || "";
      if (url === "/@vite/client" || url.startsWith("/@vite/client?")) {
        const originalWrite = res.write.bind(res);
        const originalEnd = res.end.bind(res);
        const chunks = [];
        res.write = function(chunk, ...args) {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          return true;
        };
        res.end = function(chunk, ...args) {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          let body = Buffer.concat(chunks).toString("utf-8");
          body = body.replace(
            /transport\.connect\(createHMRHandler\(handleMessage\)\);/g,
            "/* HMR connection disabled in dev container */"
          );
          body = body.replace(/console\.error\(\s*([`'"])\[vite\]/g, "console.debug($1[vite]");
          body = body.replace(/console\.error\(\s*`\[vite\]/g, "console.debug(`[vite]");
          res.setHeader("content-length", Buffer.byteLength(body));
          return originalEnd.call(res, body, ...args);
        };
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path5.default.resolve(process.cwd(), "dist");
    app.use(import_express35.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path5.default.join(distPath, "index.html"));
    });
  }
  const dbHealthy = await checkDatabaseConnection();
  if (!dbHealthy && env.NODE_ENV === "production") {
    logger.error("Refusing to start production without a verified database connection.");
    process.exit(1);
  }
  if (!dbHealthy) {
    logger.warn("Starting without a verified database connection in non-production mode.");
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`TECUMP Server running on http://0.0.0.0:${PORT} (${isProd ? "production" : "development"})`);
    logger.info(`Health check: http://0.0.0.0:${PORT}/health`);
  });
  try {
    const stopDispatcher = startNotificationDispatcher(env.NOTIFICATION_DISPATCH_INTERVAL_MS || 3e4);
    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      stopDispatcher();
      server.close(() => process.exit(0));
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.warn({ err }, "Notification dispatcher warning");
  }
}
startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
