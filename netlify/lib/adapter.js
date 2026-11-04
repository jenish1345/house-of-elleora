// Runs our (event) => { statusCode, headers, body } handlers as modern Netlify
// Functions (Request -> Response), which Netlify Blobs needs for strong consistency.
function toFunction(handler) {
  return async (req) => {
    const url = new URL(req.url);
    const event = {
      httpMethod: req.method,
      headers: Object.fromEntries(req.headers),
      queryStringParameters: Object.fromEntries(url.searchParams),
      body: req.method === 'GET' || req.method === 'HEAD' ? null : await req.text()
    };
    const result = await handler(event, {});
    const body = result.isBase64Encoded ? Buffer.from(result.body, 'base64') : result.body;
    return new Response(body, { status: result.statusCode, headers: result.headers || {} });
  };
}

module.exports = { toFunction };
