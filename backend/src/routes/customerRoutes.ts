import express from "express";
import isAuth from "../middleware/isAuth";
import * as CustomerController from "../controllers/CustomerController";

const customerRoutes = express.Router();

customerRoutes.get("/customers", isAuth, CustomerController.index);
customerRoutes.post("/customers", isAuth, CustomerController.store);
customerRoutes.get("/customers/:customerId", isAuth, CustomerController.show);
customerRoutes.put("/customers/:customerId", isAuth, CustomerController.update);
customerRoutes.delete("/customers/:customerId", isAuth, CustomerController.remove);

export default customerRoutes;
