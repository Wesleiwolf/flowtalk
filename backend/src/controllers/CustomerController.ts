import { Request, Response } from "express";
import ListService from "../services/CustomerService/ListService";
import CreateService from "../services/CustomerService/CreateService";
import ShowService from "../services/CustomerService/ShowService";
import UpdateService from "../services/CustomerService/UpdateService";
import DeleteService from "../services/CustomerService/DeleteService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as any;
  const { companyId } = req.user;

  const { customers, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId
  });

  return res.json({ customers, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const customerData = { ...req.body, companyId };

  const customer = await CreateService(customerData);

  return res.status(200).json(customer);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { customerId } = req.params;
  const { companyId } = req.user;

  const customer = await ShowService(customerId, companyId);

  return res.status(200).json(customer);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { customerId } = req.params;
  const { companyId } = req.user;
  const customerData = req.body;

  const customer = await UpdateService(customerId, customerData, companyId);

  return res.status(200).json(customer);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { customerId } = req.params;
  const { companyId } = req.user;

  await DeleteService(customerId, companyId);

  return res.status(200).json({ message: "Customer deleted" });
};
