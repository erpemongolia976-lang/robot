import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Текст дутуу байна" }, { status: 400 });
    }

    const token = process.env.SPEECHGEN_API_TOKEN;
    const email = process.env.SPEECHGEN_EMAIL;

    if (!token || !email) {
      return NextResponse.json(
        { error: "SPEECHGEN_API_TOKEN эсвэл SPEECHGEN_EMAIL тохируулаагүй" },
        { status: 500 },
      );
    }

    // SpeechGen API дуудах
    const formData = new URLSearchParams();
    formData.append("token", token);
    formData.append("email", email);
    formData.append("voice", "Bataa");
    formData.append("text", text);
    formData.append("format", "mp3");
    formData.append("speed", "1.0");
    formData.append("pitch", "1.0");

    const response = await fetch("https://speechgen.io/index.php?r=api/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SpeechGen алдаа:", errorText);
      return NextResponse.json(
        { error: "SpeechGen API алдаа", details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();

    // API response: { status: 1, file: "url", parts: 1, parts_id: "..." }
    if (data.status === 1 && data.file) {
      // Audio URL буцаах
      return NextResponse.json({ audioUrl: data.file });
    } else {
      console.error("SpeechGen алдаа:", data);
      return NextResponse.json(
        { error: "Аудио үүсгэж чадсангүй", details: data },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("SpeechGen алдаа:", error);
    return NextResponse.json(
      { error: error.message || "Дуу гаргахад алдаа гарлаа" },
      { status: 500 },
    );
  }
}
