import { z } from "zod";

// ==========================================
// 1. Enum Tipleri & Şemaları
// ==========================================

export const EventTypeEnum = z.enum([
  "AUTH_LOGIN",
  "AUTH_FAILED",
  "NETWORK_CONNECT",
  "NETWORK_SCAN",
  "FILE_ACCESS",
  "PROCESS_EXEC",
  "DATA_TRANSFER",
  "API_CALL",
]);
export type EventType = z.infer<typeof EventTypeEnum>;

export const SeverityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type Severity = z.infer<typeof SeverityEnum>;

export const AlertStatusEnum = z.enum([
  "OPEN",
  "ASSIGNED",
  "TRIAGED",
  "RESOLVED",
  "CLOSED",
]);
export type AlertStatus = z.infer<typeof AlertStatusEnum>;

export const IncidentPriorityEnum = z.enum(["P1", "P2", "P3", "P4"]);
export type IncidentPriority = z.infer<typeof IncidentPriorityEnum>;

export const IncidentStatusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "MITIGATED",
  "CLOSED",
]);
export type IncidentStatus = z.infer<typeof IncidentStatusEnum>;

export const UserRoleEnum = z.enum(["ADMIN", "ANALYST", "VIEWER"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const IncidentActionEnum = z.enum([
  "COMMENT",
  "STATUS_CHANGE",
  "ASSIGN",
  "MITIGATION",
]);
export type IncidentAction = z.infer<typeof IncidentActionEnum>;

// ==========================================
// 2. Security Event Şemaları (Ingestion & DB)
// ==========================================

export const SecurityEventSchema = z.object({
  id: z.string().cuid().optional(),
  timestamp: z.coerce.date().default(() => new Date()),
  type: EventTypeEnum,
  sourceIp: z.string().ip(),
  destIp: z.string().ip().optional().nullable(),
  sourcePort: z.number().int().min(0).max(65535).optional().nullable(),
  destPort: z.number().int().min(0).max(65535).optional().nullable(),
  username: z.string().min(1).max(256).optional().nullable(),
  userAgent: z.string().max(1000).optional().nullable(),
  path: z.string().max(2000).optional().nullable(),
  payload: z.record(z.any()).optional().nullable(),
  geoCountry: z.string().length(2).optional().nullable(), // ISO 3166-1 alpha-2 (TR, US vs.)
});
export type SecurityEvent = z.infer<typeof SecurityEventSchema>;

const MAX_PAYLOAD_JSON_BYTES = 10_000;

export const IngestEventPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  timestamp: z.union([z.coerce.date(), z.string()]).optional(),
  type: EventTypeEnum,
  sourceIp: z.string().ip(),
  destIp: z.string().ip().optional(),
  sourcePort: z.number().int().min(0).max(65535).optional(),
  destPort: z.number().int().min(0).max(65535).optional(),
  username: z.string().max(256).optional(),
  userAgent: z.string().max(1000).optional(),
  path: z.string().max(2000).optional(),
  payload: z
    .record(z.any())
    .optional()
    .refine((p) => !p || JSON.stringify(p).length <= MAX_PAYLOAD_JSON_BYTES, {
      message: `payload JSON ${MAX_PAYLOAD_JSON_BYTES} bayttan büyük olamaz.`,
    }),
  geoCountry: z.string().length(2).optional(),
});
export type IngestEventPayload = z.infer<typeof IngestEventPayloadSchema>;

export const IngestBatchPayloadSchema = z.object({
  events: z.array(IngestEventPayloadSchema).min(1).max(1000),
});
export type IngestBatchPayload = z.infer<typeof IngestBatchPayloadSchema>;

// ==========================================
// 3. Kural (Rule) & Eşleşme Şemaları
// ==========================================

export const RuleSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(3).max(128),
  description: z.string().min(5).max(1000),
  eventTypes: z.array(EventTypeEnum).min(1),
  windowSec: z.number().int().min(5).max(86400).default(600), // Varsayılan 10 dk
  threshold: z.number().int().min(1).max(100000).default(5),
  severity: SeverityEnum.default("MEDIUM"),
  attackTactic: z.string().min(2),
  attackTechnique: z.string().min(2), // Örn: T1110.001
  attackName: z.string().min(2),
  enabled: z.boolean().default(true),
  createdAt: z.coerce.date().optional(),
});
export type Rule = z.infer<typeof RuleSchema>;

export const CreateRuleInputSchema = RuleSchema.omit({
  id: true,
  createdAt: true,
});
export type CreateRuleInput = z.infer<typeof CreateRuleInputSchema>;

export const UpdateRuleInputSchema = CreateRuleInputSchema.partial();
export type UpdateRuleInput = z.infer<typeof UpdateRuleInputSchema>;

// ==========================================
// 4. Alert (Uyarı) Şemaları
// ==========================================

export const AlertSchema = z.object({
  id: z.string().cuid().optional(),
  ruleId: z.string(),
  triggeredAt: z.coerce.date().default(() => new Date()),
  sourceIp: z.string().ip(),
  username: z.string().optional().nullable(),
  eventCount: z.number().int().positive(),
  status: AlertStatusEnum.default("OPEN"),
  severity: SeverityEnum,
});
export type Alert = z.infer<typeof AlertSchema>;

// ==========================================
// 5. Incident & IncidentEvent Şemaları
// ==========================================

export const IncidentEventSchema = z.object({
  id: z.string().cuid().optional(),
  incidentId: z.string(),
  actor: z.string().min(1),
  action: IncidentActionEnum,
  note: z.string().max(2000).optional().nullable(),
  createdAt: z.coerce.date().default(() => new Date()),
});
export type IncidentEvent = z.infer<typeof IncidentEventSchema>;

export const IncidentSchema = z.object({
  id: z.string().cuid().optional(),
  alertId: z.string(),
  title: z.string().min(3).max(256),
  summary: z.string().max(2000).optional().nullable(),
  assignee: z.string().optional().nullable(),
  priority: IncidentPriorityEnum.default("P2"),
  status: IncidentStatusEnum.default("OPEN"),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});
export type Incident = z.infer<typeof IncidentSchema>;

export const CreateIncidentInputSchema = z.object({
  alertId: z.string(),
  title: z.string().min(3).max(256),
  summary: z.string().max(2000).optional(),
  assignee: z.string().optional(),
  priority: IncidentPriorityEnum.default("P2"),
});
export type CreateIncidentInput = z.infer<typeof CreateIncidentInputSchema>;

// ==========================================
// 6. Auth & User Şemaları
// ==========================================

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const UserPayloadSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional().nullable(),
  role: UserRoleEnum,
});
export type UserPayload = z.infer<typeof UserPayloadSchema>;

// ==========================================
// 7. Standart API Response & Pagination
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
