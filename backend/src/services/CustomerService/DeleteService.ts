import ShowService from "./ShowService";

const DeleteService = async (
  customerId: number | string,
  companyId: number
): Promise<void> => {
  const customer = await ShowService(customerId, companyId);

  await customer.destroy();
};

export default DeleteService;
