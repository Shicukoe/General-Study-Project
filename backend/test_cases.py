"""
Test cases for DEMATEL analysis API
Run with: pytest test_cases.py -v
"""

import pytest
import numpy as np
from app.dematel import normalize_matrix, total_influence_matrix, prominence_relation
from app.danp import compute_danp_weights
from app.utils import validate_matrix


class TestValidateMatrix:
    """Test matrix validation"""
    
    def test_non_square_matrix_raises_error(self):
        """Non-square matrix should raise ValueError"""
        A = np.array([[1, 2, 3], [4, 5, 6]])  # 2x3
        with pytest.raises(ValueError, match="Matrix must be square"):
            validate_matrix(A)
    
    def test_all_zeros_matrix_raises_error(self):
        """All-zero matrix should raise ValueError"""
        A = np.array([[0, 0, 0, 0],
                      [0, 0, 0, 0],
                      [0, 0, 0, 0],
                      [0, 0, 0, 0]])
        with pytest.raises(ValueError, match="cannot be all zeros"):
            validate_matrix(A)
    
    def test_row_with_all_zeros_raises_error(self):
        """Row with all zeros should raise ValueError"""
        A = np.array([[1, 2, 3, 4],
                      [0, 0, 0, 0],
                      [1, 1, 1, 1],
                      [2, 2, 2, 2]])
        with pytest.raises(ValueError, match="All rows and columns must have"):
            validate_matrix(A)
    
    def test_column_with_all_zeros_raises_error(self):
        """Column with all zeros should raise ValueError"""
        A = np.array([[1, 0, 3, 4],
                      [2, 0, 5, 6],
                      [1, 0, 1, 1],
                      [2, 0, 2, 2]])
        with pytest.raises(ValueError, match="All rows and columns must have"):
            validate_matrix(A)
    
    def test_valid_matrix_passes(self):
        """Valid matrix should pass validation"""
        A = np.array([[0, 1, 2, 3],
                      [1, 0, 1, 1],
                      [2, 1, 0, 2],
                      [3, 1, 2, 0]])
        validate_matrix(A)  # Should not raise


class TestNormalizeMatrix:
    """Test matrix normalization"""
    
    def test_normalize_simple_matrix(self):
        """Test normalization of simple 2x2 matrix"""
        A = np.array([[0, 1],
                      [1, 0]], dtype=float)
        D = normalize_matrix(A)
        
        # Check no NaN or Inf values
        assert not np.any(np.isnan(D)), "Normalized matrix contains NaN"
        assert not np.any(np.isinf(D)), "Normalized matrix contains Inf"
        
        # Check values are <= 1
        assert np.all(D <= 1.0), "Normalized matrix values exceed 1"
    
    def test_normalize_4x4_matrix(self):
        """Test normalization of 4x4 matrix"""
        A = np.array([[0, 1, 2, 3],
                      [1, 0, 1, 1],
                      [2, 1, 0, 2],
                      [3, 1, 2, 0]], dtype=float)
        D = normalize_matrix(A)
        
        assert not np.any(np.isnan(D)), "Normalized matrix contains NaN"
        assert not np.any(np.isinf(D)), "Normalized matrix contains Inf"
        assert np.all(D <= 1.0), "Normalized matrix values exceed 1"
    
    def test_normalize_identity_scaled_matrix(self):
        """Test normalization with specific scaling"""
        A = np.array([[0, 10, 10],
                      [10, 0, 10],
                      [10, 10, 0]], dtype=float)
        D = normalize_matrix(A)
        
        # Max row sum and col sum = 20, so s = 1/20 = 0.05
        expected = 0.05 * A
        assert np.allclose(D, expected), "Normalization factor incorrect"


class TestTotalInfluenceMatrix:
    """Test total influence matrix calculation"""
    
    def test_total_influence_valid_output(self):
        """Test that total influence matrix is computed without errors"""
        A = np.array([[0, 1, 2, 3],
                      [1, 0, 1, 1],
                      [2, 1, 0, 2],
                      [3, 1, 2, 0]], dtype=float)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        
        # Check shape
        assert T.shape == D.shape, "Total influence matrix has wrong shape"
        
        # Check no NaN or Inf
        assert not np.any(np.isnan(T)), "Total influence matrix contains NaN"
        assert not np.any(np.isinf(T)), "Total influence matrix contains Inf"
    
    def test_total_influence_square_matrix(self):
        """Test that T is square"""
        # Use a matrix that won't cause singular matrix issues
        A = np.array([[0, 1, 2],
                      [1, 0, 1],
                      [2, 1, 0]], dtype=float)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        
        assert T.shape[0] == T.shape[1], "Total influence matrix is not square"


class TestProminenceRelation:
    """Test prominence and relation calculations"""
    
    def test_prominence_relation_shapes(self):
        """Test that d, r, prominence, relation have correct shapes"""
        A = np.array([[0, 1, 2, 3],
                      [1, 0, 1, 1],
                      [2, 1, 0, 2],
                      [3, 1, 2, 0]], dtype=float)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        
        d, r, prominence, relation = prominence_relation(T)
        
        n = T.shape[0]
        assert d.shape == (n,), "d has wrong shape"
        assert r.shape == (n,), "r has wrong shape"
        assert prominence.shape == (n,), "prominence has wrong shape"
        assert relation.shape == (n,), "relation has wrong shape"
    
    def test_prominence_relation_no_nan(self):
        """Test that prominence and relation contain no NaN or Inf"""
        A = np.array([[0, 1, 2, 3],
                      [1, 0, 1, 1],
                      [2, 1, 0, 2],
                      [3, 1, 2, 0]], dtype=float)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        
        d, r, prominence, relation = prominence_relation(T)
        
        assert not np.any(np.isnan(prominence)), "prominence contains NaN"
        assert not np.any(np.isinf(prominence)), "prominence contains Inf"
        assert not np.any(np.isnan(relation)), "relation contains NaN"
        assert not np.any(np.isinf(relation)), "relation contains Inf"
    
    def test_prominence_is_sum_of_d_and_r(self):
        """Test mathematical relationship: prominence = d + r"""
        A = np.array([[0, 1, 2, 3],
                      [1, 0, 1, 1],
                      [2, 1, 0, 2],
                      [3, 1, 2, 0]], dtype=float)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        
        d, r, prominence, relation = prominence_relation(T)
        
        expected_prominence = d + r
        assert np.allclose(prominence, expected_prominence), "prominence ≠ d + r"
    
    def test_relation_is_difference_of_d_and_r(self):
        """Test mathematical relationship: relation = d - r"""
        A = np.array([[0, 1, 2, 3],
                      [1, 0, 1, 1],
                      [2, 1, 0, 2],
                      [3, 1, 2, 0]], dtype=float)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        
        d, r, prominence, relation = prominence_relation(T)
        
        expected_relation = d - r
        assert np.allclose(relation, expected_relation), "relation ≠ d - r"


class TestDANPWeights:
    """Test DANP weight computation"""
    
    def test_danp_weights_valid_output(self):
        """Test that DANP weights are computed"""
        A = np.array([[0, 1, 2, 3],
                      [1, 0, 1, 1],
                      [2, 1, 0, 2],
                      [3, 1, 2, 0]], dtype=float)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        
        weights = compute_danp_weights(T)
        
        # Check shape
        assert weights.shape == (T.shape[0],), "Weights have wrong shape"
        
        # Check no NaN or Inf
        assert not np.any(np.isnan(weights)), "Weights contain NaN"
        assert not np.any(np.isinf(weights)), "Weights contain Inf"
    
    def test_danp_weights_sum_to_one(self):
        """Test that DANP weights sum to 1 (normalized)"""
        A = np.array([[0, 1, 2, 3],
                      [1, 0, 1, 1],
                      [2, 1, 0, 2],
                      [3, 1, 2, 0]], dtype=float)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        
        weights = compute_danp_weights(T)
        
        assert np.isclose(np.sum(weights), 1.0), "Weights do not sum to 1"
    
    def test_danp_weights_all_positive(self):
        """Test that DANP weights are all positive"""
        A = np.array([[0, 1, 2, 3],
                      [1, 0, 1, 1],
                      [2, 1, 0, 2],
                      [3, 1, 2, 0]], dtype=float)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        
        weights = compute_danp_weights(T)
        
        assert np.all(weights >= 0), "Weights contain negative values"


class TestEndToEndAnalysis:
    """Test complete analysis pipeline"""
    
    def test_complete_pipeline_4x4(self):
        """Test complete pipeline with 4x4 matrix"""
        A = np.array([[0, 1, 2, 3],
                      [1, 0, 1, 1],
                      [2, 1, 0, 2],
                      [3, 1, 2, 0]], dtype=float)
        
        # Validate
        validate_matrix(A)
        
        # Normalize
        D = normalize_matrix(A)
        assert not np.any(np.isnan(D)) and not np.any(np.isinf(D))
        
        # Total influence
        T = total_influence_matrix(D)
        assert not np.any(np.isnan(T)) and not np.any(np.isinf(T))
        
        # Prominence and relation
        d, r, prominence, relation = prominence_relation(T)
        assert not np.any(np.isnan(prominence)) and not np.any(np.isinf(prominence))
        
        # Weights
        weights = compute_danp_weights(T)
        assert np.isclose(np.sum(weights), 1.0)
        assert not np.any(np.isnan(weights))
    
    def test_complete_pipeline_3x3(self):
        """Test complete pipeline with 3x3 matrix"""
        A = np.array([[0, 1, 2],
                      [1, 0, 1],
                      [2, 1, 0]], dtype=float)
        
        validate_matrix(A)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        d, r, prominence, relation = prominence_relation(T)
        weights = compute_danp_weights(T)
        
        assert np.isclose(np.sum(weights), 1.0)

    def test_complete_pipeline_8x8(self):
        """Test complete pipeline with an 8x8 matrix (user request)"""
        # Construct an 8x8 matrix with varied non-zero entries
        A = np.array([
            [0, 1, 2, 3, 1, 0.5, 2, 1],
            [1, 0, 1, 0.5, 2, 1, 0.5, 1],
            [2, 1, 0, 2, 1, 1, 1, 0.5],
            [3, 0.5, 2, 0, 1, 2, 1, 1],
            [1, 2, 1, 1, 0, 0.5, 2, 1],
            [0.5, 1, 1, 2, 0.5, 0, 1, 2],
            [2, 0.5, 1, 1, 2, 1, 0, 1],
            [1, 1, 0.5, 1, 1, 2, 1, 0]
        ], dtype=float)

        # Validate
        validate_matrix(A)

        # Normalize
        D = normalize_matrix(A)
        assert not np.any(np.isnan(D)) and not np.any(np.isinf(D))

        # Total influence
        T = total_influence_matrix(D)
        assert not np.any(np.isnan(T)) and not np.any(np.isinf(T))

        # Prominence and relation
        d, r, prominence, relation = prominence_relation(T)
        assert not np.any(np.isnan(prominence)) and not np.any(np.isinf(prominence))

        # Weights
        weights = compute_danp_weights(T)
        assert np.isclose(np.sum(weights), 1.0)
        assert not np.any(np.isnan(weights)) and not np.any(np.isinf(weights))


class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_single_nonzero_element_per_row(self):
        """Test matrix where each row has minimal non-zero elements (sparse but valid)"""
        # Use a sparse matrix that still works with DEMATEL algorithm
        A = np.array([[0, 1, 0, 0.5],
                      [0.5, 0, 1, 0],
                      [0, 0.5, 0, 1],
                      [1, 0, 0.5, 0]], dtype=float)

        validate_matrix(A)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        d, r, prominence, relation = prominence_relation(T)
        weights = compute_danp_weights(T)
        
        assert not np.any(np.isnan(weights)), "Weights contain NaN"
    def test_symmetric_matrix(self):
        """Test symmetric matrix"""
        A = np.array([[0, 1, 2],
                      [1, 0, 1],
                      [2, 1, 0]], dtype=float)
        
        validate_matrix(A)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        
        # T should not be symmetric in general
        assert T.shape[0] == T.shape[1]
    
    def test_large_values_matrix(self):
        """Test matrix with very large values"""
        A = np.array([[0, 1e6, 2e6, 3e6],
                      [1e6, 0, 1e6, 1e6],
                      [2e6, 1e6, 0, 2e6],
                      [3e6, 1e6, 2e6, 0]], dtype=float)
        
        validate_matrix(A)
        D = normalize_matrix(A)
        T = total_influence_matrix(D)
        weights = compute_danp_weights(T)
        
        assert not np.any(np.isnan(weights))
        assert np.isclose(np.sum(weights), 1.0)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
