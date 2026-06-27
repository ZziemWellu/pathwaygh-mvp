import re

with open('main.py', 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    # If we find the start of the real-data/recommend function
    if '@app.post("/api/real-data/recommend")' in line:
        new_lines.append(line)
        i += 1
        # Skip the next line (async def...)
        if i < len(lines):
            new_lines.append(lines[i])
            i += 1
        # Now skip until we find the function body
        # Write the correct function body
        new_lines.append('    """Recommend careers using REAL Ghanaian university and employment data"""\n')
        new_lines.append('    \n')
        new_lines.append('    recommendations = real_recommender.recommend(\n')
        new_lines.append('        aggregate=request.aggregate,\n')
        new_lines.append('        interests=request.interests,\n')
        new_lines.append('        subjects=request.subjects\n')
        new_lines.append('    )\n')
        new_lines.append('    \n')
        new_lines.append('    # Get detailed program requirements for each recommendation\n')
        new_lines.append('    for rec in recommendations:\n')
        new_lines.append('        program_data = real_data.get_program_requirements(rec["career"])\n')
        new_lines.append('        rec["career_description"] = program_data.get("career_description", "")\n')
        new_lines.append('        rec["licensing_body"] = program_data.get("licensing_body", "")\n')
        new_lines.append('    \n')
        new_lines.append('    return {\n')
        new_lines.append('        "student_profile": {\n')
        new_lines.append('            "aggregate": request.aggregate,\n')
        new_lines.append('            "interests": request.interests,\n')
        new_lines.append('            "subjects": request.subjects\n')
        new_lines.append('        },\n')
        new_lines.append('        "recommendations": recommendations,\n')
        new_lines.append('        "data_sources": real_data.get_data_sources(),\n')
        new_lines.append('        "methodology": "Recommendations based on actual university admission requirements, WASSCE grading from WAEC Ghana, and labor market data from Ghana Statistical Service"\n')
        new_lines.append('    }\n')
        # Skip the old function body
        while i < len(lines) and not lines[i].strip().startswith('@') and not lines[i].strip().startswith('#'):
            i += 1
        continue
    else:
        new_lines.append(line)
        i += 1

with open('main.py', 'w') as f:
    f.writelines(new_lines)

print("✅ Fixed indentation in main.py")
