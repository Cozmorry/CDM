# Changelog

All notable changes to Cozy Download Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-27

### Added
- Initial release of Cozy Download Manager
- Multi-segment download support (up to 16 segments)
- Priority-based queue management system
- Download persistence and resume capability
- Download history tracking
- Drag & drop URL support
- Clipboard auto-detection for URLs
- Two-step download process with file info preview
- Duplicate download detection with skip/replace options
- Real-time progress tracking with speed and ETA
- Settings panel with comprehensive options
- Tabbed interface (Active/Queue, Completed, History)
- Auto-switch to completed tab when all downloads finish
- Modern UI with indigo/purple accent theme
- React Icons integration
- Compact window mode by default
- Status bar with download statistics
- File management (open/show in folder)
- Bandwidth limiting
- Smart retry logic with configurable attempts
- SSL certificate handling for testing
- Keyboard shortcuts (Ctrl+V to paste URLs)

### Changed
- Improved download engine performance
- Enhanced UI/UX with modern design
- Better error handling and recovery
- Optimized memory usage with streaming writes
- Improved modal responsiveness

### Fixed
- IPC serialization errors
- Duplicate download detection issues
- Modal overflow problems
- Drag-drop zone visibility
- URL truncation in download items
- SSL certificate validation for testing environments

### Security
- Context isolation enabled
- Secure IPC communication
- No node integration in renderer process

---

## Future Releases

### Planned Features
- Download scheduling
- Browser extension integration
- Download categories/tags
- Advanced filtering and search
- Export/import download lists
- Custom themes
- Dark/light mode toggle

