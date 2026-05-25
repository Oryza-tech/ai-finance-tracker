import { Plus, X, Loader2, UploadCloud, Pencil, AlertCircle } from "lucide-react";
import { useRef } from "react";

export default function TransactionModal({
  isOpen, onClose, isAnalyzing, isSaving,
  formData, onInputChange, onImageUpload, onSave, triggerFileInput,
  editingId = null, error = null,
}) {
  const fileInputRef = useRef(null);
  const isEditing = !!editingId;

  return isOpen ? (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/30 sticky top-0 z-10">
          <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            {isEditing ? <Pencil size={18} className="md:w-5 md:h-5 text-yellow-400" /> : <Plus size={18} className="md:w-5 md:h-5 text-blue-500" />}
            <span className="truncate">{isEditing ? "Edit Transaction" : "Record Transaction"}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors flex-shrink-0 ml-2">
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>
        <div className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
          {error && (
            <div className="bg-rose-900/30 border border-rose-700 rounded-lg p-4 flex gap-3">
              <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-rose-200 text-sm">{error}</p>
            </div>
          )}
          {!isEditing && (
            <>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onImageUpload} />
              <div
                onClick={!isAnalyzing ? () => triggerFileInput(fileInputRef) : undefined}
                className={`border-2 border-dashed border-slate-700 hover:border-blue-500 bg-[#1e293b]/50 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center cursor-pointer transition-all group ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isAnalyzing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-blue-500 w-7 h-7 md:w-8 md:h-8" />
                    <p className="text-blue-400 font-medium text-xs md:text-sm">AI Gemini is extracting data...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-10 md:w-12 h-10 md:h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                      <UploadCloud size={20} className="md:w-6 md:h-6" />
                    </div>
                    <p className="text-white font-medium mb-1 text-sm md:text-base">Upload Receipt (Auto AI)</p>
                    <p className="text-slate-400 text-xs text-center">Let Gemini 3.1 Flash Lite fill in the form below for you.</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="h-px bg-slate-800 flex-1"></div>
                <span className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Manual Input Form</span>
                <div className="h-px bg-slate-800 flex-1"></div>
              </div>
            </>
          )}
          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">Description</label>
              <input type="text" name="deskripsi" value={formData.deskripsi} onChange={onInputChange} placeholder="e.g. Nasi Padang..." className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div className="flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">Amount (Rp)</label>
                <input type="number" name="nominal" value={formData.nominal} onChange={onInputChange} placeholder="20000" min="0" className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">Date</label>
                <input type="date" name="tanggal" value={formData.tanggal} onChange={onInputChange} max={new Date().toISOString().split('T')[0]} className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-slate-300 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">Type</label>
                <select name="tipe" value={formData.tipe} onChange={onInputChange} className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="pengeluaran">Expense</option>
                  <option value="pemasukan">Income</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">Category</label>
                <input type="text" name="kategori" value={formData.kategori} onChange={onInputChange} placeholder="e.g. Makanan, Transport" className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors capitalize" />
              </div>
            </div>
            <button
              onClick={onSave}
              disabled={isSaving}
              className={`w-full text-white font-bold py-3 md:py-3.5 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 mt-3 md:mt-4 text-sm md:text-base ${isEditing ? 'bg-yellow-600 hover:bg-yellow-500 hover:shadow-yellow-500/30' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30'}`}
            >
              {isSaving ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : null}
              {isSaving ? "Saving..." : isEditing ? "Update Transaction" : "Save Transaction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
