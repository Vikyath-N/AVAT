#!/usr/bin/env bash
set -euo pipefail
cd /Users/vikyath/Projects/AVAT
export PYTHONPATH=backend
pytest -q backend/tests/unit -x

