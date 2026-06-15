"use client";

import { useEffect, useRef } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const modelRef = useRef<any>(null);
  const detectingRef = useRef(false);
  const greetedRef = useRef(false);
  const animationRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  };

  const loadModel = async () => {
    const tf = await import("@tensorflow/tfjs");
    await import("@tensorflow/tfjs-backend-cpu");

    await tf.setBackend("cpu");
    await tf.ready();

    const cocoSsd = await import("@tensorflow-models/coco-ssd");

    modelRef.current = await cocoSsd.load();

    if (statusRef.current) {
      statusRef.current.innerText = "";
    }
  };

  // 🔊 Speak (SpeechGen API)
  const speak = async (text: string, onEnd?: () => void) => {
    console.log("🔊 SpeechGen дуудаж байна:", text);

    try {
      const res = await fetch("/api/speechgen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("SpeechGen API алдаа:", error);
        return;
      }

      const data = await res.json();
      const audioUrl = data.audioUrl;

      if (!audioUrl) {
        console.error("Audio URL олдсонгүй");
        return;
      }

      console.log("✅ Audio URL:", audioUrl);

      // Audio тоглуулах
      const audio = new Audio(audioUrl);
      audio.onloadeddata = () => console.log("▶️ Дуу тоглож байна");
      audio.onended = () => {
        console.log("⏹️ Дуу дууслаа");
        if (onEnd) onEnd();
      };
      audio.onerror = (e) => console.error("❌ Audio алдаа:", e);

      await audio.play();
    } catch (error) {
      console.error("Speak алдаа:", error);
    }
  };

  // 🌐 API (CORS FIX via proxy)
  const getCustomerName = async (attendanceId: string) => {
    try {
      const res = await fetch(`/api/customer?attendanceId=${attendanceId}`);

      const data = await res.json();

      console.log("API RESPONSE:", data);

      return data.data;
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  // 🤖 Detection LOOP
  const detectPerson = async () => {
    if (detectingRef.current || !modelRef.current || !videoRef.current) return;

    detectingRef.current = true;

    try {
      const predictions = await modelRef.current.detect(videoRef.current);

      const personFound = predictions.some(
        (p: any) => p.class === "person" && p.score > 0.75,
      );

      if (personFound) {
        if (statusRef.current) {
          statusRef.current.innerText = "";
        }

        animationRef.current?.play();

        if (!greetedRef.current) {
          greetedRef.current = true;

          const name = await getCustomerName("6a2bcf924673f26a9c2c1da4");

          console.log("👤 Хэрэглэгчийн нэр:", name);
          console.log("🎯 Зочин эсэх:", name === "Зочин");

          if (name && name !== "Зочин") {
            console.log("✅ Нэр хэлэх:", name);
            speak(name, () => {
              speak("амжилттай бүртгүүллээ");
            });
          } else {
            console.log("⏭️ Зочин байна, дуу гаргахгүй");
          }
        }
      } else {
        if (statusRef.current) {
          statusRef.current.innerText = "";
        }

        animationRef.current?.stop();
        greetedRef.current = false;
      }
    } catch (e) {
      console.log(e);
    }

    detectingRef.current = false;
  };

  useEffect(() => {
    const init = async () => {
      await startCamera();
      await loadModel();

      // Анхны мэндчилгээ - soundT.mp3 тоглуулах
      setTimeout(() => {
        console.log("🔊 soundT.mp3 тоглуулж байна");
        audioRef.current?.play();
      }, 1000);

      intervalRef.current = setInterval(detectPerson, 1000);
    };

    init();

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden grid grid-cols-3 bg-gray-200 px-10">
      <video ref={videoRef} className="hidden" />

      {/* Image 1 - 1/3 */}
      <div className="col-span-1 flex items-center justify-center p-4">
        <img
          src="/image2.png"
          alt="Image 1"
          className="w-full h-full object-contain"
        />
      </div>

      {/* QR - 1/3 */}
      <div className="col-span-1 flex items-center justify-center p-4">
        <img
          src="/QR.png"
          alt="QR Code"
          className="w-1/2 h-auto object-contain"
        />
      </div>

      {/* Image 2 - 1/3 */}
      <div className="col-span-1 flex items-center justify-center p-4">
        <img
          src="/image1.png"
          alt="Image 2"
          className="w-full h-full object-contain"
        />
      </div>
      <div
        ref={statusRef}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-2xl font-bold text-black z-20"
      ></div>

      <audio ref={audioRef} src="/soundT.mp3" />
    </div>
  );
}
