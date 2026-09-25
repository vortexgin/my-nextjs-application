import { randomUUID } from "crypto";
import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";
import { connectDatabase } from "@/database/sequelize";

export type ActivityOperation = "create" | "update" | "delete";

export type ActivityActor = Record<string, unknown> | null;

const SENSITIVE_KEYS = new Set([
  "password",
  "password_confirmation",
  "token",
  "secret",
  "access_token",
  "refresh_token",
]);

/**
 * Shallow-clones request data minus secret keys (passwords, tokens).
 * Never throws; returns null for non-objects.
 */
export function sanitizeActivityData(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (!SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = value;
    }
  }
  return clean;
}

export type ActivityLog = {
  uuid: string;
  actor: Record<string, unknown> | null;
  operation: ActivityOperation;
  entity: string;
  entity_uuid: string | null;
  origin: Record<string, unknown> | null;
  updated: Record<string, unknown> | null;
  created_at: string;
};

export type CreateActivityLogInput = {
  actor?: Record<string, unknown> | null;
  operation: ActivityOperation;
  entity: string;
  entity_uuid?: string | null;
  origin?: Record<string, unknown> | null;
  updated?: Record<string, unknown> | null;
};

export type ActivityLogModelAttributes = {
  uuid: string;
  actor: Record<string, unknown> | null;
  operation: ActivityOperation;
  entity: string;
  entity_uuid: string | null;
  origin: Record<string, unknown> | null;
  updated: Record<string, unknown> | null;
  created_at: Date;
};

export type ActivityLogModelCreationAttributes = Partial<ActivityLogModelAttributes>;

export class ActivityLogModel extends Model<ActivityLogModelAttributes, ActivityLogModelCreationAttributes> {
  declare uuid: string;
  declare actor: Record<string, unknown> | null;
  declare operation: ActivityOperation;
  declare entity: string;
  declare entity_uuid: string | null;
  declare origin: Record<string, unknown> | null;
  declare updated: Record<string, unknown> | null;
  declare created_at: Date;

  static toApi(activityLog: any): ActivityLog {
    return {
      uuid: activityLog.uuid,
      actor: (activityLog.actor as Record<string, unknown> | undefined) ?? null,
      operation: activityLog.operation,
      entity: activityLog.entity,
      entity_uuid: activityLog.entity_uuid ?? null,
      origin: (activityLog.origin as Record<string, unknown> | undefined) ?? null,
      updated: (activityLog.updated as Record<string, unknown> | undefined) ?? null,
      created_at: activityLog.created_at ? new Date(activityLog.created_at).toISOString() : new Date().toISOString(),
    };
  }
}

let activityLogModelPromise: Promise<typeof ActivityLogModel> | null = null;

export async function getActivityLogModel(): Promise<typeof ActivityLogModel> {
  if ((ActivityLogModel as any).initialized) {
    return ActivityLogModel;
  }
  if (!activityLogModelPromise) {
    activityLogModelPromise = initActivityLogModel().catch((error) => {
      activityLogModelPromise = null;
      throw error;
    });
  }
  return activityLogModelPromise;
}

async function initActivityLogModel(): Promise<typeof ActivityLogModel> {
  const sequelize = await getSequelizeInstance();

  {
    ActivityLogModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        actor: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: null,
        },
        operation: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        entity: {
          type: DataTypes.STRING(60),
          allowNull: false,
        },
        entity_uuid: {
          type: DataTypes.UUID,
          allowNull: true,
          defaultValue: null,
        },
        origin: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: null,
        },
        updated: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: null,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "ActivityLog",
        tableName: "base_activity_logs",
        timestamps: false,
        underscored: true,
      },
    );

    (ActivityLogModel as any).initialized = true;
  }
  return ActivityLogModel;
}

/**
 * Persists one activity row. Never throws: logging must not
 * break the request it observes. Failures go to console only.
 */
export async function recordActivityLog(input: CreateActivityLogInput): Promise<void> {
  try {
    await connectDatabase();
    const ActivityLogModel = await getActivityLogModel();
    await ActivityLogModel.create({
      uuid: randomUUID(),
      actor: input.actor ?? null,
      operation: input.operation,
      entity: input.entity,
      entity_uuid: input.entity_uuid ?? null,
      origin: input.origin ?? null,
      updated: input.updated ?? null,
    });
  } catch (error) {
    console.error("Failed to record activity log.", error);
  }
}

export default async function ActivityLogModelFactory() {
  return getActivityLogModel();
}
