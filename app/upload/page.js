'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [croppedImage, setCroppedImage] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cropSize, setCropSize] = useState(224);
  const [modoVisualizacao, setModoVisualizacao] = useState(false);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const screenSize = Math.min(window.innerWidth, window.innerHeight);
    const isDesktop = window.innerWidth >= 768;
    const dynamicSize = Math.round(screenSize * (isDesktop ? 0.3 : 0.6));
    setCropSize(dynamicSize);

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleImageChange = (event) => {
    if (event.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          setSelectedImage(e.target.result);
          setZoom(0.25);
          setOffset({ x: 0, y: 0 });
          setCroppedImage(null);
          setModoVisualizacao(false);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
  };

  const handleDrag = () => {
    let startX = 0, startY = 0;

    const updateOffset = (dx, dy) => {
      setOffset(prev => {
        const effectiveWidth = imageSize.width * zoom;
        const effectiveHeight = imageSize.height * zoom;

        const maxOffsetX = Math.max(0, (effectiveWidth - cropSize) / 2);
        const maxOffsetY = Math.max(0, (effectiveHeight - cropSize) / 2);

        let newX = prev.x + dx;
        let newY = prev.y + dy;

        newX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
        newY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY));

        return { x: newX, y: newY };
      });
    };

    const onMouseMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = e.clientX;
      startY = e.clientY;
      updateOffset(dx, dy);
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        startX = touch.clientX;
        startY = touch.clientY;
        updateOffset(dx, dy);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    const onStart = (e) => {
      if (e.type === 'mousedown') {
        startX = e.clientX;
        startY = e.clientY;
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      } else if (e.type === 'touchstart') {
        if (e.touches.length === 1) {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          window.addEventListener('touchmove', onTouchMove, { passive: false });
          window.addEventListener('touchend', onTouchEnd);
        }
      }
    };

    return onStart;
  };

  const handleCrop = () => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 224;
    canvas.height = 224;

    const naturalWidth = imageSize.width;
    const naturalHeight = imageSize.height;
    const scaleX = naturalWidth / (imageSize.width * zoom);
    const scaleY = naturalHeight / (imageSize.height * zoom);

    const cropX = (-offset.x * scaleX) + ((imageSize.width * zoom - cropSize) / 2 * scaleX);
    const cropY = (-offset.y * scaleY) + ((imageSize.height * zoom - cropSize) / 2 * scaleY);

    ctx.drawImage(
      imageRef.current,
      Math.max(0, cropX),
      Math.max(0, cropY),
      Math.min(cropSize * scaleX, naturalWidth - Math.max(0, cropX)),
      Math.min(cropSize * scaleY, naturalHeight - Math.max(0, cropY)),
      0, 0, 224, 224
    );

    const result = canvas.toDataURL('image/jpeg');
    setCroppedImage(result);
    setModoVisualizacao(true);
  };

  const handleAnalisar = () => {
    if (croppedImage) {
      localStorage.setItem('imagemCortada', croppedImage);
      router.push('/classificar');
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {!selectedImage && (
        <>
          <h1 className="text-xl font-bold mb-4 text-center">Upload de Imagem da Lesão</h1>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mb-4 block text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          />
        </>
      )}

      {selectedImage && !modoVisualizacao && (
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative flex items-center justify-center"
            onWheel={handleWheel}
            style={{
              width: `${cropSize * 2}px`,
              height: `${cropSize * 2}px`,
              border: '4px solid yellow',
              position: 'relative',
              overflow: 'hidden',
              maxHeight: '80vh'
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: `${imageSize.width}px`,
                height: `${imageSize.height}px`,
              }}
              onMouseDown={handleDrag()}
              onTouchStart={handleDrag()}
            >
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Imagem"
                style={{
                  display: 'block',
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none'
                }}
              />
            </div>

            <div
              style={{
                position: 'absolute',
                width: `${cropSize}px`,
                height: `${cropSize}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                border: '4px solid red',
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              <div style={{
                width: '85%',
                height: '85%',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 255, 0, 0.3)',
                margin: 'auto',
                marginTop: 'calc(7.5%)',
              }} />
            </div>
          </div>

          <p className="text-sm text-green-700 text-center">
            Coloque a lesão dentro da área verde
          </p>

          <div className="flex justify-center gap-2 flex-wrap">
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="px-3 py-1 bg-blue-500 text-white rounded">Zoom +</button>
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="px-3 py-1 bg-blue-500 text-white rounded">Zoom -</button>
            <button onClick={handleCrop} className="px-4 py-1 bg-green-600 text-white rounded">Cortar Imagem</button>
          </div>
        </div>
      )}

      {modoVisualizacao && croppedImage && (
        <div className="flex flex-col items-center gap-4">
          <img
            src={croppedImage}
            alt="Imagem Cortada"
            className="border border-gray-400"
            style={{ width: '224px', height: '224px' }}
          />
          <div className="flex gap-3 mt-2">
            <button
  onClick={() => {
    setSelectedImage(null);
    setCroppedImage(null);
    setModoVisualizacao(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }}
  className="px-4 py-1 bg-gray-500 text-white rounded"
>
  Voltar
</button>
            <button onClick={handleAnalisar} className="px-4 py-1 bg-indigo-600 text-white rounded">Analisar</button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

