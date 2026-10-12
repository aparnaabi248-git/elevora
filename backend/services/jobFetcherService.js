const axios = require('axios');
const Job = require('../models/Job');

/**
 * Fetches and syncs jobs from external JSearch API or seeds mock data
 */
const fetchAndSyncJobs = async () => {
  const apiKey = process.env.JSEARCH_API_KEY;
  let fetchedJobs = [];

  if (apiKey) {
    console.log('JSearch API Key found. Fetching real jobs...');
    try {
      const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
        params: {
          query: 'Software Developer, Web Developer, React, Node, DevOps, Intern',
          num_pages: '1',
          date_posted: 'all'
        },
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      });

      if (response.data && response.data.data) {
        fetchedJobs = response.data.data.map(job => ({
          title: job.job_title || 'Software Engineer',
          description: job.job_description || 'Job description details not provided.',
          companyName: job.employer_name || 'Tech Company',
          companyLogo: job.employer_logo || '',
          skillsRequired: parseSkillsFromJob(job.job_title, job.job_description),
          salaryMin: job.job_min_salary || null,
          salaryMax: job.job_max_salary || null,
          salaryCurrency: job.job_salary_currency || 'USD',
          location: job.job_city && job.job_country ? `${job.job_city}, ${job.job_country}` : 'Remote',
          type: parseJobType(job.job_employment_type),
          workMode: job.job_is_remote ? 'Remote' : 'On-site',
          experienceLevel: 'Entry',
          externalId: job.job_id,
          applyUrl: job.job_apply_link || '',
          expiresAt: job.job_offer_expiration_datetime_utc ? new Date(job.job_offer_expiration_datetime_utc) : null
        }));
      }
    } catch (error) {
      console.error('Error fetching jobs from JSearch API:', error.message);
      fetchedJobs = getMockJobs();
    }
  } else {
    console.log('No JSearch API Key. Syncing mock job database...');
    fetchedJobs = getMockJobs();
  }

  // Insert or Update in MongoDB
  let addedCount = 0;
  for (const jobData of fetchedJobs) {
    try {
      // Use externalId to check duplicates
      const existingJob = await Job.findOne({ externalId: jobData.externalId });
      if (!existingJob) {
        await Job.create(jobData);
        addedCount++;
      }
    } catch (error) {
      console.error('Error storing sync job:', error.message);
    }
  }

  console.log(`Sync complete. Added ${addedCount} new jobs.`);
  return addedCount;
};

/**
 * Heuristics helper to extract skills from job descriptions
 */
const parseSkillsFromJob = (title, description) => {
  const commonSkills = ['React', 'Node.js', 'Express', 'MongoDB', 'Python', 'Docker', 'AWS', 'Kubernetes', 'JavaScript', 'TypeScript', 'SQL', 'Git', 'Java', 'CSS', 'HTML', 'Next.js', 'Tailwind', 'GraphQL', 'Redux', 'C#', 'C++', 'Go'];
  const text = `${title} ${description}`.toLowerCase();
  const matched = [];
  
  commonSkills.forEach(skill => {
    const term = skill.toLowerCase();
    if (text.includes(term)) {
      matched.push(skill);
    }
  });

  if (matched.length === 0) {
    matched.push('JavaScript', 'Git');
  }

  return matched;
};

const parseJobType = (type) => {
  if (!type) return 'Full-time';
  const term = type.toUpperCase();
  if (term.includes('FULL')) return 'Full-time';
  if (term.includes('PART')) return 'Part-time';
  if (term.includes('INTERN')) return 'Internship';
  if (term.includes('CONTRACT')) return 'Contract';
  return 'Full-time';
};

/**
 * Mock job generator
 */
const getMockJobs = () => {
  const baseJobs = [
    {
      title: 'Junior Front-End Developer',
      description: 'We are looking for a junior developer with strong React capabilities to build dashboard widgets and interactive graphs. You will collaborate closely with UI/UX designers.',
      companyName: 'NexaSpheres',
      companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&fit=crop',
      skillsRequired: ['React', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'Git'],
      salaryMin: 65000,
      salaryMax: 85000,
      location: 'San Francisco, CA',
      type: 'Full-time',
      workMode: 'Remote',
      experienceLevel: 'Entry',
      externalId: 'mock_job_1',
      applyUrl: 'https://nexaspheres.io/careers'
    },
    {
      title: 'Full Stack Engineer (Node/React)',
      description: 'Join our scaling cloud intelligence team to develop robust backend APIs using Express/Mongoose and tie them to sleek dashboard interfaces. Experiencing database tuning is a big plus.',
      companyName: 'CloudPulse',
      companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&fit=crop',
      skillsRequired: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'AWS', 'Git'],
      salaryMin: 95000,
      salaryMax: 120000,
      location: 'Austin, TX',
      type: 'Full-time',
      workMode: 'Hybrid',
      experienceLevel: 'Mid',
      externalId: 'mock_job_2',
      applyUrl: 'https://cloudpulse.com/jobs'
    },
    {
      title: 'DevOps & Infrastructure Intern',
      description: 'Interested in Docker, Kubernetes, and automating deployments? We are hiring an intern to assist in managing CI/CD pipelines, containerizing Node microservices, and monitoring AWS cloud components.',
      companyName: 'SysLogic Systems',
      companyLogo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=80&fit=crop',
      skillsRequired: ['Docker', 'AWS', 'Git', 'Linux', 'Python'],
      salaryMin: 40000,
      salaryMax: 55000,
      location: 'New York, NY',
      type: 'Internship',
      workMode: 'On-site',
      experienceLevel: 'Entry',
      externalId: 'mock_job_3',
      applyUrl: 'https://syslogic.com/internships'
    },
    {
      title: 'Backend API Specialist',
      description: 'Develop high-performance REST and GraphQL services. You will design schemas, write secure auth middleware, and ensure rapid data queries under peak traffic.',
      companyName: 'DataNexus',
      companyLogo: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=80&fit=crop',
      skillsRequired: ['Node.js', 'Express', 'SQL', 'MongoDB', 'Git', 'Docker'],
      salaryMin: 105000,
      salaryMax: 135000,
      location: 'Seattle, WA',
      type: 'Full-time',
      workMode: 'Remote',
      experienceLevel: 'Senior',
      externalId: 'mock_job_4',
      applyUrl: 'https://datanexus.dev/careers'
    },
    {
      title: 'Machine Learning / Data Analyst',
      description: 'Perform advanced data analysis, clean large datasets, and construct predictive ML models in Python. Assist in automating job intelligence mapping matching tables.',
      companyName: 'ZettaAI',
      companyLogo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&fit=crop',
      skillsRequired: ['Python', 'SQL', 'Git', 'Docker'],
      salaryMin: 90000,
      salaryMax: 115000,
      location: 'Boston, MA',
      type: 'Full-time',
      workMode: 'Remote',
      experienceLevel: 'Mid',
      externalId: 'mock_job_5',
      applyUrl: 'https://zetta.ai/careers'
    }
  ];

  return baseJobs;
};

module.exports = {
  fetchAndSyncJobs
};
