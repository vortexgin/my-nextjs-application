import { DataTypes, Model } from "sequelize";
import { getSequelizeInstance } from "@/database/sequelize";
import ActionModelFactory, { ActionModel } from "@/app/base/models/ActionModel";

export type MenuStatus = "active" | "inactive" | "deleted";

export type Menu = {
  uuid: string;
  icon: string;
  parent: string | null;
  menu: string;
  action_id: string;
  action: string | null;
  description: string | null;
  redirection: string;
  status: MenuStatus;
  weight: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateMenuInput = {
  icon: string;
  parent?: string | null;
  menu: string;
  action_id: string;
  description?: string | null;
  redirection: string;
  status?: MenuStatus;
  weight?: number;
};

export type UpdateMenuInput = Partial<CreateMenuInput>;

export type MenuModelAttributes = Partial<Omit<Menu, "created_at" | "updated_at" | "deleted_at">> & {
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type MenuModelCreationAttributes = Partial<MenuModelAttributes>;

export class MenuModel extends Model<MenuModelAttributes, MenuModelCreationAttributes> {
  declare uuid: string;
  declare icon: string;
  declare parent: string | null;
  declare menu: string;
  declare action_id: string;
  declare description: string | null;
  declare redirection: string;
  declare status: "active" | "inactive" | "deleted";
  declare weight: number;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;

  static async toApi(menu: any): Promise<Menu> {
    return {
      uuid: menu.uuid,
      icon: menu.icon,
      parent: menu.parent ?? null,
      menu: menu.menu,
      action_id: menu.action_id,
      action: await MenuModel.resolveAction(menu?.action_id),
      description: menu.description ?? null,
      redirection: menu.redirection,
      status: menu.status,
      weight: typeof menu.weight === "number" ? menu.weight : 0,
      created_at: menu.created_at ? new Date(menu.created_at).toISOString() : new Date().toISOString(),
      updated_at: menu.updated_at ? new Date(menu.updated_at).toISOString() : new Date().toISOString(),
      deleted_at: menu.deleted_at ? new Date(menu.deleted_at).toISOString() : null,
    };
  }

  private static async resolveAction(actionId: string | undefined): Promise<string | null> {
    if (!actionId) {
      return null;
    }

    await ActionModelFactory();
    const action = await ActionModel.findOne({ where: { uuid: actionId, deleted_at: null } });

    return action?.action ?? null;
  }
}

export async function getMenuModel(): Promise<typeof MenuModel> {
  const sequelize = await getSequelizeInstance();

  if (!(MenuModel as any).initialized) {
    MenuModel.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        icon: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        parent: {
          type: DataTypes.UUID,
          allowNull: true,
          defaultValue: null,
          references: { model: "menus", key: "uuid" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        menu: {
          type: DataTypes.STRING(120),
          allowNull: false,
        },
        action_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "actions", key: "uuid" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue: null,
        },
        redirection: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM("active", "inactive", "deleted"),
          allowNull: false,
          defaultValue: "active",
        },
        weight: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
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
        modelName: "Menu",
        tableName: "menus",
        timestamps: false,
        underscored: true,
      },
    );

    const { getActionModel } = await import("@/app/base/models/ActionModel");
    MenuModel.belongsTo(await getActionModel(), { foreignKey: "action_id", targetKey: "uuid", as: "action" });
    MenuModel.belongsTo(MenuModel, { foreignKey: "parent", targetKey: "uuid", as: "parentMenu" });

    (MenuModel as any).initialized = true;
  }

  return MenuModel;
}

export default async function MenuModelFactory() {
  return getMenuModel();
}
