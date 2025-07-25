import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Customer from "../../models/Customer";

interface CustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyId: number;
}

const CreateService = async (customerData: CustomerData): Promise<Customer> => {
  const schema = Yup.object().shape({
    name: Yup.string().required(),
    email: Yup.string().email().nullable(),
    phone: Yup.string().nullable(),
    address: Yup.string().nullable()
  });

  try {
    await schema.validate(customerData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const customer = await Customer.create(customerData);

  return customer;
};

export default CreateService;
