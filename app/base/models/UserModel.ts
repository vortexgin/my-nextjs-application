import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";
import RoleModelFactory, { RoleModel, type Role } from "@/app/base/models/RoleModel";
import { ADMIN_ROLE_SLUG } from "@/libraries/Permissions";
import ActionModelFactory, { ActionModel } from "@/app/base/models/ActionModel";
import PermissionModelFactory, { PermissionModel } from "@/app/base/models/PermissionModel";
import UserRoleModelFactory, { UserRoleModel } from "@/app/base/models/UserRoleModel";
import NotFoundException from "@/exceptions/NotFoundException";
import ForbiddenException from "@/exceptions/ForbiddenException";
import { UPDATE_ORGANIZATION_PERMISSION } from "@/libraries/Permissions";
import type { Organization } from "@/app/sass/models/OrganizationModel";

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
  organization: Organization | null;
};

export type CreateUserInput = {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  status?: UserStatus;
  role_id?: string | null;
  organization_id?: string | null;
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
      organization: await UserModel.resolveOrganization(user?.uuid),
    };
  }

  /**
   * Loads sass organization-link models only when that module exists
   * and its table is present. Null otherwise (feature off).
   */
  static async loadOrganizationLinkModels(): Promise<{
    OrganizationUserModel: any;
    OrganizationModel: any;
  } | null> {
    try {
      const linkModule = await import("@/app/sass/models/OrganizationUserModel");
      const orgModule = await import("@/app/sass/models/OrganizationModel");
      const OrganizationUserModel = await linkModule.getOrganizationUserModel();
      const OrganizationModel = await orgModule.getOrganizationModel();

      const sequelize = await getSequelizeInstance();
      const tables = (await sequelize.getQueryInterface().showAllTables()) as Array<
        string | { tableName?: string }
      >;
      const names = tables.map((table) => (typeof table === "string" ? table : (table.tableName ?? "")));
      if (!names.includes("sass_organization_user") || !names.includes("sass_organization")) {
        return null;
      }

      return { OrganizationUserModel, OrganizationModel };
    } catch {
      return null;
    }
  }

  static async resolveOrganization(userUuid: string | undefined): Promise<Organization | null> {
    if (!userUuid) {
      return null;
    }

    try {
      const models = await UserModel.loadOrganizationLinkModels();
      if (!models) {
        return null;
      }

      const link = await models.OrganizationUserModel.findOne({
        where: { user_id: userUuid, deleted_at: null },
      });
      if (!link) {
        return null;
      }

      const organization = await models.OrganizationModel.findOne({
        where: { uuid: link.organization_id, deleted_at: null },
      });
      if (!organization) {
        return null;
      }

      return models.OrganizationModel.toApi(organization.toJSON());
    } catch {
      return null;
    }
  }

  static async isAdmin(actor: unknown): Promise<boolean> {
    const actorUuid = (actor as Record<string, unknown> | null)?.uuid;
    if (typeof actorUuid !== "string") {
      return false;
    }

    try {
      return (await UserModel.resolveRole(actorUuid))?.slug === ADMIN_ROLE_SLUG;
    } catch {
      return false;
    }
  }

  static async requireOrganizationPermission(actor: unknown): Promise<void> {
    const actorUuid = (actor as Record<string, unknown> | null)?.uuid;
    if (typeof actorUuid !== "string") {
      throw new ForbiddenException("Insufficient permissions.");
    }

    const permissions = await UserModel.resolvePermissions(actorUuid);
    if (!permissions.includes(UPDATE_ORGANIZATION_PERMISSION)) {
      throw new ForbiddenException("Insufficient permissions.");
    }
  }

  static async assignOrganization(userUuid: string, organizationId: string | null | undefined): Promise<void> {
    if (organizationId === undefined) {
      return;
    }

    const models = await UserModel.loadOrganizationLinkModels();
    if (!models) {
      return;
    }

    if (!organizationId) {
      await models.OrganizationUserModel.destroy({ where: { user_id: userUuid } });
      return;
    }

    const organization = await models.OrganizationModel.findOne({
      where: { uuid: organizationId, deleted_at: null },
    });
    if (!organization) {
      throw new NotFoundException("Organization not found.");
    }

    const link = await models.OrganizationUserModel.findOne({ where: { user_id: userUuid } });
    if (link) {
      await link.update({ organization_id: organizationId, updated_at: new Date() });
    } else {
      await models.OrganizationUserModel.create({ user_id: userUuid, organization_id: organizationId });
    }
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
