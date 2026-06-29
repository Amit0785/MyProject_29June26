import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

// Create a custom hook for dimension-aware UI
export const useDimensions = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const listener = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => listener.remove();
  }, []);

  return dimensions;
};
