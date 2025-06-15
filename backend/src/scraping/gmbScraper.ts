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

  console.log(`🔍 Récupération des liens des fiches...`);
  
  const businessLinks = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("div.Nv2PK"));
    const links: string[] = [];
    
    cards.forEach((card, index) => {
      const linkEl = card.querySelector('a[href*="/maps/place/"]');
      if (linkEl) {
        const href = (linkEl as HTMLAnchorElement).href;
        if (href && !links.includes(href)) {
          links.push(href);
        }
      }
    });
    
    return links;
  });

  console.log(`📋 ${businessLinks.length} fiches à traiter`);

  const results: GMBResult[] = [];

  for (let i = 0; i < businessLinks.length; i++) {
    const link = businessLinks[i];
    console.log(`📋 ${i + 1}/${businessLinks.length} - Traitement de la fiche...`);
    
    try {
      const detailPage = await browser.newPage();
      
      await detailPage.setRequestInterception(true);
      detailPage.on('request', (req) => {
        const type = req.resourceType();
        if (type === 'image' || type === 'stylesheet' || type === 'font' || type === 'media') {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      await detailPage.goto(link, { waitUntil: "domcontentloaded", timeout: 8000 });
      await setTimeout(1000);
      
      const businessData = await detailPage.evaluate(() => {
        const cleanText = (text: string | null | undefined): string => {
          if (!text) return '';
          return text.trim().replace(/\s+/g, ' ').replace(/\n/g, ' ');
        };

        const cleanAddress = (address: string): string => {
          if (!address) return '';
          
          // Supprimer TOUS les caractères indésirables au début
          let cleaned = address
            .replace(/^[•·\-\s\u2022\u2023\u25E6\u2043\u2219\u00B7\u2024\u2025\u2026]+/, '') // Puces Unicode + middot
            .replace(/^[\s\-•·]+/, '') // Espaces et tirets
            .replace(/^\W+/, '') // Tous caractères non-alphanumériques au début
            .trim();
          
          // Si ça commence encore par des caractères bizarres, prendre après le premier espace
          if (cleaned && /^[^\w\d]/.test(cleaned)) {
            const parts = cleaned.split(' ');
            if (parts.length > 1) {
              cleaned = parts.slice(1).join(' ');
            }
          }
          
          // Nettoyage final : supprimer les puces restantes
          cleaned = cleaned.replace(/^[^\w\d]+/, '').trim();
          
          return cleaned;
        };

        let name = '';
        const nameSelectors = ['h1', '[data-attrid="title"]', '.DUwDvf', '.fontHeadlineLarge'];
        for (const sel of nameSelectors) {
          const el = document.querySelector(sel);
          if (el?.textContent?.trim()) {
            name = cleanText(el.textContent);
            break;
          }
        }

        let address = '';
        const addressSelectors = [
          '[data-item-id="address"]',
          'button[data-item-id="address"]',
          '[data-attrid*="address"]',
          '.rogA2c'
        ];
        
        for (const sel of addressSelectors) {
          const el = document.querySelector(sel);
          if (el?.textContent?.trim()) {
            const rawAddress = cleanText(el.textContent);
            address = cleanAddress(rawAddress);
            if (address && address.length > 5) break;
          }
        }

        let phone = '';
        const phoneSelectors = [
          'button[data-item-id*="phone"]',
          'a[href^="tel:"]',
          'button[aria-label*="téléphone"]',
          'button[aria-label*="phone"]'
        ];
        
        for (const sel of phoneSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            const href = el.getAttribute('href');
            const aria = el.getAttribute('aria-label');
            const text = el.textContent;
            
            if (href?.startsWith('tel:')) {
              phone = href.replace('tel:', '').replace(/[\s.-]/g, '');
              break;
            }
            
            const phoneText = aria || text || '';
            const match = phoneText.match(/0[1-9](?:[\s.-]?\d{2}){4}|[\d\s.-]{10,}/);
            if (match) {
              phone = match[0].replace(/[\s.-]/g, '');
              break;
            }
          }
        }

        let website = '';
        const websiteSelectors = [
          'a[data-item-id="authority"]',
          'a[aria-label*="site"]',
          'button[data-item-id="authority"]'
        ];
        
        for (const sel of websiteSelectors) {
          const el = document.querySelector(sel);
          const href = el?.getAttribute('href');
          if (href?.startsWith('http') && !href.includes('google.com')) {
            website = href;
            break;
          }
        }

        let email = '';
        const emailMatch = document.body.textContent?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          email = emailMatch[0];
        }

        const services: string[] = [];
        if (document.body.textContent?.includes("Services sur place")) services.push("Services sur place");
        if (document.body.textContent?.includes("Devis en ligne")) services.push("Devis en ligne");
        if (document.body.textContent?.includes("Livraison")) services.push("Livraison");

        return {
          name: name || 'Nom non trouvé',
          address: address || undefined,
          phone: phone || undefined,
          website: website || undefined,
          email: email || undefined,
          services: services.length > 0 ? services : undefined
        };
      });

      await detailPage.close();
      
      if (businessData.name !== 'Nom non trouvé') {
        results.push(businessData);
        console.log(`✅ ${businessData.name} | ${businessData.phone || 'Pas de tél'} | ${businessData.website || 'Pas de site'}`);
      }

    } catch (error) {
      console.error(`❌ Erreur fiche ${i + 1}: ${error}`);
    }
  }

  await browser.close();
  
  console.log(`\n🎉 TERMINÉ: ${results.length} résultats détaillés sur ${businessLinks.length} fiches`);
  
  return results;
}
