; Savant installation script for NSIS installer builder

;--------------------------------
;Include Modern UI

  !include "MUI2.nsh"
  !include "nsDialogs.nsh"
  !include "InstallOptions.nsh"
  !include "LogicLib.nsh"

  !cd ..\..
  
Function .onInit
  InitPluginsDir
  File /oname=$PLUGINSDIR\SelectPort.ini savant\config\SelectPort.ini
  !insertmacro INSTALLOPTIONS_EXTRACT_AS "savant\config\SelectPort.ini" "SelectPort.ini"
FunctionEnd
;--------------------------------
;General

  ;Name and file
  Name "Savant full stack installer"
  OutFile "savant_full.exe"
  
  Var ApachePort

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

ReserveFile "savant\config\SelectPort.ini"
;--------------------------------
;Pages
  !insertmacro MUI_PAGE_COMPONENTS
  !insertmacro MUI_PAGE_DIRECTORY
  Page custom nsDialogsPage mypageleave
  !insertmacro MUI_PAGE_INSTFILES
  
  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES
  
  
; !insertmacro MUI_INSTALLOPTIONS_READ $VAR "ioFile.ini" "Field #" "Name"
Function nsDialogsPage
    !insertmacro MUI_HEADER_TEXT "Select Port" "Select Port"
    !insertmacro INSTALLOPTIONS_DISPLAY "SelectPort.ini"
    !insertmacro INSTALLOPTIONS_READ $ApachePort "SelectPort.ini" "Field 2" "State"
FunctionEnd
Function mypageleave
    # MessageBox mb_ok $ApachePort
    # Abort ;Don't move to next page (If the input was invalid etc)
FunctionEnd

;--------------------------------
;Languages
 
  !insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Installer Sections

Section "Savant application"

    # MessageBox mb_ok $ApachePort

    SetOutPath "$INSTDIR"
    File /r /x ".git" "savant\*.*"

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

Section "Database"
    SetOutPath "$INSTDIR"
    File "deploy_win\postgresql-9.4.8-1-windows.exe"
    ExecWait "$INSTDIR\postgresql-9.4.8-1-windows.exe --mode unattended  --disable-stackbuilder 1"
    SetOutPath "c:\Program Files (x86)\PostgreSQL\9.4\data\"
    File "savant\config\postgres\pg_hba.conf"
    ExecWait "$INSTDIR\config\postgres\db_init.cmd $INSTDIR"
    Delete "$INSTDIR\postgresql-9.4.8-1-windows.exe"
SectionEnd

Section "Broker service"
    SetOutPath "$INSTDIR"
    File "deploy_win\redis-2.4.6-setup-32-bit.exe"
    ExecWait "$INSTDIR\redis-2.4.6-setup-32-bit.exe /silent"
    ExecWait "sc start redis"
    Delete "$INSTDIR\redis-2.4.6-setup-32-bit.exe"
SectionEnd

Section "PDFTools"
    SetOutPath "$INSTDIR"
    File "deploy_win\wkhtmltox-0.12.3.2_msvc2013-win32.exe"
    ExecWait "$INSTDIR\wkhtmltox-0.12.3.2_msvc2013-win32.exe"
    Delete "$INSTDIR\wkhtmltox-0.12.3.2_msvc2013-win32.exe"
SectionEnd

Section "Web server"
    SetOutPath "c:\savant_temp"
    File "deploy_win\vc_redist.x86.exe"
    ExecWait "C:\savant_temp\vc_redist.x86.exe /install /passive"
    SetOutPath "c:\Apache24"
    ExecWait "sc stop Apache2.4"
    ExecWait "sc delete Apache2.4"
    File /r "deploy_win\Apache24\*.*"
    File /oname=c:\Apache24\conf\httpd.conf "savant\config\apache\httpd.conf"
    ExecWait "cscript $INSTDIR\config\customize.vbs c:\Apache24\conf\httpd.conf **INSTALLDIR** $\"$INSTDIR$\""
    ExecWait "cscript $INSTDIR\config\customize.vbs c:\Apache24\conf\httpd.conf **PORT** $ApachePort"
    ExecWait "c:\Apache24\bin\httpd.exe -k install"
    ExecWait "sc start Apache2.4"
SectionEnd

Section "Savant initialization"
    ExecWait "$INSTDIR\config\init.cmd $INSTDIR"
SectionEnd

;Uninstaller Section
Section "Uninstall"
    RMDir /r "$INSTDIR"
    Delete "$INSTDIR\Uninstall.exe"
    ExecWait "schtasks /Delete /F /TN savant_scheduler"
    ExecWait "schtasks /Delete /F /TN savant_celery"
    ExecWait "schtasks /Delete /F /TN savant_celerybeat"
SectionEnd