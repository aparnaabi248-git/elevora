import React from 'react';

const SkillHeatmap = ({ skills = [] }) => {
  // Demo proficiency level mapper
  const getProficiency = (skillName) => {
    const hash = skillName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const level = (hash % 3) + 1; // 1: Intermediate, 2: Advanced, 3: Expert
    switch (level) {
      case 3:
        return { name: 'Expert', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10', width: '90%' };
      case 2:
        return { name: 'Advanced', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-indigo-500/10', width: '75%' };
      default:
        return { name: 'Intermediate', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 shadow-cyan-500/10', width: '60%' };
    }
  };

  return (
    <div className="space-y-4">
      {skills.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No skills added yet. Complete your profile or upload a resume to extract skills.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {skills.map((skill, index) => {
            const prof = getProficiency(skill);
            return (
              <div 
                key={index}
                className="p-4 rounded-2xl glass-effect border border-slate-200/50 dark:border-slate-800/40 hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{skill}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${prof.color}`}>
                    {prof.name}
                  </span>
                </div>
                {/* Progress bar container */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-1000"
                    style={{ width: prof.width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SkillHeatmap;
