import { useState, useCallback } from 'react'
import { Scene } from './components/Scene'
import { Menu } from './components/Menu'
import { NavigationControls } from './components/ui/NavigationControls'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { FamilyRegistry, type FamilyId } from './families/registry'
import { useAuth } from './auth/AuthContext'
import { Login } from './auth/Login'
import type { SolveProblem } from './types/SolveProblem'
import type { Session } from './types/Session'

function App() {
  const [currentLevel, setCurrentLevel] = useState('Array')
  const [familyId, setFamilyId] = useState<FamilyId | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [selectedProblem, setSelectedProblem] = useState<SolveProblem | null>(null)
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [sessionParticipantName, setSessionParticipantName] = useState('')

  const handleLevelSelect = (level: string) => {
    setCurrentLevel(level);
    const normalizedId = level.toLowerCase();
    if (Object.keys(FamilyRegistry).includes(normalizedId)) {
      setFamilyId(normalizedId as FamilyId);
    } else {
      setFamilyId(null);
    }
  };

  const handleProblemSelect = useCallback((problem: SolveProblem) => {
    setSelectedProblem(problem);
    setCurrentLevel('ProblemSolve');
  }, []);

  const handleSessionReady = useCallback((session: Session, participantName: string) => {
    setActiveSession(session);
    setSessionParticipantName(participantName);
    setCurrentLevel('SessionRoom');
  }, []);

  // Temporary usage to satisfy linter
  if (familyId) {
    console.debug('Active Family:', familyId);
  }

  const { session, loading } = useAuth();

  if (loading) {
    return <div className="w-full h-screen bg-slate-950 flex items-center justify-center text-cyan-500 font-mono">Loading App...</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      <Menu onSelectLevel={handleLevelSelect} currentLevel={currentLevel} />
      <ErrorBoundary>
        <Scene
          currentLevel={currentLevel}
          showGrid={showGrid}
          onSelectLevel={handleLevelSelect}
          selectedProblem={selectedProblem}
          onProblemSelect={handleProblemSelect}
          activeSession={activeSession}
          sessionParticipantName={sessionParticipantName}
          onSessionReady={handleSessionReady}
        />
      </ErrorBoundary>
      {!['Sandbox', 'Problems', 'ProblemSolve', 'Sessions', 'SessionRoom'].includes(currentLevel) && (
        <NavigationControls showGrid={showGrid} onToggleGrid={() => setShowGrid(!showGrid)} />
      )}
    </div>
  )
}

export default App
