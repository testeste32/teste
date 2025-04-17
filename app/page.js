import ObjectDetection from "@/components/ObjectDetection";
import { useState } from 'react';

export default function ImageUpload() {
  const [image, setImage] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) setImage(URL.createObjectURL(file));
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Upload de Imagem</h1>
      
      {/* Input de upload invisível */}
      <input 
        type="file" 
        accept="image/*"
        onChange={handleUpload}
        id="upload-input"
        style={{ display: 'none' }}
      />
      
      {/* Botão personalizado */}
      <label 
        htmlFor="upload-input"
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          background: '#0070f3',
          color: 'white',
          borderRadius: '5px',
          cursor: 'pointer',
          margin: '20px 0'
        }}
      >
        Selecione uma imagem
      </label>

      {/* Preview da imagem */}
      {image && (
        <div>
          <img 
            src={image} 
            alt="Preview" 
            style={{ maxWidth: '100%', maxHeight: '300px', marginTop: '20px' }}
          />
        </div>
      )}
    </div>
  );
}
  
