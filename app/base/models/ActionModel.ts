import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";

export type ActionStatus = "active" | "inactive" | "deleted";

export type Action = {
  uuid: string;
  action: string;
  description: string | null;
  status: ActionStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateActionInput = {
  action: string;
  description?: string | null;
  status?: ActionStatus;
};

export type UpdateActionInput = Partial<CreateActionInput>;

export type ActionModelAttributes = Partial<Omit<Action, "created_at" | "updated_at" | "deleted_at">> & {
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type ActionModelCreationAttributes = Partial<ActionModelAttributes>;

export class ActionModel extends Model<ActionModelAttributes, ActionModelCreationAttributes> {
  declare uuid: string;
  declare action: string;
  declare description: string | null;
  declare status: "active" | "inactive" | "deleted";
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  static toApi(action: any): Action {
    return {
      uuid: action.uuid,
      action: action.action,
      description: action.description ?? null,
      status: action.status,
      created_at: action.created_at ? new Date(action.created_at).toISOString() : new Date().toISOString(),
      updated_at: action.updated_at ? new Date(action.updated_at).toISOString() : new Date().toISOString(),
      deleted_at: action.deleted_at ? new Date(action.deleted_at).toISOString() : null,
    };
  }
}

let actionModelPromise: Promise<typeof ActionModel> | null = null;

export async function getActionModel(): Promise<typeof ActionModel> {
  if ((ActionModel as any).initialized) {
    return ActionModel;
  }
  if (!actionModelPromise) {
    actionModelPromise = initActionModel().catch((error) => {
      actionModelPromise = null;
      throw error;
    });
  }
  return actionModelPromise;
}

async function initActionModel(): Promise<typeof ActionModel> {
  const sequelize = await getSequelizeInstance();

  {
    ActionModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        action: {
          type: DataTypes.STRING(120),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue: null,
        },
        status: {
          type: DataTypes.ENUM("active", "inactive", "deleted"),
          allowNull: false,
          defaultValue: "active",
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },
      },
      {
        sequelize,
        modelName: "Action",
        tableName: "base_actions",
        timestamps: false,
        underscored: true,
      },
    );

    (ActionModel as any).initialized = true;
  }
  return ActionModel;
}

export default async function ActionModelFactory() {
  return getActionModel();
}
