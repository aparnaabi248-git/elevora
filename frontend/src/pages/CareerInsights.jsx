import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Sparkles, BookOpen, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';
import SkillHeatmap from '../components/SkillHeatmap';
import CareerTimeline from '../components/CareerTimeline';

const CareerInsights = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        // Load User Profile
        const profileRes = await API.get('/profile');
        setProfile(profileRes.data);

        // Load Resume Analysis
        try {
          const analysisRes = await API.get('/ai/resume-analysis');
          setAnalysis(analysisRes.data);
        } catch (e) {
          console.log('No resume analysis document found.');
        }

        // Load Seeded Courses
        const coursesRes = await API.get('/profile/courses');
        setCourses(coursesRes.data || []);
      } catch (error) {
        console.error('Failed to load career insights:', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchInsights();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Filter courses that are relevant to student's skills or roadmap
  const userSkills = profile?.skills || [];
  const recommendedCourses = courses.filter(course =>
    course.skills && course.skills.some(skill => 
      userSkills.includes(skill) || 
      analysis?.learningRoadmap?.some(item => item.topic.toLowerCase().includes(skill.toLowerCase()))
    )
  );

  const displayCourses = recommendedCourses.length > 0 ? recommendedCourses : courses;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold page-heading-white">Career Insights</h2>
        <p className="text-xs page-subtitle-white mt-1">Career Insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        {/* Left Column: Heatmap and Timeline */}
        <div className="md:col-span-3 space-y-6">
          <GlassCard className="p-6 space-y-4" hover={false}>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Skill Map Proficiency</h3>
            <SkillHeatmap skills={profile?.skills || []} />
          </GlassCard>

          <GlassCard className="p-6 space-y-6" hover={false}>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Academic & Career Timeline</h3>
            <CareerTimeline experience={profile?.experience || []} education={profile?.education || []} />
          </GlassCard>
        </div>

        {/* Right Column: Roadmap and Recommended Courses */}
        <div className="md:col-span-2 space-y-6">
          {analysis ? (
            <GlassCard className="p-6 space-y-4" hover={false}>
              <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span>Next Skill Actions</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Based on your resume scoring, here are your target topics:
              </p>

              <div className="space-y-3">
                {analysis.learningRoadmap?.slice(0, 3).map((item, index) => (
                  <div key={index} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40">
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 mb-1">{item.topic}</h4>
                    <p className="text-[11px] text-slate-405 leading-relaxed">{item.description}</p>
                    <span className="text-[9px] mt-2 block font-extrabold text-indigo-500">Duration: {item.estimatedTime}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-6 text-center space-y-3" hover={false}>
              <Compass className="w-10 h-10 text-slate-350 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Uncover AI Roadmaps</h4>
              <p className="text-xs text-slate-500">
                Upload your resume to get instant skills analysis and roadmap actions.
              </p>
              <button
                onClick={() => navigate('/upload-resume')}
                className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-xs shadow-md transition"
              >
                Go to Resume section
              </button>
            </GlassCard>
          )}

          {/* Seeded Course list */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Recommended Courses</h3>
            <div className="space-y-3">
              {displayCourses.slice(0, 3).map((course) => (
                <GlassCard key={course._id} className="p-4 space-y-2" hover={false}>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-200">{course.title}</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold">
                      {course.provider}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed truncate-2-lines">{course.description}</p>
                  <div className="flex justify-between items-center pt-2 text-[10px] border-t border-slate-200/50 dark:border-slate-800/40">
                    <span className="text-slate-400">Time: {course.duration}</span>
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-indigo-500 flex items-center gap-0.5 hover:underline"
                    >
                      <span>Join Course</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerInsights;
