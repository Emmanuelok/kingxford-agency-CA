# Artwork workflow

The product configurator carries the chosen size, finish, quantity and print faces into the studio. Customers can upload finished artwork directly or choose one of 20 editable layouts. Three business-card layouts include a coordinated back when two-sided printing is chosen.

PDF import accepts up to 25 MB and 100 pages. The customer assigns pages to front and back, sees physical dimensions and fitted placement, and confirms the replacement. Pages become flattened RGB images. Import replaces only the selected faces in a single undoable edit. PDF scripting, links and dynamic forms are not executed. Decoders, fonts and workers are hosted with the app.

PNG, JPEG and WebP originals are preserved. Crop and reframe changes normalized source coordinates, with zoom and position controls and effective print-resolution feedback. Replace image retains the existing layer, placement and rotation while fitting the new source to its frame. Fit and Fill explicitly place the artwork within or across the whole canvas. Undo and redo include the active print face.

The same crop geometry is used by the editor, SVG, PNG, PDF and product previews. PDF proof export creates one 300-DPI RGB raster page per print face at the exact product trim dimensions. It does not create bleed, separations, spot colours or PDF/X output. Formats exceeding the 16-megapixel export limit report an error and offer SVG rather than silently reducing resolution.

Business cards, the classic tee and the poster also have live photographic presentation scenes. These show the current artwork and can be downloaded as PNGs. See `PRINT-PHOTO-SCENES.md` for calibration and asset provenance.

Artwork remains in the current browser workspace and can be included in an estimate review package. Payment capture, supplier fulfilment, shared cloud accounts and hosted AI generation require separate service configuration; this release does not enable them.

## Verification

`npm run test:print` covers crop persistence and geometry, all template/product combinations, photo perspective geometry, PDF page dimensions and independent rasterisation, quote calculations, workspace validation, API boundaries and database security. `npm run build` checks TypeScript and both app builds. `npm run test:smoke` checks deployed asset routes, including the photographic scene files and PDF worker/fonts, plus agency release boundaries.

Browser verification covers selecting PDF faces, atomic undo/redo, download geometry, crop and replacement, live photograph previews and phone/tablet layouts. The generated review fixtures are temporary and excluded from the repository.
