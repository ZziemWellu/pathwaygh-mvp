"""
Career database models
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, SmallInteger
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
from src.core.database import Base


class Career(Base):
    __tablename__ = "careers"
    
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    field_id = Column(Integer, ForeignKey("career_fields.id"), nullable=True)
    description = Column(Text, nullable=False)
    salary_min_ghc = Column(Integer, nullable=True)
    salary_max_ghc = Column(Integer, nullable=True)
    duration_years = Column(SmallInteger, nullable=True)
    typical_aggregate = Column(SmallInteger, nullable=True)
    future_demand = Column(String(20), nullable=True)
    is_tvet_track = Column(Boolean, default=False)
    
    # Relationships
    field = relationship("CareerField", back_populates="careers", foreign_keys=[field_id])


class CareerField(Base):
    __tablename__ = "career_fields"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True)
    description = Column(Text, nullable=True)
    icon_url = Column(String(500), nullable=True)
    
    # Relationships
    careers = relationship("Career", back_populates="field")


class University(Base):
    __tablename__ = "universities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    abbreviation = Column(String(20), nullable=True)
    type = Column(String(50), nullable=True)
    location = Column(String(100), nullable=True)
    region = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)
    teas_code = Column(String(20), nullable=True)


class UniversityProgramme(Base):
    __tablename__ = "university_programmes"
    
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(Integer, ForeignKey("universities.id"))
    career_id = Column(Integer, ForeignKey("careers.id"))
    programme_name = Column(String(200), nullable=False)
    degree_type = Column(String(50), nullable=True)
    duration_years = Column(SmallInteger, nullable=True)
    is_tvet_track = Column(Boolean, default=False)
    max_aggregate = Column(SmallInteger, nullable=True)


class SubjectRequirement(Base):
    __tablename__ = "subject_requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    programme_id = Column(Integer, ForeignKey("university_programmes.id"))
    subject_name = Column(String(100), nullable=False)
    min_grade = Column(String(5), nullable=True)
    is_mandatory = Column(Boolean, default=True)


class SHSProgramme(Base):
    __tablename__ = "shs_programmes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True)
    core_subjects = Column(ARRAY(String))
    elective_slots = Column(SmallInteger, default=3)
    description = Column(Text, nullable=True)


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    phone_number = Column(String(20), unique=True, nullable=True)
    display_name = Column(String(100), nullable=True)
    school_stage = Column(String(50), nullable=True)
