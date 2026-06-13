import { supabase } from '../supabaseClient';

const rawSeedReports = [
  { crop: "Maize", disease: "Fall Armyworm", confidence: "High", state: "Benue", lga: "Makurdi", daysAgo: 0 },
  { crop: "Cassava", disease: "Cassava Mosaic Virus", confidence: "High", state: "Kogi", lga: "Lokoja", daysAgo: 1 },
  { crop: "Tomato", disease: "Tomato Late Blight", confidence: "Medium", state: "Plateau", lga: "Jos North", daysAgo: 2 },
  { crop: "Maize", disease: "Maize Streak Virus", confidence: "Low", state: "Kaduna", lga: "Zaria", daysAgo: 3 },
  { crop: "Yam", disease: "Yam Mosaic Disease", confidence: "Medium", state: "Enugu", lga: "Enugu North", daysAgo: 4 },
  { crop: "Maize", disease: "Fall Armyworm", confidence: "High", state: "Benue", lga: "Gboko", daysAgo: 5 },
  { crop: "Cassava", disease: "Cassava Mosaic Virus", confidence: "Medium", state: "Kogi", lga: "Ankpa", daysAgo: 6 },
  { crop: "Tomato", disease: "Tomato Late Blight", confidence: "High", state: "Oyo", lga: "Ibadan North", daysAgo: 0 },
  { crop: "Maize", disease: "Fall Armyworm", confidence: "High", state: "Benue", lga: "Otukpo", daysAgo: 1 },
  { crop: "Groundnut", disease: "Groundnut Rosette", confidence: "Low", state: "Kaduna", lga: "Kafanchan", daysAgo: 2 },
  { crop: "Rice", disease: "Brown Spot Disease", confidence: "Medium", state: "Niger", lga: "Bida", daysAgo: 3 },
  { crop: "Cassava", disease: "Cassava Mosaic Virus", confidence: "High", state: "Anambra", lga: "Onitsha", daysAgo: 4 },
  { crop: "Maize", disease: "Fall Armyworm", confidence: "Medium", state: "Nasarawa", lga: "Lafia", daysAgo: 5 },
  { crop: "Tomato", disease: "Tomato Late Blight", confidence: "High", state: "Kwara", lga: "Ilorin", daysAgo: 6 },
  { crop: "Yam", disease: "Yam Mosaic Disease", confidence: "Medium", state: "Taraba", lga: "Jalingo", daysAgo: 2 }
];

export async function clearAndSeedDatabase() {
  try {
    // 1. Delete all existing outbreaks & reports
    // NOTE: In Supabase, if tables don't have RLS or we bypass it, this will succeed.
    const { error: deleteOutbreaksErr } = await supabase.from('outbreaks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteOutbreaksErr) console.warn("Delete outbreaks warning:", deleteOutbreaksErr);

    const { error: deleteReportsErr } = await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteReportsErr) console.warn("Delete reports warning:", deleteReportsErr);

    // 2. Prepare reports with spaced timestamps
    const now = new Date();
    const reportsToInsert = rawSeedReports.map((r, idx) => {
      const timestamp = new Date(now.getTime() - r.daysAgo * 24 * 60 * 60 * 1000 - idx * 30 * 60 * 1000);
      return {
        farmer_number: `0803***${Math.floor(1000 + Math.random() * 9000)}`,
        disease: r.disease,
        confidence: r.confidence,
        crop: r.crop,
        state: r.state,
        lga: r.lga,
        status: idx % 3 === 0 ? "Verified" : "Pending",
        timestamp: timestamp.toISOString(),
        image_url: `https://images.unsplash.com/photo-${1500000000000 + idx}?auto=format&fit=crop&w=400&q=80`
      };
    });

    const { data: insertedReports, error: insertReportsErr } = await supabase
      .from('reports')
      .insert(reportsToInsert)
      .select();

    if (insertReportsErr) throw insertReportsErr;

    // 3. Prepare and insert outbreaks based on seed reports
    // We will insert 3 active outbreaks representing the consolidated outbreak data
    const outbreaksToInsert = [
      {
        disease: "Fall Armyworm",
        state: "Benue",
        lga: "Makurdi",
        report_count: 4,
        risk_level: "High",
        farmers_alerted: 0,
        status: "Active",
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        disease: "Cassava Mosaic Virus",
        state: "Kogi",
        lga: "Lokoja",
        report_count: 3,
        risk_level: "Medium",
        farmers_alerted: 0,
        status: "Active",
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        disease: "Tomato Late Blight",
        state: "Oyo",
        lga: "Ibadan North",
        report_count: 3,
        risk_level: "High",
        farmers_alerted: 0,
        status: "Active",
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { error: insertOutbreaksErr } = await supabase
      .from('outbreaks')
      .insert(outbreaksToInsert);

    if (insertOutbreaksErr) throw insertOutbreaksErr;

    return { success: true, count: insertedReports.length };
  } catch (error) {
    console.error("Seeding failed:", error);
    return { success: false, error: error.message };
  }
}
