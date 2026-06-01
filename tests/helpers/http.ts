import type { AddressInfo } from "node:net";
import type { Express } from "express";

export interface TestResponse<TBody> {
  status: number;
  body: TBody;
}

export interface RequestOptions {
  headers?: Record<string, string>;
}

export function bearerAuthHeader(accessToken: string): Record<string, string> {
  return {
    authorization: `Bearer ${accessToken}`
  };
}

export async function requestJson<TBody>(
  app: Express,
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<TestResponse<TBody>> {
  const server = app.listen(0);

  try {
    const address = server.address() as AddressInfo;
    const headers = {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...options.headers
    };
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: Object.keys(headers).length === 0 ? undefined : headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    const responseText = await response.text();

    return {
      status: response.status,
      body: (responseText ? JSON.parse(responseText) : undefined) as TBody
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

export async function requestText(
  app: Express,
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<TestResponse<string>> {
  const server = app.listen(0);

  try {
    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: options.headers
    });

    return {
      status: response.status,
      body: await response.text()
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}
