import { z } from "zod";

// Versioned application-level message protocol for PredictX over Nitrolite APP_MESSAGE

export const PredictionTypeEnum = z.enum(["price_target", "direction", "above_below"]);

export const SubmitPredictionPayload = z.object({
  type: z.literal("predictx/submit_prediction"),
  version: z.literal("1.0"),
  data: z.object({
    userId: z.string(),
    assetId: z.string(),
    predictionType: PredictionTypeEnum,
    targetPrice: z.number().optional(),
    direction: z.enum(["up", "down"]).optional(),
    timeFrame: z.number().int().positive(),
    amount: z.number().positive(),
    timestamp: z.number(),
    // For auditing
    priceAtSubmission: z.number().optional(),
  }),
});

export const SubmitPredictionResponse = z.object({
  predictionId: z.string(),
  timestamp: z.number(),
});

export const SettlePredictionPayload = z.object({
  type: z.literal("predictx/settle_prediction"),
  version: z.literal("1.0"),
  data: z.object({
    predictionId: z.string(),
    actualPrice: z.number(),
    isCorrect: z.boolean(),
    timestamp: z.number(),
  }),
});

export const SettlePredictionResponse = z.object({
  txId: z.string(),
  timestamp: z.number(),
});

// Utility types
export type TSubmitPredictionPayload = z.infer<typeof SubmitPredictionPayload>;
export type TSubmitPredictionResponse = z.infer<typeof SubmitPredictionResponse>;
export type TSettlePredictionPayload = z.infer<typeof SettlePredictionPayload>;
export type TSettlePredictionResponse = z.infer<typeof SettlePredictionResponse>;