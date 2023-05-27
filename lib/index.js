"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const net = __importStar(require("net"));
class Server {
    routeMap;
    _server;
    _running;
    constructor() {
        this.routeMap = {};
        this._server = net.createServer();
        this._running = false;
    }
    /**
     * Maps a route to a class
     * @param route The route to be mapped
     * @returns The class but with the route property
     */
    AddController(route) {
        return (target) => {
            const controller = new target();
            this.routeMap[route] = controller._local_routes;
        };
    }
    HTTPMethod(method) {
        return (target, propertyKey, descriptor) => {
            if (!target.constructor.prototype["_local_routes"]) {
                target.constructor.prototype["_local_routes"] = {};
            }
            target.constructor.prototype["_local_routes"][method] = descriptor.value;
        };
    }
    start(address, port, callback) {
        this._running = true;
        this._server.listen(port, address, () => {
            if (callback)
                callback();
        });
        this._server.on("connection", (sock) => {
            this._handleRequest(sock);
        });
        this._server.on("error", (err) => {
            throw err;
        });
    }
    stop(callback) {
        if (!this._running) {
            throw new Error("Server is not running");
        }
        this._server.close((err) => {
            this._running = false;
            if (callback)
                callback(err);
        });
    }
    _handleRequest(sock) {
        sock.on("data", (data) => {
            const request = data.toString();
            let requestLines = request.split("\r\n");
            requestLines = requestLines.filter((line) => line !== "");
            const requestLine = requestLines[0].split(" ");
            const method = requestLine[0];
            const route = requestLine[1];
            const httpVersion = requestLine[2];
            console.log(requestLine);
            console.log(requestLines);
            // const headers = this._getHeaders(requestLines);
            // const body = this._getBody(requestLines);
            // const response = this._getResponse(method, route, headers, body);
            // sock.write(response);
        });
    }
}
const server = new Server();
let Home = class Home {
    get(req, res) {
        console.log("GET /");
    }
};
__decorate([
    server.HTTPMethod("GET"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [net.Socket, net.Socket]),
    __metadata("design:returntype", void 0)
], Home.prototype, "get", null);
Home = __decorate([
    server.AddController("/")
], Home);
server.start("127.0.0.1", 8080, () => {
    console.log("Server started");
});
