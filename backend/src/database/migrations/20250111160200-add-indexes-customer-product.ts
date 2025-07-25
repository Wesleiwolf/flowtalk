import { QueryInterface } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addIndex("Customers", ["companyId"], {
        name: "idx_customers_company_id"
      }),
      queryInterface.addIndex("Products", ["companyId"], {
        name: "idx_products_company_id"
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeIndex("Customers", "idx_customers_company_id"),
      queryInterface.removeIndex("Products", "idx_products_company_id")
    ]);
  }
};
