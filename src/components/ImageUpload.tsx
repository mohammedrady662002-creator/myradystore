import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  value?: string;
  label?: string;
  className?: string;
}

export function ImageUpload({ onUpload, value, label, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صوره صالح');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً (الأقصى 2 ميجا)');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // For this implementation, we convert to base64
      // In a production app, you would upload to Firebase Storage or similar
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onUpload(base64String);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('حدث خطأ أثناء قراءة الملف');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('فشل رفع الصورة');
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2">{label}</label>}
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative min-h-[200px] rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center",
          value 
            ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10" 
            : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 group hover:border-primary/50"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-400">جاري المعالجة...</p>
          </div>
        ) : value ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl border-4 border-white dark:border-slate-800">
            <img src={value} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <button 
              onClick={handleRemove}
              className="absolute top-4 left-4 p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="absolute top-4 right-4 p-2 bg-emerald-500 text-white rounded-xl shadow-lg">
              <CheckCircle2 size={18} />
            </div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform bg-slate-800/50">
              <Upload size={32} />
            </div>
            <h4 className="text-lg font-black text-slate-700 dark:text-white mb-2">
              اسحب الصورة هنا أو <span className="text-primary underline">اضغط للاختيار</span>
            </h4>
            <p className="text-xs text-slate-400 font-bold max-w-[240px] leading-relaxed">
              يمكنك رفع صور JPG أو PNG بحد أقصى 2 ميجا بايت
            </p>
          </>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-rose-500 text-xs font-bold animate-pulse">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
