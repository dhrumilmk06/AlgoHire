import React from 'react';

const Fallback: React.FC = () => {
    return (
        <div className="flex items-center justify-center p-8 text-gray-500 bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Component Not Available</h3>
                <p className="text-sm">The requested visualization family could not be loaded.</p>
            </div>
        </div>
    );
};

export default Fallback;
