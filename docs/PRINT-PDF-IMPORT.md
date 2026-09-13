# PDF artwork import and export

Customers can select pages from a PDF for front and/or back artwork. The importer shows page dimensions and placement, fits the complete page within the product trim area, and preserves its proportions. The studio replaces only the selected faces as one undoable operation after checking that the destination artwork has not changed.

Imported pages become raster image layers. Original PDF text, vectors, spot colours, trim/bleed boxes and interactive forms are not retained. Export produces one RGB raster PDF page per print face, front then back, at the exact product dimensions and 300 DPI. This is not PDF/X, CMYK, a supplier dieline or production approval. Oversized exports are rejected, never silently downsampled.

## Resource handling

- PDF input: 25 MB and 100 pages maximum; file header checked in addition to MIME/extension.
- Preview: eight pages per browser panel, with two 360-pixel thumbnails rendering at a time.
- Import: selected pages render sequentially at up to 300 PPI at their placed size, capped at 16 megapixels and 8,192 pixels per edge. The page picker shows actual PPI before applying the import and flags reductions or margins.
- Embedded images over 60 megapixels cause rejection. Converted images must fit the existing 12 MB artwork asset limit and 17-million-character source limit.
- PDF export: 16 megapixels per face at 300 DPI, preserving the exact physical trim dimensions.
- Opening/rendering has a 30-second limit. Closing the dialog aborts work and destroys its worker. Canvas buffers are released after each render.

The PDF.js display module and pdf-lib are lazy chunks. Vite copies the pinned worker, CMaps, standard fonts, ICC profile and image decoders to `/print-app/pdfjs/` after creating its output. The worker URL includes the renderer version. No PDF URL, viewer link layer, form-script sandbox or XFA renderer is activated; the input is local binary data. The unused QuickJS form-scripting assets are excluded.

## Pinned rendering-error workaround

Dependencies are `pdfjs-dist@6.3.289` and `pdf-lib@1.17.1`. During implementation, a targeted malformed-PDF test reproduced an error in the PDF.js 6.3.289 display module: `_pumpOperatorList` can publish `lastChunk` and notify render tasks before rejecting the readiness promise. If that promise already resolved, a worker parse error can become an apparently successful empty or partial proof.

`apps/print/lib/build/pdfjs-renderer-patch.ts` changes only this error branch. It rejects the pending operator-list promise and cancels render tasks with the worker's error before signalling completion. Vite applies the transform to the pinned dependency when building; it does not modify installed package files. A mismatched dependency version or a source fragment that does not match exactly once stops the build. Review and remove/revise this workaround when upgrading PDF.js.

The PDF test suite creates an actual oversized embedded-image PDF and loads the transformed renderer from a generated module. Both operator-list retrieval and rendering must reject it. Other tests independently render exported PDFs with Mozilla's renderer to confirm front/back order and colours, verify exact physical and trim dimensions, and check invalid inputs, selection boundaries, placement geometry, output resolution and incomplete artwork rejection.

Official API references: [PDF.js document/loading/rendering API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html) and [pdf-lib PDFDocument API](https://pdf-lib.js.org/docs/api/classes/pdfdocument).
