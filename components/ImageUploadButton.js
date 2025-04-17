"use client";
import { useState } from 'react';

export default function ImageUploadButton({ onImageSelected }) {
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onImageSelected(url);
    }
  };

  return (
    <label className="gradient-button px-6 py-3 rounded-full text-white font-bold cursor-pointer transition hover:scale-105">
      Escolha uma foto
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleImageUpload}
        className="hidden"
      />
    </label>
  );
}
