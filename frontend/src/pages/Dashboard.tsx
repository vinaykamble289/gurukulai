import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../lib/api';

export function Dashboard() {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [overview, setOverview] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({
    name: '',
    description: '',
    subject: '',
    difficultyMin: 1,
    difficultyMax: 10
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [overviewRes, topicsRes, sessionsRes] = await Promise.all([
        api.get('/progress/overview'),
        api.get('/topics'),
        api.get('/sessions').catch(() => ({ data: { sessions: [] } }))
      ]);
      setOverview(overviewRes.data.overview);
      setTopics(topicsRes.data.topics || []);
      setRecentSessions(sessionsRes.data.sessions?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (topicId: string) => {
    try {
      setLoading(true);
      const res = await api.post('/sessions/start', { topicId });
      if (res.data.session?.id) {
        navigate(`/session/${res.data.session.id}`);
      } else {
        console.error('No session ID returned');
        alert('Failed to start session. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to start session:', error);
      alert(error.response?.data?.message || 'Failed to start session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async () => {
    if (!newTopic.name || !newTopic.subject) {
      alert('Please fill in topic name and subject');
      return;
    }

    try {
      setLoading(true);
      await api.post('/topics', {
        name: newTopic.name,
        description: newTopic.description,
        subject: newTopic.subject,
        difficulty_range: [newTopic.difficultyMin, newTopic.difficultyMax]
      });
      
      setShowCreateTopic(false);
      setNewTopic({
        name: '',
        description: '',
        subject: '',
        difficultyMin: 1,
        difficultyMax: 10
      });
      
      // Reload topics
      await loadData();
    } catch (error: any) {
      console.error('Failed to create topic:', error);
      alert(error.response?.data?.message || 'Failed to create topic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, <span className="gradient-text">{user?.email?.split('@')[0]}</span>!
          </h1>
          <p className="text-slate-400 text-lg">Continue your learning journey</p>
        </div>

        {/* Stats Grid */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Overall Mastery"
              value={`${overview.overallMastery}%`}
              icon="🎯"
              color="indigo"
              trend={{ value: 5, isPositive: true }}
            />
            <StatCard
              title="Current Streak"
              value={`${overview.streak} days`}
              icon="🔥"
              color="orange"
            />
            <StatCard
              title="Level"
              value={overview.level}
              icon="⭐"
              color="purple"
            />
            <StatCard
              title="Total XP"
              value={overview.xp}
              icon="💎"
              color="green"
            />
          </div>
        )}

        {/* Topics Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Available Topics</h2>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setShowCreateTopic(true)}
            >
              + Create Topic
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map(topic => (
              <Card key={topic.id} hover gradient>
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
                      📚
                    </div>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-medium">
                      {topic.subject}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{topic.name}</h3>
                  <p className="text-slate-400 text-sm mb-4 flex-grow">{topic.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div className="text-sm text-slate-400">
                      Difficulty: {topic.difficulty_range?.[0]}-{topic.difficulty_range?.[1]}/10
                    </div>
                    <Button
                      onClick={() => startSession(topic.id)}
                      variant="primary"
                      size="sm"
                    >
                      Start Learning
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {topics.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-white mb-2">No topics available yet</h3>
                <p className="text-slate-400">Check back soon for new learning content!</p>
              </div>
            </Card>
          )}
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Sessions</h2>
            </div>
            
            <div className="space-y-4">
              {recentSessions.map(session => (
                <Card key={session.id} hover>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center text-2xl">
                        💬
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{session.topicName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-400 mt-1">
                          <span>{session.questionsCompleted || 0} questions</span>
                          <span>•</span>
                          <span>{Math.round((session.duration || 0) / 60)} min</span>
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded ${
                            session.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                            session.status === 'active' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    {session.status === 'active' && (
                      <Button
                        onClick={() => navigate(`/session/${session.id}`)}
                        variant="primary"
                        size="sm"
                      >
                        Continue
                      </Button>
                    )}
                    {session.status === 'completed' && session.averageUnderstanding && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {Math.round(session.averageUnderstanding)}%
                        </div>
                        <div className="text-xs text-slate-400">Understanding</div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card gradient>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center text-3xl">
                📊
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">View Progress</h3>
                <p className="text-slate-400 text-sm">Track your learning journey</p>
              </div>
              <Button
                onClick={() => navigate('/progress')}
                variant="secondary"
                size="sm"
              >
                View
              </Button>
            </div>
          </Card>

          <Card gradient>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center text-3xl">
                💬
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Chat Sessions</h3>
                <p className="text-slate-400 text-sm">Interactive Socratic learning</p>
              </div>
              <Button
                onClick={() => topics.length > 0 && startSession(topics[0].id)}
                variant="secondary"
                size="sm"
                disabled={topics.length === 0}
              >
                Start
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Create Topic Modal */}
      {showCreateTopic && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create New Topic</h2>
              <button
                onClick={() => setShowCreateTopic(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Topic Name *
                </label>
                <Input
                  value={newTopic.name}
                  onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                  placeholder="e.g., Introduction to Algebra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subject *
                </label>
                <Input
                  value={newTopic.subject}
                  onChange={(e) => setNewTopic({ ...newTopic, subject: e.target.value })}
                  placeholder="e.g., Mathematics, Science, History"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  placeholder="Describe what this topic covers..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Min Difficulty (1-10)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newTopic.difficultyMin}
                    onChange={(e) => setNewTopic({ ...newTopic, difficultyMin: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Difficulty (1-10)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newTopic.difficultyMax}
                    onChange={(e) => setNewTopic({ ...newTopic, difficultyMax: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={createTopic}
                  variant="primary"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Topic'}
                </Button>
                <Button
                  onClick={() => setShowCreateTopic(false)}
                  variant="secondary"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
