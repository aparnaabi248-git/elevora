import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Save, GraduationCap, Briefcase, Award, Sparkles, Check, RefreshCw, CheckCircle2, Globe } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const Profile = () => {
  const { user, updateProfileState } = useAuth();
  
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [certifications, setCertifications] = useState([]);
  
  // LinkedIn Sync State
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);
  const [linkedinInputUrl, setLinkedinInputUrl] = useState('');
  const [rawBioText, setRawBioText] = useState('');
  const [syncingLinkedin, setSyncingLinkedin] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [linkedinError, setLinkedinError] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setSkills(user.skills || []);
      setEducation(user.education || []);
      setExperience(user.experience || []);
      setCertifications(user.certifications || []);
      if (user.linkedinUrl) {
        setLinkedinInputUrl(user.linkedinUrl);
      }
    }
  }, [user]);

  const handleLinkedinSync = async (e) => {
    e.preventDefault();
    if (!rawBioText.trim()) {
      setLinkedinError('Paste your LinkedIn headline or profile summary so AI can analyze it.');
      return;
    }

    try {
      setSyncingLinkedin(true);
      setLinkedinError('');
      const res = await API.post('/profile/linkedin-sync', {
        linkedinUrl: linkedinInputUrl,
        rawProfileText: rawBioText
      });

      updateProfileState(res.data.user);
      setSkills(res.data.user.skills || []);
      setEducation(res.data.user.education || []);
      setExperience(res.data.user.experience || []);
      setSyncSuccess(true);

      setTimeout(() => {
        setSyncSuccess(false);
        setShowLinkedinModal(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to sync LinkedIn profile:', err.message);
      setLinkedinError(err.response?.data?.message || 'Could not analyze this profile. Please try again.');
    } finally {
      setSyncingLinkedin(false);
    }
  };

  // Skill management
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Education management
  const handleAddEducation = () => {
    setEducation([...education, { school: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }]);
  };

  const handleUpdateEducation = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const handleRemoveEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Experience management
  const handleAddExperience = () => {
    setExperience([...experience, { company: '', role: '', location: '', description: '', current: false }]);
  };

  const handleUpdateExperience = (index, field, value) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const handleRemoveExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  // Certifications management
  const handleAddCert = () => {
    setCertifications([...certifications, { name: '', issuingOrganization: '' }]);
  };

  const handleUpdateCert = (index, field, value) => {
    const updated = [...certifications];
    updated[index][field] = value;
    setCertifications(updated);
  };

  const handleRemoveCert = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const response = await API.put('/profile', {
        skills,
        education,
        experience,
        certifications
      });
      updateProfileState(response.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold profile-heading">My Profile</h2>
          <p className="text-xs page-subtitle-white mt-1">Manage details used by recruiters and AI match services</p>
              </div>

        <button
          onClick={handleSaveProfile}
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center gap-2 text-sm"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : success ? (
            <>
              <Check className="w-4 h-4" />
              <span>Saved successfully!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* LinkedIn Profile Analysis Card */}
      <GlassCard className="p-6 border-l-4 border-sky-500 relative overflow-hidden" hover={false}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 border border-sky-500/20 font-black text-xl">
              in
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">AI LinkedIn Profile Analysis</h3>
                {user?.linkedinConnected && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 font-extrabold text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Analyzed</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                {user?.linkedinConnected ? (
                  <>Headline: <span className="font-bold text-slate-700 dark:text-slate-200">{user.linkedinHeadline || user.headline || 'Analyzed'}</span>{user.linkedinUrl && <> &bull; URL: <a href={user.linkedinUrl} target="_blank" rel="noreferrer" className="text-sky-500 underline font-semibold">{user.linkedinUrl}</a></>}</>
                ) : (
                  'Paste profile text for Gemini to extract skills and a professional headline. A LinkedIn URL alone cannot be imported automatically.'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => { setLinkedinError(''); setShowLinkedinModal(true); }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{user?.linkedinConnected ? 'Re-analyze Profile' : 'Analyze LinkedIn Profile'}</span>
          </button>
        </div>
      </GlassCard>

      {/* LinkedIn Sync Modal */}
      {showLinkedinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl relative">
            {syncSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-sky-500 mx-auto animate-bounce" />
                <h3 className="text-lg font-black">Profile Analyzed with AI</h3>
                <p className="text-xs text-slate-500">Skills and headline were extracted from the profile text you provided.</p>
              </div>
            ) : (
              <form onSubmit={handleLinkedinSync} className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sky-500 font-extrabold text-sm">
                    <Globe className="w-4 h-4" />
                    <span>AI LinkedIn Profile Analysis</span>
                  </div>
                  <button type="button" onClick={() => setShowLinkedinModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">&times;</button>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.linkedin.com/in/yourprofile"
                    value={linkedinInputUrl}
                    onChange={(e) => setLinkedinInputUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-350">Headline or Profile Summary (Required)</label>
                  <textarea
                    required
                    placeholder="Paste your LinkedIn headline, about section, and skills..."
                    rows={3}
                    value={rawBioText}
                    onChange={(e) => setRawBioText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100 resize-none"
                  />
                </div>

                {linkedinError && (
                  <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs">
                    {linkedinError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={syncingLinkedin}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-sky-500/20 hover:scale-[1.01] transition flex items-center justify-center gap-2"
                >
                  {syncingLinkedin ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Analyze with AI</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Skills Card */}
      <GlassCard className="p-6 space-y-4" hover={false}>
        <div className="flex items-center gap-2 text-indigo-500 pb-2 border-b border-slate-200/50 dark:border-slate-800/40">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-250">Skills & Tech Stack</h3>
        </div>

        <form onSubmit={handleAddSkill} className="flex gap-3">
          <input
            type="text"
            placeholder="Add skill (e.g. Docker, Python, Figma)"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white transition font-bold text-sm flex items-center gap-1 text-slate-700 dark:text-slate-300"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {skills.length === 0 ? (
            <p className="text-xs text-slate-400">No skills added yet.</p>
          ) : (
            skills.map((skill, index) => (
              <span
                key={index}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold text-xs flex items-center gap-1.5"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-indigo-400 hover:text-rose-500 transition font-bold text-[10px]"
                >
                  &times;
                </button>
              </span>
            ))
          )}
        </div>
      </GlassCard>

      {/* Education Card */}
      <GlassCard className="p-6 space-y-6" hover={false}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-center gap-2 text-indigo-500">
            <GraduationCap className="w-5 h-5" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-250">Academic Education</h3>
          </div>
          <button
            onClick={handleAddEducation}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-650 flex items-center gap-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Education</span>
          </button>
        </div>

        <div className="space-y-6">
          {education.map((ed, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 relative">
              <button
                onClick={() => handleRemoveEducation(index)}
                className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">School</label>
                <input
                  type="text"
                  required
                  placeholder="State University"
                  value={ed.school}
                  onChange={(e) => handleUpdateEducation(index, 'school', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Degree</label>
                <input
                  type="text"
                  required
                  placeholder="Bachelor of Science"
                  value={ed.degree}
                  onChange={(e) => handleUpdateEducation(index, 'degree', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Field of Study</label>
                <input
                  type="text"
                  required
                  placeholder="Computer Science"
                  value={ed.fieldOfStudy}
                  onChange={(e) => handleUpdateEducation(index, 'fieldOfStudy', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Start Year</label>
                  <input
                    type="number"
                    placeholder="2022"
                    value={ed.startYear || ''}
                    onChange={(e) => handleUpdateEducation(index, 'startYear', parseInt(e.target.value) || '')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">End Year</label>
                  <input
                    type="number"
                    placeholder="2026"
                    value={ed.endYear || ''}
                    onChange={(e) => handleUpdateEducation(index, 'endYear', parseInt(e.target.value) || '')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          ))}
          {education.length === 0 && (
            <p className="text-xs text-slate-400 py-2">No education records added.</p>
          )}
        </div>
      </GlassCard>

      {/* Experience Card */}
      <GlassCard className="p-6 space-y-6" hover={false}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-center gap-2 text-indigo-500">
            <Briefcase className="w-5 h-5" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-250">Professional Experience</h3>
          </div>
          <button
            onClick={handleAddExperience}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-650 flex items-center gap-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Experience</span>
          </button>
        </div>

        <div className="space-y-6">
          {experience.map((exp, index) => (
            <div key={index} className="space-y-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 relative">
              <button
                onClick={() => handleRemoveExperience(index)}
                className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Company</label>
                  <input
                    type="text"
                    required
                    placeholder="Tech Solutions"
                    value={exp.company}
                    onChange={(e) => handleUpdateExperience(index, 'company', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Role</label>
                  <input
                    type="text"
                    required
                    placeholder="Developer Intern"
                    value={exp.role}
                    onChange={(e) => handleUpdateExperience(index, 'role', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Location</label>
                  <input
                    type="text"
                    placeholder="Remote / New York"
                    value={exp.location || ''}
                    onChange={(e) => handleUpdateExperience(index, 'location', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Job Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe your achievements and tasks..."
                  value={exp.description || ''}
                  onChange={(e) => handleUpdateExperience(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          ))}
          {experience.length === 0 && (
            <p className="text-xs text-slate-400 py-2">No experience records added.</p>
          )}
        </div>
      </GlassCard>

      {/* Certifications Card */}
      <GlassCard className="p-6 space-y-6" hover={false}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-center gap-2 text-indigo-500">
            <Award className="w-5 h-5" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-250">Certifications</h3>
          </div>
          <button
            onClick={handleAddCert}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-650 flex items-center gap-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certification</span>
          </button>
        </div>

        <div className="space-y-4">
          {certifications.map((cert, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 relative">
              <button
                onClick={() => handleRemoveCert(index)}
                className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Certificate Name</label>
                <input
                  type="text"
                  required
                  placeholder="AWS Cloud Practitioner"
                  value={cert.name}
                  onChange={(e) => handleUpdateCert(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Issuing Organization</label>
                <input
                  type="text"
                  required
                  placeholder="Amazon Web Services"
                  value={cert.issuingOrganization}
                  onChange={(e) => handleUpdateCert(index, 'issuingOrganization', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          ))}
          {certifications.length === 0 && (
            <p className="text-xs text-slate-400 py-2">No certificates added.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default Profile;
