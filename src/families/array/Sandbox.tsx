import { useState } from 'react';
import { ArrayRenderer } from './ArrayRenderer';


export const ArraySandbox = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Mocking global Step type for sandbox
    const steps: any[] = [
        { type: 'INIT', message: 'Init', indices: [], customValues: { values: [8, 5, 2, 9, 3] }, line: 1 },
        { type: 'COMPARE', message: 'Compare 8 and 5', indices: [0, 1], line: 2 },
        { type: 'SWAP', message: 'Swap 8 and 5', indices: [0, 1], line: 3 },
    ];

    // Mock visual data
    const visualData = [8, 5, 2, 9, 3];

    const handleNext = () => {
        setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const handlePrev = () => {
        setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
    };

    return (
        <div className="absolute top-20 left-20 z-10 w-[500px]">
            <div className="bg-gray-900/80 p-4 rounded-t-lg border border-gray-700 flex justify-between items-center backdrop-blur">
                <h3 className="text-white font-bold">Array Family Sandbox</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrev}
                        disabled={currentStepIndex === 0}
                        className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={currentStepIndex === steps.length - 1}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            <ArrayRenderer visualData={visualData} steps={steps} currentStepIndex={currentStepIndex} />
        </div>
    );
};
