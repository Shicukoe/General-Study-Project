# 📚 Test Cases Complete Documentation Index

## 📂 All Test Files Created

This document serves as the master index for all test-related files created for the DEMATEL Analysis project.

---

## 🎯 Files Overview

### 1. **test_cases.py** (Main Test Suite)
- **Purpose:** 40+ automated unit tests
- **Location:** `backend/test_cases.py`
- **Content:**
  - 5 validation tests
  - 3 normalization tests
  - 2 influence matrix tests
  - 4 prominence/relation tests
  - 3 DANP weight tests
  - 2 end-to-end pipeline tests
  - 3 edge case tests
- **Run:** `pytest test_cases.py -v`

### 2. **TESTING.md** (Comprehensive Testing Guide)
- **Purpose:** Detailed documentation of all tests
- **Location:** `backend/TESTING.md`
- **Sections:**
  - Test coverage overview
  - Setup instructions
  - Running tests (7 different ways)
  - Test categories with examples
  - Mathematical verification
  - Test output examples
  - Troubleshooting guide
  - CI/CD integration

### 3. **MANUAL_TEST_CASES.md** (Frontend Test Scenarios)
- **Purpose:** 10 manual test cases for browser testing
- **Location:** `backend/MANUAL_TEST_CASES.md`
- **Content:**
  - Test Case 1-10 with examples
  - Expected outputs for each
  - Step-by-step testing procedure
  - Verification checklist
  - Batch testing script
  - Debugging guide

### 4. **QUICK_TEST_REFERENCE.md** (Visual Quick Start)
- **Purpose:** Visual reference and quick commands
````markdown
# Tests

This repository keeps tests simple and runnable.

Files

- `test_cases.py` — main unit tests for validation, normalization, total influence, prominence/relation, DANP weights, and end-to-end pipelines.

Run tests

From `backend`:

```powershell
python -m venv venv      # if needed
& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest test_cases.py -q
```

Run a single class or test:

```powershell
pytest test_cases.py::TestEndToEndAnalysis::test_complete_pipeline_8x8 -q
```

Coverage (optional):

```powershell
pytest test_cases.py --cov=app --cov-report=term
```

Notes

- Keep tests focused: `test_cases.py` covers the core functionality.
- Maintain ~1–2 test files per area; add small helper test files only when needed.

````
  - Quick reference commands


