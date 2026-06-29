"""
Scholarship Database for Ghanaian Students
"""

SCHOLARSHIPS = [
    {
        "name": "Mastercard Foundation Scholars Program",
        "provider": "Mastercard Foundation",
        "amount": "Full tuition + living expenses",
        "eligibility": "High-achieving Ghanaian students with leadership potential",
        "deadline": "November",
        "fields": ["All fields"],
        "level": "Undergraduate, Postgraduate",
        "website": "https://mastercardfdn.org",
        "regions": ["All Ghana"],
        "notes": "Focus on students from underserved communities"
    },
    {
        "name": "Ghana Government Scholarship (GETFund)",
        "provider": "Government of Ghana",
        "amount": "Full tuition + stipend",
        "eligibility": "Ghanaian students with good academic records",
        "deadline": "January",
        "fields": ["Science", "Technology", "Engineering", "Mathematics", "Education", "Health"],
        "level": "Undergraduate, Postgraduate",
        "website": "https://getfund.gov.gh",
        "regions": ["All Ghana"],
        "notes": "Apply through your university or district education office"
    },
    {
        "name": "Ashesi University Scholarships",
        "provider": "Ashesi University",
        "amount": "Partial to full tuition",
        "eligibility": "Students with strong academic records and leadership",
        "deadline": "March",
        "fields": ["Computer Science", "Business", "Engineering", "Information Technology"],
        "level": "Undergraduate",
        "website": "https://ashesi.edu.gh",
        "regions": ["All Ghana"],
        "notes": "Need-based and merit-based scholarships available"
    },
    {
        "name": "Ghanaian-Canadian Scholarship",
        "provider": "Canadian Government",
        "amount": "Full tuition + living expenses",
        "eligibility": "Ghanaian students pursuing studies in Canada",
        "deadline": "April",
        "fields": ["All fields"],
        "level": "Undergraduate, Postgraduate",
        "website": "https://www.canada.ca",
        "regions": ["All Ghana"],
        "notes": "Must commit to returning to Ghana after studies"
    },
    {
        "name": "The LEGO Foundation Scholarship",
        "provider": "LEGO Foundation",
        "amount": "Full tuition",
        "eligibility": "Students interested in education and learning",
        "deadline": "February",
        "fields": ["Education", "Psychology", "Child Development"],
        "level": "Undergraduate, Postgraduate",
        "website": "https://lego.com",
        "regions": ["All Ghana"],
        "notes": "Focus on improving education in Ghana"
    },
    {
        "name": "HP Foundation Scholarship",
        "provider": "HP Foundation",
        "amount": "Partial to full tuition",
        "eligibility": "Students in technology-related programs",
        "deadline": "March",
        "fields": ["Computer Science", "Information Technology", "Engineering"],
        "level": "Undergraduate",
        "website": "https://hp.com",
        "regions": ["All Ghana"],
        "notes": "Includes mentorship opportunities"
    },
    {
        "name": "Google Africa Scholarship",
        "provider": "Google",
        "amount": "Full tuition + stipend",
        "eligibility": "African students in technology programs",
        "deadline": "June",
        "fields": ["Computer Science", "Information Technology"],
        "level": "Undergraduate, Postgraduate",
        "website": "https://google.com",
        "regions": ["All Ghana"],
        "notes": "Includes access to Google resources and internships"
    },
    {
        "name": "World Bank Scholarships for Ghana",
        "provider": "World Bank",
        "amount": "Full tuition + living expenses",
        "eligibility": "Students in development-related fields",
        "deadline": "May",
        "fields": ["Development Studies", "Agriculture", "Public Health", "Education"],
        "level": "Postgraduate",
        "website": "https://worldbank.org",
        "regions": ["All Ghana"],
        "notes": "Priority to women and underrepresented groups"
    }
]

def get_scholarships(field: str = None, level: str = None) -> list:
    """Get scholarships filtered by field and level"""
    results = SCHOLARSHIPS.copy()
    
    if field:
        results = [s for s in results if any(f.lower() in field.lower() for f in s['fields'])]
    
    if level:
        results = [s for s in results if level in s['level']]
    
    return results

def find_scholarships_for_career(career: str) -> list:
    """Find scholarships relevant to a specific career"""
    career_fields = {
        "Medical Doctor": ["Health", "Science", "Medicine"],
        "Pharmacist": ["Health", "Science"],
        "Nurse": ["Health", "Science"],
        "Software Engineer": ["Technology", "Computer Science"],
        "Civil Engineer": ["Engineering", "Technology"],
        "Lawyer": ["Law", "Humanities"],
        "Accountant": ["Business", "Finance"],
        "Architect": ["Engineering", "Arts"],
        "Teacher": ["Education", "Humanities"],
        "Agricultural Scientist": ["Agriculture", "Science"]
    }
    
    fields = career_fields.get(career, ["All fields"])
    results = []
    
    for scholarship in SCHOLARSHIPS:
        if any(f in scholarship['fields'] for f in fields) or "All fields" in scholarship['fields']:
            results.append(scholarship)
    
    return results[:5]
