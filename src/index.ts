import * as net from "net";
import "reflect-metadata";

import {
  IRouteMap,
  IRequest,
  IOs,
  IUserAgent,
  ISpecialRoutes,
  IResponse,
} from "./interfaces";
import { buildResponse } from "./utils";
import { NOT_FOUND_HTML, METHOD_NOT_ALLOWED_HTML } from "./const";
import { Context } from "./context";

export class Server {
  public routeMap: IRouteMap;
  public specialRoutes: ISpecialRoutes;

  private _server: net.Server;
  private _running: boolean;

  constructor() {
    this.routeMap = {};
    this.specialRoutes = {};

    this._server = net.createServer();
    this._running = false;
  }

  /**
   * Maps a route to a class
   * @param route The route to be mapped
   * @returns The class but with the route property
   */
  AddController(route: string) {
    return (target: any) => {
      if (route in this.routeMap) {
        throw new Error(`Route "${route}" already exists`);
      }

      const controller = new target();

      this.routeMap[route] = controller._local_routes;
    };
  }

  HTTPMethod(method: "POST" | "GET" | "DELETE" | "PUT" | "PATCH") {
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) => {
      if (!target.constructor.prototype["_local_routes"]) {
        target.constructor.prototype["_local_routes"] = {};
      }

      if (method in target.constructor.prototype["_local_routes"]) {
        throw new Error(
          `Method "${method}" already exists in controller "${target.constructor.name}"`
        );
      }

      if (descriptor.value.length !== 1) {
        throw new Error(
          `Method "${method}" in controller "${target.constructor.name}" must have one parameter`
        );
      }

      const paramTypes = Reflect.getMetadata(
        "design:paramtypes",
        target,
        propertyKey
      );
      for (let i = 0; i < paramTypes.length; i++) {
        if (paramTypes[i].name !== "Context") {
          throw new Error(
            `Method "${method}" in controller "${target.constructor.name}" must have one parameter of type Context`
          );
        }
      }

      target.constructor.prototype["_local_routes"][method] = descriptor.value;
    };
  }

  /**
   * Handles 404 errors (Not found)
   * @returns Nothing
   */
  Handle404() {
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) => {
      if ("404" in this.specialRoutes) {
        throw new Error("404 handler already exists");
      }

      this.specialRoutes["404"] = descriptor.value;
    };
  }

  /**
   * Handles 405 errors (Method not allowed)
   * @returns Nothing
   */
  Handle405() {
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) => {
      if ("405" in this.specialRoutes) {
        throw new Error("405 handler already exists");
      }

      this.specialRoutes["405"] = descriptor.value;
    };
  }

  start(address: string, port: number, callback?: () => void) {
    this._running = true;

    this._server.listen(port, address, () => {
      if (callback) callback();
    });

    this._server.on("connection", (sock) => {
      this._handleRequest(sock);
    });

    this._server.on("error", (err) => {
      throw err;
    });
  }

  stop(callback: (error?: Error | undefined) => void) {
    if (!this._running) {
      throw new Error("Server is not running");
    }

    this._server.close((err: Error | undefined) => {
      this._running = false;
      if (callback) callback(err);
    });
  }

  private _parseUserAgent(userAgent: string): IUserAgent {
    const regex =
      /(?<browser>Chrome|Firefox|Safari|Opera|IE|Edge)\/(?<version>\d+(\.\d+)?)(?=.*?(?<company>Mozilla|AppleWebKit)).*?(?<os>Windows|Mac|Linux|Android|iOS).*?(?<platform>Windows NT|Mac OS X|Linux|Android|iOS).*?(?<architecture>x86|x86_64|arm64|armv7)/i;
    const match = userAgent.match(regex);

    if (!match) {
      throw new Error("Invalid user agent");
    }

    const { browser, company, version, os, platform, architecture } =
      match.groups as {
        browser: string;
        company: string;
        version: string;
        os: string;
        platform: string;
        architecture: string;
      };

    const osInfo: IOs = {
      win: os.toLowerCase() === "windows",
      mac: os.toLowerCase() === "mac",
      linux: os.toLowerCase() === "linux",
      android: os.toLowerCase() === "android",
      ios: os.toLowerCase() === "ios",
    };

    return <IUserAgent>{
      browser,
      company,
      version,
      os: osInfo,
      platform,
      architecture,
    };
  }

  private _parseRequest(request: string): IRequest {
    let requestLines = request.split("\r\n");
    requestLines = requestLines.filter((line) => line !== "");

    const importantLine = requestLines[0].split(" ");
    requestLines.shift();

    const host = requestLines[0].split(" ")[1];
    requestLines.shift();

    let userAgent: IUserAgent | string = requestLines[0].split(" ")[1];
    requestLines.shift();
    userAgent = this._parseUserAgent(userAgent);

    const headers: { [key: string]: string } = {};
    requestLines.forEach((line) => {
      const [key, value] = line.split(": ");
      headers[key] = value;
    });

    return <IRequest>{
      method: importantLine[0],
      url: importantLine[1],
      http_version: importantLine[2],
      host,
      user_agent: userAgent,
      headers,
    };
  }

  private _createContext(sock: net.Socket, request: IRequest) {
    return new Context(this._server, sock, request);
  }

  private _trigger404(sock: net.Socket, request: IRequest) {
    if ("404" in this.specialRoutes) {
      const controller = this.specialRoutes["404"];
      controller?.(this._createContext(sock, request));
    } else {
      const response = buildResponse("text/html", NOT_FOUND_HTML, <IResponse>{
        message: "Not Found",
        status: 404,
      });
      sock.write(response);
      sock.end();
    }
  }

  private _trigger405(sock: net.Socket, request: IRequest) {
    if ("405" in this.specialRoutes) {
      const controller = this.specialRoutes["405"];
      controller?.(this._createContext(sock, request));
    } else {
      const response = buildResponse("text/html", METHOD_NOT_ALLOWED_HTML, {
        message: "Method Not Allowed",
        status: 405,
      });
      sock.write(response);
      sock.end();
    }
  }

  private _handleRequest(sock: net.Socket) {
    sock.on("data", (data) => {
      const request = data.toString();
      const parsedRequest = this._parseRequest(request);

      if (parsedRequest.url in this.routeMap) {
        const controller = this.routeMap[parsedRequest.url];
        const method = parsedRequest.method;

        if (
          method === "GET" ||
          method === "POST" ||
          method === "DELETE" ||
          method === "PUT" ||
          method === "PATCH"
        ) {
          const func = controller[method];
          func?.(this._createContext(sock, parsedRequest));
        } else {
          this._trigger405(sock, parsedRequest);
        }
      } else {
        this._trigger404(sock, parsedRequest);
      }
    });
  }
}

const server = new Server();

@server.AddController("/")
class Home {
  @server.HTTPMethod("GET")
  get() {
    console.log("GET /");
  }
}

server.start("127.0.0.1", 8080, () => {
  console.log("Server started");
});
