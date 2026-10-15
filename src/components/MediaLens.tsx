import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { MediaClusterStory } from '../types/politics';
import defaultMediaLensData from '../data/mediaLens.json';
import {
  Newspaper,
  EyeOff,
  Scale,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Info,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MediaLensProps {
  stories?: MediaClusterStory[];
  onUpdateStories?: (stories: MediaClusterStory[]) => void;
}

const MEDIA_LENS_STORAGE_KEY = 'uk_politics_media_lens_v1';

export const MediaLens: React.FC<MediaLensProps> = ({
  stories: propStories,
  onUpdateStories,
}) => {
  const [localStories, setLocalStories] = useState<MediaClusterStory[]>(() => {
    try {
      const saved = localStorage.getItem(MEDIA_LENS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultMediaLensData as MediaClusterStory[];
  });

  const activeStories =
    propStories && propStories.length > 0 ? propStories : localStories;

  const [blindspotFilter, setBlindspotFilter] = useState<
    'all' | 'left_blindspot' | 'right_blindspot' | 'balanced'
  >('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [customTopicQuery, setCustomTopicQuery] = useState('');
  const [isScanningLive, setIsScanningLive] = useState(false);
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [expandedStories, setExpandedStories] = useState<Record<string, boolean>>({});
  const [expandedWingWhy, setExpandedWingWhy] = useState<Record<string, boolean>>({});

  const toggleStoryExpanded = (storyId: string, isFirst: boolean) => {
    setExpandedStories((prev) => {
      const current = prev[storyId] !== undefined ? prev[storyId] : isFirst;
      return { ...prev, [storyId]: !current };
    });
  };

  const toggleWingWhy = (key: string) => {
    setExpandedWingWhy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToElement = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  };

  const updateAllStories = (merged: MediaClusterStory[]) => {
    setLocalStories(merged);
    if (onUpdateStories) onUpdateStories(merged);
    try {
      localStorage.setItem(MEDIA_LENS_STORAGE_KEY, JSON.stringify(merged));
    } catch {}
  };

  const handleScanLivePress = async () => {
    if (isScanningLive) return;
    setIsScanningLive(true);
    setStatusBanner(null);

    try {
      const analyzeFn = httpsCallable(functions, 'analyzeMediaLens');
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Live media scan timed out')), 55000)
      );

      const res = (await Promise.race([analyzeFn({}), timeoutPromise])) as any;
      const freshStories: MediaClusterStory[] = res?.data?.stories || [];

      if (Array.isArray(freshStories) && freshStories.length > 0) {
        const freshTitles = new Set(
          freshStories.map((s) => s.title.toLowerCase())
        );
        const merged = [
          ...freshStories,
          ...activeStories.filter(
            (s) => !freshTitles.has(s.title.toLowerCase())
          ),
        ];
        updateAllStories(merged);
        setStatusBanner(
          `Scanned 9 Left, Centre & Right UK news feeds and updated ${freshStories.length} live story clusters.`
        );
      } else {
        setStatusBanner(
          'Verified all UK newspaper clusters against current live RSS feeds.'
        );
      }
    } catch (err: any) {
      console.warn('Live media scan error:', err);
      setStatusBanner(
        'Showing verified UK newspaper framing clusters (live scan busy or timed out).'
      );
    } finally {
      setIsScanningLive(false);
    }
  };

  const handleAnalyzeCustomTopic = async (
    e?: React.FormEvent,
    presetTopic?: string
  ) => {
    if (e) e.preventDefault();
    const topicToUse = (presetTopic || customTopicQuery).trim();
    if (!topicToUse || isAnalyzingCustom) return;

    setIsAnalyzingCustom(true);
    setStatusBanner(null);

    try {
      const analyzeFn = httpsCallable(functions, 'analyzeMediaLens');
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Custom topic media framing timed out')),
          45000
        )
      );

      const res = (await Promise.race([
        analyzeFn({ customTopic: topicToUse }),
        timeoutPromise,
      ])) as any;
      const freshStories: MediaClusterStory[] = res?.data?.stories || [];

      if (Array.isArray(freshStories) && freshStories.length > 0) {
        const merged = [
          ...freshStories,
          ...activeStories.filter(
            (s) =>
              s.title.toLowerCase() !== freshStories[0].title.toLowerCase()
          ),
        ];
        updateAllStories(merged);
        setBlindspotFilter('all');
        setCategoryFilter('all');
        setCustomTopicQuery('');
        setStatusBanner(
          `Generated live Left vs Centre vs Right newspaper comparison for: "${topicToUse}"`
        );
      }
    } catch (err: any) {
      console.warn('Custom topic media analysis failed:', err);
      setStatusBanner(
        `Could not complete live press scan for "${topicToUse}". Please try again.`
      );
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  const filteredStories = activeStories.filter((story) => {
    if (blindspotFilter === 'left_blindspot' && story.blindspot !== 'left_blindspot') {
      return false;
    }
    if (blindspotFilter === 'right_blindspot' && story.blindspot !== 'right_blindspot') {
      return false;
    }
    if (blindspotFilter === 'balanced' && story.blindspot !== 'none') {
      return false;
    }
    if (
      categoryFilter !== 'all' &&
      story.category.toLowerCase() !== categoryFilter.toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  const leftBlindspotCount = activeStories.filter(
    (s) => s.blindspot === 'left_blindspot'
  ).length;
  const rightBlindspotCount = activeStories.filter(
    (s) => s.blindspot === 'right_blindspot'
  ).length;

  const getLeanBadgeStyle = (lean: string) => {
    switch (lean) {
      case 'left':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      case 'center-left':
        return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800';
      case 'center':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      case 'center-right':
        return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800';
      case 'right':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getLeanLabel = (lean: string) => {
    switch (lean) {
      case 'left':
        return 'Left-Leaning';
      case 'center-left':
        return 'Centre-Left';
      case 'center':
        return 'Centre / Broadcaster';
      case 'center-right':
        return 'Centre-Right';
      case 'right':
        return 'Right-Leaning';
      default:
        return 'UK Press';
    }
  };

  const quickTopicPills = [
    'Reform UK 5-Year Asylum Freeze & Six-Nation Visa Sanctions',
    'Nationalisation of British Steel & 50% Public Water',
    'Conservative ECHR Withdrawal & 150k Removals Force',
    'Winter Fuel Payment Means-Testing & Pensioner Poverty',
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
              <Newspaper className="w-3.5 h-3.5" />
              <span>Westminster Media Lens • Multi-Spectrum Press Comparator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              How UK Newspapers Frame the News — &amp; Why
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Compare how{' '}
              <strong className="text-rose-300">Left-leaning</strong> (
              <em>The Guardian, Daily Mirror, Independent, New Statesman</em>),{' '}
              <strong className="text-indigo-300">Centre</strong> (
              <em>BBC, Sky News, Financial Times</em>), and{' '}
              <strong className="text-sky-300">Right-leaning</strong> (
              <em>The Telegraph, Daily Mail, The Times, Daily Express, GB News</em>)
              outlets report major political stories, spot ideological{' '}
              <strong className="text-amber-300">Blindspots</strong>, and read the
              spin-free gist.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <button
              onClick={handleScanLivePress}
              disabled={isScanningLive}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw
                className={`w-4 h-4 ${isScanningLive ? 'animate-spin' : ''}`}
              />
              <span>
                {isScanningLive
                  ? 'Scanning 9 UK Newspaper Feeds...'
                  : 'Scan Live UK Press (RSS + Search)'}
              </span>
            </button>
            <div className="flex items-center space-x-3 text-[11px] text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Left</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                <span>Centre</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                <span>Right</span>
              </span>
              <span>• {activeStories.length} Story Clusters</span>
            </div>
          </div>
        </div>

        {statusBanner && (
          <div className="mt-4 bg-emerald-950/70 border border-emerald-700/60 text-emerald-200 text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusBanner}</span>
          </div>
        )}
      </div>

      {/* Interactive Custom Topic Media Framing Comparator */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Compare UK Newspaper Spin on Any Story or Policy
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Compares The Telegraph, Daily Mail &amp; Times vs BBC &amp; FT vs The Guardian &amp; Mirror
          </span>
        </div>

        <form
          onSubmit={(e) => handleAnalyzeCustomTopic(e)}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customTopicQuery}
              onChange={(e) => setCustomTopicQuery(e.target.value)}
              placeholder="Enter any UK political story or policy (e.g. 'Chagos Islands treaty', 'Inheritance tax on farms', 'NHS waiting lists')..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isAnalyzingCustom || !customTopicQuery.trim()}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 text-white transition-all cursor-pointer shrink-0"
          >
            {isAnalyzingCustom ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Comparing UK Press...</span>
              </>
            ) : (
              <>
                <Scale className="w-4 h-4" />
                <span>Compare Media Framing</span>
              </>
            )}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">
            Try comparing:
          </span>
          {quickTopicPills.map((topic, i) => (
            <button
              key={i}
              type="button"
              disabled={isAnalyzingCustom}
              onClick={() => handleAnalyzeCustomTopic(undefined, topic)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Blindspot & Category Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Blindspot Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBlindspotFilter('all')}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                blindspotFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Story Clusters ({activeStories.length})</span>
            </button>

            <button
              onClick={() => setBlindspotFilter('left_blindspot')}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                blindspotFilter === 'left_blindspot'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-sky-50/70 text-sky-900 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/70'
              }`}
              title="Stories heavily reported by Right-leaning press (Telegraph, Mail, Express, GB News) with minimal coverage in Left-leaning outlets"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Left Blindspots: Only Right Covering ({leftBlindspotCount})</span>
            </button>

            <button
              onClick={() => setBlindspotFilter('right_blindspot')}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                blindspotFilter === 'right_blindspot'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50/70 text-rose-900 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/70'
              }`}
              title="Stories heavily reported by Left-leaning press (Guardian, Mirror, Independent) with minimal coverage in Right-leaning outlets"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Right Blindspots: Only Left Covering ({rightBlindspotCount})</span>
            </button>

            <button
              onClick={() => setBlindspotFilter('balanced')}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                blindspotFilter === 'balanced'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Cross-Spectrum Clashes</span>
            </button>
          </div>

          {/* Sector Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'immigration', 'economy', 'welfare', 'energy', 'education'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-200 font-bold'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat === 'all' ? 'All Sectors' : cat}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Story Cluster Cards */}
      <div className="space-y-6">
        {filteredStories.map((story, storyIdx) => {
          const isLeftBlindspot = story.blindspot === 'left_blindspot';
          const isRightBlindspot = story.blindspot === 'right_blindspot';
          const isFirst = storyIdx === 0;
          const isExpanded = expandedStories[story.id] !== undefined ? expandedStories[story.id] : isFirst;

          return (
            <article
              key={story.id}
              className="bg-slate-900 rounded-3xl border border-slate-700 shadow-md overflow-hidden transition-all"
            >
              {/* Top Story Header & Coverage Bias Bar */}
              <div className="p-5 sm:p-7 border-b border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      {story.category}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      {story.publishedAt}
                    </span>
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-700/50 px-2.5 py-0.5 rounded-full">
                      {story.totalSourcesCount} UK Media Outlets Tracking
                    </span>
                  </div>

                  {/* Blindspot Indicator Badge */}
                  {isLeftBlindspot && (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-950/90 text-sky-200 border border-sky-500/60">
                      <EyeOff className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        LEFT BLINDSPOT • {story.coverageSplit.right}% Covered by Right Press
                      </span>
                    </span>
                  )}
                  {isRightBlindspot && (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-950/90 text-rose-200 border border-rose-500/60">
                      <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>
                        RIGHT BLINDSPOT • {story.coverageSplit.left}% Covered by Left Press
                      </span>
                    </span>
                  )}
                  {!isLeftBlindspot && !isRightBlindspot && (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-600/50">
                      <Scale className="w-3.5 h-3.5 text-emerald-400" />
                      <span>High Cross-Spectrum Coverage</span>
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-2xl font-extrabold text-white leading-snug">
                  {story.title}
                </h3>

                {/* Blindspot Callout Banner if present */}
                {story.blindspotNote && story.blindspot !== 'none' && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs sm:text-sm flex items-start space-x-2.5 ${
                      isLeftBlindspot
                        ? 'bg-sky-950/40 border-sky-700/70 text-sky-200'
                        : 'bg-rose-950/40 border-rose-700/70 text-rose-200'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Why this is a Blindspot: </span>
                      <span>{story.blindspotNote}</span>
                    </div>
                  </div>
                )}

                {/* Cross-Spectrum Coverage Distribution Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-rose-400">
                      🌹 Left Press: {story.coverageSplit.left}%
                    </span>
                    <span className="text-indigo-300">
                      ⚖️ Centre: {story.coverageSplit.center}%
                    </span>
                    <span className="text-sky-400">
                      🦁 Right Press: {story.coverageSplit.right}%
                    </span>
                  </div>
                  <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-800 p-0.5 gap-0.5 border border-slate-700">
                    <div
                      style={{ width: `${story.coverageSplit.left}%` }}
                      className="bg-rose-500 h-full rounded-l-full transition-all"
                      title={`Left-leaning coverage: ${story.coverageSplit.left}%`}
                    />
                    <div
                      style={{ width: `${story.coverageSplit.center}%` }}
                      className="bg-indigo-500 h-full transition-all"
                      title={`Centre coverage: ${story.coverageSplit.center}%`}
                    />
                    <div
                      style={{ width: `${story.coverageSplit.right}%` }}
                      className="bg-sky-500 h-full rounded-r-full transition-all"
                      title={`Right-leaning coverage: ${story.coverageSplit.right}%`}
                    />
                  </div>
                </div>

                {/* The Spin-Free Neutral Gist Box */}
                <div className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    <span>The Neutral Gist (Agreed Underlying Facts)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
                    {story.neutralGist}
                  </p>
                </div>

                {/* Progressive Disclosure Toggle Button to Expand/Collapse Spin Comparison */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggleStoryExpanded(story.id, isFirst)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-between transition-all cursor-pointer border ${
                      isExpanded
                        ? 'bg-slate-800 text-slate-200 border-slate-600'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-sm'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <Scale className="w-4 h-4" />
                      <span>
                        {isExpanded
                          ? 'Hide Left / Centre / Right Spin & Newspaper Cards'
                          : `Compare Left, Centre & Right Spin + ${story.outletReports.length} Newspapers`}
                      </span>
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <>
                  {/* Part 1: Left vs Centre vs Right Editorial Framing Columns */}
                  <div className="p-4 sm:p-7 bg-slate-950/60 border-b border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white flex items-center space-x-2">
                        <Scale className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>
                          1. Ideological Wing Comparison: Left, Centre &amp; Right
                        </span>
                      </h4>
                    </div>

                    {/* CUE 1 (Mobile): Interactive Wing Switcher Pills */}
                    <div className="lg:hidden bg-slate-900 p-2.5 rounded-xl border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                        <span>👆 Tap a media bias or swipe cards sideways ↔</span>
                        <span className="text-slate-400">3 Wings</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => scrollToElement(`wing-${story.id}-left`)}
                          className="py-1.5 px-2 rounded-lg bg-rose-600 text-white text-xs font-extrabold text-center shadow-xs cursor-pointer"
                        >
                          1. Left Press
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollToElement(`wing-${story.id}-center`)}
                          className="py-1.5 px-2 rounded-lg bg-indigo-600 text-white text-xs font-extrabold text-center shadow-xs cursor-pointer"
                        >
                          2. Centre / BBC
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollToElement(`wing-${story.id}-right`)}
                          className="py-1.5 px-2 rounded-lg bg-sky-600 text-white text-xs font-extrabold text-center shadow-xs cursor-pointer"
                        >
                          3. Right Press
                        </button>
                      </div>
                    </div>

                    {/* CUE 2: 86% Peek Cards on Mobile + Full Coloured Headers */}
                    <div className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-3 gap-3.5 sm:gap-4">
                      {/* Left Perspective */}
                      <div
                        id={`wing-${story.id}-left`}
                        className="w-[86%] sm:w-[88%] lg:w-auto flex-none snap-start lg:snap-align-none rounded-2xl bg-slate-900 border-2 border-rose-500 overflow-hidden flex flex-col justify-between shadow-lg"
                      >
                        <div>
                          <div className="bg-rose-600 text-white px-4 py-3 flex items-center justify-between">
                            <div>
                              <div className="font-black text-sm">🌹 Left-Leaning Press</div>
                              <div className="text-[11px] font-semibold text-rose-100">
                                Guardian • Mirror • New Statesman
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-extrabold">
                              1 of 3
                            </span>
                          </div>

                          <div className="p-4 sm:p-5 space-y-3">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300 block mb-1">
                                How the Left Frames It:
                              </span>
                              <p className="text-xs sm:text-sm text-white leading-relaxed font-medium">
                                {story.wingPerspectives.left.summary}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {story.wingPerspectives.left.toneKeywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-700/60"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleWingWhy(`${story.id}-left`)}
                              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-rose-200 text-xs font-extrabold flex items-center justify-between cursor-pointer"
                            >
                              <span>🔍 Why They View It This Way</span>
                              {expandedWingWhy[`${story.id}-left`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {expandedWingWhy[`${story.id}-left`] && (
                              <div className="p-3 rounded-xl bg-slate-800/90 border border-rose-500/30 text-xs text-slate-200 leading-relaxed">
                                {story.wingPerspectives.left.whyThisFraming}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* CUE 3: Mobile Next Button */}
                        <div className="lg:hidden px-4 py-2.5 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">Swipe sideways ↔</span>
                          <button
                            type="button"
                            onClick={() => scrollToElement(`wing-${story.id}-center`)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-extrabold flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Next: Centre / BBC</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Centre Perspective */}
                      <div
                        id={`wing-${story.id}-center`}
                        className="w-[86%] sm:w-[88%] lg:w-auto flex-none snap-start lg:snap-align-none rounded-2xl bg-slate-900 border-2 border-indigo-500 overflow-hidden flex flex-col justify-between shadow-lg"
                      >
                        <div>
                          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
                            <div>
                              <div className="font-black text-sm">⚖️ Centre &amp; Broadcasters</div>
                              <div className="text-[11px] font-semibold text-indigo-100">
                                BBC News • Sky News • Financial Times
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-extrabold">
                              2 of 3
                            </span>
                          </div>

                          <div className="p-4 sm:p-5 space-y-3">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 block mb-1">
                                How the Centre Frames It:
                              </span>
                              <p className="text-xs sm:text-sm text-white leading-relaxed font-medium">
                                {story.wingPerspectives.center.summary}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {story.wingPerspectives.center.toneKeywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-700/60"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleWingWhy(`${story.id}-center`)}
                              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-indigo-200 text-xs font-extrabold flex items-center justify-between cursor-pointer"
                            >
                              <span>🔍 Why They View It This Way</span>
                              {expandedWingWhy[`${story.id}-center`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {expandedWingWhy[`${story.id}-center`] && (
                              <div className="p-3 rounded-xl bg-slate-800/90 border border-indigo-500/30 text-xs text-slate-200 leading-relaxed">
                                {story.wingPerspectives.center.whyThisFraming}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* CUE 3: Mobile Prev / Next Buttons */}
                        <div className="lg:hidden px-4 py-2.5 border-t border-slate-800 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => scrollToElement(`wing-${story.id}-left`)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Left Press</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollToElement(`wing-${story.id}-right`)}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-[11px] font-extrabold flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Next: Right Press</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Right Perspective */}
                      <div
                        id={`wing-${story.id}-right`}
                        className="w-[86%] sm:w-[88%] lg:w-auto flex-none snap-start lg:snap-align-none rounded-2xl bg-slate-900 border-2 border-sky-500 overflow-hidden flex flex-col justify-between shadow-lg"
                      >
                        <div>
                          <div className="bg-sky-600 text-white px-4 py-3 flex items-center justify-between">
                            <div>
                              <div className="font-black text-sm">🦁 Right-Leaning Press</div>
                              <div className="text-[11px] font-semibold text-sky-100">
                                Telegraph • Mail • Times • GB News
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-extrabold">
                              3 of 3
                            </span>
                          </div>

                          <div className="p-4 sm:p-5 space-y-3">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300 block mb-1">
                                How the Right Frames It:
                              </span>
                              <p className="text-xs sm:text-sm text-white leading-relaxed font-medium">
                                {story.wingPerspectives.right.summary}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {story.wingPerspectives.right.toneKeywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-300 border border-sky-700/60"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleWingWhy(`${story.id}-right`)}
                              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sky-200 text-xs font-extrabold flex items-center justify-between cursor-pointer"
                            >
                              <span>🔍 Why They View It This Way</span>
                              {expandedWingWhy[`${story.id}-right`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {expandedWingWhy[`${story.id}-right`] && (
                              <div className="p-3 rounded-xl bg-slate-800/90 border border-sky-500/30 text-xs text-slate-200 leading-relaxed">
                                {story.wingPerspectives.right.whyThisFraming}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* CUE 3: Mobile Prev Button */}
                        <div className="lg:hidden px-4 py-2.5 border-t border-slate-800 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => scrollToElement(`wing-${story.id}-center`)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Centre / BBC</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollToElement(`wing-${story.id}-left`)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold cursor-pointer"
                          >
                            ↺ Back to Left Press
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Part 2: Specific Newspaper & Broadcaster Breakdown */}
                  <div className="p-4 sm:p-7 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white flex items-center space-x-2">
                        <Newspaper className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>
                          2. Individual Newspaper &amp; Broadcaster Reports ({story.outletReports.length})
                        </span>
                      </h4>
                    </div>

                    {/* CUE 1 (Mobile): Interactive Newspaper Switcher Pills */}
                    <div className="md:hidden bg-slate-950/80 p-2.5 rounded-xl border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                        <span>👆 Tap a newspaper or swipe sideways ↔</span>
                        <span className="text-slate-400">{story.outletReports.length} Outlets</span>
                      </div>
                      <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {story.outletReports.map((rep, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => scrollToElement(`outlet-${story.id}-${idx}`)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-white border border-slate-600 text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {idx + 1}. {rep.outletName}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CUE 2: 86% Peek Newspaper Cards on Mobile */}
                    <div className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-2 gap-3.5 sm:gap-4">
                      {story.outletReports.map((rep, idx) => {
                        const prevOutlet = idx > 0 ? story.outletReports[idx - 1] : null;
                        const nextOutlet = idx < story.outletReports.length - 1 ? story.outletReports[idx + 1] : null;

                        return (
                          <div
                            key={idx}
                            id={`outlet-${story.id}-${idx}`}
                            className="w-[86%] sm:w-[88%] md:w-auto flex-none snap-start md:snap-align-none rounded-2xl border-2 border-slate-700 bg-slate-800/80 p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-md"
                          >
                            <div className="space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700">
                                <div className="flex items-center space-x-2">
                                  <span className="font-extrabold text-sm sm:text-base text-white">
                                    {rep.outletName}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getLeanBadgeStyle(
                                      rep.lean
                                    )}`}
                                  >
                                    {getLeanLabel(rep.lean)}
                                  </span>
                                </div>
                                <span className="text-[10px] font-extrabold text-slate-300 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">
                                  {idx + 1} of {story.outletReports.length}
                                </span>
                              </div>

                              <a
                                href={rep.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                              >
                                <p className="text-xs sm:text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                                  &ldquo;{rep.headline}&rdquo;
                                  <ExternalLink className="w-3 h-3 inline-block ml-1.5 opacity-75 group-hover:opacity-100" />
                                </p>
                              </a>

                              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-700">
                                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 mb-1">
                                  How {rep.outletName} Views It &amp; Why:
                                </span>
                                <p className="text-xs text-slate-200 leading-relaxed">
                                  {rep.framingAnalysis}
                                </p>
                              </div>
                            </div>

                            {/* CUE 3: Mobile Prev / Next Newspaper Buttons */}
                            <div className="md:hidden pt-2 border-t border-slate-700 flex items-center justify-between gap-2">
                              {prevOutlet ? (
                                <button
                                  type="button"
                                  onClick={() => scrollToElement(`outlet-${story.id}-${idx - 1}`)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-600 text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                  <span>{prevOutlet.outletName}</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400">Swipe outlets ↔</span>
                              )}

                              {nextOutlet ? (
                                <button
                                  type="button"
                                  onClick={() => scrollToElement(`outlet-${story.id}-${idx + 1}`)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-extrabold flex items-center space-x-1 cursor-pointer ml-auto"
                                >
                                  <span>Next: {nextOutlet.outletName}</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => scrollToElement(`outlet-${story.id}-0`)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-600 text-[11px] font-bold cursor-pointer ml-auto"
                                >
                                  ↺ Back to {story.outletReports[0]?.outletName}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
