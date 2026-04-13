import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "@remix-run/react";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { isbot } from "isbot";
import type { EntryContext } from "@remix-run/node";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    const { pipe } = renderToPipeableStream(
      <ServerRouter context={remixContext} url={request.url} />,
      {
        onShellReady() {
          const body = new PassThrough();
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(createReadableStreamFromReadable(body), {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
          pipe(body);
        },
        onShellError: reject,
      }
    );
  });
}
