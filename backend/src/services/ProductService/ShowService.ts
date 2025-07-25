import AppError from "../../errors/AppError";
import Product from "../../models/Product";

const ShowService = async (
  productId: number | string,
  companyId: number
): Promise<Product> => {
  const product = await Product.findByPk(productId);

  if (!product || product.companyId !== companyId) {
    throw new AppError("ERR_NO_PRODUCT_FOUND", 404);
  }

  return product;
};

export default ShowService;
