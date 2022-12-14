import { Handler, Response, NextFunction } from "express";
import { Request } from "../types";
import { ResponseHelper, verify_token } from "../helpers";
import { prisma } from "../config";

const fetchUser = async (user_id: number) =>
  (await prisma.user_master.findUnique({
    where: {
      user_id: user_id,
    },
    include: {
      wallet_master: {
        where: { status: "active" },
      },
    },
  })) || undefined;

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
    try {
      req.user = await fetchUser(decoded.user_id);
      next();
    } catch {
      return response.unauthorized("Invalid Token");
    }
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
    try {
      req.user = await fetchUser(decoded.user_id);
    } catch (e) {}
  }

  next();
};
