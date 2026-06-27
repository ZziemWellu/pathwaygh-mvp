"""
GPT-4o-mini Integration for Career Guidance
Uses modern OpenAI SDK (v1.0+)
"""

import os
from typing import Dict, List, Optional

class GPTEnhancer:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.enabled = bool(self.api_key)
        
        if self.enabled:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
                print("✅ GPT-4o-mini enhancer ready")
            except ImportError:
                print("⚠️ OpenAI package not installed")
                self.enabled = False
        else:
            print("⚠️ No OpenAI API key found. GPT enhancement disabled.")
    
    def generate_personalized_guidance(
        self,
        student_aggregate: int,
        student_interests: List[str],
        student_subjects: List[str],
        top_career: Dict
    ) -> Optional[str]:
        """
        Generate personalized career guidance using GPT-4o-mini
        Used ONLY for explanation, NOT for recommendation
        """
        
        if not self.enabled:
            return self._fallback_guidance(top_career)
        
        try:
            prompt = f"""You are a friendly, encouraging career advisor for Ghanaian students.

Student Profile:
- WASSCE Aggregate: {student_aggregate} (lower is better)
- Interests: {', '.join(student_interests)}
- Subjects taken: {', '.join(student_subjects)}

AI Model's Top Career Recommendation: {top_career.get('career', 'Unknown')}
Career Field: {top_career.get('field', 'N/A')}
Typical Aggregate Required: ≤{top_career.get('typical_aggregate', 'N/A')}
Universities in Ghana: {', '.join(top_career.get('universities', ['UG', 'KNUST'])[:3])}

Write a short, encouraging response (3-4 sentences) that:
1. Explains why this career fits their profile
2. Mentions specific opportunities in Ghana
3. Gives ONE actionable next step

Be warm, specific, and Ghanaian in tone."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a career advisor for Ghanaian students. Be encouraging, practical, and specific to Ghana."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
        
        except Exception as e:
            print(f"GPT error: {e}")
            return self._fallback_guidance(top_career)
    
    def _fallback_guidance(self, top_career: Dict) -> str:
        """Fallback when GPT is unavailable"""
        career_name = top_career.get('career', 'this career')
        universities = top_career.get('universities', ['a good university'])[:2]
        
        return f"Based on your profile, {career_name} is an excellent fit. Focus on achieving strong grades in your science/math subjects. Consider applying to {', '.join(universities)}. Research the specific requirements and speak to a career counsellor at your school."

# Singleton
gpt_enhancer = GPTEnhancer()
