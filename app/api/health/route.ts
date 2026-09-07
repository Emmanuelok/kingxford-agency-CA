export async function GET() {
  return Response.json(
    { status: "ok", service: "avalon-creative-group", release: "3.0.0" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
