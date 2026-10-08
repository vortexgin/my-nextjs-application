"use strict";

function moneyColumns(Sequelize) {
  return {
    subtotal: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    discount_pct: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
    grand_total: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  };
}

function stamps(Sequelize) {
  return {
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    deleted_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
  };
}

function itemColumns(Sequelize, parentKey) {
  return {
    uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
    [parentKey]: { type: Sequelize.UUID, allowNull: false },
    product_id: { type: Sequelize.UUID, allowNull: false },
    variant_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
    qty: { type: Sequelize.INTEGER, allowNull: false },
    unit_price: { type: Sequelize.INTEGER, allowNull: false },
    discount_pct: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
    line_total: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    notes: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
    ...stamps(Sequelize),
  };
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sales_purchase_requests", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      customer_id: { type: Sequelize.UUID, allowNull: false },
      warehouse_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      status: {
        type: Sequelize.ENUM("draft", "submitted", "approved", "rejected", "closed"),
        allowNull: false,
        defaultValue: "draft",
      },
      ...moneyColumns(Sequelize),
      notes: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      ...stamps(Sequelize),
    });

    await queryInterface.createTable("sales_purchase_request_items", itemColumns(Sequelize, "purchase_request_id"));

    await queryInterface.createTable("sales_orders", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      customer_id: { type: Sequelize.UUID, allowNull: false },
      purchase_request_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      warehouse_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      status: {
        type: Sequelize.ENUM("draft", "confirmed", "paid", "shipped", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },
      ...moneyColumns(Sequelize),
      notes: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      ...stamps(Sequelize),
    });

    await queryInterface.createTable("sales_order_items", itemColumns(Sequelize, "sales_order_id"));

    await queryInterface.createTable("sales_delivery_orders", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      organization_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      sales_order_id: { type: Sequelize.UUID, allowNull: false },
      warehouse_id: { type: Sequelize.UUID, allowNull: false },
      status: {
        type: Sequelize.ENUM("draft", "packed", "shipped", "delivered", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },
      fulfillment: {
        type: Sequelize.ENUM("system", "paper"),
        allowNull: true,
        defaultValue: null,
      },
      stock_deducted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      notes: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      ...stamps(Sequelize),
    });

    await queryInterface.createTable("sales_delivery_order_items", {
      uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      delivery_order_id: { type: Sequelize.UUID, allowNull: false },
      product_id: { type: Sequelize.UUID, allowNull: false },
      variant_id: { type: Sequelize.UUID, allowNull: true, defaultValue: null },
      qty: { type: Sequelize.INTEGER, allowNull: false },
      ...stamps(Sequelize),
    });

    await queryInterface.addIndex("sales_purchase_request_items", ["purchase_request_id"]);
    await queryInterface.addIndex("sales_order_items", ["sales_order_id"]);
    await queryInterface.addIndex("sales_delivery_order_items", ["delivery_order_id"]);
    await queryInterface.addIndex("sales_delivery_orders", ["sales_order_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sales_delivery_order_items");
    await queryInterface.dropTable("sales_delivery_orders");
    await queryInterface.dropTable("sales_order_items");
    await queryInterface.dropTable("sales_orders");
    await queryInterface.dropTable("sales_purchase_request_items");
    await queryInterface.dropTable("sales_purchase_requests");
  },
};
