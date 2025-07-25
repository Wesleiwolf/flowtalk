import ShowService from "./ShowService";

const DeleteService = async (
  productId: number | string,
  companyId: number
): Promise<void> => {
  const product = await ShowService(productId, companyId);

  await product.destroy();
};

export default DeleteService;
