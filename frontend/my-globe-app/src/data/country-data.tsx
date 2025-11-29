import generatedData from './generated-data.json';

// Define the shape of our data (Types)
export interface TopicTrend {
  year: number;
  topicName: string;
  volume: number;
}

export interface CountryStats {
  countryName: string;
  countryCode: string;
  topSubfields: { name: string; totalWorks: number }[];
  uniqueSubfields: { name: string; totalWorks: number; score: number }[];
  trends: Record<string, { year: number; volume: number }[]>;
}

// 1. Cast the imported JSON to our Type
// We use a "Record" type because the JSON is an object where keys are country codes (e.g. "US": {...})
const countryData: Record<string, CountryStats> = generatedData as unknown as Record<string, CountryStats>;

const countryFlags: Record<string, string> = {
  US: "🇺🇸", CN: "🇨🇳", IN: "🇮🇳", DE: "🇩🇪", JP: "🇯🇵",
  GB: "🇬🇧", FR: "🇫🇷", BR: "🇧🇷", IT: "🇮🇹", CA: "🇨🇦",
  RU: "🇷🇺", KR: "🇰🇷", AU: "🇦🇺", ES: "🇪🇸", MX: "🇲🇽",
  ID: "🇮🇩", TR: "🇹🇷", NL: "🇳🇱", SA: "🇸🇦", CH: "🇨🇭",
  SE: "🇸🇪", PL: "🇵🇱", BE: "🇧🇪", AR: "🇦🇷", NO: "🇳🇴",
  // Add more flags if you like, or it defaults to the globe icon
};

export function getCountryData(countryCode: string): CountryStats | null {
  return countryData[countryCode] || null;
}

export function getCountryFlag(countryCode: string): string {
  return countryFlags[countryCode] || "🌍";
}
