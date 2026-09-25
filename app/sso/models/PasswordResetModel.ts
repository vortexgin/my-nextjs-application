import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";

export type PasswordReset = {
  uuid: string;
  user_id: string;
  email: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
};

export type PasswordResetModelAttributes = {
  uuid: string;
  user_id: string;
  email: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
};

export type PasswordResetModelCreationAttributes = Partial<PasswordResetModelAttributes>;

export class PasswordResetModel extends Model<PasswordResetModelAttributes, PasswordResetModelCreationAttributes> {
  declare uuid: string;
  declare user_id: string;
  declare email: string;
  declare token_hash: string;
  declare expires_at: Date;
  declare used_at: Date | null;
  declare created_at: Date;
}

let passwordResetModelPromise: Promise<typeof PasswordResetModel> | null = null;

export async function getPasswordResetModel(): Promise<typeof PasswordResetModel> {
  if ((PasswordResetModel as any).initialized) {
    return PasswordResetModel;
  }
  if (!passwordResetModelPromise) {
    passwordResetModelPromise = initPasswordResetModel().catch((error) => {
      passwordResetModelPromise = null;
      throw error;
    });
  }
  return passwordResetModelPromise;
}

async function initPasswordResetModel(): Promise<typeof PasswordResetModel> {
  const sequelize = await getSequelizeInstance();

  {
    PasswordResetModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "users", key: "uuid" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        email: {
          type: DataTypes.STRING(160),
          allowNull: false,
        },
        token_hash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        used_at: {
          type: DataTypes.DATE,
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
        modelName: "PasswordReset",
        tableName: "sso_password_resets",
        timestamps: false,
        underscored: true,
      },
    );

    const { getUserModel } = await import("@/app/base/models/UserModel");
    PasswordResetModel.belongsTo(await getUserModel(), { foreignKey: "user_id", targetKey: "uuid", as: "user" });

    (PasswordResetModel as any).initialized = true;
  }
  return PasswordResetModel;
}

export default async function PasswordResetModelFactory() {
  return getPasswordResetModel();
}
