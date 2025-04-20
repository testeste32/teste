'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function ClassificarPage() {
  const tfRef = useRef(null);

  const [modelo, setModelo] = useState(null);
  const [imagemPreview, setImagemPreview] = useState(null);
  const [imagemTensor, setImagemTensor] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [probabilidade, setProbabilidade] = useState(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setProcessando(true);
        const tf = await import('@tensorflow/tfjs');
        tfRef.current = tf;

        const loadedModel = await tf.loadGraphModel('/modelo/model.json');
        if (isMounted) {
          setModelo(loadedModel);
          console.log('✅ Modelo Graph carregado com sucesso!');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar o modelo Graph:', error);
      } finally {
        setProcessando(false);
      }
    })();

    return () => {
      isMounted = false;
      if (modelo && modelo.dispose) modelo.dispose();
      if (imagemTensor && imagemTensor.dispose) imagemTensor.dispose();
    };
  }, []);

  useEffect(() => {
    const base64 = localStorage.getItem('imagemCortada');
    if (!base64 || !tfRef.current || !modelo) return;

    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const tf = tfRef.current;

      const tensor = tf.tidy(() => {
        return tf.browser
          .fromPixels(img)
          .resizeNearestNeighbor([224, 224])
          .toFloat()
          .div(tf.scalar(255))
          .expandDims();
      });

      if (imagemTensor && imagemTensor.dispose) {
        imagemTensor.dispose();
      }

      setImagemPreview(base64);
      setImagemTensor(tensor);
      console.log('🖼️ Imagem cropada carregada do localStorage!');
    };
  }, [modelo]);

  const rodarClassificacao = () => {
    if (!modelo || !imagemTensor || !tfRef.current) {
      console.warn('⚠️ Modelo ou imagem não prontos para classificação.');
      return;
    }

    const tf = tfRef.current;

    const predTensor = tf.tidy(() => modelo.predict(imagemTensor));

    predTensor.data().then((data) => {
      const prob = data[0];
      setResultado(prob > 0.5 ? 'Maligno' : 'Benigno');
      setProbabilidade((prob * 100).toFixed(2));
      console.log('🧠 Probabilidade de maligno:', prob);
      predTensor.dispose();
    });
  };

  return (
    <div className="p-8 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Classificador de Lesão de Pele</h1>

      {processando && <p>Carregando modelo…</p>}

      {imagemPreview && (
        <div className="mb-4">
          <img
            src={imagemPreview}
            alt="Pré-visualização"
            className="mx-auto w-[224px] h-[224px] rounded shadow border"
          />
        </div>
      )}

      <button
        onClick={rodarClassificacao}
        disabled={!modelo || !imagemTensor}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        Rodar IA
      </button>

      {resultado && (
        <div className="mt-6 text-xl font-semibold">
          Resultado:{' '}
          <span className={resultado === 'Maligno' ? 'text-red-600' : 'text-green-600'}>
            {resultado}
          </span>
          {probabilidade && (
            <p className="text-sm mt-2 text-gray-600">Probabilidade de maligno: {probabilidade}%</p>
          )}
        </div>
      )}
    </div>
  );
}

