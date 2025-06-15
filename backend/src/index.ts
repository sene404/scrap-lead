import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { scrapeGMB } from "./scraping/gmbScraper";
import { scrapePJ } from "./scraping/pjScraper";


const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());


app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

type GMBRequestBody = {
  villes: string[];
  secteurs: string[];
};

app.post("/api/gmb", async (req: Request, res: Response) => {
  const { villes, secteurs } = req.body as GMBRequestBody;

  if (!villes || !secteurs) {
    return res.status(400).json({ error: "Villes et secteurs requis" });
  }

  try {
    const results = [];

    for (const ville of villes) {
      for (const secteur of secteurs) {
        const data = await scrapeGMB(ville, secteur);

        const taggedData = data.map((entry) => ({
          ...entry,
          ville,
          secteur,
        }));

        results.push(...taggedData);
      }
    }

    res.json({ success: true, results });
  } catch (err: any) {
    console.error("❌ Scraping error:", err.message);
    res.status(500).json({ error: "Erreur pendant le scraping" });
  }
});


app.post("/api/pj", async (req: Request, res: Response) => {
  const { villes, secteurs } = req.body;

  if (!villes || !secteurs) {
    return res.status(400).json({ error: "Villes et secteurs requis" });
  }

  try {
    const results = [];

    for (const ville of villes) {
      for (const secteur of secteurs) {
        const data = await scrapePJ(ville, secteur);
        results.push(...data);
      }
    }

    res.json({ success: true, results });
  } catch (err: any) {
    console.error("❌ Erreur scraping PJ:", err.message);
    res.status(500).json({ error: "Erreur pendant le scraping PagesJaunes" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
