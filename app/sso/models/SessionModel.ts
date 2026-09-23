import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";

export const SESSION_COOKIE = "sessionToken";

export type SessionModelAttributes = {
  uuid: string;
  expired_at: Date;
  created_at: Date;
  user_info: Record<string, unknown>;
  permissions: string[];
};

export type SessionModelCreationAttributes = Partial<SessionModelAttributes>;

export class SessionModel extends Model<SessionModelAttributes, SessionModelCreationAttributes> {
  declare uuid: string;
  declare expired_at: Date;
  declare created_at: Date;
  declare user_info: Record<string, unknown>;
  declare permissions: string[];
}

export async function getSessionModel(): Promise<typeof SessionModel> {
  const sequelize = await getSequelizeInstance();

  if (!(SessionModel as any).initialized) {
    SessionModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        expired_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        user_info: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        permissions: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
        },
      },
      {
        sequelize,
        modelName: "Session",
        tableName: "sessions",
        timestamps: false,
        underscored: true,
      },
    );

    (SessionModel as any).initialized = true;
  }

  return SessionModel;
}

export default async function SessionModelFactory() {
  return getSessionModel();
}
