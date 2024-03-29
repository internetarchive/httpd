/* eslint-disable no-console, no-use-before-define */

import { serveDir } from 'https://deno.land/std/http/file_server.ts'


/**
 * Serves static files via `Deno.serve()` in the CWD that this script is run in.
 * Dynamic content can be setup via a callback handler which gets invoked for urls corresponding
 * to static files that don't exist.
 *
 * The default http port (5000) can be overridden in the `opts` argument or on the command line with
 * an argument like `-p8080`.
 *
 * @param {function} handler callback with `Request` and `Headers` object args -- invoked when there
 *                        isn't a static file corresponding to the request.  So you can do dynamic
 *                        request routing by returning a `Response` or promise of a `Response`;
 *                        return nothing to cause a 404.
 * @param {object} opts options:
 *                        port (defaults to listen on :5000);
 *                        cors (falsy to turn off default CORS open);
 *                        ls (falsy to turn off automtic dir listings);
 *                        headers (array of one or more strings to send in responses (eg: CSP))
 *
 * @returns {Response|Promise<Response>|undefined}
 */
export default function httpd(handler, opts = {}) {
  const port = Number(opts.port ?? ((Deno.args.find((e) => e.match(/^-p([0-9]{3,5})$/)?.pop())) || '-p5000').slice(2))

  const docroot = Deno.cwd()
  console.log({ docroot })

  const headers_defaults = new Headers()
  headers_defaults.append('content-type', 'text/html') // default to html, caller can override
  for (const header of (opts.headers ?? [])) {
    const headerSplit = header.split(':')
    headers_defaults.append(headerSplit[0], headerSplit.slice(1).join(':'))
  }
  if (opts.cors) {
    headers_defaults.append('access-control-allow-origin', '*')
    headers_defaults.append(
      'access-control-allow-headers',
      'Origin, X-Requested-With, Content-Type, Accept, Range',
    )
  }


  return Deno.serve({ port }, async (req) => {
    try {
      // make us throw an exception if not a file/dir -- so we can send custom 404 page
      Deno.chdir(docroot)
      const url = new URL(req.url)
      Deno.statSync(url.pathname.slice(1) || (opts.ls ? '.' : 'index.html'))

      // GET requests for static .htm(l) files without CGI args can be safely served without a CSP
      // header (since some documentation pages might use inline <script> tags, etc.)
      const safe_htm = req.method === 'GET' &&
        url.search === '' && url.hash === '' &&
        url.username === '' && url.password === '' &&
        (url.pathname.endsWith('.html') || url.pathname.endsWith('.htm'))

      const serve_opts = {
        enableCors: 'cors' in opts ? opts.cors : true,
        showDirListing: 'ls' in opts ? opts.ls : true,
        headers: (opts.headers ?? []).filter((e) => !safe_htm || !e.match(/^content-security-policy/)),
      }
      return await serveDir(req, serve_opts)
    } catch {
      const headers = new Headers(headers_defaults)
      try {
        const res = handler ? handler(req, headers) : undefined
        if (res) {
          log(req)
          return res
        }
      } catch (err) {
        console.warn({ err })
        log(req, 500)
        headers.set('content-type', 'text/html') // in case caller overrode (and error happened)
        return new Response(error('Internal Server Error'), { status: 500, headers })
      }

      log(req, 404)
      headers.set('content-type', 'text/html') // in case caller overrode
      return new Response(error('Not Found'), { status: 404, headers })
    }
  })
}


function error(msg) {
  return `
<center>
<br><br><br>

<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="300.000000pt" height="269.000000pt" viewBox="0 0 300.000000 269.000000"
 preserveAspectRatio="xMidYMid meet">
<g transform="translate(0.000000,269.000000) scale(0.100000,-0.100000)"
fill="#000000" stroke="none">
<path d="M1180 2603 c-14 -2 -72 -15 -130 -30 -354 -87 -574 -198 -760 -383
-185 -185 -239 -313 -240 -575 0 -118 12 -189 61 -365 46 -163 108 -299 199
-437 33 -51 60 -101 60 -112 0 -15 6 -21 23 -21 28 0 47 -17 47 -42 0 -10 6
-18 12 -18 7 0 67 -55 133 -122 146 -150 194 -179 368 -229 73 -20 195 -60
272 -87 207 -75 353 -102 543 -102 115 0 160 4 182 15 15 8 30 18 32 23 1 5
44 30 93 56 86 46 180 108 187 124 2 4 48 40 103 79 127 91 234 196 323 315
160 213 242 471 242 756 0 119 -3 147 -25 217 -44 138 -113 234 -274 379 -105
96 -299 246 -317 246 -3 0 -38 19 -77 42 -88 52 -197 101 -297 133 -41 13
-122 40 -178 60 -163 57 -320 85 -467 83 -49 0 -101 -3 -115 -5z m332 -118 c3
-14 6 -123 7 -242 0 -120 4 -264 7 -320 4 -66 3 -103 -3 -103 -16 0 -22 91
-30 403 -4 197 -3 287 4 287 6 0 13 -11 15 -25z m-433 -199 c1 -71 -1 -127 -4
-125 -2 3 -7 72 -9 155 -3 88 -2 139 3 124 5 -14 9 -83 10 -154z m79 33 l-3
-124 -5 132 c-3 73 -1 129 3 124 4 -4 6 -64 5 -132z m-371 59 c1 -20 29 -317
52 -545 3 -40 4 -73 1 -73 -13 0 -62 372 -74 560 -2 25 -7 53 -11 63 -5 13 -2
17 11 17 13 0 20 -8 21 -22z m450 -225 c-2 -38 -3 -7 -3 67 0 74 1 105 3 68 2
-38 2 -98 0 -135z m-603 5 c3 -48 13 -140 21 -205 8 -65 15 -134 14 -153 -1
-72 -17 13 -44 235 -14 121 -28 234 -31 252 -3 20 0 33 8 35 15 5 22 -32 32
-164z m1228 -523 c3 -110 1 -187 -3 -171 -4 15 -10 207 -13 425 -4 318 -3 352
4 171 4 -124 10 -315 12 -425z m-1321 479 c20 -159 38 -316 44 -389 4 -36 2
-44 -4 -30 -6 11 -24 124 -41 250 -17 127 -35 247 -40 267 -4 20 -5 40 -2 43
18 17 28 -16 43 -141z m1718 -146 c1 -144 0 -260 -2 -258 -14 15 -16 520 -2
520 1 0 3 -118 4 -262z m-1809 106 c16 -104 37 -264 59 -472 10 -88 -5 -88
-19 0 -6 40 -20 127 -30 193 -11 66 -27 169 -36 230 -8 60 -20 116 -26 123 -8
9 -6 18 7 32 10 11 20 19 22 17 2 -2 12 -58 23 -123z m1912 54 c-10 -22 -11
-21 -11 12 -1 26 2 31 11 22 8 -8 8 -17 0 -34z m-2018 -35 c8 -27 86 -578 86
-611 0 -15 4 -32 9 -38 6 -5 5 -18 -3 -32 -10 -19 -14 -4 -29 115 -10 76 -24
176 -32 223 -8 47 -21 137 -31 200 -9 63 -20 122 -25 131 -8 16 -3 29 12 29 4
0 10 -8 13 -17z m-65 -108 l0 -30 -14 34 c-8 18 -12 38 -9 43 10 16 24 -13 23
-47z m2075 -97 c-3 -46 -7 -272 -8 -503 -4 -474 -7 -541 -16 -405 -7 94 6 865
16 948 9 71 14 47 8 -40z m-2061 12 c4 -30 3 -38 -3 -25 -8 19 -14 83 -6 74 2
-2 6 -24 9 -49z m2151 -412 c-7 -517 -20 -764 -23 -443 -1 105 -2 228 -2 275
1 105 24 620 28 620 1 0 0 -204 -3 -452z m201 122 c-11 -356 -25 -705 -31
-738 -3 -20 -10 -32 -17 -29 -13 4 -12 142 3 502 5 116 10 266 11 335 1 69 4
140 7 159 l5 33 14 -33 c12 -27 13 -72 8 -229z m-2477 132 c10 -66 28 -190 72
-512 5 -36 9 -74 9 -85 -2 -27 -17 43 -29 130 -5 39 -12 80 -15 92 -3 13 -14
87 -25 166 -10 79 -24 164 -29 188 -12 52 -14 116 -3 105 4 -4 13 -42 20 -84z
m70 -2 l0 -35 -8 30 c-4 17 -8 44 -8 60 0 29 0 29 8 5 4 -14 8 -41 8 -60z
m1289 23 c-4 -17 -4 -17 -12 0 -4 9 -4 25 0 35 8 16 8 16 12 0 3 -10 3 -26 0
-35z m-194 -22 c13 -5 27 -19 30 -31 5 -19 11 -22 44 -18 46 6 144 -34 185
-76 80 -81 180 -242 222 -356 36 -96 44 -141 56 -295 6 -77 18 -205 26 -285 8
-80 17 -169 20 -199 3 -29 0 -82 -7 -116 -11 -56 -10 -66 5 -89 13 -20 14 -27
4 -30 -70 -20 -106 -28 -183 -42 -49 -8 -97 -22 -106 -30 -18 -16 -75 -9 -216
27 -107 26 -156 47 -150 62 2 7 10 61 18 120 11 89 11 110 0 116 -10 6 -14 46
-15 152 -1 79 -8 193 -15 253 -15 124 -12 129 58 142 20 4 43 10 52 15 25 13
29 46 9 64 -18 16 -24 15 -99 -14 -44 -17 -89 -31 -99 -31 -11 0 -36 -7 -56
-15 -85 -36 -375 -26 -471 15 -67 29 -139 105 -153 162 -7 26 -12 58 -12 71 0
53 98 203 163 249 l29 21 -7 -22 c-14 -45 18 -81 55 -61 19 10 31 52 21 69 -4
5 -18 14 -31 19 -23 9 -19 13 59 51 47 22 97 41 111 41 15 0 40 7 56 15 73 36
341 67 397 46z m1519 -299 c0 -96 -25 -282 -48 -361 -10 -32 -11 -1 -3 84 4
50 8 140 8 200 1 61 4 148 8 195 l7 85 14 -45 c8 -27 14 -90 14 -158z m-600
21 c-4 -272 -8 -294 -10 -55 -1 122 1 222 6 222 4 0 6 -75 4 -167z m-2118 32
c3 -36 2 -52 -3 -40 -12 29 -23 134 -12 115 5 -8 11 -42 15 -75z m1953 -357
c-1 -40 -3 -10 -3 67 0 77 1 110 3 73 2 -37 2 -100 0 -140z m91 -273 c0 -62
-3 -99 -7 -85 -4 14 -7 106 -8 205 0 154 1 166 7 85 4 -52 8 -144 8 -205z
m-1708 239 c0 -14 5 -34 11 -45 9 -17 48 -318 49 -373 0 -15 -3 -16 -14 -6
-23 18 -36 102 -62 389 -5 54 -4 72 5 67 6 -4 11 -18 11 -32z m1617 -216 c-2
-35 -3 -9 -3 57 0 66 1 94 3 63 2 -32 2 -86 0 -120z m-1498 30 c14 -112 31
-297 30 -328 -1 -57 -17 17 -23 115 -4 55 -11 125 -16 155 -5 30 -11 84 -14
120 -8 93 10 43 23 -62z m89 -25 c7 -54 14 -143 17 -198 4 -88 3 -93 -5 -40
-16 101 -37 335 -30 335 4 0 12 -44 18 -97z m92 76 c0 -6 4 -52 10 -102 5 -51
14 -155 20 -232 6 -77 13 -161 15 -187 3 -27 1 -48 -5 -48 -9 0 -14 33 -25
145 -26 297 -36 393 -40 413 -4 15 -1 22 10 22 8 0 15 -5 15 -11z m259 -51 c6
-29 15 -132 21 -228 11 -185 16 -245 26 -322 4 -33 2 -48 -5 -48 -7 0 -13 6
-15 13 -12 43 -27 178 -36 324 -6 92 -14 198 -19 236 -4 37 -5 69 -3 72 13 13
21 1 31 -47z m1308 -211 c-2 -23 -3 -1 -3 48 0 50 1 68 3 42 2 -26 2 -67 0
-90z m97 29 c-3 -44 -7 -82 -9 -85 -3 -2 -5 40 -5 95 0 66 3 94 10 84 5 -8 7
-51 4 -94z m-263 -162 c-9 -38 -9 -38 -10 -7 -1 33 10 74 16 57 2 -6 -1 -28
-6 -50z m122 -144 c13 -1 -22 -30 -35 -30 -4 0 -8 9 -8 21 0 15 4 19 16 15 9
-3 21 -6 27 -6z"/>
<path d="M912 1538 c-33 -33 4 -87 49 -73 26 9 44 52 28 71 -14 17 -61 18 -77
2z"/>
</g>
</svg>

<br><br><br>
${msg}
</center>
`
}


function log(req, status = 200) {
  const d = new Date().toISOString()
  const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`
  const { pathname } = new URL(req.url)
  const s = `${dateFmt} [${req.method}] ${pathname} ${status}`
  // using console.debug instead of console.log so chrome inspect users can hide request logs
  console.debug(s)
}
