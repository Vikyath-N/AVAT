#!/bin/bash

# Quick test script to validate requirements.txt before deployment

echo "=== Testing Python requirements compatibility ==="

# Create test virtual environment
python3 -m venv test-venv
source test-venv/bin/activate

# Upgrade pip first
pip install --upgrade pip

# Test install with timeout (5 minutes)
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Requirements install successfully!"
    # Test basic imports
    python3 -c "
import pandas as pd
import numpy as np
import sklearn
import fastapi
print('✅ Core imports successful')
    "
else
    echo "❌ Requirements failed to install"
    exit 1
fi

echo "=== Frontend build test ==="
cd frontend

# Test if frontend dependencies can install
echo "Testing frontend dependencies..."
npm install -g pnpm@8.15.8
pnpm install --no-frozen-lockfile

if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully!"
else
    echo "❌ Frontend dependencies failed"
    exit 1
fi

echo "All pre-deployment tests passed! ✅"
