import { Context } from "./context";

export interface IOs {
  win: boolean;
  mac: boolean;
  linux: boolean;
  android: boolean;
  ios: boolean;
}

export interface IUserAgent {
  browser: string;
  company: string;
  version: string;
  os: IOs;
  platform: string;
  architecture: string;
}

export interface IRouteMap {
  [key: string]: {
    GET?: (ctx: Context) => void;
    POST?: (ctx: Context) => void;
    PUT?: (ctx: Context) => void;
    DELETE?: (ctx: Context) => void;
    PATCH?: (ctx: Context) => void;
  };
}

export interface ISpecialRoutes {
  [key: string]: (ctx: Context) => void;
}

export interface IRequest {
  method: string;
  url: string;
  http_version: string;
  host: string;
  user_agent: IUserAgent;
  headers: {
    [key: string]: string;
  };
}

export interface IResponse {
  status: number;
  message: string;
}
