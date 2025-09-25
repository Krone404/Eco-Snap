// inat.ts
export type InatTaxon = {
  id: number;
  name: string;
  preferred_common_name?: string;
  wikipedia_url?: string;
  default_photo?: {
    square_url?: string;
    medium_url?: string;
  };
};

export async function searchInat(query: string): Promise<InatTaxon | null> {
  try {
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(
      query
    )}&per_page=1`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`iNat error: ${res.status}`);
    }
    const json = await res.json();
    if (json.results && json.results.length > 0) {
      return json.results[0] as InatTaxon;
    }
    return null;
  } catch (e) {
    console.error("iNat search failed", e);
    return null;
  }
}
