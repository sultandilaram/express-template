import { Response } from "express";
import { IResponse } from "../types";

export class ResponseHelper<T> {
  constructor(private res: Response) {
    this.res = res;
  }

  public static send<T>(res: Response): ResponseHelper<T> {
    return new ResponseHelper(res);
  }

  public ok(message?: string, data?: T, res?: Response): Response {
    const response: IResponse<T> = {
      success: true,
      code: 200,
      message: message || "Success",
      data: data,
    };
    return res
      ? res.status(200).json(response)
      : this.res.status(200).json(response);
  }

  public error(message?: string, data?: T, res?: Response): Response {
    const response: IResponse<T> = {
      success: false,
      code: 500,
      message: message || "Internal Server Error",
      data: data,
    };
    return res
      ? res.status(500).json(response)
      : this.res.status(500).json(response);
  }

  public notFound(message?: string, data?: T, res?: Response): Response {
    const response: IResponse<T> = {
      success: false,
      code: 404,
      message: message || "Not Found",
      data: data,
    };
    return res
      ? res.status(404).json(response)
      : this.res.status(404).json(response);
  }

  public badRequest(message?: string, data?: T, res?: Response): Response {
    const response: IResponse<T> = {
      success: false,
      code: 400,
      message: message || "Bad Request",
      data: data,
    };
    return res
      ? res.status(400).json(response)
      : this.res.status(400).json(response);
  }

  public unauthorized(message?: string, data?: T, res?: Response): Response {
    const response: IResponse<T> = {
      success: false,
      code: 401,
      message: message || "Unauthorized",
      data: data,
    };
    return res
      ? res.status(401).json(response)
      : this.res.status(401).json(response);
  }

  public forbidden(message?: string, data?: T, res?: Response): Response {
    const response: IResponse<T> = {
      success: false,
      code: 403,
      message: message || "Forbidden",
      data: data,
    };
    return res
      ? res.status(403).json(response)
      : this.res.status(403).json(response);
  }

  public methodNotAllowed(
    message?: string,
    data?: T,
    res?: Response
  ): Response {
    const response: IResponse<T> = {
      success: false,
      code: 405,
      message: message || "Method Not Allowed",
      data: data,
    };
    return res
      ? res.status(405).json(response)
      : this.res.status(405).json(response);
  }

  public conflict(message?: string, data?: T, res?: Response): Response {
    const response: IResponse<T> = {
      success: false,
      code: 409,
      message: message || "Conflict",
      data: data,
    };
    return res
      ? res.status(409).json(response)
      : this.res.status(409).json(response);
  }

  public unprocessableEntity(
    message?: string,
    data?: T,
    res?: Response
  ): Response {
    const response: IResponse<T> = {
      success: false,
      code: 422,
      message: message || "Unprocessable Entity",
      data: data,
    };
    return res
      ? res.status(422).json(response)
      : this.res.status(422).json(response);
  }

  public tooManyRequests(message?: string, data?: T, res?: Response): Response {
    const response: IResponse<T> = {
      success: false,
      code: 429,
      message: message || "Too Many Requests",
      data: data,
    };
    return res
      ? res.status(429).json(response)
      : this.res.status(429).json(response);
  }

  public custom(
    code: number,
    message?: string,
    data?: T,
    res?: Response
  ): Response {
    const response: IResponse<T> = {
      success: false,
      code,
      message: message || "Custom Error",
      data: data,
    };
    return res
      ? res.status(code).json(response)
      : this.res.status(code).json(response);
  }
}

export const serialize = (obj: any) =>
  JSON.stringify(obj, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
