export async function getRankingForecast(sensitivities: Record<string, number>): Promise<any> {
  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sensitivities })
    });

    if (!response.ok) throw new Error("Institutional simulation failed");
    return await response.json();
  } catch (error) {
    console.error("Local Prediction Error:", error);
    // Base static data if API fails
    return {
      historicalData: [
        { year: 2011, rank: 64, satisfaction: 82, staffRatio: 16.2 },
        { year: 2015, rank: 58, satisfaction: 84, staffRatio: 15.8 },
        { year: 2020, rank: 28, satisfaction: 88, staffRatio: 14.5 },
        { year: 2023, rank: 24, satisfaction: 89, staffRatio: 14.1 },
        { year: 2024, rank: 43, satisfaction: 83.2, staffRatio: 16.8 },
        { year: 2025, rank: 64, satisfaction: 83.2, staffRatio: 16.8 },
      ],
      predictions: [
        { year: 2026, rank: 62, satisfaction: 84, staffRatio: 16.5, reasoning: "Fallback projection logic.", contributingFactors: ["Static Fallback"] }
      ],
      analysisConfidence: 70,
      factorImportance: [{ name: "General Improvement", value: 100 }]
    };
  }
}
