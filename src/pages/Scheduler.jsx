import React from 'react';
import { Calendar, CheckCircle2, Clock, Check, MoreVertical, Phone, MessageSquare } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format, addDays, isPast, isToday } from 'date-fns';

export default function Scheduler() {
  const { students } = useStore();
  
  // Create mock schedule data based on students
  const schedules = students.map((s, idx) => ({
    id: s.id,
    studentName: s.nama,
    type: idx % 2 === 0 ? 'Followup_Rutin' : 'Reminder_DP',
    date: idx % 3 === 0 ? new Date() : (idx % 2 === 0 ? addDays(new Date(), 1) : addDays(new Date(), -1)),
    status: idx === 0 ? 'Done' : (idx % 2 === 0 ? 'Pending' : 'Missed'),
    phone: s.telepon
  })).sort((a, b) => a.date - b.date);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Follow-up Scheduler</h1>
        <p className="text-slate-500 mt-1">Kelola dan jadwalkan pengingat interaksi lead Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Calendar Widget & Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
            <div className="inline-flex w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full items-center justify-center mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Hari Ini</h3>
            <p className="text-slate-500">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
            
            <div className="flex gap-4 mt-6">
              <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-2xl font-bold text-amber-600">
                  {schedules.filter(s => s.status === 'Pending').length}
                </p>
                <p className="text-xs text-slate-500 font-medium">Pending</p>
              </div>
              <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-2xl font-bold text-emerald-600">
                  {schedules.filter(s => s.status === 'Done').length}
                </p>
                <p className="text-xs text-slate-500 font-medium">Selesai</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Task List */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Daftar Tugas Follow-up</h2>
              <select className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option>Semua Status</option>
                <option>Pending</option>
                <option>Missed</option>
                <option>Done</option>
              </select>
            </div>
            <div className="p-0 overflow-y-auto max-h-[600px] divide-y divide-slate-100">
              {schedules.map(task => {
                 let statusBadge;
                 if (task.status === 'Done') statusBadge = <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Done</span>;
                 else if (task.status === 'Missed') statusBadge = <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-semibold">Missed</span>;
                 else statusBadge = <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>;

                 return (
                  <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                    <div className="mt-1">
                      {task.status === 'Done' ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="w-4 h-4"/></div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-slate-900">{task.studentName}</h4>
                        {statusBadge}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {task.type === 'Followup_Rutin' ? 'Follow-up Penawaran Program' : 'Reminder Deadline DP Pembayaran'}
                      </p>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5"/> 
                          {isToday(task.date) ? 'Hari ini' : format(task.date, 'dd MMM yyyy')}
                        </span>
                        <div className="flex gap-2">
                          <button className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="WhatsApp"><MessageSquare className="w-4 h-4"/></button>
                          <button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Call"><Phone className="w-4 h-4"/></button>
                        </div>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                 )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
