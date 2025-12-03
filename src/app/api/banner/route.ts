export async function GET() {
    const r = await fetch("https://vgc.psofttechnologies.in/api/v1/banners", {
      cache: "no-store",
    });
  
    const data = await r.json();
  
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
  