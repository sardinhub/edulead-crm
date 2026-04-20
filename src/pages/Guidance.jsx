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
      condition: "Closing Strategy",
      script: `Halo Kak [Nama Siswa], apa kabar? 😊 Saya paham sekali, investasi untuk masa depan memang butuh perjuangan besar dari Orang Tua. \n\nNamun, kabar kurang baiknya, kuota kelas kita tersisa sangat sedikit karena tingginya peminat bulan ini. Sayang sekali jika perjuangan Orang Tua tertunda hanya karena kursi Kakak diambil orang lain. \n\nBagaimana jika kita amankan kursinya dulu dengan cicilan minimal agar impian Kakak sukses di penerbangan tetap terjaga? Kami ingin sekali melihat Kakak sukses bersama kami. ✈️👍`
    },
    {
      title: "Menunggu Beasiswa Pemerintah",
      condition: "Plan B Tactics",
      script: `Selamat pagi Kak [Nama Siswa]! Luar biasa semangat Kakak mengejar beasiswa. 🎓 \n\nSekedar saran dari pengalaman kami: Banyak yang akhirnya tertunda satu tahun hanya karena tidak punya 'Plan B' yang pasti. Sambil menunggu pengumuman beasiswa, saran saya Kakak resmi 'mengunci' kursi di Triesakti dulu. \n\nJika beasiswanya tembus, Kakak tetap punya bekal mental dari kami. Jika belum rejeki, Kakak sudah punya tempat aman untuk masa depan. Mana yang menurut Kakak lebih tenang: Menunggu dalam ketidakpastian atau melangkah dengan persiapan? 😊`
    },
    {
      title: "Prioritas: Konversi Pendaftaran ke Pangkal",
      condition: "Identity Shift",
      script: `Halo Kak [Nama Siswa]! Tinggal satu langkah kecil lagi untuk mengubah status Kakak dari 'Pendaftar' menjadi 'Taruna Resmi' Triesakti. ✈️ \n\nSetelah pembayaran Pangkal ini, Kakak bukan lagi sekedar calon, tapi sudah masuk dalam daftar pengukuran Seragam dan Atribut resmi kampus. Inilah saatnya Kakak membanggakan orang tua dengan status Taruna Penerbangan yang sebenarnya. \n\nKami sudah siapkan berkas atributnya, tinggal menunggu konfirmasi dari Kakak. Siap untuk menjemput seragam Kakak hari ini? 🥳🎉`
    },
    {
      title: "Mencari Biaya / Masih Diusahakan",
      condition: "Solution Selling",
      script: `Halo Kak [Nama Siswa]! Saya sangat mengapresiasi kegigihan Kakak untuk bergabung. \n\nBiasanya, kendala 'masih diusahakan' itu hanya soal skema pembayaran yang kurang cocok saja. Bagaimana kalau kita bedah bareng solusinya? Kami punya skema cicilan khusus yang mungkin jauh lebih ringan dan masuk akal untuk kondisi Kakak saat ini. \n\nJangan biarkan kendala teknis mematikan impian besar Kakak. Bisa kita telepon sebentar sore ini untuk cari jalan keluarnya? 😊`
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
