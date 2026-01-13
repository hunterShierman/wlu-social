import os
import re

# Client folder
root_dir = "./client"

# Regex: find single-quoted strings starting with '${import.meta.env.VITE_API_URL}'
regex = re.compile(r"'(\$\{import\.meta\.env\.VITE_API_URL[^']*)'")

# Walk files
for subdir, dirs, files in os.walk(root_dir):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'dist')]
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
            file_path = os.path.join(subdir, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            new_content = regex.sub(r'`\1`', content)
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"✅ Converted quotes to backticks in: {file_path}")

print("✅ Done converting single quotes to backticks for import.meta.env.VITE_API_URL")
