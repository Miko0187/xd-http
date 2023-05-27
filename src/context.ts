import * as fs from "fs";
import * as net from "net";

import { IRequest, IResponse, IUserAgent } from "./interfaces";
import { buildResponse, sseResponse } from "./utils";
import { Server } from "./index";

export class Context {
  public request: IRequest;
  public user_agent: IUserAgent;
  public responded: boolean = false;

  private _server: net.Server;
  private _socket: net.Socket;

  constructor(server: net.Server, socket: net.Socket, request: IRequest) {
    this.request = request;
    this.user_agent = request.user_agent;

    this._server = server;
    this._socket = socket;
  }

  prepare_sse() {
    this._socket.write(sseResponse());

    this._socket.on("close", () => {
      this._socket.emit(`${this.request.url}:close`, this);
    });

    this._socket.on("error", (err) => {
      this._socket.emit(`${this.request.url}:error`, err);
    });
  }

  send_raw(data: string) {
    const payload = buildResponse("text/plain", data, <IResponse>{
      message: "OK",
      status: 200,
    });
    this._socket.write(payload);
    this._socket.end();
    this.responded = true;
  }

  send_template(file: string) {
    const data = fs.readFileSync(file, "utf-8");
    const payload = buildResponse("text/html", data, <IResponse>{
      message: "OK",
      status: 200,
    });
    this._socket.write(payload);
    this._socket.end();
    this.responded = true;
  }
}
