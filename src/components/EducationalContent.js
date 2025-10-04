import React, { useState, useEffect } from 'react';

import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';

const EducationalContent = () => {
  const [activeSection, setActiveSection] = useState('basics');
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showQuizResults, setShowQuizResults] = useState(false);

  const educationalSections = {
    basics: {
      title: '🌌 Asteroid Basics',
      icon: '🪨',
      lessons: [
        {
          id: 'what-are-asteroids',
          title: 'What are Asteroids?',
          content: `
            Asteroids are rocky objects that orbit the Sun. They are remnants from the formation of our solar system about 4.6 billion years ago. Most asteroids are found in the asteroid belt between Mars and Jupiter.
            
            **Key Facts:**
            • Size range: From pebbles to objects hundreds of kilometers across
            • Composition: Rocky, metallic, or a mixture of both
            • Number: Over 1 million known asteroids
            • Largest: Ceres (940 km diameter)
          `,
          interactive: true,
        },
        {
          id: 'asteroid-types',
          title: 'Types of Asteroids',
          content: `
            Asteroids are classified into three main types based on their composition:
            
            **C-type (Carbonaceous):**
            • 75% of known asteroids
            • Dark, carbon-rich composition
            • Contain water and organic compounds
            
            **S-type (Silicaceous):**
            • 17% of known asteroids
            • Stony composition with silicate minerals
            • Brighter than C-type asteroids
            
            **M-type (Metallic):**
            • 8% of known asteroids
            • Mostly iron and nickel
            • Highly reflective
          `,
          interactive: false,
        },
      ],
    },
    impacts: {
      title: '💥 Impact Physics',
      icon: '🎯',
      lessons: [
        {
          id: 'impact-energy',
          title: 'Understanding Impact Energy',
          content: `
            When an asteroid hits Earth, it releases enormous amounts of energy. This energy depends on:
            
            **Kinetic Energy Formula:**
            E = ½mv²
            
            Where:
            • E = Energy (Joules)
            • m = Mass (kg)
            • v = Velocity (m/s)
            
            **Key Insights:**
            • Energy increases with the square of velocity
            • A small increase in speed = massive energy increase
            • Typical asteroid velocities: 11-72 km/s
          `,
          interactive: true,
        },
        {
          id: 'atmospheric-entry',
          title: 'Atmospheric Entry',
          content: `
            As asteroids enter Earth's atmosphere, several things happen:
            
            **Entry Process:**
            1. **Initial Contact** (100-120 km altitude)
            2. **Heating Phase** - Friction causes intense heating
            3. **Fragmentation** - Thermal stress breaks apart the object
            4. **Ablation** - Material burns away
            5. **Impact or Airburst**
            
            **Factors Affecting Entry:**
            • Entry angle (steeper = more intense)
            • Atmospheric density
            • Object composition and structure
          `,
          interactive: false,
        },
      ],
    },
    history: {
      title: '📚 Historical Impacts',
      icon: '🏛️',
      lessons: [
        {
          id: 'chicxulub',
          title: 'The Chicxulub Impact',
          content: `
            66 million years ago, a massive asteroid impact changed Earth forever.
            
            **Event Details:**
            • Asteroid size: ~10-15 km diameter
            • Impact location: Yucatan Peninsula, Mexico
            • Energy released: ~100 million megatons TNT
            • Crater diameter: ~150 km
            
            **Consequences:**
            • Mass extinction event (including dinosaurs)
            • Global climate change
            • Massive tsunamis
            • Worldwide fires
          `,
          interactive: true,
        },
        {
          id: 'tunguska',
          title: 'The Tunguska Event (1908)',
          content: `
            The largest impact event in recorded history occurred in Siberia.
            
            **Event Details:**
            • Date: June 30, 1908
            • Object size: ~60-190 meters
            • Energy: ~10-15 megatons TNT
            • Trees flattened: 2,150 square kilometers
            
            **Unique Aspects:**
            • Airburst event (exploded in atmosphere)
            • No crater formed
            • Seismic waves detected globally
            • Bright nights observed across Europe
          `,
          interactive: false,
        },
      ],
    },
    detection: {
      title: '🔭 Detection & Defense',
      icon: '🛡️',
      lessons: [
        {
          id: 'detection-methods',
          title: 'How We Find Asteroids',
          content: `
            Modern asteroid detection uses sophisticated ground and space-based telescopes.
            
            **Detection Methods:**
            • **Optical Surveys** - Catalina Sky Survey, LINEAR
            • **Space Telescopes** - NEOWISE, Sentinel
            • **Radar Observations** - Arecibo, Goldstone
            
            **What We Look For:**
            • Moving objects against star background
            • Brightness variations
            • Orbital characteristics
            • Size and composition estimates
          `,
          interactive: true,
        },
        {
          id: 'planetary-defense',
          title: 'Planetary Defense Strategies',
          content: `
            If we detect a threatening asteroid, several defense options exist:
            
            **Deflection Methods:**
            • **Kinetic Impactor** - Crash spacecraft into asteroid
            • **Gravity Tractor** - Use spacecraft gravity to slowly pull
            • **Nuclear Explosive** - Last resort for large objects
            
            **Recent Missions:**
            • DART (2022) - Successfully deflected Dimorphos
            • ESA Hera - Follow-up mission to study DART impact
            
            **Key Factors:**
            • Early detection is crucial
            • Small changes over time = large orbital shifts
          `,
          interactive: false,
        },
      ],
    },
  };

  const quizzes = {
    basics: {
      title: 'Asteroid Basics Quiz',
      questions: [
        {
          question:
            'What percentage of known asteroids are C-type (carbonaceous)?',
          options: ['50%', '65%', '75%', '85%'],
          correct: 2,
          explanation:
            'C-type asteroids make up about 75% of all known asteroids.',
        },
        {
          question: 'Where are most asteroids located?',
          options: [
            'Between Earth and Mars',
            'Between Mars and Jupiter',
            'Beyond Jupiter',
            'Near the Sun',
          ],
          correct: 1,
          explanation:
            'Most asteroids are found in the asteroid belt between Mars and Jupiter.',
        },
      ],
    },
    impacts: {
      title: 'Impact Physics Quiz',
      questions: [
        {
          question:
            'In the kinetic energy formula E = ½mv², what happens if velocity doubles?',
          options: [
            'Energy doubles',
            'Energy triples',
            'Energy quadruples',
            'Energy stays the same',
          ],
          correct: 2,
          explanation:
            'Since energy is proportional to velocity squared, doubling velocity quadruples the energy.',
        },
        {
          question: 'At what altitude does atmospheric entry typically begin?',
          options: ['50-70 km', '80-90 km', '100-120 km', '150-200 km'],
          correct: 2,
          explanation:
            'Atmospheric entry effects typically begin at 100-120 km altitude.',
        },
      ],
    },
  };

  const handleLessonComplete = lessonId => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
  };

  const startQuiz = sectionKey => {
    setCurrentQuiz(quizzes[sectionKey]);
    setQuizScore(0);
    setShowQuizResults(false);
  };

  const handleQuizAnswer = (questionIndex, selectedAnswer) => {
    const question = currentQuiz.questions[questionIndex];
    if (selectedAnswer === question.correct) {
      setQuizScore(prev => prev + 1);
    }
  };

  const finishQuiz = () => {
    setShowQuizResults(true);
  };

  const getProgressPercentage = () => {
    const totalLessons = Object.values(educationalSections).reduce(
      (total, section) => total + section.lessons.length,
      0
    );
    return (completedLessons.size / totalLessons) * 100;
  };

  const renderLesson = lesson => (
    <div 
      key={lesson.id} 
      className='p-6 mb-4'
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-xl font-semibold text-white'>{lesson.title}</h3>
        {completedLessons.has(lesson.id) && (
          <span className='text-green-400 text-2xl'>✅</span>
        )}
      </div>

      <div className='text-gray-300 whitespace-pre-line mb-4'>
        {lesson.content}
      </div>

      {lesson.interactive && (
        <div className='space-y-4'>
          <div className='bg-blue-500/20 border border-blue-500/30 rounded-lg p-4'>
            <h4 className='text-blue-300 font-semibold mb-2'>
              💡 Interactive Element
            </h4>
            <p className='text-blue-200 text-sm'>
              Try adjusting parameters in the simulation to see how they affect
              the results!
            </p>
          </div>
        </div>
      )}

      <div className='flex justify-end mt-4'>
        <button
          onClick={() => handleLessonComplete(lesson.id)}
          disabled={completedLessons.has(lesson.id)}
          style={{
            padding: '12px 24px',
            background: completedLessons.has(lesson.id) 
              ? 'rgba(107, 114, 128, 0.3)' 
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: completedLessons.has(lesson.id) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            opacity: completedLessons.has(lesson.id) ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!completedLessons.has(lesson.id)) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!completedLessons.has(lesson.id)) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
            }
          }}
        >
          {completedLessons.has(lesson.id) ? 'Completed' : 'Mark Complete'}
        </button>
      </div>
    </div>
  );

  const renderQuiz = () => {
    if (!currentQuiz) {
      return null;
    }

    return (
      <div 
        className='p-6'
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <h3 className='text-xl font-semibold text-white mb-4'>
          {currentQuiz.title}
        </h3>

        {!showQuizResults ? (
          <div className='space-y-6'>
            {currentQuiz.questions.map((question, index) => (
              <div key={index} className='space-y-3'>
                <h4 className='text-white font-medium'>{question.question}</h4>
                <div className='grid grid-cols-1 gap-2'>
                  {question.options.map((option, optionIndex) => (
                    <button
                      key={optionIndex}
                      onClick={() => handleQuizAnswer(index, optionIndex)}
                      className='text-left justify-start'
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(107, 114, 128, 0.3)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'flex-start'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className='flex justify-end'>
              <button 
                onClick={finishQuiz}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }}
              >
                Finish Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className='text-center space-y-4'>
            <div className='text-3xl font-bold text-white'>
              Score: {quizScore}/{currentQuiz.questions.length}
            </div>
            <div className='text-gray-300'>
              {quizScore === currentQuiz.questions.length
                ? "Perfect! You've mastered this topic!"
                : 'Good effort! Review the lessons and try again.'}
            </div>
            <button
              onClick={() => setCurrentQuiz(null)}
              style={{
                padding: '12px 24px',
                background: 'rgba(107, 114, 128, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }}
            >
              Back to Lessons
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden'>
      <EnhancedMeteorBackground />

      <div className='relative z-10 container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            🎓 Asteroid Academy
          </h1>
          <p className='text-xl text-gray-300 mb-6'>
            Learn about asteroids, impacts, and planetary defense
          </p>

          {/* Progress Bar */}
          <div className='max-w-md mx-auto'>
            <div className='flex justify-between text-sm text-gray-400 mb-2'>
              <span>Progress</span>
              <span>{Math.round(getProgressPercentage())}% Complete</span>
            </div>
            <div 
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div 
                style={{
                  width: `${getProgressPercentage()}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className='flex flex-wrap justify-center gap-4 mb-8'>
          {Object.entries(educationalSections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className='flex items-center space-x-2'
              style={{
                padding: '12px 24px',
                background: activeSection === key 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))'
                  : 'rgba(107, 114, 128, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }}
            >
              <span>{section.icon}</span>
              <span>{section.title}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className='max-w-4xl mx-auto'>
          {currentQuiz ? (
            renderQuiz()
          ) : (
            <div>
              {/* Section Header */}
              <div className='text-center mb-6'>
                <h2 className='text-3xl font-bold text-white mb-2'>
                  {educationalSections[activeSection].icon}{' '}
                  {educationalSections[activeSection].title}
                </h2>
                {quizzes[activeSection] && (
                  <button
                    onClick={() => startQuiz(activeSection)}
                    className='mt-4'
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                    }}
                  >
                    📝 Take Quiz
                  </button>
                )}
              </div>

              {/* Lessons */}
              <div className='space-y-6'>
                {educationalSections[activeSection].lessons.map(renderLesson)}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className='mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto'>
          <div 
            className='p-6 text-center'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className='text-3xl font-bold text-blue-400 mb-2'>
              {completedLessons.size}
            </div>
            <div className='text-gray-300'>Lessons Completed</div>
          </div>

          <div 
            className='p-6 text-center'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className='text-3xl font-bold text-green-400 mb-2'>
              {Object.values(educationalSections).reduce(
                (total, section) => total + section.lessons.length,
                0
              )}
            </div>
            <div className='text-gray-300'>Total Lessons</div>
          </div>

          <div 
            className='p-6 text-center'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className='text-3xl font-bold text-purple-400 mb-2'>
              {Math.round(getProgressPercentage())}%
            </div>
            <div className='text-gray-300'>Course Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalContent;
