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

  // 🎬 Lottie
  const loadLottie = async () => {
    const lottie = (await import("lottie-web")).default;

    animationRef.current = lottie.loadAnimation({
      container: document.getElementById("lottie")!,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/loading.json",
    });
  };

  // 📷 Camera
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

  // 🧠 Model (CPU SAFE)
  const loadModel = async () => {
    const tf = await import("@tensorflow/tfjs");
    await import("@tensorflow/tfjs-backend-cpu");

    await tf.setBackend("cpu");
    await tf.ready();

    const cocoSsd = await import("@tensorflow-models/coco-ssd");

    modelRef.current = await cocoSsd.load();

    if (statusRef.current) {
      statusRef.current.innerText = "✅ CPU mode дээр бэлэн";
    }
  };

  // 🔊 Speak
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "mn-MN";
    speechSynthesis.speak(utterance);
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
          statusRef.current.innerText = "👤 Хүн илэрлээ";
        }

        animationRef.current?.play();

        if (!greetedRef.current) {
          greetedRef.current = true;

          const name = await getCustomerName("6a2bcf924673f26a9c2c1da4");

          if (name && name !== "Зочин") {
            speak(`${name} амжилттай бүртгүүллээ`);
          }

          audioRef.current?.play();
        }
      } else {
        if (statusRef.current) {
          statusRef.current.innerText = "⏳ Хүн хүлээж байна";
        }

        animationRef.current?.stop();
        greetedRef.current = false;
      }
    } catch (e) {
      console.log(e);
    }

    detectingRef.current = false;
  };

  // 🚀 INIT
  useEffect(() => {
    const init = async () => {
      await startCamera();
      await loadModel();
      await loadLottie();

      intervalRef.current = setInterval(detectPerson, 1000);
    };

    init();

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <video ref={videoRef} className="hidden" />

      <div id="lottie" className="w-[200px] h-[200px]" />

      <div ref={statusRef} className="text-2xl font-bold mt-5">
        Систем эхэлж байна...
      </div>

      <audio ref={audioRef} src="/sound1.mp3" />
    </div>
  );
}
