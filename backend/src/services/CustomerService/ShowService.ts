import AppError from "../../errors/AppError";
import Customer from "../../models/Customer";

const ShowService = async (
  customerId: number | string,
  companyId: number
): Promise<Customer> => {
  const customer = await Customer.findByPk(customerId);

  if (!customer || customer.companyId !== companyId) {
    throw new AppError("ERR_NO_CUSTOMER_FOUND", 404);
  }

  return customer;
};

export default ShowService;
