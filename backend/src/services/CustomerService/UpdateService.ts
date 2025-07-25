import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Customer from "../../models/Customer";
import ShowService from "./ShowService";

interface CustomerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const UpdateService = async (
  customerId: number | string,
  customerData: CustomerData,
  companyId: number
): Promise<Customer> => {
  const schema = Yup.object().shape({
    name: Yup.string().nullable(),
    email: Yup.string().email().nullable(),
    phone: Yup.string().nullable(),
    address: Yup.string().nullable()
  });

  try {
    await schema.validate(customerData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const customer = await ShowService(customerId, companyId);

  await customer.update(customerData);

  return customer;
};

export default UpdateService;
