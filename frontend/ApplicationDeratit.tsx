import React, { useState, useRef, useEffect } from "react";

const ApplicationDeratit: React.FC = () => {
  const [photosAvant, setPhotosAvant] = useState<File[]>([]);
  const [photosApres, setPhotosApres] = useState<File[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const [rapport, setRapport] = useState({
    typeIntervention: "",
    adresse: "",
    geo: "",
    etatAvant: "",
    methodes: "",
    produits: "",
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  const handleChange = (e: any) => {
    setRapport({ ...rapport, [e.target.name]: e.target.value });
  };

  const handlePhotosAvant = (e: any) => {
    setPhotosAvant([...e.target.files]);
  };

  const handlePhotosApres = (e: any) => {
    setPhotosApres([...e.target.files]);
  };

  // SIGNATURE : gestion du dessin
  const getPos = (event: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if (event.touches) {
      const touch = event.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = (event: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawing.current = true;
    const { x, y } = getPos(event, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawing.current) return;
    event.preventDefault();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getPos(event, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDrawing = () => {
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Convertir une signature DataURL → fichier Blob
  const dataURLtoBlob = (dataUrl: s
