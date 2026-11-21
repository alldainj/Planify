
const RENDER_API = "https://planify-bbwh.onrender.com";

export async function onRequest(context) {
    const incomingUrl = new URL(context.request.url);

    const targetUrl = new URL(
        incomingUrl.pathname + incomingUrl.search,
        RENDER_API
    );

    const headers = new Headers(context.request.headers);

    headers.delete("host");

    const options = {
        method: context.request.method,
        headers,
        redirect: "manual"
    };

    if (!["GET", "HEAD"].includes(context.request.method)) {
        options.body = context.request.body;
    }

    try {
        const upstream = await fetch(targetUrl.toString(), options);

        const responseHeaders = new Headers(upstream.headers);

        responseHeaders.delete("content-encoding");
        responseHeaders.delete("content-length");

        return new Response(upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers: responseHeaders
        });
    } catch (error) {
        return new Response(
            JSON.stringify({
                detail: "Не удалось подключиться к серверу Planify."
            }),
            {
                status: 502,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
}
