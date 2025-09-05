# Reporting System - Organization Guide

## 📋 Purpose
This directory contains a comprehensive reporting and automation system organized for maximum clarity and maintainability.

## 🏗️ Structure Overview

```
New_Structure/
├── 📜 AppScripts/           # All Google Apps Scripts (organized by system)
├── 🏥 CarePortals/          # CarePortals webhooks, data, templates
├── 🔗 Embeddables/          # Embeddable forms and related tools
├── 📊 GoogleSheets/         # Live Google Sheets with real data & URLs
├── 🗂️ SystemDocumentation/  # Technical documentation and guides
└── 🔧 Tools/               # Utilities and data processors
```

## 🎯 Organization Principles

### 1. **Separation of Concerns**
- **Code**: Pure code files with no documentation mixed in
- **Data**: Raw data, processed data, and templates clearly separated
- **Documentation**: Comprehensive guides and references in dedicated locations

### 2. **System-Based Organization**  
- **CarePortals**: Everything related to the EMR/CRM system
- **Embeddables**: Form-based data collection systems
- **AppScripts**: All Google Apps Script code organized by purpose
- **GoogleSheets**: Live spreadsheets with real data and URL references

### 3. **Easy Navigation**
- Every major folder has an INDEX.md or README.md
- Clear naming conventions throughout
- Master index at root level

## 🔍 Finding What You Need

### Adding New Scripts
- **CarePortals related** → `AppScripts/CarePortals/`
- **Embeddables related** → `AppScripts/Embeddables/`  
- **General purpose** → `AppScripts/General/`
- Update the `AppScripts/INDEX.md` with description and purpose

### Adding New Data Sources
- **CarePortals data** → `CarePortals/Data/`
- **Embeddables data** → `Embeddables/{SystemName}/`
- **Processed data** → Appropriate `/processed/` subfolder

### Adding New Documentation
- **System architecture** → `SystemDocumentation/Architecture/`
- **Reference material** → `SystemDocumentation/Reference/`
- **User guides** → `SystemDocumentation/Guides/`
- **Project-specific docs** → Keep with relevant system folder

### Managing Google Sheets
- **All live sheets** → `GoogleSheets/` directory
- **Update URLs** → `GoogleSheets/INDEX.md`
- **Templates** → Appropriate system's `/Templates/` folder

## 🛠️ Maintenance Guidelines

### Before Adding New Files
1. Determine which system it belongs to
2. Choose appropriate subfolder based on file type (code/data/documentation)
3. Update relevant INDEX.md files
4. Follow established naming conventions

### Regular Maintenance
- Review and update INDEX.md files quarterly
- Archive outdated documentation to `/Archive/` folders
- Clean up temporary/one-time-use files
- Validate all URLs in documentation remain active

## 📚 Key Index Files
- `INDEX.md` (this directory) - Master index of all systems
- `AppScripts/INDEX.md` - All Google Apps Scripts with descriptions
- `GoogleSheets/INDEX.md` - All live sheets with URLs and purposes

---
*This structure is designed to scale and remain organized as the system grows.*