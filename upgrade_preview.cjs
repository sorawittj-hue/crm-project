const fs = require('fs');

const path = 'src/pages/PipelinePage.jsx';
let code = fs.readFileSync(path, 'utf8');

// Normalize line endings for reliable matching
code = code.replace(/\r\n/g, '\n');

const mockTarget = `                  {/* Kanban Deal Card Mock */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 space-y-4 pointer-events-none relative overflow-hidden group">
                    {/* Pulsing state light */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 shrink-0">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full ring-4 ring-offset-0 transition-all duration-300",
                        newDeal.stage === 'won' ? 'bg-emerald-500 ring-emerald-100' :
                        newDeal.stage === 'lost' ? 'bg-rose-500 ring-rose-100' :
                        newDeal.stage === 'negotiation' ? 'bg-violet-500 ring-violet-100' :
                        newDeal.stage === 'proposal' ? 'bg-sky-500 ring-sky-100' :
                        newDeal.stage === 'contact' ? 'bg-amber-500 ring-amber-100' : 'bg-slate-400 ring-slate-100'
                      )} />
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900/5 border border-slate-200/60 flex items-center justify-center text-slate-700 font-black text-sm uppercase shrink-0">
                        {(newDeal.company || 'C').charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">
                          {newDeal.company || 'ยังไม่ระบุชื่อบริษัท'}
                        </p>
                        <p className="text-sm font-extrabold text-slate-900 truncate mt-1 leading-tight">
                          {newDeal.title || 'กรอกชื่อดีลเพื่อสร้างพรีวิว'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-slate-50">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">มูลค่าดีล</p>
                        <span className="text-lg font-black text-slate-900 tabular-nums leading-none block mt-1">
                          {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Number(newDeal.value) || 0)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">โอกาสปิด</p>
                        <span className="text-sm font-black text-violet-600 block mt-1">
                          {newDeal.probability || '50'}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm shadow-violet-500/10">
                        {newDeal.assigned_to ? (teamMembers.find(t => t.id === newDeal.assigned_to)?.name?.charAt(0).toUpperCase() || 'U') : 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              Number(newDeal.probability) >= 70 ? 'bg-emerald-500' :
                              Number(newDeal.probability) >= 40 ? 'bg-violet-600' : 'bg-slate-350'
                            )}
                            style={{ width: `${Math.max(0, Math.min(100, Number(newDeal.probability) || 0))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>`;

const mockReplace = `                  {/* Kanban Deal Card Mock */}
                  <div className={cn(
                    "rounded-[1.25rem] shadow-sm p-5 space-y-4 pointer-events-none relative overflow-hidden group transition-all",
                    Number(newDeal.value) >= 1000000 
                      ? "bg-gradient-to-br from-amber-50/80 via-white to-yellow-50/40 border border-amber-200/80 shadow-amber-500/5" 
                      : "bg-white border border-slate-200/65"
                  )}>
                    {Number(newDeal.value) >= 1000000 && (
                       <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[9px] font-black tracking-widest rounded-bl-xl uppercase shadow-sm">
                         👑 VIP Deal
                       </div>
                    )}
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-[0.4rem] bg-indigo-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm shadow-indigo-500/20">
                          {(newDeal.assigned_to ? (teamMembers.find(t => t.id === newDeal.assigned_to)?.name?.charAt(0).toUpperCase() || 'U') : 'U')}
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 truncate flex-1 tracking-wide uppercase">
                          {newDeal.company || 'ยังไม่ระบุชื่อบริษัท'}
                        </p>
                      </div>
                      
                      {/* State indicator based on stage */}
                      <span className={cn(
                        "w-2 h-2 rounded-full ring-4 ring-offset-0 mt-1.5 mr-1 shrink-0 transition-all duration-300",
                        newDeal.stage === 'won' ? 'bg-emerald-500 ring-emerald-100' :
                        newDeal.stage === 'lost' ? 'bg-rose-500 ring-rose-100' :
                        newDeal.stage === 'negotiation' ? 'bg-violet-500 ring-violet-100' :
                        newDeal.stage === 'proposal' ? 'bg-sky-500 ring-sky-100' :
                        newDeal.stage === 'contact' ? 'bg-amber-500 ring-amber-100' : 'bg-slate-400 ring-slate-100'
                      )} />
                    </div>

                    {/* TITLE */}
                    <h4 className="text-sm font-bold leading-tight line-clamp-2 tracking-tight text-slate-900 min-h-[2.5rem]">
                      {newDeal.title || 'กรอกชื่อดีลเพื่อสร้างพรีวิว'}
                    </h4>

                    {/* Value & Probability */}
                    <div className="flex items-center justify-between pt-1">
                      <span className={cn(
                        "text-xl font-black tracking-tight tabular-nums",
                        Number(newDeal.value) >= 1000000 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Number(newDeal.value) || 0)}
                      </span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/50">
                        <TrendingUp size={11} className={Number(newDeal.probability) >= 70 ? 'text-emerald-500' : 'text-slate-400'} />
                        <span className="text-[10px] font-black text-slate-600">{newDeal.probability || '50'}%</span>
                      </div>
                    </div>
                  </div>`;

if (!code.includes(mockTarget)) {
  console.log("mockTarget NOT found!");
} else {
  code = code.replace(mockTarget, mockReplace);
  console.log("mock card replaced.");
}

fs.writeFileSync(path, code, 'utf8');
