export async function GET() {
  return Response.json(
    { status: "ok", service: "kingxford", release: "2.0.0" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
