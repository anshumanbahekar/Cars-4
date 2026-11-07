"""Stateless, deterministic daily race configuration for Vercel's Python runtime."""

import json
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler

TRACKS = (
    "Radiator Springs",
    "Copper Canyon",
    "Alpine Pass",
    "Metro Speedway",
    "Thunder Ridge",
)


def challenge_for_date(date: str) -> dict:
    encoded = date.encode("ascii")
    value = 2166136261
    for byte in encoded:
        value = ((value ^ byte) * 16777619) & 0xFFFFFFFF
    track = value % len(TRACKS)
    return {
        "date": date,
        "seed": (value & 0x7FFFFFFF) or 1,
        "map": track,
        "weather": (value >> 8) % 3,
        "difficulty": 1 + ((value >> 16) % 2),
        "title": TRACKS[track],
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        today = datetime.now(timezone.utc).date().isoformat()
        payload = json.dumps(challenge_for_date(today)).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "public, max-age=300, s-maxage=300")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
