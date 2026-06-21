import { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useAllProfiles } from '../../hooks/useUserProfiles';
import { Search, RotateCw, ChevronDown, ChevronUp, History, Database, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AuditLogSection() {
  const { data: logs = [], isLoading, refetch, isFetching } = useAuditLogs();
  const { data: allProfiles = [] } = useAllProfiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL'); // 'ALL', 'INSERT', 'UPDATE', 'DELETE'
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Map user UUID to email or name
  const userMap = useMemo(() => {
    const map = {};
    allProfiles.forEach(p => {
      map[p.id] = p.full_name || p.email;
    });
    return map;
  }, [allProfiles]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.record_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      
      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const toggleExpand = (id) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'INSERT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const renderDataDiff = (log) => {
    const { action, old_data, new_data } = log;
    
    if (action === 'INSERT' && new_data) {
      return (
        <div className="space-y-1 text-slate-600 font-mono text-[11px]">
          {Object.entries(new_data).map(([key, val]) => {
            if (val === null || val === undefined || val === '') return null;
            return (
              <div key={key} className="flex gap-2">
                <span className="font-bold text-slate-500">{key}:</span>
                <span>{JSON.stringify(val)}</span>
              </div>
            );
          })}
        </div>
      );
    }

    if (action === 'DELETE' && old_data) {
      return (
        <div className="space-y-1 text-rose-600 font-mono text-[11px]">
          {Object.entries(old_data).map(([key, val]) => {
            if (val === null || val === undefined || val === '') return null;
            return (
              <div key={key} className="flex gap-2">
                <span className="font-bold text-rose-450">{key}:</span>
                <span>{JSON.stringify(val)}</span>
              </div>
            );
          })}
        </div>
      );
    }

    if (action === 'UPDATE' && old_data && new_data) {
      const diff = [];
      const keys = new Set([...Object.keys(old_data), ...Object.keys(new_data)]);
      
      keys.forEach(key => {
        // Skip metadata keys to keep clean
        if (['updated_at', 'created_at', 'last_seen_at'].includes(key)) return;
        
        const oldVal = old_data[key];
        const newVal = new_data[key];
        
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          diff.push({
            key,
            old: oldVal === null ? '—' : JSON.stringify(oldVal),
            new: newVal === null ? '—' : JSON.stringify(newVal)
          });
        }
      });

      if (!diff.length) {
        return <span className="text-slate-400 text-xs italic">ไม่มีการแก้ไขข้อมูลหลัก (อัปเดต timestamp เท่านั้น)</span>;
      }

      return (
        <div className="space-y-1 text-slate-700 font-mono text-[11px]">
          {diff.map(item => (
            <div key={item.key} className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-500">{item.key}:</span>
              <span className="text-slate-400 line-through shrink-0">{item.old}</span>
              <span className="text-slate-400 text-[10px]">➔</span>
              <span className="text-blue-600 font-semibold">{item.new}</span>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-slate-400 text-xs italic">ไม่มีข้อมูลแสดงผล</span>;
  };

  return (
    <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="text-indigo-500" size={20} />
            ประวัติการทำงาน (Audit Logs)
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            ติดตามบันทึกการกระทำและการแก้ไขข้อมูลสำคัญภายในระบบ
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-all hover:shadow-md disabled:opacity-50 shrink-0"
          title="รีเฟรชข้อมูล"
        >
          <RotateCw className={cn("w-4 h-4", (isLoading || isFetching) && "animate-spin")} />
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="ค้นหา ตารางข้อมูล หรือ ID เรคอร์ด..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white/80 px-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-700"
          />
        </div>

        {/* Action Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'INSERT', 'UPDATE', 'DELETE'].map(act => (
            <button
              key={act}
              type="button"
              onClick={() => setActionFilter(act)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0",
                actionFilter === act
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {act === 'ALL' ? 'ทั้งหมด' : act}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="relative z-10 overflow-hidden border border-slate-100 rounded-2xl bg-white/40">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <RotateCw className="animate-spin text-indigo-500" size={24} />
            <p className="text-xs font-bold">กำลังโหลดบันทึกกิจกรรม...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <p className="text-xs font-bold">ไม่พบประวัติการทำงานตามเงื่อนไขที่ระบุ</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map(log => {
              const isExpanded = expandedLogId === log.id;
              const userLabel = userMap[log.changed_by] || log.changed_by || 'ระบบ';
              
              return (
                <div 
                  key={log.id} 
                  className={cn(
                    "transition-all", 
                    isExpanded ? "bg-slate-50/70" : "hover:bg-slate-50/30"
                  )}
                >
                  {/* Row Header */}
                  <div 
                    onClick={() => toggleExpand(log.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer select-none"
                  >
                    {/* Left: Action & Table Name */}
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider",
                        getActionBadgeClass(log.action)
                      )}>
                        {log.action}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Database size={13} className="text-slate-400" />
                        {log.table_name}
                      </span>
                    </div>

                    {/* Middle: Changed by & Timestamp */}
                    <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        {userLabel}
                      </span>
                      <span>
                        {new Date(log.created_at).toLocaleString('th-TH', { 
                          day: 'numeric', month: 'short', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit', second: '2-digit' 
                        })}
                      </span>
                    </div>

                    {/* Right: Expand Icon */}
                    <div className="self-end sm:self-auto text-slate-400">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-5 pt-1 border-t border-dashed border-slate-200/80 bg-white/80">
                      <div className="mt-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                          <span>ข้อมูลการเปลี่ยนสถานะ (Data Diff)</span>
                          <span className="font-mono text-slate-450 font-medium">Record ID: {log.record_id}</span>
                        </div>
                        {renderDataDiff(log)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-start gap-2.5 mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 relative z-10">
        <HelpCircle size={14} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          ระบบบันทึกความเคลื่อนไหว (Audit Logs) จะเก็บข้อมูลการเปลี่ยนแปลงจากทุกตารางหลัก เช่น deals, customers และ user_profiles อัตโนมัติในระดับชั้นหลังบ้าน
        </p>
      </div>
    </Card>
  );
}
