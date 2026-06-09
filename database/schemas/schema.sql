-- PathwayGH Database Schema for PostgreSQL

-- Drop existing tables if they exist
DROP TABLE IF EXISTS career_recommendations;
DROP TABLE IF EXISTS quiz_responses;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS subject_requirements;
DROP TABLE IF EXISTS university_programmes;
DROP TABLE IF EXISTS universities;
DROP TABLE IF EXISTS careers;
DROP TABLE IF EXISTS career_fields;
DROP TABLE IF EXISTS shs_programmes;

-- Career Fields
CREATE TABLE career_fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Careers
CREATE TABLE careers (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    field_id INTEGER REFERENCES career_fields(id),
    description TEXT NOT NULL,
    salary_min_ghc INTEGER,
    salary_max_ghc INTEGER,
    duration_years SMALLINT,
    typical_aggregate SMALLINT,
    future_demand VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Universities
CREATE TABLE universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    abbreviation VARCHAR(20),
    type VARCHAR(50),
    location VARCHAR(100),
    region VARCHAR(50),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- University Programmes
CREATE TABLE university_programmes (
    id SERIAL PRIMARY KEY,
    university_id INTEGER REFERENCES universities(id),
    career_id INTEGER REFERENCES careers(id),
    programme_name VARCHAR(200) NOT NULL,
    degree_type VARCHAR(50),
    duration_years SMALLINT,
    max_aggregate SMALLINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subject Requirements
CREATE TABLE subject_requirements (
    id SERIAL PRIMARY KEY,
    programme_id INTEGER REFERENCES university_programmes(id),
    subject_name VARCHAR(100) NOT NULL,
    min_grade VARCHAR(5),
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SHS Programmes
CREATE TABLE shs_programmes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE,
    core_subjects TEXT[],
    elective_slots SMALLINT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    display_name VARCHAR(100),
    school_stage VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Profiles
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    shs_programme VARCHAR(100),
    elective_subjects TEXT[],
    wassce_grades JSONB,
    aggregate_score SMALLINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Questions
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20),
    options JSONB,
    order_index SMALLINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Career Fields
INSERT INTO career_fields (name, slug, description) VALUES
('Healthcare', 'healthcare', 'Medical and health-related professions'),
('Technology', 'technology', 'Software, IT, and digital careers'),
('Engineering', 'engineering', 'Civil, mechanical, electrical engineering'),
('Business', 'business', 'Accounting, finance, and management'),
('Legal', 'legal', 'Law and legal services'),
('Education', 'education', 'Teaching and educational leadership'),
('Creative Arts', 'creative-arts', 'Design, architecture, and creative professions'),
('Agriculture', 'agriculture', 'Farming, agribusiness, and food security');

-- Insert Careers
INSERT INTO careers (slug, name, field_id, description, salary_min_ghc, salary_max_ghc, duration_years, typical_aggregate) VALUES
('medical-doctor', 'Medical Doctor', 1, 'Diagnoses and treats illnesses. Requires MBChB degree.', 5000, 15000, 10, 12),
('software-engineer', 'Software Engineer', 2, 'Designs and develops software applications.', 3000, 12000, 4, 18),
('civil-engineer', 'Civil Engineer', 3, 'Designs infrastructure like roads and buildings.', 4000, 12000, 5, 16),
('lawyer', 'Lawyer', 5, 'Represents clients in legal matters.', 5000, 20000, 7, 12),
('accountant', 'Accountant', 4, 'Manages financial records and audits.', 3000, 15000, 4, 16),
('architect', 'Architect', 7, 'Designs buildings and structures.', 4000, 15000, 6, 14),
('nurse', 'Nurse', 1, 'Provides patient care in hospitals and clinics.', 2500, 8000, 4, 18),
('teacher', 'Teacher', 6, 'Educates students at various levels.', 1500, 5000, 4, 24);

-- Insert Universities
INSERT INTO universities (name, abbreviation, type, location, region) VALUES
('University of Ghana', 'UG', 'Public', 'Legon, Accra', 'Greater Accra'),
('Kwame Nkrumah University of Science and Technology', 'KNUST', 'Public', 'Kumasi', 'Ashanti'),
('University of Health and Allied Sciences', 'UHAS', 'Public', 'Ho', 'Volta'),
('University for Development Studies', 'UDS', 'Public', 'Tamale', 'Northern'),
('University of Cape Coast', 'UCC', 'Public', 'Cape Coast', 'Central'),
('Ashesi University', 'Ashesi', 'Private', 'Berekuso', 'Eastern'),
('University of Professional Studies, Accra', 'UPSA', 'Public', 'Accra', 'Greater Accra');

-- Insert SHS Programmes
INSERT INTO shs_programmes (name, code, core_subjects, elective_slots) VALUES
('General Science', 'GEN_SCI', ARRAY['English', 'Core Mathematics', 'Integrated Science', 'Social Studies'], 3),
('General Arts', 'GEN_ARTS', ARRAY['English', 'Core Mathematics', 'Social Studies', 'Literature'], 3),
('Business', 'BUSINESS', ARRAY['English', 'Core Mathematics', 'Social Studies', 'Business Management'], 3),
('Visual Arts', 'VIS_ARTS', ARRAY['English', 'Core Mathematics', 'Social Studies'], 3),
('Technical', 'TECHNICAL', ARRAY['English', 'Core Mathematics', 'Social Studies', 'Technical Drawing'], 3),
('Agricultural Science', 'AGRIC', ARRAY['English', 'Core Mathematics', 'Social Studies', 'Biology'], 3),
('Home Economics', 'HOME_ECON', ARRAY['English', 'Core Mathematics', 'Social Studies'], 3);
