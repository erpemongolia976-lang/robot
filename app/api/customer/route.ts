export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const attendanceId = searchParams.get("attendanceId");

    if (!attendanceId) {
      return Response.json({ error: "attendanceId missing" }, { status: 400 });
    }

    const url =
      "https://e-mongolia.mn/portal/shared-service/api/attendanceLog/customerFullName?attendanceId=" +
      encodeURIComponent(attendanceId);

    const res = await fetch(url);

    if (!res.ok) {
      return Response.json(
        { error: "Upstream API error" },
        { status: res.status },
      );
    }

    const data = await res.json();

    return Response.json(data);
  } catch (err) {
    console.log(err);

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
