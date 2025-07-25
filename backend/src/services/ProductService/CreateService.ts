import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Product from "../../models/Product";

interface ProductData {
  name: string;
  description?: string;
  quantity: number;
  price: number;
  companyId: number;
}

const CreateService = async (productData: ProductData): Promise<Product> => {
  const schema = Yup.object().shape({
    name: Yup.string().required(),
    quantity: Yup.number().required(),
    price: Yup.number().required()
  });

  try {
    await schema.validate(productData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const product = await Product.create(productData);

  return product;
};

export default CreateService;
