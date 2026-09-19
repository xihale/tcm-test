// 反代到 Cloudflare Pages 源站，配合 Worker Route + 灰云 CNAME 优选域名使用
// 静态资源（immutable）在边缘 Cache API 永久缓存；HTML 缓存 5 分钟，部署后最长延迟 5 分钟可见
const ORIGIN = 'tcm-test.pages.dev'
const HSTS = 'max-age=31536000; includeSubDomains'

async function handle(request, ctx) {
  const url = new URL(request.url)

  // 灰云记录不触发 zone 级 Always Use HTTPS，HTTP→HTTPS 重定向在 Worker 内兜底
  if (url.protocol === 'http:') {
    url.protocol = 'https:'
    return new Response(null, { status: 301, headers: { location: url.toString() } })
  }

  const cache = caches.default
  const cacheable = request.method === 'GET' && !url.search
  if (cacheable) {
    const hit = await cache.match(request)
    if (hit) {
      const r = new Response(hit.body, hit)
      r.headers.set('x-worker-cache', 'HIT')
      return r
    }
  }

  const origin = new URL(request.url)
  origin.hostname = ORIGIN
  const resp = await fetch(new Request(origin, request))

  // Pages 的重定向若是源站绝对地址，改写回业务域名，避免跳回 pages.dev
  let out = resp
  const loc = resp.headers.get('location')
  if (loc && loc.includes(ORIGIN)) {
    const headers = new Headers(resp.headers)
    headers.set('location', loc.split(ORIGIN).join(''))
    out = new Response(resp.body, { status: resp.status, headers })
  }

  if (cacheable && out.status === 200) {
    const isImmutableAsset = url.pathname.startsWith('/assets/')
    const isHtml = (out.headers.get('content-type') || '').includes('text/html')
    if (isImmutableAsset || isHtml) {
      const headers = new Headers(out.headers)
      headers.set('Cache-Control', isHtml ? 'public, max-age=300' : 'public, max-age=31536000, immutable')
      const toCache = new Response(out.body, { status: out.status, headers })
      ctx.waitUntil(cache.put(request, toCache.clone()))
      const r = new Response(toCache.body, toCache)
      r.headers.set('x-worker-cache', 'MISS')
      return r
    }
  }
  return out
}

export default {
  async fetch(request, env, ctx) {
    let resp
    try {
      resp = await handle(request, ctx)
    } catch (e) {
      // 回源偶发网络抖动兜底：绕过缓存直接再试一次
      try {
        const retry = new URL(request.url)
        retry.hostname = ORIGIN
        resp = await fetch(new Request(retry, request))
      } catch (e2) {
        return new Response('upstream temporarily unavailable, please retry', {
          status: 503,
          headers: { 'retry-after': '5', 'content-type': 'text/plain; charset=utf-8' },
        })
      }
    }
    // 回源 fetch 的原始响应 headers 不可变，经构造函数复制解冻后再附加 HSTS
    resp = new Response(resp.body, resp)
    resp.headers.set('Strict-Transport-Security', HSTS)
    return resp
  },
}
