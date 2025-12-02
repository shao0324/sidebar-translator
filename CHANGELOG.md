# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-12-02

### Added
- **Options:** Users can now select and save a default target language for translations.
- **Side Panel:** The selected translation engine (Google or Gemini) is now saved and automatically restored.

### Changed
- The translation logic now respects the user-defined target language from the options.
- Improved the prompt for Gemini translations by specifying the target language name for better accuracy.

## [1.1.0] - 2025-10-10

* Bug fixed: correct Gemini models name.

## [1.0.0] - 2025-10-09

* 開啟可以將文字翻譯成中文的側邊欄。
* 可以選擇使用「Google 翻譯」和「Gemini」翻譯。
    * 預設使用 Google 翻譯，目前不能修改預設選項。
    * 從擴充功能的「選項」或側邊欄中的「設定」可以進入設定 Gemini API Key。
* 在網頁選取文字後，點擊右鍵可以看到「使用側邊欄翻譯 '選取文字'」選項，點擊後自動開啟側邊欄並翻譯文字。
* 當側邊欄處於開啟狀態，在網頁中選取新的文字後，側邊欄會自動翻譯選取文字。