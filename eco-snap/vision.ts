// vision.ts
import * as FileSystem from "expo-file-system/legacy"; // ✅ use legacy shim
import Constants from "expo-constants";

export type VisionLabel = { description: string; score: number };

export async function analyzeWithVision(
  fileUri: string,
  maxResults = 6
): Promise<VisionLabel[]> {
  const API_KEY = Constants.expoConfig?.extra?.googleVisionApiKey as
    | string
    | undefined;
  if (!API_KEY) {
    throw new Error(
      "Missing googleVisionApiKey (check .env and app.config.js)."
    );
  }

  // ✅ no EncodingType enum in SDK 54 – use the string literal
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: "base64",
  });

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "LABEL_DETECTION", maxResults }],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Vision ${res.status}: ${msg}`);
  }

  const json = await res.json();
  const anns: any[] = json?.responses?.[0]?.labelAnnotations ?? [];
  return anns.map((a) => ({
    description: String(a.description ?? ""),
    score: Number(a.score ?? 0),
  }));
}
