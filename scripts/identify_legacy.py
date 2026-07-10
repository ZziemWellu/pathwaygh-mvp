#!/usr/bin/env python3
"""
Identify legacy endpoints in main.py
"""

import re

with open('../backend/main.py', 'r') as f:
    content = f.read()

# Find all @app decorators
endpoints = re.findall(r'@app\.(get|post|put|delete)\(["\']([^"\']+)["\']\)', content)

print("Legacy endpoints found:")
for method, path in endpoints:
    if 'legacy' in content or 'old' in content:
        print(f"  {method.upper()} {path}")
    elif not any(module in content for module in ['modules', 'services', 'api']):
        print(f"  {method.upper()} {path} (consider moving to modules/)")
