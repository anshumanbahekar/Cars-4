import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from api.challenge import challenge_for_date


class ChallengeTests(unittest.TestCase):
    def test_same_day_has_same_track(self):
        self.assertEqual(challenge_for_date("2026-11-07"), challenge_for_date("2026-11-07"))

    def test_values_fit_game_options(self):
        result = challenge_for_date("2026-11-07")
        self.assertGreater(result["seed"], 0)
        self.assertIn(result["map"], range(5))
        self.assertIn(result["weather"], range(3))
        self.assertIn(result["difficulty"], range(1, 3))


if __name__ == "__main__":
    unittest.main()
