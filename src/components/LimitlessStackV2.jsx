import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Check, Circle } from 'lucide-react';

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
  const [saveStatus, setSaveStatus] = useState('');

  const getLocalDateString = () => new Date().toLocaleDateString('en-CA');

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
    } else if (data.sleepTime >= '21:30' && data.sleepTime <= '22:30' && data.wakeTime >= '06:00' && data.wakeTime <= '07:00') {
      points += 7;
    }
    if (data.deepWorkBlocks >= 3) points += 15;
    else points += data.deepWorkBlocks * 4;
    if (data.distractionCount < 5) points += 10;
    else if (data.distractionCount < 10) points += 5;
    if (data.stimulationScore <= 4) points += 10;
    else if (data.stimulationScore <= 6) points += 5;
    if (data.dietQuality >= 8) points += 5;
    else if (data.dietQuality >= 6) points += 3;
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
      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving vision:', error);
    }
  };

  const getLast7Days = () => entries.slice(0, 7);

  const getWeeklyAverage = (field) => {
    const last7 = getLast7Days();
    if (last7.length === 0) return '0.0';
    const sum = last7.reduce((acc, entry) => acc + (entry[field] || 0), 0);
    return (sum / last7.length).toFixed(1);
  };

  const Stat = ({ label, value, sub }) => (
    <div className="space-y-1">
      <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-light tracking-tight font-mono">{value}</p>
      {sub && <p className="text-xs text-neutral-600">{sub}</p>}
    </div>
  );

  const RitualCheck = ({ done, label }) => (
    <div className={`flex items-center gap-3 py-3 px-4 rounded-lg border transition-all ${done ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-800'}`}>
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${done ? 'border-white bg-white' : 'border-neutral-700'}`}>
        {done && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
      </div>
      <span className={`text-sm ${done ? 'text-white' : 'text-neutral-500'}`}>{label}</span>
    </div>
  );

  const SliderInput = ({ label, value, onChange, hint }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm text-neutral-400">{label}</label>
        <span className="text-sm font-mono text-white">{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={onChange}
        className="w-full slider"
      />
      {hint && <p className="text-xs text-neutral-600">{hint}</p>}
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-8">
        <Stat label="Points" value={stats.totalPoints} />
        <Stat label="Streak" value={stats.currentStreak} sub="days" />
        <Stat label="Entries" value={entries.length} />
      </div>

      {/* Today's Rituals */}
      <div className="space-y-4">
        <h2 className="text-xs text-neutral-500 uppercase tracking-wider">Today's Rituals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <RitualCheck done={todayEntry?.morningMindset} label="Morning Mindset" />
          <RitualCheck done={todayEntry?.affirmationsRead} label="Affirmations" />
          <RitualCheck done={todayEntry?.nightMindset} label="Night Review" />
        </div>
      </div>

      {/* Status + CTA */}
      {!todayEntry && !showForm && (
        <div className="py-4 px-5 rounded-lg border border-neutral-800 bg-neutral-900/50">
          <p className="text-sm text-neutral-400">No entry logged today</p>
        </div>
      )}

      {!showForm && (
        <button
          onClick={openForm}
          className="group w-full py-4 px-6 rounded-lg bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
        >
          {todayEntry ? 'Update Entry' : 'Log Today'}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Check-in Form */}
      {showForm && (
        <div className="space-y-8 p-6 rounded-xl border border-neutral-800 bg-neutral-950">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Daily Check-in</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sleep */}
            <div className="space-y-4">
              <h3 className="text-xs text-neutral-500 uppercase tracking-wider">Sleep</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400">Bedtime</label>
                  <input
                    type="time"
                    value={formData.sleepTime}
                    onChange={(e) => setFormData(prev => ({...prev, sleepTime: e.target.value}))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neutral-600 transition-colors"
                    required
                  />
                  <p className="text-xs text-neutral-600">Target: 22:00</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400">Wake</label>
                  <input
                    type="time"
                    value={formData.wakeTime}
                    onChange={(e) => setFormData(prev => ({...prev, wakeTime: e.target.value}))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neutral-600 transition-colors"
                    required
                  />
                  <p className="text-xs text-neutral-600">Target: 06:30</p>
                </div>
              </div>
              <SliderInput
                label="Quality"
                value={formData.sleepQuality}
                onChange={(e) => setFormData(prev => ({...prev, sleepQuality: parseInt(e.target.value)}))}
              />
            </div>

            {/* Focus */}
            <div className="space-y-4">
              <h3 className="text-xs text-neutral-500 uppercase tracking-wider">Focus</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400">Deep Work Blocks</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.deepWorkBlocks}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({...prev, deepWorkBlocks: val === '' ? 0 : parseInt(val)}));
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neutral-600 transition-colors"
                    required
                  />
                  <p className="text-xs text-neutral-600">Target: 3+</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400">Distractions</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.distractionCount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({...prev, distractionCount: val === '' ? 0 : parseInt(val)}));
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neutral-600 transition-colors"
                    required
                  />
                  <p className="text-xs text-neutral-600">Target: &lt;5</p>
                </div>
              </div>
            </div>

            {/* Lifestyle */}
            <div className="space-y-4">
              <h3 className="text-xs text-neutral-500 uppercase tracking-wider">Lifestyle</h3>
              <div className="space-y-6">
                <SliderInput
                  label="Stimulation"
                  value={formData.stimulationScore}
                  onChange={(e) => setFormData(prev => ({...prev, stimulationScore: parseInt(e.target.value)}))}
                  hint="Lower is better"
                />
                <SliderInput
                  label="Diet"
                  value={formData.dietQuality}
                  onChange={(e) => setFormData(prev => ({...prev, dietQuality: parseInt(e.target.value)}))}
                />
                <SliderInput
                  label="Energy"
                  value={formData.energyLevel}
                  onChange={(e) => setFormData(prev => ({...prev, energyLevel: parseInt(e.target.value)}))}
                />
              </div>
            </div>

            {/* Rituals */}
            <div className="space-y-4">
              <h3 className="text-xs text-neutral-500 uppercase tracking-wider">Rituals</h3>
              <div className="space-y-2">
                {[
                  { key: 'morningMindset', label: 'Morning Mindset' },
                  { key: 'affirmationsRead', label: 'Affirmations' },
                  { key: 'nightMindset', label: 'Night Review' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 py-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData[key] ? 'border-white bg-white' : 'border-neutral-700 group-hover:border-neutral-500'}`}>
                      {formData[key] && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                    </div>
                    <input
                      type="checkbox"
                      checked={formData[key]}
                      onChange={(e) => setFormData(prev => ({...prev, [key]: e.target.checked}))}
                      className="sr-only"
                    />
                    <span className="text-sm text-neutral-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm text-neutral-400">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-neutral-600 transition-colors resize-none h-24"
                placeholder="Optional"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-lg bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-all"
            >
              Save Entry
            </button>
          </form>
        </div>
      )}

      {/* Weekly Overview */}
      {entries.length > 0 && !showForm && (
        <div className="space-y-6">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wider">Last 7 Days</h2>

          <div className="grid grid-cols-4 gap-6">
            <Stat label="Avg Deep Work" value={getWeeklyAverage('deepWorkBlocks')} />
            <Stat label="Avg Distractions" value={getWeeklyAverage('distractionCount')} />
            <Stat label="Avg Diet" value={getWeeklyAverage('dietQuality')} />
            <Stat label="Avg Sleep" value={getWeeklyAverage('sleepQuality')} />
          </div>

          <div className="space-y-1">
            {getLast7Days().map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between py-4 border-b border-neutral-900 last:border-0">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-neutral-500 w-24">
                    {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-sm text-neutral-600">
                    {entry.deepWorkBlocks} blocks / {entry.distractionCount} distractions
                  </span>
                </div>
                <span className="text-lg font-mono">{entry.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const VisionView = () => (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-lg font-medium">12-Month Vision</h2>
        <p className="text-sm text-neutral-500">Define your goals across the three pillars</p>
      </div>

      {[
        { key: 'business', label: 'Business', placeholder: 'Revenue targets, growth metrics...' },
        { key: 'fitness', label: 'Fitness', placeholder: 'Body composition, performance goals...' },
        { key: 'life', label: 'Life', placeholder: 'Experiences, relationships, achievements...' }
      ].map(({ key, label, placeholder }) => (
        <div key={key} className="space-y-3">
          <label className="text-xs text-neutral-500 uppercase tracking-wider">{label}</label>
          <textarea
            value={vision[key]}
            onChange={(e) => setVision(prev => ({...prev, [key]: e.target.value}))}
            placeholder={placeholder}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-neutral-600 transition-colors resize-none h-32"
          />
        </div>
      ))}

      <button
        onClick={saveVision}
        className="w-full py-4 rounded-lg bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
      >
        {saveStatus === 'Saved' ? (
          <>
            <Check className="w-4 h-4" />
            Saved
          </>
        ) : (
          'Save Vision'
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-medium tracking-tight mb-1">Limitless Stack</h1>
          <p className="text-sm text-neutral-500">Performance tracking system</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-1 mb-12 border-b border-neutral-900">
          {['dashboard', 'vision'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                view === v ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
              {view === v && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-white" />
              )}
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
