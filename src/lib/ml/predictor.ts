import * as path from 'path';
import * as fs from 'fs';
// @ts-ignore - onnxruntime-node types might be missing depending on TS setup
import * as ort from 'onnxruntime-node';

let session: ort.InferenceSession | null = null;
let initializationAttempted = false;

/**
 * Initialize the ONNX Runtime session with our trained LightGBM model.
 */
async function getSession() {
  if (session) return session;
  if (initializationAttempted) return null; // Don't keep trying if it failed once

  initializationAttempted = true;
  try {
    const modelPath = path.join(process.cwd(), 'ml', 'wait_predictor.onnx');
    if (fs.existsSync(modelPath)) {
      session = await ort.InferenceSession.create(modelPath);
      console.log(`[ML] Loaded ONNX model from ${modelPath}`);
    } else {
      console.warn(`[ML] ONNX model not found at ${modelPath}. Mocking ML prediction for testing.`);
      // Mock session for testing
      session = { 
        isMock: true, 
        inputNames: ['float_input'], 
        outputNames: ['variable'], 
        run: async (feeds: any) => {
          return { 'variable': { data: [600] } }; // Mock 10 min prediction
        }
      } as any;
    }
  } catch (err) {
    console.error("[ML] Error loading ONNX model:", err);
  }
  return session;
}

/**
 * Predict wait time using the trained ML model.
 * Features required: ['hour_of_day', 'day_of_week', 'queue_position_at_join', 'rolling_avg_last_8', 'queue_length_at_join']
 */
export async function predictWaitTime(features: number[]): Promise<number | null> {
  const sess = await getSession();
  if (!sess) return null;

  try {
    // ONNX Runtime expects a Float32Array for float inputs
    const float32Data = new Float32Array(features);
    // Our model expects shape [1, 5] (1 sample, 5 features)
    const tensor = new ort.Tensor('float32', float32Data, [1, 5]);

    // Prepare inputs. The input name depends on how it was exported, usually 'float_input'
    // But we can dynamically get the first input name from the session.
    const inputName = sess.inputNames[0];
    const feeds: Record<string, ort.Tensor> = {};
    feeds[inputName] = tensor;

    // Run inference
    const results = await sess.run(feeds);
    
    // Get output. Typically 'variable' or the first output name
    const outputName = sess.outputNames[0];
    const outputTensor = results[outputName];

    // The prediction is a single float value representing duration_seconds
    const predictedDurationSeconds = outputTensor.data[0] as number;
    return predictedDurationSeconds;
  } catch (err) {
    console.error("[ML] Prediction error:", err);
    return null;
  }
}
