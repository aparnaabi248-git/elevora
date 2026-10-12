const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const SavedJob = require('../models/SavedJob');
const Skill = require('../models/Skill');
const Course = require('../models/Course');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexora';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for seeding.');

    // Clear existing data
    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Notification.deleteMany({});
    await ResumeAnalysis.deleteMany({});
    await SavedJob.deleteMany({});
    await Skill.deleteMany({});
    await Course.deleteMany({});
    console.log('Database cleared.');

    // 1. Create Admins, Students, and Recruiters
    console.log('Seeding Users...');
    
    // Create Student
    const studentUser = await User.create({
      name: 'John Doe',
      email: 'student@nexora.com',
      password: 'password123', // Will be hashed automatically by pre-save hook
      role: 'student',
      skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Node.js'],
      education: [
        {
          school: 'State University',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startYear: 2022,
          endYear: 2026
        }
      ],
      experience: [
        {
          company: 'Tech Solutions Inc.',
          role: 'Web Development Intern',
          location: 'Remote',
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-08-31'),
          current: false,
          description: 'Built frontend pages using React and custom styling, fixed UI bugs, and integrated REST APIs.'
        }
      ],
      certifications: [
        {
          name: 'Responsive Web Design',
          issuingOrganization: 'freeCodeCamp',
          issueDate: new Date('2023-12-15')
        }
      ]
    });
    studentUser.calculateProfileCompletion();
    await studentUser.save();

    // Create Recruiter
    const recruiterUser = await User.create({
      name: 'Jane Recruiter',
      email: 'recruiter@nexora.com',
      password: 'password123',
      role: 'recruiter'
    });

    // Create Admin
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@nexora.com',
      password: 'password123',
      role: 'admin'
    });

    console.log('Users seeded successfully.');

    // 2. Create Company for Recruiter
    console.log('Seeding Companies...');
    const company = await Company.create({
      name: 'NexaSpheres',
      description: 'NexaSpheres is a modern software house building interactive software products, AI platforms, and cloud infrastructure.',
      industry: 'Software & Technology',
      location: 'San Francisco, CA',
      website: 'https://nexaspheres.io',
      logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&fit=crop',
      recruiter: recruiterUser._id
    });

    // Update Recruiter with company reference
    recruiterUser.company = company._id;
    await recruiterUser.save();
    console.log('Company seeded and linked to Recruiter.');

    // 3. Create Job Listings
    console.log('Seeding Jobs...');
    const jobs = [
      {
        title: 'Junior Front-End Developer',
        description: 'We are looking for a junior developer with strong React capabilities to build dashboard widgets and interactive graphs. You will collaborate closely with UI/UX designers.',
        company: company._id,
        companyName: company.name,
        companyLogo: company.logo,
        skillsRequired: ['React', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'Git'],
        salaryMin: 65000,
        salaryMax: 85000,
        location: 'San Francisco, CA',
        type: 'Full-time',
        workMode: 'Remote',
        experienceLevel: 'Entry',
        postedBy: recruiterUser._id,
        externalId: 'mock_job_1',
        applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Junior%20Front-End%20Developer'
      },
      {
        title: 'Full Stack Engineer (Node/React)',
        description: 'Join our scaling cloud intelligence team to develop robust backend APIs using Express/Mongoose and tie them to sleek dashboard interfaces. Experience in database tuning is a big plus.',
        company: company._id,
        companyName: company.name,
        companyLogo: company.logo,
        skillsRequired: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'AWS', 'Git'],
        salaryMin: 95000,
        salaryMax: 120000,
        location: 'San Francisco, CA',
        type: 'Full-time',
        workMode: 'Hybrid',
        experienceLevel: 'Mid',
        postedBy: recruiterUser._id,
        externalId: 'mock_job_2',
        applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Full%20Stack%20Engineer%20Node%20React'
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
        applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=DevOps%20Intern'
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
        applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Backend%20API%20Specialist'
      },
      {
        title: 'Machine Learning Analyst',
        description: 'Perform advanced data analysis, clean large datasets, and construct predictive ML models in Python. Assist in automating job intelligence mapping.',
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
        applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Machine%20Learning%20Analyst'
      }
    ];

    await Job.create(jobs);
    console.log('Job listings seeded.');

    // 4. Seed some sample courses for learning roadmaps
    console.log('Seeding Courses...');
    const courses = [
      {
        title: 'Complete React Masterclass',
        description: 'Master React 18, React Router, Redux Toolkit, and custom hooks with practical projects.',
        provider: 'Udemy',
        url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
        skills: ['React', 'JavaScript', 'Redux'],
        duration: '40 hours'
      },
      {
        title: 'Node.js, Express & MongoDB Dev to Deployment',
        description: 'Learn to build robust APIs, manage databases, and deploy node applications to production.',
        provider: 'Coursera',
        url: 'https://www.coursera.org/specializations/full-stack-web-development-node',
        skills: ['Node.js', 'Express', 'MongoDB'],
        duration: '32 hours'
      },
      {
        title: 'Docker & Kubernetes: The Practical Guide',
        description: 'Learn Docker, Compose, Multi-container projects, Kubernetes, and AWS deployments from scratch.',
        provider: 'Udemy',
        url: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/',
        skills: ['Docker', 'Kubernetes', 'DevOps'],
        duration: '22 hours'
      },
      {
        title: 'AWS Certified Cloud Practitioner Ultimate Exam Prep',
        description: 'Comprehensive guide to mastering Amazon Web Services for the Cloud Practitioner exam.',
        provider: 'EdX',
        url: 'https://www.edx.org/course/aws-cloud-practitioner-essentials',
        skills: ['AWS', 'DevOps'],
        duration: '15 hours'
      }
    ];

    await Course.create(courses);
    console.log('Courses seeded.');

    // 5. Seed one demo notification
    await Notification.create({
      recipient: studentUser._id,
      title: 'Welcome to Nexora!',
      message: 'Upload your resume in the Resume section to get your AI resume score and custom career roadmap!',
      type: 'info'
    });
    console.log('Default notification created.');

    console.log('Database seeding successfully completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedData();
