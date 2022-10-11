import jwt from "jsonwebtoken";
import {
  Handler,
  Response,
  Request as ExpressRequest,
  NextFunction,
} from "express";
import ResponseHandler from "../helper/response";

interface Request extends ExpressRequest {
  user?: any;
}

export const auth: Handler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(req.headers.authorization, "AUTHORIZATION");
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    const token = req.headers.authorization.split(" ")[1];

    /// Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      req.user = decoded;
      next();
    } catch (err) {
      return res.json(ResponseHandler.un_autorized(null, "TOKEN"));
    }
  } else {
    return res.json(
      ResponseHandler.un_autorized(null, "No token, authorization denied")
    );
  }
};
