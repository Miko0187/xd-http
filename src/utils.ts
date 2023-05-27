import { IResponse } from "./interfaces";

export function buildResponse(
  type:
    | "text/csv"
    | "text/plain"
    | "text/html"
    | "text/css"
    | "application/json"
    | "application/xml"
    | "application/pdf"
    | "application/zip"
    | "application/javascript"
    | "application/octet-stream"
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/svg+xml"
    | "image/x-icon"
    | "audio/mpeg"
    | "audio/ogg",
  body: string | Buffer,
  response: IResponse
) {
  if (Buffer.isBuffer(body)) {
    body = body.toString("base64");
  }

  const headers: { [key: string]: string } = {
    "Content-Type": type,
    "Content-Length": body.length.toString(),
  };

  if (type === "application/json") {
    headers["Cache-Control"] = "no-cache";
  }

  let headersString = "";
  Object.keys(headers).forEach((key) => {
    headersString += `${key}: ${headers[key]}\r\n`;
  });
  headersString += "\r\n";

  return `HTTP/1.1 ${response.status} ${response.message}\r\n${headers}${body}`;
}

export function sseResponse() {
  const headers: { [key: string]: string } = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  let headersString = "";
  Object.keys(headers).forEach((key) => {
    headersString += `${key}: ${headers[key]}\r\n`;
  });
  headersString += "\r\n";

  return `HTTP/1.1 200 OK\r\n${headers}\r\n\r\n`;
}
