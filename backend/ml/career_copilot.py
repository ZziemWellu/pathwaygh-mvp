"""
AI Career Copilot - GPT-4o-mini powered career advisor
Uses RAG for grounded recommendations
"""

import os
from typing import Dict, List, Optional

class CareerCopilot:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.enabled = bool(self.api_key)
        
        if self.enabled:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
                print("✅ AI Career Copilot ready (GPT-4o-mini)")
            except ImportError:
                print("⚠️ OpenAI not installed")
                self.enabled = False
        else:
            print("⚠️ No OpenAI API key. Copilot running in offline mode.")
    
    def get_guidance(self, student_profile: Dict, top_careers: List[Dict]) -> Dict:
        """Generate personalized career guidance using RAG + GPT"""
        
        if not self.enabled or not self.api_key:
            return self._offline_guidance(top_careers)
        
        try:
            # Build context from knowledge base
            from ml.rag_knowledge_base import rag_kb
            
            context = ""
            for career in top_careers[:3]:
                career_name = career.get('career', '')
                info = rag_kb.retrieve_career_info(career_name)
                if info:
                    context += f"\n{career_name}: {info.get('description', '')} Requirements: {info.get('requirements', '')}"
            
            prompt = f"""You are a friendly, knowledgeable career advisor for Ghanaian students.

STUDENT PROFILE:
- WASSCE Aggregate: {student_profile.get('aggregate', 'N/A')} (lower is better)
- Interests: {', '.join(student_profile.get('interests', []))}
- Strong Subjects: {', '.join(student_profile.get('strong_subjects', []))}

TOP CAREER MATCHES (from our recommendation engine):
{context}

Based on this student's profile, provide personalized guidance that:
1. Explains why their top career is a good fit
2. Mentions specific universities in Ghana
3. Gives 1-2 actionable next steps
4. Is encouraging and Ghanaian in tone

Keep response under 150 words. Be specific and practical."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a career advisor for Ghanaian students. Be encouraging, practical, and specific to Ghana."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=250,
                temperature=0.7
            )
            
            return {
                "guidance": response.choices[0].message.content.strip(),
                "source": "GPT-4o-mini with RAG",
                "enabled": True
            }
            
        except Exception as e:
            print(f"GPT error: {e}")
            return self._offline_guidance(top_careers)
    
    def _offline_guidance(self, top_careers: List[Dict]) -> Dict:
        """Offline fallback guidance"""
        if not top_careers:
            return {"guidance": "Complete your profile to get personalized career guidance.", "source": "offline"}
        
        top = top_careers[0]
        career = top.get('career', 'this career')
        confidence = top.get('confidence', 70)
        
        guidance = f"Based on your profile, {career} is an excellent fit ({confidence}% match). "
        
        if career == "Medical Doctor":
            guidance += "Focus on achieving excellent grades in Biology, Chemistry, and Physics. Consider volunteering at local hospitals. Top universities: UG, KNUST, UHAS."
        elif career == "Software Engineer":
            guidance += "Start learning programming online. Build small projects. Top universities: UG, KNUST, Ashesi."
        elif career == "Lawyer":
            guidance += "Develop your debating and writing skills. Top universities: UG Law, KNUST Law."
        else:
            guidance += f"Research {career} programs at Ghanaian universities. Speak to professionals in this field."
        
        return {"guidance": guidance, "source": "offline (smart rules)", "enabled": False}

copilot = CareerCopilot()
