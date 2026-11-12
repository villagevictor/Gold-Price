import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  Moon,
  RotateCcw,
  Trash2,
  Bookmark,
  Copy,
  Check,
  Download,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Info,
  Layers,
  Sparkles,
  Equal
} from 'lucide-react';

interface CalculationState {
  valid: boolean;
  error?: string;
  A: number | null;
  B: number | null;
  G: number | null;
  C: number | null;
  D: number | null;
  E: number | null;
  F: number | null;
  H: number | null;
  stepC?: string;
  stepD?: string;
  stepE?: string;
  stepF?: string;
  stepH?: string;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  A: number;
  B: number;
  G: number;
  C: number;
  D: number;
  E: number;
  F: number;
  H: number;
}

const PRESETS = [
  { label: 'Default Benchmark', a: 100, b: 5, g: 12, desc: 'A=100, B=5, G=12' },
  { label: 'High Ratio Scale', a: 500, b: 2.5, g: 24, desc: 'A=500, B=2.5, G=24' },
  { label: 'Precision Decimals', a: 84.75, b: 3.25, g: 9.6, desc: 'A=84.75, B=3.25, G=9.6' },
  { label: 'Small Values', a: 25, b: 2, g: 4, desc: 'A=25, B=2, G=4' },
];

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calc_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Input states (strings to allow smooth typing like "-", "0.", empty)
  const [inputA, setInputA] = useState<string>('100');
  const [inputB, setInputB] = useState<string>('5');
  const [inputG, setInputG] = useState<string>('12');

  // Precision display mode: 4 (default), 2, 6, or 'full'
  const [precision, setPrecision] = useState<'2' | '4' | '6' | 'full'>('4');

  // View tabs / options
  const [showFlowGraph, setShowFlowGraph] = useState<boolean>(true);
  const [highlightNode, setHighlightNode] = useState<string | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('calc_history');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore parse error
      }
    }
    return [];
  });

  // Apply dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('calc_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('calc_theme', 'light');
    }
  }, [isDark]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('calc_history', JSON.stringify(history));
    } catch {
      // ignore storage quota errors
    }
  }, [history]);

  // Toast auto-hide
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Helper formatting function
  const formatNumber = (num: number | null | undefined, mode = precision): string => {
    if (num === null || num === undefined || !Number.isFinite(num)) return '—';
    if (mode === 'full') {
      return String(num);
    }
    const dec = parseInt(mode, 10);
    const factor = Math.pow(10, dec);
    const rounded = Math.round((num + Number.EPSILON) * factor) / factor;
    return rounded.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: dec,
    });
  };

  const formatRaw = (num: number | null | undefined, dec = 4): string => {
    if (num === null || num === undefined || !Number.isFinite(num)) return '—';
    const factor = Math.pow(10, dec);
    return String(Math.round((num + Number.EPSILON) * factor) / factor);
  };

  // Calculation pipeline
  const result: CalculationState = useMemo(() => {
    const rawA = inputA.trim();
    const rawB = inputB.trim();
    const rawG = inputG.trim();

    if (rawA === '' || rawB === '' || rawG === '') {
      return {
        valid: false,
        error: 'Please enter values for all three variables (A, B, and G)',
        A: null,
        B: null,
        G: null,
        C: null,
        D: null,
        E: null,
        F: null,
        H: null,
      };
    }

    const aNum = parseFloat(rawA);
    const bNum = parseFloat(rawB);
    const gNum = parseFloat(rawG);

    if (isNaN(aNum) || isNaN(bNum) || isNaN(gNum)) {
      return {
        valid: false,
        error: 'Please enter valid numeric values',
        A: null,
        B: null,
        G: null,
        C: null,
        D: null,
        E: null,
        F: null,
        H: null,
      };
    }

    // Edge Case: B === 0
    if (bNum === 0) {
      return {
        valid: false,
        error: 'Division by zero: Variable B cannot be 0 because C = A / B is undefined.',
        A: aNum,
        B: bNum,
        G: gNum,
        C: null,
        D: null,
        E: null,
        F: null,
        H: null,
        stepC: `${formatRaw(aNum)} / 0 = Undefined`,
      };
    }

    // Step 1: C = A / B
    const C = aNum / bNum;
    const stepC = `${formatRaw(aNum)} / ${formatRaw(bNum)} = ${formatRaw(C)}`;

    // Step 2: D = C - 10.51
    const D = C - 10.51;
    const stepD = `${formatRaw(C)} - 10.51 = ${formatRaw(D)}`;

    // Step 3: E = D * 52.838
    const E = D * 52.838;
    const stepE = `${formatRaw(D)} * 52.838 = ${formatRaw(E)}`;

    // Edge Case: C === 0 (when A === 0)
    if (C === 0) {
      return {
        valid: false,
        error: 'Division by zero: Since A = 0, C is 0. Therefore Step 4 (F = E / C) divides by zero.',
        A: aNum,
        B: bNum,
        G: gNum,
        C,
        D,
        E,
        F: null,
        H: null,
        stepC,
        stepD,
        stepE,
        stepF: `${formatRaw(E)} / 0 = Undefined`,
      };
    }

    // Step 4: F = E / C
    const F = E / C;
    const stepF = `${formatRaw(E)} / ${formatRaw(C)} = ${formatRaw(F)}`;

    // Step 5: H = (F * A * G) / 24
    const H = (F * aNum * gNum) / 24;
    const stepH = `(${formatRaw(F)} * ${formatRaw(aNum)} * ${formatRaw(gNum)}) / 24 = ${formatRaw(H)}`;

    return {
      valid: true,
      A: aNum,
      B: bNum,
      G: gNum,
      C,
      D,
      E,
      F,
      H,
      stepC,
      stepD,
      stepE,
      stepF,
      stepH,
    };
  }, [inputA, inputB, inputG]);

  // Copy to clipboard helper
  const copyText = (text: string, label: string, keyName?: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      if (keyName) {
        setCopiedKey(keyName);
        setTimeout(() => setCopiedKey(null), 1500);
      }
      showToast(label);
    } catch {
      showToast('Unable to copy to clipboard');
    }
  };

  const copyResultValue = (key: 'A' | 'B' | 'G' | 'C' | 'D' | 'E' | 'F' | 'H') => {
    const val = result[key];
    if (val === null || val === undefined || !Number.isFinite(val)) {
      showToast(`No valid value for ${key} to copy`);
      return;
    }
    copyText(String(val), `Copied ${key} = ${val}`, key);
  };

  const copyAllSummary = () => {
    if (!result.valid) {
      showToast('No complete calculation to copy');
      return;
    }
    const summary = `Chained Formula Calculation:
Inputs:
  A = ${result.A}
  B = ${result.B}
  G = ${result.G}

Calculations:
  Step 1: C = A / B = ${result.C}
  Step 2: D = C - 10.51 = ${result.D}
  Step 3: E = D * 52.838 = ${result.E}
  Step 4: F = E / C = ${result.F}
  Step 5: H = (F * A * G) / 24 = ${result.H}`;

    copyText(summary, 'Copied full calculation pipeline to clipboard');
  };

  const saveCalculation = () => {
    if (!result.valid || result.A === null || result.B === null || result.G === null ||
        result.C === null || result.D === null || result.E === null || result.F === null || result.H === null) {
      showToast('Cannot save incomplete or invalid calculation');
      return;
    }

    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      A: result.A,
      B: result.B,
      G: result.G,
      C: result.C,
      D: result.D,
      E: result.E,
      F: result.F,
      H: result.H,
    };

    setHistory((prev) => [newItem, ...prev]);
    showToast('Calculation snapshot saved to history');
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setInputA(String(item.A));
    setInputB(String(item.B));
    setInputG(String(item.G));
    showToast(`Loaded calculation (A=${item.A}, B=${item.B}, G=${item.G})`);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('Removed calculation from history');
  };

  const clearHistory = () => {
    setHistory([]);
    showToast('Calculation history cleared');
  };

  const exportCSV = () => {
    if (history.length === 0) {
      showToast('History is empty. Nothing to export.');
      return;
    }
    const headers = ['Timestamp', 'A', 'B', 'G', 'C (A/B)', 'D (C-10.51)', 'E (D*52.838)', 'F (E/C)', 'H ((F*A*G)/24)'];
    const rows = history.map((r) => [
      `"${r.timestamp}"`,
      r.A,
      r.B,
      r.G,
      r.C,
      r.D,
      r.E,
      r.F,
      r.H,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chained_calculations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported calculation history to CSV');
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setInputA(String(preset.a));
    setInputB(String(preset.b));
    setInputG(String(preset.g));
    showToast(`Applied preset: ${preset.label}`);
  };

  const resetDefault = () => {
    setInputA('100');
    setInputB('5');
    setInputG('12');
    showToast('Reset to default values (A=100, B=5, G=12)');
  };

  const clearAll = () => {
    setInputA('');
    setInputB('');
    setInputG('');
    showToast('Cleared all inputs');
  };

  // Adjust input by delta
  const nudgeInput = (setter: React.Dispatch<React.SetStateAction<string>>, current: string, delta: number) => {
    const val = parseFloat(current) || 0;
    const next = Math.round((val + delta) * 1000) / 1000;
    setter(String(next));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-indigo-500 selection:text-white pb-16">
      
      {/* Toast Notification */}
      <div
        className={`fixed bottom-5 right-5 z-50 transform transition-all duration-300 pointer-events-none ${
          toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}
      >
        <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700/60 flex items-center gap-2.5 text-sm font-medium">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-2 border border-indigo-200/60 dark:border-indigo-800/60">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Real-Time Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Chained Formula Calculator</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-1">
              Instant dependent calculation pipeline for variables{' '}
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">A</span>,{' '}
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">B</span>, and{' '}
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">G</span>.
            </p>
          </div>

          {/* Action buttons & Theme Toggle */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            {/* Precision Selector */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs font-medium">
              <span className="px-2 text-slate-400 font-mono hidden sm:inline">Decimals:</span>
              {(['2', '4', '6', 'full'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPrecision(mode)}
                  className={`px-2.5 py-1 rounded-lg font-mono transition-colors ${
                    precision === mode
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={mode === 'full' ? 'Display full floating-point precision' : `${mode} decimal places`}
                >
                  {mode === 'full' ? 'Full' : `.${mode}`}
                </button>
              ))}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDark((d) => !d)}
              type="button"
              aria-label="Toggle Dark Mode"
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>
        </header>

        {/* Input Variables Section */}
        <section className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Input Variables</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Modify A, B, or G below — all dependent outputs update instantly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={resetDefault}
                type="button"
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Default
              </button>
              <button
                onClick={clearAll}
                type="button"
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={saveCalculation}
                type="button"
                disabled={!result.valid}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xs shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                Save Calculation
              </button>
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="mb-6 flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/70">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium mr-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Presets:
            </span>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                title={preset.desc}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Variable A */}
            <div className="relative group">
              <label
                htmlFor="inputA"
                className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">
                    A
                  </span>
                  Variable A
                </span>
                <span className="text-xs text-slate-400 font-mono">e.g. 100</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  id="inputA"
                  value={inputA}
                  onChange={(e) => setInputA(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Feeds into: <strong className="text-slate-600 dark:text-slate-300 font-mono">C</strong> & <strong className="text-slate-600 dark:text-slate-300 font-mono">H</strong></span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => nudgeInput(setInputA, inputA, -10)}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono"
                    title="-10"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeInput(setInputA, inputA, 10)}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono"
                    title="+10"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>

            {/* Variable B */}
            <div className="relative group">
              <label
                htmlFor="inputB"
                className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">
                    B
                  </span>
                  Variable B
                </span>
                <span className="text-xs text-slate-400 font-mono">Non-zero (e.g. 5)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  id="inputB"
                  value={inputB}
                  onChange={(e) => setInputB(e.target.value)}
                  placeholder="e.g. 5"
                  className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border ${
                    parseFloat(inputB) === 0
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                  } text-slate-900 dark:text-white font-mono text-lg focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Feeds into: <strong className="text-slate-600 dark:text-slate-300 font-mono">C</strong> divisor</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => nudgeInput(setInputB, inputB, -1)}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono"
                    title="-1"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeInput(setInputB, inputB, 1)}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono"
                    title="+1"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>

            {/* Variable G */}
            <div className="relative group">
              <label
                htmlFor="inputG"
                className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">
                    G
                  </span>
                  Variable G
                </span>
                <span className="text-xs text-slate-400 font-mono">e.g. 12</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  id="inputG"
                  value={inputG}
                  onChange={(e) => setInputG(e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Feeds into: <strong className="text-slate-600 dark:text-slate-300 font-mono">H</strong> final multiplier</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => nudgeInput(setInputG, inputG, -1)}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono"
                    title="-1"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeInput(setInputG, inputG, 1)}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono"
                    title="+1"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Warning Banner for edge cases */}
          {result.error && (
            <div className="mt-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{result.error}</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Check your inputs to ensure all variables are defined and denominators are non-zero.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Visual Pipeline Graph Toggle & Component */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setShowFlowGraph((v) => !v)}
              className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
            >
              <GitBranch className="w-4 h-4 text-indigo-500" />
              <span>{showFlowGraph ? 'Hide' : 'Show'} Formula Flowchart</span>
            </button>
            <span className="text-xs text-slate-400">Hover any step below to trace dependencies</span>
          </div>

          {showFlowGraph && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs overflow-x-auto">
              <div className="min-w-[680px] flex items-center justify-between py-2 text-xs">
                
                {/* Inputs Node */}
                <div className="flex flex-col gap-2">
                  <div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-mono text-center">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">A = {formatNumber(result.A)}</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-mono text-center">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">B = {formatNumber(result.B)}</span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-1" />

                {/* Step 1: C */}
                <div
                  onMouseEnter={() => setHighlightNode('C')}
                  onMouseLeave={() => setHighlightNode(null)}
                  className={`px-4 py-3 rounded-xl border transition-all cursor-pointer font-mono text-center ${
                    highlightNode === 'C'
                      ? 'bg-blue-100 dark:bg-blue-900/60 border-blue-400 ring-2 ring-blue-400'
                      : 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Step 1</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">C = A / B</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">
                    {formatNumber(result.C)}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-1" />

                {/* Step 2: D */}
                <div
                  onMouseEnter={() => setHighlightNode('D')}
                  onMouseLeave={() => setHighlightNode(null)}
                  className={`px-4 py-3 rounded-xl border transition-all cursor-pointer font-mono text-center ${
                    highlightNode === 'D'
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-400 ring-2 ring-emerald-400'
                      : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Step 2</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">D = C - 10.51</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                    {formatNumber(result.D)}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-1" />

                {/* Step 3: E */}
                <div
                  onMouseEnter={() => setHighlightNode('E')}
                  onMouseLeave={() => setHighlightNode(null)}
                  className={`px-4 py-3 rounded-xl border transition-all cursor-pointer font-mono text-center ${
                    highlightNode === 'E'
                      ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-400 ring-2 ring-amber-400'
                      : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Step 3</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">E = D * 52.838</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5">
                    {formatNumber(result.E)}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-1" />

                {/* Step 4: F */}
                <div
                  onMouseEnter={() => setHighlightNode('F')}
                  onMouseLeave={() => setHighlightNode(null)}
                  className={`px-4 py-3 rounded-xl border transition-all cursor-pointer font-mono text-center ${
                    highlightNode === 'F'
                      ? 'bg-purple-100 dark:bg-purple-900/60 border-purple-400 ring-2 ring-purple-400'
                      : 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Step 4</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">F = E / C</div>
                  <div className="font-bold text-purple-600 dark:text-purple-400 text-sm mt-0.5">
                    {formatNumber(result.F)}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-1" />

                {/* Step 5: H */}
                <div
                  onMouseEnter={() => setHighlightNode('H')}
                  onMouseLeave={() => setHighlightNode(null)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all cursor-pointer font-mono text-center shadow-xs ${
                    highlightNode === 'H'
                      ? 'bg-indigo-100 dark:bg-indigo-900/80 border-indigo-500 ring-2 ring-indigo-400'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Result H</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">(F * A * G) / 24</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 text-base mt-0.5">
                    {formatNumber(result.H)}
                  </div>
                </div>

              </div>
            </div>
          )}
        </section>

        {/* Calculated Results Grid (C, D, E, F, and H) */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span>Calculated Pipeline</span>
            </h2>
            <button
              onClick={copyAllSummary}
              type="button"
              className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Copy All Results
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Card C: C = A / B */}
            <div
              onMouseEnter={() => setHighlightNode('C')}
              onMouseLeave={() => setHighlightNode(null)}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                highlightNode === 'C' ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/20' : 'border-slate-200 dark:border-slate-800'
              } p-6 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-mono font-bold text-sm flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
                      C
                    </span>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                        Step 1
                      </span>
                      <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                        C = A / B
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyResultValue('C')}
                    title="Copy C full precision value"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'C' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div
                  title={result.C !== null ? `Full precision: ${result.C}` : 'Undefined'}
                  className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight my-2 break-all cursor-help ${
                    result.B === 0
                      ? 'text-rose-500 text-lg sm:text-xl'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {result.B === 0 ? 'Cannot divide by 0' : formatNumber(result.C)}
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 break-all">
                  {result.stepC || 'Waiting for valid A and B'}
                </p>
              </div>
            </div>

            {/* Card D: D = C - 10.51 */}
            <div
              onMouseEnter={() => setHighlightNode('D')}
              onMouseLeave={() => setHighlightNode(null)}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                highlightNode === 'D' ? 'border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-400/20' : 'border-slate-200 dark:border-slate-800'
              } p-6 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
                      D
                    </span>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                        Step 2
                      </span>
                      <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                        D = C - 10.51
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyResultValue('D')}
                    title="Copy D full precision value"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'D' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div
                  title={result.D !== null ? `Full precision: ${result.D}` : 'Waiting for C'}
                  className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight my-2 break-all cursor-help"
                >
                  {formatNumber(result.D)}
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 break-all">
                  {result.stepD || 'Waiting for valid C'}
                </p>
              </div>
            </div>

            {/* Card E: E = D * 52.838 */}
            <div
              onMouseEnter={() => setHighlightNode('E')}
              onMouseLeave={() => setHighlightNode(null)}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                highlightNode === 'E' ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20' : 'border-slate-200 dark:border-slate-800'
              } p-6 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 font-mono font-bold text-sm flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
                      E
                    </span>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                        Step 3
                      </span>
                      <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                        E = D * 52.838
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyResultValue('E')}
                    title="Copy E full precision value"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'E' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div
                  title={result.E !== null ? `Full precision: ${result.E}` : 'Waiting for D'}
                  className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight my-2 break-all cursor-help"
                >
                  {formatNumber(result.E)}
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 break-all">
                  {result.stepE || 'Waiting for valid D'}
                </p>
              </div>
            </div>

            {/* Card F: F = E / C */}
            <div
              onMouseEnter={() => setHighlightNode('F')}
              onMouseLeave={() => setHighlightNode(null)}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                highlightNode === 'F' ? 'border-purple-400 dark:border-purple-500 ring-2 ring-purple-400/20' : 'border-slate-200 dark:border-slate-800'
              } p-6 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 font-mono font-bold text-sm flex items-center justify-center border border-purple-200/60 dark:border-purple-800/60">
                      F
                    </span>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                        Step 4
                      </span>
                      <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                        F = E / C
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyResultValue('F')}
                    title="Copy F full precision value"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'F' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div
                  title={result.F !== null ? `Full precision: ${result.F}` : 'Waiting for E and C'}
                  className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight my-2 break-all cursor-help ${
                    result.C === 0 ? 'text-rose-500 text-lg sm:text-xl' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {result.C === 0 ? 'Cannot divide by 0 (C=0)' : formatNumber(result.F)}
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 break-all">
                  {result.stepF || 'Waiting for valid E and C'}
                </p>
              </div>
            </div>

            {/* Card H: H = (F * A * G) / 24 */}
            <div
              onMouseEnter={() => setHighlightNode('H')}
              onMouseLeave={() => setHighlightNode(null)}
              className="sm:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-300 dark:border-indigo-800/80 p-6 sm:p-7 shadow-md ring-1 ring-indigo-500/10 hover:border-indigo-500 dark:hover:border-indigo-600 transition-all flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl shadow-xs">
                Final Result
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-mono font-bold text-base flex items-center justify-center shadow-xs">
                      H
                    </span>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        Step 5
                      </span>
                      <span className="font-mono text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
                        H = (F * A * G) / 24
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyResultValue('H')}
                    title="Copy H full precision value"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mt-3 sm:mt-0"
                  >
                    {copiedKey === 'H' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div
                  title={result.H !== null ? `Full precision: ${result.H}` : 'Waiting for F'}
                  className="text-3xl sm:text-4xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tracking-tight my-2 break-all cursor-help"
                >
                  {formatNumber(result.H)}
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 break-all">
                  {result.stepH || 'Waiting for valid F, A, and G'}
                </p>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 inline" /> Hover value for full precision
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* Saved Calculations History Log */}
        <section className="mt-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-500" />
                <span>Saved Calculations ({history.length})</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Snapshot history of your recorded formula runs (stored locally in browser).
              </p>
            </div>
            {history.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={exportCSV}
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  onClick={clearHistory}
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                >
                  Clear Log
                </button>
              </div>
            )}
          </div>

          {/* Empty State */}
          {history.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No calculations saved yet. Click{' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  "Save Calculation"
                </span>{' '}
                above to record a snapshot.
              </p>
            </div>
          ) : (
            /* Responsive History Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-2.5">Time</th>
                    <th className="py-3 px-2.5">A</th>
                    <th className="py-3 px-2.5">B</th>
                    <th className="py-3 px-2.5">G</th>
                    <th className="py-3 px-2.5">C</th>
                    <th className="py-3 px-2.5">D</th>
                    <th className="py-3 px-2.5">E</th>
                    <th className="py-3 px-2.5">F</th>
                    <th className="py-3 px-2.5 text-indigo-600 dark:text-indigo-400">H</th>
                    <th className="py-3 px-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-xs sm:text-sm">
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-2.5 font-sans text-xs text-slate-400 whitespace-nowrap">
                        {item.timestamp}
                      </td>
                      <td className="py-3 px-2.5 text-slate-700 dark:text-slate-300">{formatRaw(item.A)}</td>
                      <td className="py-3 px-2.5 text-slate-700 dark:text-slate-300">{formatRaw(item.B)}</td>
                      <td className="py-3 px-2.5 text-slate-700 dark:text-slate-300">{formatRaw(item.G)}</td>
                      <td className="py-3 px-2.5 text-slate-600 dark:text-slate-400" title={String(item.C)}>
                        {formatRaw(item.C)}
                      </td>
                      <td className="py-3 px-2.5 text-slate-600 dark:text-slate-400" title={String(item.D)}>
                        {formatRaw(item.D)}
                      </td>
                      <td className="py-3 px-2.5 text-slate-600 dark:text-slate-400" title={String(item.E)}>
                        {formatRaw(item.E)}
                      </td>
                      <td className="py-3 px-2.5 text-slate-600 dark:text-slate-400" title={String(item.F)}>
                        {formatRaw(item.F)}
                      </td>
                      <td
                        className="py-3 px-2.5 font-semibold text-indigo-600 dark:text-indigo-400"
                        title={String(item.H)}
                      >
                        {formatRaw(item.H)}
                      </td>
                      <td className="py-3 px-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => loadHistoryItem(item)}
                          className="text-xs font-sans font-medium text-indigo-600 dark:text-indigo-400 hover:underline mr-3 cursor-pointer"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHistoryItem(item.id)}
                          className="text-xs font-sans font-medium text-rose-500 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Formula Reference Explainer Section */}
        <section className="mt-8 p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
          <h3 className="text-sm font-semibold text-indigo-950 dark:text-indigo-200 mb-2 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Mathematical Formula Pipeline Reference
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-xs font-mono">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Step 1</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">C = A / B</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Step 2</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">D = C - 10.51</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Step 3</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">E = D * 52.838</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Step 4</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">F = E / C</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 sm:col-span-2 md:col-span-1">
              <span className="text-[10px] text-slate-400 block mb-1">Step 5 (Final)</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">H = (F * A * G) / 24</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
