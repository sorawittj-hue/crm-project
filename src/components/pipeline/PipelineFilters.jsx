import { useState } from 'react';
import { X, Filter, ChevronDown, DollarSign, Calendar, Tag, Search } from 'lucide-react';

const STAGES = [
  { id: 'lead', title: 'ลูกค้าใหม่', color: 'bg-blue-500' },
  { id: 'contact', title: 'ติดต่อแล้ว', color: 'bg-indigo-500' },
  { id: 'proposal', title: 'เสนอราคา', color: 'bg-amber-500' },
  { id: 'negotiation', title: 'เจรจา', color: 'bg-orange-500' },
  { id: 'won', title: 'ปิดการขาย', color: 'bg-emerald-500' },
  { id: 'lost', title: 'หลุด/แพ้', color: 'bg-rose-500' },
];

const PipelineFilters = ({ filters, onChange, onClear, dealCount }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleStageToggle = (stageId) => {
    const newStages = filters.stages.includes(stageId)
      ? filters.stages.filter(s => s !== stageId)
      : [...filters.stages, stageId];
    onChange({ ...filters, stages: newStages });
  };

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  const hasActiveFilters = 
    filters.stages.length < 6 ||
    filters.minValue ||
    filters.maxValue ||
    filters.searchTerm;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
          hasActiveFilters 
            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <Filter size={18} />
        <span>ตัวกรอง</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        )}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">ตัวกรองดีล</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">ค้นหา</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ชื่อดีล, บริษัท, ผู้ติดต่อ..."
                  value={filters.searchTerm}
                  onChange={(e) => onChange({ ...filters, searchTerm: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Stages */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Stage</label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => handleStageToggle(stage.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.stages.includes(stage.id)
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                    {stage.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Value Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">ช่วงมูลค่า (บาท)</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    placeholder="ต่ำสุด"
                    value={filters.minValue}
                    onChange={(e) => onChange({ ...filters, minValue: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-400">-</span>
                <div className="relative flex-1">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    placeholder="สูงสุด"
                    value={filters.maxValue}
                    onChange={(e) => onChange({ ...filters, maxValue: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">ช่วงวันที่สร้าง</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-400">-</span>
                <div className="relative flex-1">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Tags/Priority */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">ความสำคัญ</label>
              <div className="flex gap-2">
                {[
                  { id: 'hot', label: 'HOT 🔥', color: 'bg-rose-100 text-rose-700 border-rose-200' },
                  { id: 'warm', label: 'WARM', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                  { id: 'cold', label: 'COLD', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                ].map(priority => (
                  <button
                    key={priority.id}
                    onClick={() => onChange({ 
                      ...filters, 
                      priority: filters.priority === priority.id ? null : priority.id 
                    })}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                      filters.priority === priority.id
                        ? priority.color
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-between">
            <span className="text-sm text-gray-500">
              แสดง <span className="font-semibold text-gray-800">{dealCount}</span> ดีล
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                ล้างทั้งหมด
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                ใช้ตัวกรอง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineFilters;
