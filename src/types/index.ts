import { user_master, wallet_master } from "@prisma/client";
import { Request as ExpressRequest } from "express";

export interface IResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
}

export interface Request extends ExpressRequest {
  user?: User;
}

export interface User extends user_master {
  wallet_master?: wallet_master[];
}

export interface Token {
  user_id: number;
}

export interface LocalCollection {
  name: string;
  magiceden_id: string;
  hyperspace_id: string;
  howrareis_id: string;
  howrareis_total_items: number;
}
