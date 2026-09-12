# Print customer workflow benchmark

Reviewed 12 September 2026 through official documentation and Printful's public browser journey. No competitor account was created and no competitor order was placed.

| Benchmark | Observed behaviour | Avalon implementation response |
| --- | --- | --- |
| [Printful Design Maker](https://www.printful.com/design-maker) | Product selection leads to artwork, a reusable product template, and ordering or selling. | Product configuration precedes artwork. Saved designs retain specifications and can feed a multi-item estimate. |
| [Printful hoodie product](https://www.printful.com/custom/mens/hoodies/unisex-heavy-blend-hoodie-gildan-18500) | The public detail page combines a product gallery, technique, colour, size, price, delivery context and file guidelines. | A dedicated product page exposes the options Avalon actually models, supported print areas, quantity breakpoints, itemised pricing and file dimensions. Unmodelled garment variants and live shipping are not represented as selectable stock. |
| [Printify Product Creator](https://printify.com/product-creator/) and [creator guide](https://printify.com/blog/how-to-use-printify-product-creator/) | Product design and preview are connected to product variants and selling workflows. | Independent front/back artwork is supported for six flat formats, with both faces carried through persistence, preflight, proof review and exports. |
| [VistaPrint Canada business cards](https://www.vistaprint.ca/business-cards/standard) | Product specification and artwork entry are presented together, with uploads and template routes. | The configured product can start blank or from an editable template without resetting quantity, finish or print faces. |

## Defects addressed

- Catalogue material search now searches material data.
- Product information is a configuration page instead of a static modal.
- New-project creation retains the selected print specification.
- Adding an item remembers its estimate destination.
- Editing an estimate item can replace that exact stored artwork snapshot without creating a duplicate.
- Draft identity and source estimate revision protect restored editor routes; failed-save retries retain the attached item identity.
- Front/back artwork is validated in local and cloud schemas and at the order/database boundary.
- Readiness includes artwork errors, rather than only customer and price fields.
- A quotation package includes each print face, visual review sheet, text brief and JSON specifications. An explicit email draft provides a manual handoff to Avalon.

## Remaining commercial work

The product catalogue currently contains 11 indicative-price formats and 40 custom-quotation formats. Prices are proposed launch estimates. They are not evidence of a connected supplier, validated inventory or a contractual offer.

Printful/Printify-style automatic commerce still requires selected production partners, confirmed SKUs and variants, provider credentials, a configured print database/auth service, final taxes/shipping and payment setup. Avalon does not label package download, email drafting or local review status as a submitted or paid order. Artwork is RGB SVG with live text; press-ready bleed, outlined fonts, dielines, colour separations and specialist engineering files remain product/provider-specific work.
