import React, { useState, useEffect } from 'react';
import { ArrowRight, Brain, Target, Zap, Users, ChevronRight, Menu, X, Sparkles, TrendingUp, Clock, Shield, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Social Media Icons Components
const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const NaviIQLanding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Matching",
      description: "Smart algorithms analyze your responses to suggest career paths that align with your interests and skills"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Comprehensive Assessment",
      description: "Answer questions about your work preferences, values, and goals to build a complete career profile"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Quick Results",
      description: "Get your personalized career recommendations in minutes, not hours of lengthy assessments"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Privacy Focused",
      description: "Your assessment data is processed securely and never shared with third parties"
    }
  ];

  const careerPaths = [
    "Software Development", "Data Science", "Digital Marketing", "UX/UI Design",
    "Healthcare", "Finance", "Education", "Consulting", "Sales", "Project Management",
    "Content Creation", "Engineering", "Human Resources", "Business Analysis"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-800 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 transition-all duration-300" style={{
        background: scrollY > 50 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrollY > 50 ? '1px solid rgba(148, 163, 184, 0.2)' : 'none'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Navi-IQ
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">How it Works</a>
              <a href="#careers" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Career Paths</a>
              <button  onClick={() => navigate('/signup')} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-full font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Start Assessment
              </button>
            </div>

            <button 
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-20 border-t border-slate-200">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-slate-600 hover:text-slate-900 font-medium py-2">Features</a>
              <a href="#how-it-works" className="block text-slate-600 hover:text-slate-900 font-medium py-2">How it Works</a>
              <a href="#careers" className="block text-slate-600 hover:text-slate-900 font-medium py-2">Career Paths</a>
              <button  onClick={() => navigate('/signup')} className="block w-full px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-full font-semibold mt-4">
                Start Assessment
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-slate-700">AI-Powered Career Matching</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              Discover Your
              <span className="block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Career Match
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Take our intelligent career assessment and get personalized recommendations based on your interests, 
              skills, and work preferences. Find the career path that's right for you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button onClick={() => navigate('/signup')} className="group px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3">
                Start Your Assessment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Free • 20 minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 mb-6 shadow-sm">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-slate-700">Why Choose Navi-IQ</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Smart Career <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Discovery</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our AI-powered assessment analyzes your responses to provide accurate career recommendations 
              tailored to your unique profile and preferences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200 hover:border-slate-300 hover:bg-white/90 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="mb-6 p-3 w-fit bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl text-white group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-800">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Paths Section */}
      <section id="careers" className="py-24 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 mb-6 shadow-sm">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-slate-700">Career Options</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Explore Career Paths</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our assessment can match you with careers across multiple industries and specializations, 
              from traditional roles to emerging opportunities.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {careerPaths.map((career, index) => (
              <div 
                key={index}
                className="group p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-white/90 transition-all duration-300 text-center hover:transform hover:scale-105"
              >
                <span className="text-slate-700 font-medium group-hover:text-blue-600 transition-colors">
                  {career}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 mb-6 shadow-sm">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-slate-700">Simple Process</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-slate-600">Three simple steps to discover your ideal career match</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                step: "01", 
                title: "Take Assessment", 
                desc: "Answer questions about your interests, work style, values, and career preferences to build your unique profile" 
              },
              { 
                step: "02", 
                title: "AI Analysis", 
                desc: "Our AI processes your responses and matches them against career characteristics and requirements" 
              },
              { 
                step: "03", 
                title: "Get Results", 
                desc: "Receive personalized career recommendations with explanations of why each match suits your profile" 
              }
            ].map((item, index) => (
              <div key={index} className="text-center group relative">
                <div className="mb-8 relative">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {item.step}
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 opacity-40"></div>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-800">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-12 md:p-16 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Ready to Find Your Career Match?
              </h2>
              <p className="text-xl mb-10 opacity-90 max-w-3xl mx-auto">
                Take our AI-powered career assessment and discover which career paths align with your interests, 
                skills, and work preferences. Start your journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button onClick={() => navigate('/signup')} className="group px-10 py-4 bg-white text-slate-800 hover:bg-slate-50 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
                  Start Assessment Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            {/* Brand Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Navi-IQ
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed max-w-md">
                An AI-powered career assessment tool that helps you discover career paths that match your interests, 
                skills, and work preferences. Make informed decisions about your professional future.
              </p>
              
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-white">About This Project</h4>
                <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                  Navi-IQ uses intelligent algorithms powered by Groq API to analyze your assessment responses and provide 
                  personalized career recommendations. This project demonstrates AI applications in career guidance.
                </p>
              </div>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                <a 
                  href="https://x.com/hadeyemi_" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group p-3 bg-slate-800/50 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg backdrop-blur-sm border border-slate-700/50 hover:border-transparent"
                  aria-label="Twitter"
                >
                  <TwitterIcon />
                </a>
                <a 
                  href="https://github.com/adeyemiiiii7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group p-3 bg-slate-800/50 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg backdrop-blur-sm border border-slate-700/50 hover:border-transparent"
                  aria-label="GitHub"
                >
                  <GitHubIcon />
                </a>
                <a 
                  href="https://www.linkedin.com/in/adeyemi-aladesuyi-426a9b244/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group p-3 bg-slate-800/50 hover:bg-gradient-to-r hover:from-pink-500 hover:to-blue-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg backdrop-blur-sm border border-slate-700/50 hover:border-transparent"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon />
                </a>
              </div>
            </div>

            {/* Project Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Project Information</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <h4 className="font-semibold text-white mb-2">Technology Stack</h4>
                  <p className="text-slate-300 text-sm">
                    Built with React frontend, Node.js/Express.js backend, and Groq API for AI-powered 
                    career matching algorithms to provide intelligent assessment experiences.
                  </p>
                </div>
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <h4 className="font-semibold text-white mb-2">AI Processing</h4>
                  <p className="text-slate-300 text-sm">
                    The assessment uses Groq's high-performance AI models (Llama3-70b) to analyze your responses 
                    across multiple dimensions and generate personalized career recommendations.
                  </p>
                </div>
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <h4 className="font-semibold text-white mb-2">Privacy & Data</h4>
                  <p className="text-slate-300 text-sm">
                    Your assessment responses are processed securely through our Express.js backend and 
                    not stored permanently. This ensures your career exploration remains private and secure.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-slate-700/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-400 text-center md:text-left">
                &copy; 2025 Navi-IQ. A career assessment project by Adeyemi.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NaviIQLanding;