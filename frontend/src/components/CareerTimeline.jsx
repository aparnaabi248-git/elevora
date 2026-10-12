import React from 'react';
import { Briefcase, GraduationCap, Calendar, MapPin } from 'lucide-react';

const CareerTimeline = ({ experience = [], education = [] }) => {
  // Combine and sort item list (simulate timestamps for ordering)
  const timelineItems = [
    ...experience.map(exp => ({
      ...exp,
      type: 'work',
      dateLabel: exp.startDate 
        ? `${new Date(exp.startDate).getFullYear()} - ${exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).getFullYear() : ''}`
        : 'Work Experience'
    })),
    ...education.map(ed => ({
      ...ed,
      type: 'education',
      dateLabel: `${ed.startYear || ''} - ${ed.endYear || ''}`
    }))
  ];

  return (
    <div className="relative pl-6 border-l-2 border-indigo-500/30 dark:border-indigo-500/20 space-y-8 py-2">
      {timelineItems.length === 0 ? (
        <p className="text-sm text-slate-500">No education or experience records found. Update your profile to see your timeline.</p>
      ) : (
        timelineItems.map((item, index) => (
          <div key={index} className="relative group">
            {/* Timeline node icon */}
            <span className="absolute -left-[38px] top-1.5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-indigo-500 shadow-md group-hover:scale-110 transition-transform duration-200">
              {item.type === 'work' ? <Briefcase className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
            </span>

            {/* Content card */}
            <div className="glass-effect rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/40 hover:shadow-lg transition-shadow">
              <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                <div>
                  <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">
                    {item.role || item.degree}
                  </h4>
                  <p className="text-xs text-indigo-500 font-semibold mt-0.5">
                    {item.company || `${item.school} (${item.fieldOfStudy})`}
                  </p>
                </div>
                
                <span className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-500 font-bold flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.dateLabel}
                </span>
              </div>

              {item.location && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {item.location}
                </div>
              )}

              {item.description && (
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mt-2">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CareerTimeline;
