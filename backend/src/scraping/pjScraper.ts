import puppeteer, { Page } from "puppeteer";
import { setTimeout } from "node:timers/promises";

export type PJResult = {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
};

const randomDelay = (min: number, max: number) => 
  setTimeout(Math.floor(Math.random() * (max - min + 1)) + min);

const fastHumanDelay = () => randomDelay(500, 1200);
const slowHumanDelay = () => randomDelay(1500, 2500);

export async function scrapePJ(ville: string, secteur: string): Promise<PJResult[]> {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--window-size=1920,1080'
      ]
    });
    
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    const baseUrl = `https://www.118712.fr/recherche/auto/${encodeURIComponent(ville)}/${encodeURIComponent(secteur)}`;
    console.log(`🔍 Navigation vers: ${baseUrl}`);
    
    await page.goto(baseUrl, { 
      waitUntil: "domcontentloaded",
      timeout: 20000 
    });
    
    await setTimeout(2000);

    const cookiesAccepted = await handleCookiesFast(page);
    if (!cookiesAccepted) {
      console.warn("⚠️ Cookies non acceptés, continuation...");
    }

    await setTimeout(1000);

    const allResults: PJResult[] = [];
    let currentPage = 1;
    const maxPages = 10; // Augmenter pour plus de résultats

    while (currentPage <= maxPages) {
      console.log(`📄 Traitement de la page ${currentPage}`);

      // Attendre que les résultats se chargent
      const links = await findCompanyLinksFast(page);

      if (links.length === 0) {
        console.warn(`⚠️ Aucun lien d'entreprise trouvé sur la page ${currentPage}`);
        break;
      }

      console.log(`📋 ${links.length} entreprises trouvées sur la page ${currentPage}`);

      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        console.log(`🔄 Traitement ${i + 1}/${links.length} (Page ${currentPage})`);
        
        try {
          await page.goto(link, { 
            waitUntil: "domcontentloaded",
            timeout: 10000 
          });
          
          await fastHumanDelay();

          const data = await extractCompanyDataFast(page);
          
          if (data.name) {
            allResults.push(data);
            console.log(`✅ ${data.name} | ${data.phone || 'Pas de tél'} | ${data.address || 'Pas d\'adresse'}`);
          } else {
            console.warn(`⚠️ Données incomplètes pour: ${link}`);
          }

          await page.goBack({ 
            waitUntil: "domcontentloaded",
            timeout: 8000 
          });
          
          await fastHumanDelay();
          
        } catch (error) {
          console.error(`❌ Erreur fiche ${i + 1}:`, (error as Error).message);
          try {
            await page.goto(baseUrl + (currentPage > 1 ? `?page=${currentPage}` : ''), { 
              waitUntil: "domcontentloaded",
              timeout: 8000 
            });
            await fastHumanDelay();
          } catch (navError) {
            console.error("❌ Erreur critique de navigation");
            break;
          }
          continue;
        }
      }

      const nextPageSuccess = await goToNextPage(page, currentPage);
      if (!nextPageSuccess) {
        console.log("📄 Fin de pagination détectée");
        break;
      }

      currentPage++;
      await slowHumanDelay(); 
    }

    console.log(`🎉 Scraping terminé: ${allResults.length} entreprises récupérées sur ${currentPage} pages`);
    return allResults;

  } catch (error) {
    console.error("❌ Erreur générale du scraper:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function handleCookiesFast(page: Page): Promise<boolean> {
  try {
    console.log("🍪 Acceptation rapide des cookies...");

    const cookieAccepted = await page.evaluate(() => {
      const cookieBtn = document.querySelector('#privacy-cookie-banner__privacy-accept') as HTMLButtonElement;
      if (cookieBtn) {
        cookieBtn.click();
        return true;
      }
      return false;
    });

    if (cookieAccepted) {
      console.log("✅ Cookies acceptés");
      await setTimeout(1000);
      return true;
    }

    await page.evaluate(() => {
      const modals = document.querySelectorAll('.modal, [class*="modal"], [id*="cookie"], [class*="cookie"]');
      modals.forEach(modal => {
        if (modal instanceof HTMLElement) {
          modal.style.display = 'none';
          modal.remove();
        }
      });
    });

    return false;
  } catch (error) {
    console.warn("⚠️ Erreur cookies:", (error as Error).message);
    return false;
  }
}

async function findCompanyLinksFast(page: Page): Promise<string[]> {
  try {
    await page.waitForSelector('a[href*="/professionnels/"]', { timeout: 8000 });
    
    const links = await page.$$eval('a[href*="/professionnels/"]', (elements) =>
      elements
        .map((el) => (el as HTMLAnchorElement).href)
        .filter(href => href && href.includes('/professionnels/'))
        .slice(0, 20) // Limiter pour éviter les timeouts
    );

    console.log(`🔍 ${links.length} liens trouvés avec sélecteur optimisé`);
    return links;

  } catch (error) {
    console.warn("⚠️ Sélecteur principal échoué, tentative fallback...");
    
    try {
      const fallbackLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'))
          .map(a => a.href)
          .filter(href => href && href.includes('118712.fr') && href.includes('/professionnels/'))
          .slice(0, 20);
        return links;
      });
      
      console.log(`🔍 Fallback: ${fallbackLinks.length} liens trouvés`);
      return fallbackLinks;
    } catch (fallbackError) {
      console.error("❌ Impossible de trouver des liens");
      return [];
    }
  }
}

async function goToNextPage(page: Page, currentPage: number): Promise<boolean> {
  try {
    console.log(`➡️ Recherche du bouton page suivante...`);

    const nextButton = await page.$('button.len1.adpJam[onclick*="changePageUseCurrentBounds"]');
    
    if (nextButton) {
      const buttonText = await page.evaluate(el => el.textContent, nextButton);
      
      if (buttonText && buttonText.includes('Page suivante')) {
        console.log("🔄 Clic sur 'Page suivante'");
        
        await nextButton.scrollIntoView();
        await setTimeout(500);
        
        await nextButton.click();
        
        await page.waitForNavigation({ 
          waitUntil: "domcontentloaded", 
          timeout: 10000 
        });
        
        console.log(`✅ Navigation vers page ${currentPage + 1} réussie`);
        return true;
      }
    }

    const jsNavigation = await page.evaluate((pageNum) => {
      const globalThis = window as any;
      if (typeof globalThis.changePageUseCurrentBounds === 'function') {
        globalThis.changePageUseCurrentBounds(pageNum + 1);
        return true;
      }
      return false;
    }, currentPage);

    if (jsNavigation) {
      await setTimeout(2000);
      console.log(`✅ Navigation JS vers page ${currentPage + 1}`);
      return true;
    }

    console.log("⚠️ Bouton page suivante non trouvé");
    return false;

  } catch (error) {
    console.warn(`⚠️ Erreur navigation page suivante:`, (error as Error).message);
    return false;
  }
}

async function extractCompanyDataFast(page: Page): Promise<PJResult> {
  try {
    await revealPhoneNumberFast(page);

    return await page.evaluate(() => {
      const cleanText = (text: string | null | undefined): string => {
        return text?.trim().replace(/\s+/g, ' ') ?? '';
      };

      const name = document.querySelector('h1.h2')?.textContent || 
                   document.querySelector('h1')?.textContent || '';

      const address = document.querySelector('.adress_label')?.textContent || '';

      const phoneElement = document.querySelector('a[href^="tel:"]');
      const phone = phoneElement?.textContent?.replace(/^(Appeler le\s*|Tel\s*:?\s*)/i, '') || '';

      const website = document.querySelector('.website_label')?.textContent || '';
      const formattedWebsite = website && !website.startsWith('http') ? 'http://' + website : website;

      return {
        name: cleanText(name),
        address: cleanText(address),
        phone: cleanText(phone),
        website: formattedWebsite
      };
    });

  } catch (error) {
    console.error("❌ Erreur extraction:", (error as Error).message);
    return { name: '', address: '', phone: '', website: '' };
  }
}

// Fonction optimisée pour révéler le téléphone rapidement
async function revealPhoneNumberFast(page: Page): Promise<void> {
  try {
    const phoneRevealed = await page.evaluate(() => {
      const phoneButton = document.querySelector('a[href="javascript:void(0)"]') as HTMLElement;
      if (phoneButton && phoneButton.textContent?.includes('Afficher le n°')) {
        phoneButton.click();
        return true;
      }
      return false;
    });

    if (phoneRevealed) {
      await setTimeout(800); 
    }
  } catch (error) {
  }
}
