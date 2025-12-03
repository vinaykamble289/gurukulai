import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import api from '../lib/api';

export function Progress() {
  const navigate = useNavigate();
  const location = useLocation();
  const [analytics, setAnalytics] = useState<any>(null);
  const [retention, setRetention] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const sessionSummary = location.state?.sessionSummary;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, retentionRes] = await Promise.all([
        api.get('/progress/analytics'),
        api.get('/progress/retention'),
      ]);
      setAnalytics(analyticsRes.data.analytics);
      setRetention(retentionRes.data.metrics);
    } catch (error) {
      console.error('Failed to load progress data:', error);
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Progress</h1>
          <p className="text-slate-400 text-lg">Track your learning journey and achievements</p>
        </div>

        {/* Session Summary (if just completed) */}
        {sessionSummary && (
          <Card className="mb-8 bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-700">
            <div className="text-center py-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-4">Session Complete!</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                <div>
                  <div className="text-3xl font-bold text-green-400">{sessionSummary.questionsCompleted}</div>
                  <div className="text-slate-400 text-sm">Questions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">{sessionSummary.averageUnderstanding}%</div>
                  <div className="text-slate-400 text-sm">Avg Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">+{sessionSummary.xpEarned}</div>
                  <div className="text-slate-400 text-sm">XP Earned</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">{Math.floor(sessionSummary.duration / 60)}m</div>
                  <div className="text-slate-400 text-sm">Duration</div>
                </div>
              </div>
              {sessionSummary.leveledUp && (
                <div className="mt-6 p-4 bg-purple-900/50 border border-purple-700 rounded-lg inline-block">
                  <span className="text-2xl">⭐</span>
                  <span className="text-xl font-bold text-purple-300 ml-2">
                    Level Up! You're now Level {sessionSummary.newLevel}
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Analytics Stats */}
        {analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Sessions This Week"
                value={analytics.sessionsThisWeek}
                icon="📚"
                color="indigo"
              />
              <StatCard
                title="Time Spent"
                value={`${analytics.timeSpent}m`}
                icon="⏱️"
                color="green"
              />
              <StatCard
                title="Avg Understanding"
                value={`${analytics.averageUnderstanding}%`}
                icon="🎯"
                color="purple"
              />
              <StatCard
                title="Best Time"
                value={getBestTime(analytics.performanceByTime)}
                icon="🌟"
                color="orange"
              />
            </div>

            {/* Performance by Time of Day */}
            <Card className="mb-8">
              <h3 className="text-xl font-bold text-white mb-6">Performance by Time of Day</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(analytics.performanceByTime || {}).map(([time, score]: [string, any]) => (
                  <div key={time} className="text-center">
                    <div className="text-4xl mb-2">
                      {time === 'morning' ? '🌅' : time === 'afternoon' ? '☀️' : '🌙'}
                    </div>
                    <div className="text-lg font-semibold text-white capitalize">{time}</div>
                    <div className="text-3xl font-bold text-indigo-400 my-2">{score}%</div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-indigo-900/30 border border-indigo-700 rounded-lg">
                <p className="text-indigo-300 text-center">
                  💡 <strong>Insight:</strong> {getTimeInsight(analytics.performanceByTime)}
                </p>
              </div>
            </Card>
          </>
        )}

        {/* Retention Metrics */}
        {retention && (
          <Card className="mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Knowledge Retention</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-2">Short-term (1 week)</div>
                <div className="text-4xl font-bold text-green-400 mb-2">{retention.shortTerm}%</div>
                <div className="w-full bg-slate-600 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-600 to-green-400 h-3 rounded-full"
                    style={{ width: `${retention.shortTerm}%` }}
                  />
                </div>
              </div>
              <div className="text-center p-6 bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-2">Medium-term (1 month)</div>
                <div className="text-4xl font-bold text-yellow-400 mb-2">{retention.mediumTerm}%</div>
                <div className="w-full bg-slate-600 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-3 rounded-full"
                    style={{ width: `${retention.mediumTerm}%` }}
                  />
                </div>
              </div>
              <div className="text-center p-6 bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-2">Long-term (3 months)</div>
                <div className="text-4xl font-bold text-orange-400 mb-2">{retention.longTerm}%</div>
                <div className="w-full bg-slate-600 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-orange-600 to-orange-400 h-3 rounded-full"
                    style={{ width: `${retention.longTerm}%` }}
                  />
                </div>
              </div>
            </div>
            {retention.conceptsDueForReview > 0 && (
              <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-center">
                <p className="text-yellow-300">
                  📅 You have <strong>{retention.conceptsDueForReview} concepts</strong> due for review
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Strengths and Growth Areas */}
        {analytics && (analytics.strengths || analytics.growthAreas) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {analytics.strengths && analytics.strengths.length > 0 && (
              <Card>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <span className="text-2xl mr-2">💪</span>
                  Your Strengths
                </h3>
                <div className="space-y-3">
                  {analytics.strengths.map((strength: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                      <span className="text-green-400 text-xl">✓</span>
                      <span className="text-white">{strength}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {analytics.growthAreas && analytics.growthAreas.length > 0 && (
              <Card>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <span className="text-2xl mr-2">📈</span>
                  Growth Opportunities
                </h3>
                <div className="space-y-3">
                  {analytics.growthAreas.map((area: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-indigo-900/20 border border-indigo-700 rounded-lg">
                      <span className="text-indigo-400 text-xl">→</span>
                      <span className="text-white">{area}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <Button onClick={() => navigate('/')} variant="primary" size="lg">
            Continue Learning
          </Button>
          <Button onClick={() => window.print()} variant="secondary" size="lg">
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
}

function getBestTime(performanceByTime: any): string {
  if (!performanceByTime) return 'N/A';
  const entries = Object.entries(performanceByTime);
  if (entries.length === 0) return 'N/A';
  const best = entries.reduce((a: any, b: any) => a[1] > b[1] ? a : b);
  return best[0].charAt(0).toUpperCase() + best[0].slice(1);
}

function getTimeInsight(performanceByTime: any): string {
  const best = getBestTime(performanceByTime).toLowerCase();
  if (best === 'morning') return 'You perform best in the morning! Consider scheduling important learning sessions early.';
  if (best === 'afternoon') return 'Afternoon is your peak performance time! Use this time for challenging topics.';
  if (best === 'evening') return 'Evening sessions work great for you! Your focus is strongest later in the day.';
  return 'Keep tracking your performance to find your optimal learning time!';
}
