// src/App.tsx
import React from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import Timeline from './components/Timeline/Timeline';
import { getTimelineDropHandler } from './components/Timeline/dropHandler';
import useAppController from './hooks/useAppController';
import { mockBreakDefinitions, mockShifts } from './config/mockData';
import { CheckCircle, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const {
    agents,
    scheduledBreaks,
    loading,
    error,
    handleDragEnd,
    handleAssignAgentOptimistic,
    handleUpdateAgentStatusOptimistic,
    resetAppState,
    lastBreakEvent,
  } = useAppController();

  const onDragEnd = (result: DropResult) => {
    const handler = getTimelineDropHandler();
    if (handler) {
      handler(result);
      return;
    }
    handleDragEnd(result);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <React.StrictMode>
        <div className="min-h-screen bg-gray-100 font-sans">
          <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-x-6">
                <h1 className="text-2xl md:text-3xl font-bold text-indigo-700">Паузи</h1>
                
                {/* --- Banner with real-time logic --- */}
                {/* Shows banner only if the event happened in the last 10 seconds */}
                {lastBreakEvent && (new Date().getTime() - lastBreakEvent.timestamp.getTime() < 10000) && (
                  <div 
                    className={`flex items-center p-2 rounded-md transition-all duration-300 ease-in-out
                      ${lastBreakEvent.action === 'active' ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'}`}
                  >
                    {lastBreakEvent.action === 'active' 
                      ? <CheckCircle size={18} className="mr-2"/> 
                      : <LogOut size={18} className="mr-2"/>
                    }
                    <span className="text-sm font-medium">
                      {`${lastBreakEvent.agentName} ${lastBreakEvent.action === 'active' ? 'започна пауза' : 'заврши пауза'} во ${lastBreakEvent.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </div>
                )}
              </div>
              
              <button
                onClick={resetAppState}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                title="Ресетирај ги сите доделени паузи и статуси на агенти"
              >
                Ресет
              </button>
            </div>
          </header>

          <main className="container mx-auto p-2 md:p-4 mt-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
                <p className="mt-4 text-lg text-gray-700">Вчитување податоци...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
                <p className="font-bold">Грешка</p>
                <p>{error}. Проверете ја конзолата за детали.</p>
              </div>
            ) : (
              <Timeline
                agents={agents}
              />
            )}
          </main>
          
          <footer className="text-center py-4 mt-8 text-sm text-gray-500 border-t border-gray-200">
            © {new Date().getFullYear()} Распоредувач на Паузи. Сите права задржани.
          </footer>
        </div>
      </React.StrictMode>
    </DragDropContext>
  );
};

export default App;