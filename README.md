# httpd
A fast and easy-to-use web server, using the Deno native http server (hyper in rust).
It serves static files & dirs, with arbitrary handling using an optional `handler` argument.

## Example
```js
import httpd from 'https://deno.land/x/httpd/mod.js'

httpd((req, headers) => {
  if (new URL(req.url).pathname.startsWith('/details/'))
    return new Response('You are asking for some details', { headers })
})
```
You can pass a 2nd optional `opts` hashmap/object argument to `httpd()` to customize.

## Defaults
- HTTP port 5000 -- override with `opts` arg like: `{ port: 8888 }` or CLI arg like: `-p8888`
- CORS headers   -- override with `opts` arg like: `{ cors: false }`
- dir listings   -- override with `opts` arg like: `{ ls: false }`
- dotfiles are omitted from dir listings

If that pathname doesn't map to a static file or dir (and get served directly), your
`handler()` gets invoked.

You can return a `Response` object (Promise) or not return anything at all.
- For the former case, we default the reply `content-type` to `text/html`.
  - To override, use the optional 2nd argument `headers` to your handler, and change as desired, eg:
    `headers.set('content-type', 'text/plain')`
- For the latter case, we'll emit a 404 (lightly customized) page.

If your handler throws an exception, a general 500 page will be served.

NOTE: This httpd daemon does NOT show dotfiles in dir listings (on by default) -- but it *does*
      serve a dotfile if the caller knows the file/dirname.  Consider `.dockerignore` or similar
      for your project to avoid dotfiles in your deployed webdir if needed.


## More info
Main methods used by `httpd`:
- import { serve } from 'https://deno.land/std/http/server.ts'
- import { serveDir } from 'https://deno.land/std/http/file_server.ts'

The hyper server in rust:
- https://deno.land/manual/runtime/http_server_apis
- https://medium.com/deno-the-complete-reference/native-http-server-hyper-in-deno-1355c1171981
