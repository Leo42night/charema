import { createContext, useContext, useState, type ReactNode } from 'react';

interface DebugContextType {
  log: (key: string, value: any) => void;
  debugData: Record<string, any>;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [debugData, setDebugData] = useState<Record<string, any>>({});

  const log = (key: string, value: any) => {
    setDebugData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DebugContext.Provider value={{ log, debugData }}>
      {children}
      <DebugPopup />
    </DebugContext.Provider>
  );
}

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (!context) throw new Error("useDebug must be within DebugProvider");
  return context;
};

function DebugPopup() {
  const { debugData } = useDebug();
  const [isOpen, setIsOpen] = useState(false);

  if (Object.keys(debugData).length === 0) return null;

  return (
    <div className="fixed bottom-100 right-4 z-999 font-mono">
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="neo-btn bg-neo-red text-white p-2 text-[10px] shadow-neo-sm border-2 border-black"
      >
        {isOpen ? "[ CLOSE DEBUG ]" : "[ DEBUG ]"}
      </button>

      {/* Value List */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-64 max-h-80 overflow-y-auto bg-black border-2 border-neo-yellow p-3 shadow-neo shadow-neo-yellow/50 animate-in slide-in-from-bottom-2">
          <div className="text-[10px] text-neo-yellow border-b border-neo-yellow/30 pb-2 mb-2 font-bold tracking-widest uppercase">
            // System_Logs
          </div>
          <div className="flex flex-col gap-2">
            {Object.entries(debugData).map(([key, val]) => (
              <div key={key} className="text-[10px]">
                <span className="text-neo-green font-bold">{key}:</span>
                <pre className="text-white bg-zinc-900 p-1 mt-0.5 rounded border border-zinc-700 overflow-x-auto">
                  {JSON.stringify(val, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}