import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

function OptimizedImage({ src, alt, className, width, height }: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Add query parameters for resizing if supported by your storage provider
  const optimizedSrc = width && height 
    ? `${src}?width=${width}&height=${height}` 
    : src;
  
  return (
    <div className={`relative ${className || ''}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse rounded" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}

export default OptimizedImage; 