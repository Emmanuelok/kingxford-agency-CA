# Photographic artwork previews

Avalon Print has three original photographic scene bases: business cards on limestone, a white cotton tee flatlay, and a framed poster in an interior. They are available in the studio's Preview view for the matching products. Photo scene, 3D product and Exact flat proof remain separate viewing options. View detail enlarges the scene; Download scene saves the displayed composite as a 1536 × 1024 PNG.

Customer artwork uses the same `renderArtworkCanvas` renderer as the editor's image export. Cropping, text, opacity, rotation and selected front/back artwork therefore flow into each scene. The photograph contains no preprinted logo. A calibrated inverse perspective transform maps the card design onto its photographed surface. Tee and poster placements preserve the artwork's physical aspect ratio. Multiply compositing retains the photographed material texture. Preview and download share the same resulting canvas and do not use WebGL.

These are presentation scenes, not supplier samples, finish simulations or production files. The tee is a generic white garment; fit and placement require a production proof. The poster frame and room are styling and are not included in the product. The flat proof retains exact artwork proportions and colour values for review.

## Asset provenance

The three blank photographs were created with the built-in image generation tool for this project. They were visually inspected at 1536 × 1024, then encoded at WebP quality 94 without resizing. The assets total approximately 910 KB. Sources remain unchanged in the generating workspace. No external stock images, competitor images, model identities or customer marks were used.

| Project asset | Generation prompt specification |
| --- | --- |
| `apps/print/public/images/mockups/cards-limestone.webp` | Photorealistic 3:2 blank white horizontal business-card stack on a warm limestone plinth, high restrained three-quarter camera, all four top corners unobstructed, soft daylight, small forest-green panel at far left; no people, text or graphics. |
| `apps/print/public/images/mockups/tee-cotton.webp` | Photorealistic 3:2 overhead white heavyweight cotton crewneck tee flatlay on taupe concrete, symmetrical shirt fully visible, smooth unobstructed chest, subtle natural fabric texture, daylight from upper left and one leaf at far corner; no person, label, text or graphic. |
| `apps/print/public/images/mockups/poster-gallery.webp` | Photorealistic 3:2 straight-on interior photograph with thin black frame around a blank white portrait poster, unobstructed rectangle, warm plaster wall, soft left daylight, walnut sideboard and ceramic bowl at lower right; no person, glare, text or graphics. |

The calibrated coordinates live in `apps/print/lib/next/photo-scenes.ts`. Replacing an asset requires inspecting and recalibrating its print area. Native image dimensions are validated before compositing to prevent misaligned artwork.
