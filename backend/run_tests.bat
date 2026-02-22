@echo off
REM Quick test runner for Windows PowerShell
REM Usage: test.bat or run_tests.bat

echo ============================================
echo  DEMATEL Analysis - Test Suite Runner
echo ============================================
echo.

REM Check if venv exists
if not exist "venv\Scripts\activate.bat" (
    echo Error: Virtual environment not found!
    echo Run: python -m venv venv
    pause
    exit /b 1
)

REM Activate venv
call venv\Scripts\activate.bat

echo.
echo ============================================
echo  Running all tests...
echo ============================================
echo.

REM Run pytest
python -m pytest test_cases.py -v --tb=short

echo.
echo ============================================
echo  Test run complete
echo ============================================
pause
