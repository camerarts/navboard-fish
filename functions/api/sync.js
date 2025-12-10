
export async function onRequestGet(context) {
  try {
    // Safety check: Ensure KV binding exists
    if (!context.env.FLATNAV_KV) {
       return new Response(JSON.stringify({ error: "KV Binding 'FLATNAV_KV' not found. Please bind it in Cloudflare Pages settings." }), { 
           status: 503,
           headers: { "Content-Type": "application/json" }
       });
    }

    // 从绑定的 KV 命名空间中读取数据
    const data = await context.env.FLATNAV_KV.get("dashboard_data");
    
    if (!data) {
      return new Response(JSON.stringify({ empty: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(data, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const request = context.request;
    const body = await request.json();
    
    // Get password from Cloudflare Environment Variable, fallback to '1211'
    const SERVER_PASSWORD = context.env.PASSWORD || '1211';
    
    // Check Authorization
    const authHeader = request.headers.get("x-auth-token");
    if (authHeader !== SERVER_PASSWORD) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
      });
    }

    // Verification Mode (Login Check)
    if (body.verifyOnly) {
        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // Safety check: Ensure KV binding exists
    if (!context.env.FLATNAV_KV) {
       return new Response(JSON.stringify({ error: "KV Binding 'FLATNAV_KV' not found." }), { status: 503 });
    }

    // Write to KV
    // Set cacheTtl to 60 seconds (optional)
    await context.env.FLATNAV_KV.put("dashboard_data", JSON.stringify(body));

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}