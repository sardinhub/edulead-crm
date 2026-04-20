import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Clock, Phone } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, colorClass }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClass)}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className={trend > 0 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
        <span className="text-slate-400">{trendLabel}</span>
      </div>
    )}
  </div>
);

export default function Dashboard() {
  const { students, leadsRecap, fetchLeadsRecap, logActivity } = useStore();
  const hotLeads = students.filter(s => s.priority_level === 'High');

  React.useEffect(() => {
    fetchLeadsRecap();
  }, []);

  // Kalkulasi Dinamis dari Students Database
  const totalStudents = students.length;
  
  // Kalkulasi Pipeline dari Rekap Leads (Marketing)
  const pipelineStats = {
    pendaftaran: leadsRecap.filter(l => l.note?.toUpperCase().includes('PENDAFTARAN')).length,
    dpPangkal: leadsRecap.filter(l => l.note?.toUpperCase().includes('PANGKAL 1')).length,
    pangkalLunas: leadsRecap.filter(l => l.note?.toUpperCase().includes('PANGKAL LUNAS')).length,
  };

  const totalLeadsMarketing = pipelineStats.pendaftaran + pipelineStats.dpPangkal + pipelineStats.pangkalLunas;
  const conversionRateMarketing = totalLeadsMarketing > 0 
    ? ((pipelineStats.pangkalLunas / totalLeadsMarketing) * 100).toFixed(1) 
    : 0;

  const pendingFollowUps = leadsRecap.filter(l => l.status === 'Belum Dihubungi' || !l.status).length;

  const handlePhoneCall = (studentId, telepon) => {
    logActivity(studentId, 'Telepon', 'Melakukan panggilan darurat (Hot Lead)');
    // Format nomor untuk memastikan aman (opsional: validasi nomor)
    const formattedNum = telepon.replace(/^0/, '62');
    window.location.href = `tel:+${formattedNum}`;
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, Staff!</h1>
        <p className="text-slate-500 mt-1">Here is what's happening with your leads today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Leads (Marketing)" 
          value={totalLeadsMarketing} 
          icon={Users} 
          trend={12.5} 
          trendLabel="vs last week"
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${conversionRateMarketing}%`} 
          icon={TrendingUp} 
          trend={0} 
          trendLabel="Closing vs Total Leads"
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard 
          title="Leads Belum Dihubungi" 
          value={pendingFollowUps} 
          icon={Clock} 
          colorClass="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hot Leads Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Priority Follow-up</h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="p-0 overflow-y-auto max-h-[400px]">
            {hotLeads.map((lead) => (
              <div key={lead.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{lead.nama}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <span>{lead.program_interest}</span>
                      <span>•</span>
                      <span>{lead.asal_sekolah}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                      Score: {lead.priority_score}
                    </span>
                    <button 
                      onClick={() => handlePhoneCall(lead.id, lead.telepon)}
                      className="text-slate-400 hover:text-indigo-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Call Lead"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {hotLeads.length === 0 && (
               <div className="p-8 text-center text-slate-500">No high priority leads today!</div>
            )}
          </div>
        </div>

        {/* Funnel Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Pipeline Overview</h2>
          <div className="space-y-4">
            {[
              { label: 'Pendaftaran', count: pipelineStats.pendaftaran },
              { label: 'DP Pangkal', count: pipelineStats.dpPangkal },
              { label: 'Pangkal Lunas', count: pipelineStats.pangkalLunas }
            ].map((stage, idx) => {
              const percentage = totalLeadsMarketing > 0 ? (stage.count / totalLeadsMarketing) * 100 : 0;
              
              return (
                <div key={stage.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">{stage.label}</span>
                    <span className="font-bold text-slate-900">{stage.count} Siswa</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className={cn(
                        "h-full rounded-full",
                        idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-amber-400" : "bg-emerald-500"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
