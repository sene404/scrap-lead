import puppeteer from "puppeteer";
import { setTimeout } from "node:timers/promises";

type GMBResult = {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  services?: string[];
};

export async function scrapeGMB(
  ville: string,
  secteur: string
): Promise<GMBResult[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  const query = `${secteur} ${ville}`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: "networkidle2" });
  await setTimeout(3000);

  try {
    await page.waitForSelector('button[aria-label="Tout accepter"]', { timeout: 5000 });
    await page.click('button[aria-label="Tout accepter"]');
    console.log("✅ Consentement accepté");
    await setTimeout(2000);
  } catch {
    console.log("ℹ️ Aucun consentement à gérer");
  }

  let previousCount = 0;
  let sameCountCounter = 0;
  while (sameCountCounter < 5) {
    const cards = await page.$$('div.Nv2PK');
    const lastCard = cards[cards.length - 1];
    if (lastCard) {
      await lastCard.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
    await setTimeout(1500);
    const newCount = cards.length;
    if (newCount === previousCount) sameCountCounter++;
    else sameCountCounter = 0;
    previousCount = newCount;
  }

  const rawResults: GMBResult[] = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("div.Nv2PK"));
    return cards.map((card) => {
      const name = card.querySelector(".qBF1Pd")?.textContent?.trim() || "";

      const addressMatch = card.textContent?.match(/\u00b7\s*([^\u00b7]+?)Ouvert/);
      const address = addressMatch ? addressMatch[1].trim() : "";

      const phoneMatch = card.textContent?.match(/0\d(?:\s?\d{2}){4}/);
      const phone = phoneMatch ? phoneMatch[0] : "";

      const websiteLink = Array.from(card.querySelectorAll("a"))
        .find((a) => a.getAttribute("aria-label")?.toLowerCase().includes("site web"))
        ?.getAttribute("href") || undefined;

      const emailMatch = card.textContent?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const email = emailMatch ? emailMatch[0] : undefined;

      const services: string[] = [];
      if (card.textContent?.includes("Services sur place")) services.push("Services sur place");
      if (card.textContent?.includes("Devis en ligne")) services.push("Devis en ligne");

      return { name, address, phone, website: websiteLink, email, services };
    });
  });

  await browser.close();
  return rawResults;
}
