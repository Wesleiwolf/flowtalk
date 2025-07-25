import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Product from "../../models/Product";
import ShowService from "./ShowService";

interface ProductData {
  name?: string;
  description?: string;
  quantity?: number;
  price?: number;
}

const UpdateService = async (
  productId: number | string,
  productData: ProductData,
  companyId: number
): Promise<Product> => {
  const schema = Yup.object().shape({
    name: Yup.string().nullable(),
    quantity: Yup.number().nullable(),
    price: Yup.number().nullable(),
    description: Yup.string().nullable()
  });

  try {
    await schema.validate(productData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const product = await ShowService(productId, companyId);

  await product.update(productData);

  return product;
};

export default UpdateService;
