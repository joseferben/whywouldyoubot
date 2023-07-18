import fs from "fs";
import path from "path";

const directory = "public/assets/emojis";

fs.readdir(directory, (err, files) => {
  if (err) {
    console.error(`Error reading directory: ${err}`);
    return;
  }

  files.forEach((file) => {
    const filePath = path.join(directory, file);

    if (file.endsWith(".png")) {
      // Get file name without extension
      const fileNameWithoutExt = path.parse(file).name;

      const newFileName = `${parseInt(fileNameWithoutExt)}.png`;
      const newFilePath = path.join(directory, newFileName);

      fs.rename(filePath, newFilePath, (err) => {
        if (err) {
          console.error(`Error renaming file: ${err}`);
          return;
        }
        console.log(`${file} -> ${newFileName}`);
      });
    }
  });
});
