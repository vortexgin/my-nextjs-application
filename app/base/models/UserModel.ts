import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";
import RoleModelFactory, { RoleModel, type Role } from "@/app/base/models/RoleModel";
import ActionModelFactory, { ActionModel } from "@/app/base/models/ActionModel";
import PermissionModelFactory, { PermissionModel } from "@/app/base/models/PermissionModel";
import UserRoleModelFactory, { UserRoleModel } from "@/app/base/models/UserRoleModel";

type PermissionWithAction = PermissionModel & { action?: ActionModel | null };
type RoleWithPermissions = RoleModel & { permissions?: PermissionWithAction[] };
type AssignmentWithRole = UserRoleModel & { role?: RoleWithPermissions | null };

export type UserStatus = "active" | "inactive" | "deleted";

export type User = {
  uuid: string;
  name: string;
  email: string;
  phone_number: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  role: Role | null;
};

export type CreateUserInput = {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  status?: UserStatus;
  role_id?: string | null;
};

export type UpdateUserInput = Partial<CreateUserInput> & { status?: UserStatus };

export type UserModelAttributes = Partial<Omit<User, "created_at" | "updated_at" | "deleted_at">> & {
  password: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type UserModelCreationAttributes = Partial<UserModelAttributes>;

export class UserModel extends Model<UserModelAttributes, UserModelCreationAttributes> {
  declare uuid: string;
  declare name: string;
  declare email: string;
  declare phone_number: string;
  declare password: string;
  declare status: "active" | "inactive" | "deleted";
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  static async toApi(user: any): Promise<User> {
    return {
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      status: user.status,
      created_at: user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString(),
      updated_at: user.updated_at ? new Date(user.updated_at).toISOString() : new Date().toISOString(),
      deleted_at: user.deleted_at ? new Date(user.deleted_at).toISOString() : null,
      role: await UserModel.resolveRole(user?.uuid),
    };
  }

  static async resolveRole(userUuid: string | undefined): Promise<Role | null> {
    if (!userUuid) {
      return null;
    }

    await UserRoleModelFactory();
    await RoleModelFactory();

    const assignment = (await UserRoleModel.findOne({
      where: { user_id: userUuid },
      include: [{ model: RoleModel, as: "role", where: { deleted_at: null } }],
    })) as (UserRoleModel & { role?: RoleModel | null }) | null;

    if (!assignment?.role) {
      return null;
    }

    return await RoleModel.toApi(assignment.role.toJSON());
  }

  static async resolvePermissions(userUuid: string): Promise<string[]> {
    await UserRoleModelFactory();
    await RoleModelFactory();
    await PermissionModelFactory();
    await ActionModelFactory();

    if (!(RoleModel as any).associations?.permissions) {
      RoleModel.hasMany(PermissionModel, { foreignKey: "role_id", sourceKey: "uuid", as: "permissions" });
    }

    const assignment = (await UserRoleModel.findOne({
      where: { user_id: userUuid },
      include: [
        {
          model: RoleModel,
          as: "role",
          include: [
            {
              model: PermissionModel,
              as: "permissions",
              include: [
                {
                  model: ActionModel,
                  as: "action",
                  where: { status: "active", deleted_at: null },
                  attributes: ["action"],
                },
              ],
            },
          ],
        },
      ],
      order: [[{ model: RoleModel, as: "role" }, { model: PermissionModel, as: "permissions" }, { model: ActionModel, as: "action" }, "action", "ASC"]],
    })) as AssignmentWithRole | null;

    const grants = assignment?.role?.permissions ?? [];
    return grants.map((grant) => grant.action?.action).filter((action): action is string => typeof action === "string");
  }
}

let userModelPromise: Promise<typeof UserModel> | null = null;

export async function getUserModel(): Promise<typeof UserModel> {
  if ((UserModel as any).initialized) {
    return UserModel;
  }
  if (!userModelPromise) {
    userModelPromise = initUserModel().catch((error) => {
      userModelPromise = null;
      throw error;
    });
  }
  return userModelPromise;
}

async function initUserModel(): Promise<typeof UserModel> {
  const sequelize = await getSequelizeInstance();

  {
    UserModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(120),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(160),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        phone_number: {
          type: DataTypes.STRING(30),
          allowNull: false,
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
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
        modelName: "User",
        tableName: "base_users",
        timestamps: false,
        underscored: true,
      },
    );

    (UserModel as any).initialized = true;
  }
  return UserModel;
}

export default async function UserModelFactory() {
  return getUserModel();
}
