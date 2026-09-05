@echo off
REM Run all tests across TypeScript and Python
echo === Running TypeScript Checks ===
call npx tsc --noEmit
if %errorlevel% neq 0 exit /b %errorlevel%

echo === Running Python Unit Tests ===
call python -m unittest discover -s python/tests
if %errorlevel% neq 0 exit /b %errorlevel%

echo === All Tests Passed Successfully ===
