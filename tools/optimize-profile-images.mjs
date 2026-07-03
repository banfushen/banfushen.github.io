import sharp from "sharp";
import { fileURLToPath } from "node:url";

const sourceDir = new URL("../source/profile/", import.meta.url);

const images = [
  { file: "profile.jpg", width: 640, quality: 82 },
  { file: "lrs.jpg", width: 960, quality: 82 },
  { file: "pplrs.png", width: 960, quality: 82 },
  { file: "dbd.jpg", width: 960, quality: 82 },
  { file: "lkgame.jpg", width: 960, quality: 82 },
];

for (const image of images) {
  const input = new URL(image.file, sourceDir);
  const output = new URL(image.file.replace(/\.(jpe?g|png)$/i, ".webp"), sourceDir);

  await sharp(fileURLToPath(input))
    .resize({ width: image.width, withoutEnlargement: true })
    .webp({ quality: image.quality, effort: 5 })
    .toFile(fileURLToPath(output));

  console.log(`Generated ${output.pathname.split("/").pop()}`);
}
