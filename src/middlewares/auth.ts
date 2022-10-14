import { Handler, Response, NextFunction } from "express";
import { Request } from "../types";
import { ResponseHelper, verify_token } from "../helpers";
import { prisma } from "../config";

export const auth: Handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = new ResponseHelper(res);
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    const decoded = verify_token(req.headers.authorization.split(" ")[1]);
    if (!decoded) return response.unauthorized("Invalid Token");

    req.user =
      (await prisma.user_master.findUnique({
        where: {
          user_id: decoded.user_id,
        },
        include: { wallet_master: true },
      })) || undefined;

    next();
  } else {
    return response.unauthorized("Token not found");
  }
};

export const bypass_auth: Handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = new ResponseHelper(res);

  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    const decoded = verify_token(req.headers.authorization.split(" ")[1]);
    if (!decoded) return response.unauthorized("Invalid Token");

    req.user =
      (await prisma.user_master.findUnique({
        where: {
          user_id: decoded.user_id,
        },
        include: { wallet_master: true },
      })) || undefined;
  }

  next();
};
