"""
Generate synthetic training data for the career recommendation model
Based on real Ghanaian WASSCE patterns and career outcomes
"""

import pandas as pd
import numpy as np
import random
import os

def generate_training_data(n_samples=5000):
    """Generate synthetic student data with career outcomes"""
    
    np.random.seed(42)
    random.seed(42)
    
    # Define features
    subjects = [
        'biology', 'chemistry', 'physics', 'math', 'english',
        'government', 'literature', 'accounting', 'business_management',
        'art', 'agriculture', 'ict'
    ]
    
    interests = [
        'healthcare', 'technology', 'business', 'creative',
        'engineering', 'law', 'education', 'agriculture'
    ]
    
    # ONLY use careers that exist in career_requirements dictionary
    careers = [
        'Medical Doctor', 'Pharmacist', 'Nurse', 'Software Engineer',
        'Civil Engineer', 'Electrical Engineer', 'Lawyer', 'Accountant',
        'Architect', 'Teacher', 'Agricultural Scientist', 'Business Analyst'
    ]
    
    # Career requirements dictionary - ALL careers must be here
    career_requirements = {
        'Medical Doctor': {
            'required_subjects': ['biology', 'chemistry', 'physics'],
            'preferred_interests': ['healthcare', 'science'],
            'min_aggregate': 8,
            'max_aggregate': 12
        },
        'Pharmacist': {
            'required_subjects': ['biology', 'chemistry'],
            'preferred_interests': ['healthcare', 'science'],
            'min_aggregate': 10,
            'max_aggregate': 15
        },
        'Nurse': {
            'required_subjects': ['biology', 'chemistry'],
            'preferred_interests': ['healthcare', 'helping'],
            'min_aggregate': 12,
            'max_aggregate': 18
        },
        'Software Engineer': {
            'required_subjects': ['math', 'ict'],
            'preferred_interests': ['technology', 'problemsolving'],
            'min_aggregate': 12,
            'max_aggregate': 18
        },
        'Civil Engineer': {
            'required_subjects': ['physics', 'math'],
            'preferred_interests': ['engineering', 'building'],
            'min_aggregate': 10,
            'max_aggregate': 16
        },
        'Electrical Engineer': {
            'required_subjects': ['physics', 'math'],
            'preferred_interests': ['engineering', 'technology'],
            'min_aggregate': 10,
            'max_aggregate': 16
        },
        'Lawyer': {
            'required_subjects': ['government', 'literature'],
            'preferred_interests': ['law', 'debating'],
            'min_aggregate': 8,
            'max_aggregate': 12
        },
        'Accountant': {
            'required_subjects': ['accounting', 'business_management', 'math'],
            'preferred_interests': ['business', 'numbers'],
            'min_aggregate': 12,
            'max_aggregate': 20
        },
        'Architect': {
            'required_subjects': ['art', 'math'],
            'preferred_interests': ['creative', 'design'],
            'min_aggregate': 10,
            'max_aggregate': 14
        },
        'Teacher': {
            'required_subjects': ['english', 'math'],
            'preferred_interests': ['education', 'helping'],
            'min_aggregate': 16,
            'max_aggregate': 24
        },
        'Agricultural Scientist': {
            'required_subjects': ['biology', 'chemistry', 'agriculture'],
            'preferred_interests': ['agriculture', 'science'],
            'min_aggregate': 14,
            'max_aggregate': 20
        },
        'Business Analyst': {
            'required_subjects': ['math', 'business_management'],
            'preferred_interests': ['business', 'analytics'],
            'min_aggregate': 14,
            'max_aggregate': 18
        }
    }
    
    data = []
    
    for _ in range(n_samples):
        # Generate random aggregate (lower is better, 6-36 range)
        aggregate = np.random.randint(6, 36)
        
        # Generate subject scores (0-100)
        subject_scores = {}
        for subject in subjects:
            # Base score influenced by aggregate (lower aggregate = better scores)
            base_score = max(60, 100 - (aggregate * 1.5))
            subject_scores[subject] = min(100, max(40, int(np.random.normal(base_score, 15))))
        
        # Generate interest scores
        interest_scores = {}
        for interest in interests:
            interest_scores[interest] = np.random.randint(0, 10)
        
        # Determine career based on aggregate and subjects
        possible_careers = []
        for career, reqs in career_requirements.items():
            # Check aggregate eligibility
            if reqs['min_aggregate'] <= aggregate <= reqs['max_aggregate']:
                # Check subject requirements
                has_required = all(subject_scores.get(subj, 0) >= 60 
                                  for subj in reqs['required_subjects'])
                if has_required:
                    possible_careers.append(career)
        
        # If no career matches, assign based on aggregate range
        if not possible_careers:
            if aggregate <= 12:
                possible_careers = ['Medical Doctor']
            elif aggregate <= 16:
                possible_careers = ['Civil Engineer']
            elif aggregate <= 20:
                possible_careers = ['Accountant']
            else:
                possible_careers = ['Teacher']
        
        # Weighted selection of career
        career_weights = []
        for career in possible_careers:
            reqs = career_requirements.get(career, career_requirements['Teacher'])
            # Calculate fit score
            subject_fit = sum(subject_scores.get(subj, 0) for subj in reqs['required_subjects']) / len(reqs['required_subjects'])
            interest_fit = sum(interest_scores.get(interest, 0) for interest in reqs['preferred_interests']) / len(reqs['preferred_interests'])
            weight = (subject_fit + interest_fit) / 2
            career_weights.append(weight)
        
        # Normalize weights
        total_weight = sum(career_weights)
        if total_weight > 0:
            career_weights = [w/total_weight for w in career_weights]
            selected_career = np.random.choice(possible_careers, p=career_weights)
        else:
            selected_career = possible_careers[0]
        
        # Create feature vector
        features = {
            'aggregate': aggregate,
            **{f'score_{s}': subject_scores[s] for s in subjects},
            **{f'interest_{i}': interest_scores[i] for i in interests}
        }
        features['target'] = selected_career
        
        data.append(features)
    
    df = pd.DataFrame(data)
    
    # Create ml directory if it doesn't exist
    os.makedirs('ml', exist_ok=True)
    
    # Save to CSV
    df.to_csv('ml/training_data.csv', index=False)
    print(f"✅ Generated {len(df)} training samples")
    print(f"\nCareer distribution:")
    print(df['target'].value_counts())
    
    return df

if __name__ == "__main__":
    generate_training_data(5000)
