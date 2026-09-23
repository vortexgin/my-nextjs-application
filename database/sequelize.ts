const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/vortexgin";

let sequelizeInstance: any = null;

export async function getSequelizeInstance() {
  if (!sequelizeInstance) {
    const { Sequelize } = await import("sequelize");
    sequelizeInstance = new Sequelize(databaseUrl, {
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === "production" ? { require: true, rejectUnauthorized: false } : false,
      },
    });
  }

  return sequelizeInstance;
}

export async function connectDatabase() {
  try {
    const sequelize = await getSequelizeInstance();
    await sequelize.authenticate();
    return sequelize;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}
