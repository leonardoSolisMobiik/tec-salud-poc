"""
Tests for TecSalud Filename Parser Service

Comprehensive test suite to ensure 99% accuracy in parsing TecSalud filenames
"""

import pytest
import sys
import os

# Add the backend app to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.tecsalud_filename_parser import (
    TecSaludFilenameParser,
    TecSaludFilenameService,
    PatientData,
    ParseResult,
    DocumentTypeEnum
)

class TestTecSaludFilenameParser:
    """Test suite for TecSalud filename parser"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.parser = TecSaludFilenameParser()
    
    def test_valid_standard_filename(self):
        """Test parsing of standard TecSalud filename"""
        filename = "3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf"
        result = self.parser.parse_filename(filename)
        
        assert result.success is True
        assert result.patient_data is not None
        assert result.patient_data.expediente_id == "3000003799"
        assert result.patient_data.nombre == "MARIA ESTHER"
        assert result.patient_data.apellido_paterno == "GARZA"
        assert result.patient_data.apellido_materno == "TIJERINA"
        assert result.patient_data.full_name == "MARIA ESTHER GARZA TIJERINA"
        assert result.patient_data.numero_adicional == "6001467010"
        assert result.patient_data.document_type == DocumentTypeEnum.CONSULTATION
        assert result.patient_data.confidence == 0.99
    
    def test_valid_filename_with_single_apellido(self):
        """Test parsing filename with single apellido"""
        filename = "1234567890_LOPEZ, JUAN CARLOS_123456_LAB.pdf"
        result = self.parser.parse_filename(filename)
        
        assert result.success is True
        assert result.patient_data.nombre == "JUAN CARLOS"
        assert result.patient_data.apellido_paterno == "LOPEZ"
        assert result.patient_data.apellido_materno == ""
        assert result.patient_data.full_name == "JUAN CARLOS LOPEZ"
        assert result.patient_data.document_type == DocumentTypeEnum.LAB_RESULTS
    
    def test_valid_filename_with_multiple_apellidos(self):
        """Test parsing filename with multiple apellidos"""
        filename = "9876543210_MARTINEZ GONZALEZ RODRIGUEZ, ANA SOFIA_987654_IMG.pdf"
        result = self.parser.parse_filename(filename)
        
        assert result.success is True
        assert result.patient_data.nombre == "ANA SOFIA"
        assert result.patient_data.apellido_paterno == "MARTINEZ"
        assert result.patient_data.apellido_materno == "GONZALEZ RODRIGUEZ"
        assert result.patient_data.full_name == "ANA SOFIA MARTINEZ GONZALEZ RODRIGUEZ"
        assert result.patient_data.document_type == DocumentTypeEnum.IMAGING
    
    def test_valid_filename_emergency_document(self):
        """Test parsing emergency document"""
        filename = "5555555555_GARCIA PEREZ, LUIS MIGUEL_111111_EMER.pdf"
        result = self.parser.parse_filename(filename)
        
        assert result.success is True
        assert result.patient_data.document_type == DocumentTypeEnum.EMERGENCY
    
    def test_valid_filename_with_accented_names(self):
        """Test parsing filename with accented names (should be normalized)"""
        filename = "2222222222_HERNÁNDEZ, JOSÉ MARÍA_333333_CONS.pdf"
        result = self.parser.parse_filename(filename)
        
        assert result.success is True
        assert result.patient_data.nombre == "JOSE MARIA"
        assert result.patient_data.apellido_paterno == "HERNANDEZ"
    
    def test_valid_filename_uppercase_extension(self):
        """Test parsing filename with uppercase .PDF extension"""
        filename = "4444444444_RODRIGUEZ, CARMEN_555555_LAB.PDF"
        result = self.parser.parse_filename(filename)
        
        assert result.success is True
        assert result.patient_data.confidence == 0.95  # Alternative pattern
    
    def test_valid_filename_without_numero_adicional(self):
        """Test parsing filename without numero_adicional"""
        filename = "7777777777_MORALES, PEDRO_RX.pdf"
        result = self.parser.parse_filename(filename)
        
        assert result.success is True
        assert result.patient_data.numero_adicional == "0"
        assert result.patient_data.document_type == DocumentTypeEnum.IMAGING
        assert result.patient_data.confidence == 0.95  # Alternative pattern
    
    def test_document_type_mapping(self):
        """Test various document type mappings"""
        test_cases = [
            ("1111111111_TEST, PATIENT_111_CONS.pdf", DocumentTypeEnum.CONSULTATION),
            ("1111111111_TEST, PATIENT_111_EMER.pdf", DocumentTypeEnum.EMERGENCY),
            ("1111111111_TEST, PATIENT_111_URG.pdf", DocumentTypeEnum.EMERGENCY),
            ("1111111111_TEST, PATIENT_111_LAB.pdf", DocumentTypeEnum.LAB_RESULTS),
            ("1111111111_TEST, PATIENT_111_LABO.pdf", DocumentTypeEnum.LAB_RESULTS),
            ("1111111111_TEST, PATIENT_111_IMG.pdf", DocumentTypeEnum.IMAGING),
            ("1111111111_TEST, PATIENT_111_RX.pdf", DocumentTypeEnum.IMAGING),
            ("1111111111_TEST, PATIENT_111_TAC.pdf", DocumentTypeEnum.IMAGING),
            ("1111111111_TEST, PATIENT_111_PRESC.pdf", DocumentTypeEnum.PRESCRIPTION),
            ("1111111111_TEST, PATIENT_111_ALTA.pdf", DocumentTypeEnum.DISCHARGE),
            ("1111111111_TEST, PATIENT_111_CIR.pdf", DocumentTypeEnum.SURGERY),
            ("1111111111_TEST, PATIENT_111_OTROS.pdf", DocumentTypeEnum.OTHER),
            ("1111111111_TEST, PATIENT_111_UNKNOWN.pdf", DocumentTypeEnum.OTHER),
        ]
        
        for filename, expected_type in test_cases:
            result = self.parser.parse_filename(filename)
            assert result.success is True
            assert result.patient_data.document_type == expected_type
    
    def test_invalid_filename_no_extension(self):
        """Test invalid filename without .pdf extension"""
        filename = "3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS"
        result = self.parser.parse_filename(filename)
        
        assert result.success is False
        assert "Ensure filename ends with .pdf" in result.suggestions
    
    def test_invalid_filename_no_underscores(self):
        """Test invalid filename without underscores"""
        filename = "3000003799 GARZA TIJERINA MARIA ESTHER 6001467010 CONS.pdf"
        result = self.parser.parse_filename(filename)
        
        assert result.success is False
        assert "TecSalud filenames should contain underscores" in result.suggestions
    
    def test_invalid_filename_no_comma(self):
        """Test invalid filename without comma in name"""
        filename = "3000003799_GARZA TIJERINA MARIA ESTHER_6001467010_CONS.pdf"
        result = self.parser.parse_filename(filename)
        
        assert result.success is False
        assert "Patient names should be in 'APELLIDOS, NOMBRE' format" in result.suggestions
    
    def test_invalid_filename_too_short(self):
        """Test invalid filename that's too short"""
        filename = "123.pdf"
        result = self.parser.parse_filename(filename)
        
        assert result.success is False
        assert "Filename appears too short for TecSalud format" in result.suggestions
    
    def test_invalid_filename_no_numbers(self):
        """Test invalid filename without numbers"""
        filename = "ABCD_GARCIA, LUIS_EFGH_CONS.pdf"
        result = self.parser.parse_filename(filename)
        
        assert result.success is False
        assert "TecSalud filenames should contain numeric expediente ID" in result.suggestions
    
    def test_batch_parsing(self):
        """Test batch parsing of multiple filenames"""
        filenames = [
            "3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
            "1234567890_LOPEZ, JUAN_123456_LAB.pdf",
            "invalid_filename.pdf",
            "9876543210_MARTINEZ, ANA_987654_IMG.pdf"
        ]
        
        results = self.parser.parse_batch(filenames)
        
        assert len(results) == 4
        assert results[filenames[0]].success is True
        assert results[filenames[1]].success is True
        assert results[filenames[2]].success is False
        assert results[filenames[3]].success is True
    
    def test_statistics_generation(self):
        """Test parsing statistics generation"""
        results = {
            "file1.pdf": ParseResult(
                success=True,
                patient_data=PatientData(
                    expediente_id="123",
                    nombre="Test",
                    apellido_paterno="Patient",
                    apellido_materno="One",
                    full_name="Test Patient One",
                    numero_adicional="456",
                    document_type=DocumentTypeEnum.CONSULTATION,
                    original_filename="file1.pdf",
                    confidence=0.99
                )
            ),
            "file2.pdf": ParseResult(
                success=True,
                patient_data=PatientData(
                    expediente_id="789",
                    nombre="Another",
                    apellido_paterno="Patient",
                    apellido_materno="Two",
                    full_name="Another Patient Two",
                    numero_adicional="101",
                    document_type=DocumentTypeEnum.LAB_RESULTS,
                    original_filename="file2.pdf",
                    confidence=0.95
                )
            ),
            "file3.pdf": ParseResult(
                success=False,
                error_message="Parse error"
            )
        }
        
        stats = self.parser.get_statistics(results)
        
        assert stats['total_files'] == 3
        assert stats['successful_parses'] == 2
        assert stats['failed_parses'] == 1
        assert stats['success_rate'] == 66.66666666666666
        assert stats['average_confidence'] == 0.97
        assert stats['document_type_distribution']['consultation'] == 1
        assert stats['document_type_distribution']['lab_results'] == 1
        assert stats['most_common_document_type'] in ['consultation', 'lab_results']
    
    def test_expediente_id_validation(self):
        """Test expediente ID validation"""
        assert self.parser.validate_expediente_id("1234567890") is True
        assert self.parser.validate_expediente_id("12345678") is True
        assert self.parser.validate_expediente_id("123456789012") is True
        assert self.parser.validate_expediente_id("1234567") is False
        assert self.parser.validate_expediente_id("1234567890123") is False
        assert self.parser.validate_expediente_id("abcd1234567890") is False
        assert self.parser.validate_expediente_id("") is False
    
    def test_patient_name_normalization(self):
        """Test patient name normalization"""
        test_cases = [
            ("JOSÉ MARÍA GARCÍA", "Jose Maria Garcia"),
            ("MARÍA JOSÉ RODRÍGUEZ", "Maria Jose Rodriguez"),
            ("JESÚS ÁNGEL HERNÁNDEZ", "Jesus Angel Hernandez"),
            ("ANDRÉS GONZÁLEZ", "Andres Gonzalez"),
            ("juan carlos lópez", "Juan Carlos Lopez"),
            ("  EXTRA   SPACES  ", "Extra Spaces"),
        ]
        
        for input_name, expected_output in test_cases:
            normalized = self.parser.normalize_patient_name(input_name)
            assert normalized == expected_output


class TestTecSaludFilenameService:
    """Test suite for TecSalud filename service"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.service = TecSaludFilenameService()
    
    @pytest.mark.asyncio
    async def test_async_parse_filename(self):
        """Test async filename parsing"""
        filename = "3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf"
        result = await self.service.parse_filename(filename)
        
        assert result.success is True
        assert result.patient_data.full_name == "MARIA ESTHER GARZA TIJERINA"
    
    @pytest.mark.asyncio
    async def test_async_batch_parsing(self):
        """Test async batch parsing"""
        filenames = [
            "3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf",
            "1234567890_LOPEZ, JUAN_123456_LAB.pdf"
        ]
        
        results = await self.service.parse_batch(filenames)
        
        assert len(results) == 2
        assert all(result.success for result in results.values())
    
    def test_is_tecsalud_filename(self):
        """Test TecSalud filename detection"""
        assert self.service.is_tecsalud_filename("3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf") is True
        assert self.service.is_tecsalud_filename("1234567890_LOPEZ, JUAN_123456_LAB.pdf") is True
        assert self.service.is_tecsalud_filename("12345678_SHORT, NAME_123_CONS.pdf") is True
        assert self.service.is_tecsalud_filename("regular_document.pdf") is False
        assert self.service.is_tecsalud_filename("123_too_short.pdf") is False
        assert self.service.is_tecsalud_filename("not_a_tecsalud_filename.pdf") is False


if __name__ == "__main__":
    """Run tests directly"""
    pytest.main([__file__, "-v"]) 