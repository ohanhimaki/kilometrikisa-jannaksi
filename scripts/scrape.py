"""
Hakee joukkueen kilometridata kilometrikisa.fi:stä ja kirjoittaa data.json:iin.
Lukee konfiguraation KilometrikisaJannaksi/wwwroot/appsettings.json:sta.
"""

import urllib.request
import re
import json
import sys
import os
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SETTINGS_PATH = os.path.join(SCRIPT_DIR, "..", "KilometrikisaJannaksi", "wwwroot", "appsettings.json")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "..", "KilometrikisaJannaksi", "wwwroot", "data.json")

def load_settings():
    with open(SETTINGS_PATH, encoding="utf-8") as f:
        return json.load(f)

def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8")

def parse_km(html: str) -> float:
    match = re.search(
        r'Kilometrit yhteen[sä]+</div>\s*([\d\s\u00a0,\.]+)\s*km',
        html
    )
    if not match:
        raise ValueError("Kilometrit yhteensä -kenttää ei löydy sivulta")
    raw = match.group(1).strip().replace("\xa0", "").replace(" ", "").replace(",", ".")
    return float(raw)

def parse_updated(html: str) -> str:
    match = re.search(r'Päivitetty:\s*([\d\.]+\s+[\d:]+)', html)
    return match.group(1).strip() if match else ""

def load_previous_km(output_path: str):
    """Lukee edellisen kilometritYhteensa data.json:sta, tai None jos ei ole."""
    try:
        with open(output_path, encoding="utf-8") as f:
            return json.load(f).get("kilometritYhteensa")
    except Exception:
        return None

def main():
    settings = load_settings()
    url = settings["Kilometrikisa"]["ScrapeUrl"]
    output = os.path.normpath(OUTPUT_PATH)

    prev_km = load_previous_km(output)

    print(f"Haetaan: {url}")
    html = fetch_html(url)
    km = parse_km(html)
    updated = parse_updated(html)
    fetched_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    data = {
        "kilometritYhteensa": km,
        "edellinenKm": prev_km,
        "paivitetty": updated,
        "haettu": fetched_at,
        "lahde": url,
    }

    output = os.path.normpath(OUTPUT_PATH)
    with open(output, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Kirjoitettu {km} km → {output}  (päivitetty: {updated})")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Virhe: {e}", file=sys.stderr)
        sys.exit(1)
