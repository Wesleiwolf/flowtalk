import { Request, Response } from "express";
import ListService from "../services/ProductService/ListService";
import CreateService from "../services/ProductService/CreateService";
import ShowService from "../services/ProductService/ShowService";
import UpdateService from "../services/ProductService/UpdateService";
import DeleteService from "../services/ProductService/DeleteService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as any;
  const { companyId } = req.user;

  const { products, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId
  });

  return res.json({ products, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const productData = { ...req.body, companyId };

  const product = await CreateService(productData);

  return res.status(200).json(product);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { productId } = req.params;
  const { companyId } = req.user;

  const product = await ShowService(productId, companyId);

  return res.status(200).json(product);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { productId } = req.params;
  const { companyId } = req.user;
  const productData = req.body;

  const product = await UpdateService(productId, productData, companyId);

  return res.status(200).json(product);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { productId } = req.params;
  const { companyId } = req.user;

  await DeleteService(productId, companyId);

  return res.status(200).json({ message: "Product deleted" });
};
