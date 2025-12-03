import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import api from '../lib/api';

interface Message {
  id: string;
  type: 'question' | 'response' | 'evaluation' | 'hint' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
}

export function Session() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [response]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSession = async () => {
    try {
      const res = await api.get(`/sessions/${sessionId}`);
      const sessionData = res.data.session;
      setSession(sessionData);
      
      console.log('Session loaded:', sessionData);
      
      // Add welcome message
      addMessage({
        type: 'system',
        content: `Welcome to your learning session on ${sessionData.topicName}! Let's begin with a Socratic question to guide your thinking.`,
      });

      // Get the first question from the session's questions array
      let firstQuestion = null;
      
      if (sessionData.currentQuestion) {
        firstQuestion = sessionData.currentQuestion;
      } else if (sessionData.questions && sessionData.questions.length > 0) {
        // Get the most recent question without a response
        const unansweredQuestion = sessionData.questions.find((q: any) => 
          !q.user_responses || q.user_responses.length === 0
        );
        firstQuestion = unansweredQuestion || sessionData.questions[sessionData.questions.length - 1];
      }

      if (firstQuestion) {
        console.log('Setting current question:', firstQuestion);
        setCurrentQuestion({
          id: firstQuestion.id,
          text: firstQuestion.question_text || firstQuestion.text,
          type: firstQuestion.question_type || firstQuestion.type,
          difficulty: firstQuestion.difficulty
        });
        
        addMessage({
          type: 'question',
          content: firstQuestion.question_text || firstQuestion.text,
          data: firstQuestion,
        });
      } else {
        console.warn('No question found in session');
        addMessage({
          type: 'system',
          content: 'No question available. Please try starting a new session.',
        });
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      addMessage({
        type: 'system',
        content: 'Failed to load session. Please try again.',
      });
    }
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    }]);
  };

  const submitResponse = async () => {
    if (!response.trim() || !currentQuestion || loading) return;

    const userResponse = response.trim();
    setResponse('');
    setLoading(true);
    setThinking(true);

    // Add user's response to chat
    addMessage({
      type: 'response',
      content: userResponse,
    });

    try {
      const res = await api.post(`/sessions/${sessionId}/submit`, {
        questionId: currentQuestion.id,
        response: userResponse,
      });

      setThinking(false);

      // Add evaluation
      const evaluation = res.data.evaluation;
      addMessage({
        type: 'evaluation',
        content: formatEvaluation(evaluation),
        data: evaluation,
      });

      // Show follow-up question if exists
      if (evaluation.followUpQuestion) {
        setTimeout(() => {
          addMessage({
            type: 'question',
            content: evaluation.followUpQuestion,
          });
        }, 1000);
      }

      // Load next question or complete
      if (res.data.nextQuestion) {
        setTimeout(() => {
          setCurrentQuestion(res.data.nextQuestion);
          addMessage({
            type: 'question',
            content: res.data.nextQuestion.text,
            data: res.data.nextQuestion,
          });
          setHintLevel(0);
        }, 2000);
      } else {
        setTimeout(() => {
          addMessage({
            type: 'system',
            content: '🎉 Great work! You\'ve completed this session. Click "Complete Session" to see your results.',
          });
        }, 2000);
      }
    } catch (error) {
      setThinking(false);
      console.error('Failed to submit response:', error);
      addMessage({
        type: 'system',
        content: 'Failed to evaluate response. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getHint = async () => {
    if (!currentQuestion || hintLevel >= 3) return;

    const nextLevel = hintLevel + 1;
    setLoading(true);

    try {
      const res = await api.post(`/questions/${currentQuestion.id}/hint`, {
        level: nextLevel,
      });

      addMessage({
        type: 'hint',
        content: `💡 Hint ${nextLevel}: ${res.data.hint.text}`,
        data: res.data.hint,
      });

      setHintLevel(nextLevel);
    } catch (error) {
      console.error('Failed to get hint:', error);
      addMessage({
        type: 'system',
        content: 'Failed to get hint. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const completeSession = async () => {
    try {
      const res = await api.post(`/sessions/${sessionId}/complete`);
      navigate('/progress', { state: { sessionSummary: res.data.summary } });
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const formatEvaluation = (evaluation: any) => {
    let text = `📊 **Understanding Score: ${evaluation.score}/100** (${evaluation.understanding})\n\n`;
    
    if (evaluation.strengths && evaluation.strengths.length > 0) {
      text += '✅ **Strengths:**\n';
      evaluation.strengths.forEach((s: string) => {
        text += `• ${s}\n`;
      });
      text += '\n';
    }
    
    if (evaluation.improvements && evaluation.improvements.length > 0) {
      text += '📈 **Areas to explore:**\n';
      evaluation.improvements.forEach((i: string) => {
        text += `• ${i}\n`;
      });
    }
    
    return text;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitResponse();
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Session Header */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                💬
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{session.topicName}</h1>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <span className="flex items-center space-x-1">
                    <span>🎯</span>
                    <span>Difficulty: {session.difficulty}/10</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <span>❓</span>
                    <span>Questions: {session.questionsCompleted || 0}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <span>💡</span>
                    <span>Hints: {hintLevel}/3</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/')} className="hover:scale-105 transition-transform">
                ← Exit
              </Button>
              <Button variant="success" size="sm" onClick={completeSession} className="hover:scale-105 transition-transform">
                ✓ Complete
              </Button>
            </div>
          </div>
        </Card>

        {/* Chat Interface */}
        <Card className="h-[calc(100vh-250px)] flex flex-col shadow-2xl">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'response' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-lg ${
                    message.type === 'response'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white'
                      : message.type === 'question'
                      ? 'bg-slate-700/90 text-white border-l-4 border-indigo-500 backdrop-blur-sm'
                      : message.type === 'evaluation'
                      ? 'bg-gradient-to-r from-green-900/60 to-green-800/60 text-white border border-green-600/50 backdrop-blur-sm'
                      : message.type === 'hint'
                      ? 'bg-gradient-to-r from-yellow-900/60 to-yellow-800/60 text-white border border-yellow-600/50 backdrop-blur-sm'
                      : 'bg-slate-800/90 text-slate-300 text-center backdrop-blur-sm'
                  }`}
                >
                  {message.type === 'question' && (
                    <div className="flex items-start space-x-2 mb-2">
                      <span className="text-2xl">🤔</span>
                      <span className="text-xs text-slate-400 mt-1">Socratic Question</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.type === 'evaluation' && message.data && (
                    <div className="mt-3 pt-3 border-t border-green-700/50">
                      <div className="flex items-center justify-between text-sm">
                        <span>Cognitive Load: {message.data.cognitiveLoad}%</span>
                        <span className={`px-2 py-1 rounded ${
                          message.data.cognitiveLoad < 60 ? 'bg-green-600' :
                          message.data.cognitiveLoad < 80 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}>
                          {message.data.cognitiveLoad < 60 ? 'Optimal' :
                           message.data.cognitiveLoad < 80 ? 'Moderate' : 'High'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {thinking && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-2xl px-5 py-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-slate-300 text-sm font-medium">🤖 Analyzing your response...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-700 p-4 bg-slate-800/50">
            {!currentQuestion && (
              <div className="mb-3 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-300 text-sm">
                ⚠️ Waiting for question to load... If this persists, try refreshing the page.
              </div>
            )}
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={currentQuestion ? "Type your thoughtful response here... (Press Enter to send, Shift+Enter for new line)" : "Waiting for question..."}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[60px] max-h-[200px] transition-all"
                  disabled={loading || !currentQuestion}
                  rows={1}
                />
              </div>
              <div className="flex flex-col space-y-2">
                {hintLevel < 3 && currentQuestion && (
                  <Button
                    onClick={getHint}
                    variant="secondary"
                    size="sm"
                    disabled={loading}
                    className="whitespace-nowrap hover:scale-105 transition-transform"
                  >
                    💡 Hint {hintLevel + 1}
                  </Button>
                )}
                <Button
                  onClick={submitResponse}
                  variant="primary"
                  disabled={loading || !response.trim() || !currentQuestion}
                  className="whitespace-nowrap hover:scale-105 transition-transform"
                >
                  {loading ? (
                    <span className="flex items-center space-x-2">
                      <span className="animate-spin">⏳</span>
                      <span>Sending...</span>
                    </span>
                  ) : (
                    '📤 Send'
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>💡 Socratic learning: Questions guide you to discover knowledge</span>
              <span className="text-slate-600">{response.length} characters</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
