import { Plus, X, Loader2, UploadCloud, Pencil } from "lucide-react";
import { useRef } from "react";

export default function TransactionModal({
  isOpen, onClose, isAnalyzing, isSaving,
  formData, onInputChange, onImageUpload, onSave, triggerFileInput,
  editingId = null,
}) {
  const fileInputRef = useRef(null);
  const isEditing = !!editingId;

  return isOpen ? (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/30">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {isEditing ? <Pencil size={20} className="text-yellow-400" /> : <Plus className="text-blue-500" />}
            {isEditing ? "Edit Transaction" : "Record Transaction"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-6">
          {!isEditing && (
            <>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onImageUpload} />
              <div
                onClick={!isAnalyzing ? () => triggerFileInput(fileInputRef) : undefined}
                className={`border-2 border-dashed border-slate-700 hover:border-blue-500 bg-[#1e293b]/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isAnalyzing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-blue-400 font-medium text-sm">AI Gemini is extracting data...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-white font-medium mb-1">Upload Receipt (Auto AI)</p>
                    <p className="text-slate-400 text-xs text-center">Let Gemini 3.1 Flash Lite fill in the form below for you.</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="h-px bg-slate-800 flex-1"></div>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Manual Input Form</span>
                <div className="h-px bg-slate-800 flex-1"></div>
              </div>
            </>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">Description</label>
              <input type="text" name="deskripsi" value={formData.deskripsi} onChange={onInputChange} placeholder="e.g. Nasi Padang..." className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">Amount (Rp)</label>
                <input type="number" name="nominal" value={formData.nominal} onChange={onInputChange} placeholder="20000" className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">Date</label>
                <input type="date" name="tanggal" value={formData.tanggal} onChange={onInputChange} className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">Type</label>
                <select name="tipe" value={formData.tipe} onChange={onInputChange} className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="pengeluaran">Expense</option>
                  <option value="pemasukan">Income</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">Category</label>
                <input type="text" name="kategori" value={formData.kategori} onChange={onInputChange} placeholder="e.g. Makanan, Transport" className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors capitalize" />
              </div>
            </div>
            <button
              onClick={onSave}
              disabled={isSaving}
              className={`w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 mt-4 ${isEditing ? 'bg-yellow-600 hover:bg-yellow-500 hover:shadow-yellow-500/30' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30'}`}
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : null}
              {isSaving ? "Saving..." : isEditing ? "Update Transaction" : "Save Transaction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
