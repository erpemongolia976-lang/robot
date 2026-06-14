"use client";

import { useEffect, useRef } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  let model: any = null;
  let detecting = false;
  let greeted = false;
  let animation: any;
  let interval: any;

  // 🎬 Lottie
  const loadLottie = async () => {
    const lottie = (await import("lottie-web")).default;

    animation = lottie.loadAnimation({
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

  // 🧠 Model (FIXED CPU backend)
  const loadModel = async () => {
    const tf = await import("@tensorflow/tfjs");
    await import("@tensorflow/tfjs-backend-cpu");

    await tf.setBackend("cpu");
    await tf.ready();

    const cocoSsd = await import("@tensorflow-models/coco-ssd");

    model = await cocoSsd.load();

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

  // 🌐 API
  const getCustomerName = async (attendanceId: string) => {
    try {
      const url =
        "https://e-mongolia.mn/portal/shared-service/api/attendanceLog/customerFullName?attendanceId=" +
        encodeURIComponent(attendanceId);

      const res = await fetch(url);
      const data = await res.json();

      console.log("📡 API RESPONSE:", data);

      return data.data;
    } catch (e) {
      console.log(e);
      return null;
    }
  };

  const detectPerson = async () => {
    if (detecting || !model || !videoRef.current) return;

    detecting = true;

    try {
      const predictions = await model.detect(videoRef.current);

      const personFound = predictions.some(
        (p: any) => p.class === "person" && p.score > 0.75,
      );

      if (personFound) {
        if (statusRef.current) {
          statusRef.current.innerText = "👤 Хүн илэрлээ";
        }

        animation?.play();

        if (!greeted) {
          greeted = true;

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

        animation?.stop();
        greeted = false;
      }
    } catch (e) {
      console.log(e);
    }

    detecting = false;
  };
  useEffect(() => {
    const init = async () => {
      await startCamera();
      await loadModel();
      await loadLottie();

      interval = setInterval(detectPerson, 1000);
    };

    init();

    return () => {
      clearInterval(interval);
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
