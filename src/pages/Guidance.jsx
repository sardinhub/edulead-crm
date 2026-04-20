import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, MessageSquare, Copy, Check, Info, 
  Target, GraduationCap, Users, Clock, AlertCircle, Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
      active 
        ? "bg-violet-600 text-white shadow-lg shadow-violet-200" 
        : "text-slate-500 hover:bg-slate-100"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const ScriptCard = ({ title, script, condition }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-500" />
            {title}
          </h4>
          <span className="px-2 py-0.5 bg-violet-100 text-violet-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
            {condition}
          </span>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="bg-slate-900 rounded-xl p-4 relative group">
          <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line italic">
            "{script}"
          </p>
          <button 
            onClick={handleCopy}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-lg transition-all",
              copied ? "bg-emerald-500 text-white" : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white"
            )}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Guidance() {
  const [activeTab, setActiveTab] = useState('manual');

  const scripts = [
    {
      title: "Orang Tua Sedang Mengumpulkan Biaya",
      condition: "Potensial",
      script: `Halo Kak [Nama Siswa], apa kabar? 😊\n\nMenyambung obrolan kita kemarin, kami sangat mengerti kondisi Kakak/Orang tua yang sedang mengusahakan biaya. Semangat terus ya Kak!\n\nPerlu diinformasikan, kuota kelas Triesakti semakin menipis. Jika Kakak ingin kami bantu 'lock' kursinya sementara sambil menunggu biaya terkumpul, kabari kami ya. Kami ingin sekali melihat Kakak sukses di dunia penerbangan bersama kami. ✈️👍`
    },
    {
      title: "Menunggu Beasiswa Pemerintah",
      condition: "Potensial",
      script: `Selamat pagi Kak [Nama Siswa]!\n\nSemoga pengurusan beasiswanya lancar ya. Kami di Triesakti sangat mendukung ambisi Kakak. Sekedar info, kami bisa bantu siapkan dokumen pendukung dari kampus jika dibutuhkan untuk syarat beasiswanya.\n\nSambil menunggu beasiswa, yuk tetap update info seputar dunia aviasi di grup kami. Kabari kami ya jika ada perkembangan! 🙏`
    },
    {
      title: "Prioritas: Konversi Pendaftaran ke Pangkal",
      condition: "High Priority",
      script: `Halo Kak [Nama Siswa]! Selamat ya, berkas Pendaftaran Kakak sudah kami verifikasi dan dinyatakan LULUS Tes Seleksi! 🥳🎉\n\nLangkah terakhir agar Kakak resmi menjadi Taruna/Taruni Triesakti adalah Cicilan Uang Pangkal pertama. Setelah itu, Kakak akan langsung mendapatkan:\n1. Seragam Resmi Kampus\n2. Atribut & ID Card\n3. Jadwal Orientasi\n\nYuk segera difinalkan sebelum kelas penuh. Hubungi kami jika ada kendala ya Kak!`
    },
    {
      title: "Mencari Biaya / Masih Diusahakan",
      condition: "Potensial",
      script: `Halo Kak [Nama Siswa], selamat pagi!\n\nKami sangat menghargai tekad Kakak untuk bergabung di Triesakti. Jangan patah semangat ya, banyak taruna kami juga berangkat dari kerja keras yang sama.\n\nJika Kakak ingin diskusi mengenai simulasi cicilan yang lebih fleksibel agar terasa lebih ringan, kami sangat terbuka untuk membantu solusinya. Kabari kami ya Kak! 😊`
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Book className="w-7 h-7 text-violet-600" />
            Pusat Panduan & Script Marketing
          </h1>
          <p className="text-slate-500 text-sm italic">Edukasi dan koleksi pesan untuk meningkatkan konversi leads</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <TabButton 
            active={activeTab === 'manual'} 
            onClick={() => setActiveTab('manual')} 
            icon={Info} 
            label="User Manual" 
          />
          <TabButton 
            active={activeTab === 'scripts'} 
            onClick={() => setActiveTab('scripts')} 
            icon={MessageSquare} 
            label="Script Follow-up" 
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'manual' ? (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* SOP Follow-up */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <Target className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">SOP & Strategi Follow-up</h3>
                  <p className="text-xs text-slate-500">Standar operasional tim marketing</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                  <h4 className="font-bold text-red-700 text-sm flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" /> Stop Follow-up Jika:
                  </h4>
                  <ul className="text-xs text-red-600 space-y-1.5 list-disc pl-4 italic">
                    <li>Siswa sudah mendapatkan <b>Pekerjaan</b>.</li>
                    <li>Siswa sedang mengikuti <b>Ujian Kelulusan</b>.</li>
                    <li>Siswa sudah <b>Kuliah di tempat lain</b>.</li>
                  </ul>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-700 text-sm flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" /> Kategori Potensial:
                  </h4>
                  <ul className="text-xs text-emerald-600 space-y-1.5 list-disc pl-4 italic">
                    <li>Orang tua lagi kumpulkan uang.</li>
                    <li>Masih diusahakan biaya.</li>
                    <li>Menunggu beasiswa pemerintah.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Technical Guide */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Panduan Teknis Sistem</h3>
                  <p className="text-xs text-slate-500">Cara menggunakan fitur aplikasi</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm">1</div>
                  <p className="text-[13px] text-slate-600 leading-relaxed font-bold">
                    Import Excel: <span className="font-medium text-slate-400 italic">Pilih Staff PIC terlebih dahulu sebelum mengunggah file leads.</span>
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm">2</div>
                  <p className="text-[13px] text-slate-600 leading-relaxed font-bold">
                    Update Status: <span className="font-medium text-slate-400 italic">Berikan status di setiap baris agar Manager bisa memantau kesehatan leads.</span>
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm">3</div>
                  <p className="text-[13px] text-slate-600 leading-relaxed font-bold">
                    Konversi: <span className="font-medium text-slate-400 italic">Klik ikon Centang jika siswa sudah bayar uang pendaftaran agar masuk ke Database Utama.</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="scripts"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {scripts.map((item, idx) => (
              <ScriptCard key={idx} {...item} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
