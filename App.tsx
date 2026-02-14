import React, { useState, useRef, useEffect } from 'react';
import { GameState, GameData, ChatMessage, AdventureTurn } from './types';
import { GeminiService } from './services/geminiService';
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
  Trash2,
  Image as ImageIcon,
  X,
  History
} from 'lucide-react';

const GENRES = [
  "Темное фэнтези", 
  "Киберпанк детектив", 
  "Галактическая космоопера", 
  "Готические ужасы"
];

const SAVE_KEY = 'infinite_adventure_save_v2';

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i += 3;
      if (i > text.length) clearInterval(interval);
    }, 10);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayedText}</span>;
};

const WorldMap: React.FC<{ history: AdventureTurn[], onClose: () => void }> = ({ history, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-5xl w-full h-[80vh] bg-slate-900/50 rounded-[3rem] border border-indigo-500/20 relative overflow-hidden flex flex-col p-10 shadow-2xl">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors">
          <X size={32} />
        </button>
        
        <div className="mb-10">
          <h2 className="text-4xl font-fantasy text-indigo-400 flex items-center gap-4">
            <MapIcon size={36} /> КАРТА ПУТЕШЕСТВИЯ
          </h2>
          <p className="text-slate-500 mt-2">Хроника вашего продвижения сквозь бесконечность</p>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center justify-start gap-12 px-10 scrollbar-thin">
          {history.map((turn, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center group relative">
              {/* Connection Line */}
              {i < history.length - 1 && (
                <div className="absolute left-[50%] top-6 w-[calc(3rem+3rem)] h-[2px] bg-gradient-to-r from-indigo-500 to-transparent opacity-30" />
              )}
              
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative z-10 
                ${i === history.length - 1 
                  ? 'bg-indigo-600 border-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.6)] scale-110 animate-pulse' 
                  : 'bg-slate-800 border-slate-700 hover:border-indigo-400'}`}>
                <span className="text-xs font-bold">{i + 1}</span>
              </div>
              
              <div className="mt-6 text-center w-40">
                <div className="text-indigo-300 font-bold text-sm truncate uppercase tracking-widest">{turn.locationName}</div>
                <div className="text-[10px] text-slate-500 mt-2 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {turn.story.substring(0, 60)}...
                </div>
              </div>

              {/* Decoration for current node */}
              {i === history.length - 1 && (
                <div className="absolute -top-12 text-indigo-400 text-[10px] font-black tracking-widest animate-bounce">
                  ВЫ ЗДЕСЬ
                </div>
              )}
            </div>
          ))}
          {history.length === 0 && <div className="text-slate-600 font-fantasy text-2xl">Карта пока пуста...</div>}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isTextLoading, setIsTextLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  
  const [gameData, setGameData] = useState<GameData>({
    history: [],
    currentTurn: null,
    genre: '',
    characterDescription: '',
    currentImage: null
  });
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentChatInput, setCurrentChatInput] = useState('');
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [hasSave, setHasSave] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasSave(!!localStorage.getItem(SAVE_KEY));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
      setGameState(GameState.PLAYING);
      showNotification("Мир восстановлен");
    } catch (e) { showNotification("Ошибка"); }
  };

  const startGame = async (genre: string) => {
    setGameState(GameState.LOADING);
    setIsImageLoading(true);
    try {
      const { turn, characterDescription } = await GeminiService.initializeCharacter(genre);
      setGameData({
        genre,
        characterDescription,
        currentTurn: turn,
        history: [turn],
        currentImage: null
      });
      setGameState(GameState.PLAYING);
      const img = await GeminiService.generateImage(turn.imagePrompt);
      setGameData(p => ({ ...p, currentImage: img }));
      setIsImageLoading(false);
    } catch (e) { setGameState(GameState.ERROR); }
  };

  const makeChoice = async (choice: string, index: number) => {
    if (isTextLoading) return;
    setSelectedChoiceIdx(index);
    setIsTextLoading(true);
    setIsImageLoading(true);
    
    try {
      const [quickImagePrompt, nextTurn] = await Promise.all([
        GeminiService.getQuickImagePrompt(gameData.genre, gameData.history, choice),
        GeminiService.generateNextTurn(gameData.genre, gameData.history, choice, gameData.characterDescription)
      ]);

      const imagePromise = GeminiService.generateImage(quickImagePrompt);
      setGameData(prev => ({
        ...prev,
        currentTurn: nextTurn,
        history: [...prev.history, nextTurn]
      }));
      
      setIsTextLoading(false);
      setSelectedChoiceIdx(null);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

      const finalImageUrl = await imagePromise;
      setGameData(prev => ({ ...prev, currentImage: finalImageUrl }));
      setIsImageLoading(false);
    } catch (error) {
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

  if (gameState === GameState.START) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-2xl w-full bg-slate-900/80 p-10 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl text-center">
          <h1 className="text-6xl font-fantasy mb-2 bg-gradient-to-b from-indigo-300 to-indigo-600 bg-clip-text text-transparent">INFINITE</h1>
          <p className="text-slate-500 mb-10 uppercase tracking-[0.3em] text-xs font-bold">Нейронные Пути</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {GENRES.map(genre => (
              <button key={genre} onClick={() => startGame(genre)} className="p-5 rounded-2xl border border-slate-800 bg-slate-800/30 hover:bg-indigo-600/10 hover:border-indigo-500/50 transition-all text-left active:scale-95">
                <div className="text-indigo-300 font-bold mb-1">{genre}</div>
                <div className="text-[10px] text-slate-500 uppercase">Начать сагу</div>
              </button>
            ))}
          </div>
          {hasSave && (
            <div className="pt-8 border-t border-slate-800/50 flex gap-4 justify-center">
              <button onClick={loadGame} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-bold active:scale-95"><RotateCcw size={18} /> Продолжить</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === GameState.LOADING && gameData.history.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
        <p className="text-2xl font-fantasy animate-pulse uppercase tracking-widest">Пробуждение мира...</p>
      </div>
    );
  }

  if (gameState === GameState.ERROR) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <AlertCircle className="w-20 h-20 text-red-500/20 mb-6" />
        <h2 className="text-3xl font-fantasy mb-4">Разлом в матрице</h2>
        <button onClick={() => window.location.reload()} className="px-10 py-3 bg-indigo-600 rounded-xl font-bold">Перезагрузка</button>
      </div>
    );
  }

  const current = gameData.currentTurn!;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row h-screen overflow-hidden text-slate-300">
      <style>{`
        @keyframes text-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .skeleton-line { height: 1.25rem; background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%); background-size: 200% 100%; animation: text-shimmer 1.5s infinite; border-radius: 0.5rem; margin-bottom: 0.75rem; }
      `}</style>

      {showMap && <WorldMap history={gameData.history} onClose={() => setShowMap(false)} />}

      <aside className="w-full md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col p-5 overflow-y-auto z-30">
        <div className="flex items-center gap-3 mb-10">
          <Sparkles className="text-indigo-400" size={20} />
          <h2 className="text-xl font-fantasy tracking-wider">LOGOS</h2>
        </div>
        
        <div className="space-y-8 flex-1">
          <section>
            <div className="text-indigo-400 mb-4 text-[10px] font-black uppercase tracking-wider flex gap-2"><MapIcon size={14}/>Местоположение</div>
            <div className="text-lg font-fantasy text-slate-100 mb-2">{current.locationName}</div>
            <button onClick={() => setShowMap(true)} className="flex items-center gap-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest border-b border-indigo-500/20 pb-1">
              <History size={12}/> Открыть карту мира
            </button>
          </section>

          <section>
            <div className="text-indigo-400 mb-4 text-[10px] font-black uppercase tracking-wider flex gap-2"><Sword size={14}/>Цель</div>
            <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/20 text-sm italic">{current.currentQuest}</div>
          </section>
          
          <section>
            <div className="text-indigo-400 mb-4 text-[10px] font-black uppercase tracking-wider flex gap-2"><Backpack size={14}/>Вещи</div>
            <div className="flex flex-wrap gap-2">
              {current.inventory.map((it, i) => <span key={i} className="px-3 py-1 bg-slate-800/50 border border-slate-700 rounded-lg text-[10px]">{it}</span>)}
            </div>
          </section>
          
          <button onClick={saveGame} className="w-full py-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[10px] font-bold rounded-xl border border-indigo-500/20 transition-all flex items-center justify-center gap-2"><Save size={12}/> СОХРАНИТЬ</button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col h-64">
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin">
            {chatMessages.map((m, i) => <div key={i} className={`p-3 rounded-xl text-[11px] ${m.role === 'user' ? 'bg-indigo-500/10 text-indigo-200' : 'bg-slate-800/30'}`}>{m.text}</div>)}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChatSubmit} className="relative">
            <input type="text" value={currentChatInput} onChange={e => setCurrentChatInput(e.target.value)} placeholder="Оракул..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-4 pr-10 text-xs focus:outline-none focus:border-indigo-500" />
            <button type="submit" disabled={isOracleLoading} className="absolute right-3 top-2 text-indigo-500">{isOracleLoading ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}</button>
          </form>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 scroll-smooth">
          <div className="max-w-4xl mx-auto aspect-video rounded-[2rem] overflow-hidden border border-slate-800 relative bg-slate-900">
            {gameData.currentImage && <img src={gameData.currentImage} className={`w-full h-full object-cover transition-opacity duration-1000 ${isImageLoading ? 'opacity-30' : 'opacity-100'}`} />}
            {isImageLoading && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm"><Loader2 className="text-indigo-500 animate-spin" size={32} /></div>}
            <div className="absolute bottom-4 left-4 z-20"><div className="px-4 py-1.5 bg-indigo-600/20 backdrop-blur rounded-full text-[10px] font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">{gameData.genre}</div></div>
          </div>

          <div className="max-w-3xl mx-auto min-h-[150px]">
            {isTextLoading ? (
              <div className="p-8 space-y-4 bg-slate-900/20 rounded-3xl border border-slate-800/40"><div className="skeleton-line w-full"/><div className="skeleton-line w-full"/><div className="skeleton-line w-2/3"/></div>
            ) : (
              <div key={gameData.history.length} className="bg-slate-900/40 p-8 md:p-12 rounded-[2.5rem] border border-slate-800/60 backdrop-blur-sm shadow-2xl">
                <p className="text-xl md:text-2xl leading-[1.6] text-slate-200 font-medium tracking-tight first-letter:text-5xl first-letter:text-indigo-500 first-letter:font-fantasy first-letter:float-left first-letter:mr-4">
                  <TypewriterText text={current.story} />
                </p>
              </div>
            )}
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 gap-4 pb-20">
            {current.choices.map((choice, idx) => {
              const loading = selectedChoiceIdx === idx && isTextLoading;
              return (
                <button key={idx} disabled={isTextLoading} onClick={() => makeChoice(choice, idx)} className={`flex items-center gap-6 p-6 text-left rounded-2xl border transition-all relative overflow-hidden group active:scale-95 ${loading ? 'border-indigo-500 bg-indigo-900/10' : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50'}`}>
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${loading ? 'bg-indigo-600' : 'bg-slate-800 group-hover:border-indigo-500'}`}>{loading ? <Loader2 className="animate-spin" size={20}/> : <ChevronRight size={24}/>}</div>
                  <span className="text-lg font-medium">{choice}</span>
                </button>
              );
            })}
          </div>
        </div>
        {notification && <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-8 py-2 rounded-full font-bold shadow-2xl z-50">{notification}</div>}
      </main>
    </div>
  );
};

export default App;
