export async function GET() {
  return Response.json(
    { status: "ok", service: "avalon-creative-group", release: "4.0.0" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
