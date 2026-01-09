import React from 'react';

export const Barcode = ({ className }: { className?: string }) => {
  // Generate more varied bar widths for a more realistic barcode
  const bars = [
    2, 1, 3, 1, 1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 1, 4, 1, 2, 2, 3, 1, 
    1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 1, 4, 1, 2, 2, 3, 1
  ];
  
  return (
    <div className={`flex items-stretch h-10 bg-transparent ${className}`}>
      {/* Start guard bars */}
      <div className="bg-current w-px mr-px" />
      <div className="bg-current w-px mr-[2px]" />
      
      {bars.map((width, i) => (
        <div
          key={i}
          className="bg-current"
          style={{
            width: `${width}px`,
            marginRight: (i + width) % 3 === 0 ? '1px' : '2px',
          }}
        />
      ))}
      
      {/* End guard bars */}
      <div className="bg-current w-px ml-[2px] mr-px" />
      <div className="bg-current w-px" />
    </div>
  );
};
