const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * @desc    Submit a job application
 * @route   POST /api/applications
 * @access  Private (Student)
 */
const applyToJob = async (req, res) => {
  const { jobId, coverLetter, resumeUrl } = req.body;

  try {
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const alreadyApplied = await Application.findOne({ job: jobId, student: req.user._id });
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Determine resume URL
    const studentUser = await User.findById(req.user._id);
    const finalResumeUrl = resumeUrl || studentUser.resumeUrl;

    if (!finalResumeUrl) {
      return res.status(400).json({ message: 'Please upload a resume or provide a resume URL to apply' });
    }

    // Create application
    const application = await Application.create({
      job: jobId,
      student: req.user._id,
      resumeUrl: finalResumeUrl,
      coverLetter: coverLetter || ''
    });

    // Send notification to Student
    await Notification.create({
      recipient: req.user._id,
      title: 'Application Submitted',
      message: `Your application for ${job.title} at ${job.companyName} was submitted successfully!`,
      type: 'success'
    });

    // Send notification to Recruiter (if job was posted by a recruiter)
    if (job.postedBy) {
      await Notification.create({
        recipient: job.postedBy,
        title: 'New Applicant',
        message: `${req.user.name} has applied for ${job.title}.`,
        type: 'info'
      });
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Apply job error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    Get applications (Student: theirs; Recruiter: for their posted jobs; Admin: all)
 * @route   GET /api/applications
 * @access  Private (Student/Recruiter/Admin)
 */
const getApplications = async (req, res) => {
  try {
    let applications;

    if (req.user.role === 'student') {
      // Students see their own applications
      applications = await Application.find({ student: req.user._id })
        .populate({
          path: 'job',
          populate: { path: 'company', select: 'name logo' }
        })
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'recruiter') {
      // Recruiters see applications for jobs they posted
      const jobs = await Job.find({ postedBy: req.user._id });
      const jobIds = jobs.map(j => j._id);

      applications = await Application.find({ job: { $in: jobIds } })
        .populate('job', 'title location type companyName')
        .populate('student', 'name email skills education experience')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'admin') {
      // Admins see everything
      applications = await Application.find({})
        .populate('job', 'title companyName')
        .populate('student', 'name email')
        .sort({ createdAt: -1 });
    }

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    Update application status (Recruiter/Admin only)
 * @route   PATCH /api/applications/:id/status
 * @access  Private (Recruiter/Admin)
 */
const updateApplicationStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Applied', 'Shortlisted', 'Interviewing', 'Rejected'];

  try {
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const application = await Application.findById(req.params.id)
      .populate('job', 'title postedBy companyName')
      .populate('student', 'name');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify authorized user: admin or the recruiter who posted the job
    if (req.user.role !== 'admin' && application.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to modify this application status' });
    }

    application.status = status;
    await application.save();

    // Send notification to the student
    await Notification.create({
      recipient: application.student._id,
      title: 'Application Update',
      message: `Your application status for ${application.job.title} at ${application.job.companyName} has been updated to "${status}".`,
      type: status === 'Rejected' ? 'error' : 'success'
    });

    res.json({
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  applyToJob,
  getApplications,
  updateApplicationStatus
};
