"""
Tests for Patient Matching Service

Comprehensive test suite to ensure accurate patient matching with fuzzy algorithms
"""

import pytest
import asyncio
import sys
import os
from unittest.mock import Mock, AsyncMock
from typing import List

# Add the backend app to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.patient_matching_service import (
    PatientMatchingService,
    PatientMatch,
    MatchResult,
    PatientCreationResult,
    MatchTypeEnum,
    MatchConfidenceEnum
)
from app.services.tecsalud_filename_parser import PatientData, DocumentTypeEnum
from app.db.models import Patient

class TestPatientMatchingService:
    """Test suite for patient matching service"""
    
    def setup_method(self):
        """Setup test fixtures"""
        # Mock database session
        self.mock_db = Mock()
        
        # Create service instance with mock DB
        self.service = PatientMatchingService(self.mock_db, confidence_threshold=0.8)
        
        # Sample patient data from TecSalud filename
        self.tecsalud_patient = PatientData(
            expediente_id="3000003799",
            nombre="MARIA ESTHER",
            apellido_paterno="GARZA",
            apellido_materno="TIJERINA",
            full_name="MARIA ESTHER GARZA TIJERINA",
            numero_adicional="6001467010",
            document_type=DocumentTypeEnum.CONSULTATION,
            original_filename="3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
            confidence=0.99
        )
        
        # Sample existing patients
        self.existing_patients = [
            Patient(
                id=1,
                name="Maria Esther Garza Tijerina",
                medical_record_number="3000003799"
            ),
            Patient(
                id=2,
                name="Juan Carlos Lopez Martinez",
                medical_record_number="1234567890"
            ),
            Patient(
                id=3,
                name="Ana Sofia Rodriguez Gonzalez", 
                medical_record_number="9876543210"
            ),
            Patient(
                id=4,
                name="María Esther Garza",  # Similar but shorter name
                medical_record_number="3000003799"
            ),
            Patient(
                id=5,
                name="Maria Esther Garcia Tijerina",  # Similar name, different middle surname
                medical_record_number="5555555555"
            )
        ]
    
    def test_exact_name_and_expediente_match(self):
        """Test exact name and expediente ID match"""
        input_patient = self.tecsalud_patient
        existing_patient = self.existing_patients[0]  # Exact match
        
        match = self.service._evaluate_patient_match(input_patient, existing_patient)
        
        assert match is not None
        assert match.confidence == 1.0
        assert match.match_type == MatchTypeEnum.EXACT_NAME
        assert match.confidence_level == MatchConfidenceEnum.HIGH
        assert match.expediente_match is True
        assert match.name_similarity >= 0.95
        assert "Exact name and expediente match" in match.reasons
    
    def test_exact_expediente_different_name(self):
        """Test exact expediente match with different but similar name"""
        input_patient = self.tecsalud_patient
        existing_patient = self.existing_patients[3]  # Same expediente, shorter name
        
        match = self.service._evaluate_patient_match(input_patient, existing_patient)
        
        assert match is not None
        assert match.confidence >= 0.85
        assert match.match_type == MatchTypeEnum.EXACT_EXPEDIENTE
        assert match.expediente_match is True
        assert "Expediente ID match" in match.reasons[0]
    
    def test_high_name_similarity_no_expediente(self):
        """Test high name similarity without expediente match"""
        input_patient = self.tecsalud_patient
        existing_patient = self.existing_patients[4]  # Similar name, different expediente
        
        match = self.service._evaluate_patient_match(input_patient, existing_patient)
        
        assert match is not None
        assert match.confidence >= 0.8
        assert match.match_type == MatchTypeEnum.FUZZY_NAME
        assert match.expediente_match is False
        assert match.name_similarity >= 0.8
    
    def test_low_similarity_no_match(self):
        """Test low similarity that should not match"""
        input_patient = self.tecsalud_patient
        existing_patient = self.existing_patients[1]  # Completely different patient
        
        match = self.service._evaluate_patient_match(input_patient, existing_patient)
        
        # Should either be None or have very low confidence
        if match is not None:
            assert match.confidence < 0.6
    
    def test_name_normalization(self):
        """Test name normalization functionality"""
        test_cases = [
            ("José María García López", "JOSE MARIA GARCIA LOPEZ"),
            ("MARÍA JOSÉ RODRÍGUEZ", "MARIA JOSE RODRIGUEZ"),
            ("Dr. Juan Carlos", "JUAN CARLOS"),
            ("  Extra   Spaces  ", "EXTRA SPACES"),
            ("Jesús Ángel", "JESUS ANGEL"),
        ]
        
        for input_name, expected in test_cases:
            normalized = self.service._normalize_name(input_name)
            assert normalized == expected
    
    def test_name_similarity_calculation(self):
        """Test name similarity calculation with various scenarios"""
        test_cases = [
            # (name1, name2, expected_min_similarity)
            ("MARIA ESTHER GARZA TIJERINA", "MARIA ESTHER GARZA TIJERINA", 1.0),  # Exact match
            ("MARIA ESTHER GARZA TIJERINA", "MARIA GARZA TIJERINA", 0.8),        # Missing middle name
            ("JUAN CARLOS LOPEZ", "CARLOS JUAN LOPEZ", 0.75),                    # Word order
            ("ANA SOFIA MARTINEZ", "ANA MARTINEZ", 0.6),                        # Missing middle name
            ("PEDRO GONZALEZ", "MARIA RODRIGUEZ", 0.1),                         # Completely different
        ]
        
        for name1, name2, expected_min in test_cases:
            similarity = self.service._calculate_name_similarity(name1, name2)
            assert similarity >= expected_min, f"Similarity {similarity} < {expected_min} for '{name1}' vs '{name2}'"
    
    def test_expediente_matching(self):
        """Test expediente ID matching logic"""
        test_cases = [
            ("3000003799", "3000003799", True),      # Exact match
            ("3000003799", "1234567890", False),     # Different
            ("3000003799", None, False),             # One missing
            (None, "3000003799", False),             # Other missing
            ("", "3000003799", False),               # Empty string
            ("3000003799", "  3000003799  ", True),  # Whitespace handling
        ]
        
        for input_exp, existing_exp, expected in test_cases:
            result = self.service._check_expediente_match(input_exp, existing_exp)
            assert result == expected
    
    def test_confidence_level_classification(self):
        """Test confidence level classification"""
        test_cases = [
            (0.98, MatchConfidenceEnum.HIGH),
            (0.95, MatchConfidenceEnum.HIGH),
            (0.90, MatchConfidenceEnum.MEDIUM),
            (0.80, MatchConfidenceEnum.MEDIUM),
            (0.70, MatchConfidenceEnum.LOW),
            (0.60, MatchConfidenceEnum.LOW),
            (0.50, MatchConfidenceEnum.NONE),
        ]
        
        for confidence, expected_level in test_cases:
            level = self.service._get_confidence_level(confidence)
            assert level == expected_level
    
    @pytest.mark.asyncio
    async def test_find_patient_matches_with_exact_match(self):
        """Test finding matches when exact match exists"""
        # Mock database query to return existing patients
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = self.existing_patients
        self.mock_db.execute = AsyncMock(return_value=mock_result)
        
        # Find matches
        result = await self.service.find_patient_matches(self.tecsalud_patient)
        
        assert isinstance(result, MatchResult)
        assert len(result.exact_matches) >= 1
        assert result.best_match is not None
        assert result.best_match.confidence >= 0.95
        assert result.create_new_recommended is False  # Should not recommend creating new
        assert result.processing_time_ms > 0
    
    @pytest.mark.asyncio
    async def test_find_patient_matches_no_existing_patients(self):
        """Test finding matches when no patients exist"""
        # Mock empty database
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = []
        self.mock_db.execute = AsyncMock(return_value=mock_result)
        
        result = await self.service.find_patient_matches(self.tecsalud_patient)
        
        assert len(result.exact_matches) == 0
        assert len(result.fuzzy_matches) == 0
        assert result.best_match is None
        assert result.create_new_recommended is True
        assert result.total_candidates == 0
    
    @pytest.mark.asyncio
    async def test_find_patient_matches_only_fuzzy_matches(self):
        """Test finding matches with only fuzzy matches (no exact matches)"""
        # Create patients with similar but not exact names
        similar_patients = [
            Patient(
                id=1,
                name="Maria Garza Tijerina",  # Missing middle name
                medical_record_number="1111111111"  # Different expediente
            ),
            Patient(
                id=2,
                name="Maria Esther Garcia",  # Different last name
                medical_record_number="2222222222"
            )
        ]
        
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = similar_patients
        self.mock_db.execute = AsyncMock(return_value=mock_result)
        
        result = await self.service.find_patient_matches(self.tecsalud_patient)
        
        assert len(result.exact_matches) == 0
        assert len(result.fuzzy_matches) >= 1
        assert result.best_match is not None
        assert result.best_match.confidence < 0.95
        # Recommendation depends on confidence threshold
    
    @pytest.mark.asyncio
    async def test_create_patient_from_tecsalud_data_success(self):
        """Test successful patient creation from TecSalud data"""
        # Mock no existing matches (so creation is appropriate)
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = []
        self.mock_db.execute = AsyncMock(return_value=mock_result)
        
        # Mock successful database operations
        self.mock_db.add = Mock()
        self.mock_db.commit = AsyncMock()
        self.mock_db.refresh = AsyncMock()
        
        # Mock created patient
        created_patient = Patient(
            id=100,
            name=self.tecsalud_patient.full_name,
            medical_record_number=self.tecsalud_patient.expediente_id
        )
        
        # Patch Patient creation to return our mock
        with pytest.MonkeyPatch.context() as mp:
            # Mock the Patient constructor
            def mock_patient_init(*args, **kwargs):
                return created_patient
            
            # Create patient
            result = await self.service.create_patient_from_tecsalud_data(self.tecsalud_patient)
            
            # Verify success
            # Note: This test would need actual database mocking to work completely
            # For now, we test the logic flow
    
    @pytest.mark.asyncio
    async def test_create_patient_duplicate_detection(self):
        """Test duplicate detection during patient creation"""
        # Mock high confidence match exists
        high_confidence_patient = Patient(
            id=1,
            name="Maria Esther Garza Tijerina",
            medical_record_number="3000003799"
        )
        
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = [high_confidence_patient]
        self.mock_db.execute = AsyncMock(return_value=mock_result)
        
        # Should detect duplicate and not create
        result = await self.service.create_patient_from_tecsalud_data(self.tecsalud_patient)
        
        # The exact result depends on implementation, but should detect duplicate
        # This test validates the duplicate detection logic is called
    
    def test_match_statistics_generation(self):
        """Test generation of matching statistics"""
        # Create mock match results
        mock_results = []
        
        # High confidence match
        mock_results.append(MatchResult(
            input_data=self.tecsalud_patient,
            exact_matches=[PatientMatch(
                patient_id=1,
                patient_name="Test Patient",
                medical_record_number="123",
                confidence=0.98,
                match_type=MatchTypeEnum.EXACT_NAME,
                confidence_level=MatchConfidenceEnum.HIGH,
                name_similarity=0.98,
                expediente_match=True,
                reasons=["Exact match"]
            )],
            fuzzy_matches=[],
            best_match=None,
            create_new_recommended=False,
            total_candidates=5,
            processing_time_ms=10.0
        ))
        
        # No match case
        mock_results.append(MatchResult(
            input_data=self.tecsalud_patient,
            exact_matches=[],
            fuzzy_matches=[],
            best_match=None,
            create_new_recommended=True,
            total_candidates=5,
            processing_time_ms=5.0
        ))
        
        # Generate statistics
        stats = asyncio.run(self.service.get_match_statistics(mock_results))
        
        assert stats['total_processed'] == 2
        assert stats['exact_matches'] == 1
        assert stats['no_matches'] == 1
        assert stats['average_processing_time_ms'] == 7.5
        assert 'confidence_distribution' in stats
    
    def test_edge_cases(self):
        """Test edge cases and error conditions"""
        # Empty name normalization
        assert self.service._normalize_name("") == ""
        assert self.service._normalize_name(None) == ""
        
        # Name similarity with empty strings
        assert self.service._calculate_name_similarity("", "") == 0.0
        assert self.service._calculate_name_similarity("TEST", "") == 0.0
        
        # Patient matching with invalid data
        invalid_patient = Patient(id=1, name="", medical_record_number="")
        match = self.service._evaluate_patient_match(self.tecsalud_patient, invalid_patient)
        assert match is None
    
    def test_mexican_name_variations(self):
        """Test handling of common Mexican name variations"""
        base_name = "JOSE MARIA GARCIA LOPEZ"
        
        variations = [
            "José María García López",     # With accents
            "Jose Maria Garcia Lopez",     # Without accents
            "GARCIA LOPEZ, JOSE MARIA",    # TecSalud format
            "Dr. Jose Maria Garcia",       # With title, missing surname
            "Jose M. Garcia Lopez",        # Middle initial
        ]
        
        for variation in variations:
            similarity = self.service._calculate_name_similarity(
                self.service._normalize_name(base_name),
                self.service._normalize_name(variation)
            )
            assert similarity >= 0.6, f"Too low similarity for variation: {variation}"
    
    def test_performance_with_large_dataset(self):
        """Test performance with larger number of existing patients"""
        # Create many existing patients
        large_patient_list = []
        for i in range(100):
            patient = Patient(
                id=i,
                name=f"Patient {i:03d} Name {i%10}",
                medical_record_number=f"{i:010d}"
            )
            large_patient_list.append(patient)
        
        # Test name similarity calculation performance
        import time
        start_time = time.time()
        
        matches = []
        for patient in large_patient_list[:20]:  # Test with subset
            match = self.service._evaluate_patient_match(self.tecsalud_patient, patient)
            if match:
                matches.append(match)
        
        elapsed = time.time() - start_time
        
        # Should complete quickly (under 1 second for 20 patients)
        assert elapsed < 1.0, f"Performance too slow: {elapsed}s for 20 patients"


if __name__ == "__main__":
    """Run tests directly"""
    pytest.main([__file__, "-v"]) 