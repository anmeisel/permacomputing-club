import fs from "fs";
import path from "path";

/**
 * Copies a directory recursively
 * @param src Source directory path
 * @param dest Destination directory path
 */
export function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dir Directory path
 * @returns True if directory exists or was created, false otherwise
 */
export function ensureDirectoryExists(dir: string): boolean {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return fs.existsSync(dir);
  } catch (err) {
    console.error(`Error creating directory ${dir}:`, err);
    return false;
  }
}

/**
 * Clears all contents of a directory without removing the directory itself
 * @param dir Directory path
 * @param excludes List of file/folder names to exclude from deletion
 */
export function clearDirectory(dir: string, excludes: string[] = []): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  fs.readdirSync(dir).forEach((file) => {
    if (excludes.includes(file)) {
      return;
    }

    const filePath = path.join(dir, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  });
}

/**
 * Writes content to a file, creating any necessary directories
 * @param filePath Path to write the file
 * @param content Content to write
 */
export function writeFileWithDirs(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);
  fs.writeFileSync(filePath, content, "utf8");
}
