/**
 * PDF.js 6.3.289 can resolve a render after its worker reports a parse error:
 * _pumpOperatorList publishes lastChunk before rejecting the ready promise.
 * That promise may already be fulfilled, leaving a blank/partial successful
 * proof. Reject/cancel the consumers before marking the stream finished.
 *
 * Keep this patch narrowly pinned. The build must stop when the dependency or
 * upstream fragment changes, so a future upgrade requires explicit review.
 */
export const PDFJS_PATCH_VERSION = '6.3.289';
const upstream = `        if (intentState.operatorList) {
          intentState.operatorList.lastChunk = true;
          for (const internalRenderTask of intentState.renderTasks) {
            internalRenderTask.operatorListChanged();
          }
          this.#tryCleanup();
        }
        if (intentState.displayReadyCapability) {
          intentState.displayReadyCapability.reject(reason);
        } else if (intentState.opListReadCapability) {
          intentState.opListReadCapability.reject(reason);
        } else {
          throw reason;
        }`;
const corrected = `        // Avalon: parser failure must reject, never produce a partial proof.
        intentState.displayReadyCapability?.reject(reason);
        intentState.opListReadCapability?.reject(reason);
        if (intentState.operatorList) {
          intentState.operatorList.lastChunk = true;
          for (const internalRenderTask of [...intentState.renderTasks]) {
            if (typeof internalRenderTask.cancel === "function") {
              internalRenderTask.cancel(reason);
            } else {
              intentState.renderTasks.delete(internalRenderTask);
            }
          }
          this.#tryCleanup();
        }
        if (!intentState.displayReadyCapability && !intentState.opListReadCapability) {
          throw reason;
        }`;

export function patchPdfRenderer(source: string, version: string): string {
  if (version !== PDFJS_PATCH_VERSION) throw new Error(`Review the PDF.js rendering-error patch before upgrading beyond ${PDFJS_PATCH_VERSION}.`);
  if (source.split(upstream).length !== 2) throw new Error('The PDF.js rendering-error patch no longer matches exactly once. Review the renderer before building.');
  return source.replace(upstream, corrected);
}
