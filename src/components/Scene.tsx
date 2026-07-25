import SearchLevel from './levels/SearchLevel'
import { ArrayLevel } from './levels/ArrayLevel'
import { StackLevel } from './levels/StackLevel'
import { QueueLevel } from './levels/QueueLevel'
import { LinkedListLevel } from './levels/LinkedListLevel'
import { HeapLevel } from './levels/HeapLevel'
import { SortingLevel } from './algorithms/SortingLevel'
import { PathfindingLevel } from './algorithms/PathfindingLevel'
import TreeLevel from './TreeLevel'
import GraphLevel from './GraphLevel'
import HashTableLevel from './HashTableLevel'
import React from 'react'
import { LeetCodeLevel } from './levels/LeetCodeLevel'
import { ProblemsListLevel } from './levels/ProblemsListLevel'
import { ProblemSolveLevel } from './levels/ProblemSolveLevel'
import { SessionsLobbyLevel } from './levels/SessionsLobbyLevel'
import { SessionRoomLevel } from './levels/SessionRoomLevel'
import type { SolveProblem } from '../types/SolveProblem'
import type { Session } from '../types/Session'
const SandboxLevel = React.lazy(() => import('./SandboxLevel'))
const ArraySandbox = React.lazy(() => import('./levels/ArraySandbox'))

type SceneProps = {
    currentLevel: string
    showGrid: boolean
    onSelectLevel: (level: string) => void
    selectedProblem?: SolveProblem | null
    onProblemSelect?: (problem: SolveProblem) => void
    activeSession?: Session | null
    sessionParticipantName?: string
    onSessionReady?: (session: Session, participantName: string) => void
}

export const Scene = ({ currentLevel, showGrid, onSelectLevel, selectedProblem, onProblemSelect, activeSession, sessionParticipantName, onSessionReady }: SceneProps) => {
    // All levels are now self-contained (manage their own Canvas)
    switch (currentLevel) {
        case 'Array':
            return <ArrayLevel showGrid={showGrid} />;
        case 'Stack':
            return <StackLevel showGrid={showGrid} />;
        case 'Queue':
            return <QueueLevel showGrid={showGrid} />;
        case 'LinkedList':
            return <LinkedListLevel showGrid={showGrid} />;
        case 'Tree':
            return <TreeLevel showGrid={showGrid} />;
        case 'Graph':
            return <GraphLevel showGrid={showGrid} />;
        case 'Hash':
            return <HashTableLevel showGrid={showGrid} />;
        case 'Heap':
            return <HeapLevel showGrid={showGrid} />;
        case 'Search':
            return <SearchLevel />;
        case 'Sorting':
            return <SortingLevel showGrid={showGrid} />;
        case 'Pathfinding':
            return <PathfindingLevel showGrid={showGrid} />;
        case 'Sandbox':
            return <SandboxLevel />;
        case 'ArraySandbox':
            return <ArraySandbox showGrid={showGrid} />;
        case 'LeetCode':
            return <LeetCodeLevel showGrid={showGrid} />;
        case 'Problems':
            return (
                <ProblemsListLevel
                    onSolveProblem={onProblemSelect ?? (() => {})}
                />
            );
        case 'ProblemSolve':
            return selectedProblem ? (
                <ProblemSolveLevel
                    problem={selectedProblem}
                    onBack={() => onSelectLevel('Problems')}
                />
            ) : null;
        case 'Sessions':
            return (
                <SessionsLobbyLevel
                    onSessionReady={onSessionReady ?? (() => {})}
                />
            );
        case 'SessionRoom':
            return activeSession ? (
                <SessionRoomLevel
                    session={activeSession}
                    participantName={sessionParticipantName ?? 'Anonymous'}
                    onLeave={() => onSelectLevel('Sessions')}
                />
            ) : null;
        default:
            return null;
    }
}
