# AGENTS.md

Ohjeet AI-agenteille tämän repon kanssa työskentelyyn.

## Projektin kuvaus

Blazor WebAssembly -sovellus, joka näyttää Pinja-joukkueen Kilometrikisa-tilanteen kartalla. Sivu hakee km-datan GitHub Actionsin kautta scrapetusti ja näyttää edistymisen reitillä Oulu → MAALI.

**Live-osoite:** https://ohanhimaki.github.io/kilometrikisa-jannaksi

## Rakenne

```
KilometrikisaJannaksi/          # Blazor WASM -projekti (ainoa frontend)
  Pages/Home.razor               # Pääsivu – kaikki logiikka täällä
  wwwroot/
    appsettings.json             # ← KONFIGURAATIO: reitti, tavoite, pysäkit
    data.json                    # Scrapattu km-data (GitHub Actions päivittää)
    css/app.css                  # Kaikki tyylit, CSS-muuttujat :root:ssa
    js/map.js                    # Leaflet-karttalogiikka (vanilla JS)
    index.html                   # HTML-pohja, CDN-linkit (Bootstrap, Leaflet)

scripts/
  scrape.py                      # Python-scripti joka hakee km:t kilometrikisa.fi:stä

.github/workflows/
  deploy.yml                     # Push masteriin → scrape → build → gh-pages deploy
  fetch-data.yml                 # Ajastus yöllä → scrape → commit data.json → triggeröi deploy
```

> `KilometrikisaJannaksi.Api/` on jäänne, sitä ei käytetä eikä committata (.gitignore).

## Build ja kehitys

```bash
# Käynnistä dev-serveri
cd KilometrikisaJannaksi
dotnet run

# Build
dotnet build

# Testaa scrappaus manuaalisesti
python3 scripts/scrape.py
```

Ei erillistä testisuiteа. Buildatessa 0 warningia/erroria on riittävä testi.

## Konfiguraation muuttaminen

Kaikki muokattavissa `KilometrikisaJannaksi/wwwroot/appsettings.json`:ssa:

| Kenttä | Kuvaus |
|---|---|
| `Kilometrikisa.ScrapeUrl` | Kilometrikisa.fi-joukkuesivu (vaihda joukkue tai vuosi) |
| `Kilometrikisa.TavoiteKm` | Yhteinen km-tavoite |
| `Kilometrikisa.Stops` | Reitin pysäkit: nimi, km-etäisyys lähdöstä, koordinaatit |

`scrape.py` lukee `ScrapeUrl`:n automaattisesti samasta tiedostosta.

## GitHub Pages -julkaisu

Deploy tapahtuu automaattisesti kun pushataan `master`-haaraan.

- **Base path** on `/kilometrikisa-jannaksi/` – asetettu `deploy.yml`:ssä (`GH_PAGES_BASE`-muuttuja)
- Workflow scrapaa tuoreen datan ennen buildia
- `gh-pages`-haara sisältää julkaistun buildin

Jos repon nimi muuttuu, päivitä `deploy.yml`:n `GH_PAGES_BASE`-muuttuja.

## Arkkitehtuurihuomiot

- **Kartta:** Leaflet.js + OpenStreetMap, ei API-avainta tarvita
- **Viiva-interpolointi:** `map.js` laskee pyöräilijän sijainnin täsmälleen oikeaan kohtaan pysäkkien välille km-arvon perusteella
- **Oranssi viiva** = edistys edellisestä sivulatauksesta; tallennetaan `localStorage`-avaimeen `kk_last_seen_km`
- **Kartan alustus:** käytetään `mapInitialized`-lippua eikä `firstRender`-parametria, koska data ladataan asynkronisesti HTTP:llä ja `OnAfterRenderAsync(firstRender=true)` palaa ennen datan saapumista
- Bootstrap-CSS tulee CDN:stä, ei committata `lib/`-kansiota

## Yleisiä muutoksia

**Vaihda joukkue/vuosi:**
1. Muuta `ScrapeUrl` → `appsettings.json`
2. Push → deploy päivittää automaattisesti

**Lisää/muuta pysäkkejä:**
1. Muuta `Stops`-lista → `appsettings.json` (nimi + km + lat/lng)
2. Push → valmis

**Muuta värejä:**
- CSS-muuttujat löytyvät `app.css`:n `:root`-lohkosta
