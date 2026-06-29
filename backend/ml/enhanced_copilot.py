"""
Enhanced AI Career Copilot with Real LLM Integration
Uses OpenAI GPT-4o-mini with RAG context for personalized guidance
"""

import os
import json
from typing import Dict, List, Optional
from pathlib import Path

class EnhancedCareerCopilot:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.enabled = bool(self.api_key)
        self.client = None
        
        if self.enabled:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
                print("✅ Enhanced AI Copilot ready with GPT-4o-mini")
            except ImportError:
                print("⚠️ OpenAI package not installed")
                self.enabled = False
        else:
            print("⚠️ No OpenAI API key. Running in offline mode.")
    
    def get_guidance(self, student_profile: Dict, top_careers: List[Dict], context: Dict = None) -> Dict:
        """Generate personalized career guidance using GPT-4o-mini with RAG context"""
        
        if not self.enabled or not self.api_key:
            return self._offline_guidance(top_careers)
        
        try:
            # Build RAG context from career data
            rag_context = self._build_rag_context(top_careers)
            
            # Build prompt with student profile
            prompt = self._build_prompt(student_profile, top_careers, rag_context)
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": """You are a friendly, knowledgeable career advisor for Ghanaian students. 
                    You have access to real Ghanaian university admission data, WASSCE requirements, and labor market information.
                    Provide practical, encouraging, and specific advice. Be warm and Ghanaian in your tone."""},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
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
    
    def _build_rag_context(self, top_careers: List[Dict]) -> str:
        """Build RAG context from career data"""
        context_parts = []
        for career in top_careers[:3]:
            name = career.get('career', '')
            uni = career.get('best_university', {})
            demand = career.get('demand', '')
            salary = career.get('salary_range', '')
            
            if uni:
                context_parts.append(f"{name} at {uni.get('name', '')} requires aggregate ≤{uni.get('cutoff', 'N/A')}")
            if demand:
                context_parts.append(f"Demand: {demand}")
            if salary:
                context_parts.append(f"Salary: {salary}")
        
        return " | ".join(context_parts) if context_parts else "Career data available"
    
    def _build_prompt(self, profile: Dict, careers: List[Dict], rag_context: str) -> str:
        """Build the GPT prompt"""
        aggregate = profile.get('aggregate', 'N/A')
        interests = ', '.join(profile.get('interests', []))
        subjects = ', '.join(profile.get('subjects', []))
        
        top_career = careers[0].get('career', '') if careers else ''
        
        return f"""
        Student Profile:
        - WASSCE Aggregate: {aggregate} (lower is better)
        - Interests: {interests}
        - Subjects: {subjects}
        
        Top Career Match: {top_career}
        
        RAG Context (from Ghanaian data):
        {rag_context}
        
        Please provide:
        1. Encouraging career guidance for this student
        2. Specific universities in Ghana that offer this program
        3. Practical next steps (1-2 actions)
        4. Motivation for their journey
        
        Keep it under 200 words. Be specific to Ghana.
        """
    
    def _offline_guidance(self, top_careers: List[Dict]) -> Dict:
        """Fallback offline guidance"""
        if not top_careers:
            return {"guidance": "Complete your profile to get personalized guidance.", "source": "offline"}
        
        top = top_careers[0]
        career = top.get('career', 'this career')
        confidence = top.get('confidence', 70)
        uni = top.get('best_university', {})
        
        guidance = f"Based on your profile, {career} is an excellent fit ({confidence}% match). "
        
        if uni:
            guidance += f"Consider applying to {uni.get('name', 'universities in Ghana')}. "
        
        if career == "Medical Doctor":
            guidance += "Focus on achieving excellent grades in Biology, Chemistry, and Physics. Consider volunteering at local hospitals. Top universities: UG, KNUST, UHAS."
        elif career == "Software Engineer":
            guidance += "Start learning programming online. Build small projects. Top universities: UG, KNUST, Ashesi."
        elif career == "Lawyer":
            guidance += "Develop your debating and writing skills. Top universities: UG Law, KNUST Law."
        else:
            guidance += f"Research {career} programs at Ghanaian universities. Speak to professionals in this field."
        
        return {"guidance": guidance, "source": "offline (smart rules)", "enabled": False}
    
    def chat(self, message: str, context: Dict = None) -> Dict:
        """Interactive chat with AI Career Copilot"""
        if not self.enabled:
            return {"reply": "Add your OpenAI API key to enable the AI Copilot.", "source": "offline"}
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": """You are a career advisor for Ghanaian students. 
                    Use real Ghanaian data. Be helpful, specific, and encouraging. 
                    If you don't know, say so and suggest checking university websites."""},
                    {"role": "user", "content": message}
                ],
                max_tokens=250,
                temperature=0.7
            )
            return {"reply": response.choices[0].message.content.strip(), "source": "GPT-4o-mini"}
        except Exception as e:
            return {"reply": f"Sorry, I'm having trouble. Please try again. Error: {str(e)[:100]}", "source": "error"}

# Singleton instance
enhanced_copilot = EnhancedCareerCopilot()
