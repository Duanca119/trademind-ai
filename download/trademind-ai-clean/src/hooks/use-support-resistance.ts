import { useState, useCallback } from 'react';

interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: 'weak' | 'moderate' | 'strong';
  touches: number;
  distance: number;
}

interface UseSupportResistanceReturn {
  levels: SupportResistanceLevel[];
  isLoading: boolean;
  analyze: (symbol: string, currentPrice: number) => void;
}

export function useSupportResistance(): UseSupportResistanceReturn {
  const [levels, setLevels] = useState<SupportResistanceLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const analyze = useCallback((symbol: string, currentPrice: number) => {
    setIsLoading(true);

    // Simulated support/resistance detection
    // In production, this would use actual historical data analysis
    const pipValue = symbol.includes('JPY') ? 0.01 : symbol.includes('XAU') ? 1 : 0.0001;
    const rangeMultiplier = symbol.includes('XAU') ? 50 : symbol.includes('JPY') ? 100 : 200;

    const generatedLevels: SupportResistanceLevel[] = [];

    // Generate resistance levels (above current price)
    for (let i = 1; i <= 3; i++) {
      const distance = pipValue * rangeMultiplier * i * (0.8 + Math.random() * 0.4);
      generatedLevels.push({
        price: currentPrice + distance,
        type: 'resistance',
        strength: i === 1 ? 'strong' : i === 2 ? 'moderate' : 'weak',
        touches: Math.floor(Math.random() * 5) + 1,
        distance: distance,
      });
    }

    // Generate support levels (below current price)
    for (let i = 1; i <= 3; i++) {
      const distance = pipValue * rangeMultiplier * i * (0.8 + Math.random() * 0.4);
      generatedLevels.push({
        price: currentPrice - distance,
        type: 'support',
        strength: i === 1 ? 'strong' : i === 2 ? 'moderate' : 'weak',
        touches: Math.floor(Math.random() * 5) + 1,
        distance: distance,
      });
    }

    // Sort by price
    generatedLevels.sort((a, b) => a.price - b.price);

    setLevels(generatedLevels);
    setIsLoading(false);
  }, []);

  return { levels, isLoading, analyze };
}
