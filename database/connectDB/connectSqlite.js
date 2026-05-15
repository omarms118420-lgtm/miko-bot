module.exports = async function () {
        const { Sequelize } = require("sequelize");
        const path = __dirname + "/../data/data.sqlite";
        const sequelize = new Sequelize({
                dialect: "sqlite",
                storage: path,
                logging: false,
                dialectOptions: {
                        timeout: 30000
                },
                pool: {
                        max: 1,
                        min: 0,
                        acquire: 30000,
                        idle: 10000
                }
        });
        await sequelize.query("PRAGMA journal_mode=WAL;");
        await sequelize.query("PRAGMA busy_timeout=30000;");

        const threadModel = require("../models/sqlite/thread.js")(sequelize);
        const userModel = require("../models/sqlite/user.js")(sequelize);
        const dashBoardModel = require("../models/sqlite/userDashBoard.js")(sequelize);
        const globalModel = require("../models/sqlite/global.js")(sequelize);

        await sequelize.sync({ force: false });

        return {
                threadModel,
                userModel,
                dashBoardModel,
                globalModel,
                sequelize
        };
};