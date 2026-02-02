import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, TrendingUp, Zap, Moon, Brain, Apple, CheckSquare, BookOpen, Lightbulb } from 'lucide-react';

// Storage helper functions (localStorage instead of window.storage)
const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
  listEntries: () => {
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('entry:')) {
        const data = storage.get(key);
        if (data) entries.push(data);
      }
    }
    return entries;
  }
};

const LimitlessStackV2 = () => {
  const [view, setView] = useState('dashboard');
  const [entries, setEntries] = useState([]);
  const [vision, setVision] = useState({
    business: '',
    fitness: '',
    life: ''
  });
  const [todayEntry, setTodayEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({ totalPoints: 0, currentStreak: 0 });

  const getLocalDateString = () => {
    return new Date().toLocaleDateString('en-CA');
  };

  const getDefaultFormData = () => ({
    date: getLocalDateString(),
    sleepTime: '',
    wakeTime: '',
    sleepQuality: 7,
    deepWorkBlocks: 0,
    distractionCount: 0,
    stimulationScore: 5,
    dietQuality: 7,
    energyLevel: 7,
    morningMindset: false,
    nightMindset: false,
    affirmationsRead: false,
    notes: ''
  });

  const [formData, setFormData] = useState(getDefaultFormData());

  const calculateStats = useCallback((entriesList) => {
    let totalPoints = 0;
    let currentStreak = 0;

    const sortedEntries = [...entriesList].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedEntries.forEach(entry => {
      totalPoints += entry.points || 0;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].date + 'T00:00:00');
      entryDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (entryDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStats({ totalPoints, currentStreak });
  }, []);

  const loadData = useCallback(() => {
    try {
      const loadedEntries = storage.listEntries();
      loadedEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEntries(loadedEntries);

      const today = getLocalDateString();
      const todayData = loadedEntries.find(e => e.date === today);
      setTodayEntry(todayData);

      calculateStats(loadedEntries);

      const visionData = storage.get('vision');
      if (visionData) setVision(visionData);
    } catch (error) {
      console.log('Loading data:', error);
    }
  }, [calculateStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openForm = () => {
    if (todayEntry) {
      setFormData({
        date: todayEntry.date,
        sleepTime: todayEntry.sleepTime || '',
        wakeTime: todayEntry.wakeTime || '',
        sleepQuality: todayEntry.sleepQuality ?? 7,
        deepWorkBlocks: todayEntry.deepWorkBlocks ?? 0,
        distractionCount: todayEntry.distractionCount ?? 0,
        stimulationScore: todayEntry.stimulationScore ?? 5,
        dietQuality: todayEntry.dietQuality ?? 7,
        energyLevel: todayEntry.energyLevel ?? 7,
        morningMindset: todayEntry.morningMindset ?? false,
        nightMindset: todayEntry.nightMindset ?? false,
        affirmationsRead: todayEntry.affirmationsRead ?? false,
        notes: todayEntry.notes || ''
      });
    } else {
      setFormData(getDefaultFormData());
    }
    setShowForm(true);
  };

  const calculatePoints = (data) => {
    let points = 0;

    if (data.sleepTime === '22:00' && data.wakeTime === '06:30') {
      points += 10;
    } else if (data.sleepTime >= '21:30' && data.sleepTime <= '22:30' &&
               data.wakeTime >= '06:00' && data.wakeTime <= '07:00') {
      points += 7;
    }

    if (data.deepWorkBlocks >= 3) {
      points += 15;
    } else {
      points += data.deepWorkBlocks * 4;
    }

    if (data.distractionCount < 5) {
      points += 10;
    } else if (data.distractionCount < 10) {
      points += 5;
    }

    if (data.stimulationScore <= 4) {
      points += 10;
    } else if (data.stimulationScore <= 6) {
      points += 5;
    }

    if (data.dietQuality >= 8) {
      points += 5;
    } else if (data.dietQuality >= 6) {
      points += 3;
    }

    if (data.morningMindset) points += 5;
    if (data.nightMindset) points += 5;
    if (data.affirmationsRead) points += 5;

    return points;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const points = calculatePoints(formData);
    const entry = { ...formData, points };

    try {
      storage.set(`entry:${formData.date}`, entry);
      loadData();
      setShowForm(false);
      setFormData(getDefaultFormData());
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const saveVision = () => {
    try {
      storage.set('vision', vision);
    } catch (error) {
      console.error('Error saving vision:', error);
    }
  };

  const getLast7Days = () => {
    return entries.slice(0, 7);
  };

  const getWeeklyAverage = (field) => {
    const last7 = getLast7Days();
    if (last7.length === 0) return 0;
    const sum = last7.reduce((acc, entry) => acc + (entry[field] || 0), 0);
    return (sum / last7.length).toFixed(1);
  };

  // Dashboard View
  const DashboardView = () => (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Points</p>
              <p className="text-3xl font-bold text-blue-400">{stats.totalPoints}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Current Streak</p>
              <p className="text-3xl font-bold text-purple-400">{stats.currentStreak} days</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Entries</p>
              <p className="text-3xl font-bold text-green-400">{entries.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Today's Ritual Checklist */}
      <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 mb-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-purple-400" />
          Today's Ritual Checklist
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${todayEntry?.morningMindset ? 'border-green-500 bg-green-500/10' : 'border-slate-600'}`}>
            <p className="font-semibold mb-1">☀️ Morning Mindset</p>
            <p className="text-sm text-slate-400">Read journal + visualize goals</p>
          </div>
          <div className={`p-4 rounded-lg border-2 ${todayEntry?.affirmationsRead ? 'border-green-500 bg-green-500/10' : 'border-slate-600'}`}>
            <p className="font-semibold mb-1">🗣️ Affirmations</p>
            <p className="text-sm text-slate-400">Read aloud + visualize</p>
          </div>
          <div className={`p-4 rounded-lg border-2 ${todayEntry?.nightMindset ? 'border-green-500 bg-green-500/10' : 'border-slate-600'}`}>
            <p className="font-semibold mb-1">🌙 Night Mindset</p>
            <p className="text-sm text-slate-400">Review + affirmations before sleep</p>
          </div>
        </div>
      </div>

      {/* Analog/Digital Split Guide */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur rounded-lg p-6 border border-purple-500/30 mb-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Your Optimization System
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-blue-400 mb-3">📱 DIGITAL (This App)</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Daily performance tracking</li>
              <li>• Points & streak gamification</li>
              <li>• Weekly pattern analysis</li>
              <li>• Progress visualizations</li>
              <li>• Quick check-ins</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-purple-400 mb-3">📝 ANALOG (Paper)</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Vision board (physical collage on wall)</li>
              <li>• Affirmations journal (handwritten)</li>
              <li>• Morning/evening reflection journal</li>
              <li>• Identity worksheet</li>
              <li>• 12-month goals poster</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Today's Status */}
      {!todayEntry && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-400">⚠️ You haven't logged today yet!</p>
        </div>
      )}

      {/* Check-in Button */}
      {!showForm && (
        <button
          onClick={openForm}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-4 px-6 rounded-lg mb-8 transition-all transform hover:scale-105"
        >
          {todayEntry ? '✏️ Update Today\'s Entry' : '✨ Daily Check-In'}
        </button>
      )}

      {/* Check-in Form */}
      {showForm && (
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-2xl font-bold mb-6">Daily Check-In</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sleep Section */}
            <div className="border-b border-slate-700 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <Moon className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Sleep</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Sleep Time</label>
                  <input
                    type="time"
                    value={formData.sleepTime}
                    onChange={(e) => setFormData(prev => ({...prev, sleepTime: e.target.value}))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Target: 22:00</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Wake Time</label>
                  <input
                    type="time"
                    value={formData.wakeTime}
                    onChange={(e) => setFormData(prev => ({...prev, wakeTime: e.target.value}))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Target: 06:30</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Sleep Quality: {formData.sleepQuality}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.sleepQuality}
                  onChange={(e) => setFormData(prev => ({...prev, sleepQuality: parseInt(e.target.value)}))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Deep Work Section */}
            <div className="border-b border-slate-700 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold">Focus & Productivity</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Deep Work Blocks</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.deepWorkBlocks}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({...prev, deepWorkBlocks: val === '' ? 0 : parseInt(val)}));
                    }}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Target: 3+ blocks</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Total Distractions</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.distractionCount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({...prev, distractionCount: val === '' ? 0 : parseInt(val)}));
                    }}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Target: &lt;5</p>
                </div>
              </div>
            </div>

            {/* Lifestyle Section */}
            <div className="border-b border-slate-700 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <Apple className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold">Lifestyle</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Stimulation Level: {formData.stimulationScore}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.stimulationScore}
                    onChange={(e) => setFormData(prev => ({...prev, stimulationScore: parseInt(e.target.value)}))}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Lower = better (caffeine, social media, etc.)</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Diet Quality: {formData.dietQuality}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.dietQuality}
                    onChange={(e) => setFormData(prev => ({...prev, dietQuality: parseInt(e.target.value)}))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Energy Level: {formData.energyLevel}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.energyLevel}
                    onChange={(e) => setFormData(prev => ({...prev, energyLevel: parseInt(e.target.value)}))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Ritual Completion */}
            <div className="border-b border-slate-700 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold">Daily Rituals</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.morningMindset}
                    onChange={(e) => setFormData(prev => ({...prev, morningMindset: e.target.checked}))}
                    className="w-5 h-5"
                  />
                  <span>Morning Mindset (journal + visualization)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.affirmationsRead}
                    onChange={(e) => setFormData(prev => ({...prev, affirmationsRead: e.target.checked}))}
                    className="w-5 h-5"
                  />
                  <span>Affirmations Read Aloud</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nightMindset}
                    onChange={(e) => setFormData(prev => ({...prev, nightMindset: e.target.checked}))}
                    className="w-5 h-5"
                  />
                  <span>Night Mindset (review + affirmations)</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white h-24"
                placeholder="What went well? What derailed you?"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Save Entry
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Weekly Overview */}
      {entries.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold mb-6">Last 7 Days</h2>

          {/* Averages */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-slate-400 text-sm">Avg Deep Work</p>
              <p className="text-2xl font-bold text-purple-400">{getWeeklyAverage('deepWorkBlocks')}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Avg Distractions</p>
              <p className="text-2xl font-bold text-blue-400">{getWeeklyAverage('distractionCount')}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Avg Diet</p>
              <p className="text-2xl font-bold text-green-400">{getWeeklyAverage('dietQuality')}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Avg Sleep Quality</p>
              <p className="text-2xl font-bold text-yellow-400">{getWeeklyAverage('sleepQuality')}</p>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="space-y-2">
            {getLast7Days().map((entry, idx) => (
              <div key={idx} className="bg-slate-700/30 rounded p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  <p className="text-sm text-slate-400">
                    {entry.deepWorkBlocks} blocks · {entry.distractionCount} distractions · {entry.sleepTime}-{entry.wakeTime}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-400">{entry.points}</p>
                  <p className="text-xs text-slate-400">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Vision View
  const VisionView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-8 border border-purple-500/30">
        <h2 className="text-3xl font-bold mb-4">🎯 Your 12-Month Vision</h2>
        <p className="text-slate-300 mb-4">Define your identity and goals across the 3 pillars</p>
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4">
          <p className="text-sm text-yellow-300">
            💡 <strong>Pro Tip:</strong> Create a physical vision board on your wall with images representing these goals.
            The digital version here is for tracking, but the analog collage has more emotional power.
          </p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-purple-400">📊 Business Goals</h3>
        <textarea
          value={vision.business}
          onChange={(e) => setVision(prev => ({...prev, business: e.target.value}))}
          placeholder="Company A = $250k/month&#10;Company B = $100k/month&#10;1M followers across platforms..."
          className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-white h-32 font-mono text-sm"
        />
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-green-400">💪 Fitness Goals</h3>
        <textarea
          value={vision.fitness}
          onChange={(e) => setVision(prev => ({...prev, fitness: e.target.value}))}
          placeholder="195 lbs, 10% body fat&#10;Kinobody Greek God stats&#10;Level 5 tennis..."
          className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-white h-32 font-mono text-sm"
        />
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-blue-400">🌟 Life Goals</h3>
        <textarea
          value={vision.life}
          onChange={(e) => setVision(prev => ({...prev, life: e.target.value}))}
          placeholder="Marry a VS Angel&#10;Watch F1 in Monaco&#10;Acquire Napoleon artifact..."
          className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-white h-32 font-mono text-sm"
        />
      </div>

      <button
        onClick={saveVision}
        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-4 rounded-lg"
      >
        Save Vision
      </button>
    </div>
  );

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            The Limitless Stack
          </h1>
          <p className="text-slate-400">Palantirify & Gamblify Your Way to Quantum Leaps</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {['dashboard', 'vision'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                view === v
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                  : 'bg-slate-800/50 hover:bg-slate-700/50'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {view === 'dashboard' && <DashboardView />}
        {view === 'vision' && <VisionView />}
      </div>
    </div>
  );
};

export default LimitlessStackV2;
