import { useState, useCallback } from 'react';

interface TradingDecision {
  asset: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryZone: { min: number; max: number };
  stopLoss: number;
  takeProfit: number[];
  riskRewardRatio: number;
  reasoning: string;
  supportResistance: {
    price: number;
    type: 'support' | 'resistance';
    strength: string;
  }[];
  timestamp: number;
}

interface UseTradingDecisionReturn {
  decision: TradingDecision | null;
  isLoading: boolean;
  analyze: (
    symbol: string,
    currentPrice: number,
    levels: { price: number; type: 'support' | 'resistance' }[]
  ) => void;
}

export function useTradingDecision(): UseTradingDecisionReturn {
  const [decision, setDecision] = useState<TradingDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyze = useCallback(
    async (
      symbol: string,
      currentPrice: number,
      levels: { price: number; type: 'support' | 'resistance' }[]
    ) => {
      setIsLoading(true);

      try {
        // Find nearest support and resistance
        const supports = levels
          .filter((l) => l.type === 'support' && l.price < currentPrice)
          .sort((a, b) => b.price - a.price);
        const resistances = levels
          .filter((l) => l.type === 'resistance' && l.price > currentPrice)
          .sort((a, b) => a.price - b.price);

        const nearestSupport = supports[0]?.price ?? currentPrice * 0.99;
        const nearestResistance = resistances[0]?.price ?? currentPrice * 1.01;

        // Simple decision logic based on position relative to S/R
        const distanceToSupport = (currentPrice - nearestSupport) / currentPrice;
        const distanceToResistance = (nearestResistance - currentPrice) / currentPrice;

        let action: 'BUY' | 'SELL' | 'HOLD';
        let confidence: number;
        let reasoning: string;

        if (distanceToSupport < 0.003) {
          // Close to support - potential buy
          action = 'BUY';
          confidence = 70 + Math.random() * 20;
          reasoning = `Precio cercano a soporte fuerte en ${nearestSupport.toFixed(5)}. Potencial rebote al alza.`;
        } else if (distanceToResistance < 0.003) {
          // Close to resistance - potential sell
          action = 'SELL';
          confidence = 70 + Math.random() * 20;
          reasoning = `Precio cercano a resistencia en ${nearestResistance.toFixed(5)}. Potencial reversión a la baja.`;
        } else if (distanceToSupport < distanceToResistance) {
          // Closer to support than resistance
          action = 'BUY';
          confidence = 55 + Math.random() * 20;
          reasoning = `Precio más cerca del soporte. Riesgo/beneficio favorable para compra.`;
        } else {
          // Closer to resistance
          action = 'SELL';
          confidence = 55 + Math.random() * 20;
          reasoning = `Precio más cerca de la resistencia. Riesgo/beneficio favorable para venta.`;
        }

        // Calculate entry zone, SL, TP
        const pipValue = symbol.includes('JPY') ? 0.01 : symbol.includes('XAU') ? 1 : 0.0001;
        const entrySpread = pipValue * 5;

        const entryZone = {
          min: currentPrice - entrySpread,
          max: currentPrice + entrySpread,
        };

        const stopLoss =
          action === 'BUY' ? nearestSupport - pipValue * 10 : nearestResistance + pipValue * 10;

        const takeProfit = action === 'BUY'
          ? [
              nearestResistance,
              nearestResistance + (nearestResistance - currentPrice) * 0.5,
              nearestResistance + (nearestResistance - currentPrice),
            ]
          : [
              nearestSupport,
              nearestSupport - (currentPrice - nearestSupport) * 0.5,
              nearestSupport - (currentPrice - nearestSupport),
            ];

        const risk = Math.abs(currentPrice - stopLoss);
        const reward = Math.abs(takeProfit[0] - currentPrice);
        const riskRewardRatio = risk > 0 ? reward / risk : 0;

        const newDecision: TradingDecision = {
          asset: symbol,
          action,
          confidence: Math.round(confidence),
          entryZone,
          stopLoss,
          takeProfit,
          riskRewardRatio,
          reasoning,
          supportResistance: levels.map((l) => ({
            price: l.price,
            type: l.type,
            strength: 'moderate',
          })),
          timestamp: Date.now(),
        };

        setDecision(newDecision);
      } catch (error) {
        console.error('Error in trading decision:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { decision, isLoading, analyze };
}
