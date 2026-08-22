import React from 'react';

export const VideoComposition: React.FC<{ bgSelection?: any }> = ({ bgSelection }) => {
  return (
    <div className="w-full h-full text-white relative overflow-hidden flex items-center justify-center">
      <div style={{ backgroundColor: '#09090b' }} className="absolute inset-0 pointer-events-none z-0" />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <p className="text-gray-500 text-sm">No video generated yet. Create a project to generate animation code.</p>
      </div>
    </div>
  );
};

export default VideoComposition;
