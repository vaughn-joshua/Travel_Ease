"""
Fix business coordinates in Supabase PostgreSQL using Nominatim geocoding.

Connects directly to the Supabase Postgres database, reads all businesses,
geocodes each via Nominatim (OpenStreetMap), and updates coordinates when
a verified venue-level match is found.

Usage:
    pip install psycopg2-binary requests
    python scripts/fix_coordinates.py              # dry-run (preview)
    python scripts/fix_coordinates.py --apply      # write to database
"""

import sys
import time
import math
import requests
import psycopg2
import psycopg2.extras

# ── Database config (Supabase direct connection) ─────────────────────────────
DB_URL = (
    "postgresql://postgres.fdrbqgoeldzocifluxcw:ee7TJPreRulbEyrL"
    "@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
)

DRY_RUN = "--apply" not in sys.argv
TAGAYTAY_CENTER = (14.1154, 120.962)

VENUE_CLASSES = {"tourism", "amenity", "shop", "leisure", "building", "office"}

# ── Helpers ──────────────────────────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def is_imprecise(lat: float, lon: float) -> bool:
    lat_d = len(str(lat).split(".")[-1]) if "." in str(lat) else 0
    lon_d = len(str(lon).split(".")[-1]) if "." in str(lon) else 0
    return lat_d <= 3 or lon_d <= 3


def nominatim_search(query: str) -> dict | None:
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"format": "json", "q": query, "countrycodes": "ph", "limit": 1},
            headers={"User-Agent": "TravelEase-CoordFix/1.0"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return data[0] if data else None
    except Exception as e:
        print(f"  ✗ Nominatim error: {e}")
        return None


def is_venue(result: dict) -> bool:
    return result.get("class", "") in VENUE_CLASSES


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  TravelEase — Fix Business Coordinates")
    print(f"  Mode: {'DRY RUN (pass --apply to write)' if DRY_RUN else 'APPLYING CHANGES'}")
    print("=" * 60)

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT business_id, name, latitude, longtitude,
               house_number, street, brgy, city
        FROM business
        WHERE latitude IS NOT NULL AND longtitude IS NOT NULL
        ORDER BY business_id
    """)
    businesses = cur.fetchall()
    print(f"\nFound {len(businesses)} businesses with coordinates.\n")

    updated = 0
    skipped = 0
    no_result = 0

    for b in businesses:
        bid = b["business_id"]
        name = b["name"]
        old_lat = float(b["latitude"])
        old_lon = float(b["longtitude"])
        imprecise = is_imprecise(old_lat, old_lon)

        query = f"{name}, Tagaytay"
        print(f"[{bid}] {name}")
        print(f"  Old: {old_lat}, {old_lon}{'  ⚠ IMPRECISE' if imprecise else ''}")

        time.sleep(1.1)  # Nominatim: 1 req/sec

        result = nominatim_search(query)
        if not result:
            print("  ✗ No Nominatim result\n")
            no_result += 1
            continue

        new_lat = float(result["lat"])
        new_lon = float(result["lon"])
        drift_km = haversine_km(old_lat, old_lon, new_lat, new_lon)
        drift_m = int(drift_km * 1000)
        venue = is_venue(result)
        osm_class = result.get("class", "?")
        osm_type = result.get("type", "?")
        label = result.get("display_name", "")[:80]

        print(f"  Found: {new_lat:.6f}, {new_lon:.6f} [{osm_class}/{osm_type}]")
        print(f'         "{label}"')
        print(f"  Drift: {drift_m}m | Venue: {venue}")

        dist_from_center = haversine_km(*TAGAYTAY_CENTER, new_lat, new_lon)
        within_area = dist_from_center < 10
        drift_ok = drift_km < 6
        should_update = venue and within_area and drift_ok and (imprecise or drift_km > 0.1)

        if should_update:
            if not DRY_RUN:
                cur.execute(
                    "UPDATE business SET latitude = %s, longtitude = %s WHERE business_id = %s",
                    (new_lat, new_lon, bid),
                )
            action = "WOULD UPDATE" if DRY_RUN else "UPDATED"
            print(f"  → {action} ✓\n")
            updated += 1
        else:
            if not venue:
                reason = "not a venue result"
            elif not within_area:
                reason = "outside Tagaytay area"
            elif not drift_ok:
                reason = "drift too large (wrong match)"
            else:
                reason = "already precise & close"
            print(f"  → KEEP ({reason})\n")
            skipped += 1

    cur.close()
    conn.close()

    print("─" * 50)
    print(f"Updated: {updated}  Skipped: {skipped}  No result: {no_result}")
    if DRY_RUN and updated > 0:
        print(f"\nRun with --apply to write changes to the database.")


if __name__ == "__main__":
    main()
