
import React, { useState, useRef, useEffect } from 'react';
import { GameState, GameData, ChatMessage, AdventureTurn, CharacterStats, CustomWorldSettings } from './types.ts';
import { GeminiService } from './services/geminiService.ts';
import { 
  Backpack, 
  Map as MapIcon, 
  Sword, 
  Sparkles, 
  MessageSquare, 
  Send, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Save,
  RotateCcw,
  X,
  History,
  Skull,
  Star,
  Zap,
  Navigation,
  Heart,
  Shield,
  Zap as AgiIcon,
  Brain,
  Edit3,
  Trophy,
  ScrollText,
  Globe,
  User,
  Ghost
} from 'lucide-react';

const GENRES = [
  "Темное фэнтези", 
  "Киберпанк детектив", 
  "Галактическая космоопера", 
  "Готические ужасы"
];

const SAVE_KEY = 'infinite_adventure_save_v4';

const TypewriterText: React.FC<{ text: string, speed?: number }> = ({ text, speed = 10 }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i += 1;
      if (i > text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <span>{displayedText}</span>;
};

const WorldMap: React.FC<{ history: AdventureTurn[], currentChoices: string[], threatLevel: number, onClose: () => void }> = ({ history, currentChoices, threatLevel, onClose }) => {
  const getLocTypeName = (type: string) => {
    switch(type) {
      case 'threat': return 'УГРОЗА';
      case 'poi': return 'ИНТЕРЕС';
      default: return 'НЕЙТРАЛЬНО';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-500">
      <div className="w-full h-full bg-slate-900/40 rounded-[3rem] border border-indigo-500/10 relative overflow-hidden flex flex-col p-8 md:p-12 shadow-2xl">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all hover:rotate-90 z-50">
          <X size={40} />
        </button>
        <div className="mb-12 relative z-10">
          <h2 className="text-5xl font-fantasy text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-6">
            <Navigation size={48} className="text-indigo-500" /> КАРТОГРАФИЯ РЕАЛЬНОСТИ
          </h2>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center justify-start gap-16 px-16 pb-12 scrollbar-none relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:40px_40px]" />
          {history.map((turn, i) => {
            const isLast = i === history.length - 1;
            const isThreat = turn.locationType === 'threat';
            return (
              <div key={i} className="flex-shrink-0 flex flex-col items-center group relative">
                {i < history.length - 1 && <div className="absolute left-[50%] top-8 w-[calc(4rem+4rem)] h-[3px] bg-gradient-to-r from-indigo-500/40 via-indigo-500/20 to-transparent" />}
                <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-700 relative z-10 
                  ${isLast ? 'bg-indigo-600 border-indigo-300 shadow-[0_0_40px_rgba(99,102,241,0.5)] scale-125' : 'bg-slate-800 border-slate-700'}`}>
                  {isThreat ? <Skull size={24} className="text-red-400" /> : turn.locationType === 'poi' ? <Star size={24} className="text-amber-300" /> : <span className="text-lg font-bold">{i + 1}</span>}
                </div>
                <div className="mt-8 text-center w-56">
                  <div className="text-indigo-200 font-bold text-lg font-fantasy">{turn.locationName}</div>
                  <div className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em]">{getLocTypeName(turn.locationType)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-auto flex justify-between items-end border-t border-slate-800/50 pt-8">
          <div className="max-w-md w-full">
            <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap size={14}/> Анализ угрозы</h4>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" style={{ width: `${(threatLevel || 0) * 10}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsBar: React.FC<{ stats: CharacterStats }> = ({ stats }) => (
  <div className="flex gap-6 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-800 shadow-xl items-center">
    <div className="flex items-center gap-2">
      <Heart size={16} className="text-red-500" />
      <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
        <div className="h-full bg-red-500 transition-all" style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }} />
      </div>
      <span className="text-[10px] font-bold">{stats.hp}/{stats.maxHp}</span>
    </div>
    <div className="flex gap-4 border-l border-slate-800 pl-6">
      <div className="flex items-center gap-1.5" title="Сила"><Shield size={14} className="text-indigo-400" /><span className="text-xs font-bold">{stats.str} СИЛ</span></div>
      <div className="flex items-center gap-1.5" title="Ловкость"><AgiIcon size={14} className="text-green-400" /><span className="text-xs font-bold">{stats.agi} ЛОВ</span></div>
      <div className="flex items-center gap-1.5" title="Интеллект"><Brain size={14} className="text-amber-400" /><span className="text-xs font-bold">{stats.int} ИНТ</span></div>
    </div>
    <div className="border-l border-slate-800 pl-6 text-[10px] font-black tracking-widest text-indigo-500 uppercase">УРОВЕНЬ {stats.level}</div>
  </div>
);

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isTextLoading, setIsTextLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  
  const [customSettings, setCustomSettings] = useState<CustomWorldSettings>({
    worldDesc: '',
    heroDesc: '',
    weaponDesc: '',
    villainDesc: ''
  });

  const [isCustomChoiceMode, setIsCustomChoiceMode] = useState(false);
  const [customChoiceValue, setCustomChoiceValue] = useState('');
  
  const [gameData, setGameData] = useState<GameData>({
    history: [],
    currentTurn: null,
    genre: '',
    characterDescription: '',
    currentImage: null,
    stats: { hp: 100, maxHp: 100, str: 10, agi: 10, int: 10, level: 1, exp: 0 }
  });
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentChatInput, setCurrentChatInput] = useState('');
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [hasSave, setHasSave] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const customChoiceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setHasSave(!!localStorage.getItem(SAVE_KEY)); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  useEffect(() => {
    if (isCustomChoiceMode) {
      setTimeout(() => customChoiceInputRef.current?.focus(), 100);
    }
  }, [isCustomChoiceMode]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const saveGame = () => {
    if (!gameData.currentTurn) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ gameData, chatMessages }));
    setHasSave(true);
    showNotification("Прогресс сохранен");
  };

  const loadGame = () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return;
    try {
      const { gameData: ld, chatMessages: cm } = JSON.parse(saved);
      setGameData(ld);
      setChatMessages(cm);
      setGameState(ld.currentTurn?.locationType === 'threat' ? GameState.COMBAT : GameState.PLAYING);
      showNotification("Мир восстановлен");
    } catch (e) { showNotification("Ошибка загрузки"); }
  };

  const initSetup = (genre: string) => {
    setSelectedGenre(genre);
    setGameState(GameState.SETUP);
  };

  const startGame = async () => {
    setGameState(GameState.LOADING);
    setIsImageLoading(true);
    try {
      const { turn, characterDescription, stats } = await GeminiService.initializeCharacter(selectedGenre, customSettings);
      setGameData({
        genre: selectedGenre,
        characterDescription,
        currentTurn: turn,
        history: [turn],
        currentImage: null,
        stats
      });
      setGameState(turn.locationType === 'threat' ? GameState.COMBAT : GameState.PLAYING);
      
      try {
        const img = await GeminiService.generateImage(turn.imagePrompt);
        setGameData(p => ({ ...p, currentImage: img }));
      } catch (e) {
        console.warn("Image gen skipped for stability");
      }
      setIsImageLoading(false);
    } catch (e) { 
      setGameState(GameState.ERROR); 
    }
  };

  const makeChoice = async (choice: string, index: number | 'custom') => {
    if (isTextLoading || !choice.trim()) return;
    setSelectedChoiceIdx(index === 'custom' ? 999 : index);
    setIsTextLoading(true);
    setIsImageLoading(true);
    
    try {
      const isCombatMove = gameState === GameState.COMBAT;
      
      const { turn: nextTurn, updatedStats } = await GeminiService.generateNextTurn(
        gameData.genre, 
        gameData.history, 
        choice, 
        gameData.characterDescription,
        gameData.stats,
        isCombatMove
      );

      setGameData(prev => ({
        ...prev,
        currentTurn: nextTurn,
        history: [...prev.history, nextTurn],
        stats: updatedStats
      }));
      
      if (updatedStats.hp <= 0) {
        setGameState(GameState.GAMEOVER);
      } else {
        setGameState(nextTurn.locationType === 'threat' ? GameState.COMBAT : GameState.PLAYING);
      }
      
      setIsTextLoading(false);
      setSelectedChoiceIdx(null);
      setIsCustomChoiceMode(false);
      setCustomChoiceValue('');
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const finalImageUrl = await GeminiService.generateImage(nextTurn.imagePrompt);
        if (finalImageUrl) {
           setGameData(prev => ({ ...prev, currentImage: finalImageUrl }));
        }
      } catch (e) {
        console.warn("Background image generation failed");
      }
      setIsImageLoading(false);
    } catch (error) {
      console.error("Critical transition error", error);
      setGameState(GameState.ERROR);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChatInput.trim() || isOracleLoading) return;
    const msg = currentChatInput;
    setChatMessages(p => [...p, { role: 'user', text: msg }]);
    setCurrentChatInput('');
    setIsOracleLoading(true);
    try {
      const resp = await GeminiService.getOracleResponse(msg, gameData.history);
      setChatMessages(p => [...p, { role: 'model', text: resp }]);
    } finally { setIsOracleLoading(false); }
  };

  const handleCustomChoiceSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (customChoiceValue.trim()) {
      makeChoice(customChoiceValue, 'custom');
    }
  };

  if (gameState === GameState.START) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent)]" />
        <div className="relative z-10 max-w-2xl w-full bg-slate-900/80 p-12 rounded-[3rem] border border-slate-800 backdrop-blur-3xl shadow-2xl text-center">
          <h1 className="text-7xl font-fantasy mb-2 bg-gradient-to-b from-indigo-200 via-indigo-400 to-indigo-800 bg-clip-text text-transparent tracking-tighter uppercase">БЕСКОНЕЧНОСТЬ</h1>
          <p className="text-indigo-500/60 mb-12 uppercase tracking-[0.5em] text-[10px] font-black">Когнитивные Горизонты</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            {GENRES.map(genre => (
              <button key={genre} onClick={() => initSetup(genre)} className="p-6 rounded-[2rem] border border-slate-800 bg-slate-800/20 hover:bg-indigo-600/10 hover:border-indigo-500/50 transition-all text-left group active:scale-95">
                <div className="text-indigo-300 font-bold mb-1 group-hover:text-white transition-colors">{genre}</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest">Инициализировать мир</div>
              </button>
            ))}
          </div>
          {hasSave && <button onClick={loadGame} className="flex items-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all font-bold active:scale-95 mx-auto"><RotateCcw size={20} /> Вернуться к истокам</button>}
        </div>
      </div>
    );
  }

  if (gameState === GameState.SETUP) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent)]" />
        <div className="relative z-10 max-w-3xl w-full bg-slate-900/80 p-10 md:p-16 rounded-[3.5rem] border border-slate-800 backdrop-blur-3xl shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4 mb-8">
             <button onClick={() => setGameState(GameState.START)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 transition-all">
                <X size={24} />
             </button>
             <h2 className="text-4xl font-fantasy text-white uppercase tracking-widest">Архитектор Реальности</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Окружение / Мир</label>
              <textarea 
                value={customSettings.worldDesc}
                onChange={e => setCustomSettings({...customSettings, worldDesc: e.target.value})}
                placeholder="Забытый город в облаках, неоновая пустыня..." 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500 transition-all h-32 resize-none placeholder-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Главный Герой</label>
              <textarea 
                value={customSettings.heroDesc}
                onChange={e => setCustomSettings({...customSettings, heroDesc: e.target.value})}
                placeholder="Киборг-наемник с амнезией, последний маг..." 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500 transition-all h-32 resize-none placeholder-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><Sword size={14}/> Оружие</label>
              <input 
                type="text"
                value={customSettings.weaponDesc}
                onChange={e => setCustomSettings({...customSettings, weaponDesc: e.target.value})}
                placeholder="Фотонная катана, ржавый револьвер..." 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><Ghost size={14}/> Главный Злодей</label>
              <input 
                type="text"
                value={customSettings.villainDesc}
                onChange={e => setCustomSettings({...customSettings, villainDesc: e.target.value})}
                placeholder="Искусственный интеллект, древний бог..." 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-600"
              />
            </div>
          </div>

          <button 
            onClick={startGame} 
            className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] transition-all active:scale-95 shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-4"
          >
            <Sparkles size={24} /> Начать Путешествие
          </button>
          <p className="mt-6 text-center text-[10px] text-slate-500 uppercase tracking-widest">AI создаст мир на основе ваших предпочтений</p>
        </div>
      </div>
    );
  }

  if (gameState === GameState.LOADING) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300"><Loader2 className="w-20 h-20 text-indigo-500 animate-spin mb-8" /><p className="text-3xl font-fantasy animate-pulse uppercase tracking-[0.2em] text-indigo-300 text-center px-6">Синтез реальности...<br/><span className="text-xs text-indigo-500 opacity-60">Подождите, если API перегружен</span></p></div>;
  }

  if (gameState === GameState.GAMEOVER) {
    const finalTurn = gameData.currentTurn;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(185,28,28,0.15),transparent)] animate-pulse" />
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,1)]" />
        
        <div className="relative z-10 max-w-3xl w-full text-center space-y-12 animate-in fade-in zoom-in duration-1000">
          <div className="relative inline-block">
            <Skull className="w-40 h-40 text-red-600 mx-auto drop-shadow-[0_0_25px_rgba(220,38,38,0.5)]" />
            <div className="absolute -inset-4 bg-red-600/20 blur-2xl rounded-full -z-10 animate-pulse" />
          </div>
          
          <h2 className="text-8xl font-fantasy text-white uppercase tracking-tighter leading-none">
            ВЫ <span className="text-red-600">ПОГИБЛИ</span>
          </h2>

          <div className="bg-slate-900/60 backdrop-blur-xl p-10 md:p-14 rounded-[3rem] border border-red-900/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />
            <ScrollText className="absolute top-6 right-6 text-red-900/30" size={48} />
            
            <p className="text-xl md:text-2xl leading-[1.8] text-slate-300 font-medium italic mb-8 text-left">
              <TypewriterText text={finalTurn?.story || "Ваша история обрывается здесь, во тьме..."} speed={25} />
            </p>

            <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-slate-800/50">
              <div className="text-center">
                <div className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-1">Наследие</div>
                <div className="text-3xl font-fantasy text-white flex items-center justify-center gap-2"><Trophy size={20} className="text-amber-500"/> {gameData.history.length} ЭТАПОВ</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-1">Развитие</div>
                <div className="text-3xl font-fantasy text-white">УРОВЕНЬ {gameData.stats.level}</div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              localStorage.removeItem(SAVE_KEY);
              window.location.reload();
            }} 
            className="group flex items-center gap-4 px-16 py-6 bg-red-600 hover:bg-red-500 text-white rounded-3xl transition-all font-black uppercase tracking-[0.3em] active:scale-95 mx-auto shadow-[0_20px_40px_rgba(220,38,38,0.2)]"
          >
            <RotateCcw size={24} className="group-hover:rotate-180 transition-transform duration-500" /> 
            Начать новый цикл
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.ERROR) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <AlertCircle className="w-24 h-24 text-red-500 mb-8" />
        <h2 className="text-4xl font-fantasy mb-4 text-white uppercase tracking-tighter">Ошибка реальности</h2>
        <p className="text-slate-500 mb-10 max-w-md italic">Похоже, квота API исчерпана или произошел разрыв соединения. Подождите минуту и попробуйте снова.</p>
        <button onClick={() => window.location.reload()} className="px-12 py-4 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">Попробовать снова</button>
      </div>
    );
  }

  const current = gameData.currentTurn!;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row h-screen overflow-hidden text-slate-300">
      <style>{`.skeleton-line { height: 1.25rem; background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%); background-size: 200% 100%; animation: text-shimmer 1.5s infinite; border-radius: 0.5rem; margin-bottom: 0.75rem; } @keyframes text-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }`}</style>
      
      {showMap && <WorldMap history={gameData.history} currentChoices={current.choices} threatLevel={current.threatLevel} onClose={() => setShowMap(false)} />}

      <aside className="w-full md:w-80 bg-slate-900 border-r border-slate-800/60 flex flex-col p-6 overflow-y-auto z-30 custom-scrollbar backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/20 shadow-inner"><Sparkles className="text-indigo-400" size={24} /></div>
          <h2 className="text-2xl font-fantasy tracking-widest text-white uppercase">ЛОГОС</h2>
        </div>
        
        <div className="space-y-10 flex-1">
          <section>
            <div className="text-indigo-500 mb-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><MapIcon size={16}/> Локация</div>
            <div className="text-xl font-fantasy text-slate-100 mb-3">{current.locationName}</div>
            <button onClick={() => setShowMap(true)} className="flex items-center gap-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest bg-indigo-500/5 px-4 py-2 rounded-xl border border-indigo-500/10 transition-all w-full justify-center"><History size={14}/> Карта мира</button>
          </section>

          <section>
            <div className="text-indigo-500 mb-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><Sword size={16}/> Цель</div>
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 text-sm italic">{current.currentQuest}</div>
          </section>
          
          <section>
            <div className="text-indigo-500 mb-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><Backpack size={16}/> Инвентарь</div>
            <div className="flex flex-wrap gap-2">
              {current.inventory.map((it, i) => <span key={i} className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-[10px] text-slate-400">{it}</span>)}
              {current.inventory.length === 0 && <span className="text-[10px] text-slate-600 italic">Пусто...</span>}
            </div>
          </section>
          
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button onClick={saveGame} className="py-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[10px] font-black rounded-xl border border-indigo-500/20 flex items-center justify-center gap-2 uppercase tracking-widest"><Save size={14}/> СОХРАНИТЬ</button>
            <button onClick={() => setGameState(GameState.START)} className="py-3 bg-slate-800/50 hover:bg-red-900/20 text-slate-500 hover:text-red-400 text-[10px] font-black rounded-xl border border-slate-700 flex items-center justify-center gap-2 uppercase tracking-widest"><X size={14}/> ВЫХОД</button>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col h-72 shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4"><MessageSquare size={14}/> Глаз Оракула</div>
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
            {chatMessages.length === 0 && <div className="text-[10px] text-slate-600 italic px-2">Задайте вопрос о мире...</div>}
            {chatMessages.map((m, i) => (
              <div key={i} className={`p-4 rounded-2xl text-[11px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/10 ml-4' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 mr-4'}`}>
                {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChatSubmit} className="relative">
            <input 
              type="text" 
              value={currentChatInput} 
              onChange={e => setCurrentChatInput(e.target.value)} 
              placeholder="Спросить Оракула..." 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-600 text-white" 
            />
            <button type="submit" disabled={isOracleLoading} className="absolute right-3 top-3 text-indigo-500 hover:text-indigo-400 disabled:opacity-30">
              {isOracleLoading ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-950">
        <header className="absolute top-8 left-1/2 -translate-x-1/2 z-40">
          <StatsBar stats={gameData.stats} />
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-12 space-y-12 scroll-smooth pt-32 custom-scrollbar">
          <div className="max-w-4xl mx-auto aspect-video rounded-[3rem] overflow-hidden border border-slate-800 shadow-2xl relative bg-slate-900 group shrink-0">
            {gameData.currentImage && <img src={gameData.currentImage} className={`w-full h-full object-cover transition-all duration-1000 ${isImageLoading ? 'opacity-20 blur-2xl' : 'opacity-100'}`} alt="Иллюстрация" />}
            {isImageLoading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-md z-10"><Loader2 className="text-indigo-500 animate-spin mb-4" size={48} /><div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Визуальный синтез...</div></div>}
            
            {gameState === GameState.COMBAT && current.combatInfo && (
              <div className="absolute inset-0 bg-red-900/10 pointer-events-none flex flex-col justify-end p-10 bg-gradient-to-t from-red-950/80 to-transparent">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="text-red-400 text-[10px] font-black uppercase tracking-[0.5em] mb-1">Противник</div>
                    <div className="text-3xl font-fantasy text-white uppercase">{current.combatInfo.enemyName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg mb-2">{current.combatInfo.enemyHp} / {current.combatInfo.enemyMaxHp} ОЗ</div>
                    <div className="w-64 bg-slate-900 h-3 rounded-full overflow-hidden border border-red-500/30">
                      <div className="h-full bg-red-600 transition-all duration-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]" style={{ width: `${(current.combatInfo.enemyHp / current.combatInfo.enemyMaxHp) * 100}%` }} />
                    </div>
                  </div>
                </div>
                {current.combatInfo.lastActionLog && (
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-red-500/20 text-xs text-red-200 animate-in slide-in-from-bottom-2">
                    {current.combatInfo.lastActionLog}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="max-w-3xl mx-auto min-h-[200px]">
            {isTextLoading ? (
              <div className="p-12 space-y-6 bg-slate-900/20 rounded-[3rem] border border-slate-800/40"><div className="skeleton-line w-full"/><div className="skeleton-line w-full"/><div className="skeleton-line w-2/3"/></div>
            ) : (
              <div className="bg-slate-900/40 p-10 md:p-14 rounded-[3.5rem] border border-slate-800/60 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-full h-1 ${gameState === GameState.COMBAT ? 'bg-red-500/30' : 'bg-indigo-500/30'}`} />
                <p className="text-xl md:text-2xl leading-[1.8] text-slate-200 font-medium tracking-tight first-letter:text-6xl first-letter:text-indigo-500 first-letter:font-fantasy first-letter:float-left first-letter:mr-6 first-letter:mt-1">
                  <TypewriterText text={current.story} />
                </p>
              </div>
            )}
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 gap-6 pb-24">
            {current.choices.map((choice, idx) => (
              <button key={idx} disabled={isTextLoading} onClick={() => makeChoice(choice, idx)} className={`flex items-center gap-8 p-8 text-left rounded-[2rem] border transition-all active:scale-[0.98] group ${selectedChoiceIdx === idx && isTextLoading ? (gameState === GameState.COMBAT ? 'border-red-500 bg-red-900/20' : 'border-indigo-500 bg-indigo-900/20') : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80'}`}>
                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${selectedChoiceIdx === idx && isTextLoading ? 'bg-indigo-600 border-indigo-400 rotate-90 scale-110' : 'bg-slate-800 border-slate-700 group-hover:border-indigo-500'}`}>
                  {selectedChoiceIdx === idx && isTextLoading ? <Loader2 className="animate-spin text-white" size={24}/> : <ChevronRight size={30} className="text-indigo-500 transition-colors group-hover:text-white" />}
                </div>
                <div className="flex-1">
                  <span className="text-xl font-bold">{choice}</span>
                </div>
              </button>
            ))}
            
            {/* Custom Choice Option */}
            <div className="relative group">
              {!isCustomChoiceMode ? (
                <button 
                  disabled={isTextLoading} 
                  onClick={() => setIsCustomChoiceMode(true)} 
                  className={`w-full flex items-center gap-8 p-8 text-left rounded-[2rem] border transition-all active:scale-[0.98] bg-slate-900/40 border-slate-800/50 hover:border-amber-500/50 hover:bg-amber-500/5 group`}
                >
                  <div className="w-14 h-14 rounded-2xl border-2 bg-slate-800 border-slate-700 flex items-center justify-center transition-all group-hover:border-amber-500 group-hover:bg-amber-500/10">
                    <Edit3 size={24} className="text-slate-500 group-hover:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xl font-bold text-slate-500 group-hover:text-amber-200">Свой вариант...</span>
                  </div>
                </button>
              ) : (
                <form 
                  onSubmit={handleCustomChoiceSubmit}
                  className="animate-in slide-in-from-top-4 duration-300 relative"
                >
                  <input
                    ref={customChoiceInputRef}
                    type="text"
                    value={customChoiceValue}
                    onChange={(e) => setCustomChoiceValue(e.target.value)}
                    disabled={isTextLoading}
                    placeholder="Что вы предпримете?"
                    className="w-full bg-slate-900/80 border-2 border-amber-500/30 rounded-[2rem] p-8 pr-32 text-xl font-bold text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 transition-all shadow-2xl shadow-amber-500/10"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                     <button 
                      type="button"
                      onClick={() => setIsCustomChoiceMode(false)}
                      className="p-4 rounded-xl text-slate-500 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                    <button 
                      type="submit"
                      disabled={isTextLoading || !customChoiceValue.trim()}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-4 rounded-2xl transition-all active:scale-90 disabled:opacity-30 disabled:scale-100"
                    >
                      {selectedChoiceIdx === 999 && isTextLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {notification && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-indigo-400 flex items-center gap-3">
              <Sparkles size={20} className="text-amber-300" />
              {notification}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
