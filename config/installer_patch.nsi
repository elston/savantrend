; Savant installation script for NSIS installer builder

;--------------------------------
;Include Modern UI

  !include "MUI2.nsh"

;--------------------------------
;General

  ;Name and file
  Name "Savant installer"
  OutFile "savant_patch.exe"

  ;Default installation folder
  InstallDir "C:\Savant"

  ;Request application privileges for Windows Vista
  RequestExecutionLevel admin

;--------------------------------
;Interface Settings
  !define MUI_ICON "savant\static\logo.ico"
  !define MUI_HEADERIMAGE
  !define MUI_HEADERIMAGE_BITMAP "savant\static\logo.png"
  !define MUI_HEADERIMAGE_RIGHT

  !define MUI_ABORTWARNING

;--------------------------------
;Pages
  !insertmacro MUI_PAGE_COMPONENTS
  !insertmacro MUI_PAGE_DIRECTORY
  !insertmacro MUI_PAGE_INSTFILES
  
  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES
  
;--------------------------------
;Languages
 
  !insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Installer Sections

Section "Savant application"

    SetOutPath "$INSTDIR"
    File /r "savant\*.*"

    SetOutPath "$INSTDIR"
    File /r "deploy_win\python-3.4.4.msi"
    ExecWait "msiexec /i $INSTDIR\python-3.4.4.msi /qb ALLUSERS=1"

    SetOutPath "c:\savant_temp\packages"
    File /r "deploy_win\packages\*.*"
    ExecWait "C:\Python34\Scripts\pip install  --no-index --find-links=file:///savant_temp/packages -r $INSTDIR/savant/savant/requirements/production_win.txt"

    SetOutPath "c:\savant_temp\packages"
    ExecWait "c:\savant_temp\packages\psycopg2-2.6.2.win32-py3.4-pg9.5.3-release.exe"

    WriteUninstaller "$INSTDIR\Uninstall.exe"

SectionEnd

Section "Savant initialization"
    ExecWait "$INSTDIR\config\init.cmd $INSTDIR"
SectionEnd

;Uninstaller Section
Section "Uninstall"
    RMDir "$INSTDIR"
    Delete "$INSTDIR\Uninstall.exe"
SectionEnd