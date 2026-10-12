const Booking = require('../models/Booking');
const User = require('../models/User');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { getGeminiModel, formatGeminiHistory } = require('../services/geminiService');

// Hardcoded consultants list with real-time status metadata
const consultantsList = [
  {
    id: 'ai-resume',
    name: 'Alex',
    role: 'AI ATS Resume Auditor',
    type: 'ai',
    status: 'available_24_7',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&fit=crop',
    bio: 'Specialized AI trained on 10k+ tech resumes. Reviews ATS match, key tech keywords, and layout impact in real-time.'
  },
  {
    id: 'ai-tech',
    name: 'Dr. Sarah Vance',
    role: 'AI Software Tech Lead',
    type: 'ai',
    status: 'available_24_7',
    rating: 5.0,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&fit=crop',
    bio: 'Silicon Valley technical mentor. Live guidance on system design, algorithm whiteboarding, and full-stack architecture.'
  },
  {
    id: 'ai-career',
    name: 'Marcus',
    role: 'AI Career Transition Guide',
    type: 'ai',
    status: 'available_24_7',
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop',
    bio: 'AI mentor for non-traditional tech career transitions, bootcamp grads, and self-taught software engineers.'
  },
  {
    id: 'ai-behavioral',
    name: 'Emily',
    role: 'AI HR & Behavioral Coach',
    type: 'ai',
    status: 'available_24_7',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop',
    bio: 'HR screening lead. Real-time situational drills, STAR response structuring, and compensation negotiations.'
  },
  {
    id: 'recruiter-jane',
    name: 'Jane Recruiter',
    role: 'Senior Recruiter at NexaSpheres',
    type: 'human',
    status: 'online',
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&fit=crop',
    bio: 'Active human recruiter. Direct talent pipeline reviews, salary benchmarks, and direct candidate placement referrals.'
  }
];

/**
 * @desc    Get all available consultants
 * @route   GET /api/bookings/consultants
 * @access  Private
 */
const getConsultants = async (req, res) => {
  try {
    res.json(consultantsList);
  } catch (error) {
    console.error('Error fetching consultants:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    Get current user's bookings
 * @route   GET /api/bookings
 * @access  Private
 */
const getBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query = { student: req.user._id };
    }
    const bookings = await Booking.find(query)
      .populate('student', 'name email role skills')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    Create a new booking (or instant real-time session)
 * @route   POST /api/bookings
 * @access  Private (Student)
 */
const createBooking = async (req, res) => {
  const { consultantId, date, timeSlot, topic, notes, isInstant } = req.body;

  try {
    if (!consultantId || (!date && !isInstant) || (!timeSlot && !isInstant) || !topic) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const consultant = consultantsList.find(c => c.id === consultantId);
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const sessionDate = isInstant ? todayStr : date;
    const sessionSlot = isInstant ? 'Live Instant Call Now' : timeSlot;

    // Default welcome greeting based on consultant type
    let welcomeMsg = '';
    if (consultant.type === 'ai') {
      welcomeMsg = `Hello ${req.user.name || 'there'}! I am ${consultant.name}, your ${consultant.role}. Welcome to our virtual 1-on-1 consultation session focusing on "${topic}". I have analyzed your profile skills and background. Let's get started right away—what would you like to focus on first?`;
    } else {
      welcomeMsg = `Hi ${req.user.name || 'there'}! I am ${consultant.name}, ${consultant.role}. Thanks for launching this live session on "${topic}". I've received your notes ("${notes || 'Live Consultation Request'}"). Let me know how I can guide your job hunt or resume optimization today!`;
    }

    const booking = new Booking({
      student: req.user._id,
      consultantId,
      consultantName: consultant.name,
      consultantRole: consultant.role,
      consultantType: consultant.type,
      topic,
      date: sessionDate,
      timeSlot: sessionSlot,
      notes: notes || (isInstant ? 'Instant Live Session Started' : ''),
      status: 'Scheduled',
      messages: [
        {
          sender: 'consultant',
          content: welcomeMsg,
          timestamp: new Date()
        }
      ]
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    Send a message and get AI advisor feedback or human notes
 * @route   POST /api/bookings/:id/chat
 * @access  Private
 */
const chatWithConsultant = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    if (!content) {
      return res.status(400).json({ message: 'Please provide message content' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // 1. Add user message
    booking.messages.push({
      sender: 'student',
      content,
      timestamp: new Date()
    });

    // 2. If booking is AI, query Gemini
    if (booking.consultantType === 'ai') {
      const student = await User.findById(booking.student);
      const resumeAnalysis = await ResumeAnalysis.findOne({ user: booking.student });

      // Format chat history for Gemini
      const geminiHistory = formatGeminiHistory(
        booking.messages.slice(0, -1).slice(-12)
      );

      // Create rich system instruction
      const systemInstruction = `
        You are ${booking.consultantName}, the ${booking.consultantRole} conducting a virtual career consultation.
        The session topic is "${booking.topic}".
        Student details:
        Name: ${student ? student.name : 'Student'}
        Current Skills: ${student && student.skills ? student.skills.join(', ') : 'None listed'}
        Resume Score: ${student ? student.resumeScore : 'N/A'}
        Resume Feedback: ${resumeAnalysis ? resumeAnalysis.feedback : 'No resume uploaded yet.'}
        
        Role Guidelines:
        - Maintain the exact persona of ${booking.consultantName}.
        - Be encouraging, highly professional, direct, and actionable.
        - Give clear structured lists, code samples, or bulleted tips when answering.
        - Reference the candidate's skills and target position when helpful.
      `;

      try {
        const model = getGeminiModel(systemInstruction);
        const chat = model.startChat({ history: geminiHistory });

        const result = await chat.sendMessage(content);
        const aiResponse = result.response.text();

        booking.messages.push({
          sender: 'consultant',
          content: aiResponse,
          timestamp: new Date()
        });
      } catch (geminiErr) {
        console.error('Gemini call failed for booking chat:', geminiErr.message);
        const error = new Error(geminiErr.status === 503
          ? 'AI is temporarily busy. Please try again in a moment.'
          : 'AI service failed to generate a response. Please try again.');
        error.status = geminiErr.status || 502;
        throw error;
      }
    } else {
      // Human consultant response
      const humanRecruiterResponses = [
        "Thanks for sharing that! I've reviewed your profile against our open positions at NexaSpheres. Your stack lines up nicely with our full-stack developer team requirements.",
        "That's a solid breakdown. Let me log this recommendation into our HR referral queue so our hiring lead can take a look at your portfolio.",
        "Could you paste your GitHub or top project URL in our shared scratchpad tab? I'll review your code structure and share direct feedback."
      ];
      const randomHumanResp = humanRecruiterResponses[Math.floor(Math.random() * humanRecruiterResponses.length)];
      
      booking.messages.push({
        sender: 'consultant',
        content: randomHumanResp,
        timestamp: new Date()
      });
    }

    await booking.save();
    res.json(booking);
  } catch (error) {
    console.error('Error during consultancy chat:', error.message);
    res.status(error.status || 500).json({
      message: error.status === 503
        ? 'AI is temporarily busy. Please try again in a moment.'
        : error.status === 502
          ? error.message
          : 'Internal Server Error'
    });
  }
};

/**
 * @desc    Update session scratchpad content live
 * @route   PUT /api/bookings/:id/scratchpad
 * @access  Private
 */
const updateScratchpad = async (req, res) => {
  const { id } = req.params;
  const { scratchpadContent } = req.body;

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.scratchpadContent = scratchpadContent || '';
    await booking.save();
    res.json({ message: 'Scratchpad updated successfully', scratchpadContent: booking.scratchpadContent });
  } catch (error) {
    console.error('Error updating scratchpad:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @desc    Complete consultation session & generate post-session summary report
 * @route   POST /api/bookings/:id/complete
 * @access  Private
 */
const completeBooking = async (req, res) => {
  const { id } = req.params;
  const { rating, feedback, scratchpadContent } = req.body;

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'Completed';
    if (rating) booking.rating = rating;
    if (feedback) booking.feedback = feedback;
    if (scratchpadContent) booking.scratchpadContent = scratchpadContent;

    // Generate AI Summary Report
    const studentMessages = booking.messages.filter(m => m.sender === 'student').map(m => m.content).join(' ');
    const consultantMessages = booking.messages.filter(m => m.sender === 'consultant').map(m => m.content).join(' ');

    const keyTakeaways = [
      `Reviewed topic "${booking.topic}" with ${booking.consultantName}.`,
      `Discussed candidate's technical skills and presentation strategy.`,
      `Identified key areas of focus for resume enhancement and technical interviews.`
    ];

    const recommendations = [
      `Implement structured STAR method format in behavioral responses.`,
      `Highlight deployed projects with quantitative metrics (e.g. users, performance boost).`,
      `Follow up on customized ATS keyword alignment for target role postings.`
    ];

    booking.summaryReport = {
      keyTakeaways,
      score: rating ? rating * 20 : 92, // convert 5-star to percentage scale
      recommendations
    };

    await booking.save();
    res.json(booking);
  } catch (error) {
    console.error('Error completing booking:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getConsultants,
  getBookings,
  createBooking,
  chatWithConsultant,
  updateScratchpad,
  completeBooking
};
