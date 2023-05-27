import * as net from "net";
import { IRouteMap } from "./interfaces";

class Server {
  public routeMap: IRouteMap;

  private _server: net.Server;

  constructor() {
    this.routeMap = {};

    this._server = net.createServer();
  }

  /**
   * Maps a route to a class
   * @param route The route to be mapped
   * @returns The class but with the route property
   */
  AddController(route: string) {
    return (target: any) => {
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

      target.constructor.prototype["_local_routes"][method] = descriptor.value;
    };
  }

  start(address: string, port: number, callback: () => void) {
    this._server.listen(port, address, () => {
      callback();
    });

    this._server.on("error", (err) => {
      throw err;
    });
  }
}

const server = new Server();

@server.AddController("/")
class Home {
  @server.HTTPMethod("GET")
  get(req: net.Socket, res: net.Socket) {
    console.log("GET /");
  }
}
