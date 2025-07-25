import { Op, Sequelize } from "sequelize";
import Customer from "../../models/Customer";

interface Request {
  companyId: number;
  searchParam?: string;
  pageNumber?: string | number;
}

interface Response {
  customers: Customer[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  companyId,
  searchParam = "",
  pageNumber = "1"
}: Request): Promise<Response> => {
  const whereCondition = {
    name: Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.col("name")),
      "LIKE",
      `%${searchParam.toLowerCase().trim()}%`
    ),
    companyId
  };
  const limit = 25;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: customers } = await Customer.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["name", "ASC"]]
  });

  const hasMore = count > offset + customers.length;

  return { customers, count, hasMore };
};

export default ListService;
