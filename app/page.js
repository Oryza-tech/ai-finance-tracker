"use client";

import { useState } from "react";
import { supabase } from "./supabase"; 
import Link from "next/link"; // Komponen krusial untuk navigasi antar halaman

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcessImage = async () => {
    if (!file) return alert("Pilih file gambar dulu, Bro!");
    setLoading(true);
    setExtractedData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/process-receipt", { method: "POST", body: formData });
      const result = await response.json();
      if (response.ok) {
        const dataToSave = {
          ...result.data,
          nominal: Number(result.data.nominal)
        };
        setExtractedData(dataToSave);
      } else alert("Gagal: " + result.error);
    } catch (error) {
      alert("Error menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setExtractedData(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveToDatabase = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([extractedData]);

      if (error) throw error;
      
      alert("Data berhasil masuk ke Database! 🚀");
      setExtractedData(null); 
      setFile(null);
      // Reset input form file di layar biar kembali kosong
      document.getElementById('file-input').value = '';
    } catch (error) {
      alert("Gagal menyimpan ke database: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-md">
        
        {/* Header dengan Tombol Navigasi ke Dashboard */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-blue-600">AI Finance Tracker</h1>
          <Link href="/dashboard" className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors font-semibold">
            Lihat Dashboard ➔
          </Link>
        </div>
        
        <input 
          id="file-input"
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="block w-full border p-2 mb-4 rounded-md" 
        />
        <button 
          onClick={handleProcessImage} 
          disabled={loading} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-400 transition-colors">
          {loading ? "Memproses AI..." : "Ekstrak Data"}
        </button>

        {extractedData && (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
            <h2 className="font-bold text-green-700 mb-4">Hasil Review</h2>
            <div className="space-y-3">
              {Object.keys(extractedData).map((key) => (
                <div key={key}>
                  <label className="text-sm font-semibold capitalize">{key.replace('_', ' ')}</label>
                  <input 
                    type={key === 'nominal' ? "number" : "text"} 
                    value={extractedData[key]} 
                    onChange={(e) => handleInputChange(key, key === 'nominal' ? Number(e.target.value) : e.target.value)}
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500" 
                  />
                </div>
              ))}
            </div>
            <button 
              onClick={handleSaveToDatabase} 
              disabled={saving}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-400 transition-colors">
              {saving ? "Menyimpan..." : "Simpan ke Database"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}