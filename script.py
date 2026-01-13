import os
import re

# Root folder to scan
ROOT_DIR = "./server/src"  # adjust this to your TS source root

# Regex to match imports with relative paths
IMPORT_REGEX = re.compile(r'(^\s*import\s.*from\s+[\'"])(\./|\.\./[^\'"]*)([\'"])', re.MULTILINE)

def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    def repl(match):
        prefix, path, suffix = match.groups()
        # Skip if it already ends with .js
        if path.endswith(".js"):
            return match.group(0)
        return f"{prefix}{path}.js{suffix}"

    new_content = IMPORT_REGEX.sub(repl, content)

    if new_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated imports in: {file_path}")

def walk_dir(root_dir):
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".ts") or file.endswith(".js"):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    walk_dir(ROOT_DIR)
    print("Done updating relative imports.")
